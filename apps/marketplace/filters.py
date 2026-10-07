import django_filters
from .models import Listing


class ListingFilter(django_filters.FilterSet):
    brand = django_filters.UUIDFilter(field_name='vehicle__brand__id')
    model = django_filters.UUIDFilter(field_name='vehicle__model__id')
    body_type = django_filters.CharFilter(field_name='vehicle__body_type')
    fuel_type = django_filters.CharFilter(field_name='vehicle__fuel_type')
    transmission = django_filters.CharFilter(field_name='vehicle__transmission')
    drive_type = django_filters.CharFilter(field_name='vehicle__drive_type')
    city = django_filters.CharFilter(field_name='vehicle__city', lookup_expr='icontains')
    region = django_filters.CharFilter(field_name='vehicle__region', lookup_expr='icontains')

    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    year_min = django_filters.NumberFilter(field_name='vehicle__year', lookup_expr='gte')
    year_max = django_filters.NumberFilter(field_name='vehicle__year', lookup_expr='lte')

    mileage_min = django_filters.NumberFilter(field_name='vehicle__mileage', lookup_expr='gte')
    mileage_max = django_filters.NumberFilter(field_name='vehicle__mileage', lookup_expr='lte')

    is_vip = django_filters.BooleanFilter(field_name='is_vip')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')

    class Meta:
        model = Listing
        fields = [
            'brand', 'model', 'body_type', 'fuel_type', 'transmission',
            'drive_type', 'city', 'region', 'price_min', 'price_max',
            'year_min', 'year_max', 'mileage_min', 'mileage_max',
            'is_vip', 'is_featured'
        ]
