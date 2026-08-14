import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const root = process.cwd();

const files = [
  "src/app/[locale]/dashboard/customers/[id]/_communication-log.tsx",
  "src/app/[locale]/dashboard/customers/[id]/_customer-notes.tsx",
  "src/app/[locale]/dashboard/customers/[id]/_customer-work-order-history.tsx",
  "src/app/[locale]/dashboard/customers/import/page.tsx",
  "src/app/[locale]/dashboard/customers/page.tsx",
  "src/app/[locale]/dashboard/expenses/[id]/page.tsx",
  "src/app/[locale]/dashboard/expenses/categories/page.tsx",
  "src/app/[locale]/dashboard/expenses/page.tsx",
  "src/app/[locale]/dashboard/finance/_revenue-split-bar.tsx",
  "src/app/[locale]/dashboard/finance/page.tsx",
  "src/app/[locale]/dashboard/reports/page.tsx",
  "src/app/[locale]/dashboard/service-reminders/page.tsx",
  "src/app/[locale]/dashboard/services/page.tsx",
  "src/app/[locale]/dashboard/settings/_business-defaults-form.tsx",
  "src/app/[locale]/dashboard/settings/_commission-rules-section.tsx",
  "src/app/[locale]/dashboard/settings/_diagnosis-labels-section.tsx",
  "src/app/[locale]/dashboard/settings/_organization-card.tsx",
  "src/app/[locale]/dashboard/settings/_appearance-customization.tsx",
  "src/app/[locale]/dashboard/settings/page.tsx",
  "src/app/[locale]/dashboard/vehicle-models/page.tsx",
  "src/app/[locale]/dashboard/vehicles/[id]/page.tsx",
  "src/app/[locale]/dashboard/vehicles/page.tsx",
  "src/app/[locale]/dashboard/work-orders/[id]/page.tsx",
  "src/app/[locale]/dashboard/work-orders/page.tsx",
  "src/app/[locale]/dashboard/_daily-timeline.tsx",
  "src/app/[locale]/dashboard/_recent-work-orders.tsx",
  "src/app/[locale]/dashboard/admin/page.tsx",
  "src/app/[locale]/dashboard/mechanic/page.tsx",
  "src/app/[locale]/dashboard/organization/members/_invite-form.tsx",
  "src/app/[locale]/dashboard/organization/members/_member-list.tsx",
  "src/app/[locale]/dashboard/organization/members/_pending-invites.tsx",
  "src/app/[locale]/dashboard/organization/page.tsx",
  "src/app/[locale]/dashboard/customers/loading.tsx",
];

let totalChanges = 0;

for (const file of files) {
  const filePath = join(root, file);
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    console.log(`✗ Not found: ${file}`);
    continue;
  }

  const original = content;

  content = content.replace(/className="([^"]*)"/g, (match, classValue) => {
    if (!classValue.includes("space-y-")) return match;

    // Standalone flex (not flex-1, flex-col, flex-wrap etc.)
    const hasFlex = /\bflex\b(?![\w-])/.test(classValue);
    const hasFlexCol = /\bflex-col\b/.test(classValue);

    // If already has flex-col, just replace space-y-X with gap-X
    if (hasFlexCol) {
      const newClassValue = classValue.replace(
        /\bspace-y-(\d+(?:\.\d+)?)\b/g,
        (_m, gap) => `gap-${gap}`,
      );
      return `className="${newClassValue}"`;
    }

    // No flex-col — replace space-y-X with flex-col gap-X
    const newClassValue = classValue.replace(
      /\bspace-y-(\d+(?:\.\d+)?)\b/g,
      (_m, gap) => `flex-col gap-${gap}`,
    );

    if (!hasFlex) {
      return `className="flex ${newClassValue}"`;
    }

    return `className="${newClassValue}"`;
  });

  if (content !== original) {
    writeFileSync(filePath, content, "utf8");
    totalChanges++;
    console.log(`✓ ${file}`);
  } else {
    console.log(`- ${file} (no changes)`);
  }
}

console.log(`\nDone. ${totalChanges} files modified.`);
