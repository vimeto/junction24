// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTableCreator,
  timestamp,
  varchar,
  boolean,
  serial,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";


export const createTable = pgTableCreator((name) => `junction_${name}`);

export const images = createTable(
  "images",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    url: varchar("url", { length: 1024 }).notNull(),

    userId: varchar("user_id", { length: 256 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  },
  (example) => ({
    nameIndex: index("name_idx").on(example.name),
  })
);

export const roleEnum = pgEnum('role', ['member', 'admin']);
export const itemTypeEnum = pgEnum('item_type', ['item', 'collection']);
export const identifierTypeEnum = pgEnum('identifier_type', ['serial', 'part_no']);

export const items = createTable(
  "items",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    requireImage: boolean("require_image").default(false),
    requireImageConfirmation: boolean("require_image_confirmation").default(false),
    identifier: varchar("identifier", { length: 255 }),
    identifierType: identifierTypeEnum("identifier_type"),
    itemType: itemTypeEnum("item_type"),
    collectionAmount: integer("collection_amount").default(1),
    organizationId: integer("organization_id").references(() => organizations.id),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const auditers = createTable(
  "auditers",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 256 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const itemAuditStateEnum = pgEnum('item_audit_state', ['requires_validation', 'validated', 'rejected']);

export const itemAudits = createTable(
  "item_audits",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    itemId: integer("item_id").references(() => items.id),
    locationId: integer("location_id").references(() => locations.id),
    auditerId: integer("auditer_id").references(() => auditers.id),
    auditId: integer("audit_id").references(() => audits.id),
    state: itemAuditStateEnum("state").default('requires_validation').notNull(),
    imageUrl: varchar("image_url", { length: 255 }),
    imageConfirmed: boolean("image_confirmed").default(false),
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),
    metadata: text("metadata"),
    comments: text("comments"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const audits = createTable(
  "audits",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    uuid: varchar("uuid", { length: 36 }).notNull().unique(),
    organizationId: integer("organization_id").references(() => organizations.id),
    auditerId: integer("auditer_id").references(() => auditers.id),
    locationId: integer("location_id").references(() => locations.id).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const chats = createTable(
  "chats",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    auditId: integer("audit_id").references(() => audits.id),
    sender: varchar("sender", { length: 256 }),
    hidden: boolean("hidden").default(false),
    chatText: text("chat_text"),
    imageUrl: varchar("image_url", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }
);

export const locations = createTable(
  "locations",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    organizationId: integer("organization_id").references(() => organizations.id),
    name: varchar("name", { length: 255 }),
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const organizationRoles = createTable(
  "organization_roles",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    userId: varchar("user_id", { length: 256 }).notNull(),
    organizationId: integer("organization_id").references(() => organizations.id),
    role: roleEnum("role").default('member'),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const organizations = createTable(
  "organizations",
  {
    id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
    name: varchar("name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date()
    ),
  }
);

export const itemsRelations = relations(items, ({ many, one }) => ({
  itemAudits: many(itemAudits),
  organization: one(organizations, {
    fields: [items.organizationId],
    references: [organizations.id],
  }),
}));

export const itemAuditsRelations = relations(itemAudits, ({ one }) => ({
  item: one(items, {
    fields: [itemAudits.itemId],
    references: [items.id],
  }),
  location: one(locations, {
    fields: [itemAudits.locationId],
    references: [locations.id],
  }),
  audit: one(audits, {
    fields: [itemAudits.auditId],
    references: [audits.id],
  }),
  auditer: one(auditers, {
    fields: [itemAudits.auditerId],
    references: [auditers.id],
  }),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [audits.organizationId],
    references: [organizations.id],
  }),
  auditer: one(auditers, {
    fields: [audits.auditerId],
    references: [auditers.id],
  }),
  location: one(locations, {
    fields: [audits.locationId],
    references: [locations.id],
  }),
  itemAudits: many(itemAudits),
  chats: many(chats),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [locations.organizationId],
    references: [organizations.id],
  }),
  itemAudits: many(itemAudits),
  audits: many(audits),
}));

export const organizationRolesRelations = relations(organizationRoles, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationRoles.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  locations: many(locations),
  organizationRoles: many(organizationRoles),
  items: many(items),
}));

export const auditersRelations = relations(auditers, ({ many }) => ({
  itemAudits: many(itemAudits),
  audits: many(audits),
}));

export const chatsRelations = relations(chats, ({ one }) => ({
  audit: one(audits, {
    fields: [chats.auditId],
    references: [audits.id],
  }),
}));
