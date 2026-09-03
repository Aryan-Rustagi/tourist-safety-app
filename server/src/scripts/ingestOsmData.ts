import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../config/db.js';
import { ingestOsmData, CITY_PRESETS } from '../utils/osmService.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  let cityKey = 'delhi';
  let radiusMeters: number | undefined;
  let lat: number | undefined;
  let lng: number | undefined;
  let clearExisting = false;

  for (const arg of args) {
    if (arg.startsWith('--city=')) {
      cityKey = arg.split('=')[1].toLowerCase().trim();
    } else if (arg.startsWith('--radius=')) {
      radiusMeters = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--lat=')) {
      lat = parseFloat(arg.split('=')[1]);
    } else if (arg.startsWith('--lng=')) {
      lng = parseFloat(arg.split('=')[1]);
    } else if (arg === '--clean' || arg === '--clear') {
      clearExisting = true;
    }
  }

  return { cityKey, radiusMeters, lat, lng, clearExisting };
}

async function run() {
  console.log('🌐 =======================================================');
  console.log('🛡️  Tourist Safety App — Real-World OSM Ingestion Engine');
  console.log('🌐 =======================================================\n');

  try {
    await connectDB();
    const options = parseArgs();

    console.log(`📍 Target Area: ${options.cityKey.toUpperCase()}`);
    if (CITY_PRESETS[options.cityKey]) {
      console.log(`📌 Area Description: ${CITY_PRESETS[options.cityKey].description}`);
    }
    if (options.clearExisting) {
      console.log('🧹 Mode: Clean overwrite (clearing existing zones)');
    } else {
      console.log('➕ Mode: Smart append with deduplication');
    }

    console.log('\n⏳ Querying OpenStreetMap Overpass API for:');
    console.log('   • 🚔 Police Stations & Tourist Assistance Booths (amenity=police)');
    console.log('   • 🏥 24/7 Hospitals & Emergency Care (amenity=hospital, clinic)');
    console.log('   • 🏛️ Embassies & High Commissions (amenity=embassy)');
    console.log('   • ℹ️ Tourist Information Counters (tourism=information)...\n');

    const result = await ingestOsmData(options);

    console.log('✅ =======================================================');
    console.log(`🎉 Ingestion Completed Successfully!`);
    console.log(`📡 Data Source: ${result.source}`);
    console.log(`📍 City / Region: ${result.cityOrArea}`);
    console.log(`📊 Total Facilities Discovered: ${result.totalFetched}`);
    console.log(`💾 Total New Safety Zones Inserted: ${result.totalInserted}`);
    console.log(`🚨 Total Red Alert Zones Inserted: ${result.totalRedZonesInserted}`);
    console.log('-------------------------------------------------------');
    console.log('📋 Category Breakdown:');
    console.log(`   • Police Stations:    ${result.breakdown.police}`);
    console.log(`   • Hospitals / Trauma: ${result.breakdown.hospitals}`);
    console.log(`   • Embassies:          ${result.breakdown.embassies}`);
    console.log(`   • Tourist Help Desks: ${result.breakdown.touristInfo}`);
    console.log('=======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during OSM data ingestion:', error);
    process.exit(1);
  }
}

run();
