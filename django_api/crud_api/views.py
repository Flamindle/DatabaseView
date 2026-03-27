"""
CRUD API 视图
实现数据库记录的增删改操作
"""
import json
import mysql.connector
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from django.contrib.auth.hashers import check_password

from .utils import (
    validate_table_name,
    validate_field_name,
    get_db_connection,
    execute_query,
    execute_write,
    get_table_schema,
    success_response,
    error_response,
)


def get_db_config(request):
    """从请求头获取数据库连接配置"""
    return {
        'database': request.headers.get('X-Database-Name', ''),
        'host': request.headers.get('X-DB-Host', 'localhost'),
        'port': request.headers.get('X-DB-Port', '3306'),
        'user': request.headers.get('X-DB-User', 'root'),
        'password': request.headers.get('X-DB-Password', ''),
    }


def check_auth(request):
    """检查用户是否已登录"""
    user = request.session.get('auth_user')
    if user:
        return True, user.get('username')
    return False, None


# ============================================================
# 认证接口
# ============================================================

@csrf_exempt
def auth_login(request):
    """用户登录"""
    if request.method != 'POST':
        return error_response('仅支持 POST 方法', status=405)

    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return error_response('用户名和密码不能为空')

        # 从请求头获取数据库配置
        db_config = get_db_config(request)

        if not db_config['database']:
            return error_response('请先连接数据库')

        # 直接连接 MySQL 的 auth_user 表验证
        try:
            conn = mysql.connector.connect(
                host=db_config['host'],
                port=int(db_config['port']),
                user=db_config['user'],
                password=db_config['password'],
                database=db_config['database'],
                charset='utf8mb4'
            )
        except mysql.connector.Error as e:
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(
                "SELECT id, username, password, is_active, is_staff FROM auth_user WHERE username = %s",
                (username,)
            )
            user_row = cursor.fetchone()
            cursor.close()
            conn.close()

            if not user_row:
                return error_response('用户名或密码错误', status=401)

            if not user_row['is_active']:
                return error_response('账户已被禁用', status=403)

            # 验证密码
            if not check_password(password, user_row['password']):
                return error_response('用户名或密码错误', status=401)

            # 登录成功，保存到 session
            login(request, user_row['username'], user_row['is_staff'])
            return success_response('登录成功', {
                'username': user_row['username'],
                'is_staff': bool(user_row['is_staff']),
                'is_authenticated': True
            })

        except mysql.connector.Error as e:
            return error_response(f'认证失败: {str(e)}')

    except json.JSONDecodeError:
        return error_response('无效的 JSON 格式')
    except Exception as e:
        return error_response(f'登录失败: {str(e)}')


def login(request, username, is_staff):
    """手动保存登录状态到 session"""
    request.session['auth_user'] = {
        'username': username,
        'is_staff': is_staff,
    }
    request.session.modified = True


@csrf_exempt
def auth_logout(request):
    """用户登出"""
    if request.method != 'POST':
        return error_response('仅支持 POST 方法', status=405)

    request.session.flush()
    return success_response('已退出登录')


@csrf_exempt
def auth_status(request):
    """获取当前登录状态"""
    is_auth, username = check_auth(request)
    if is_auth:
        user_data = request.session.get('auth_user', {})
        return success_response('已登录', {
            'username': username,
            'is_staff': user_data.get('is_staff', False),
            'is_authenticated': True
        })
    else:
        return success_response('未登录', {
            'is_authenticated': False
        })


def get_csrf_token(request):
    """获取 CSRF Token"""
    token = get_token(request)
    return JsonResponse({'csrfToken': token})


# ============================================================
# CRUD 接口
# ============================================================

@method_decorator(csrf_exempt, name='dispatch')
class TableRecordsView(View):
    """表的记录操作"""

    def post(self, request, table_name):
        """新增记录"""
        is_auth, _ = check_auth(request)
        if not is_auth:
            return error_response('请先登录', status=401)

        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        try:
            conn = get_db_connection(db_config)
        except mysql.connector.Error as e:
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            data = json.loads(request.body)
            record_data = data.get('data', {})

            if not record_data:
                return error_response('请提供要插入的数据')

            for field in record_data.keys():
                if not validate_field_name(field):
                    return error_response(f'无效的字段名: {field}')

            fields = ', '.join([f'`{f}`' for f in record_data.keys()])
            placeholders = ', '.join(['%s'] * len(record_data))
            sql = f"INSERT INTO `{table_name}` ({fields}) VALUES ({placeholders})"

            rowcount, insert_id = execute_write(conn, sql, list(record_data.values()))

            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", (insert_id,))
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            cursor.close()
            conn.close()
            record = dict(zip(columns, row)) if row else {}

            return success_response('记录创建成功', record)

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'创建记录失败: {str(e)}')
        finally:
            if conn:
                conn.close()

    def get(self, request, table_name):
        """获取表结构"""
        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        try:
            conn = get_db_connection(db_config)
        except mysql.connector.Error as e:
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            schema = get_table_schema(conn, table_name)
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 5")
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                rows = cursor.fetchall()
                sample_data = [dict(zip(columns, row)) for row in rows]
            else:
                sample_data = []
            cursor.close()
            conn.close()

            return success_response('表结构获取成功', {
                'schema': schema,
                'sample_data': sample_data
            })

        except Exception as e:
            return error_response(f'获取表结构失败: {str(e)}')
        finally:
            if conn:
                conn.close()


