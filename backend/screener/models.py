from django.db import models
from django.core.exceptions import ValidationError


class Exchange(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Sector(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Industry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, related_name='industries')

    def __str__(self):
        return self.name


class Stock(models.Model):
    ticker = models.CharField(max_length=32)
    company_name = models.CharField(max_length=200)
    full_ticker = models.CharField(max_length=50, null=True, blank=True)
    exchange = models.ForeignKey(Exchange, on_delete=models.CASCADE)
    sector = models.ForeignKey(Sector, on_delete=models.CASCADE, null=True, blank=True)
    industry = models.ForeignKey(Industry, on_delete=models.CASCADE, null=True, blank=True)
    country = models.CharField(max_length=50)
    operating_country = models.CharField(max_length=100, null=True, blank=True)
    operating_country_iso = models.CharField(max_length=10, null=True, blank=True)
    exchange_long_name = models.CharField(max_length=150, null=True, blank=True)
    exchange_short_name = models.CharField(max_length=50, null=True, blank=True)

    # Financial Metrics
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_target = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dividend_yield = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    dividend_per_share = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_to_book = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_to_sales = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    enterprise_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_debt_to_total_capital = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    float_shares_to_outstanding = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)

    # Volume & Trading Metrics
    volume = models.BigIntegerField(null=True, blank=True)
    average_volume = models.BigIntegerField(null=True, blank=True)
    relative_volume = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    relative_strength_index = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Price Metrics
    price_change = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_change_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    prices_last_synced_at = models.DateTimeField(null=True, blank=True)


    peg_ratio = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    fair_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    fair_value_upside = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    fair_value_label = models.CharField(max_length=50, null=True, blank=True)
    analyst_target = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    analyst_upside = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    analyst_target_label = models.CharField(max_length=100, null=True, blank=True)
    health_label = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        ordering = ['ticker']
        unique_together = ('ticker', 'exchange')

    def clean(self):
        """Validate that industry belongs to the same sector as the stock's sector"""
        if self.industry and self.sector:
            if self.industry.sector != self.sector:
                raise ValidationError({
                    'industry': f'Industry "{self.industry.name}" does not belong to sector "{self.sector.name}". '
                               f'This industry belongs to sector "{self.industry.sector.name}".'
                })

    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticker} - {self.company_name}"


class HistoricalPrice(models.Model):
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, related_name='historical_prices')
    date = models.DateField()
    open_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    high_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    low_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    close_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    adjusted_close = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    volume = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('stock', 'date')
        indexes = [
            models.Index(fields=['stock', 'date']),
            models.Index(fields=['date']),
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.stock.ticker} @ {self.date}"


class AccessibleExchange(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.name} ({self.code})"


class AccessibleSector(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class AccessibleIndustry(models.Model):
    name = models.CharField(max_length=100, unique=True)
    sector = models.ForeignKey(AccessibleSector, on_delete=models.CASCADE, related_name='industries')

    def __str__(self):
        return self.name


class AccessibleStock(models.Model):
    ticker = models.CharField(max_length=32)
    company_name = models.CharField(max_length=200)
    full_ticker = models.CharField(max_length=50, null=True, blank=True)
    exchange = models.ForeignKey(AccessibleExchange, on_delete=models.CASCADE)
    sector = models.ForeignKey(
        AccessibleSector,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    industry = models.ForeignKey(
        AccessibleIndustry,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    country = models.CharField(max_length=50)
    operating_country = models.CharField(max_length=100, null=True, blank=True)
    operating_country_iso = models.CharField(max_length=10, null=True, blank=True)
    exchange_long_name = models.CharField(max_length=150, null=True, blank=True)
    exchange_short_name = models.CharField(max_length=50, null=True, blank=True)

    # Financial Metrics
    market_cap = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_target = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    pe_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dividend_yield = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    dividend_per_share = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_to_book = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    price_to_sales = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    enterprise_value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    total_debt_to_total_capital = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    float_shares_to_outstanding = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)

    # Volume & Trading Metrics
    volume = models.BigIntegerField(null=True, blank=True)
    average_volume = models.BigIntegerField(null=True, blank=True)
    relative_volume = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    relative_strength_index = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    # Price Metrics
    price_change = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_change_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    prices_last_synced_at = models.DateTimeField(null=True, blank=True)

    peg_ratio = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    fair_value = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    fair_value_upside = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    fair_value_label = models.CharField(max_length=50, null=True, blank=True)
    analyst_target = models.DecimalField(max_digits=15, decimal_places=4, null=True, blank=True)
    analyst_upside = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    analyst_target_label = models.CharField(max_length=100, null=True, blank=True)
    health_label = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        ordering = ['ticker']
        unique_together = ('ticker', 'exchange')

    def clean(self):
        """Validate that industry belongs to the same sector as the stock's sector"""
        if self.industry and self.sector:
            if self.industry.sector != self.sector:
                raise ValidationError({
                    'industry': f'Industry "{self.industry.name}" does not belong to sector "{self.sector.name}". '
                                f'This industry belongs to sector "{self.industry.sector.name}".'
                })

    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticker} - {self.company_name}"


class AccessibleHistoricalPrice(models.Model):
    stock = models.ForeignKey(AccessibleStock, on_delete=models.CASCADE, related_name='historical_prices')
    date = models.DateField()
    open_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    high_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    low_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    close_price = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    adjusted_close = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    volume = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('stock', 'date')
        indexes = [
            models.Index(fields=['stock', 'date']),
            models.Index(fields=['date']),
        ]
        ordering = ['-date']

    def __str__(self):
        return f"{self.stock.ticker} @ {self.date}"
