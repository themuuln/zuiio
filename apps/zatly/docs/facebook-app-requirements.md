# Facebook Messenger Bot Platform — Requirements Guide
# Facebook Messenger Bot Платформ — Шаардлагын Гарын Авлага

> **Project:** Zatly (ManyChat clone for Messenger automation)
> **Last Updated:** 2026-06-15

---

## 1. Facebook Developer Account / Хөгжүүлэгчийн Бүртгэл

- **EN:** Register with your personal Facebook account at [developers.facebook.com](https://developers.facebook.com). No documents required, completely free.
- **MN:** Хувийн Facebook бүртгэлээрээ [developers.facebook.com](https://developers.facebook.com) хаяг дээр бүртгүүлнэ. Ямар нэгэн бичиг баримт шаардлагагүй, үнэгүй.

**Links / Холбоосууд:**
- https://developers.facebook.com/docs/development/register
- https://developers.facebook.com/docs/messenger-platform/

---

## 2. Facebook App (Business Type) / Facebook Апп (Бизнес Төрөл)

- **EN:** You must create a **Business** type app (not Consumer). Business apps use "access levels" instead of dev/live modes. This is required because you are building a platform that lets other businesses manage their own Facebook Pages.
- **MN:** Та **Business** төрлийн апп үүсгэх ёстой (Consumer биш). Business апп нь dev/live горимын оронд "access level" ашигладаг. Энэ нь бусад бизнесүүдэд өөрсдийн Facebook Pages-ээ удирдах боломж олгодог платформ учраас шаардлагатай.

**Links / Холбоосууд:**
- https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types
- https://developers.facebook.com/docs/development/create-an-app

---

## 3. Facebook Business Manager (Business Portfolio) / Facebook Бизнес Менежер

- **EN:** Create a Business Portfolio at [business.facebook.com](https://business.facebook.com). This is where you connect your app, manage permissions, and initiate Business Verification. Free to create.
- **MN:** [business.facebook.com](https://business.facebook.com) хаяг дээр Business Portfolio үүсгэнэ. Энд аппаа холбож, зөвшөөрлүүдийг удирдаж, Business Verification-ийг эхлүүлнэ. Үнэгүй.

**Links / Холбоосууд:**
- https://www.facebook.com/business/help/1710077379203657
- https://www.facebook.com/business/help/486932075688253

---

## 4. Business Verification / Бизнес Баталгаажуулалт

### 4.1 What is it? / Энэ юу вэ?

- **EN:** Meta requires your business to be verified before your app can get Advanced Access to permissions. This is mandatory for Messenger Platform apps that will serve multiple businesses.
- **MN:** Meta нь таны апп Advanced Access авахын тулд бизнесээ баталгаажуулах шаардлагатай. Олон бизнест үйлчилдэг Messenger Platform аппуудад заавал хэрэгтэй.

### 4.2 Accepted Documents / Хүлээн авах Баримт Бичиг

**EN:**

| Document Type | Description |
|---|---|
| Certificate / Articles of Incorporation | Company registration certificate |
| Business Registration or License | Official business operating license |
| Government Tax Document | Tax certificate (NOT self-filed tax returns) |
| Business Bank Statement | Under the legal business name |
| Utility Bill | For address/phone only (not accepted for legal name) |

**MN:**

| Баримт Бичгийн Төрөл | Тайлбар |
|---|---|
| Компанийн бүртгэлийн гэрчилгээ | Компанийн албан ёсны бүртгэлийн баримт |
| Бизнесийн бүртгэлийн зөвшөөрөл | Бизнес эрхлэх албан ёсны зөвшөөрөл |
| Татварын баримт бичиг | Засгийн газраас олгосон татварын гэрчилгээ (өөрөө бөглөсөн татварын мэдүүлэг биш) |
| Бизнесийн банкны хуулга | Компанийн нэр дээрх банкны дансны хуулга |
| Нийтийн үйлчилгээний төлбөрийн баримт | Хаяг/утсаа баталгаажуулахад л хэрэглэнэ (нэрийг баталгаажуулахад хүлээн авахгүй) |

### 4.3 Important Notes / Чухал Тэмдэглэл

- **EN:** Documents must be in one of 21 supported languages (English, Mongolian is NOT supported — you would need an English translation with official stamp).
- **MN:** Баримт бичиг нь 21 дэмжигдсэн хэлний нэг дээр байх ёстой. **Монгол хэл ДЭМЖИГДЭХГҮЙ** — албан ёсны орчуулга хийлгэх шаардлагатай.
- **EN:** Review takes up to 14 business days.
- **MN:** Шалгалт 14 ажлын өдөр хүртэл үргэлжилнэ.
- **EN:** Without a registered company, you can still register as a sole proprietor / freelancer in your country.
- **MN:** Компанигүй ч гэсэн хувиараа бизнес эрхлэгчээр бүртгүүлж болно.
- **EN:** Domain verification (proving you own your website) is another verification method but does NOT replace business document verification for Advanced Access.
- **MN:** Домэйн баталгаажуулалт (вебсайтаа эзэмшдэгээ нотлох) нь Advanced Access-д зориулсан бизнес баримт бичгийн баталгаажуулалтыг орлохгүй.

**Links / Холбоосууд:**
- https://developers.facebook.com/docs/development/release/business-verification
- https://www.facebook.com/business/help/2058515294227817
- https://www.facebook.com/business/help/159334372093366
- https://www.facebook.com/business/help/1095661473946872

---

## 5. Required Permissions / Шаардлагатай Зөвшөөрлүүд

### 5.1 Permissions List / Зөвшөөрлүүдийн Жагсаалт

**EN:**

| Permission | Purpose | Advanced Access Required? |
|---|---|---|
| `pages_messaging` | Read and send messages via Messenger | Yes |
| `pages_manage_metadata` | Subscribe to webhooks for incoming messages | Yes |
| `pages_show_list` | List Pages the user manages | Yes |
| `pages_read_engagement` | Read conversations and insights | Yes |
| `business_management` | Access user's Business Manager assets | Yes |
| `pages_manage_engagement` | Manage comments and messages | Yes |
| `pages_manage_posts` | Create/manage Page posts | Yes |
| `instagram_basic` | (Optional) Basic Instagram access | Yes |
| `instagram_manage_messages` | (Optional) Instagram DM support | Yes |
| `instagram_manage_comments` | (Optional) Instagram comment management | Yes |

**MN:**

| Зөвшөөрөл | Зорилго | Advanced Access Шаардлагатай юу? |
|---|---|---|
| `pages_messaging` | Messenger-ээр мессеж унших, илгээх | Тийм |
| `pages_manage_metadata` | Webhook бүртгүүлэх, тохиргоо удирдах | Тийм |
| `pages_show_list` | Хэрэглэгчийн Pages жагсаалт харах | Тийм |
| `pages_read_engagement` | Яриа, аналитик унших | Тийм |
| `business_management` | Хэрэглэгчийн Business Manager-т хандах | Тийм |
| `pages_manage_engagement` | Сэтгэгдэл, мессеж удирдах | Тийм |
| `pages_manage_posts` | Пост үүсгэх/удирдах | Тийм |
| `instagram_basic` | (Нэмэлт) Instagram үндсэн хандалт | Тийм |
| `instagram_manage_messages` | (Нэмэлт) Instagram DM дэмжлэг | Тийм |
| `instagram_manage_comments` | (Нэмэлт) Instagram сэтгэгдэл удирдах | Тийм |

### 5.2 App Review Process / Апп Шалгалтын Процесс

- **EN:** Each permission requiring Advanced Access must pass App Review. You must submit a screencast video showing your app using that permission end-to-end.
- **MN:** Advanced Access шаарддаг зөвшөөрөл бүр App Review-ээр дамжих ёстой. Та аппаа тухайн зөвшөөрлийг хэрхэн ашиглаж байгааг харуулсан бичлэг оруулах шаардлагатай.
- **EN:** Common rejection reasons: asking for too many permissions, vague use case descriptions, poor video quality.
- **MN:** Татгалзах шалтгаанууд: хэт олон зөвшөөрөл асуух, тодорхойгүй ашиглалтын тайлбар, чанаргүй бичлэг.

**Links / Холбоосууд:**
- https://developers.facebook.com/docs/permissions/
- https://developers.facebook.com/docs/graph-api/overview/access-levels/
- https://developers.facebook.com/docs/app-review/

---

## 6. Messenger Platform Policies / Messenger Платформын Бодлогууд

**EN:**

| Policy | Detail |
|---|---|
| 24-hour response window | Business can reply freely within 24h of user's last message |
| 30-second bot response | Automated bots must respond to ALL input within 30 seconds |
| Bot disclosure | Must disclose it's a bot where required (California, Germany) |
| Message Tags | Allow sending outside 24h window for specific use cases |
| Sponsored Messages | Paid promotional messages outside 24h window |
| No spam | Promotional content only within 24h or via Sponsored Messages |
| Annual Data Use Checkup | Must re-certify compliance every year |

**MN:**

| Бодлого | Дэлгэрэнгүй |
|---|---|
| 24 цагийн хариу цонх | Бизнес сүүлийн мессежнөөс хойш 24 цагийн дотор чөлөөтэй хариулж болно |
| 30 секундын бот хариу | Автомат бот БҮХ оролтод 30 секундын дотор хариулах ёстой |
| Ботын мэдэгдэл | Шаардлагатай газар (Калифорни, Герман) бот гэдгээ мэдэгдэх ёстой |
| Мессеж Таг | 24 цагаас гадуур тодорхой тохиолдолд илгээх боломж |
| Спонсор Мессеж | 24 цагаас гадуур сурталчилгааны мессеж |
| Спам биш | Сурталчилгааны агуулга зөвхөн 24 цагийн дотор эсвэл Спонсор Мессежээр |
| Жилийн Мэдээллийн Шалгалт | Жил бүр дахин баталгаажуулах |

**Links / Холбоосууд:**
- https://developers.facebook.com/docs/messenger-platform/policy/policy-overview
- https://developers.facebook.com/devpolicy
- https://developers.facebook.com/terms

---

## 7. ManyChat Features Map / ManyChat Онцлогуудын Зураглал

**EN:**

| ManyChat Feature | Zatly Equivalent | Facebook Requirements |
|---|---|---|
| Auto Reply / Sequences | Flow Builder + Triggers | `pages_messaging`, `pages_manage_metadata` |
| Keywords | Keyword Triggers | `pages_messaging` (webhook events) |
| Growth Tools | Growth Widgets | `pages_manage_metadata`, `pages_manage_posts` |
| Subscriber Management | Contact Management | `pages_messaging`, `pages_read_engagement` |
| Broadcasts | Bulk Send | `pages_messaging` (with Message Tags) |
| Analytics | Dashboard | `pages_read_engagement`, `read_insights` |
| Flow Builder | Visual Flow Editor | `pages_messaging` (Send API) |
| Integrations (Zapier etc.) | API + Webhooks | Varies by integration |
| Instagram DM | Instagram Inbox | `instagram_basic`, `instagram_manage_messages` |

**MN:**

| ManyChat Онцлог | Zatly Хувилбар | Facebook Шаардлагууд |
|---|---|---|
| Авто Хариу / Дараалал | Flow Builder + Триггерүүд | `pages_messaging`, `pages_manage_metadata` |
| Түлхүүр үгс | Түлхүүр үг Триггерүүд | `pages_messaging` (webhook) |
| Growth Tools | Growth Widgets | `pages_manage_metadata`, `pages_manage_posts` |
| Захиалагчийн Удирдлага | Холбоо Барих Удирдлага | `pages_messaging`, `pages_read_engagement` |
| Нэвтрүүлэг | Бөөн Илгээлт | `pages_messaging` (Message Tags) |
| Аналитик | Хяналтын Самбар | `pages_read_engagement`, `read_insights` |
| Flow Builder | Харааны Flow Засварлагч | `pages_messaging` (Send API) |
| Интеграци (Zapier г.м) | API + Webhooks | Интеграциас хамаарна |
| Instagram DM | Instagram Имэйл | `instagram_basic`, `instagram_manage_messages` |

---

## 8. Cost Summary / Зардлын Хураангуй

**EN:**

| Item | Cost | Notes |
|---|---|---|
| Facebook Developer Account | Free | Just a Facebook account |
| Facebook App Creation | Free | Business type |
| Facebook Business Manager | Free | |
| Business Verification | Free | But requires legal business docs |
| Sole Proprietor Registration | $0–200 | Varies by country |
| App Review | Free | Manual review, may take multiple attempts |
| Messenger API Usage | Free | No per-message fees |
| SSL Certificate | $0–100 | Required for your webhook URL |
| Server Hosting | Varies | Your own infrastructure cost |

**MN:**

| Зүйл | Зардал | Тэмдэглэл |
|---|---|---|
| Facebook Хөгжүүлэгчийн Бүртгэл | Үнэгүй | Зүгээр л Facebook бүртгэл |
| Facebook Апп Үүсгэх | Үнэгүй | Business төрөл |
| Facebook Business Manager | Үнэгүй | |
| Бизнес Баталгаажуулалт | Үнэгүй | Гэхдээ албан ёсны баримт бичиг шаардлагатай |
| Хувиараа бизнес эрхлэгч бүртгүүлэх | $0–200 | Улс орноос хамаарна |
| Апп Шалгалт | Үнэгүй | Гараар шалгана, олон удаа оруулах шаардлагатай |
| Messenger API Ашиглалт | Үнэгүй | Нэг мессежд төлбөргүй |
| SSL Гэрчилгээ | $0–100 | Таны webhook URL-д шаардлагатай |
| Сервер Хостинг | Хамааралтай | Таны өөрийн дэд бүтцийн зардал |

---

## 9. Quick Start Checklist / Эхлэх Жагсаалт

**EN:**

1. [ ] Create a personal Facebook account
2. [ ] Register at developers.facebook.com
3. [ ] Create a Business-type app
4. [ ] Create a Facebook Business Manager portfolio
5. [ ] **Register as a sole proprietor / freelancer** (get tax document or business license)
6. [ ] Submit Business Verification documents (English or translated)
7. [ ] Build your app using Standard Access (works with tester roles)
8. [ ] Add Messenger product to your app
9. [ ] Set up webhook endpoint on your server
10. [ ] Generate Page Access Token
11. [ ] Test messaging with users who have app roles
12. [ ] Submit App Review for each required permission with screencast
13. [ ] Once approved, switch to Live / Advanced Access
14. [ ] Complete annual Data Use Checkup
15. [ ] Launch!

**MN:**

1. [ ] Хувийн Facebook бүртгэл үүсгэх
2. [ ] developers.facebook.com дээр бүртгүүлэх
3. [ ] Business төрлийн апп үүсгэх
4. [ ] Facebook Business Manager portfolio үүсгэх
5. [ ] **Хувиараа бизнес эрхлэгчээр бүртгүүлэх** (татварын баримт эсвэл бизнесийн зөвшөөрөл авах)
6. [ ] Business Verification баримт бичгүүдийг оруулах (Англи эсвэл орчуулгатай)
7. [ ] Standard Access ашиглан аппаа хөгжүүлэх (тестэр үүрэгтэй ажиллана)
8. [ ] Messenger бүтээгдэхүүнээ аппдаа нэмэх
9. [ ] Сервер дээрээ webhook тохируулах
10. [ ] Page Access Token үүсгэх
11. [ ] Апп үүрэгтэй хэрэглэгчидтэй мессежийг турших
12. [ ] Шаардлагатай зөвшөөрөл бүрт App Review оруулах (бичлэгтэй)
13. [ ] Зөвшөөрөгдсөний дараа Live / Advanced Access руу шилжих
14. [ ] Жилийн Data Use Checkup-ийг бөглөх
15. [ ] Гаргах!

---

## 10. Key Links Summary / Гол Холбоосуудын Хураангуй

**EN:**
- Messenger Platform Docs: https://developers.facebook.com/docs/messenger-platform/
- Quick Start Guide: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
- App Types: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types
- Permissions Reference: https://developers.facebook.com/docs/permissions/
- Access Levels: https://developers.facebook.com/docs/graph-api/overview/access-levels/
- Business Verification (Dev): https://developers.facebook.com/docs/development/release/business-verification
- Business Verification (Help): https://www.facebook.com/business/help/2058515294227817
- Required Documents: https://www.facebook.com/business/help/159334372093366
- Messenger Policy: https://developers.facebook.com/docs/messenger-platform/policy/policy-overview
- App Review: https://developers.facebook.com/docs/app-review/
- ManyChat Help: https://help.manychat.com/
- ManyChat Business Manager Guide: https://manychat.com/blog/facebook-business-manager/

**MN:**
- Messenger Платформын Баримт: https://developers.facebook.com/docs/messenger-platform/
- Эхлэх Гарын Авлага: https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start
- Апп Төрлүүд: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types
- Зөвшөөрлийн Лавлах: https://developers.facebook.com/docs/permissions/
- Хандалтын Түвшин: https://developers.facebook.com/docs/graph-api/overview/access-levels/
- Бизнес Баталгаажуулалт (Хөгж.): https://developers.facebook.com/docs/development/release/business-verification
- Бизнес Баталгаажуулалт (Тусламж): https://www.facebook.com/business/help/2058515294227817
- Шаардлагатай Баримт Бичиг: https://www.facebook.com/business/help/159334372093366
- Messenger Бодлого: https://developers.facebook.com/docs/messenger-platform/policy/policy-overview
- Апп Шалгалт: https://developers.facebook.com/docs/app-review/
- ManyChat Тусламж: https://help.manychat.com/
- ManyChat Business Manager Заавар: https://manychat.com/blog/facebook-business-manager/
