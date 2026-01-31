from bs4 import BeautifulSoup
from urllib.parse import urlparse

SUPABASE_STORAGE_DOMAIN = "https://rktckjwvjwvhywqsubri.storage.supabase.co"

def supabase_signed_to_public(url: str):
    """
    Ubah signed URL /s3/ menjadi public /object/public/
    """
    if not url:
        return None

    parsed = urlparse(url)
    path = parsed.path

    if "/storage/v1/s3/" in path:
        relative_path = path.split("/storage/v1/s3/")[1]
        return (
            SUPABASE_STORAGE_DOMAIN
            + "/storage/v1/object/public/"
            + relative_path
        )

    return url

def extract_text_and_images(html: str):
    soup = BeautifulSoup(html, "html.parser")
    image_urls = []

    for img in soup.find_all("img"):
        src = img.get("src")
        if src:
            image_urls.append(supabase_signed_to_public(src))
        img.decompose()  # hapus img dari teks

    clean_text = soup.get_text(separator="\n")
    return clean_text.strip(), image_urls