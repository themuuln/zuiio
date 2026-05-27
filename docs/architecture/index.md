# Архитектур

## Технологийн стэк

TOLOM нь дараах технологиуд дээр суурилсан:

| Түвшин              | Технологи                                                        |
| ------------------- | ---------------------------------------------------------------- |
| **Frontend**        | Next.js (App Router), React, TypeScript                          |
| **Backend**         | Next.js API routes (server-side), Supabase Edge Functions (Deno) |
| **Өгөгдлийн сан**   | PostgreSQL (Supabase)                                            |
| **Баталгаажуулалт** | Supabase Auth (email/password, JWT)                              |
| **UI компонент**    | shadcn/ui (Radix UI дээр суурилсан)                              |
| **Өгөгдлийн төлөв** | React Query (@tanstack/react-query)                              |
| **Олон хэл**        | next-intl (i18n)                                                 |
| **Drag-and-drop**   | @dnd-kit (Bay View v2)                                           |
| **Хүснэгт**         | @tanstack/react-table                                            |

## Multi-tenant архитектур

TOLOM нь multi-tenant SaaS платформ юм. Бүх байгууллага нэг өгөгдлийн санг хуваалцах боловч Row Level Security (RLS)-ээр тусгаарлагдана.

### Түвшний тусгаарлалт

| Түвшин            | Механизм                                                    |
| ----------------- | ----------------------------------------------------------- |
| **Өгөгдлийн сан** | RLS (Row Level Security) — `organization_id` баганаар шүүнэ |
| **API**           | JWT баталгаажуулалт + оролцогчийн шалгалт                   |
| **UI**            | Үүрэг (Role)-д суурилсан хандалт                            |

## Хавтасны бүтэц

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Олон хэлний дэмжлэгтэй хуудаснууд
│   │   ├── auth/          # Нэвтрэх, бүртгүүлэх
│   │   ├── dashboard/     # Хяналтын самбар (нууцлагдсан)
│   │   └── portal/        # Харилцагчийн портал
│   └── api/               # REST API routes
├── components/             # React компонентууд
│   ├── ui/                # shadcn/ui компонентууд
│   ├── auth/              # Нэвтрэхтэй холбоотой компонентууд
│   ├── bay-view/          # Bay View v1
│   ├── bay-view-v2/       # Bay View v2 (drag-and-drop)
│   ├── sidebar-tabs/      # Баруун хажуугийн самбар
│   └── work-orders/       # Ажлын захиалгатай холбоотой
├── hooks/                  # React hooks
├── lib/                    # Үйлчилгээнүүд, туслах функцууд
│   ├── queries/           # React Query hooks
│   ├── services/          # Серверийн логик
│   ├── supabase/          # Supabase клиент, middleware
│   └── types/             # TypeScript төрлүүд
└── messages/               # i18n орчуулга (mn.json, en.json)
```

## Өгөгдлийн урсгал

### Client-side

```
React Query hook → fetch() → API Route → Service → Supabase
```

- UI компонентууд React Query hooks-ыг дуудна
- Hooks API routes-руу HTTP хүсэлт илгээнэ
- API routes Services-ээр дамжуулан Supabase-тай холбогдоно
- Хариуг React Query cache-д хадгална

### Server-side

```
API Route → Service → Supabase
```

- API routes нь `api-handler.ts` wrapper-ийг ашиглана
- Wrapper нь алдааг нэг мөрөнд боловсруулж, `ApiResponse<T>` форматаар хариу илгээнэ
- Services нь `service-role` клиентээр (RLS тойрч) эсвэл `createClient`-ээр (RLS-тэй) Supabase-д хандана

### Нууцлал

- **Supabase Auth** — JWT токен ашиглан хэрэглэгчийг баталгаажуулна
- **Middleware** — `src/lib/supabase/middleware.ts` — бүх хүсэлтийг шалгаж, нэвтрээгүй хэрэглэгчийг `/auth/login` руу чиглүүлнэ
- **service-role** — зөвхөн сервер дотор (API routes, Edge Functions) ашиглагдана, RLS тойрдог
- **portal-auth** — харилцагчийн порталд token эсвэл Supabase session ашиглана
