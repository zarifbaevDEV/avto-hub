from django.contrib import admin
from .models import Listing, VehicleImage, Favorite, ListingPromotion


class VehicleImageInline(admin.TabularInline):
    model = VehicleImage
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('title', 'seller', 'price', 'status', 'is_vip', 'is_featured', 'views', 'favorites_count', 'created_at')
    list_filter = ('status', 'is_vip', 'is_featured')
    search_fields = ('title', 'seller__phone', 'vehicle__brand__name', 'vehicle__model__name')
    inlines = [VehicleImageInline]
    actions = ['approve_listings', 'reject_listings']

    def approve_listings(self, request, queryset):
        queryset.update(status=Listing.Status.ACTIVE)
        self.message_user(request, f"{queryset.count()} ta e'lon faollashtirildi.")
    approve_listings.short_description = "Tanlangan e'lonlarni tasdiqlash (ACTIVE qilish)"

    def reject_listings(self, request, queryset):
        queryset.update(status=Listing.Status.REJECTED)
        self.message_user(request, f"{queryset.count()} ta e'lon rad etildi.")
    reject_listings.short_description = "Tanlangan e'lonlarni rad etish"


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'listing', 'created_at')
    search_fields = ('user__phone', 'listing__title')


@admin.register(ListingPromotion)
class ListingPromotionAdmin(admin.ModelAdmin):
    list_display = ('listing', 'package', 'price', 'start_at', 'end_at', 'is_active')
    list_filter = ('package', 'is_active')
