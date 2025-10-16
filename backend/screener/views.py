
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Q
from datetime import datetime, timedelta

from rest_framework.exceptions import NotFound, ValidationError
from .models import (
    Exchange,
    Sector,
    Industry,
    Stock,
    AccessibleExchange,
    AccessibleSector,
    AccessibleIndustry,
    AccessibleStock,
)
from .serializers import (
    ExchangeSerializer,
    SectorSerializer,
    IndustrySerializer,
    StockSerializer,
    HistoricalPriceSerializer,
    AccessibleExchangeSerializer,
    AccessibleSectorSerializer,
    AccessibleIndustrySerializer,
    AccessibleStockSerializer,
    AccessibleHistoricalPriceSerializer,
)
from rest_framework.decorators import api_view
from django.db.models import Count, F, Sum, Max, Min
from .pagination import CustomPageNumberPagination
from decimal import Decimal


class StockFilter(django_filters.FilterSet):
    exchange = django_filters.CharFilter(field_name='exchange__code', lookup_expr='iexact')
    sector = django_filters.CharFilter(field_name='industry__sector__name', lookup_expr='icontains')
    industry = django_filters.CharFilter(field_name='industry__name', lookup_expr='icontains')
    country = django_filters.CharFilter(field_name='country', lookup_expr='iexact')

    # Price filtering
    price_min = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    # Market cap filtering
    market_cap_min = django_filters.NumberFilter(field_name='market_cap', lookup_expr='gte')
    market_cap_max = django_filters.NumberFilter(field_name='market_cap', lookup_expr='lte')

    class Meta:
        model = Stock
        fields = []


class AccessibleStockFilter(StockFilter):
    class Meta(StockFilter.Meta):
        model = AccessibleStock


DATASET_MODELS = {
    'classifier': {
        'stock': Stock,
        'sector': Sector,
        'industry': Industry,
        'exchange': Exchange,
    },
    'accessible': {
        'stock': AccessibleStock,
        'sector': AccessibleSector,
        'industry': AccessibleIndustry,
        'exchange': AccessibleExchange,
    },
}


DATASET_SERIALIZERS = {
    'classifier': {
        'stock': StockSerializer,
        'exchange': ExchangeSerializer,
        'sector': SectorSerializer,
        'industry': IndustrySerializer,
        'historical': HistoricalPriceSerializer,
    },
    'accessible': {
        'stock': AccessibleStockSerializer,
        'exchange': AccessibleExchangeSerializer,
        'sector': AccessibleSectorSerializer,
        'industry': AccessibleIndustrySerializer,
        'historical': AccessibleHistoricalPriceSerializer,
    },
}


DATASET_FILTERSETS = {
    'classifier': StockFilter,
    'accessible': AccessibleStockFilter,
}


