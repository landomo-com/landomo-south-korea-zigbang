import { StandardProperty } from './core';
import { ZigbangListing, SalesType } from './types';
import { config } from './config';

/**
 * Transform Zigbang listing data to StandardProperty format
 *
 * Zigbang is South Korea's largest rental property platform with
 * unique rental structures (jeonse, monthly rent) that need special handling.
 */
export function transformToStandard(listing: ZigbangListing): StandardProperty {
  // Determine transaction type from sales_type
  const transactionType = determineTransactionType(listing.sales_type);

  // Calculate price based on Korean rental system
  const { price, monthlyRent } = calculatePrice(listing);

  return {
    // Basic Information
    title: listing.title,
    price: price,
    currency: 'KRW',
    property_type: normalizePropertyType(listing.room_type, listing.service_type),
    transaction_type: transactionType,

    // Location
    location: {
      address: listing.address,
      city: listing.local1 || listing.local2,
      state: listing.local1, // Province/City level
      neighborhood: listing.local3,
      country: config.country,
      coordinates:
        listing.lat && listing.lng
          ? {
              lat: listing.lat,
              lon: listing.lng,
            }
          : undefined,
    },

    // Details
    details: {
      bedrooms: extractBedrooms(listing.room_type),
      bathrooms: 1, // Default for Korean properties, not always specified
      sqm: listing.size_m2,
      rooms: extractRooms(listing.room_type),
    },

    // Features & Amenities
    features: extractFeatures(listing),
    amenities: {
      has_parking: false, // Not specified in basic data
      has_balcony: false,
      has_garden: false,
      has_pool: false,
    },

    // Country-Specific Fields for South Korea
    country_specific: {
      // Rental System (unique to Korea)
      sales_type: listing.sales_type, // 월세 (monthly), 전세 (jeonse), 매매 (sale)
      deposit_man_won: listing.deposit, // Deposit in 만원 (10,000 KRW)
      deposit_krw: listing.deposit ? listing.deposit * 10000 : undefined,
      rent_man_won: listing.rent, // Monthly rent in 만원
      rent_krw: listing.rent ? listing.rent * 10000 : undefined,
      monthly_rent_krw: monthlyRent,

      // Size measurements
      exclusive_area_m2: listing.exclusive_m2, // 전용면적
      supply_area_m2: listing.size_m2, // 공급면적

      // Floor information
      floor: listing.floor,
      total_floors: listing.total_floors,

      // Room type (Korean classification)
      room_type: listing.room_type, // e.g., "원룸", "투룸", etc.
      service_type: listing.service_type, // e.g., "원룸", "오피스텔", etc.

      // Maintenance
      manage_cost_man_won: listing.manage_cost, // Monthly maintenance fee in 만원
      manage_cost_krw: listing.manage_cost ? listing.manage_cost * 10000 : undefined,

      // Location details
      local1: listing.local1, // Province/City (e.g., "서울특별시")
      local2: listing.local2, // District (e.g., "강남구")
      local3: listing.local3, // Neighborhood (e.g., "역삼동")

      // Metadata
      is_new: listing.is_new,
      reg_date: listing.reg_date,
    },

    // Media
    images: listing.images,
    description: listing.title, // Zigbang uses title as main description

    // Metadata
    url: listing.url,
    status: 'active',
    listing_date: listing.reg_date ? new Date(listing.reg_date).toISOString() : undefined,
  };
}

/**
 * Determine transaction type from Korean sales type
 */
function determineTransactionType(salesType: string): 'sale' | 'rent' {
  if (!salesType) return 'rent'; // Default for Zigbang

  // 매매 = sale, everything else is rental
  if (salesType === SalesType.SALE || salesType.includes('매매')) {
    return 'sale';
  }

  return 'rent';
}

/**
 * Calculate price based on Korean rental system
 *
 * Korea has two main rental systems:
 * 1. 월세 (Monthly Rent): deposit + monthly rent
 * 2. 전세 (Jeonse): large deposit, no monthly rent (returned at end)
 * 3. 매매 (Sale): purchase price
 */
function calculatePrice(listing: ZigbangListing): {
  price: number;
  monthlyRent?: number;
} {
  const salesType = listing.sales_type;

  // For sale: use deposit as sale price (in 만원 = 10,000 KRW)
  if (salesType === SalesType.SALE || salesType?.includes('매매')) {
    return {
      price: listing.deposit ? listing.deposit * 10000 : 0,
    };
  }

  // For 전세 (Jeonse): use deposit as price
  if (salesType === SalesType.JEONSE || salesType?.includes('전세')) {
    return {
      price: listing.deposit ? listing.deposit * 10000 : 0,
    };
  }

  // For 월세 (Monthly Rent): deposit + (monthly rent * 12)
  // This gives an annualized value for comparison
  const deposit = listing.deposit || 0;
  const monthlyRent = listing.rent || 0;
  const annualizedRent = monthlyRent * 12;

  return {
    price: (deposit + annualizedRent) * 10000, // Convert to KRW
    monthlyRent: monthlyRent * 10000, // Monthly rent in KRW
  };
}

