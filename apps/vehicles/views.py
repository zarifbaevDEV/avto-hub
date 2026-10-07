from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Brand, VehicleModel, Generation, Modification, Vehicle
from .serializers import (
    BrandSerializer,
    VehicleModelSerializer,
    GenerationSerializer,
    ModificationSerializer,
    VehicleSerializer,
)
from .filters import VehicleFilter
from common.permissions import IsOwnerOrReadOnly, IsAdminOrSuperAdmin


@extend_schema_view(
    list=extend_schema(summary="Avtomobil markalari ro'yxati"),
    retrieve=extend_schema(summary="Marka tafsilotlari")
)
class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrSuperAdmin()]
        return [permissions.AllowAny()]


@extend_schema_view(
    list=extend_schema(summary="Avtomobil modellari ro'yxati"),
    retrieve=extend_schema(summary="Model tafsilotlari")
)
class VehicleModelViewSet(viewsets.ModelViewSet):
    queryset = VehicleModel.objects.filter(is_active=True).select_related('brand')
    serializer_class = VehicleModelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['brand', 'body_type']
    search_fields = ['name', 'brand__name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrSuperAdmin()]
        return [permissions.AllowAny()]


@extend_schema_view(
    list=extend_schema(summary="Model avlodlari ro'yxati"),
    retrieve=extend_schema(summary="Avlod tafsilotlari")
)
class GenerationViewSet(viewsets.ModelViewSet):
    queryset = Generation.objects.all().select_related('model__brand').prefetch_related('modifications')
    serializer_class = GenerationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['model']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrSuperAdmin()]
        return [permissions.AllowAny()]


@extend_schema_view(
    list=extend_schema(summary="Modifikatsiyalar ro'yxati"),
    retrieve=extend_schema(summary="Modifikatsiya tafsilotlari")
)
class ModificationViewSet(viewsets.ModelViewSet):
    queryset = Modification.objects.all().select_related('generation__model')
    serializer_class = ModificationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['generation', 'fuel_type', 'transmission', 'drive_type']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrSuperAdmin()]
        return [permissions.AllowAny()]


@extend_schema_view(
    list=extend_schema(summary="Avtomobillar ro'yxati"),
    create=extend_schema(summary="Yangi avtomobil qo'shish"),
    retrieve=extend_schema(summary="Avtomobil tafsilotlari")
)
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().select_related(
        'brand', 'model', 'generation', 'modification', 'owner'
    )
    serializer_class = VehicleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VehicleFilter
    search_fields = ['brand__name', 'model__name', 'vin', 'city', 'region']
    ordering_fields = ['price', 'year', 'mileage', 'created_at']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
