# backend/api/urls.py
from django.urls import path
from .views import google_login, logout_view, guru_login, create_guru, list_gurus

urlpatterns = [
    path("auth/google-login/", google_login),
    path("auth/guru-login/", guru_login),
    path("auth/create-guru/", create_guru),
    path("auth/list-gurus/", list_gurus),
    path("auth/logout/", logout_view, name="logout"),
]
