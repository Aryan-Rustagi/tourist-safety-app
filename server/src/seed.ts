import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { SafetyZone } from './models/SafetyZone.js';
import { IncidentReport } from './models/IncidentReport.js';
import { EmergencyContact } from './models/EmergencyContact.js';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Clearing existing demo data...');

    await User.deleteMany({});
    await SafetyZone.deleteMany({});
    await IncidentReport.deleteMany({});
    await EmergencyContact.deleteMany({});

    console.log('👤 Creating default demo users...');
    const tourist = await User.create({
      name: 'Elena Rostova',
      email: 'tourist@safetour.app',
      password: 'password123',
      phone: '+1 (555) 234-5678',
      role: 'TOURIST',
    });

    const admin = await User.create({
      name: 'Chief Sarah Jenkins',
      email: 'admin@safetour.app',
      password: 'password123',
      phone: '+1 (555) 999-0000',
      role: 'ADMIN',
    });

    console.log('📞 Creating emergency contacts...');
    await EmergencyContact.create([
      {
        userId: tourist._id,
        name: 'Mark Rostova (Spouse)',
        phone: '+1 (555) 345-6789',
        relationship: 'Spouse',
        isPrimary: true,
      },
      {
        userId: tourist._id,
        name: 'Embassy Consular Services',
        phone: '+1 (555) 000-1122',
        relationship: 'Embassy / Consulate',
        isPrimary: false,
      },
    ]);

    console.log('🛡️ Creating safety zones...');
    await SafetyZone.create([
      {
        name: 'Central Tourist Police Booth & First Aid',
        description: '24/7 manned police assistance booth with certified first responders and translators.',
        riskLevel: 'LOW',
        latitude: 28.6139,
        longitude: 77.209,
        radiusMeters: 600,
      },
      {
        name: 'Heritage Corridor Safe Haven',
        description: 'High-visibility monitored tourist precinct with active security patrols and CCTV.',
        riskLevel: 'LOW',
        latitude: 28.619,
        longitude: 77.215,
        radiusMeters: 800,
      },
      {
        name: 'Old Bazaar Concourse',
        description: 'Crowded market area. Keep valuables secure and be vigilant of pickpockets.',
        riskLevel: 'MEDIUM',
        latitude: 28.6505,
        longitude: 77.2303,
        radiusMeters: 450,
      },
      {
        name: 'Unlit Alleyway / High Alert Zone',
        description: 'Poor lighting and reported aggressive touts after dark. Avoid traveling alone.',
        riskLevel: 'HIGH',
        latitude: 28.642,
        longitude: 77.221,
        radiusMeters: 300,
      },
    ]);

    console.log('⚠️ Creating sample incident reports...');
    await IncidentReport.create([
      {
        userId: tourist._id,
        title: 'Overcharging Scam by Unlicensed Taxi',
        description: 'Driver refused to engage meter and demanded 5x tariff upon arrival. Reported to local authorities.',
        category: 'SCAM',
        latitude: 28.6145,
        longitude: 77.211,
        address: 'Outside Gate 3, Central Metro Station',
        isVerified: true,
        verifiedBy: admin._id,
      },
      {
        userId: tourist._id,
        title: 'Pickpocketing attempt near ticket counter',
        description: 'Two individuals creating fake distraction while attempting to unclip backpack zipper.',
        category: 'THEFT',
        latitude: 28.651,
        longitude: 77.231,
        address: 'Bazaar North Entrance',
        isVerified: true,
        verifiedBy: admin._id,
      },
    ]);

    console.log('✅ Demo database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
