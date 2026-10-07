from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PhoneOTP, SellerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('phone', 'first_name', 'last_name', 'role', 'is_verified', 'is_active', 'created_at')
    list_filter = ('role', 'is_verified', 'is_active')
    search_fields = ('phone', 'email', 'first_name', 'last_name', 'username')
    ordering = ('-created_at',)
    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('Shaxsiy ma\'lumotlar', {'fields': ('first_name', 'last_name', 'email', 'username', 'avatar')}),
        ('Ruxsatlar va Rol', {'fields': ('role', 'is_verified', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'password1', 'password2', 'role', 'first_name', 'last_name'),
        }),
    )


@admin.register(PhoneOTP)
class PhoneOTPAdmin(admin.ModelAdmin):
    list_display = ('phone', 'code', 'attempts', 'is_used', 'expires_at', 'created_at')
    list_filter = ('is_used',)
    search_fields = ('phone',)
    readonly_fields = ('created_at',)


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'seller_type', 'verification_status', 'phone_verified', 'identity_verified', 'rating')
    list_filter = ('seller_type', 'verification_status', 'phone_verified', 'identity_verified')
    search_fields = ('user__phone', 'user__first_name', 'user__last_name')
