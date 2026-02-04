import axios, { AxiosInstance } from 'axios';
import { sendToCoreService } from './core';
import { config } from './config';
import { transformToStandard } from './transformer';
import {
  PropertyType,
  CITY_GEOHASHES,
  GEOHASH_SUFFIXES,
  ZigbangItemsResponse,
  ZigbangDetailsResponse,
  ZigbangListing,
  ZigbangListingData,
  SearchOptions,
} from './types';

/**
 * Zigbang Real Estate Scraper
 *
 * Scrapes real estate listings from Zigbang (zigbang.com) - South Korea's largest
 * rental property platform.
 *
 * Features:
 * - Search by geohash location
 * - Filter by property type (oneroom, officetel, villa, apartment)
 * - Filter by deposit and rent range
 * - Pagination support via geohash expansion
 * - REST API based scraping
 */
export class ZigbangScraper {
  private session: AxiosInstance;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor() {
    this.session = axios.create({
      baseURL: config.zigbangApiUrl,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Origin: config.zigbangWebUrl,
        Referer: `${config.zigbangWebUrl}/`,
      },
      timeout: 30000,
    });
  }

  /**
   * Apply rate limiting between requests
   */
  private async rateLimit(minDelay: number = config.requestDelayMs): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < minDelay) {
      await this.sleep(minDelay - elapsed);
    }
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get listing IDs for a given geohash area
   */
  async getItemsByGeohash(
    geohash: string,
    propertyType: PropertyType = PropertyType.ONEROOM,
    depositMin: number = 0,
    depositMax?: number,
    rentMin: number = 0,
    rentMax?: number
  ): Promise<number[]> {
    await this.rateLimit();

    const params: Record<string, string | number> = {
      geohash,
      depositMin,
      rentMin,
    };

    if (depositMax !== undefined) {
      params.depositMax = depositMax;
    }
    if (rentMax !== undefined) {
      params.rentMax = rentMax;
    }

    try {
      const endpoint = `/house/property/v1/items/${propertyType}`;
      const response = await this.session.get<ZigbangItemsResponse>(endpoint, { params });

      const items = response.data.items || [];
      return items.map((item) => item.id);
    } catch (error) {
      if (config.debug) {
        console.error(`Error fetching geohash ${geohash}:`, error);
      }
      return [];
    }
  }

  /**
   * Get detailed information for listings
   */
  async getItemDetails(itemIds: number[]): Promise<ZigbangListing[]> {
    if (itemIds.length === 0) {
      return [];
    }

    const allListings: ZigbangListing[] = [];
    const batchSize = config.batchSize;

    // Process in batches (API accepts max ~100 items per request)
    for (let i = 0; i < itemIds.length; i += batchSize) {
      await this.rateLimit();

      const batch = itemIds.slice(i, i + batchSize);

      try {
        const response = await this.session.post<ZigbangDetailsResponse>(
          '/house/property/v1/items/list',
          { itemIds: batch }
        );

        const items = response.data.items || [];
        for (const item of items) {
          try {
            const listing = this.parseListingData(item);
            allListings.push(listing);
          } catch (error) {
            console.warn(`Failed to parse listing:`, error);
          }
        }
      } catch (error) {
        console.error(`Error fetching batch ${i}-${i + batchSize}:`, error);
      }
    }

    return allListings;
  }

  /**
   * Parse raw API data into ZigbangListing
   */
  private parseListingData(data: ZigbangListingData): ZigbangListing {
    const id = data.item_id || data.id || 0;

    const listing: ZigbangListing = {
      id,
      title: data.title || '',
      sales_type: data.sales_type || data.sales_title || '',
      deposit: data.deposit,
      rent: data.rent,
      address: data.address || '',
      local1: '',
      local2: '',
      local3: '',
      images: [],
      thumbnail: data.images_thumbnail || '',
      is_new: data.is_new || false,
      url: `${config.zigbangWebUrl}/home/item/${id}`,
      raw_data: data,
    };

    // Size
    listing.size_m2 = data.size_m2;
    if (data.공급면적 && typeof data.공급면적 === 'object') {
      listing.size_m2 = data.공급면적.m2 || listing.size_m2;
    }
    if (data.전용면적 && typeof data.전용면적 === 'object') {
      listing.exclusive_m2 = data.전용면적.m2;
    }

    // Floor
    listing.floor = data.floor;
    listing.total_floors = data.building_floor;

    // Type
    listing.room_type = data.room_type_title || data.room_type;
    listing.service_type = data.service_type;

    // Location
    if (data.addressOrigin) {
      listing.local1 = data.addressOrigin.local1 || '';
      listing.local2 = data.addressOrigin.local2 || '';
      listing.local3 = data.addressOrigin.local3 || '';
      if (!listing.address) {
        listing.address = data.addressOrigin.fullText || '';
      }
    }

    const location = data.location || data.random_location;
    if (location) {
      listing.lat = location.lat;
      listing.lng = location.lng;
    }

    // Images
    if (listing.thumbnail) {
      listing.images = [listing.thumbnail];
    }

    // Maintenance cost
    if (data.manage_cost) {
      try {
        listing.manage_cost =
          typeof data.manage_cost === 'string'
            ? parseInt(data.manage_cost)
            : data.manage_cost;
      } catch (error) {
        // Ignore parse errors
      }
    }

    // Date
    listing.reg_date = data.reg_date;

    return listing;
  }

  /**
   * Search for listings in a city
   */
  async search(options: SearchOptions = {}): Promise<{
    listings: ZigbangListing[];
    totalCount: number;
  }> {
    const {
      city = config.defaultCity,
      property_type = PropertyType.ONEROOM,
      deposit_min = 0,
      deposit_max,
      rent_min = 0,
      rent_max,
      limit,
    } = options;

    const geohashes = CITY_GEOHASHES[city] || ['wydm'];
    const allItemIds = new Set<number>();

    console.log(`Searching ${city} for ${property_type}...`);

    // Search each geohash with expanded suffixes
    for (const geohash of geohashes) {
      for (const suffix of GEOHASH_SUFFIXES) {
        try {
          const itemIds = await this.getItemsByGeohash(
            geohash + suffix,
            property_type,
            deposit_min,
            deposit_max,
            rent_min,
            rent_max
          );
          itemIds.forEach((id) => allItemIds.add(id));

          if (config.debug) {
            console.log(
              `Found ${itemIds.length} items in ${geohash}${suffix} (total: ${allItemIds.size})`
            );
          }
        } catch (error) {
          if (config.debug) {
            console.debug(`Error fetching ${geohash}${suffix}:`, error);
          }
        }
      }
    }

    const totalCount = allItemIds.size;
    console.log(`Found ${totalCount} unique listings in ${city}`);

    // Apply limit
    let itemIds = Array.from(allItemIds);
    if (limit) {
      itemIds = itemIds.slice(0, limit);
    }

    // Get details
    const listings = await this.getItemDetails(itemIds);

    return { listings, totalCount };
  }

  /**
   * Get count of listings for a city and property type
   */
  async getCount(
    city: string = config.defaultCity,
    propertyType: PropertyType = PropertyType.ONEROOM
  ): Promise<number> {
    const result = await this.search({ city, property_type: propertyType, limit: 0 });
    return result.totalCount;
  }
}

