from datetime import timedelta
import logging
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiResponse

from common.responses import success_response, error_response
from common.utils import generate_otp_code
from .models import User, PhoneOTP, SellerProfile
from .serializers import (
    UserSerializer,
    SendOTPSerializer,
    VerifyOTPSerializer,
    UserRegisterSerializer,
    UserLoginSerializer,
    ChangePasswordSerializer,
    LogoutSerializer,
)

logger = logging.getLogger(__name__)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Telefon raqamiga OTP kod jo'natish",
        request=SendOTPSerializer,
        responses={200: OpenApiResponse(description="OTP jo'natildi")}
    )
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors, message="Telefon raqami noto'g'ri")

        phone = serializer.validated_data['phone']

        # Check resend cooldown
        cooldown_threshold = timezone.now() - timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
        recent_otp = PhoneOTP.objects.filter(phone=phone, created_at__gte=cooldown_threshold).first()
        if recent_otp:
            remaining = int((recent_otp.created_at + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS) - timezone.now()).total_seconds())
            return error_response(
                message=f"Iltimos, {max(1, remaining)} soniyadan so'ng qayta urinib ko'ring.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Generate OTP
        code = "123456" if settings.MOCK_SMS_OTP else generate_otp_code(6)
        expires_at = timezone.now() + timedelta(seconds=settings.OTP_EXPIRY_SECONDS)

        PhoneOTP.objects.create(
            phone=phone,
            code=code,
            expires_at=expires_at
        )

        logger.info(f"[SMS OTP] Phone: {phone} -> Code: {code}")

        return success_response(
            data={"phone": phone, "expires_in": settings.OTP_EXPIRY_SECONDS, "mock_code": code if settings.MOCK_SMS_OTP else None},
            message="Tasdiqlash kodi telefoningizga yuborildi."
        )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="OTP kodni tekshirish va tizimga kirish",
        request=VerifyOTPSerializer,
        responses={200: OpenApiResponse(description="Muvaffaqiyatli autentifikatsiya")}
    )
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        phone = serializer.validated_data['phone']
        code = serializer.validated_data['code']

        otp_record = PhoneOTP.objects.filter(phone=phone, is_used=False).order_by('-created_at').first()

        if not otp_record:
            return error_response(message="Tasdiqlash kodi topilmadi yoki eskirgan.")

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            return error_response(message="Urinishlar soni tugadi. Yangi kod so'rang.", status_code=status.HTTP_429_TOO_MANY_REQUESTS)

        if not otp_record.is_valid():
            return error_response(message="Kodning amal qilish muddati tugagan.")

        if otp_record.code != code:
            otp_record.attempts += 1
            otp_record.save(update_fields=['attempts'])
            return error_response(message="Kiritilgan tasdiqlash kodi noto'g'ri.")

        # Mark OTP as used
        otp_record.is_used = True
        otp_record.save(update_fields=['is_used'])

        # Get or create user
        user, created = User.objects.get_or_create(phone=phone)
        if created:
            user.is_verified = True
            user.save(update_fields=['is_verified'])
            SellerProfile.objects.create(user=user, phone_verified=True)
        else:
            if not user.is_verified:
                user.is_verified = True
                user.save(update_fields=['is_verified'])

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return success_response(
            data={'tokens': tokens, 'user': user_data, 'is_new_user': created},
            message="Muvaffaqiyatli tasdiqlandi"
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Yangi foydalanuvchi ro'yxatdan o'tishi",
        request=UserRegisterSerializer,
        responses={201: OpenApiResponse(description="Foydalanuvchi yaratildi")}
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors, message="Ro'yxatdan o'tish ma'lumotlari yaroqsiz")

        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return success_response(
            data={'tokens': tokens, 'user': UserSerializer(user).data},
            message="Muvaffaqiyatli ro'yxatdan o'tdingiz",
            status_code=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Telefon va parol orqali tizimga kirish",
        request=UserLoginSerializer,
        responses={200: OpenApiResponse(description="Tizimga muvaffaqiyatli kirildi")}
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors, message="Telefon yoki parol noto'g'ri")

        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)
        return success_response(
            data={'tokens': tokens, 'user': UserSerializer(user).data},
            message="Xush kelibsiz!"
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Joriy foydalanuvchi ma'lumotlari", responses={200: UserSerializer})
    def get(self, request):
        return success_response(data=UserSerializer(request.user).data)

    @extend_schema(summary="Foydalanuvchi profilini yangilash", request=UserSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)
        serializer.save()
        return success_response(data=serializer.data, message="Profil ma'lumotlari yangilandi")


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Parolni o'zgartirish", request=ChangePasswordSerializer, responses={200: OpenApiResponse(description="Parol yangilandi")})
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return error_response(errors=serializer.errors)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        return success_response(message="Parolingiz muvaffaqiyatli yangilandi.")


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Tizimdan chiqish (Logout)", request=LogoutSerializer, responses={200: OpenApiResponse(description="Chiqildi")})
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return success_response(message="Tizimdan muvaffaqiyatli chiqildi.")
