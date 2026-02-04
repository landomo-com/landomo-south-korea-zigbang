# Changelog

All notable changes to the Zigbang scraper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-04

### Added
- Initial TypeScript implementation of Zigbang scraper
- Converted from Python to TypeScript with full feature parity
- REST API-based scraping using Zigbang's public API
- Geohash-based location search for comprehensive coverage
- Support for all property types:
  - Onerooms (studios)
  - Officetels (office-residence hybrids)
  - Villas (low-rise apartments)
  - Apartments (traditional complexes)
- Korean rental system handling:
  - 월세 (Wolse / Monthly Rent): deposit + monthly rent
  - 전세 (Jeonse / Key Money): large deposit, no monthly rent
  - 매매 (Sale): purchase price
- Two-phase scraping pattern:
  - Phase 1: Discover listing IDs via geohash expansion
  - Phase 2: Fetch details in batches (100 items per request)
- Comprehensive transformer for Korean property data:
  - Converts to StandardProperty format
  - Preserves country-specific fields
  - Handles Korean address hierarchy (local1/local2/local3)
  - Normalizes property types and room counts
  - Calculates annualized rent for comparison
- City coverage with geohash codes:
  - Seoul (서울)
  - Busan (부산)
  - Incheon (인천)
  - Daegu (대구)
  - Daejeon (대전)
  - Gwangju (광주)
  - Ulsan (울산)
  - Sejong (세종)
- Configuration options:
  - Rate limiting (300ms default)
  - Batch size (100 items default)
  - City and result limits
  - Debug logging
- Local core utilities implementation
- Test script for validation
- Comprehensive documentation

### Technical Details
- TypeScript with strict type checking
- Axios for HTTP requests
- Rate limiting to respect API
- Error handling and retry logic
- Batch processing for efficiency
- Geohash expansion for complete coverage

### Notes
- Converted from Python scraper at `/home/samuelseidel/landomo/old/south_korea/zigbang/scraper.py`
- Maintains API compatibility with original implementation
- Enhanced with TypeScript type safety
- Ready for production deployment
