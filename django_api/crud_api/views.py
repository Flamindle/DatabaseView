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


@method_decorator(csrf_exempt, name='dispatch')
class TableRecordsView(View):
    """
    处理表的记录操作
    POST: 新增记录
    GET: 获取表结构
    """

    def post(self, request, table_name):
        """新增记录"""
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

            # 验证字段名
            for field in record_data.keys():
                if not validate_field_name(field):
                    return error_response(f'无效的字段名: {field}')

            # 构建 INSERT 语句
            fields = ', '.join([f'`{f}`' for f in record_data.keys()])
            placeholders = ', '.join(['%s'] * len(record_data))
            sql = f"INSERT INTO `{table_name}` ({fields}) VALUES ({placeholders})"

            rowcount, insert_id = execute_write(conn, sql, list(record_data.values()))

            # 获取刚插入的记录
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", (insert_id,))
            columns = [col[0] for col in cursor.description]
            row = cursor.fetchone()
            cursor.close()
            record = dict(zip(columns, row)) if row else {}

            conn.close()
            return success_response('记录创建成功', record)

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'创建记录失败: {str(e)}')
        finally:
            if conn:
                conn.close()

    def get(self, request, table_name):
        """获取表结构和示例数据"""
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

            # 获取前几条记录作为示例
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
    """
    处理单条记录的操作
    PUT: 更新记录
    DELETE: 删除记录
    GET: 获取单条记录
    """

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

            # 验证字段名
            for field in record_data.keys():
                if not validate_field_name(field):
                    return error_response(f'无效的字段名: {field}')

            # 构建 UPDATE 语句
            set_clause = ', '.join([f"`{k}` = %s" for k in record_data.keys()])
            sql = f"UPDATE `{table_name}` SET {set_clause} WHERE id = %s"
            params = list(record_data.values()) + [record_id]

            rowcount, _ = execute_write(conn, sql, params)

            if rowcount == 0:
                return error_response('记录不存在或未做任何修改', status=404)

            # 获取更新后的记录
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
        print(f"[DELETE] 表名: {table_name}, 记录ID: {record_id}")

        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_config = get_db_config(request)
        if not db_config['database']:
            return error_response('请先连接数据库')

        print(f"[DELETE] 数据库配置: {db_config}")

        try:
            conn = get_db_connection(db_config)
            print("[DELETE] 数据库连接成功")
        except mysql.connector.Error as e:
            print(f"[DELETE] 数据库连接失败: {e}")
            return error_response(f'数据库连接失败: {str(e)}')

        try:
            # 先检查记录是否存在 - 支持多种主键名
            cursor = conn.cursor()

            # 尝试不同的主键名
            for pk_name in ['id', 'ID', 'Id', 'Id_', 'id_']:
                check_sql = f"SELECT * FROM `{table_name}` WHERE `{pk_name}` = %s LIMIT 1"
                cursor.execute(check_sql, (record_id,))
                if cursor.fetchone():
                    print(f"[DELETE] 找到记录，主键: {pk_name}")
                    break

            # 执行删除 - 尝试用 id
            delete_sql = f"DELETE FROM `{table_name}` WHERE id = %s"
            cursor.execute(delete_sql, (record_id,))
            conn.commit()
            deleted = cursor.rowcount
            cursor.close()
            conn.close()

            print(f"[DELETE] 删除了 {deleted} 条记录")
            return success_response(f'记录删除成功（{deleted}条）')

        except Exception as e:
            print(f"[DELETE] 删除失败: {e}")
            return error_response(f'删除记录失败: {str(e)}')
        finally:
            if conn and conn.is_connected():
                conn.close()


@method_decorator(csrf_exempt, name='dispatch')
class BatchDeleteView(View):
    """批量删除"""

    def post(self, request, table_name):
        """批量删除记录"""
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

            # 构建批量删除 SQL
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
