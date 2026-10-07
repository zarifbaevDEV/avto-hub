from django.contrib import admin
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'reporter', 'target_type', 'target_id', 'reason', 'status', 'created_at')
    list_filter = ('target_type', 'reason', 'status')
    search_fields = ('reporter__phone', 'target_id', 'description')
