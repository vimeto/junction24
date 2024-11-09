import { db } from './index';
import { items, locations, organizations } from './schema';

const ITEMS_DATA = [
  {
    identifier: 'PUMP-001',
    itemType: 'item',
    identifierType: 'serial',
    requireImage: true,
    metadata: JSON.stringify({
      type: 'Pump',
      manufacturer: 'ABB',
      model: 'CP-400',
    }),
  },
  {
    identifier: 'MOTOR-A102',
    itemType: 'item',
    identifierType: 'serial',
    requireImage: true,
    metadata: JSON.stringify({
      type: 'Electric Motor',
      manufacturer: 'Siemens',
      model: 'EM-2000',
    }),
  },
  {
    identifier: 'VALVE-X23',
    itemType: 'collection',
    identifierType: 'part_no',
    requireImage: false,
    collectionAmount: 5,
    metadata: JSON.stringify({
      type: 'Control Valve',
      manufacturer: 'Flowserve',
      model: 'CV-100',
    }),
  },
  {
    identifier: 'SENSOR-T01',
    itemType: 'item',
    identifierType: 'serial',
    requireImage: true,
    metadata: JSON.stringify({
      type: 'Temperature Sensor',
      manufacturer: 'Endress+Hauser',
      model: 'TS-500',
    }),
  },
  {
    identifier: 'TANK-001',
    itemType: 'item',
    identifierType: 'serial',
    requireImage: true,
    metadata: JSON.stringify({
      type: 'Storage Tank',
      manufacturer: 'Custom Steel',
      model: 'ST-1000L',
    }),
  },
  {
    identifier: 'FILTER-SET',
    itemType: 'collection',
    identifierType: 'part_no',
    requireImage: false,
    collectionAmount: 10,
    metadata: JSON.stringify({
      type: 'Filter Set',
      manufacturer: 'Parker',
      model: 'F-200',
    }),
  },
  {
    identifier: 'COMP-A01',
    itemType: 'item',
    identifierType: 'serial',
    requireImage: true,
    metadata: JSON.stringify({
      type: 'Air Compressor',
      manufacturer: 'Atlas Copco',
      model: 'AC-2000',
    }),
  },
  {
    identifier: 'BELT-SET',
    itemType: 'collection',
    identifierType: 'part_no',
    requireImage: false,
    collectionAmount: 3,
    metadata: JSON.stringify({
      type: 'Drive Belts',
      manufacturer: 'Gates',
      model: 'DB-300',
    }),
  },
  {
    identifier: 'PLC-001',
    itemType: 'item',
    identifierType: 'serial',
    requireImage: true,
    metadata: JSON.stringify({
      type: 'PLC Controller',
      manufacturer: 'Siemens',
      model: 'S7-1500',
    }),
  },
  {
    identifier: 'TOOL-KIT',
    itemType: 'collection',
    identifierType: 'part_no',
    requireImage: false,
    collectionAmount: 15,
    metadata: JSON.stringify({
      type: 'Maintenance Tool Kit',
      manufacturer: 'Stanley',
      model: 'MTK-100',
    }),
  },
];



const LOCATIONS_DATA = [
  {
    name: 'Main Production Hall',
    latitude: '60.161917',
    longitude: '24.902476',
  },
  {
    name: 'Storage Room A',
    latitude: '60.162082',
    longitude: '24.903487',
  },
  {
    name: 'Maintenance Workshop',
    latitude: '60.161917',
    longitude: '24.902476',
  },
  {
    name: 'Control Room',
    latitude: '60.162082',
    longitude: '24.903487',
  },
  {
    name: 'Tool Storage',
    latitude: '60.162380',
    longitude: '24.904814',
  },
  {
    name: 'Assembly Area',
    latitude: '60.162380',
    longitude: '24.904814',
  },
  {
    name: 'Quality Control',
    latitude: '60.162380',
    longitude: '24.904814',
  },
  {
    name: 'Shipping Area',
    latitude: '60.161997',
    longitude: '24.905360',
  },
  {
    name: 'Raw Materials Storage',
    latitude: '60.161997',
    longitude: '24.905360',
  },
  {
    name: 'Technical Office',
    latitude: '60.162380',
    longitude: '24.904814',
  },
];

async function seedItemsAndLocations() {
  try {
    console.log('🌱 Starting items and locations seeding...');

    // Create a test organization if it doesn't exist
    const [organization] = await db
      .insert(organizations)
      .values({
        name: 'Kaapelitehdas Oy',
      })
      .returning();

    console.log('Created organization:', organization.name);

    // Create locations
    const createdLocations = await Promise.all(
      LOCATIONS_DATA.map(async (locationData) => {
        const [location] = await db
          .insert(locations)
          .values({
            ...locationData,
            organizationId: organization.id,
          })
          .returning();
        return location;
      })
    );

    console.log(`Created ${createdLocations.length} locations`);

    // Create items
    const createdItems = await Promise.all(
      ITEMS_DATA.map(async (itemData) => {
        const [item] = await db.insert(items).values(itemData).returning();
        return item;
      })
    );

    console.log(`Created ${createdItems.length} items`);

    console.log('✅ Seeding completed successfully!');
    return { items: createdItems, locations: createdLocations };
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run the seed function
seedItemsAndLocations()
  .then(() => {
    console.log('🎉 Items and locations seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed items and locations:', error);
    process.exit(1);
  });