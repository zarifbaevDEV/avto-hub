import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from common.models import TimeStampedModel


class UserManager(BaseUserManager):
    """
    Custom user manager supporting phone number and email as identifiers.
    """
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("Telefon raqami kiritilishi shart.")
        
        extra_fields.setdefault('is_active', True)
        if 'email' in extra_fields and extra_fields['email']:
            extra_fields['email'] = self.normalize_email(extra_fields['email'])

        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.SUPER_ADMIN)
        extra_fields.setdefault('is_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser is_staff=True bo'lishi kerak.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser is_superuser=True bo'lishi kerak.")

        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Custom User Model conforming to AvtoHub Specification:
    User
    ├── id
    ├── phone
    ├── email
    ├── username
    ├── first_name
    ├── last_name
    ├── avatar
    ├── role
    ├── is_verified
    ├── is_active
    ├── created_at
    └── updated_at
    """
    class Role(models.TextChoices):
        USER = 'USER', 'Foydalanuvchi'
        DEALER = 'DEALER', 'Diler / Avtosalon'
        SERVICE_OWNER = 'SERVICE_OWNER', 'Avtoservis egasi'
        PARTS_SELLER = 'PARTS_SELLER', 'Ehtiyot qismlar sotuvchisi'
        EMPLOYEE = 'EMPLOYEE', 'Xodim'
        ACCOUNTANT = 'ACCOUNTANT', 'Buxgalter / Kassa'
        MANAGER = 'MANAGER', 'Menejer'
        MODERATOR = 'MODERATOR', 'Moderator'
        ADMIN = 'ADMIN', 'Admin'
        SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, db_index=True, verbose_name="Telefon")
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True, db_index=True, verbose_name="Email")
    username = models.CharField(max_length=150, unique=True, null=True, blank=True, verbose_name="Username")
    
    first_name = models.CharField(max_length=150, blank=True, verbose_name="Ism")
    last_name = models.CharField(max_length=150, blank=True, verbose_name="Familiya")
    age = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name="Yoshi")
    city = models.CharField(max_length=100, blank=True, default="Toshkent", verbose_name="Shahar / Viloyat")
    gender = models.CharField(max_length=10, blank=True, choices=[('M', 'Erkak'), ('F', 'Ayol')], verbose_name="Jinsi")
    avatar = models.ImageField(upload_to='avatars/%Y/%m/', null=True, blank=True, verbose_name="Rasm")
    
    role = models.CharField(
        max_length=30,
        choices=Role.choices,
        default=Role.USER,
        db_index=True,
        verbose_name="Rol"
    )
    
    is_verified = models.BooleanField(default=False, verbose_name="Tasdiqlangan")
    is_active = models.BooleanField(default=True, verbose_name="Faol")
    is_staff = models.BooleanField(default=False, verbose_name="Staff status")

    objects = UserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "Foydalanuvchi"
        verbose_name_plural = "Foydalanuvchilar"
        ordering = ['-created_at']

    def __str__(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.phone

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.phone


class PhoneOTP(TimeStampedModel):
    """
    OTP storage for phone verification & passwordless login.
    """
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=10)
    attempts = models.PositiveSmallIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "Telefon OTP"
        verbose_name_plural = "Telefon OTP kodlar"
        ordering = ['-created_at']

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at


class SellerProfile(TimeStampedModel):
    """
    Seller profile conforming to Section 11:
    Seller
    ├── user
    ├── type
    ├── verification_status
    ├── phone_verified
    ├── identity_verified
    ├── rating
    ├── total_sales
    └── created_at
    """
    class SellerType(models.TextChoices):
        INDIVIDUAL = 'INDIVIDUAL', 'Jismoniy shaxs'
        DEALER = 'DEALER', 'Rasmiy diler'
        STORE = 'STORE', 'Do\'kon / Magazin'

    class VerificationStatus(models.TextChoices):
        UNVERIFIED = 'UNVERIFIED', 'Tasdiqlanmagan'
        PENDING = 'PENDING', 'Kutilmoqda'
        VERIFIED = 'VERIFIED', 'Tasdiqlangan'
        REJECTED = 'REJECTED', 'Rad etilgan'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    seller_type = models.CharField(max_length=20, choices=SellerType.choices, default=SellerType.INDIVIDUAL)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_index=True
    )
    phone_verified = models.BooleanField(default=False)
    identity_verified = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    total_sales = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Sotuvchi profili"
        verbose_name_plural = "Sotuvchi profillari"

    def __str__(self):
        return f"{self.user} ({self.get_verification_status_display()})"