@method_decorator(csrf_exempt, name='dispatch')
class RecordDetailView(View):
    """单条记录操作"""

    def get(self, request, table_name, record_id):
        """获取单条记录"""
        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        try:
            conn = get_db_connection(db_config)
        except mysql.connector.Error as e:
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", (record_id,))
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            cursor.close()
            conn.close()

            if not row:
                return error_response('记录不存在', status=404)

            record = dict(zip(columns, row))
            return success_response('记录获取成功', record)

        except Exception as e:
            return error_response(f'获取记录失败: {str(e)}')
        finally:
            if conn:
                conn.close()

    def put(self, request, table_name, record_id):
        """更新记录"""
        is_auth, _ = check_auth(request)
        if not is_auth:
            return error_response('请先登录', status=401)

        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        try:
            conn = get_db_connection(db_config)
        except mysql.connector.Error as e:
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            data = json.loads(request.body)
            record_data = data.get('data', {})

            if not record_data:
                return error_response('请提供要更新的数据')

            for field in record_data.keys():
                if not validate_field_name(field):
                    return error_response(f'无效的字段名: {field}')

            set_clause = ', '.join([f"`{k}` = %s" for k in record_data.keys()])
            sql = f"UPDATE `{table_name}` SET {set_clause} WHERE id = %s"
            params = list(record_data.values()) + [record_id]

            rowcount, _ = execute_write(conn, sql, params)

            if rowcount == 0:
                return error_response('记录不存在或未做任何修改', status=404)

            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", (record_id,))
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            cursor.close()
            conn.close()
            record = dict(zip(columns, row)) if row else {}

            return success_response('记录更新成功', record)

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'更新记录失败: {str(e)}')
        finally:
            if conn:
                conn.close()

    def delete(self, request, table_name, record_id):
        """删除记录"""
        print(f"[DELETE] 表名: {table_name}, 记录ID: {record_id}, 类型: {type(record_id)}")

        is_auth, _ = check_auth(request)
        if not is_auth:
            return error_response('请先登录', status=401)

        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        try:
            conn = get_db_connection(db_config)
            print(f"[DELETE] 数据库连接成功")
        except mysql.connector.Error as e:
            print(f"[DELETE] 数据库连接失败: {e}")
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            cursor = conn.cursor()
            delete_sql = f"DELETE FROM `{table_name}` WHERE id = %s"
            print(f"[DELETE] 执行SQL: {delete_sql}, 参数: {record_id}")
            cursor.execute(delete_sql, (record_id,))
            conn.commit()
            deleted = cursor.rowcount
            print(f"[DELETE] 影响的行数: {deleted}")
            cursor.close()
            conn.close()

            if deleted == 0:
                return error_response('记录不存在或已被删除', status=404)

            return success_response(f'记录删除成功（{deleted}条）')

        except Exception as e:
            print(f"[DELETE] 删除异常: {e}")
            return error_response(f'删除记录失败: {str(e)}')
        finally:
            if conn and hasattr(conn, 'is_connected') and conn.is_connected():
                conn.close()


@method_decorator(csrf_exempt, name='dispatch')
class BatchDeleteView(View):
    """批量删除"""

    def post(self, request, table_name):
        """批量删除记录"""
        is_auth, _ = check_auth(request)
        if not is_auth:
            return error_response('请先登录', status=401)

        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        try:
            conn = get_db_connection(db_config)
        except mysql.connector.Error as e:
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            data = json.loads(request.body)
            ids = data.get('ids', [])

            if not ids:
                return error_response('请提供要删除的记录 ID')

            if not isinstance(ids, list):
                return error_response('ids 必须是数组')

            placeholders = ', '.join(['%s'] * len(ids))
            sql = f"DELETE FROM `{table_name}` WHERE id IN ({placeholders})"

            cursor = conn.cursor()
            cursor.execute(sql, ids)
            conn.commit()
            deleted_count = cursor.rowcount
            cursor.close()
            conn.close()

            return success_response(f'成功删除 {deleted_count} 条记录', {'deleted': deleted_count})

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'批量删除失败: {str(e)}')
        finally:
            if conn:
                conn.close()
