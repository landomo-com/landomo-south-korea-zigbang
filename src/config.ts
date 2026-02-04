import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Landomo Core Service
  apiUrl: process.env.LANDOMO_API_URL || 'https://core.landomo.com/api/v1',
  apiKey: process.env.LANDOMO_API_KEY || '',

  // Scraper Identity
  portal: 'zigbang',
  country: 'south-korea',

  // Zigbang API
  zigbangApiUrl: 'https://apis.zigbang.com',
  zigbangWebUrl: 'https://www.zigbang.com',

  // Scraper Behavior
  debug: process.env.DEBUG === 'true',
  requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || '300'),
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5'),
  batchSize: parseInt(process.env.BATCH_SIZE || '100'),

  // Search defaults
  defaultCity: process.env.DEFAULT_CITY || 'Seoul',
  maxResults: parseInt(process.env.MAX_RESULTS || '1000'),

  // Optional: Scraper Database (Tier 1)
  scraperDb: {
    host: process.env.SCRAPER_DB_HOST,
    port: parseInt(process.env.SCRAPER_DB_PORT || '5432'),
    database: process.env.SCRAPER_DB_NAME,
    user: process.env.SCRAPER_DB_USER,
    password: process.env.SCRAPER_DB_PASSWORD,
  },

  // Optional: Proxy
  proxy: {
    url: process.env.PROXY_URL,
    username: process.env.PROXY_USERNAME,
    password: process.env.PROXY_PASSWORD,
  },
};

// Validate required config
if (!config.apiKey && process.env.NODE_ENV === 'production') {
  console.error('ERROR: LANDOMO_API_KEY is required in production');
  process.exit(1);
}
