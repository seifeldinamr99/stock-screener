from django.contrib import admin
from .models import Exchange, Sector, Industry, Stock

@admin.register(Exchange)
class ExchangeAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'country']
    search_fields = ['code', 'name', 'country']

@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ['name', 'sector']
    search_fields = ['name']
    list_filter = ['sector']

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['ticker', 'company_name', 'exchange', 'sector', 'price', 'market_cap']
    list_filter = ['exchange', 'sector', 'industry', 'country']
    search_fields = ['ticker', 'company_name']
    readonly_fields = ['created_at', 'updated_at']