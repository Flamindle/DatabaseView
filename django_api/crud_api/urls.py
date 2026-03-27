"""
CRUD API URL 路由
"""
from django.urls import path
from . import views

urlpatterns = [
    # 认证接口
    path('auth/login', views.auth_login, name='auth_login'),
    path('auth/logout', views.auth_logout, name='auth_logout'),
    path('auth/status', views.auth_status, name='auth_status'),
    path('auth/csrf', views.get_csrf_token, name='csrf_token'),
    # 表记录操作
    path('tables/<str:table_name>/records', views.TableRecordsView.as_view(), name='table_records'),
    # 单条记录操作
    path('tables/<str:table_name>/records/<int:record_id>', views.RecordDetailView.as_view(), name='record_detail'),
    # 批量删除
    path('tables/<str:table_name>/records/batch', views.BatchDeleteView.as_view(), name='batch_delete'),
]
