from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("siswa", "Siswa"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="siswa")
