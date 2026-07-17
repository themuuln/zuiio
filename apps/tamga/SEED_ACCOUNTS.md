# Tamga Test Accounts

## Primary Test Account (Батбаяр)

**Phone:** `+97699112233`
**Name:** Батбаяр
**Role:** breeder
**Subscription:** pro

### Horses
1. **Цоохор Ихэр** — Stallion, Roan, 2021
   - Notes: Бие бялдар сайтай
   - Awards: 2, Offspring: 1
2. **Гүнхэр Нарс** — Mare, Bay, 2023
   - Notes: Залуу эх морь
   - Awards: 0, Offspring: 0

---

## Other Test Accounts

|Phone|Name|Horses|
|---|---|---|
|+97699445566|Сайнцэцэг|1|
|+97699778899|Нармандах|0|

---

## Supabase Project

**URL:** `https://dgoqhlcqhpabbthamtrj.supabase.co`
**Env vars:** See `.env` in project root

---

## Maestro Test Notes

- App uses mock data (MOCK_HORSES) when no Supabase session exists
- Tab bar uses `accessibilityText` (format: `"Морь, tab, 1 of 5"`)
- Tab bar may be hidden by React Native yellow box warnings
- Use `extendedWaitUntil` for slow-loading screens
