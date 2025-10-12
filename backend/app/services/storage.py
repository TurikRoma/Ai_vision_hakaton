import uuid
from datetime import timedelta
from urllib.parse import urlparse, urlunparse
import logging
import os

from fastapi import UploadFile
from minio import Minio
from minio.error import S3Error

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        logger.info("Initializing StorageService...")
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_HTTPS,
        )

        if settings.MINIO_PUBLIC_URL:
            public_endpoint_parts = urlparse(settings.MINIO_PUBLIC_URL)
            self.public_client = Minio(
                public_endpoint_parts.netloc,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=public_endpoint_parts.scheme == 'https',
            )
        else:
            self.public_client = self.client

        self.bucket_name = settings.MINIO_BUCKET
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        found = self.client.bucket_exists(self.bucket_name)
        if not found:
            try:
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Bucket '{self.bucket_name}' created successfully.")
            except S3Error as exc:
                logger.error(f"Error creating bucket: {exc}")
                raise

    async def get_presigned_url(self, object_name_or_url: str) -> str | None:
        """
        Generate a presigned URL for an object.
        Handles both an object name and a full URL.
        """
        try:
            # If a full URL is passed, extract just the object name.
            parsed_url = urlparse(object_name_or_url)
            if parsed_url.scheme and parsed_url.netloc:
                # Looks like a URL, extract the path part.
                # The path might be /bucket_name/object_name, so we get the last part.
                object_name = parsed_url.path.split('/')[-1]
            else:
                # Assumed to be just the object name
                object_name = object_name_or_url

            presigned_url = self.public_client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=timedelta(days=7),
            )
            return presigned_url

        except S3Error as exc:
            logger.error(f"Error generating presigned URL for {object_name_or_url}: {exc}")
            raise

    async def upload_file(self, file: UploadFile) -> str:
        """Upload a file to an S3 object."""
        file_name = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
        logger.info(
            f"Attempting to upload file. Original name: '{file.filename}', "
            f"new name: '{file_name}' to bucket '{self.bucket_name}'."
        )
        try:
            file.file.seek(0)
            self.client.put_object(
                self.bucket_name,
                file_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
                content_type=file.content_type,
            )
        except S3Error as exc:
            logger.error(f"Error uploading to MinIO: {exc}")
            raise
        return file_name


storage_service = StorageService()
