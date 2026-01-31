from django.contrib import admin
from .models import MateriUtama, SubMateri
from django.utils.html import format_html


class SubMateriInline(admin.TabularInline):
    model = SubMateri
    extra = 1  # jumlah form kosong default
    fields = ("judul", "urutan", "isi", "file", "gambar", "preview_gambar")
    readonly_fields = ("preview_gambar",)

    def preview_gambar(self, obj):
        if obj.gambar:
            return format_html('<img src="{}" width="100" style="border-radius:8px;"/>', obj.gambar.url)
        return "—"
    preview_gambar.short_description = "Preview Gambar"


@admin.register(MateriUtama)
class MateriUtamaAdmin(admin.ModelAdmin):
    list_display = ("judul", "slug", "jumlah_submateri", "preview_cover")
    prepopulated_fields = {"slug": ("judul",)}
    search_fields = ("judul",)
    inlines = [SubMateriInline]

    def jumlah_submateri(self, obj):
        return obj.submateri.count()
    jumlah_submateri.short_description = "Jumlah Submateri"

    def preview_cover(self, obj):
        if obj.cover_image:
            return format_html('<img src="{}" width="100" style="border-radius:8px;"/>', obj.cover_image.url)
        return "—"
    preview_cover.short_description = "Cover"


@admin.register(SubMateri)
class SubMateriAdmin(admin.ModelAdmin):
    list_display = ("judul", "parent", "urutan", "slug", "updated_at", "preview_gambar")
    list_filter = ("parent",)
    search_fields = ("judul", "isi")
    prepopulated_fields = {"slug": ("judul",)}
    ordering = ("parent", "urutan")
    readonly_fields = ("preview_gambar",)

    def preview_gambar(self, obj):
        if obj.gambar:
            return format_html('<img src="{}" width="100" style="border-radius:8px;"/>', obj.gambar.url)
        return "—"
    preview_gambar.short_description = "Gambar"
