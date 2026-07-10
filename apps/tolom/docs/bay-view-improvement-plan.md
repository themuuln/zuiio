# Бэй Вьюг Шинэчлэх Төлөв

> Огноо: 2026-06-05 · Төлөв: Эхний загвар

---

## Дүгнэлт

Bay View нь TOLOM-ийн хамгийн чухал дүр төрх — механик ажлын байр, ажлын захиалга, ээлжийн жагсаалтыг нэг дэлгэц дээр удирддаг **real-time dashboard**. Гэхдээ одоогоор **үйлдвэрлэлд хүргэхэд бэлэн биш** — алдаа эрсдэл ихтэй, жигд бус, offline дэмжлэггүй.

**Нийт 59 файл, ~6000 мөр код. Хамгийн том асуудлууд:**

| # | Асуудал | Хүнд хэмжээ | Байршил |
|---|---------|-------------|---------|
| 1 | **1141 мөртэй монолит компонент** — 26 useState, 5 useRef, 9 useCallback нэг файлд | 🔴 Дээд | `bay-view-v2-client.tsx` |
| 2 | **Оффлайн дэмжлэггүй** — retry, connectivity check, offline queue байхгүй | 🔴 Дээд | Бүх модуль |
| 3 | **Polling нь drag мутацийг дарж болзошгүй** — 30сек тутамд fetch хийхэд optimistic update алдагдана | 🔴 Дээд | `bay-view-v2-client.tsx:229` |
| 4 | **Error boundary дутуу** — зөвхөн drawer дээр байна, гол grid/.drag дээр байхгүй | 🔴 Дээд | Бүх модуль |
| 5 | **20 `as any` + `as unknown as`** хэлбэрүүд — төрөл зөрсөн | 🟡 Дунд | `_use-drawer-mutations.ts` |
| 6 | **53 useState хүсэлт** — drawer flow дээр нийлбэр | 🟡 Дунд | `_use-drawer-mutations.ts` |
| 7 | **Inline async callback** — 6 удаа ижил `onRemoveHelper` код бичсэн | 🟡 Дунд | `bay-view-v2-client.tsx:803-928` |
| 8 | **Prop drilling хэт их** — Toolbar-д 23 пропс, RefObject хүртэл дамжуулж байна | 🟡 Дунд | `_toolbar.tsx` |
| 9 | **Код давхардсан** — `KanbanDropColumn` 2 удаа, helper функцууд 2 удаа | 🟢 Бага | `_types.tsx`, `_helpers.ts` |
| 10 | **Төрлийн зөрүү** — `helpers` нэгж WorkOrder төрөлд байхгүй, runtime-д нэмсэн | 🟡 Дунд | Бүх модуль |

---

## Нэгдүгаар үе шат: Алдаа эрсдэл бууруулах (Эрэмбэ 1)

### 1.1 Error Boundary нэмэх

**Яагаад:** Одоогоор зөвхөн WorkOrderDetailDrawer-д error boundary байна. Аль нэг BayCard-д render алдаа гарвал бүх хуудас унана.

**Юу хийх:**
- `bay-view-v2-client.tsx` дээр **3 бүсэд** error boundary нэмэх:
  - `<KpiCards />` — KPI картуудад
  - `<GridView />` / `<KanbanView />` / `<ListView />` — гол ажлын бүсэд
  - `<QueuePanel />` — ээлжийн жагсаалтад
- Бүрт error гарахад тухайн бүсийг "Алдаа гарлаа, дахин оролдох" гэж үзүүлэх

### 1.2 Polling-ийн mutex нэмэх

**Яагаад:** 30сек тутамд `fetchData(false)` дуудагдаж байхдаа drag мутацийг (乐观 update + server call) дарж болно. Энэ бол **race condition**.

**Юу хийх:**
- `bayCountMutationInFlightRef` шиг **drag mutation in-flight** байхад polling-ийг зогсоох
- `_bay-action-handlers.ts` болон `_bay-drag-handlers.ts`-ийн эхэнд `setIsPollingPaused(true)` дуудах
- Drag дуусмагц `false` болгох

### 1.3 Inline callback-ийг `useCallback`-д оруулах

