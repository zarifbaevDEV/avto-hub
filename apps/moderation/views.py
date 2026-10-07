from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import Report
from .serializers import ReportSerializer, ModerationDecisionSerializer
from apps.marketplace.models import Listing
from apps.marketplace.serializers import ListingSerializer
from common.responses import success_response, error_response
from common.permissions import IsModerator


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Report.objects.none()
        user = self.request.user
        if user.is_authenticated and (user.is_staff or getattr(user, 'role', '') in ['MODERATOR', 'ADMIN', 'SUPER_ADMIN']):
            return Report.objects.all()
        elif user.is_authenticated:
            return Report.objects.filter(reporter=user)
        return Report.objects.none()

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        return [IsModerator()]


class PendingListingsView(APIView):
    permission_classes = [IsModerator]

    @extend_schema(summary="Moderatsiya kutilayotgan e'lonlar ro'yxati", responses={200: ListingSerializer(many=True)})
    def get(self, request):
        pending_listings = Listing.objects.filter(
            status=Listing.Status.PENDING_MODERATION
        ).select_related('vehicle__brand', 'vehicle__model', 'seller').prefetch_related('images')

        serializer = ListingSerializer(pending_listings, many=True, context={'request': request})
        return success_response(data=serializer.data)


class ListingModerationDecisionView(APIView):
    permission_classes = [IsModerator]

    @extend_schema(
        summary="E'lonni tasdiqlash yoki rad etish (Moderator qarori)",
        request=ModerationDecisionSerializer,
        responses={200: OpenApiResponse(description="Qaror muvaffaqiyatli qabul qilindi")}
    )
    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return error_response(message="E'lon topilmadi.", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ModerationDecisionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        decision = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')

        if decision == 'approve':
            listing.status = Listing.Status.ACTIVE
            listing.published_at = timezone.now()
            listing.rejection_reason = None
            msg = "E'lon tasdiqlandi va e'lonlar maydonida faollashtirildi."
        elif decision == 'reject':
            listing.status = Listing.Status.REJECTED
            listing.rejection_reason = reason or "E'lon talablarga mos kelmadi."
            msg = f"E'lon rad etildi: {listing.rejection_reason}"
        elif decision == 'block':
            listing.status = Listing.Status.BLOCKED
            listing.rejection_reason = reason or "Qoidabuzarlik sababli bloklandi."
            msg = "E'lon bloklandi."

        listing.save(update_fields=['status', 'published_at', 'rejection_reason'])
        return success_response(message=msg)
