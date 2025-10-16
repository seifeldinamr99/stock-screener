# stock_screener/urls.py (Main project URLs)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('screener.urls')),  # This includes your app URLs
]