/**
 * Normalize property type from Korean classifications to standard types
 */
function normalizePropertyType(
  roomType?: string,
  serviceType?: string
): string {
  const type = (roomType || serviceType || '').toLowerCase();

  // Officetels (office-residence hybrid)
  if (type.includes('오피스텔') || type.includes('officetel')) {
    return 'apartment';
  }

  // Apartments
  if (type.includes('아파트') || type.includes('apart')) {
    return 'apartment';
  }

  // Villas (low-rise residential)
  if (type.includes('빌라') || type.includes('villa')) {
    return 'apartment';
  }

  // Onerooms (studios)
  if (type.includes('원룸') || type.includes('oneroom')) {
    return 'apartment';
  }

  // Tworooms
  if (type.includes('투룸') || type.includes('tworoom')) {
    return 'apartment';
  }

  // Townhouses
  if (type.includes('타운하우스') || type.includes('townhouse')) {
    return 'townhouse';
  }

  // Default
  return 'apartment';
}

/**
 * Extract bedroom count from Korean room type
 */
function extractBedrooms(roomType?: string): number {
  if (!roomType) return 0;

  const type = roomType.toLowerCase();

  // 원룸 (oneroom) = studio = 0 bedrooms
  if (type.includes('원룸') || type.includes('oneroom')) {
    return 0;
  }

  // 투룸 (tworoom) = 1 bedroom + 1 living room
  if (type.includes('투룸') || type.includes('tworoom')) {
    return 1;
  }

  // 쓰리룸 (threeroom) = 2 bedrooms + 1 living room
  if (type.includes('쓰리룸') || type.includes('threeroom')) {
    return 2;
  }

  // Try to extract number from format like "3room", "4room"
  const match = type.match(/(\d+)room/);
  if (match) {
    const rooms = parseInt(match[1]);
    return Math.max(0, rooms - 1); // Subtract 1 for living room
  }

  // Default
  return 0;
}

/**
 * Extract total room count from Korean room type
 */
function extractRooms(roomType?: string): number {
  if (!roomType) return 1;

  const type = roomType.toLowerCase();

  // Extract number from format like "원룸", "투룸", "쓰리룸"
  if (type.includes('원룸') || type.includes('oneroom')) {
    return 1;
  }
  if (type.includes('투룸') || type.includes('tworoom')) {
    return 2;
  }
  if (type.includes('쓰리룸') || type.includes('threeroom')) {
    return 3;
  }

  // Try to extract number
  const match = type.match(/(\d+)room/);
  if (match) {
    return parseInt(match[1]);
  }

  return 1;
}

/**
 * Extract features from listing data
 */
function extractFeatures(listing: ZigbangListing): string[] {
  const features: string[] = [];

  if (listing.service_type) {
    features.push(`Type: ${listing.service_type}`);
  }

  if (listing.floor) {
    features.push(`Floor: ${listing.floor}`);
  }

  if (listing.total_floors) {
    features.push(`Total Floors: ${listing.total_floors}`);
  }

  if (listing.manage_cost) {
    features.push(`Management Fee: ${listing.manage_cost}만원`);
  }

  if (listing.is_new) {
    features.push('New Listing');
  }

  return features;
}

/**
 * Format Korean address for display
 */
export function formatKoreanAddress(
  local1: string,
  local2: string,
  local3: string,
  address?: string
): string {
  if (address) return address;

  const parts = [local1, local2, local3].filter(Boolean);
  return parts.join(' ');
}

/**
 * Convert 만원 (10,000 KRW) to KRW
 */
export function manWonToKrw(manWon?: number): number | undefined {
  return manWon ? manWon * 10000 : undefined;
}

/**
 * Format Korean price display
 */
export function formatKoreanPrice(listing: ZigbangListing): string {
  const salesType = listing.sales_type;

  if (salesType === SalesType.JEONSE || salesType?.includes('전세')) {
    return `전세 ${listing.deposit}만원`;
  }

  if (salesType === SalesType.MONTHLY_RENT || salesType?.includes('월세')) {
    return `월세 ${listing.deposit}/${listing.rent}만원`;
  }

  if (salesType === SalesType.SALE || salesType?.includes('매매')) {
    return `매매 ${listing.deposit}만원`;
  }

  return `${listing.deposit || 0}만원`;
}
