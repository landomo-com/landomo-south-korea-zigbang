# Landomo Scraper: South Korea - Zigbang

Scraper for **Zigbang** (zigbang.com) in **South Korea**.

## Overview

This scraper extracts real estate listings from Zigbang, South Korea's largest rental property platform, and sends them to the Landomo Core Service for standardization and storage.

**Portal URL**: https://www.zigbang.com
**Country**: South Korea
**Status**: Production Ready
**API-Based**: Yes (REST API)

## Features

- Scrapes onerooms (studios), officetels, villas, and apartments
- Geohash-based location search for comprehensive coverage
- Support for Korean rental systems (월세/monthly rent, 전세/jeonse)
- Batch processing for efficient data retrieval
- Rate limiting and error handling
- Standardizes Korean property conventions

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your LANDOMO_API_KEY
   ```

3. **Run scraper**:
   ```bash
   npm start
   ```

4. **Development mode** (auto-reload):
   ```bash
   npm run dev
   ```

## Configuration

See `.env.example` for all configuration options.

Required:
- `LANDOMO_API_KEY` - API key for Landomo Core Service

Optional:
- `DEBUG=true` - Enable debug logging
- `REQUEST_DELAY_MS` - Delay between requests (default: 300ms)
- `BATCH_SIZE` - Items per batch request (default: 100)
- `DEFAULT_CITY` - Default city to scrape (default: Seoul)
- `MAX_RESULTS` - Maximum results per search (default: 1000)

## Architecture

This scraper follows the standard Landomo scraper pattern:

```
Zigbang API → Scraper → Transformer → Core Service → Core DB
```

### Files

- `src/scraper.ts` - Main scraping logic with geohash search
- `src/transformer.ts` - Zigbang data → StandardProperty conversion
- `src/types.ts` - TypeScript type definitions for Zigbang API
- `src/config.ts` - Configuration management

### Two-Phase Scraping

1. **Phase 1**: Discover listing IDs via geohash search
   - Searches major cities using geohash codes
   - Expands geohashes for comprehensive coverage
   - Collects unique listing IDs

2. **Phase 2**: Fetch detailed information
   - Batch requests for efficiency (100 items per batch)
   - Parse and transform to standard format
   - Send to Core Service

## Development

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Portal-Specific Notes

### Korean Rental System

Zigbang uses Korea's unique rental pricing system:

1. **월세 (Wolse / Monthly Rent)**:
   - Format: "deposit/rent" (e.g., "5000/50" = 50M KRW deposit + 500K KRW/month)
   - Both deposit and monthly rent

2. **전세 (Jeonse / Key Money)**:
   - Large lump sum deposit (no monthly rent)
   - Deposit returned at end of lease
   - Common in Korean market

3. **매매 (Sale)**:
   - Purchase price

### Property Types

- **원룸 (Oneroom)**: Studio apartments
- **오피스텔 (Officetel)**: Office-residence hybrid buildings
- **빌라 (Villa)**: Low-rise residential buildings
- **아파트 (Apartment)**: Traditional apartment complexes

### Location System

Korean addresses use a hierarchical system:
- **local1**: Province/City (e.g., 서울특별시)
- **local2**: District (e.g., 강남구)
- **local3**: Neighborhood (e.g., 역삼동)

### API Details

- **Base URL**: `https://apis.zigbang.com`
- **Authentication**: None required
- **Rate Limiting**: 300ms delay between requests
- **Batch Size**: Up to 100 items per detail request
- **Geohash Search**: Uses geohash codes for location-based queries

### Supported Cities

The scraper includes geohash codes for major Korean cities:
- Seoul (서울)
- Busan (부산)
- Incheon (인천)
- Daegu (대구)
- Daejeon (대전)
- Gwangju (광주)
- Ulsan (울산)
- Sejong (세종)

### Known Issues

- Random location obfuscation: Zigbang may return approximate coordinates for privacy
- Maintenance costs not always provided in listing data
- Images limited to thumbnail in list view

### Country-Specific Fields

The transformer preserves Korean market conventions:

```typescript
country_specific: {
  sales_type: "월세" | "전세" | "매매",
  deposit_man_won: 5000,        // Deposit in 만원 units
  deposit_krw: 50000000,        // Deposit in KRW
  rent_man_won: 50,             // Monthly rent in 만원
  rent_krw: 500000,             // Monthly rent in KRW
  exclusive_area_m2: 33.05,     // 전용면적
  supply_area_m2: 42.97,        // 공급면적
  floor: "3",
  total_floors: "12",
  room_type: "원룸",
  service_type: "오피스텔",
  manage_cost_man_won: 5,       // Maintenance fee
  local1: "서울특별시",
  local2: "강남구",
  local3: "역삼동",
  is_new: true,
  reg_date: "2026-02-01"
}
```

## Deployment

This scraper is deployed via GitHub Actions on every push to `main`.

See `.github/workflows/deploy.yml` for deployment configuration.

## Monitoring

Track scraper performance:
- Request count and timing
- Success/error rates
- Listings processed per city
- API response times

## Contributing

See the main [Landomo Registry](https://github.com/landomo-com/landomo-registry) for contribution guidelines.

## Resources

- [Zigbang Website](https://www.zigbang.com)
- [Landomo Core](https://github.com/landomo-com/landomo-core)
- [Landomo Registry](https://github.com/landomo-com/landomo-registry)

## License

UNLICENSED - Internal use only
