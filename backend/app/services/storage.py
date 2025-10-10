import uuid
from pathlib import Path
import io

from fastapi import UploadFile
from minio import Minio

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_HTTPS,
        )
        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        found = self.client.bucket_exists(self.bucket_name)
        if not found:
            self.client.make_bucket(self.bucket_name)

    async def upload_file(self, file: UploadFile) -> str:
        file_extension = Path(file.filename).suffix
        file_name = f"{uuid.uuid4()}{file_extension}"
        file_content = await file.read()
        file_size = len(file_content)

        self.client.put_object(
            bucket_name=self.bucket_name,
            object_name=file_name,
            data=io.BytesIO(file_content),
            length=file_size,
            content_type=file.content_type,
        )

        if settings.MINIO_PUBLIC_URL:
            # Use the public URL for generating the file link when available (for sharing)
            base_url = settings.MINIO_PUBLIC_URL.rstrip('/')
            url = f"{base_url}/{self.bucket_name}/{file_name}"
        else:
            # Fallback to local endpoint for development
            # The backend uses 'minio:9000' to talk to the service inside docker.
            # We replace it with 'localhost' so the URL is accessible from the host browser.
            endpoint = settings.MINIO_ENDPOINT.replace("minio", "localhost")
            protocol = "https" if settings.MINIO_USE_HTTPS else "http"
            url = f"{protocol}://{endpoint}/{self.bucket_name}/{file_name}"

        return url


storage_service = StorageService()
