/**
 * Test script for Zigbang scraper
 *
 * Run with: npx tsx src/test-scraper.ts
 */

import { ZigbangScraper } from './scraper';
import { transformToStandard, formatKoreanPrice } from './transformer';
import { PropertyType } from './types';

async function test() {
  console.log('='.repeat(60));
  console.log('Zigbang Scraper Test');
  console.log('='.repeat(60));

  const scraper = new ZigbangScraper();

  try {
    // Test 1: Get count for Seoul onerooms
    console.log('\n--- Test 1: Get Count ---');
    const count = await scraper.getCount('Seoul', PropertyType.ONEROOM);
    console.log(`Found ${count.toLocaleString()} onerooms in Seoul`);

    // Test 2: Scrape sample listings
    console.log('\n--- Test 2: Scrape Sample Listings ---');
    const { listings, totalCount } = await scraper.search({
      city: 'Seoul',
      property_type: PropertyType.ONEROOM,
      limit: 5,
    });

    console.log(`\nProcessing ${listings.length} of ${totalCount} listings\n`);

    // Display listings
    for (const listing of listings) {
      console.log(`Listing ${listing.id}:`);
      console.log(`  Title: ${listing.title}`);
      console.log(`  Type: ${listing.service_type || listing.room_type}`);
      console.log(`  Price: ${formatKoreanPrice(listing)}`);
      console.log(`  Size: ${listing.size_m2 || 'N/A'} m²`);
      console.log(`  Location: ${listing.local2} ${listing.local3}`);
      console.log(`  Address: ${listing.address}`);
      if (listing.floor) {
        console.log(`  Floor: ${listing.floor}/${listing.total_floors || '?'}`);
      }
      if (listing.manage_cost) {
        console.log(`  Maintenance: ${listing.manage_cost}만원/month`);
      }
      console.log(`  URL: ${listing.url}`);
      console.log();

      // Test transformation
      const standardized = transformToStandard(listing);
      console.log(`  Standardized:`);
      console.log(`    Price: ${standardized.price.toLocaleString()} ${standardized.currency}`);
      console.log(`    Type: ${standardized.property_type}`);
      console.log(`    Transaction: ${standardized.transaction_type}`);
      console.log(`    Bedrooms: ${standardized.details.bedrooms || 0}`);
      console.log(`    Rooms: ${standardized.details.rooms || 0}`);
      console.log(`    City: ${standardized.location.city}`);
      console.log();
    }

    // Test 3: Scrape different property type
    console.log('\n--- Test 3: Scrape Officetel ---');
    const { listings: officetels, totalCount: officeTelCount } = await scraper.search({
      city: 'Seoul',
      property_type: PropertyType.OFFICETEL,
      limit: 3,
    });

    console.log(`\nFound ${officeTelCount} officetels, showing ${officetels.length}:\n`);

    for (const listing of officetels) {
      console.log(`  - ${listing.title.substring(0, 50)}...`);
      console.log(`    ${formatKoreanPrice(listing)} | ${listing.size_m2 || 'N/A'} m²`);
      console.log(`    ${listing.local2} ${listing.local3}`);
      console.log();
    }

    console.log('\n='.repeat(60));
    console.log('Test completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\nTest failed:', error);
    process.exit(1);
  }
}

// Run test
test();
