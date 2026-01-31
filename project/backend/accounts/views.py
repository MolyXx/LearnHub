from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User
from rest_framework import status

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
def logout_view(request):
    return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)