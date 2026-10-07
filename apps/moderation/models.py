import uuid
from django.db import models
from django.conf import settings
from common.models import TimeStampedModel


class Report(TimeStampedModel):
    """
    Report model conforming to Section 34:
    Report
    ├── reporter
    ├── target_type
    ├── target_id
    ├── reason
    ├── description
    ├── status
    └── created_at
    """
    class Reason(models.TextChoices):
        FAKE_LISTING = 'FAKE_LISTING', 'Soxta e\'lon'
        WRONG_VEHICLE = 'WRONG_VEHICLE', 'Noto\'g\'ri avtomobil modeli/ma\'lumoti'
        FAKE_PRICE = 'FAKE_PRICE', 'Soxta yoki noto\'g\'ri narx'
        FRAUD = 'FRAUD', 'Firibgarlik shubhasi'
        DUPLICATE = 'DUPLICATE', 'Dublikat / Takroriy e\'lon'
        OFFENSIVE = 'OFFENSIVE', 'Haqoratomuz yoki nomaqbul kontent'
        OTHER = 'OTHER', 'Boshqa sabab'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Ko\'rib chiqilmoqda'
        RESOLVED = 'RESOLVED', 'Hal etildi'
        DISMISSED = 'DISMISSED', 'Rad etildi / Asossiz'

    class TargetType(models.TextChoices):
        LISTING = 'LISTING', 'E\'lon'
        USER = 'USER', 'Foydalanuvchi'
        REVIEW = 'REVIEW', 'Sharh'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports')
    target_type = models.CharField(max_length=20, choices=TargetType.choices, default=TargetType.LISTING)
    target_id = models.CharField(max_length=64, db_index=True)
    reason = models.CharField(max_length=30, choices=Reason.choices, default=Reason.FAKE_LISTING)
    description = models.TextField(blank=True, verbose_name="Batafsil izoh")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    moderator_comment = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Shikoyat"
        verbose_name_plural = "Shikoyatlar"
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.id} on {self.target_type} ({self.get_reason_display()})"
