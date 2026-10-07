from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Listing, VehicleImage, Favorite, ListingPromotion
from apps.vehicles.serializers import VehicleSerializer
from apps.accounts.serializers import UserSerializer


class VehicleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleImage
        fields = ['id', 'listing', 'vehicle', 'file', 'order', 'is_primary', 'ai_verified', 'ai_confidence', 'created_at']
        read_only_fields = ['id', 'ai_verified', 'ai_confidence', 'created_at']


class ListingSerializer(serializers.ModelSerializer):
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    seller_detail = UserSerializer(source='seller', read_only=True)
    images = VehicleImageSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'vehicle', 'vehicle_detail', 'seller', 'seller_detail',
            'title', 'description', 'price', 'status', 'status_display',
            'views', 'favorites_count', 'is_featured', 'is_vip',
            'images', 'is_favorited', 'rejection_reason',
            'published_at', 'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'seller', 'views', 'favorites_count', 'is_favorited',
            'rejection_reason', 'published_at', 'expires_at', 'created_at', 'updated_at'
        ]

    @extend_schema_field(serializers.BooleanField())
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, listing=obj).exists()
        return False


class ListingCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Listing
        fields = [
            'id', 'vehicle', 'title', 'description', 'price',
            'status', 'is_featured', 'is_vip'
        ]
        read_only_fields = ['id', 'status', 'is_featured', 'is_vip']

    def validate_vehicle(self, vehicle):
        request = self.context.get('request')
        if vehicle.owner != request.user and not request.user.is_staff:
            raise serializers.ValidationError("Siz faqat o'zingizga tegishli avtomobil uchun e'lon yarata olasiz.")
        return vehicle

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['seller'] = user
        # By default, new listings go to PENDING_MODERATION
        validated_data['status'] = Listing.Status.PENDING_MODERATION
        return super().create(validated_data)


class FavoriteSerializer(serializers.ModelSerializer):
    listing_detail = ListingSerializer(source='listing', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'listing', 'listing_detail', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ListingPromotionSerializer(serializers.ModelSerializer):
    package_display = serializers.CharField(source='get_package_display', read_only=True)

    class Meta:
        model = ListingPromotion
        fields = ['id', 'listing', 'package', 'package_display', 'start_at', 'end_at', 'price', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