**Яагаад:** `handleStatusClick`, `handleStatusModalConfirm`, `handlePostServiceConfirm`, `handlePickupCompleteConfirm`, `handleOpenDetail` бүгд **useCallback-гүй** — тэдгээрийг пропсаар дамжуулахад бүрэн re-render болно.

**Юу хийх:**
- Бүх handler-ийг `useCallback`-д оруулах
- `onRemoveHelper` inline callback-ийг **гол компонентад нэг удаа** тодорхойлж,.GridView/KanbanView-руу пропсаар өгөх

---

## Хоёрдугаар үе шат: Төрлийн зөрүү арилгах (Эрэмбэ 2)

### 2.1 WorkOrder төрөлд `helpers` нэмэх

**Яагаад:** `_use-drawer-mutations.ts`, `bay-view-v2-client.tsx`, `_list-view.tsx`, `_bay-drag-handlers.ts` дээр `as unknown as Record<string, unknown>` гэж cast хийж байна. Энэ бол **runtime дээр алдаа гаргаж болзошүй**.

**Юу хийх:**
- `src/lib/types` дээр `WorkOrder` төрөлд `helpers` нэмэх:
  ```ts
  helpers?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
  ```
- `WorkOrderService`, `WorkOrderPart` төрөлд `service_catalog_id`, `quantity`, `final_price` нэмэх
- Бүх `as any`, `as unknown as` хэлбэрийг арилгах

### 2.2 Код давхардлыг арилгах

- `KanbanDropColumn` — `_types.tsx` ээс нэгийг нь устгах
- `computeNextDueDate`, `computeNextDueKm`, `formatDate`, `formatKm` — `_helpers.ts`-ийг нэгэн жигд болгох

---

## Гуравдугаар үе шат: Компонент хуваах (Эрэмбэ 3)

### 3.1 `bay-view-v2-client.tsx`-ийг хуваах

Одоо: **1141 мөр, 26 useState, 23 пропс** нэг файлд. Энэ бол **модуль биш, аймшиг**.

**Хуваах төлөв:**

```
bay-view-v2-client.tsx (1141мөр)
    │
    ├── BayViewProvider.tsx        ← State management (26 useState → Zustand)
    ├── BayViewDataFetcher.tsx     ← Data fetching + polling logic
    ├── BayViewDialogManager.tsx   ← Бүх dialog/rawer state удирдлага
    └── BayViewLayout.tsx          ← Зөвхөн layout + render tree
```

### 3.2 `_use-drawer-mutations.ts`-ийг хуваах

Одоо: **21 useState, 14 async handler, 40+ return property**.

**Хуваах төлөв:**
```
_use-drawer-mutations.ts (21 useState)
    │
    ├── useDrawerState.ts          ← 21 useState → Zustand store
    ├── useDrawerServiceMutations.ts  ← Service CRUD (add, remove, price)
    ├── useDrawerPartMutations.ts     ← Part CRUD (add, remove, price)
    └── useDrawerStatusMutations.ts   ← Status change, invoice, post-service
```

### 3.3 Zustand руу шилжүүлэх

**Яагаад:** 53 useState хүсэлт → React render бүрт шинээр үүсгэнэ. Zustand store бол **render-гүй, component-с бие даасан**.

**Юу хийх:**
- `useBayViewStore` — main bay data, dialogs, pending states
- `useDrawerStore` — drawer-ийн service/part/status state
- Selector hooks ашиглах → зөвхөн хэрэгтэй component re-render болно

---

## Дөрөвдүгаар үе шат: Offline дэмжлэг (Эрэмбэ 4)

### 4.1 Offline queue нэмэх

**Яагаад:** Одоогоор network тасарвал бүх мутаци алдагдана. Тэр дундаа drag-drop байна.

**Юу хийх:**
- `_bay-action-handlers.ts`-ийн бүх service call-ыг `withOfflineQueue`-аар ороож өгөх
- `_use-drawer-mutations.ts`-ийн `fetch()` call-уудыг мөн ороож өгөх
- Offline үед optimistic update-ийг хадгалах, online болмогц сэргээх

### 4.2 Polling-ийг offline мэдрэмтэй болгох

