# Алсын синхрончлол (Remote Sync)

TOLOM нь **remote direct** ажлын урсгалыг дагадаг — бүх migration болон edge function өөрчлөлтүүд шууд linked Supabase проект руу ордог. Локал Supabase шаардлагагүй.

## Урьдчилсан нөөцлөлт

Sync хийхээс **өмнө** одоогийн мэдээллийн санг нөөцлөх нь зүйтэй. Ялангуяа migration-ууд undo хийхэд хэцүү өөрчлөлтүүд (DROP COLUMN, DELETE) агуулж байвал:

```bash
# Бүрэн нөөцлөлт (локал)
./scripts/backup.sh

# Эсвэл remote-ийн бүрэн нөөцлөлт
./scripts/backup.sh --remote
```

Нөөцлөлт, сэргээлтийн дэлгэрэнгүй заавар — [Нөөц, экспорт](/backup) хуудаснаас үзнэ үү.

## Синхрончлолын урсгал

### 1. Migration статус шалгах

Эхлээд локал migration-уудын статусыг шалгаж, ямар өөрчлөлтүүд хүлээгдэж байгааг харна:

```bash
supabase migration list
```

Энэ нь аль migration-ууд аль хэдийн хэрэглэгдсэн, аль нь хэрэглэгдээгүй байгааг харуулна.

### 2. Өөрчлөлтүүдийг урьдчилан харах

Push хийхээс өмнө яг ямар SQL өөрчлөлтүүд гарахыг шалгах нь schema drift-ээс сэргийлнэ:

```bash
supabase db diff --linked
```

Хэрэв гэнэтийн өөрчлөлтүүд харагдвал (жишээ нь, remission хийгдсэн column-ууд), дараагийн алхмууд руу яарахгүйгээр эхлээд шалгана уу.

### 3. Migration-уудыг түлхэх

Хүлээгдэж буй бүх migration-уудыг remote Supabase проект руу түлхэх:

```bash
supabase db push --linked
```

### 4. Edge Function-уудыг deploy хийх

Төсөлд дараах edge function-ууд ашиглагдаж байна:

| Функц | Тайлбар | Төрөл |
|-------|---------|-------|
| `expire-subscriptions` | Захиалгын хугацаа дууссаныг шалгаж, автоматаар expire хийх | Cron |
| `check-service-reminders` | Үйлчилгээний сануулгуудыг шалгаж, мэдэгдэл илгээх | Cron |

Edge function-ууд нь **Deno** runtime дээр ажилладаг бөгөөд `jsr:@supabase/supabase-js@2` санг ашиглан Supabase-тай холбогддог.

Function-уудыг deploy хийх:

```bash
supabase functions deploy expire-subscriptions
supabase functions deploy check-service-reminders
```

Шинэ function нэмсэн бол:
1. `supabase/config.toml`-д тохиргоог бүртгэх (verify_jwt, import_map, entrypoint)
2. `supabase/functions/<name>/` директорид `index.ts` болон `deno.json` үүсгэх
3. Edge function нь cron scheduler-ээр ажилладаг бол `supabase/functions/<name>/` дотор schedule тохиргоог нэмэх

### 5. TypeScript төрлүүдийг шинэчлэх

Migration болон function-ууд sync хийгдсэний дараа TypeScript төрлүүдийг шинэчлэх:

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

**Чухал**: Migration хийх бүрт TypeScript төрлүүдийг шинэчлэх ёстой. Үгүй бол frontend-д байхгүй column-ууд руу хандахад build эвдрэх болно.

### 6. Build-оор баталгаажуулах

Бүх зүйл зөв sync хийгдсэнийг баталгаажуулах:

```bash
npm run build
```

Хэрэв build алдаа гарвал TypeScript төрлүүдэд тохирохгүй column эсвэл функц байж болзошгүй.

## Бүрэн sync команд

Дээрх алхмуудыг нэг дор гүйцэтгэх:

```bash
# 0. Нөөцлөх (өөрчлөлтөөс өмнө)
./scripts/backup.sh --remote

# 1. Статус шалгах
supabase migration list

# 2. Өөрчлөлтүүдийг харах
supabase db diff --linked

# 3. Migration түлхэх
supabase db push --linked

# 4. Edge function deploy
supabase functions deploy expire-subscriptions
supabase functions deploy check-service-reminders

# 5. TypeScript төрлүүд шинэчлэх
supabase gen types typescript --linked > src/lib/database.types.ts

# 6. Build баталгаажуулах
npm run build
```

## Алдаа, асуудлууд

### Schema drift

Schema drift гэдэг нь remote Supabase проект дээрх schema локал migration-уудтай тохирохгүй байх төлөв юм. Энэ нь дараах тохиолдолд үүснэ:

- Migration-уудыг алгасах (зарим migration-ууд sync хийгдээгүй)
- Remote дээр шууд SQL execute хийх (Supabase Dashboard-ээр)
- Branch хооронд шилжих үед migration-ууд зөрөх

**Шинж тэмдэг**: `supabase db push --linked` алдаа гаргах, эсвэл `supabase db diff --linked` дээр гэнэтийн өөрчлөлтүүд харагдах.

**Шийдэл**: Schema drift хийгдсэн бол `supabase db push --linked` нь ихэвчлэн алдааны мэдээлэл харуулдаг. Алдааг шийдэхийн тулд remote-тай тохируулах migration бичих шаардлагатай (жишээ нь, `ALTER TABLE IF NOT EXISTS`, `ALTER COLUMN` гэх мэт).

### Migration push алдаа

`supabase db push --linked` амжилтгүй болвол:

1. Migration файлуудын дугаарлалт зөрчилдөөгүй эсэхийг шалгах — нэг дугаартай хоёр migration байж болохгүй
2. `supabase migration list`-ээр аль migration-ууд аль хэдийн хэрэглэгдсэнийг харах
3. Schema drift байгаа эсэхийг `supabase db diff --linked`-ээр шалгах
4. Хэрэв remote дээр өөрчлөлтүүд аль хэдийн хэрэгжиж, localization-той зөрчилдөж байвал — migration файлыг засах

### Буцаалт (Rollback)

Supabase migration-уудыг буцаах (rollback) албан ёсны дэмжлэг байхгүй. Учир нь migration-ууд дээрээ доош чиглэсэн (`down`) SQL-г заадаггүй.

Буцаах шаардлагатай бол:

1. **Шинэ migration бичих**: Хуучин migration-ийн өөрчлөлтийг буцаах SQL (`ALTER TABLE ... DROP COLUMN`, `DROP TABLE`, гэх мэт) бүхий шинэ migration файл үүсгэх
2. **Нөөц хуулбараас сэргээх**: Хэрэв нөөц хуулбар байгаа бол `./scripts/restore.sh`-ээр сэргээх

### TypeScript төрлийн алдаа

Build хийх үед TypeScript алдаа гарвал:

1. `src/lib/database.types.ts` шинэчлэгдсэн эсэхийг шалгах
2. Шинэ migration дээр нэмэгдсэн column-ууд, хүснэгтүүд зөв эсэхийг шалгах
3. Хэрэв функцийн өөрчлөлт орсон бол түүний return type зөв эсэхийг шалгах

### Edge function алдаа

Edge function deploy хийхэд алдаа гарвал:

1. `supabase/config.toml`-д функцийн тохиргоо зөв эсэхийг шалгах
2. Import map болон entrypoint зам зөв эсэхийг шалгах
3. Функц доторх JWT/хэрэглэгчийн баталгаажуулалтыг шалгах (`verify_jwt`)
