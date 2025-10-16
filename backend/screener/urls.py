
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'stocks', views.StockViewSet)
router.register(r'exchanges', views.ExchangeViewSet)
router.register(r'sectors', views.SectorViewSet)
router.register(r'industries', views.IndustryViewSet)

urlpatterns = [
    path('stats/', views.database_stats, name='database-stats'),  # This creates /api/stats/
    path('filtered-stats/', views.filtered_stats, name='filtered-stats'),  # This creates /api/filtered-stats/
    path('stocks/sector-industry-counts/', views.sector_industry_counts, name='sector-industry-counts'),  # This creates /api/stocks/sector-industry-counts/
    path('sectors/<str:sector_name>/industries/', views.sector_industries, name='sector-industries'),  # This creates /api/sectors/{sector_name}/industries/
    path('', include(router.urls)),  # This creates /api/stocks/, /api/exchanges/, etc.
]