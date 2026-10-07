import uuid
from django.db import models
from django.conf import settings
from common.models import TimeStampedModel


class AuditLog(TimeStampedModel):
    """
    Audit log conforming to Section 35:
    AuditLog
    ├── user
    ├── action
    ├── model
    ├── object_id
    ├── old_data
    ├── new_data
    ├── IP
    └── created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100, db_index=True, verbose_name="Amal (Action)")
    model = models.CharField(max_length=100, db_index=True, verbose_name="Model nomi")
    object_id = models.CharField(max_length=100, db_index=True, verbose_name="Obyekt ID")
    old_data = models.JSONField(null=True, blank=True, verbose_name="Eski ma'lumot")
    new_data = models.JSONField(null=True, blank=True, verbose_name="Yangi ma'lumot")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP manzili")

    class Meta:
        verbose_name = "Audit jurnali"
        verbose_name_plural = "Audit jurnallari"
        ordering = ['-created_at']

    def __str__(self):
        user_str = str(self.user) if self.user else "System"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {user_str} -> {self.action} on {self.model}:{self.object_id}"
