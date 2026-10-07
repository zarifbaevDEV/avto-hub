from rest_framework.routers import DefaultRouter
from .views import (
    BrandViewSet,
    VehicleModelViewSet,
    GenerationViewSet,
    ModificationViewSet,
    VehicleViewSet,
)

router = DefaultRouter()
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'models', VehicleModelViewSet, basename='vehicle-model')
router.register(r'generations', GenerationViewSet, basename='generation')
router.register(r'modifications', ModificationViewSet, basename='modification')
router.register(r'catalog', VehicleViewSet, basename='vehicle')

urlpatterns = router.urls
