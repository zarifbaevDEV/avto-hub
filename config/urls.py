from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from django.views.generic import TemplateView

api_v1_patterns = [
    path('auth/', include('apps.accounts.urls')),
    path('vehicles/', include('apps.vehicles.urls')),
    path('marketplace/', include('apps.marketplace.urls')),
    path('moderation/', include('apps.moderation.urls')),
    path('audit/', include('apps.audit.urls')),
]

urlpatterns = [
    # Frontend Pages
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index.html', TemplateView.as_view(template_name='index.html')),
    path('marketplace/', TemplateView.as_view(template_name='marketplace.html'), name='marketplace'),
    path('marketplace.html', TemplateView.as_view(template_name='marketplace.html')),

    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),

    # OpenAPI Schema & Interactive Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
