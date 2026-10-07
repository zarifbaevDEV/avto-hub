from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'action', 'model', 'object_id', 'ip_address')
    list_filter = ('action', 'model')
    search_fields = ('user__phone', 'model', 'object_id', 'ip_address')
    readonly_fields = ('created_at', 'updated_at', 'user', 'action', 'model', 'object_id', 'old_data', 'new_data', 'ip_address')

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
