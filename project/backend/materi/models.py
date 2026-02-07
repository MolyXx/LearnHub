from django.db import models
from django.utils.text import slugify

class MateriUtama(models.Model):
    judul = models.CharField(max_length=255)
    deskripsi = models.TextField(blank=True, default="")
    slug = models.SlugField(unique=True, blank=True)
    cover_image = models.ImageField(upload_to="materi/covers/", blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.judul)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.judul


class SubMateri(models.Model):
    parent = models.ForeignKey(MateriUtama, on_delete=models.CASCADE, related_name="submateri")
    judul = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    isi = models.TextField(blank=True)
    file = models.FileField(upload_to="materi/files/", blank=True, null=True)
    gambar = models.ImageField(upload_to="materi/images/", blank=True, null=True)
    urutan = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["urutan"]  

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.judul)

        if not self.pk:
            last = SubMateri.objects.filter(parent=self.parent).order_by('-urutan').first()
            if last:
                self.urutan = last.urutan + 1
            else:
                self.urutan = 1

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.parent.judul} - {self.judul}"

class MateriFile(models.Model):
    submateri = models.ForeignKey(SubMateri, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="materi/files/")
    judul = models.CharField(max_length=255)
    deskripsi = models.TextField(blank=True)
    urutan = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["urutan"]

    def __str__(self):
        return f"{self.submateri.judul} - {self.judul}"
