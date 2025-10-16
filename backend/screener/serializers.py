from rest_framework import serializers
from decimal import Decimal
from django.core.exceptions import ValidationError
from .models import (
    Exchange,
    Sector,
    Industry,
    Stock,
    HistoricalPrice,
    AccessibleExchange,
    AccessibleSector,
    AccessibleIndustry,
    AccessibleStock,
    AccessibleHistoricalPrice,
)


class ExchangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exchange
        fields = '__all__'


class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = '__all__'


class IndustrySerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(source='sector.name', read_only=True)

    class Meta:
        model = Industry
        fields = '__all__'


class StockSerializer(serializers.ModelSerializer):
    exchange_name = serializers.CharField(source='exchange.name', read_only=True)
    exchange_code = serializers.CharField(source='exchange.code', read_only=True)
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    industry_name = serializers.CharField(source='industry.name', read_only=True)

    # Override decimal fields to return floats for frontend compatibility
    market_cap = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    pe_ratio = serializers.SerializerMethodField()
    peg_ratio = serializers.SerializerMethodField()
    price_change_percent = serializers.SerializerMethodField()
    fair_value = serializers.SerializerMethodField()
    fair_value_upside = serializers.SerializerMethodField()
    analyst_target = serializers.SerializerMethodField()
    analyst_upside = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = '__all__'

    def _decimal_to_float(self, value):
        """Convert Decimal to float, handle None values"""
        if value is None:
            return None
        if isinstance(value, Decimal):
            return float(value)
        return value

    def get_market_cap(self, obj):
        return self._decimal_to_float(obj.market_cap)

    def get_price(self, obj):
        return self._decimal_to_float(obj.price)

    def get_pe_ratio(self, obj):
        return self._decimal_to_float(obj.pe_ratio)

    def get_peg_ratio(self, obj):
        return self._decimal_to_float(obj.peg_ratio)

    def get_price_change_percent(self, obj):
        return self._decimal_to_float(obj.price_change_percent)

    def get_fair_value(self, obj):
        return self._decimal_to_float(obj.fair_value)

    def get_fair_value_upside(self, obj):
        return self._decimal_to_float(obj.fair_value_upside)

    def get_analyst_target(self, obj):
        return self._decimal_to_float(obj.analyst_target)

    def get_analyst_upside(self, obj):
        return self._decimal_to_float(obj.analyst_upside)

    def validate(self, data):
        """Validate that industry belongs to the same sector as the stock's sector"""
        sector = data.get('sector')
        industry = data.get('industry')

        if industry and sector:
            if industry.sector != sector:
                raise serializers.ValidationError({
                    'industry': f'Industry "{industry.name}" does not belong to sector "{sector.name}". '
                               f'This industry belongs to sector "{industry.sector.name}".'
                })

        return data


class HistoricalPriceSerializer(serializers.ModelSerializer):
    open_price = serializers.SerializerMethodField()
    high_price = serializers.SerializerMethodField()
    low_price = serializers.SerializerMethodField()
    close_price = serializers.SerializerMethodField()
    adjusted_close = serializers.SerializerMethodField()

    class Meta:
        model = HistoricalPrice
        fields = (
            'date',
            'open_price',
            'high_price',
            'low_price',
            'close_price',
            'adjusted_close',
            'volume',
        )

    def _decimal_to_float(self, value):
        if value is None:
            return None
        if isinstance(value, Decimal):
            return float(value)
        return value

    def get_open_price(self, obj):
        return self._decimal_to_float(obj.open_price)

    def get_high_price(self, obj):
        return self._decimal_to_float(obj.high_price)

    def get_low_price(self, obj):
        return self._decimal_to_float(obj.low_price)

    def get_close_price(self, obj):
        return self._decimal_to_float(obj.close_price)

    def get_adjusted_close(self, obj):
        return self._decimal_to_float(obj.adjusted_close)


class AccessibleExchangeSerializer(ExchangeSerializer):
    class Meta(ExchangeSerializer.Meta):
        model = AccessibleExchange


class AccessibleSectorSerializer(SectorSerializer):
    class Meta(SectorSerializer.Meta):
        model = AccessibleSector


class AccessibleIndustrySerializer(IndustrySerializer):
    class Meta(IndustrySerializer.Meta):
        model = AccessibleIndustry


class AccessibleStockSerializer(StockSerializer):
    class Meta(StockSerializer.Meta):
        model = AccessibleStock


class AccessibleHistoricalPriceSerializer(HistoricalPriceSerializer):
    class Meta(HistoricalPriceSerializer.Meta):
        model = AccessibleHistoricalPrice
