from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import AuditLog
from .serializers import AuditLogSerializer
from common.permissions import IsAdminOrSuperAdmin


@extend_schema_view(
    list=extend_schema(summary="Tizim audit jurnallari ro'yxati (Faqat Adminlar uchun)"),
    retrieve=extend_schema(summary="Audit log tafsilotlari")
)
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'model', 'user']
    search_fields = ['action', 'model', 'object_id', 'ip_address']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
