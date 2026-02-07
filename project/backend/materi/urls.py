from django.urls import path
from . import views
from .views_chat import chat_gpt

urlpatterns = [
    path("materi/", views.materi_list, name="materi-list"),
    path("materi/<slug:materi_slug>/", views.materi_detail, name="materi-detail"),
    path("materi/<slug:materi_slug>/edit/", views.materi_update_delete, name="materi-edit"),
    path("materi/<slug:materi_slug>/sub/", views.submateri_create, name="submateri-create"),
    path("materi/<slug:materi_slug>/<slug:sub_slug>/", views.submateri_detail, name="submateri-detail"),
    path("upload-image/", views.upload_image, name="upload-image"),
    path("materi-file/", views.materi_file_create, name="materi-file-create"),
    path("materi-file/<int:pk>/", views.materi_file_detail, name="materi-file-detail"),
    path("chat/", chat_gpt, name="chat-gpt"),
]