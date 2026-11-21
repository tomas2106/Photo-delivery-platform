import hashlib
import os
import re
import time
from urllib.parse import unquote
import requests


def extract_cloudinary_public_id(url: str) -> str | None:
    """
    Extrae el public_id de una URL estándar de Cloudinary.
    Ej: https://res.cloudinary.com/demo/image/upload/v1712345/tomasph/carrera/DSC_001.jpg
    -> tomasph/carrera/DSC_001
    """
    if not url or 'res.cloudinary.com' not in url or '/upload/' not in url:
        return None

    after_upload = url.split('/upload/', 1)[1]
    # Eliminar prefijo de versión (v1234567890/) si existe
    after_upload = re.sub(r'^v\d+/', '', after_upload)
    # Quitar parámetros de consulta y extensión de archivo
    after_upload = after_upload.split('?')[0]
    public_id = re.sub(r'\.[^/.]+$', '', after_upload)
    return unquote(public_id) if public_id else None


def delete_cloudinary_urls(urls: list[str]) -> dict:
    """
    Elimina de Cloudinary las imágenes indicadas usando la Admin/Upload API firmada.
    """
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME', '').strip()
    api_key = os.getenv('CLOUDINARY_API_KEY', '').strip()
    api_secret = os.getenv('CLOUDINARY_API_SECRET', '').strip()

    if not cloud_name or not api_key or not api_secret:
        return {'deleted': 0, 'skipped': len(urls), 'reason': 'Credenciales Cloudinary no configuradas'}

    deleted_count = 0
    errors = []

    for url in urls:
        public_id = extract_cloudinary_public_id(url)
        if not public_id:
            continue

        timestamp = int(time.time())
        signature_payload = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
        signature = hashlib.sha1(signature_payload.encode('utf-8')).hexdigest()

        endpoint = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"
        try:
            resp = requests.post(
                endpoint,
                data={
                    'public_id': public_id,
                    'timestamp': timestamp,
                    'api_key': api_key,
                    'signature': signature,
                },
                timeout=10,
            )
            if resp.ok and resp.json().get('result') in ['ok', 'not found']:
                deleted_count += 1
            else:
                errors.append(public_id)
        except Exception as exc:
            errors.append(f"{public_id}: {exc}")

    return {'deleted': deleted_count, 'errors': errors}