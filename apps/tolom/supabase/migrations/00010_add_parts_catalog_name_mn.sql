-- Add Mongolian language name column to parts_catalog
-- Allows storing part names in Mongolian Cyrillic script
-- The UI conditionally displays name_mn when the user's language is set to Mongolian

alter table parts_catalog
  add column name_mn text;

comment on column parts_catalog.name_mn is 'Part name in Mongolian Cyrillic (shown when locale=mn)';
