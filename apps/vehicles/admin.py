from django.contrib import admin
from .models import Brand, VehicleModel, Generation, Modification, Vehicle


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}


@admin.register(VehicleModel)
class VehicleModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'body_type', 'is_active')
    list_filter = ('brand', 'body_type', 'is_active')
    search_fields = ('name', 'brand__name')


@admin.register(Generation)
class GenerationAdmin(admin.ModelAdmin):
    list_display = ('name', 'model', 'year_from', 'year_to')
    list_filter = ('model__brand', 'model')
    search_fields = ('name', 'model__name')


@admin.register(Modification)
class ModificationAdmin(admin.ModelAdmin):
    list_display = ('generation', 'engine', 'fuel_type', 'transmission', 'drive_type', 'power')
    list_filter = ('fuel_type', 'transmission', 'drive_type')
    search_fields = ('engine', 'generation__model__name')


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'year', 'price', 'currency', 'mileage', 'owner', 'city', 'created_at')
    list_filter = ('brand', 'fuel_type', 'transmission', 'currency', 'city')
    search_fields = ('brand__name', 'model__name', 'vin', 'owner__phone')
