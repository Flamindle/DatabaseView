"""
Django URL Configuration
"""
from django.urls import path, include

urlpatterns = [
    path('api/', include('crud_api.urls')),
]