- `navigator.onLine` шалгаж, offline үед polling-ийг зогсоох
- Online болмогц нэг удаа `fetchData()` дуудах

### 4.3 Retry logic нэмэх

- Бүх API call-д **exponential backoff retry** нэмэх (3 удаа)
- `_notes-section.tsx`, `_quick-actions.tsx`, `assign-dialog.tsx` зэрэг алдаа бүхий газруудад retry toast нэмэх

---

## Тавдугаар үе шат: Гүйцэтгэл сайжруулах (Эрэмбэ 5)

### 5.1 Polling refresh-ийн loading state

- `fetchData(false)` дуудахад **хөнгөн loading indicator** үзүүлэх (bayan бүрэн унтраахгүй)
- Grid дээр **subtle spinner** эсвэл **pulse animation** нэмэх

### 5.2 BayCard render optimization

- `bay-card.tsx`-ийг `React.memo`-аар ороож өгөх
- Inline status stepper IIFE-ийг `useMemo`-д оруулах
- `pendingWoIds` шалгахдаа `Set<string>` ашиглах (`Record<string, boolean>` биш)

### 5.3 Toolbar prop reduction

- `bayCountMutationInFlightRef`, `bayCountDebounceRef` — эдгээр **implementation detail** пропс болох ёсгүй
- `useBayViewStore`-оос шууд уншиж болно

---

## Хэрэгжүүлэх дараалал

| Үе шат | Ажил | Хугацаа | Ач холбогдол |
|--------|------|---------|-------------|
| **1** | Error boundary + polling mutex + useCallback | 2-3 цаг | 🔴 Алдаа эрсдэл шууд бууруулна |
| **2** | Төрлийн зөрүү арилгах + код давхардал | 1-2 цаг | 🟡 TypeScript цэвэр болгоно |
| **3** | Компонент хуваах + Zustand | 4-6 цаг | 🟡 Удирдлагын хүндрэл арилгана |
| **4** | Offline queue + retry | 3-4 цаг | 🟡 Offline ажиллагаатай болгоно |
| **5** | Гүйцэтгэл сайжруулах | 2-3 цаг | 🟢 Жигд ажиллагаа |

**Нийт: 12-18 цаг**

---

## Аюултай газрууд (Pitfalls)

1. **Zustand-руу шилжүүлэх** — `setData()` шууд state өөрчлөх нь Zustand-ийн `setState`-ээс өөр. `immer` middleware ашиглавал syntax-ийн өөрчлөлт их байна.
2. **Polling mutex** — drag mutation-ийг `pendingWoIds`-тэй холбох хэрэгтэй. Mutex-ийг хэт удаан барьвал polling хойшлогдоно.
3. **Error boundary** — `React.ErrorBoundary` нь async error-ийг барихгүй. `componentDidCatch` нь render алдаа л барина.
4. **Offline queue** — drag-drop мутаци нь **байрлал сайтай** (bay number). Offline queue-д энэ мэдээлэл хадгалагдахгүй бол **server дээр буруу байрлалд очно**.
5. **Төрлийн зөрүү** — `helpers` нэгжийг төрөлд нэмэхэд **Supabase query-ийн response shape**-тэй таарч байгаа эсэхийг шалгах хэрэгтэй.

---

## Монгол хэл дэх товч дүгнэлт

Бэй Вью бол **ТОЛОМ-ийн зүрх** — механикууд өдөр бүр ашигладаг хуудас. Гэхдээ одоогоор:
- **Нэг файлд хэт их код** (1141 мөр) → засварлахад хэцүү
- **Offline ажиллахгүй** → интернэт тасарвал бүх зүйл зогсоно
- **Алдаа гарвал бүх хуудас унана** → error boundary байхгүй
- **Drag-drop race condition** → polling optimistic update-ийг дарж болно
- **Төрлийн зөрүү их** → `as any`-ээр дүүүрсэн

Эхний ээлжид **aldaa эрсдэл бууруулах** (error boundary, polling mutex, useCallback) хийвэл **үйлдвэрлэлийн түвшинд хүрэхүйц** болно. Дараа нь компонент хуваах, Zustand, offline queue хийвэл **жигд, найдвартай** болно.
