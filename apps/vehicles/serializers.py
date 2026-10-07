from rest_framework import serializers
from .models import Brand, VehicleModel, Generation, Modification, Vehicle
from apps.accounts.serializers import UserSerializer
from common.utils import validate_vin


class ModificationSerializer(serializers.ModelSerializer):
    transmission_display = serializers.CharField(source='get_transmission_display', read_only=True)
    fuel_type_display = serializers.CharField(source='get_fuel_type_display', read_only=True)
    drive_type_display = serializers.CharField(source='get_drive_type_display', read_only=True)

    class Meta:
        model = Modification
        fields = [
            'id', 'generation', 'engine', 'fuel_type', 'fuel_type_display',
            'transmission', 'transmission_display', 'drive_type', 'drive_type_display', 'power'
        ]


class GenerationSerializer(serializers.ModelSerializer):
    modifications = ModificationSerializer(many=True, read_only=True)

    class Meta:
        model = Generation
        fields = ['id', 'model', 'name', 'year_from', 'year_to', 'description', 'modifications']


class VehicleModelSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    body_type_display = serializers.CharField(source='get_body_type_display', read_only=True)

    class Meta:
        model = VehicleModel
        fields = ['id', 'brand', 'brand_name', 'name', 'slug', 'body_type', 'body_type_display', 'is_active']


class BrandSerializer(serializers.ModelSerializer):
    models_count = serializers.IntegerField(source='models.count', read_only=True)

    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'is_active', 'models_count']


class VehicleSerializer(serializers.ModelSerializer):
    brand_detail = BrandSerializer(source='brand', read_only=True)
    model_detail = VehicleModelSerializer(source='model', read_only=True)
    generation_detail = GenerationSerializer(source='generation', read_only=True)
    modification_detail = ModificationSerializer(source='modification', read_only=True)
    owner_detail = UserSerializer(source='owner', read_only=True)

    class Meta:
        model = Vehicle
        fields = [
            'id', 'brand', 'brand_detail', 'model', 'model_detail',
            'generation', 'generation_detail', 'modification', 'modification_detail',
            'year', 'mileage', 'price', 'currency', 'color', 'body_type',
            'fuel_type', 'transmission', 'engine', 'drive_type', 'vin',
            'city', 'region', 'owner', 'owner_detail', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_vin(self, value):
        if value and not validate_vin(value):
            raise serializers.ValidationError("VIN raqamining formati noto'g'ri (17 ta belgi, I, O, Q harflarisiz).")
        return value.upper() if value else value

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
