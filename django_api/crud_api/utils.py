"""
工具函数
"""
import re
from django.http import JsonResponse
from django.db import connection, connections


def switch_database(db_name):
    """
    动态切换默认数据库
    """
    if db_name:
        connections['default'].settings_dict['NAME'] = db_name


def validate_table_name(table_name):
    """
    验证表名是否合法
    表名只能包含字母、数字、下划线，长度 1-64
    """
    if not table_name or len(table_name) > 64:
        return False
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name))


def validate_field_name(field_name):
    """
    验证字段名是否合法
    字段名只能包含字母、数字、下划线，长度 1-64
    """
    if not field_name or len(field_name) > 64:
        return False
    return bool(re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', field_name))


def execute_query(sql, params=None, db_name=None):
    """
    执行查询并返回结果
    """
    if db_name:
        switch_database(db_name)

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        if cursor.description is None:
            return []
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]


def execute_write(sql, params=None, db_name=None):
    """
    执行写操作并返回影响的行数
    """
    if db_name:
        switch_database(db_name)

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        return cursor.rowcount, cursor.lastrowid


def get_table_schema(table_name, db_name=None):
    """
    获取表结构信息
    """
    if db_name:
        switch_database(db_name)

    sql = """
        SELECT
            COLUMN_NAME as name,
            DATA_TYPE as type,
            IS_NULLABLE as nullable,
            COLUMN_KEY as key,
            COLUMN_DEFAULT as default_value,
            COLUMN_COMMENT as comment,
            CHARACTER_MAXIMUM_LENGTH as max_length
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = %s
        ORDER BY ORDINAL_POSITION
    """
    return execute_query(sql, [table_name], db_name)


def success_response(message, data=None, status=200):
    """
    返回成功响应
    """
    response = {
        'success': True,
        'message': message,
    }
    if data is not None:
        response['data'] = data
    return JsonResponse(response, status=status)


def error_response(message, status=400):
    """
    返回错误响应
    """
    return JsonResponse({
        'success': False,
        'message': message,
    }, status=status)


def custom_exception_handler(exc, context):
    """
    自定义异常处理
    """
    from rest_framework.views import exception_handler

    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            'success': False,
            'message': str(exc),
        }

    return response
