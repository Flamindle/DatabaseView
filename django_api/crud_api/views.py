"""
CRUD API 视图
实现数据库记录的增删改操作
"""
import json
import re
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import connection

from .utils import (
    validate_table_name,
    validate_field_name,
    switch_database,
    success_response,
    error_response,
)


def get_db_name(request):
    """从请求头获取数据库名称"""
    return request.headers.get('X-Database-Name', None)


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

        db_name = get_db_name(request)
        if db_name:
            switch_database(db_name)

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

            # 执行插入
            with connection.cursor() as cursor:
                cursor.execute(sql, list(record_data.values()))
                insert_id = cursor.lastrowid

                # 获取刚插入的记录
                cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", [insert_id])
                columns = [col[0] for col in cursor.description]
                row = cursor.fetchone()
                record = dict(zip(columns, row)) if row else {}

            return success_response('记录创建成功', record)

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'创建记录失败: {str(e)}')

    def get(self, request, table_name):
        """获取表结构和记录"""
        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_name = get_db_name(request)
        if db_name:
            switch_database(db_name)

        try:
            # 获取表结构
            schema_sql = """
                SELECT
                    COLUMN_NAME as name,
                    DATA_TYPE as type,
                    IS_NULLABLE as nullable,
                    COLUMN_KEY as key_type,
                    COLUMN_DEFAULT as default_value,
                    CHARACTER_MAXIMUM_LENGTH as max_length
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = %s
                ORDER BY ORDINAL_POSITION
            """

            with connection.cursor() as cursor:
                cursor.execute(schema_sql, [table_name])
                schema_columns = [col[0] for col in cursor.description]
                schema_rows = cursor.fetchall()
                schema = [dict(zip(schema_columns, row)) for row in schema_rows]

                # 获取前几条记录作为示例
                cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 5")
                if cursor.description:
                    data_columns = [col[0] for col in cursor.description]
                    data_rows = cursor.fetchall()
                    sample_data = [dict(zip(data_columns, row)) for row in data_rows]
                else:
                    sample_data = []

            return success_response('表结构获取成功', {
                'schema': schema,
                'sample_data': sample_data
            })

        except Exception as e:
            return error_response(f'获取表结构失败: {str(e)}')


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

        db_name = get_db_name(request)
        if db_name:
            switch_database(db_name)

        try:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", [record_id])
                columns = [col[0] for col in cursor.description]
                row = cursor.fetchone()

                if not row:
                    return error_response('记录不存在', status=404)

                record = dict(zip(columns, row))
                return success_response('记录获取成功', record)

        except Exception as e:
            return error_response(f'获取记录失败: {str(e)}')

    def put(self, request, table_name, record_id):
        """更新记录"""
        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_name = get_db_name(request)
        if db_name:
            switch_database(db_name)

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

            with connection.cursor() as cursor:
                cursor.execute(sql, params)
                if cursor.rowcount == 0:
                    return error_response('记录不存在或未做任何修改', status=404)

                # 获取更新后的记录
                cursor.execute(f"SELECT * FROM `{table_name}` WHERE id = %s", [record_id])
                columns = [col[0] for col in cursor.description]
                row = cursor.fetchone()
                record = dict(zip(columns, row)) if row else {}

            return success_response('记录更新成功', record)

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'更新记录失败: {str(e)}')

    def delete(self, request, table_name, record_id):
        """删除记录"""
        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_name = get_db_name(request)
        if db_name:
            switch_database(db_name)

        try:
            with connection.cursor() as cursor:
                # 先检查记录是否存在
                cursor.execute(f"SELECT id FROM `{table_name}` WHERE id = %s", [record_id])
                if not cursor.fetchone():
                    return error_response('记录不存在', status=404)

                # 删除记录
                cursor.execute(f"DELETE FROM `{table_name}` WHERE id = %s", [record_id])

            return success_response('记录删除成功')

        except Exception as e:
            return error_response(f'删除记录失败: {str(e)}')


@method_decorator(csrf_exempt, name='dispatch')
class BatchDeleteView(View):
    """批量删除"""

    def post(self, request, table_name):
        """批量删除记录"""
        if not validate_table_name(table_name):
            return error_response('无效的表名')

        db_name = get_db_name(request)
        if db_name:
            switch_database(db_name)

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

            with connection.cursor() as cursor:
                cursor.execute(sql, ids)
                deleted_count = cursor.rowcount

            return success_response(f'成功删除 {deleted_count} 条记录', {'deleted': deleted_count})

        except json.JSONDecodeError:
            return error_response('无效的 JSON 格式')
        except Exception as e:
            return error_response(f'批量删除失败: {str(e)}')