def resolve_dataset_key(raw_key):
    """Normalize dataset key and fallback to classifier dataset."""
    if not raw_key:
        return 'classifier'
    normalized = raw_key.strip().lower()
    return normalized if normalized in DATASET_MODELS else 'classifier'


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.none()
    serializer_class = StockSerializer
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StockFilter
    search_fields = ['ticker', 'company_name']
    ordering_fields = ['ticker', 'company_name', 'price', 'market_cap', 'pe_ratio']
    ordering = ['ticker']

    def get_dataset_key(self):
        return resolve_dataset_key(self.request.query_params.get('dataset'))

    def get_dataset_models(self):
        return DATASET_MODELS[self.get_dataset_key()]

    def get_dataset_serializers(self):
        return DATASET_SERIALIZERS[self.get_dataset_key()]

    def get_filterset_class(self):
        return DATASET_FILTERSETS[self.get_dataset_key()]

    def _base_queryset(self):
        models_bundle = self.get_dataset_models()
        return models_bundle['stock'].objects.select_related('exchange', 'sector', 'industry').all()

    def get_queryset(self):
        """Enhanced queryset with filtering"""
        queryset = self._base_queryset()

        # Add any custom filtering logic here
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(ticker__icontains=search) |
                Q(company_name__icontains=search)
            )

        return queryset

    def get_serializer_class(self):
        return self.get_dataset_serializers()['stock']

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get all filter options with proper null handling"""
        # Get sector parameter for filtering industries
        sector_param = request.query_params.get('sector', None)

        stock_qs = self._base_queryset()

        exchanges = list(
            stock_qs.exclude(exchange__isnull=True)
            .values('exchange__id', 'exchange__code', 'exchange__name')
            .distinct()
            .order_by('exchange__code')
        )

        sectors = list(
            stock_qs.exclude(Q(industry__isnull=True) | Q(industry__sector__isnull=True))
            .values('industry__sector__id', 'industry__sector__name')
            .distinct()
            .order_by('industry__sector__name')
        )

        industry_queryset = stock_qs.exclude(Q(industry__isnull=True) | Q(industry__sector__isnull=True))
        if sector_param:
            industry_queryset = industry_queryset.filter(industry__sector__name__icontains=sector_param)

        industries = list(
            industry_queryset
            .values('industry__id', 'industry__name', 'industry__sector__name')
            .distinct()
            .order_by('industry__name')
        )

        countries = list(
            stock_qs.exclude(
                Q(country__isnull=True) | Q(country__exact='') | Q(country__iexact='Unknown')
            )
            .values_list('country', flat=True)
            .distinct()
            .order_by('country')
        )

        return Response({
            'exchanges': [
                {
                    'id': row['exchange__id'],
                    'code': row['exchange__code'],
                    'name': row['exchange__name'],
                }
                for row in exchanges
            ],
            'sectors': [
                {
                    'id': row['industry__sector__id'],
                    'name': row['industry__sector__name'],
                }
                for row in sectors
            ],
            'industries': [
                {
                    'id': row['industry__id'],
                    'name': row['industry__name'],
                    'sector__name': row['industry__sector__name'],
                }
                for row in industries
            ],
            'countries': list(countries),  # This will now only include valid country names
        })

    def _get_stock_from_request(self, request):
        """Resolve a stock using ticker/full_ticker and optional exchange code."""
        ticker = request.query_params.get('ticker')
        exchange_code = request.query_params.get('exchange')

        if not ticker:
            raise ValidationError(detail='Query parameter "ticker" is required.')

        queryset = self.get_queryset()
        filters = {'ticker__iexact': ticker}

        if exchange_code:
            filters['exchange__code__iexact'] = exchange_code

        stock = queryset.filter(**filters).first()

        if not stock and exchange_code:
            # Retry without exchange if the provided code was incorrect
            stock = queryset.filter(ticker__iexact=ticker).first()

        if not stock:
            # As a fallback, attempt lookup on full_ticker (e.g., NASDAQGS:AAPL)
            stock = queryset.filter(full_ticker__iexact=ticker).first()

        if not stock:
            raise NotFound(detail=f'Stock with ticker "{ticker}" not found.')

        return stock

    @action(detail=False, methods=['get'], url_path='profile')
    def profile(self, request):
        """Return enriched stock profile data for screener modal."""
        stock = self._get_stock_from_request(request)

        serializer_class = self.get_dataset_serializers()['stock']
        serializer = serializer_class(stock, context={'request': request})

        # Prefetch the latest historical prices for quick metrics
        history_qs = stock.historical_prices.order_by('-date')
        latest_entries = list(history_qs[:2])
        latest = latest_entries[0] if latest_entries else None
        previous = latest_entries[1] if len(latest_entries) > 1 else None

        history_span = stock.historical_prices.aggregate(
            first_date=Min('date'),
            last_date=Max('date'),
            high_close=Max('close_price'),
            low_close=Min('close_price'),
        )

        def _dec_to_float(value):
            if value is None:
                return None
            if isinstance(value, Decimal):
                return float(value)
            return value

        latest_payload = None
        if latest:
            latest_payload = {
                'date': latest.date,
                'close_price': _dec_to_float(latest.close_price),
                'open_price': _dec_to_float(latest.open_price),
                'high_price': _dec_to_float(latest.high_price),
                'low_price': _dec_to_float(latest.low_price),
                'adjusted_close': _dec_to_float(latest.adjusted_close),
                'volume': latest.volume,
            }

        change = None
        change_percent = None
        if latest and previous and latest.close_price is not None and previous.close_price is not None:
            change = _dec_to_float(latest.close_price - previous.close_price)
            if previous.close_price != 0:
                change_percent = float((latest.close_price - previous.close_price) / previous.close_price * 100)

        response_payload = {
            'stock': serializer.data,
            'latest_price': latest_payload,
            'price_change': {
                'absolute': change,
                'percent': change_percent,
            },
            'history': {
                'available_from': history_span['first_date'],
                'latest_date': history_span['last_date'],
                'high_close': _dec_to_float(history_span['high_close']),
                'low_close': _dec_to_float(history_span['low_close']),
            },
            'metadata': {
                'prices_last_synced_at': stock.prices_last_synced_at,
            },
        }

        return Response(response_payload)

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        """Return historical price series for a given stock."""
        stock = self._get_stock_from_request(request)

        start_param = request.query_params.get('start')
        end_param = request.query_params.get('end')
        window_param = request.query_params.get('window')
        limit_param = request.query_params.get('limit')

        history_qs = stock.historical_prices.order_by('date')

        # Determine end date fallback as latest available point
        latest_date = history_qs.values_list('date', flat=True).last()
        if not latest_date:
            return Response({
                'stock': stock.ticker,
                'exchange': stock.exchange.code if stock.exchange else None,
                'results': [],
                'count': 0,
            })

        # Parse end date
        try:
            end_date = datetime.strptime(end_param, '%Y-%m-%d').date() if end_param else latest_date
        except ValueError:
            raise ValidationError(detail='Invalid end date. Expected format YYYY-MM-DD.')

        # Parse start date
        start_date = None
        if start_param:
            try:
                start_date = datetime.strptime(start_param, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError(detail='Invalid start date. Expected format YYYY-MM-DD.')
        elif window_param and window_param.lower() != 'max':
            try:
                window_days = int(window_param)
                start_date = end_date - timedelta(days=window_days)
            except ValueError:
                raise ValidationError(detail='Invalid window parameter. Provide number of days or "max".')

        if start_date:
            history_qs = history_qs.filter(date__gte=start_date)

        history_qs = history_qs.filter(date__lte=end_date)

        data = list(history_qs)

        if limit_param:
            try:
                limit = int(limit_param)
                if limit > 0 and len(data) > limit:
                    data = data[-limit:]
            except ValueError:
                raise ValidationError(detail='Invalid limit parameter. Must be an integer.')

        history_serializer_class = self.get_dataset_serializers()['historical']
        serializer = history_serializer_class(data, many=True)

        response = {
            'stock': stock.ticker,
            'exchange': stock.exchange.code if stock.exchange else None,
            'count': len(serializer.data),
            'results': serializer.data,
        }

        if serializer.data:
            response['range'] = {
                'start': serializer.data[0]['date'],
                'end': serializer.data[-1]['date'],
            }

        return Response(response)


class ExchangeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Exchange.objects.all()
    serializer_class = ExchangeSerializer


class SectorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer


class IndustryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Industry.objects.all()
    serializer_class = IndustrySerializer


@api_view(['GET'])
def sector_industry_counts(request):
    """Get aggregated counts by sector and industry using industry-linked sectors."""
    dataset_key = resolve_dataset_key(request.GET.get('dataset'))
    models_bundle = DATASET_MODELS[dataset_key]
    stock_model = models_bundle['stock']
    exchange = request.GET.get('exchange')

    queryset = stock_model.objects.select_related('industry__sector', 'industry')
    if exchange:
        queryset = queryset.filter(exchange__code=exchange)

    queryset = queryset.exclude(
        Q(industry__isnull=True) | Q(industry__sector__isnull=True)
    )

    sector_counts = queryset.values('industry__sector__name').annotate(
        total_companies=Count('id'),
        sector_name=F('industry__sector__name'),
    ).order_by('-total_companies')

    industry_counts = queryset.values(
        'industry__sector__name', 'industry__name'
    ).annotate(
        count=Count('id'),
        sector_name=F('industry__sector__name'),
        industry_name=F('industry__name'),
    ).order_by('industry__sector__name', '-count')

    # Structure the response
    sectors_data = {}
    for sector in sector_counts:
        sector_name = sector['sector_name']
        sectors_data[sector_name] = {
            'name': sector_name,
            'total_companies': sector['total_companies'],
            'industries': []
        }

    # Add industries to sectors
    for industry in industry_counts:
        sector_name = industry['sector_name']
        if sector_name in sectors_data:
            sectors_data[sector_name]['industries'].append({
                'name': industry['industry_name'],
                'count': industry['count']
            })

    # Convert to list and sort by total companies
    result = list(sectors_data.values())
    result.sort(key=lambda x: x['total_companies'], reverse=True)

    return Response(result)


@api_view(['GET'])
def database_stats(request):
    """Get database statistics"""
    dataset_key = resolve_dataset_key(request.GET.get('dataset'))
    models_bundle = DATASET_MODELS[dataset_key]
    exchange_model = models_bundle['exchange']
    sector_model = models_bundle['sector']
    industry_model = models_bundle['industry']
    stock_model = models_bundle['stock']

    exchanges_count = exchange_model.objects.count()
    sectors_count = sector_model.objects.count()
    industries_count = industry_model.objects.count()
    stocks_count = stock_model.objects.count()

    # Get unique countries count - exclude null/empty values
    countries_count = stock_model.objects.exclude(
        Q(country__isnull=True) | Q(country__exact='') | Q(country__exact='Unknown')
    ).values('country').distinct().count()

    # Get some additional useful stats
    stocks_with_price = stock_model.objects.filter(price__isnull=False).count()
    stocks_with_market_cap = stock_model.objects.filter(market_cap__isnull=False).count()

    return Response({
        'exchanges': exchanges_count,
        'sectors': sectors_count,
        'industries': industries_count,
        'stocks': stocks_count,
        'countries': countries_count,
        'stocks_with_price': stocks_with_price,
        'stocks_with_market_cap': stocks_with_market_cap
    })


def apply_stock_filters(queryset, params):
    """Helper function to apply consistent filters to stock querysets"""
    if params.get('exchange'):
        queryset = queryset.filter(exchange__code__iexact=params['exchange'])
    if params.get('sector'):
        queryset = queryset.filter(industry__sector__name__iexact=params['sector'])
    if params.get('industry'):
        queryset = queryset.filter(industry__name__iexact=params['industry'])
    if params.get('country'):
        queryset = queryset.filter(country__iexact=params['country'])
    if params.get('search'):
        queryset = queryset.filter(
            Q(ticker__icontains=params['search']) |
            Q(company_name__icontains=params['search'])
        )
    if params.get('price_min'):
        queryset = queryset.filter(price__gte=Decimal(params['price_min']))
    if params.get('price_max'):
        queryset = queryset.filter(price__lte=Decimal(params['price_max']))
    if params.get('market_cap_min'):
        queryset = queryset.filter(market_cap__gte=Decimal(params['market_cap_min']))
    if params.get('market_cap_max'):
        queryset = queryset.filter(market_cap__lte=Decimal(params['market_cap_max']))
    return queryset


@api_view(['GET'])
def filtered_stats(request):
    """Get statistics for filtered data"""
    dataset_key = resolve_dataset_key(request.GET.get('dataset'))
    models_bundle = DATASET_MODELS[dataset_key]
    stock_model = models_bundle['stock']
    industry_model = models_bundle['industry']

    # Start with base queryset
    queryset = stock_model.objects.select_related('exchange', 'sector', 'industry').all()

    # Apply the same filters as the main stock list
    exchange = request.GET.get('exchange', None)
    sector = request.GET.get('sector', None)
    industry = request.GET.get('industry', None)
    country = request.GET.get('country', None)
    search = request.GET.get('search', None)

    # Check if companies data is requested
    include_companies = request.GET.get('include_companies', '').lower() == 'true'
    page_size = request.GET.get('page_size', None)

    # Price filtering
    price_min = request.GET.get('price_min', None)
    price_max = request.GET.get('price_max', None)

    # Market cap filtering
    market_cap_min = request.GET.get('market_cap_min', None)
    market_cap_max = request.GET.get('market_cap_max', None)

    params = dict(request.GET.items())
    sector_filter_applied = bool(params.get('sector'))
    resolved_sector = sector
    resolved_industry = industry

    if industry:
        industry_obj = (
            industry_model.objects.select_related('sector')
            .filter(name__iexact=industry)
            .first()
        )
        if industry_obj:
            resolved_industry = industry_obj.name
            if industry_obj.sector:
                resolved_sector = industry_obj.sector.name
            params['industry'] = industry_obj.name
            if 'sector' in params:
                params.pop('sector', None)
                sector_filter_applied = False
    if sector_filter_applied:
        sector_for_breakdown = resolved_sector
    else:
        sector_for_breakdown = None

    sector = resolved_sector
    industry = resolved_industry

    # Apply filters using helper function
    queryset = apply_stock_filters(queryset, params)

    # Calculate aggregated statistics
    total_companies = queryset.count()

    # Count unique sectors and industries
    unique_sectors = queryset.exclude(
        Q(industry__isnull=True) | Q(industry__sector__isnull=True)
    ).values('industry__sector__name').distinct().count()

    unique_industries = queryset.exclude(
        Q(industry__isnull=True) | Q(industry__sector__isnull=True)
    ).values('industry__name').distinct().count()

    unique_exchanges = queryset.exclude(
        Q(exchange__isnull=True)
    ).values('exchange__name').distinct().count()

    # Calculate total market cap (only for stocks with market cap data)
    market_cap_sum = queryset.exclude(
        Q(market_cap__isnull=True)
    ).aggregate(total_market_cap=Sum('market_cap'))['total_market_cap'] or 0

    # Get sector breakdown
    raw_sector_breakdown = list(
        queryset.exclude(
            Q(industry__isnull=True) | Q(industry__sector__isnull=True)
        )
        .values('industry__sector__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    sector_breakdown = [
        {'sector__name': row['industry__sector__name'], 'count': row['count']}
        for row in raw_sector_breakdown
    ]

    # Get industry breakdown
    if sector_for_breakdown:
        # When filtering by sector, we want industries within that specific sector
        # Use a single efficient query that groups by industry within the current queryset
        raw_industry_breakdown = list(
            queryset.exclude(Q(industry__isnull=True) | Q(industry__sector__isnull=True))
            .values('industry__name', 'industry__sector__name')
            .annotate(
                count=Count('id'),
                total_market_cap=Sum('market_cap'),
            )
            .order_by('-count')
        )
        industry_breakdown = [
            {
                'industry__name': row['industry__name'],
                'sector__name': row['industry__sector__name'],
                'count': row['count'],
                'total_market_cap': row['total_market_cap'],
            }
            for row in raw_industry_breakdown
        ]
    else:
        # When not filtering by sector, group by industry name only
        raw_industry_breakdown = list(
            queryset.exclude(Q(industry__isnull=True) | Q(industry__sector__isnull=True))
            .values('industry__name', 'industry__sector__name')
            .annotate(
                count=Count('id'),
                total_market_cap=Sum('market_cap'),
            )
            .order_by('-count')
        )
        industry_breakdown = [
            {
                'industry__name': row['industry__name'],
                'sector__name': row['industry__sector__name'],
                'count': row['count'],
                'total_market_cap': row['total_market_cap'],
            }
            for row in raw_industry_breakdown
        ]

    # Get exchange breakdown
    exchange_breakdown = list(queryset.exclude(
        Q(exchange__isnull=True)
    ).values('exchange__name').annotate(
        count=Count('id')
    ).order_by('-count'))

    # Get country breakdown
    country_breakdown = list(queryset.exclude(
        Q(country__isnull=True) | Q(country__exact='') | Q(country__iexact='Unknown')
    ).values('country').annotate(
        count=Count('id')
    ).order_by('-count'))

    # Prepare response data
    response_data = {
        'total_companies': total_companies,
        'unique_sectors': unique_sectors,
        'unique_industries': unique_industries,
        'unique_exchanges': unique_exchanges,
        'total_market_cap': float(market_cap_sum),
        'sector_breakdown': sector_breakdown,
        'industry_breakdown': industry_breakdown,
        'exchange_breakdown': exchange_breakdown,
        'country_breakdown': country_breakdown,
        'applied_filters': {
            'exchange': exchange,
            'sector': resolved_sector,
            'industry': resolved_industry,
            'country': country,
            'search': search,
            'price_range': [price_min, price_max] if price_min or price_max else None,
            'market_cap_range': [market_cap_min, market_cap_max] if market_cap_min or market_cap_max else None,
        }
    }

    # Include companies data if requested
    if include_companies:
        companies_queryset = queryset

        # Apply pagination if page_size is specified, otherwise return all
        if page_size:
            try:
                limit = int(page_size)
                # Allow up to 10000 companies to be returned
                if limit > 10000:
                    limit = 10000
                companies_queryset = companies_queryset[:limit]
            except (ValueError, TypeError):
                pass  # Ignore invalid page_size values

        # Serialize companies data
        companies_data = []
        for stock in companies_queryset:
            sector_name = None
            if stock.industry and getattr(stock.industry, "sector", None):
                sector_name = stock.industry.sector.name
            elif stock.sector:
                sector_name = stock.sector.name
            companies_data.append({
                'ticker': stock.ticker,
                'company_name': stock.company_name,
                'price': float(stock.price) if stock.price else None,
                'market_cap': float(stock.market_cap) if stock.market_cap else None,
                'pe_ratio': float(stock.pe_ratio) if stock.pe_ratio else None,
                'health_label': stock.health_label,
                'exchange_name': stock.exchange.name if stock.exchange else None,
                'exchange_code': stock.exchange.code if stock.exchange else None,
                'sector_name': sector_name,
                'industry_name': stock.industry.name if stock.industry else None,
                'country': stock.country,
            })

        response_data['companies'] = companies_data

    return Response(response_data)


@api_view(['GET'])
def sector_industries(request, sector_name):
    """Get industries for a specific sector"""
    dataset_key = resolve_dataset_key(request.GET.get('dataset'))
    models_bundle = DATASET_MODELS[dataset_key]
    sector_model = models_bundle['sector']
    industry_model = models_bundle['industry']
    try:
        # Get the sector
        sector = sector_model.objects.get(name__iexact=sector_name)

        # Get industries for this sector
        industries = industry_model.objects.filter(sector=sector).values('id', 'name').order_by('name')

        return Response({
            'sector': sector.name,
            'industries': list(industries)
        })
    except sector_model.DoesNotExist:
        return Response({
            'error': f'Sector "{sector_name}" not found'
        }, status=404)
