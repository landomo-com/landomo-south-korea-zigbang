/**
 * Zigbang Portal-specific types
 *
 * Zigbang is South Korea's largest rental property platform
 * with focus on onerooms (studios), officetels, villas, and apartments.
 */

export enum PropertyType {
  ONEROOM = 'onerooms',      // Studio apartments
  OFFICETEL = 'officetels',  // Office-residence hybrid buildings
  VILLA = 'villas',          // Villas (low-rise apartments)
  APARTMENT = 'aparts',      // Traditional apartments
}

export enum SalesType {
  MONTHLY_RENT = '월세',     // Monthly rent
  JEONSE = '전세',           // Long-term deposit (key money)
  SALE = '매매',             // For sale
}

/**
 * Geohash codes for major Korean cities
 */
export const CITY_GEOHASHES: Record<string, string[]> = {
  Seoul: ['wydm', 'wydn', 'wydj', 'wydk'],
  Busan: ['wy7m', 'wy7n', 'wy7j', 'wy7k'],
  Incheon: ['wyc5', 'wyc7', 'wycc', 'wycf'],
  Daegu: ['wy8p', 'wy8r', 'wy8x', 'wy8z'],
  Daejeon: ['wyd1', 'wyd3', 'wyd4', 'wyd5'],
  Gwangju: ['wy6v', 'wy6y', 'wy6z', 'wyd0'],
  Ulsan: ['wydh', 'wydk', 'wye0', 'wye1'],
  Sejong: ['wyc8', 'wycb', 'wycc'],
};

/**
 * Geohash expansion suffixes for more granular searches
 */
export const GEOHASH_SUFFIXES = [
  '', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm',
  'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

/**
 * API Response from Zigbang items list endpoint
 */
export interface ZigbangItemsResponse {
  items: ZigbangItemSummary[];
}

export interface ZigbangItemSummary {
  id: number;
  // Other fields present in listings endpoint
}

/**
 * API Response from Zigbang details endpoint
 */
export interface ZigbangDetailsResponse {
  items: ZigbangListingData[];
}

/**
 * Raw listing data from Zigbang API
 */
export interface ZigbangListingData {
  item_id?: number;
  id?: number;
  title: string;
  sales_type?: string;
  sales_title?: string;
  deposit?: number;           // In 만원 (10,000 KRW)
  rent?: number;              // In 만원 (10,000 KRW)
  size_m2?: number;
  공급면적?: {
    m2?: number;
  };
  전용면적?: {
    m2?: number;
  };
  floor?: string;
  building_floor?: string;
  room_type_title?: string;
  room_type?: string;
  service_type?: string;
  address?: string;
  addressOrigin?: {
    local1?: string;           // Province/City
    local2?: string;           // District
    local3?: string;           // Neighborhood
    fullText?: string;
  };
  location?: {
    lat?: number;
    lng?: number;
  };
  random_location?: {
    lat?: number;
    lng?: number;
  };
  images_thumbnail?: string;
  manage_cost?: string | number;  // Monthly maintenance fee
  reg_date?: string;
  is_new?: boolean;
}

/**
 * Parsed listing object
 */
export interface ZigbangListing {
  id: number;
  title: string;
  sales_type: string;
  deposit?: number;            // In 만원 (10,000 KRW)
  rent?: number;               // In 만원 (10,000 KRW)
  size_m2?: number;
  exclusive_m2?: number;
  floor?: string;
  total_floors?: string;
  room_type?: string;
  service_type?: string;
  address: string;
  local1: string;              // Province/City
  local2: string;              // District
  local3: string;              // Neighborhood
  lat?: number;
  lng?: number;
  images: string[];
  thumbnail: string;
  manage_cost?: number;        // Monthly maintenance fee
  reg_date?: string;
  is_new: boolean;
  url: string;
  raw_data: ZigbangListingData;
}

/**
 * Search options
 */
export interface SearchOptions {
  city?: string;
  property_type?: PropertyType;
  deposit_min?: number;        // In 만원 (10,000 KRW)
  deposit_max?: number;        // In 만원
  rent_min?: number;           // In 만원
  rent_max?: number;           // In 만원
  limit?: number;
}

/**
 * Scraper configuration
 */
export interface ScraperConfig {
  baseUrl: string;
  apiBaseUrl: string;
  requestDelayMs: number;
  batchSize: number;
}
