from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, PhoneOTP


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.phone = "+998901234567"

    def test_send_and_verify_otp(self):
        # 1. Send OTP
        res = self.client.post(reverse('auth-send-otp'), {'phone': self.phone})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['success'])

        otp = PhoneOTP.objects.filter(phone=self.phone).first()
        self.assertIsNotNone(otp)

        # 2. Verify OTP
        res_verify = self.client.post(reverse('auth-verify-otp'), {
            'phone': self.phone,
            'code': otp.code
        })
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', res_verify.data['data'])
        self.assertIn('access', res_verify.data['data']['tokens'])

        user = User.objects.get(phone=self.phone)
        self.assertTrue(user.is_verified)

    def test_register_and_login(self):
        # Register
        reg_data = {
            'phone': '+998911112233',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Ali',
            'last_name': 'Valiyev'
        }
        res_reg = self.client.post(reverse('auth-register'), reg_data)
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_reg.data['success'])

        # Login
        res_login = self.client.post(reverse('auth-login'), {
            'phone': '+998911112233',
            'password': 'SecurePassword123!'
        })
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_login.data['data']['tokens'])
