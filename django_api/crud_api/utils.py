"""
工具函数
"""
import re
import mysql.connector
from django.http import JsonResponse


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


def get_db_connection(db_config):
    """
    创建数据库连接
    db_config: {host, port, user, password, database}
    """
    return mysql.connector.connect(
        host=db_config.get('host', 'localhost'),
        port=int(db_config.get('port', 3306)),
        user=db_config.get('user', 'root'),
        password=db_config.get('password', ''),
        database=db_config.get('database', ''),
        charset='utf8mb4'
    )


def execute_query(conn, sql, params=None):
    """
    执行查询并返回结果
    """
    cursor = conn.cursor()
    cursor.execute(sql, params or ())
    if cursor.description is None:
        cursor.close()
        return []
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    cursor.close()
    return [dict(zip(columns, row)) for row in rows]


def execute_write(conn, sql, params=None):
    """
    执行写操作并返回影响的行数和最后插入ID
    """
    cursor = conn.cursor()
    cursor.execute(sql, params or ())
    conn.commit()
    rowcount = cursor.rowcount
    lastid = cursor.lastrowid
    cursor.close()
    return rowcount, lastid


def get_table_schema(conn, table_name):
    """
    获取表结构信息
    """
    sql = """
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
    return execute_query(conn, sql, (table_name,))


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
