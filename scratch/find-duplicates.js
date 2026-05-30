const fs = require("fs");
const path = require("path");

const filePath = path.resolve(
  __dirname,
  "../supabase/migrations/20260530105134_expanded_global_catalogs.sql",
);
const content = fs.readFileSync(filePath, "utf8");

// Match lines like: ('Name', 'MN Name', NULL or 'Part#', 'Category', 'Description', 'Unit')
// e.g.,   ('Battery 100Ah', 'Аккумулятор 100Ah', NULL, 'Electrical', '12V 100Ah heavy duty battery', 'piece'),
const regex =
  /\(\s*'([^']+)'\s*,\s*(?:'([^']+)'|NULL)\s*,\s*(?:'([^']+)'|NULL)\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g;

const seen = new Map();
let match;
let count = 0;
let duplicates = 0;

while ((match = regex.exec(content)) !== null) {
  count++;
  const name = match[1];
  const partNumber = match[3] || "";
  const category = match[4];

  const key = `${name.toLowerCase()}||${category.toLowerCase()}||${partNumber.toLowerCase()}`;
  if (seen.has(key)) {
    duplicates++;
    console.log(
      `Duplicate found: Name="${name}", Category="${category}", PartNumber="${partNumber}"`,
    );
    console.log(`  First seen: ${JSON.stringify(seen.get(key))}`);
    console.log(
      `  Current match: ${JSON.stringify({ name, category, partNumber })}`,
    );
  } else {
    seen.set(key, { name, category, partNumber });
  }
}

console.log(`Total items parsed: ${count}`);
console.log(`Total duplicates found: ${duplicates}`);
