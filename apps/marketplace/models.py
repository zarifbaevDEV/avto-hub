import uuid
from django.db import models
from django.conf import settings
from common.models import TimeStampedModel
from apps.vehicles.models import Vehicle


class Listing(TimeStampedModel):
    """
    Marketplace listing model conforming to Section 7:
    Listing
    ├── id
    ├── vehicle
    ├── seller
    ├── title
    ├── description
    ├── price
    ├── status
    ├── views
    ├── favorites
    ├── is_featured
    ├── is_vip
    ├── published_at
    ├── expires_at
    └── created_at
    """
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Qoralama'
        PENDING_MODERATION = 'PENDING_MODERATION', 'Moderatsiyada'
        ACTIVE = 'ACTIVE', 'Faol / Sotuvda'
        RESERVED = 'RESERVED', 'Band qilingan'
        SOLD = 'SOLD', 'Sotilgan'
        REJECTED = 'REJECTED', 'Rad etilgan'
        EXPIRED = 'EXPIRED', 'Muddati tugagan'
        BLOCKED = 'BLOCKED', 'Bloklangan'
        ARCHIVED = 'ARCHIVED', 'Arxivlangan'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='listings')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')

    title = models.CharField(max_length=255, db_index=True, verbose_name="E'lon sarlavhasi")
    description = models.TextField(verbose_name="Tavsif")
    price = models.DecimalField(max_digits=12, decimal_places=2, db_index=True, verbose_name="Narxi")

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_MODERATION,
        db_index=True
    )

    views = models.PositiveIntegerField(default=0, verbose_name="Ko'rishlar soni")
    favorites_count = models.PositiveIntegerField(default=0, verbose_name="Tanlanganlar soni")

    is_featured = models.BooleanField(default=False, db_index=True, verbose_name="Tavsiya etilgan")
    is_vip = models.BooleanField(default=False, db_index=True, verbose_name="VIP e'lon")

    rejection_reason = models.TextField(blank=True, null=True, verbose_name="Rad etish sababi")

    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "E'lon"
        verbose_name_plural = "E'lonlar"
        ordering = ['-is_vip', '-is_featured', '-created_at']

    def __str__(self):
        return f"{self.title} — {self.price} ({self.get_status_display()})"


class VehicleImage(TimeStampedModel):
    """
    Vehicle image model conforming to Section 9:
    VehicleImage
    ├── vehicle
    ├── listing
    ├── file
    ├── order
    ├── is_primary
    ├── ai_verified
    ├── ai_confidence
    └── created_at
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, null=True, blank=True, related_name='images')
    file = models.ImageField(upload_to='vehicles/%Y/%m/', verbose_name="Rasm")
    order = models.PositiveSmallIntegerField(default=0, verbose_name="Tartibi")
    is_primary = models.BooleanField(default=False, verbose_name="Asosiy rasm")

    ai_verified = models.BooleanField(default=False, verbose_name="AI tekshiruvidan o'tgan")
    ai_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name="AI ishonchlilik darajasi (%)")

    class Meta:
        verbose_name = "Avtomobil rasmi"
        verbose_name_plural = "Avtomobil rasmlari"
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Image for {self.listing.title} (Order: {self.order})"


class Favorite(TimeStampedModel):
    """
    Favorite listing model conforming to Section 26:
    Unique constraint: user + listing
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='favorites')

    class Meta:
        verbose_name = "Saqlangan e'lon"
        verbose_name_plural = "Saqlangan e'lonlar"
        unique_together = ('user', 'listing')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} ❤️ {self.listing.title}"


class ListingPromotion(TimeStampedModel):
    """
    Listing promotion conforming to Section 38:
    Package: TOP, VIP, FEATURED, URGENT
    """
    class Package(models.TextChoices):
        TOP = 'TOP', 'Top o\'rinda'
        VIP = 'VIP', 'VIP e\'lon'
        FEATURED = 'FEATURED', 'Tavsiya etilgan'
        URGENT = 'URGENT', 'Shoshilinch'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='promotions')
    package = models.CharField(max_length=20, choices=Package.choices, default=Package.VIP)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "E'lon reklamasi"
        verbose_name_plural = "E'lon reklamalari"
