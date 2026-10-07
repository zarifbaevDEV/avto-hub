from rest_framework import serializers
from .models import AuditLog
from apps.accounts.serializers import UserSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_detail', 'action', 'model',
            'object_id', 'old_data', 'new_data', 'ip_address', 'created_at'
        ]
        read_only_fields = fields