/**
 * Main scraping function
 */
async function scrape() {
  console.log(`Starting ${config.portal} scraper for ${config.country}`);

  const scraper = new ZigbangScraper();

  try {
    // Search for properties
    const cities = ['Seoul', 'Busan', 'Incheon'];
    const propertyTypes = [PropertyType.ONEROOM, PropertyType.OFFICETEL];

    for (const city of cities) {
      for (const propertyType of propertyTypes) {
        console.log(`\n--- Scraping ${city} - ${propertyType} ---`);

        const { listings, totalCount } = await scraper.search({
          city,
          property_type: propertyType,
          limit: config.maxResults,
        });

        console.log(`Processing ${listings.length} of ${totalCount} listings...`);

        // Process each listing
        for (const listing of listings) {
          try {
            const standardized = transformToStandard(listing);

            // Send to Landomo Core Service
            await sendToCoreService({
              portal: config.portal,
              portal_id: listing.id.toString(),
              country: config.country,
              data: standardized,
              raw_data: listing.raw_data,
            });

            if (config.debug) {
              console.log(`Processed listing ${listing.id}: ${listing.title}`);
            }
          } catch (error) {
            console.error(`Error processing listing ${listing.id}:`, error);
            // Continue with next listing
          }
        }

        console.log(`Completed ${city} - ${propertyType}`);
      }
    }

    console.log('\nScraping completed successfully');
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

// Run scraper if executed directly
if (require.main === module) {
  scrape();
}

export { scrape };
