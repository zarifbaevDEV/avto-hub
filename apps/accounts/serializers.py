from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, PhoneOTP, SellerProfile
from common.utils import normalize_phone


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'phone', 'email', 'username', 'first_name',
            'last_name', 'full_name', 'avatar', 'role',
            'is_verified', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'is_verified', 'is_active', 'created_at', 'updated_at']


class SendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        normalized = normalize_phone(value)
        if len(normalized) < 9:
            raise serializers.ValidationError("Telefon raqami noto'g'ri formatda.")
        return normalized


class VerifyOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    code = serializers.CharField(max_length=10)

    def validate_phone(self, value):
        return normalize_phone(value)


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['phone', 'password', 'password_confirm', 'first_name', 'last_name', 'email', 'role']

    def validate_phone(self, value):
        phone = normalize_phone(value)
        if User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError("Ushbu telefon raqami allaqachon ro'yxatdan o'tgan.")
        return phone

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Parollar bir xil emas."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.get('role', User.Role.USER)
        # Prevent regular registration with ADMIN/SUPER_ADMIN roles directly
        if role in [User.Role.ADMIN, User.Role.SUPER_ADMIN, User.Role.MODERATOR]:
            role = User.Role.USER
        validated_data['role'] = role

        user = User.objects.create_user(**validated_data)
        SellerProfile.objects.create(user=user)
        return user


class UserLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        phone = normalize_phone(attrs.get('phone'))
        password = attrs.get('password')

        user = authenticate(username=phone, password=password)
        if not user:
            raise serializers.ValidationError("Telefon raqami yoki parol noto'g'ri.")
        if not user.is_active:
            raise serializers.ValidationError("Ushbu hisob faolsizlantirilgan.")

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Eski parol noto'g'ri.")
        return value


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=True, help_text="Refresh token to blacklist")
