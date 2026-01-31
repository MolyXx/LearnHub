# backend/api/urls.py
from django.urls import path
from .views import google_login, logout_view

urlpatterns = [
    path("auth/google-login/", google_login),
    path("auth/logout/", logout_view, name="logout"),
]
