/**
 * Portal-specific types
 *
 * Define the data structures returned by the portal's API or HTML
 */

export interface PortalListing {
  // Define portal-specific fields here
  id: string;
  title: string;
  price: number;
  // ... add more fields as needed
}

export interface PortalDetails {
  // Define portal-specific detail fields
  listing: PortalListing;
  description: string;
  features: string[];
  // ... add more fields as needed
}

export interface ScraperConfig {
  baseUrl: string;
  listingsPerPage: number;
  maxPages?: number;
  districts?: string[];
}
