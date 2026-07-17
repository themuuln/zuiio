# CSV Horse Import Screen

## Context
Bulk horse import from CSV files. Users need to upload a CSV, map columns to horse fields, preview data, and batch-insert into Supabase.

## Files to Change
| File | Action | What changes |
|------|--------|--------------|
| src/app/horse/csv-import.tsx | Create | New screen: file picker → column mapping → preview → import |

## Implementation Order
1. Create csv-import.tsx with all logic inline (no new abstractions)

## Data Flow
1. User picks CSV via expo-document-picker
2. Parse with papaparse (already installed)
3. Auto-map headers to horse fields by name similarity
4. User adjusts mapping via chip selector
5. Preview first 10 rows in scrollable table
6. Batch insert via supabase.from('horses').insert(row)
7. Show progress and result summary

## Horse Fields
- name (required), breed, gender, coat, birth_year
- Gender/coat values normalized from Mongolian to English enum values

## Edge Cases
- Empty CSV → alert
- Missing required field (name) → disable import button
- Insert error per row → count as error, continue with next
- No auto-match on headers → user manually selects
- Very long CSV → progress indicator shows percentage

## Verification
1. TypeScript compiles with zero errors in the file
2. File picker opens on tap
3. Preview shows first 10 rows
4. Import creates records in Supabase
