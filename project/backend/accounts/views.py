from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from rest_framework import status
from django.contrib.auth import authenticate

@api_view(["POST"])
def google_login(request):
    email = request.data.get("email")
    name = request.data.get("name")

    user, created = User.objects.get_or_create(email=email, defaults={"username": email})
    if created:
        user.role = "siswa"  
        user.save()

    return Response({
        "email": user.email,
        "role": user.role,
        "name": user.username,
    })

@api_view(["POST"])
def guru_login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    
    user = authenticate(username=username, password=password)
    
    if user is not None and user.role == "guru":
        return Response({
            "email": user.email,
            "role": user.role,
            "name": user.username,
        })
    else:
        return Response({"error": "Invalid credentials or not a guru"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(["POST"])
def create_guru(request):
    # In a real app, verify request.user.role == 'admin' here
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.role = "guru"
    user.save()
    
    return Response({"message": "Guru account created successfully"}, status=status.HTTP_201_CREATED)

@api_view(["GET"])
def list_gurus(request):
    gurus = User.objects.filter(role="guru")
    data = [{"id": u.id, "username": u.username, "email": u.email} for u in gurus]
    return Response(data)

@api_view(["POST"])
def logout_view(request):
    return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)