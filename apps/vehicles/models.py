import uuid
from django.db import models
from django.utils.text import slugify
from django.conf import settings
from common.models import TimeStampedModel


class Brand(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True, db_index=True, verbose_name="Marka nomi")
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    logo = models.ImageField(upload_to='brands/logos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Avtomobil markasi"
        verbose_name_plural = "Avtomobil markalari"
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class VehicleModel(TimeStampedModel):
    class BodyType(models.TextChoices):
        SEDAN = 'SEDAN', 'Sedan'
        HATCHBACK = 'HATCHBACK', 'Hetchbek'
        SUV = 'SUV', 'SUV / Yo‘ltanlamas'
        CROSSOVER = 'CROSSOVER', 'Krossover'
        COUPE = 'COUPE', 'Kupe'
        MINIVAN = 'MINIVAN', 'Miniven'
        PICKUP = 'PICKUP', 'Pikap'
        WAGON = 'WAGON', 'Universal'
        CABRIOLET = 'CABRIOLET', 'Kabriolet'

    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='models', verbose_name="Marka")
    name = models.CharField(max_length=100, db_index=True, verbose_name="Model nomi")
    slug = models.SlugField(max_length=120, blank=True)
    body_type = models.CharField(max_length=30, choices=BodyType.choices, default=BodyType.SEDAN)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Avtomobil modeli"
        verbose_name_plural = "Avtomobil modellari"
        unique_together = ('brand', 'name')
        ordering = ['brand__name', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.brand.name}-{self.name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.brand.name} {self.name}"


class Generation(TimeStampedModel):
    model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE, related_name='generations')
    name = models.CharField(max_length=100, verbose_name="Avlod nomi")
    year_from = models.PositiveIntegerField(verbose_name="Boshlangan yili")
    year_to = models.PositiveIntegerField(null=True, blank=True, verbose_name="Tugagan yili (hozirgacha bo'lsa bo'sh)")
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Model avlodi"
        verbose_name_plural = "Model avlodlari"
        ordering = ['-year_from']

    def __str__(self):
        period = f"{self.year_from}-{self.year_to or 'hozir'}"
        return f"{self.model} ({self.name}, {period})"


class Modification(TimeStampedModel):
    class FuelType(models.TextChoices):
        PETROL = 'PETROL', 'Benzin'
        DIESEL = 'DIESEL', 'Dizel'
        GAS_METHANE = 'GAS_METHANE', 'Metan gaz'
        GAS_PROPANE = 'GAS_PROPANE', 'Propan gaz'
        ELECTRIC = 'ELECTRIC', 'Elektr'
        HYBRID = 'HYBRID', 'Gibrid'

    class Transmission(models.TextChoices):
        MANUAL = 'MANUAL', 'Mexanika'
        AUTOMATIC = 'AUTOMATIC', 'Avtomat'
        ROBOT = 'ROBOT', 'Robot'
        VARIATOR = 'VARIATOR', 'Variator (CVT)'

    class DriveType(models.TextChoices):
        FWD = 'FWD', 'Oldi uzatma (Old tortar)'
        RWD = 'RWD', 'Orqa uzatma (Orqa tortar)'
        AWD = 'AWD', 'To\'liq uzatma (Doimiy 4x4 / AWD)'
        FOUR_WD = '4WD', 'Ulanuvchi to\'liq uzatma (Part-time 4WD)'

    generation = models.ForeignKey(Generation, on_delete=models.CASCADE, related_name='modifications')
    engine = models.CharField(max_length=50, verbose_name="Dvigatel hajmi / kodi")
    fuel_type = models.CharField(max_length=20, choices=FuelType.choices, default=FuelType.PETROL)
    transmission = models.CharField(max_length=20, choices=Transmission.choices, default=Transmission.AUTOMATIC)
    drive_type = models.CharField(max_length=20, choices=DriveType.choices, default=DriveType.FWD)
    power = models.PositiveIntegerField(null=True, blank=True, verbose_name="Ot kuchi (HP)")

    class Meta:
        verbose_name = "Modifikatsiya"
        verbose_name_plural = "Modifikatsiyalar"

    def __str__(self):
        return f"{self.generation.model} {self.engine} ({self.get_transmission_display()}, {self.get_fuel_type_display()})"


class Vehicle(TimeStampedModel):
    """
    Vehicle entity conforming to Section 6:
    Vehicle
    ├── id
    ├── brand
    ├── model
    ├── generation
    ├── modification
    ├── year
    ├── mileage
    ├── price
    ├── currency
    ├── color
    ├── body_type
    ├── fuel_type
    ├── transmission
    ├── engine
    ├── drive_type
    ├── VIN
    ├── city
    ├── region
    ├── owner
    └── created_at
    """
    class Currency(models.TextChoices):
        USD = 'USD', 'USD ($)'
        UZS = 'UZS', 'UZS (So\'m)'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name='vehicles')
    model = models.ForeignKey(VehicleModel, on_delete=models.PROTECT, related_name='vehicles')
    generation = models.ForeignKey(Generation, on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')
    modification = models.ForeignKey(Modification, on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')

    year = models.PositiveIntegerField(db_index=True, verbose_name="Ishlab chiqarilgan yili")
    mileage = models.PositiveIntegerField(db_index=True, verbose_name="Yurgan masofasi (km)")
    price = models.DecimalField(max_digits=12, decimal_places=2, db_index=True, verbose_name="Narxi")
    currency = models.CharField(max_length=10, choices=Currency.choices, default=Currency.USD)
    color = models.CharField(max_length=50, verbose_name="Rangi")

    body_type = models.CharField(max_length=30, choices=VehicleModel.BodyType.choices, default=VehicleModel.BodyType.SEDAN)
    fuel_type = models.CharField(max_length=20, choices=Modification.FuelType.choices, default=Modification.FuelType.PETROL)
    transmission = models.CharField(max_length=20, choices=Modification.Transmission.choices, default=Modification.Transmission.MANUAL)
    engine = models.CharField(max_length=50, blank=True, verbose_name="Dvigatel")
    drive_type = models.CharField(max_length=20, choices=Modification.DriveType.choices, default=Modification.DriveType.FWD)

    vin = models.CharField(max_length=17, blank=True, db_index=True, verbose_name="VIN raqami")
    city = models.CharField(max_length=100, db_index=True, verbose_name="Shahar")
    region = models.CharField(max_length=100, db_index=True, verbose_name="Viloyat")

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vehicles')

    class Meta:
        verbose_name = "Avtomobil"
        verbose_name_plural = "Avtomobillar"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.brand.name} {self.model.name} ({self.year}) — {self.price} {self.currency}"
