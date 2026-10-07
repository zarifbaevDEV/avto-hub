from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, PendingListingsView, ListingModerationDecisionView

router = DefaultRouter()
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('pending-listings/', PendingListingsView.as_view(), name='moderation-pending-listings'),
    path('listings/<uuid:pk>/decide/', ListingModerationDecisionView.as_view(), name='moderation-listing-decide'),
] + router.urls
