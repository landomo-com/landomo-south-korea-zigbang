/**
 * Core utilities for Landomo scrapers
 * Temporary implementation until @landomo/core package is available
 */

import axios from 'axios';
import { config } from './config';

/**
 * Standard property format for Landomo
 */
export interface StandardProperty {
  // Basic Information
  title: string;
  price: number;
  currency: string;
  property_type: string;
  transaction_type: 'sale' | 'rent';

  // Location
  location: {
    address?: string;
    city?: string;
    state?: string;
    neighborhood?: string;
    postal_code?: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };

  // Details
  details: {
    bedrooms?: number;
    bathrooms?: number;
    sqm?: number;
    sqft?: number;
    rooms?: number;
    year_built?: number;
  };

  // Features & Amenities
  features?: string[];
  amenities?: {
    has_parking?: boolean;
    has_balcony?: boolean;
    has_garden?: boolean;
    has_pool?: boolean;
    has_elevator?: boolean;
    has_ac?: boolean;
    has_heating?: boolean;
    [key: string]: boolean | undefined;
  };

  // Country-Specific Fields
  country_specific?: Record<string, any>;

  // Media
  images?: string[];
  videos?: string[];
  virtual_tour_url?: string;
  description?: string;

  // Metadata
  url?: string;
  status?: 'active' | 'inactive' | 'sold' | 'rented';
  listing_date?: string;
  updated_date?: string;
}

/**
 * Payload for ingesting properties to Core Service
 */
export interface IngestionPayload {
  portal: string;
  portal_id: string;
  country: string;
  data: StandardProperty;
  raw_data: any;
}

/**
 * Send property data to Landomo Core Service
 */
export async function sendToCoreService(payload: IngestionPayload): Promise<void> {
  const url = `${config.apiUrl}/properties/ingest`;

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    if (config.debug) {
      console.log(`Sent property ${payload.portal_id} to Core Service`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        `Failed to send property ${payload.portal_id}:`,
        error.response?.status,
        error.response?.data
      );
    } else {
      console.error(`Failed to send property ${payload.portal_id}:`, error);
    }
    throw error;
  }
}

/**
 * Parse price from string
 */
export function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;

  // Remove currency symbols and commas
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(cleaned);

  return isNaN(price) ? 0 : price;
}

/**
 * Get currency code for a country
 */
export function getCurrency(country: string): string {
  const currencies: Record<string, string> = {
    'south-korea': 'KRW',
    australia: 'AUD',
    uk: 'GBP',
    usa: 'USD',
    spain: 'EUR',
    italy: 'EUR',
    france: 'EUR',
    germany: 'EUR',
  };

  return currencies[country] || 'USD';
}

/**
 * Normalize property type to standard values
 */
export function normalizePropertyType(type: string): string {
  const normalized = type.toLowerCase().trim();

  if (normalized.includes('apartment') || normalized.includes('flat')) {
    return 'apartment';
  }
  if (normalized.includes('house') || normalized.includes('detached')) {
    return 'house';
  }
  if (normalized.includes('villa')) {
    return 'villa';
  }
  if (normalized.includes('townhouse') || normalized.includes('terraced')) {
    return 'townhouse';
  }
  if (normalized.includes('land') || normalized.includes('plot')) {
    return 'land';
  }
  if (normalized.includes('commercial') || normalized.includes('office')) {
    return 'commercial';
  }

  return 'other';
}
