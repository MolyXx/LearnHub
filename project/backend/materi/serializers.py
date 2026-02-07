from rest_framework import serializers
from .models import MateriUtama, SubMateri, MateriFile

class MateriFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MateriFile
        fields = ["id", "file", "judul", "deskripsi", "urutan", "created_at", "submateri"]

class SubMateriSerializer(serializers.ModelSerializer):
    files = MateriFileSerializer(many=True, read_only=True)

    class Meta:
        model = SubMateri
        fields = [
            "id",
            "judul",
            "slug",
            "isi",
            "file",
            "gambar",
            "urutan",
            "updated_at",
            "files",
        ]


class MateriUtamaSerializer(serializers.ModelSerializer):
    submateri = SubMateriSerializer(many=True, read_only=True)

    class Meta:
        model = MateriUtama
        fields = [
            "id",
            "judul",
            "slug",
            "deskripsi",
            "cover_image",
            "submateri",
        ]
