import django_filters
from .models import Vehicle


class VehicleFilter(django_filters.FilterSet):
    year_min = django_filters.NumberFilter(field_name='year', lookup_expr='gte')
    year_max = django_filters.NumberFilter(field_name='year', lookup_expr='lte')
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    mileage_min = django_filters.NumberFilter(field_name='mileage', lookup_expr='gte')
    mileage_max = django_filters.NumberFilter(field_name='mileage', lookup_expr='lte')

    class Meta:
        model = Vehicle
        fields = [
            'brand', 'model', 'generation', 'body_type',
            'fuel_type', 'transmission', 'drive_type', 'city', 'region',
            'year_min', 'year_max', 'price_min', 'price_max', 'mileage_min', 'mileage_max'
        ]
