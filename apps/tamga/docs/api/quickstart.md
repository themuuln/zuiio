# Tamga Organizer API — Хурдан эхлэх

Тамга-ийн Organizer API нь гадаад нэгтгэлүүдэд зориулагдсан REST API юм.
API түлхүүрийн тусламжтайгаар арга хэмжээ, бүртгэл, үр дүнг
программаар удирдах боломжтой.

## 1. API түлхүүр авах

1. Тамга апп нээх → Түншийн самбар → API Тохиргоо
2. **Шинэ түлхүүр** дээр дарна
3. Түлхүүрийн нэр оруулна (жишээ: "CI/CD пайплайн")
4. Эрхийн түвшин сонгоно:
   - **Үржүүлэгч (Breeder)** — зөвхөн унших, 30 хүсэлт/мин
   - **Хүлээнүүд (Stable)** — бүрэн эрх, 60 хүсэлт/мин
5. **Хуулах** товч дээр дарж түлхүүрийг хадгална

> ⚠️ **Анхааруулга:** Түлхүүрийг зөвхөн энэ удаа харж болно.
> Нөөцөлж авахаа мартуузай!

## 2. Нэвтрэх

Бүх хүсэлтүүдэд `X-API-Key` header шаардлагатай:

```
X-API-Key: tg_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 3. Арга хэмжээнүүдийг жагсаах

```bash
curl -H "X-API-Key: tg_your_key_here" \
  https://your-project.supabase.co/functions/v1/organizer-api/v1/events
```

Хариу:
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Улсын аварга уралдаан",
      "event_type": "race",
      "location": "Улаанбаатар",
      "status": "registration_open",
      "start_date": "2025-08-15T09:00:00Z"
    }
  ]
}
```

## 4. Арга хэмжээ үүсгэх

```bash
curl -X POST \
  -H "X-API-Key: tg_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Хаврын уралдаан",
    "event_type": "race",
    "location": "Чингэлтэй дүүрэг",
    "start_date": "2025-09-01T10:00:00Z",
    "entry_fee_mnt": 50000,
    "prize_pool_mnt": 1000000,
    "is_public": true
  }' \
  https://your-project.supabase.co/functions/v1/organizer-api/v1/events
```

## 5. Морийг бүртгүүлэх

```bash
curl -X POST \
  -H "X-API-Key: tg_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "horse_id": "horse-uuid-here",
    "owner_user_id": "owner-uuid-here",
    "horse_name": "Алтан Зүрх",
    "owner_name": "Батбаяр"
  }' \
  https://your-project.supabase.co/functions/v1/organizer-api/v1/events/EVENT_ID/registrations
```

## 6. Үр дүнг илгээх

```bash
curl -X POST \
  -H "X-API-Key: tg_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {
        "registration_id": "reg-uuid-1",
        "horse_id": "horse-uuid-1",
        "placement": 1,
        "time_seconds": 125.3,
        "prize_mnt": 500000
      },
      {
        "registration_id": "reg-uuid-2",
        "horse_id": "horse-uuid-2",
        "placement": 2,
        "time_seconds": 126.1,
        "prize_mnt": 300000
      }
    ]
  }' \
  https://your-project.supabase.co/functions/v1/organizer-api/v1/events/EVENT_ID/results
```

## 7. Морины профайл харах

Энэ эндрпоинт нь нэвтрэх шаардлагагүй:

```bash
curl https://your-project.supabase.co/functions/v1/organizer-api/v1/horses/HORSE_ID
```

## Алдаанууд

| Статус код | Утга | Тайлбар |
|---|---|---|
| `401` | Unauthorized | API түлхүүр байхгүй эсвэл буруу |
| `403` | Forbidden | Хандах эрх хүрэлцэхгүй (жнь: унших эрхтэйгээ бичих гэсэн) |
| `404` | Not found | Олдсонгүй |
| `409` | Conflict | Морь аль хэдийн бүртгүүлсэн |
| `429` | Rate limited | Хязгаарт хүрлээ — хүлээнэ үү |

## Хязгаарлалт

| Түвшин | Хүсэлт/минут | Эрхүүд |
|---|---|---|
| Үржүүлэгч (Breeder) | 30 | Унших арга хэмжээ, унших бүртгэл |
| Хүлээнүүд (Stable) | 60 | Бүх эрх — үүсгэх, засах, устгах |

## API баримт

- OpenAPI 3.1 баримт: [`docs/api/openapi.yaml`](./openapi.yaml)
- Swagger UI эсвэл Postman-д импортлох боломжтой
