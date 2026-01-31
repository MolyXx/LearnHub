from rest_framework import serializers
from .models import MateriUtama, SubMateri

class SubMateriSerializer(serializers.ModelSerializer):
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
