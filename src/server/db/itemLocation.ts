"use server";

import { db } from './index';
import { items, locations, organizations } from './schema';

type ItemData = typeof items.$inferInsert;

const ITEMS_DATA: ItemData[] = [
    {
      identifier: 'PUMP-001',
      itemType: 'item',
      identifierType: 'serial',
      requireImage: true,
      requireImageConfirmation: false,
      collectionAmount: 1,
      metadata: JSON.stringify({
        type: 'Pump',
        manufacturer: 'ABB',
        model: 'CP-400',
        description: 'Industrial grade water pump',
      }),
    },
    {
      identifier: 'SENSOR-T01',
      itemType: 'item',
      identifierType: 'serial',
      requireImage: true,
      requireImageConfirmation: true,
      collectionAmount: 1,
      metadata: JSON.stringify({
        type: 'Temperature Sensor',
        manufacturer: 'Endress+Hauser',
        model: 'TS-500',
        description: 'High-precision temperature sensor',
      }),
    },
    {
      identifier: 'FILTER-SET',
      itemType: 'collection',
      identifierType: 'part_no',
      requireImage: false,
      requireImageConfirmation: false,
      collectionAmount: 10,
      metadata: JSON.stringify({
        type: 'Filter Set',
        manufacturer: 'Parker',
        model: 'F-200',
        description: 'Industrial filtration system filters',
      }),
    },
    {
      identifier: 'VALVE-001',
      itemType: 'item',
      identifierType: 'serial',
      requireImage: true,
      requireImageConfirmation: true,
      collectionAmount: 1,
      metadata: JSON.stringify({
        type: 'Control Valve',
        manufacturer: 'Siemens',
        model: 'CV-800',
        description: 'Automated control valve for fluid systems',
      }),
    },
    {
      identifier: 'TOOLS-KIT',
      itemType: 'collection',
      identifierType: 'part_no',
      requireImage: true,
      requireImageConfirmation: false,
      collectionAmount: 5,
      metadata: JSON.stringify({
        type: 'Maintenance Kit',
        manufacturer: 'Bosch',
        model: 'MK-100',
        description: 'Complete maintenance tool set',
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
    name: 'Shipping Area',
    latitude: '60.161997',
    longitude: '24.905360',
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

    console.log('Created organization:', organization?.name);
    if (!organization) {
      throw new Error('Failed to create organization');
    }

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
      ITEMS_DATA.map(async (itemData: ItemData) => {
        const [item] = await db
          .insert(items)
          .values({ ...itemData, organizationId: organization.id })
          .returning();
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
