from django.core.management.base import BaseCommand
from apps.vehicles.models import Brand, VehicleModel, Generation, Modification


class Command(BaseCommand):
    help = "Seeds initial authentic automotive brands and models (Chevrolet, BYD, Toyota, Kia, Hyundai)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding automotive database...")

        # 1. CHEVROLET
        chevrolet, _ = Brand.objects.get_or_create(name="Chevrolet")

        cobalt, _ = VehicleModel.objects.get_or_create(
            brand=chevrolet,
            name="Cobalt",
            defaults={'body_type': VehicleModel.BodyType.SEDAN}
        )
        cobalt_gen, _ = Generation.objects.get_or_create(
            model=cobalt,
            name="2-avlod (Facelift)",
            year_from=2013,
            year_to=None
        )
        Modification.objects.get_or_create(
            generation=cobalt_gen,
            engine="1.5 DOHC B15D2",
            defaults={
                'fuel_type': Modification.FuelType.PETROL,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 106
            }
        )
        Modification.objects.get_or_create(
            generation=cobalt_gen,
            engine="1.5 DOHC B15D2 (Mexanika)",
            defaults={
                'fuel_type': Modification.FuelType.PETROL,
                'transmission': Modification.Transmission.MANUAL,
                'drive_type': Modification.DriveType.FWD,
                'power': 106
            }
        )

        gentra, _ = VehicleModel.objects.get_or_create(
            brand=chevrolet,
            name="Lacetti / Gentra",
            defaults={'body_type': VehicleModel.BodyType.SEDAN}
        )
        gentra_gen, _ = Generation.objects.get_or_create(
            model=gentra,
            name="1-avlod",
            year_from=2013,
            year_to=2024
        )
        Modification.objects.get_or_create(
            generation=gentra_gen,
            engine="1.5 DOHC",
            defaults={
                'fuel_type': Modification.FuelType.PETROL,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 107
            }
        )

        tracker, _ = VehicleModel.objects.get_or_create(
            brand=chevrolet,
            name="Tracker",
            defaults={'body_type': VehicleModel.BodyType.CROSSOVER}
        )
        tracker_gen, _ = Generation.objects.get_or_create(
            model=tracker,
            name="Tracker 2 (Redline / Premier)",
            year_from=2021,
            year_to=None
        )
        Modification.objects.get_or_create(
            generation=tracker_gen,
            engine="1.2 Turbo Ecotec",
            defaults={
                'fuel_type': Modification.FuelType.PETROL,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 132
            }
        )

        # 2. BYD
        byd, _ = Brand.objects.get_or_create(name="BYD")

        song_plus, _ = VehicleModel.objects.get_or_create(
            brand=byd,
            name="Song Plus",
            defaults={'body_type': VehicleModel.BodyType.SUV}
        )
        song_gen, _ = Generation.objects.get_or_create(
            model=song_plus,
            name="Champion Edition",
            year_from=2023,
            year_to=None
        )
        Modification.objects.get_or_create(
            generation=song_gen,
            engine="1.5 DM-i (Plug-in Hybrid)",
            defaults={
                'fuel_type': Modification.FuelType.HYBRID,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 197
            }
        )
        Modification.objects.get_or_create(
            generation=song_gen,
            engine="EV 87 kWh (Electric)",
            defaults={
                'fuel_type': Modification.FuelType.ELECTRIC,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 218
            }
        )

        chazor, _ = VehicleModel.objects.get_or_create(
            brand=byd,
            name="Chazor",
            defaults={'body_type': VehicleModel.BodyType.SEDAN}
        )
        chazor_gen, _ = Generation.objects.get_or_create(
            model=chazor,
            name="DM-i",
            year_from=2022,
            year_to=None
        )
        Modification.objects.get_or_create(
            generation=chazor_gen,
            engine="1.5 DM-i Hybrid",
            defaults={
                'fuel_type': Modification.FuelType.HYBRID,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 180
            }
        )

        # 3. KIA & HYUNDAI & TOYOTA
        kia, _ = Brand.objects.get_or_create(name="Kia")
        k5, _ = VehicleModel.objects.get_or_create(
            brand=kia,
            name="K5",
            defaults={'body_type': VehicleModel.BodyType.SEDAN}
        )
        k5_gen, _ = Generation.objects.get_or_create(
            model=k5,
            name="DL3",
            year_from=2020,
            year_to=None
        )
        Modification.objects.get_or_create(
            generation=k5_gen,
            engine="2.5 GDI 8AT",
            defaults={
                'fuel_type': Modification.FuelType.PETROL,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 194
            }
        )

        toyota, _ = Brand.objects.get_or_create(name="Toyota")
        camry, _ = VehicleModel.objects.get_or_create(
            brand=toyota,
            name="Camry",
            defaults={'body_type': VehicleModel.BodyType.SEDAN}
        )
        camry_gen, _ = Generation.objects.get_or_create(
            model=camry,
            name="XV70",
            year_from=2018,
            year_to=2024
        )
        Modification.objects.get_or_create(
            generation=camry_gen,
            engine="2.5 Dual VVT-i 8AT",
            defaults={
                'fuel_type': Modification.FuelType.PETROL,
                'transmission': Modification.Transmission.AUTOMATIC,
                'drive_type': Modification.DriveType.FWD,
                'power': 203
            }
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded real automotive catalog data!"))
