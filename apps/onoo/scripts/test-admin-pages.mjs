import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const SUPABASE_URL = 'http://127.0.0.1:54325';
const SUPABASE_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const BASE = 'http://localhost:3000';

const pages = [
  // Үндсэн (Main)
  { group: 'Үндсэн', path: '/admin', label: 'Хянах самбар' },
  { group: 'Үндсэн', path: '/admin/org', label: 'Байгууллага' },
  { group: 'Үндсэн', path: '/admin/org/members', label: 'Гишүүд' },
  { group: 'Үндсэн', path: '/admin/org/storage', label: 'Хадгалах сан' },
  { group: 'Үндсэн', path: '/admin/org/consent', label: 'Зөвшөөрөл' },
  { group: 'Үндсэн', path: '/admin/org/break-glass', label: 'Яаралтай хандалт' },
  { group: 'Үндсэн', path: '/admin/org/transfers', label: 'Шилжүүлэг' },
  { group: 'Үндсэн', path: '/admin/org/identity-disputes', label: 'Маргаан' },
  // Тэмцээн (Competitions)
  { group: 'Тэмцээн', path: '/admin/leagues', label: 'Лиг' },
  { group: 'Тэмцээн', path: '/admin/competitions', label: 'Тэмцээн' },
  { group: 'Тэмцээн', path: '/admin/awards', label: 'Шагнал' },
  // Баг, тоглогч (Teams & Players)
  { group: 'Баг, тоглогч', path: '/admin/teams', label: 'Баг' },
  { group: 'Баг, тоглогч', path: '/admin/players', label: 'Тоглогч' },
  { group: 'Баг, тоглогч', path: '/admin/teams/roster', label: 'Бүртгэл' },
  // Тоглолт (Games)
  { group: 'Тоглолт', path: '/admin/games', label: 'Тоглолт' },
  { group: 'Тоглолт', path: '/admin/venues', label: 'Талбай' },
  // Хяналт (Control)
  { group: 'Хяналт', path: '/admin/ops', label: 'Үйлдлүүд' },
  // Худалдаа (Commerce)
  { group: 'Худалдаа', path: '/admin/products', label: 'Бүтээгдэхүүн' },
  { group: 'Худалдаа', path: '/admin/orders', label: 'Захиалга' },
  // Академи (Academy)
  { group: 'Академи', path: '/admin/academy', label: 'Профайл' },
  { group: 'Академи', path: '/admin/academy/programs', label: 'Хөтөлбөр' },
  { group: 'Академи', path: '/admin/academy/trainers', label: 'Дасгалжуулагч' },
  { group: 'Академи', path: '/admin/academy/locations', label: 'Байршил' },
  { group: 'Академи', path: '/admin/academy/payments', label: 'Төлбөр' },
];

async function main() {
  // Login
  console.log('Logging in...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@onoo.mn',
    password: 'onoo2026',
  });
  if (error) { console.error('Login failed:', error.message); process.exit(1); }

  const { access_token, refresh_token } = data.session;
  
  // Create auth cookie value as @supabase/ssr expects
  // The cookie format is: sb-<project-ref>-auth-token
  // For local dev this might use a different format
  const authCookie = JSON.stringify({
    access_token,
    refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
  });

  // Use fetch with cookie header  
  const cookie = `sb-localhost-auth-token=${encodeURIComponent(authCookie)}`;

  let passed = 0;
  let failed = 0;
  let failures = [];

  for (const page of pages) {
    const url = `${BASE}${page.path}`;
    try {
      const resp = await fetch(url, {
        headers: { Cookie: cookie },
        redirect: 'manual',
      });
      const status = resp.status;
      const location = resp.headers.get('location') || '';
      
      // 200 = success, 303/302 = redirect (probably auth issue, or redirect to login)
      if (status === 200) {
        console.log(`✅ ${page.group} > ${page.label} (${page.path}) — ${status}`);
        passed++;
      } else if (status === 303 || status === 302) {
        console.log(`❌ ${page.group} > ${page.label} (${page.path}) — ${status} → ${location}`);
        failed++;
        failures.push({ ...page, status, location });
      } else if (status === 500) {
        const text = await resp.text().catch(() => '');
        const snippet = text.substring(0, 200).replace(/\n/g, ' ');
        console.log(`❌ ${page.group} > ${page.label} (${page.path}) — ${status} ${snippet}`);
        failed++;
        failures.push({ ...page, status, snippet });
      } else {
        console.log(`⚠️  ${page.group} > ${page.label} (${page.path}) — ${status}`);
        // Other status might still be ok
        passed++;
      }
    } catch (err) {
      console.log(`❌ ${page.group} > ${page.label} (${page.path}) — ERROR: ${err.message}`);
      failed++;
      failures.push({ ...page, status: 0, error: err.message });
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  ${f.group} > ${f.label} (${f.path}): ${f.status} ${f.location || f.snippet || f.error || ''}`);
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
