// @ts-nocheck

// seed.ts

import { drizzle } from 'drizzle-orm/node-postgres';
import {
  images,
  items,
  itemAudits,
  audits,
  chats,
  locations,
  organizationRoles,
  organizations,
  roleEnum,
  itemTypeEnum,
  identifierTypeEnum,
} from './schema'; // Adjust the path to your schema file

import { db } from './index';

async function seed() {
  try {
    // Create two organizations
    const [org1] = await db
      .insert(organizations)
      .values({
        name: 'Organization One',
      })
      .returning();

    const [org2] = await db
      .insert(organizations)
      .values({
        name: 'Organization Two',
      })
      .returning();

    console.log('Organizations created:', org1, org2);

    if (!org1 || !org2) {
      throw new Error('Failed to create organizations');
    }

    // For org1, create 4 locations
    // locations
    // 60.161997, 24.905360
    // 60.162380, 24.904814
    // 60.162082, 24.903487
    // 60.161917, 24.902476
    const locationsOrg1 = [];
    for (let i = 1; i <= 4; i++) {
      const [location] = await db
        .insert(locations)
        .values({
          organizationId: org1.id,
          name: `Org1 Location ${i}`,
          latitude: '37.7749',
          longitude: '-122.4194',
        })
        .returning();
      locationsOrg1.push(location);
    }

    // For org2, create 6 locations
    const locationsOrg2 = [];
    for (let i = 1; i <= 6; i++) {
      const [location] = await db
        .insert(locations)
        .values({
          organizationId: org2.id,
          name: `Org2 Location ${i}`,
          latitude: '34.0522',
          longitude: '-118.2437',
        })
        .returning();
      locationsOrg2.push(location);
    }

    console.log('Locations created.');

    // Create an audit for each organization
    const [audit1] = await db
      .insert(audits)
      .values({
        organizationId: org1.id,
      })
      .returning();

    const [audit2] = await db
      .insert(audits)
      .values({
        organizationId: org2.id,
      })
      .returning();

    console.log('Audits created:', audit1, audit2);

    if (!audit1 || !audit2) {
      throw new Error('Failed to create audits');
    }

    // All locations should have 1-10 items
    const allLocations = [...locationsOrg1, ...locationsOrg2];

    for (const location of allLocations) {
      if (!location) continue;

      const numItems = Math.floor(Math.random() * 10) + 1; // 1 to 10 items
      for (let i = 0; i < numItems; i++) {
        // Create an item
        const [item] = await db
          .insert(items)
          .values({
            requireImage: false,
            identifier: `Item-${location.id}-${i}`,
            itemType: 'item', // 'item' or 'collection' as per enum
            identifierType: 'serial', // 'serial' or 'part_no' as per enum
            // You can add more fields here
          })
          .returning();

        // Determine the auditId based on the location's organization
        let auditId;
        if (location.organizationId === org1.id) {
          auditId = audit1.id;
        } else if (location.organizationId === org2.id) {
          auditId = audit2.id;
        } else {
          auditId = null;
        }

        if (!item || !auditId) continue;

        // Create an itemAudit linking the item to the location and audit
        const [itemAudit] = await db
          .insert(itemAudits)
          .values({
            itemId: item.id,
            locationId: location.id,
            auditId: auditId,
            // You can add more fields here
          })
          .returning();
      }
    }

    console.log('Items and ItemAudits created.');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

seed()
  .then(() => {
    console.log('Seeding completed.');
  })
  .catch((error) => {
    console.error('Error during seeding:', error);
  });
