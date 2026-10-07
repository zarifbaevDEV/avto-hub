from rest_framework import serializers
from .models import Report
from apps.marketplace.models import Listing
from apps.marketplace.serializers import ListingSerializer


class ReportSerializer(serializers.ModelSerializer):
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'target_type', 'target_id', 'reason',
            'reason_display', 'description', 'status', 'status_display',
            'moderator_comment', 'created_at'
        ]
        read_only_fields = ['id', 'reporter', 'status', 'moderator_comment', 'created_at']

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class ModerationDecisionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'block'])
    reason = serializers.CharField(required=False, allow_blank=True)
