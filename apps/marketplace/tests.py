from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User
from apps.vehicles.models import Brand, VehicleModel, Vehicle
from apps.marketplace.models import Listing, Favorite


class MarketplaceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(phone="+998909998877", first_name="Sardor")
        self.moderator = User.objects.create_user(
            phone="+998901112244",
            role=User.Role.MODERATOR,
            is_staff=True
        )

        self.brand = Brand.objects.create(name="Chevrolet")
        self.model = VehicleModel.objects.create(brand=self.brand, name="Cobalt")
        self.vehicle = Vehicle.objects.create(
            brand=self.brand,
            model=self.model,
            year=2024,
            mileage=5000,
            price=12500,
            currency="USD",
            color="Oq (Gaziy)",
            city="Toshkent",
            region="Toshkent shahri",
            owner=self.user
        )

    def test_listing_creation_and_moderation_flow(self):
        # 1. Login user
        self.client.force_authenticate(user=self.user)

        # 2. Create listing
        listing_payload = {
            'vehicle': str(self.vehicle.id),
            'title': "Chevrolet Cobalt 2024 yangi holatda",
            'description': "Hech qanday kraska tegmagan, toza moshina",
            'price': "12500.00"
        }
        res_create = self.client.post('/api/v1/marketplace/listings/', listing_payload)
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        listing_id = res_create.data['data']['id']

        listing = Listing.objects.get(id=listing_id)
        self.assertEqual(listing.status, Listing.Status.PENDING_MODERATION)

        # 3. Public user sees 0 listings because status is PENDING_MODERATION
        self.client.logout()
        res_public = self.client.get('/api/v1/marketplace/listings/')
        self.assertEqual(res_public.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_public.data['data']), 0)

        # 4. Moderator approves listing
        self.client.force_authenticate(user=self.moderator)
        res_decide = self.client.post(
            f'/api/v1/moderation/listings/{listing_id}/decide/',
            {'action': 'approve'}
        )
        self.assertEqual(res_decide.status_code, status.HTTP_200_OK)

        listing.refresh_from_db()
        self.assertEqual(listing.status, Listing.Status.ACTIVE)

        # 5. Public user can now see it
        self.client.logout()
        res_public_after = self.client.get('/api/v1/marketplace/listings/')
        self.assertEqual(res_public_after.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_public_after.data['data']), 1)

    def test_favorite_toggle(self):
        listing = Listing.objects.create(
            vehicle=self.vehicle,
            seller=self.user,
            title="Chevrolet Cobalt 2024",
            description="Super holatda",
            price=12000,
            status=Listing.Status.ACTIVE
        )

        user2 = User.objects.create_user(phone="+998905554433")
        self.client.force_authenticate(user=user2)

        # Toggle favorite ON
        res_fav_on = self.client.post(f'/api/v1/marketplace/listings/{listing.id}/favorite/')
        self.assertEqual(res_fav_on.status_code, status.HTTP_200_OK)
        self.assertTrue(res_fav_on.data['data']['is_favorited'])
        self.assertEqual(res_fav_on.data['data']['favorites_count'], 1)

        # Toggle favorite OFF
        res_fav_off = self.client.post(f'/api/v1/marketplace/listings/{listing.id}/favorite/')
        self.assertEqual(res_fav_off.status_code, status.HTTP_200_OK)
        self.assertFalse(res_fav_off.data['data']['is_favorited'])
        self.assertEqual(res_fav_off.data['data']['favorites_count'], 0)
