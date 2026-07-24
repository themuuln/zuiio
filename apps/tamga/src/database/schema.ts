import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const tamgaSchema = appSchema({
  version: 1,
  tables: [
    // Horses
    tableSchema({
      name: "horses",
      columns: [
        { name: "name", type: "string" },
        { name: "breed", type: "string" },
        { name: "color", type: "string", isOptional: true },
        { name: "gender", type: "string" },
        { name: "birth_date", type: "string", isOptional: true },
        { name: "registry_number", type: "string", isOptional: true },
        { name: "sire_id", type: "string", isOptional: true, isIndexed: true },
        { name: "dam_id", type: "string", isOptional: true, isIndexed: true },
        { name: "owner_id", type: "string", isIndexed: true },
        { name: "status", type: "string" },
        { name: "created_at", type: "string" },
        { name: "updated_at", type: "string" },
        { name: "is_deleted", type: "boolean" },
        { name: "sync_status", type: "string" },
      ],
    }),

    // Health Logs
    tableSchema({
      name: "health_logs",
      columns: [
        { name: "horse_id", type: "string", isIndexed: true },
        { name: "type", type: "string" },
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "date", type: "string" },
        { name: "veterinarian", type: "string", isOptional: true },
        { name: "cost", type: "number", isOptional: true },
        { name: "next_reminder", type: "string", isOptional: true },
        { name: "created_at", type: "string" },
        { name: "sync_status", type: "string" },
      ],
    }),

    // Breeding Records
    tableSchema({
      name: "breeding_records",
      columns: [
        { name: "mare_id", type: "string", isIndexed: true },
        { name: "stallion_id", type: "string", isIndexed: true },
        { name: "breeding_date", type: "string" },
        { name: "expected_due_date", type: "string", isOptional: true },
        { name: "actual_birth_date", type: "string", isOptional: true },
        { name: "foal_id", type: "string", isOptional: true },
        { name: "status", type: "string" },
        { name: "notes", type: "string", isOptional: true },
        { name: "created_at", type: "string" },
        { name: "sync_status", type: "string" },
      ],
    }),

    // Marketplace Listings
    tableSchema({
      name: "listings",
      columns: [
        { name: "horse_id", type: "string", isIndexed: true },
        { name: "seller_id", type: "string", isIndexed: true },
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "price", type: "number" },
        { name: "currency", type: "string" },
        { name: "status", type: "string" },
        { name: "category", type: "string" },
        { name: "images", type: "string", isOptional: true },
        { name: "location", type: "string", isOptional: true },
        { name: "latitude", type: "number", isOptional: true },
        { name: "longitude", type: "number", isOptional: true },
        { name: "created_at", type: "string" },
        { name: "updated_at", type: "string" },
        { name: "sync_status", type: "string" },
      ],
    }),

    // Events
    tableSchema({
      name: "events",
      columns: [
        { name: "title", type: "string" },
        { name: "description", type: "string", isOptional: true },
        { name: "type", type: "string" },
        { name: "date", type: "string" },
        { name: "end_date", type: "string", isOptional: true },
        { name: "location", type: "string", isOptional: true },
        { name: "latitude", type: "number", isOptional: true },
        { name: "longitude", type: "number", isOptional: true },
        { name: "organizer_id", type: "string", isIndexed: true },
        { name: "max_participants", type: "number", isOptional: true },
        { name: "created_at", type: "string" },
        { name: "sync_status", type: "string" },
      ],
    }),

    // Sync Queue
    tableSchema({
      name: "sync_queue",
      columns: [
        { name: "table_name", type: "string" },
        { name: "record_id", type: "string" },
        { name: "action", type: "string" },
        { name: "data", type: "string" },
        { name: "created_at", type: "string" },
        { name: "attempts", type: "number" },
        { name: "last_error", type: "string", isOptional: true },
      ],
    }),

    // Feature Flags
    tableSchema({
      name: "feature_flags",
      columns: [
        { name: "key", type: "string", isIndexed: true },
        { name: "value", type: "string" },
        { name: "updated_at", type: "string" },
      ],
    }),
  ],
});
