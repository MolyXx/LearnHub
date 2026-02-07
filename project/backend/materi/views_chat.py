# backend/materi/views_chat.py
import os
import json
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework import status
from openai import OpenAI
from .helper import extract_text_and_images
from .models import MateriUtama, SubMateri, MateriFile
from .file_utils import extract_file_content
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

MAX_CHARS_SOURCE = 18_000

def build_materi_context(materi: MateriUtama, request, sub_slug=None):
    text_lines = []
    image_urls = []

    text_lines.append(f"Materi: {materi.judul}")
    if materi.deskripsi:
        text_lines.append(f"Deskripsi: {materi.deskripsi}")

    if sub_slug:
        submateri_list = materi.submateri.filter(slug=sub_slug)
    else:
        submateri_list = materi.submateri.all().order_by("urutan")

    for s in submateri_list:
        text_lines.append(f"\n--- Submateri: {s.judul} ---")

        if s.isi:
            clean_text, imgs = extract_text_and_images(s.isi)
            text_lines.append(clean_text) 
            image_urls.extend(imgs)

        # Proses MateriFile
        files = s.files.all()
        for f in files:
             text_lines.append(f"\n[File: {f.judul}]")
             if f.deskripsi:
                 text_lines.append(f"Deskripsi File: {f.deskripsi}")
             
             filename = f.file.name.lower()
             
             try:
                 content, imgs = extract_file_content(f.file)
                 text_lines.append(f"Isi File ({filename}):\n{content}")
                 image_urls.extend(imgs)
             except Exception as e:
                 print(f"Error reading file {filename}: {e}")

    text = "\n".join(text_lines)

    return text, image_urls

@api_view(["POST"])
@permission_classes([AllowAny])
def chat_gpt(request):
    data = request.data
    history = data.get("history", [])
    message = data.get("message", "").strip()
    if not message:
        return Response({"error": "message is required"}, status=400)

    materi_slug = data.get("materi_slug")
    sub_slug = data.get("sub_slug")

    text_context = ""
    image_urls = []

    if materi_slug:
        try:
            materi = MateriUtama.objects.get(slug=materi_slug)
            text_context, image_urls = build_materi_context(
                materi, request, sub_slug=sub_slug
            )
        except MateriUtama.DoesNotExist:
            pass

    system_prompt = (
        "Anda adalah asisten pembelajaran. Jawablah berdasarkan topik dari materi yang diberikan."
        "Gunakan bahasa yang mudah dimengerti oleh pelajar."
        "Jika pertanyaan di luar konteks topik, katakan bahwa Anda hanya dapat menjawab berdasarkan topik materi yang diberikan."
        "Pastikan jawaban yang anda berikan benar dan akurat."
        "Jangan mengarang jawaban atau memberikan informasi yang tidak benar."
        "Setiap akhir jawaban berikan disclaimer bahwa jawaban ada kemungkinan salah, suruh user konsultasi jawaban ke guru."
        "Kalimat disclaimer dibawah sendiri den menggunkan kalimat tebal"
    )

    input_content = [
        {
            "type": "text",
            "text": system_prompt + "\n\n" + text_context
        }
    ]
    
    for msg in history:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        input_content.append({
            "type": "text",
            "text": f"{role.upper()}: {content}"
    })

    for url in image_urls[:2]:
        input_content.append({
            "type": "image_url",
            "image_url": {
                "url": url
            }
        })

    input_content.append({
        "type": "text",
        "text": message
    })

    try:
        print("==== DEBUG GPT INPUT ====")
        print(json.dumps(input_content, indent=2, ensure_ascii=False))
        print("==== END DEBUG ====")
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": input_content
                }
            ],
            max_tokens=800,
            temperature=0.2
        )

        return Response({"reply": resp.choices[0].message.content})

    except Exception as e:
         print(f"Error OpenAI: {e}")
         return Response({"error": str(e)}, status=500)