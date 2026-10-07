from django.db.models import F
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Listing, VehicleImage, Favorite, ListingPromotion
from .serializers import (
    ListingSerializer,
    ListingCreateUpdateSerializer,
    VehicleImageSerializer,
    FavoriteSerializer,
    ListingPromotionSerializer,
)
from .filters import ListingFilter
from common.responses import success_response, error_response
from common.permissions import IsOwnerOrReadOnly


@extend_schema_view(
    list=extend_schema(summary="Bozordagi faol e'lonlar ro'yxati (Faqat ACTIVE status)"),
    create=extend_schema(summary="Yangi e'lon berish (Moderatsiyaga yuboriladi)"),
    retrieve=extend_schema(summary="E'lon to'liq ma'lumoti"),
    update=extend_schema(summary="E'lonni tahrirlash"),
)
class ListingViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingFilter
    search_fields = ['title', 'description', 'vehicle__brand__name', 'vehicle__model__name', 'vehicle__city']
    ordering_fields = ['price', 'created_at', 'views', 'favorites_count']
    ordering = ['-is_vip', '-is_featured', '-created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Listing.objects.select_related(
            'vehicle__brand', 'vehicle__model', 'vehicle__generation',
            'vehicle__modification', 'vehicle__owner', 'seller'
        ).prefetch_related('images')

        # Public users only see ACTIVE listings. Staff can see all.
        if self.action == 'my_listings' and user.is_authenticated:
            return queryset.filter(seller=user)
        elif self.action in ['list', 'retrieve'] and not (user.is_authenticated and user.is_staff):
            return queryset.filter(status=Listing.Status.ACTIVE)

        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ListingCreateUpdateSerializer
        return ListingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success_response(
            data=serializer.data,
            message="E'lon muvaffaqiyatli yaratildi va moderatsiyaga yuborildi.",
            status_code=status.HTTP_201_CREATED
        )

    def get_permissions(self):
        if self.action in ['create', 'favorite', 'my_listings', 'upload_image', 'mark_sold']:
            return [permissions.IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Atomic view count increment
        Listing.objects.filter(pk=instance.pk).update(views=F('views') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    @action(detail=False, methods=['get'], url_path='my-listings')
    def my_listings(self, request):
        """Sotuvchining barcha e'lonlari (Draft, Moderatsiya, Active, Sold va h.k.)"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ListingSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ListingSerializer(queryset, many=True, context={'request': request})
        return success_response(data=serializer.data)

    @action(detail=True, methods=['post'], url_path='favorite')
    def favorite(self, request, pk=None):
        """E'lonni saralanganlarga qo'shish yoki olib tashlash (Toggle)"""
        listing = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, listing=listing)

        if not created:
            favorite.delete()
            Listing.objects.filter(pk=listing.pk).update(favorites_count=F('favorites_count') - 1)
            is_favorited = False
            msg = "E'lon saqlanganlardan olib tashlandi"
        else:
            Listing.objects.filter(pk=listing.pk).update(favorites_count=F('favorites_count') + 1)
            is_favorited = True
            msg = "E'lon saqlanganlarga qo'shildi"

        listing.refresh_from_db()
        return success_response(
            data={'is_favorited': is_favorited, 'favorites_count': listing.favorites_count},
            message=msg
        )

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], url_path='images')
    def upload_image(self, request, pk=None):
        """E'longa rasm yuklash"""
        listing = self.get_object()
        if listing.seller != request.user and not request.user.is_staff:
            return error_response(message="Siz faqat o'zingizning e'loningizga rasm yuklay olasiz.", status_code=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        if not file:
            return error_response(message="Rasm fayli yuborilmadi.")

        is_primary = request.data.get('is_primary', 'false').lower() in ('true', '1')
        if is_primary:
            listing.images.update(is_primary=False)

        image = VehicleImage.objects.create(
            listing=listing,
            vehicle=listing.vehicle,
            file=file,
            is_primary=is_primary,
            order=listing.images.count()
        )
        return success_response(
            data=VehicleImageSerializer(image).data,
            message="Rasm muvaffaqiyatli yuklandi",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='mark-sold')
    def mark_sold(self, request, pk=None):
        """Avtomobil sotilganda e'lonni SOLD statusiga o'tkazish"""
        listing = self.get_object()
        if listing.seller != request.user and not request.user.is_staff:
            return error_response(message="Ruxsat berilmagan.", status_code=status.HTTP_403_FORBIDDEN)

        listing.status = Listing.Status.SOLD
        listing.save(update_fields=['status'])
        return success_response(message="E'lon sotilgan deb belgilandi va umumiy bozordan olib tashlandi.")

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny], url_path='quick-create')
    def quick_create(self, request):
        """Tezkor e'lon berish (Frontend orqali oson e'lon joylash)"""
        data = request.data
        brand_name = data.get('brand', 'Chevrolet').strip()
        model_name = data.get('model', 'Cobalt').strip()
        
        try:
            year = int(data.get('year', 2023))
        except (ValueError, TypeError):
            year = 2023
            
        try:
            price = float(data.get('price', 15000))
        except (ValueError, TypeError):
            price = 15000.0

        try:
            mileage = int(data.get('mileage', 25000))
        except (ValueError, TypeError):
            mileage = 25000

        color = data.get('color', 'Oq').strip()
        city = data.get('city', 'Toshkent').strip()
        fuel_type = str(data.get('fuel_type', 'PETROL')).upper()
        transmission = str(data.get('transmission', 'AUTOMATIC')).upper()
        title = data.get('title') or f"{brand_name} {model_name} {year}"
        description = data.get('description', "Holati a'lo darajada.")
        phone = data.get('phone', '+998901234567')

        from apps.vehicles.models import Brand, VehicleModel, Vehicle
        from django.contrib.auth import get_user_model
        User = get_user_model()

        brand, _ = Brand.objects.get_or_create(name=brand_name)
        model, _ = VehicleModel.objects.get_or_create(brand=brand, name=model_name)

        user = request.user if request.user.is_authenticated else (
            User.objects.filter(is_superuser=True).first() or User.objects.first()
        )
        if not user:
            user = User.objects.create_user(phone=phone or '+998901234567')

        trans_map = {'AVTOMAT': 'AUTOMATIC', 'MEXANIKA': 'MANUAL', 'AUTOMATIC': 'AUTOMATIC', 'MANUAL': 'MANUAL'}
        transmission = trans_map.get(transmission, 'AUTOMATIC')

        fuel_map = {'BENZIN': 'PETROL', 'GAZ': 'GAS_METHANE', 'ELEKTR': 'ELECTRIC', 'GIBRID': 'HYBRID'}
        fuel_type = fuel_map.get(fuel_type, fuel_type if fuel_type in ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GAS_METHANE'] else 'PETROL')

        vehicle = Vehicle.objects.create(
            brand=brand,
            model=model,
            year=year,
            mileage=mileage,
            price=price,
            currency=Vehicle.Currency.USD,
            color=color,
            city=city,
            region=city,
            fuel_type=fuel_type,
            transmission=transmission,
            owner=user,
        )

        listing = Listing.objects.create(
            vehicle=vehicle,
            seller=user,
            title=title,
            description=f"{description}\n\nAloqa: {phone}",
            price=price,
            status=Listing.Status.ACTIVE,
            is_featured=False,
            is_vip=False
        )

        image_file = request.FILES.get('image') or request.FILES.get('file')
        if image_file:
            VehicleImage.objects.create(
                listing=listing,
                vehicle=vehicle,
                file=image_file,
                is_primary=True
            )

        serializer = ListingSerializer(listing, context={'request': request})
        return success_response(
            data=serializer.data,
            message="E'lon muvaffaqiyatli chop etildi!",
            status_code=status.HTTP_201_CREATED
        )



@extend_schema_view(
    list=extend_schema(summary="Foydalanuvchi saqlagan barcha e'lonlar (Favorites)")
)
class FavoriteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Favorite.objects.none()
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Favorite.objects.none()
        return Favorite.objects.filter(user=self.request.user).select_related(
            'listing__vehicle__brand', 'listing__vehicle__model', 'listing__seller'
        )
