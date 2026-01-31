from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status
from .models import MateriUtama, SubMateri
from .serializers import MateriUtamaSerializer, SubMateriSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils.text import slugify
from django.core.files.storage import default_storage
import time


@api_view(["GET", "POST"])
def materi_list(request):
    if request.method == "GET":
        materi = MateriUtama.objects.all()
        serializer = MateriUtamaSerializer(materi, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = MateriUtamaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(["GET"])
def materi_detail(request, materi_slug):
    """Ambil detail 1 materi + daftar submaterinya"""
    try:
        materi = MateriUtama.objects.get(slug=materi_slug)
    except MateriUtama.DoesNotExist:
        return Response({"error": "Materi tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

    serializer = MateriUtamaSerializer(materi)
    return Response(serializer.data)


@api_view(["GET", "PUT", "DELETE"])
def submateri_detail(request, materi_slug, sub_slug):
    """Ambil, update, atau hapus 1 submateri berdasarkan slug"""
    try:
        parent = MateriUtama.objects.get(slug=materi_slug)
        sub = SubMateri.objects.get(parent=parent, slug=sub_slug)
    except (MateriUtama.DoesNotExist, SubMateri.DoesNotExist):
        return Response(
            {"error": "Submateri tidak ditemukan"},
            status=status.HTTP_404_NOT_FOUND
        )

    # GET
    if request.method == "GET":
        serializer = SubMateriSerializer(sub)
        return Response(serializer.data)

    # PUT
    elif request.method == "PUT":
        serializer = SubMateriSerializer(sub, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    elif request.method == "DELETE":
        sub.delete()
        return Response({"message": "Submateri berhasil dihapus"}, status=status.HTTP_204_NO_CONTENT)

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_image(request):
    image = request.FILES.get("image")

    if not image:
        return Response({"error": "Tidak ada file gambar"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        filename = f"uploads/{int(time.time())}_{image.name}"
        file_path = default_storage.save(filename, image)

        SUPABASE_PROJECT_ID = "rktckjwvjwvhywqsubri"  
        SUPABASE_BUCKET = "media" 

        public_url = (
            f"https://{SUPABASE_PROJECT_ID}.supabase.co"
            f"/storage/v1/object/public/{SUPABASE_BUCKET}/{file_path}"
        )

        return Response({
            "path": file_path,
            "url": public_url
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"❌ Error Upload: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["POST"])
def submateri_create(request, materi_slug):
    try:
        parent = MateriUtama.objects.get(slug=materi_slug)
    except MateriUtama.DoesNotExist:
        return Response({"error": "Materi tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

    serializer = SubMateriSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(parent=parent)  # ⬅ parent di-set langsung
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["PUT", "DELETE"])
def materi_update_delete(request, materi_slug):
    try:
        materi = MateriUtama.objects.get(slug=materi_slug)
    except MateriUtama.DoesNotExist:
        return Response({"error": "Materi tidak ditemukan"}, status=404)

    # UPDATE
    if request.method == "PUT":
        serializer = MateriUtamaSerializer(materi, data=request.data, partial=True)
        if serializer.is_valid():
            # Perbarui slug jika judul ikut diubah
            if "judul" in request.data:
                new_slug = slugify(request.data["judul"])
                serializer.validated_data["slug"] = new_slug

            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    # DELETE
    if request.method == "DELETE":
        materi.delete()
        return Response({"message": "Materi berhasil dihapus"}, status=204)
