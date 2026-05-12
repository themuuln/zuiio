"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Info,
  Lightbulb,
  List,
  Search,
  Table2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Content model ────────────────────────────────────────────────

type ContentItem =
  | { type: "p"; text: string }
  | { type: "heading"; text: string; level?: number }
  | { type: "subheading"; text: string }
  | { type: "step"; number: number; text: string }
  | { type: "bullet"; text: string; indent?: number }
  | { type: "tip"; text: string }
  | { type: "warning"; text: string }
  | { type: "danger"; text: string }
  | { type: "info"; text: string }
  | { type: "code"; code: string; language?: string }
  | { type: "spacer" }
  | { type: "separator" }
  | { type: "table"; headers: string[]; rows: string[][] };

interface Section {
  id: string;
  title: string;
  subsections?: { id: string; title: string; content: ContentItem[] }[];
  content: ContentItem[];
}

// ── Content ───────────────────────────────────────────────────────

const sections: Section[] = [
  {
    id: "tolom-taniltsuulga",
    title: "1. TOLOM системтэй танилцах",
    content: [
      {
        type: "p",
        text: "TOLOM — авто засварын газруудад зориулсан бүрэн удирдлагын систем (ERP). Энэ нь захиалга хүлээн авахаас эхлээд санхүүгийн тайлан гаргах хүртэлх бүх үйл ажиллагааг нэг дор зохицуулна.",
      },
      { type: "spacer" },
      { type: "info", text: "TOLOM нь олон байгууллагад зориулсан (multi-tenant) SaaS платформ юм. Та өөрийн байгууллагаа бүртгүүлээд тусгаарлагдсан орчинд ажиллана." },
      { type: "spacer" },
      { type: "heading", text: "Системийн үндсэн модулиуд", level: 2 },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Модуль", "Үүрэг", "Гол боломжууд"],
        rows: [
          ["Хяналтын самбар", "Өдрийн үйл ажиллагааны тойм", "График, сүүлийн үйл ажиллагаа, түргэн товч"],
          ["Засварын булан", "Ажлын байрны харагдац", "Булангийн төлөв, PIN хамгаалалт"],
          ["Ажлын захиалга", "Засвар үйлчилгээний баримт", "6 төлөв, үйлчилгээ + сэлбэг, төлөвийн түүх"],
          ["Харилцагчид", "Үйлчлүүлэгчийн мэдээлэл", "Хувь хүн / байгууллага, дата хайлт"],
          ["Тээврийн хэрэгсэл", "Автомашины бүртгэл", "VIN, дугаар, түүх, эзэмшигчтэй холбох"],
          ["Бараа материал", "Сэлбэгийн нөөцийн бүртгэл", "38+ сэлбэг, дансны дэвтэр, босго хэмжээ"],
          ["Ханган нийлүүлэгчид", "Нийлүүлэгчийн мэдээлэл", "8 нийлүүлэгч, холбоо барих мэдээлэл"],
          ["Худалдан авалт", "Захиалгын удирдлага", "5 төлөв, бараа хүлээн авах, авто нөөц нэмэгдэх"],
          ["Санхүү", "Орлогын тайлан", "Өдөр/7 хоног/сар, 4 валют"],
          ["Тайлан", "Үзүүлэлтүүд", "Техничний гүйцэтгэл, үйлчилгээний ангилал"],
          ["Тохиргоо", "Системийн тохиргоо", "Хэл, валют, PIN"],
        ],
      },
      { type: "spacer" },
      {
        type: "p",
        text: "TOLOM-ийн гол онцлог нь таблет, ухаалаг утас, компьютер гэх мэт бүх төхөөрөмжөөс ажиллах боломжтой, хэрэглэхэд хялбар интерфейс юм.",
      },
    ],
  },
  {
    id: "nevtreh",
    title: "2. Системд нэвтрэх",
    content: [
      { type: "heading", text: "2.1 Шинэ хэрэглэгч бүртгүүлэх", level: 2 },
      { type: "spacer" },
      { type: "step", number: 1, text: "Нэвтрэх хуудас дээр \"Бүртгүүлэх\" товч дарна уу." },
      { type: "step", number: 2, text: "Байгууллагын нэрээ оруулна уу (жишээ нь: \"Хантайшир Моторс\")." },
      { type: "step", number: 3, text: "Өөрийн бүтэн нэрээ оруулна уу." },
      { type: "step", number: 4, text: "Имэйл хаяг болон нууц үгээ оруулна уу." },
      { type: "step", number: 5, text: "\"Бүртгэл үүсгэх\" товч дарна уу." },
      { type: "spacer" },
      { type: "info", text: "Бүртгүүлсний дараа таны байгууллага, үндсэн салбар (Main Branch), Админ болон Механик үүрэг автоматаар үүснэ. Та Админ эрхээр нэвтрэнэ." },
      { type: "spacer" },
      { type: "heading", text: "2.2 Нэвтрэх", level: 2 },
      { type: "spacer" },
      { type: "step", number: 1, text: "Имэйл хаягаа оруулна уу." },
      { type: "step", number: 2, text: "Нууц үгээ оруулна уу." },
      { type: "step", number: 3, text: "\"Нэвтрэх\" товч дарна уу." },
      { type: "spacer" },
      {
        type: "tip",
        text: "Демо хаяг: admin@tolom-test.com / TestPassword123! (Байгууллагын PIN: 1234). Энэ хаягаар системийн бүх боломжийг турших боломжтой.",
      },
      { type: "spacer" },
      { type: "heading", text: "2.3 Байгууллага сонгох", level: 2 },
      { type: "spacer" },
      {
        type: "p",
        text: "Хэрэв та хэд хэдэн байгууллагын гишүүн бол системд нэвтэрсний дараа аль байгууллагаар ажиллахаа сонгох цонх гарч ирнэ. Хүссэн байгууллагаа сонгоод \"Үргэлжлүүлэх\" товч дарна уу.",
      },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Талбар", "Тайлбар", "Заавал?"],
        rows: [
          ["Имэйл", "Бүртгэлтэй имэйл хаяг", "Тийм"],
          ["Нууц үг", "Дор хаяж 8 тэмдэгт", "Тийм"],
          ["Байгууллагын нэр", "Байгууллагын бүтэн нэр", "Зөвхөн бүртгүүлэх үед"],
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "3. Хяналтын самбар",
    content: [
      {
        type: "p",
        text: "Хяналтын самбар (Dashboard) нь таны байгууллагын өдрийн үйл ажиллагааны ерөнхий тоймыг харуулдаг анхны хуудас юм.",
      },
      { type: "spacer" },
      { type: "heading", text: "Үзүүлэлтүүд", level: 2 },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Үзүүлэлт", "Тайлбар", "Хэрэглээ"],
        rows: [
          ["Өнөөдрийн захиалга", "Өнөөдөр шинээр үүсгэгдсэн захиалгын тоо", "Ачаалал үнэлэх"],
          ["Гүйцэтгэж буй", "Одоо хийгдэж байгаа захиалгын тоо", "Ажлын төлөвлөлт"],
          ["Өнөөдрийн орлого", "Өнөөдөр төлбөр төлөгдсөн захиалгын дүн", "Санхүүгийн хяналт"],
          ["Сүүлийн үйл ажиллагаа", "Сүүлийн 10 үйлдэл", "Түүх хянах"],
          ["Орлогын график", "7 хоног / сарын орлогын график", "Тренд шинжилгээ"],
        ],
      },
      { type: "spacer" },
      {
        type: "p",
        text: "Хяналтын самбараас шинэ захиалга үүсгэх, харилцагч хайх, өдрийн эцсийн тайлан гаргах зэрэг үйлдлүүдийг шууд хийх товчлуурууд байрлана.",
      },
      { type: "spacer" },
      { type: "tip", text: "Өдөр бүр ажлын эхэнд хяналтын самбараа шалгаж, өдрийн төлөвлөгөөгөө гаргахыг зөвлөж байна." },
      { type: "spacer" },
      { type: "separator" },
      { type: "spacer" },
      { type: "heading", text: "Орлогын график", level: 2 },
      {
        type: "p",
        text: "Хяналтын самбар дээр 7 хоног, 30 хоногийн орлогын график харагдана. График нь таны бизнесийн орлогын трендийг хянахад тусална. График дээрх цэгүүд дээр дарахад тухайн өдрийн дэлгэрэнгүй мэдээлэл харж болно.",
      },
    ],
  },
  {
    id: "bay-view",
    title: "4. Засварын булан",
    content: [
      {
        type: "p",
        text: "Засварын булан (Bay View) нь таны цехийн булангуудын бодит харагдацыг харуулна. Эндээс аль буланд ямар захиалга хийгдэж байгааг нэг дороос харж болно.",
      },
      { type: "spacer" },
      { type: "heading", text: "Булангийн харагдац", level: 2 },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Төлөв", "Өнгө", "Тайлбар"],
        rows: [
          ["Чөлөөтэй", "Ногоон", "Буланд захиалга байхгүй, шинэ захиалга авахад бэлэн"],
          ["Захиалгатай", "Улаан / Шар", "Буланд гүйцэтгэгдэж буй захиалга байна"],
          ["Хүлээгдэж буй", "Цэнхэр / Саарал", "Дараалалд хүлээгдэж буй захиалгууд"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "PIN хамгаалалт", level: 2 },
      {
        type: "p",
        text: "Засварын буланг PIN кодоор хамгаалах боломжтой. Тохиргоо хэсгээс 4-6 оронтой PIN код тохируулж, булангийн хуудсыг зөвшөөрөлгүй хандалтаас хамгаалана уу.",
      },
      { type: "spacer" },
      {
        type: "step",
        number: 1,
        text: "Тохиргоо хэсэгт очно уу.",
      },
      {
        type: "step",
        number: 2,
        text: "\"Засварын булангийн PIN\" хэсэгт 4-6 оронтой PIN оруулна.",
      },
      {
        type: "step",
        number: 3,
        text: "\"Хадгалах\" товч дарна.",
      },
      {
        type: "step",
        number: 4,
        text: "Дараагийн удаа булангийн хуудсыг нээхэд PIN шаардах болно.",
      },
    ],
  },
  {
    id: "work-orders",
    title: "5. Ажлын захиалга",
    content: [
      {
        type: "p",
        text: "Ажлын захиалга (Work Order) нь үйлчлүүлэгчийн машинд хийх засвар үйлчилгээг бүртгэх үндсэн баримт бичиг юм. Захиалга нь үйлчилгээ, сэлбэг, төлөвийн түүх зэрэг бүх мэдээллийг агуулна.",
      },
      { type: "spacer" },
      { type: "heading", text: "5.1 Шинэ захиалга үүсгэх", level: 2 },
      { type: "spacer" },
      { type: "step", number: 1, text: "\"Ажлын захиалга\" хэсэгт орж, \"Шинэ захиалга\" товч дарна уу." },
      { type: "step", number: 2, text: "Үйлчлүүлэгчийг сонгох эсвэл шинээр бүртгэнэ үү. Утасны дугаараар хурдан хайх боломжтой." },
      { type: "step", number: 3, text: "Машины улсын дугаарыг оруулна уу. Өмнө бүртгэгдсэн машины дугаарыг бичиж эхлэхэд автоматаар санал болгоно." },
      { type: "step", number: 4, text: "\"Үйлчилгээ нэмэх\" товч дарж, хийх үйлчилгээгээ каталогаас сонгох эсвэл шинээр оруулна уу." },
      { type: "step", number: 5, text: "\"Сэлбэг нэмэх\" товч дарж, шаардлагатай сэлбэгүүдийг нэмнэ үү." },
      { type: "step", number: 6, text: "Захиалгыг хадгалах эсвэл шууд хэвлэх боломжтой." },
      { type: "spacer" },
      { type: "tip", text: "Үйлчилгээний үнийн түүх автоматаар хадгалагдана. Дараагийн удаад ижил машинд ижил үйлчилгээ хийхэд өмнөх үнийг санал болгоно." },
      { type: "spacer" },
      { type: "heading", text: "5.2 Захиалгын төлөвүүд", level: 2 },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Төлөв", "Дүрс", "Тайлбар", "Дараагийн төлөв"],
        rows: [
          ["Шинэ", "Цэнхэр", "Захиалга шинээр үүсгэгдсэн, хараахан эхлээгүй", "Оношилгоо / Цуцлагдсан"],
          ["Оношилгоо", "Шар", "Машины гэмтэл оношилж байгаа", "Гүйцэтгэж буй / Цуцлагдсан"],
          ["Гүйцэтгэж буй", "Улбар шар", "Засвар үйлчилгээ хийгдэж байгаа", "Хүлээлгэхэд бэлэн"],
          ["Хүлээлгэхэд бэлэн", "Ногоон", "Засвар дууссан, харилцагчид хүлээлгэхэд бэлэн", "Дууссан"],
          ["Дууссан", "Саарал", "Захиалга бүрэн дууссан, төлбөр төлөгдсөн", "—"],
          ["Цуцлагдсан", "Улаан", "Захиалга цуцлагдсан", "—"],
        ],
      },
      { type: "spacer" },
      {
        type: "warning",
        text: "Төлөв бүрийн өөрчлөлт нь захиалгын түүхэнд бүртгэгддэг бөгөөд буцаан өөрчлөх боломжгүй (immutable ledger). Төлөв өөрчлөхдөө болгоомжтой байна уу.",
      },
      { type: "spacer" },
      { type: "heading", text: "5.3 Захиалгад үйлчилгээ нэмэх", level: 2 },
      {
        type: "p",
        text: "Захиалгад нэг буюу хэд хэдэн үйлчилгээ нэмж болно. Үйлчилгээ бүр дараах мэдээллийг агуулна:",
      },
      {
        type: "bullet",
        text: "Үйлчилгээний нэр — каталогаас сонгосон эсвэл гараар оруулсан",
      },
      {
        type: "bullet",
        text: "Тоо хэмжээ — нэгжээр (жишээ нь: тос солих × 1, лаа солих × 4)",
      },
      {
        type: "bullet",
        text: "Үндсэн үнэ — каталогийн үнэ",
      },
      {
        type: "bullet",
        text: "Хямдрал — мөнгөн дүнгээр эсвэл хувиар",
      },
      {
        type: "bullet",
        text: "Эцсийн үнэ — автоматаар бодогдоно",
      },
      { type: "spacer" },
      { type: "heading", text: "5.4 Захиалгад сэлбэг нэмэх", level: 2 },
      {
        type: "p",
        text: "Захиалгад ашигласан сэлбэгийг гараар оруулна (Phase 1). Сэлбэг бүрийн нэр, код, тоо хэмжээ, нэгж үнэ, эцсийн үнийг бүртгэнэ.",
      },
      { type: "spacer" },
      {
        type: "info",
        text: "Phase 2-д сэлбэгийн нөөц холбогдсон үед захиалгад сэлбэг нэмэхэд агуулахын үлдэгдэл автоматаар хорогдоно.",
      },
      { type: "spacer" },
      { type: "heading", text: "5.5 Захиалгын түүх харах", level: 2 },
      {
        type: "p",
        text: "Захиалга бүрийн дэлгэрэнгүй хуудаснаас дараах мэдээллийг харж болно: үйлчилгээний жагсаалт, сэлбэгийн жагсаалт, төлөвийн өөрчлөлтийн түүх (хэн, хэзээ өөрчилсөн), үнийн дэлгэрэнгүй.",
      },
      { type: "spacer" },
      { type: "heading", text: "5.6 Жишээ захиалгууд", level: 2 },
      {
        type: "table",
        headers: ["№", "Машин", "Үйлчилгээ", "Төлөв", "Дүн"],
        rows: [
          ["WO-001", "Lexus RX 350", "Тос солих + иж бүрэн үзлэг", "Дууссан", "289,000₮"],
          ["WO-002", "Toyota Highlander", "Урд тормосны дэвсгэр солих", "Дууссан", "135,000₮"],
          ["WO-003", "Lexus RX 350", "Тормосны диск + дэвсгэр + оношилгоо", "Дууссан", "500,000₮"],
          ["WO-004", "Toyota Camry", "Тос + агаарын шүүрүүр + салонны шүүрүүр", "Дууссан", "200,500₮"],
          ["WO-005", "Land Cruiser 200", "Амортизатор оношилгоо", "Гүйцэтгэж буй", "35,000₮"],
          ["WO-006", "Honda Civic", "Тос солих 0W-20", "Шинэ", "95,000₮"],
          ["WO-007", "Toyota Highlander", "ATF тос + лаа солих", "Дууссан", "208,000₮"],
          ["WO-008", "Land Cruiser 200", "Аккумулятор солих", "Хүлээлгэхэд бэлэн", "200,000₮"],
          ["WO-009", "Lexus RX 350", "Хөргөлтийн систем — оношилгоо", "Оношилгоо", "35,000₮"],
          ["WO-010", "Honda Civic", "Арчигч + LED гэрэл солих", "Шинэ", "60,000₮"],
        ],
      },
    ],
  },
  {
    id: "customers",
    title: "6. Харилцагчид",
    content: [
      {
        type: "p",
        text: "Харилцагчдын хэсэг нь таны бүх үйлчлүүлэгчдийн мэдээллийн сан юм.",
      },
      { type: "spacer" },
      { type: "heading", text: "6.1 Харилцагчийн төрлүүд", level: 2 },
      {
        type: "table",
        headers: ["Төрөл", "Тайлбар", "Жишээ"],
        rows: [
          ["Хувь хүн", "Бие даасан үйлчлүүлэгч", "Бат Цэнгэл, Сарангэрэл Ганбаатар"],
          ["Байгууллага", "Компани, байгууллагын флот", "Монголын Төмөр Зам, Найрамдал Такси"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "6.2 Харилцагч бүртгэх", level: 2 },
      { type: "step", number: 1, text: "\"Харилцагчид\" хэсэгт орж \"Шинэ харилцагч\" товч дарна." },
      { type: "step", number: 2, text: "Төрөлөө сонгоно: Хувь хүн эсвэл Байгууллага." },
      { type: "step", number: 3, text: "Нэр, утасны дугаар, имэйл хаяг, хаяг зэрэг мэдээллийг бөглөнө." },
      { type: "step", number: 4, text: "\"Хадгалах\" товч дарна." },
      { type: "spacer" },
      {
        type: "tip",
        text: "Утасны дугаараар хайх нь хамгийн хурдан арга. Хайлтын талбарт дугаарын хэдэн орон ч бичихэд тохирох харилцагчид гарч ирнэ.",
      },
      { type: "spacer" },
      { type: "heading", text: "6.3 Харилцагчийн дэлгэрэнгүй", level: 2 },
      {
        type: "p",
        text: "Харилцагчийн картанд дараах мэдээлэл харагдана:",
      },
      {
        type: "bullet",
        text: "Үндсэн мэдээлэл — нэр, утас, имэйл, хаяг",
      },
      {
        type: "bullet",
        text: "Статистик — нийт айлчлалын тоо, нийт зарцуулсан мөнгө",
      },
      {
        type: "bullet",
        text: "Машинууд — харилцагчийн бүртгэлтэй тээврийн хэрэгслүүд",
      },
      {
        type: "bullet",
        text: "Захиалгын түүх — өмнөх захиалгуудын жагсаалт",
      },
    ],
  },
  {
    id: "vehicles",
    title: "7. Тээврийн хэрэгсэл",
    content: [
      {
        type: "p",
        text: "Тээврийн хэрэгслийн бүртгэл нь үйлчлүүлэгчдийн автомашины мэдээллийг хадгална.",
      },
      { type: "spacer" },
      { type: "heading", text: "7.1 Машины мэдээллийн талбарууд", level: 2 },
      {
        type: "table",
        headers: ["Талбар", "Тайлбар", "Жишээ"],
        rows: [
          ["Улсын дугаар", "Машины улсын дугаар", "4747 УБА"],
          ["Марк (Make)", "Үйлдвэрлэгч", "Toyota, Lexus, Honda"],
          ["Загвар (Model)", "Машины загвар", "Harrier, RX 350, Highlander"],
          ["Үйлдвэрлэсэн он", "Он", "2020, 2018"],
          ["VIN код", "17 тэмдэгтийн VIN", "JTDKN3DU5A0123456"],
          ["Өнгө", "Машины өнгө", "White, Black, Silver"],
          ["Хөдөлгүүр", "Хөдөлгүүрийн багтаамж", "2.0L, 3.5L"],
          ["Түлшний төрөл", "Шатахууны төрөл", "Gasoline, Diesel, Hybrid"],
          ["Дамжуулга", "Хурдны хайрцаг", "Automatic, Manual"],
          ["Одометр", "Гүйлт (км)", "45,000 км"],
          ["их биеийн төрөл", "Их бие", "SUV, Sedan, Hatchback"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "7.2 Машин эзэмшигчтэй холбох", level: 2 },
      {
        type: "p",
        text: "Нэг машин хэд хэдэн эзэмшигчтэй холбогдож болно. Жишээ нь: компаний машин (компани) болон жолооч (хувь хүн) хоёулаа холбогдож болно. Эзэмшигчдийн нэг нь \"Үндсэн\" эзэмшигчээр тэмдэглэгдэнэ.",
      },
      { type: "spacer" },
      {
        type: "info",
        text: "Захиалга үүсгэх үед машины улсын дугаарыг бичиж эхлэхэд систем өмнө бүртгэгдсэн машинуудыг автоматаар санал болгоно. Энэ нь давхар бүртгэлээс сэргийлнэ.",
      },
    ],
  },
  {
    id: "inventory",
    title: "8. Бараа материал",
    content: [
      {
        type: "p",
        text: "Бараа материалын хэсэг нь 4 үндсэн дэд хэсгээс бүрдэнэ: Сэлбэг ба нөөц, Хөдөлгөөний түүх, Ханган нийлүүлэгчид, Худалдан авалтын захиалга.",
      },
      { type: "spacer" },
      { type: "heading", text: "8.1 Сэлбэг ба нөөц", level: 2 },
      {
        type: "p",
        text: "Энэ хэсэгт таны бүртгэлтэй сэлбэгүүдийн жагсаалт, агуулахын үлдэгдэл харагдана.",
      },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Сэлбэг", "Код", "Ангилал", "Үлдэгдэл", "Үнэ"],
        rows: [
          ["Тосны шүүрүүр", "FIL-OIL-TOY", "Шүүрүүр", "🔴 8ш (бага)", "12,000₮"],
          ["Тос 5W-30 (4L)", "TOS-5W30-4L", "Тос, шингэн", "🟡 13ш (дундаж)", "45,000₮"],
          ["Harrier агаарын шүүрүүр", "FIL-AIR-HAR60", "Шүүрүүр", "🟢 7ш (хэвийн)", "18,500₮"],
          ["RX урд тормосны дэвсгэр", "BRK-PAD-RX20-F", "Тормос", "🟢 7ш (хэвийн)", "85,000₮"],
          ["Аккумулятор 55Ah", "BATT-55AH", "Аккумулятор", "🟡 4ш (дундаж)", "150,000₮"],
          ["Аккумулятор 75Ah", "BATT-75AH", "Аккумулятор", "🔴 2ш (бага)", "185,000₮"],
          ["Iridium лаа (4ш)", "IGN-PLUG-IRID", "Асаагуур", "🟢 9ш (хэвийн)", "48,000₮"],
        ],
      },
      { type: "spacer" },
      {
        type: "warning",
        text: "Сэлбэгийн үлдэгдэл нь дансны дэвтрээр (ledger) бүртгэгддэг. Үлдэгдлийг шууд засварлах боломжгүй — зөвхөн зөв төрлийн хөдөлгөөн (худалдан авалт, зарлага, тохируулга) нэмэх замаар өөрчлөнө. Ингэснээр бүртгэлийн найдвартай байдал хангагдана.",
      },
      { type: "spacer" },
      { type: "heading", text: "8.2 Сэлбэгийн нөөцийн өнгөт тэмдэглэгээ", level: 2 },
      {
        type: "table",
        headers: ["Өнгө", "Утга", "Тайлбар"],
        rows: [
          ["🟢 Ногоон", "Хангалттай нөөц", "Босго хэмжээнээс дээш үлдэгдэлтэй"],
          ["🟡 Шар", "Дуусч дөхсөн", "Босго хэмжээнд ойртсон, нөөцлөх шаардлагатай"],
          ["🔴 Улаан", "Дууссан / маш бага", "Босго хэмжээнээс доош, яаралтай захиалах шаардлагатай"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "8.3 Хөдөлгөөний түүх", level: 2 },
      {
        type: "p",
        text: "Хөдөлгөөний түүх нь сэлбэгийн орлого, зарлагын бүрэн бүртгэл юм. Энэ нь immutable ledger — өөрчлөх, устгах боломжгүй. Зөвхөн шинэ хөдөлгөөн нэмэх замаар тохируулна.",
      },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Хөдөлгөөний төрөл", "Тайлбар", "Үлдэгдэлд үзүүлэх нөлөө"],
        rows: [
          ["purchase", "Ханган нийлүүлэгчээс худалдан авалт", "+ нэмэгдэнэ"],
          ["sale", "Захиалгаар зарлагадсан", "— хорогдоно"],
          ["adjustment", "Тооллогын дүнгээр тохируулга", "+ эсвэл —"],
          ["transfer_in", "Өөр салбараас шилжүүлэг ирсэн", "+ нэмэгдэнэ"],
          ["transfer_out", "Өөр салбарт шилжүүлсэн", "— хорогдоно"],
          ["return", "Нийлүүлэгчид буцаасан", "— хорогдоно"],
          ["waste", "Гэмтэл / хаягдал", "— хорогдоно"],
        ],
      },
      { type: "spacer" },
      {
        type: "tip",
        text: "Хөдөлгөөний түүхээс төрөл тус бүрээр шүүж харах боломжтой. Тухайлбал, зөвхөн \"Худалдан авалт\" эсвэл \"Зарлага\"-ын түүхийг тусдаа харж болно.",
      },
      { type: "spacer" },
      { type: "heading", text: "8.4 Ханган нийлүүлэгчид", level: 2 },
      {
        type: "p",
        text: "Ханган нийлүүлэгчдийн мэдээллийг бүртгэж, тэднээс хийсэн худалдан авалтыг хянах боломжтой.",
      },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Нийлүүлэгч", "Холбоо барих", "Утас", "Төлбөрийн нөхцөл"],
        rows: [
          ["Тоёта Моторс Монголиа", "Баярсайхан Н", "11-345678", "14 хоног"],
          ["Авто Сэлбэг ХХК", "Ганзориг Т", "99001234", "Урьдчилсан төлбөр"],
          ["Женко Трейд", "Мөнхбат Г", "99112233", "7 хоног"],
          ["Монгол Суул ХХК", "Баттулга N", "99770011", "30 хоног"],
          ["Юнитек Авто Партс", "Сарантуяа D", "99887766", "14 хоног"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "8.5 Худалдан авалтын захиалга", level: 2 },
      {
        type: "p",
        text: "Ханган нийлүүлэгчдэд сэлбэг захиалах, захиалгын төлөвийг хянах боломжтой.",
      },
      { type: "spacer" },
      { type: "heading", text: "Худалдан авалтын төлөвүүд", level: 3 },
      {
        type: "table",
        headers: ["Төлөв", "Тайлбар"],
        rows: [
          ["Төсөл (draft)", "Захиалга үүсгэгдсэн, хараахан илгээгээгүй"],
          ["Захиалсан (ordered)", "Нийлүүлэгчид илгээгдсэн, хүлээгдэж буй"],
          ["Хэсэгчилсэн (partial)", "Захиалгын зарим хэсэг ирсэн"],
          ["Хүлээн авсан (received)", "Бүх бараа ирж, хүлээн авсан"],
          ["Цуцлагдсан (cancelled)", "Захиалга цуцлагдсан"],
        ],
      },
      { type: "spacer" },
      {
        type: "info",
        text: "Бараа хүлээн авах (receive) үед систем автоматаар агуулахын үлдэгдэлд \"purchase\" төрлийн хөдөлгөөн нэмж, сэлбэгийн тоо хэмжээг нэмэгдүүлнэ.",
      },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Захиалга", "Нийлүүлэгч", "Төлөв", "Дүн"],
        rows: [
          ["PO-2026-001", "Монгол Суул ХХК", "Хүлээн авсан", "585,000₮"],
          ["PO-2026-002", "Юнитек Авто Партс", "Хүлээн авсан", "1,715,000₮"],
          ["PO-2026-003", "Авто Сэлбэг ХХК", "Хүлээн авсан", "2,140,000₮"],
          ["PO-2026-004", "Женко Трейд", "Захиалсан", "524,000₮"],
          ["PO-2026-005", "Монгол Суул ХХК", "Төсөл", "0₮"],
        ],
      },
    ],
  },
  {
    id: "finance",
    title: "9. Санхүү",
    content: [
      { type: "p", text: "Санхүүгийн хэсэг нь таны бизнесийн орлогын тайлан, төлбөрийн бүртгэлийг харуулна." },
      { type: "spacer" },
      { type: "heading", text: "9.1 Тайлангийн төрлүүд", level: 2 },
      {
        type: "table",
        headers: ["Тайлан", "Хугацаа", "Хэрэглээ"],
        rows: [
          ["Өдрийн тайлан", "Өнөөдөр", "Өдрийн орлого, зарлага, дууссан захиалгыг шалгах"],
          ["7 хоногийн тайлан", "Сүүлийн 7 хоног", "Долоо хоногийн үзүүлэлт, тренд"],
          ["Сарын тайлан", "Тухайн сар", "Сарын хураангуй тайлан"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "9.2 Валют", level: 2 },
      {
        type: "p",
        text: "Системд дараах 4 валютыг дэмждэг. Валютыг Тохиргоо хэсгээс сольж болно.",
      },
      {
        type: "table",
        headers: ["Валют", "Товчлол", "Тэмдэгт"],
        rows: [
          ["Монгол төгрөг", "MNT", "₮"],
          ["Ам. доллар", "USD", "$"],
          ["Евро", "EUR", "€"],
          ["Хятад юань", "CNY", "¥"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "9.3 Өдрийн эцсийн тайлан", level: 2 },
      {
        type: "step",
        number: 1,
        text: "Санхүү хэсэгт ороод \"Өдрийн тайлан\" табыг сонгоно.",
      },
      {
        type: "step",
        number: 2,
        text: "Төлбөрийн төрлөөр шүүх (бэлэн мөнгө, карт, шилжүүлэг) боломжтой.",
      },
      {
        type: "step",
        number: 3,
        text: "\"Өдрийн эцсийн тайлан\" гаргахад PDF хэлбэрээр хадгалах боломжтой.",
      },
    ],
  },
  {
    id: "reports",
    title: "10. Тайлан",
    content: [
      { type: "p", text: "Тайлангийн хэсэг нь таны бизнесийн гүнзгий дүн шинжилгээг харуулна." },
      { type: "spacer" },
      { type: "heading", text: "10.1 Тайлангийн төрлүүд", level: 2 },
      {
        type: "table",
        headers: ["Тайлан", "Агуулга", "Хэрхэн тусалдаг"],
        rows: [
          ["Өдрийн тайлан", "Өдөр тутмын орлого, зарлага, захиалга", "Өдрийн үр дүнг үнэлэх"],
          ["Долоо хоногийн тайлан", "7 хоногийн хураангуй, тренд", "Долоо хоногийн гүйцэтгэл харах"],
          ["Сарын тайлан", "Сарын бүх үзүүлэлт", "Сарын дүгнэлт гаргах"],
          ["Үйлчилгээний ангилал", "Үйлчилгээ тус бүрийн орлого", "Аль үйлчилгээ хамгийн ашигтайг тодорхойлох"],
          ["Техничийн гүйцэтгэл", "Механикчдын ажлын үзүүлэлт", "Ажилтны гүйцэтгэлийн үнэлгээ"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "10.2 Үйлчилгээний ангилалын дэлгэрэнгүй", level: 2 },
      {
        type: "p",
        text: "Энэ тайлан нь аль төрлийн үйлчилгээ (тос солих, тормос, оношилгоо гэх мэт) хамгийн их орлого авчирдагийг харуулна. Энэ нь бизнесийн стратеги төлөвлөхөд тусална.",
      },
      { type: "spacer" },
      {
        type: "tip",
        text: "Тайлангуудыг тогтмол шалгаж байх нь бизнесийн чиг хандлагыг ойлгож, цаг хугацаанд нь шийдвэр гаргахад тусална.",
      },
    ],
  },
  {
    id: "settings",
    title: "11. Тохиргоо",
    content: [
      {
        type: "p",
        text: "Тохиргоо хэсгээс системийн үндсэн тохиргоонуудыг өөрчилж болно.",
      },
      { type: "spacer" },
      {
        type: "table",
        headers: ["Тохиргоо", "Тайлбар", "Сонголтууд"],
        rows: [
          ["Хэл", "Интерфейсийн хэлийг солих", "Монгол (MN), English (EN)"],
          ["Валют", "Мөнгөн тэмдэгтийг солих", "MNT, USD, EUR, CNY"],
          ["Байгууллагын тохиргоо", "Байгууллагын нэр, PIN код", "Засах холбоос"],
          ["Засварын булангийн PIN", "Булангийн хамгаалалт", "4-6 оронтой PIN"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "11.1 Хэл солих", level: 2 },
      { type: "step", number: 1, text: "Тохиргоо хэсэгт очно уу." },
      { type: "step", number: 2, text: "\"Хэл\" хэсэгт хүссэн хэлээ сонгоно уу." },
      { type: "step", number: 3, text: "Хуудас автоматаар шинэчлэгдэж, сонгосон хэлээр харуулна." },
      { type: "spacer" },
      { type: "info", text: "Хэлний тохиргоо нь cookie-д хадгалагдах бөгөөд дараагийн нэвтрэхэд автоматаар хэрэгжинэ. URL-д /en/ эсвэл /mn/ гэх prefix хэрэглэхгүй." },
      { type: "spacer" },
      { type: "heading", text: "11.2 Валют солих", level: 2 },
      {
        type: "p",
        text: "Системийн бүх үнийг сонгосон валютаар харуулна. Валют солиход тохиргоо хэсгээс хүссэн валютаа сонгоход хангалттай. Өмнөх захиалгуудын үнэ өөрчлөгдөхгүй, зөвхөн дэлгэц дээр харуулах валют өөрчлөгдөнө.",
      },
      { type: "spacer" },
      { type: "heading", text: "11.3 Байгууллагын тохиргоо", level: 2 },
      {
        type: "p",
        text: "\"Байгууллага\" хэсэгт байгууллагын нэр, салбарууд, хэрэглэгчид, үүргийн тохиргоог өөрчлөх боломжтой. Зөвхөн Админ эрхтэй хэрэглэгч энэ хэсгийг ашиглах боломжтой.",
      },
    ],
  },
  {
    id: "organization",
    title: "12. Байгууллагын удирдлага",
    content: [
      {
        type: "p",
        text: "Байгууллагын удирдлагын хэсэгт байгууллагын бүтэц, хэрэглэгчид, тэдгээрийн эрхийг тохируулна.",
      },
      { type: "spacer" },
      { type: "heading", text: "12.1 Үүрэг (Roles)", level: 2 },
      {
        type: "table",
        headers: ["Үүрэг", "Эрх", "Тайлбар"],
        rows: [
          ["Админ (Admin)", "Бүх эрх", "Байгууллагын бүх тохиргоо, захиалга, санхүү, хэрэглэгч удирдах"],
          ["Механик (Mechanic)", "Хязгаарлагдсан", "Захиалга үүсгэх, шинэчлэх, булангийн харагдац"],
        ],
      },
      { type: "spacer" },
      { type: "heading", text: "12.2 Хэрэглэгч урих", level: 2 },
      {
        type: "p",
        text: "Байгууллагад шинэ хэрэглэгч нэмэхийн тулд түүний имэйл хаяг руу урилга илгээнэ. Хэрэглэгч урилгыг хүлээн авсны дараа системд нэвтрэх эрхтэй болно.",
      },
      {
        type: "step",
        number: 1,
        text: "\"Байгууллага\" хэсэгт орж \"Хэрэглэгч урих\" товч дарна.",
      },
      {
        type: "step",
        number: 2,
        text: "Хэрэглэгчийн имэйл хаяг, үүрэг, салбараа сонгоно.",
      },
      {
        type: "step",
        number: 3,
        text: "\"Урилга илгээх\" товч дарна.",
      },
      { type: "spacer" },
      { type: "heading", text: "12.3 Салбар (Branches)", level: 2 },
      {
        type: "p",
        text: "Байгууллага хэд хэдэн салбартай байж болно. Салбар бүр өөрийн харилцагчид, машинууд, захиалгуудтай байна.",
      },
    ],
  },
  {
    id: "tips",
    title: "13. Зөвлөмж, шилдэг туршлагууд",
    content: [
      { type: "tip", text: "Утасны дугаараар хайх нь харилцагч хайх хамгийн хурдан арга. Хайлтын талбарт утасны дугаарын хэдэн орон ч бичихэд тохирох үр дүн гарч ирнэ." },
      { type: "spacer" },
      { type: "tip", text: "Ажлын захиалга үүсгэхдээ машины улсын дугаарыг бичиж эхлэхэд систем өмнө бүртгэгдсэн машинуудыг санал болгоно. Энэ нь давхар бүртгэлээс сэргийлнэ." },
      { type: "spacer" },
      { type: "tip", text: "Бараа материалын үлдэгдэл бага үед шараар тэмдэглэгдэж, нөөцлөх шаардлагатайг сануулна. Босго хэмжээ тохируулж, дохиолол авах боломжтой." },
      { type: "spacer" },
      { type: "tip", text: "Захиалгын төлөвийг тогтмол шинэчилж байх нь багийн бусад гишүүдэд мэдээлэлтэй байхад тусалдаг. Ялангуяа \"Гүйцэтгэж буй\" болон \"Хүлээлгэхэд бэлэн\" төлөвүүдийг цаг тухайд нь шинэчлэх нь чухал." },
      { type: "spacer" },
      { type: "tip", text: "Өдөр бүр өдрийн тайлангаа шалгаж, санхүүгийн үзүүлэлтээ хянаж байхыг зөвлөж байна. Өдрийн эцэст тайлан гаргаж, маргаашийн төлөвлөгөөгөө гаргахад тусална." },
      { type: "spacer" },
      { type: "danger", text: "PIN кодоо хэнд ч бүү хэлээрэй. Засварын булангийн PIN код нь таны байгууллагын мэдээллийг зөвшөөрөлгүй хандалтаас хамгаална. PIN кодыг тогтмол сольж байхыг зөвлөж байна." },
      { type: "spacer" },
      { type: "tip", text: "Худалдан авалтын захиалгын төлөвийг тогтмол шалгаж байгаарай. \"Захиалсан\" төлөвт байгаа захиалгуудыг бараа ирэхэд \"Хүлээн авсан\" болгож шинэчлэхээ мартуузай." },
      { type: "spacer" },
      { type: "tip", text: "Тохиргоо хэсгээс валют, хэлээ өөрчилж болно. Хэрэв та Монгол улсад үйл ажиллагаа явуулдаг бол MNT валют, MN хэлээр ажиллахыг зөвлөж байна." },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────

export default function GuidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id)),
  );
  const [activeSection, setActiveSection] = useState<string>("");
  const [showToc, setShowToc] = useState(true);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          !searchQuery ||
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.content.some((item) =>
            item.type === "p" || item.type === "bullet" || item.type === "step"
              ? item.text.toLowerCase().includes(searchQuery.toLowerCase())
              : false,
          ),
      ),
    [searchQuery],
  );

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const ref of sectionRefs.current.values()) {
      observer.observe(ref);
    }

    return () => observer.disconnect();
  }, [filteredSections]);

  const setSectionRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) {
        sectionRefs.current.set(id, el);
      } else {
        sectionRefs.current.delete(id);
      }
    },
    [],
  );

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderContent = (items: ContentItem[]) => {
    let stepCounter = 0;
    return items.map((item, idx) => {
      switch (item.type) {
        case "p":
          return (
            <p key={idx} className="leading-relaxed">
              {item.text}
            </p>
          );

        case "heading": {
          const size =
            item.level === 2
              ? "text-lg font-semibold text-foreground"
              : item.level === 3
                ? "text-base font-medium text-foreground"
                : "text-xl font-bold text-foreground";
          return (
            <h3 key={idx} className={`${size} mt-2`}>
              {item.text}
            </h3>
          );
        }

        case "subheading":
          return (
            <p key={idx} className="text-base font-medium text-foreground mt-2">
              {item.text}
            </p>
          );

        case "step":
          stepCounter++;
          return (
            <div key={idx} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {item.number || stepCounter}
              </span>
              <p className="pt-0.5 leading-relaxed">{item.text}</p>
            </div>
          );

        case "bullet":
          // eslint-disable-next-line no-case-declarations
          const isBold = item.text.startsWith("**") && item.text.endsWith("**");
          return (
            <div
              key={idx}
              className={`flex items-start gap-2 ${item.indent ? "ml-6" : ""}`}
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
              <p className="leading-relaxed">
                {isBold ? (
                  <strong>{item.text.slice(2, -2)}</strong>
                ) : (
                  item.text
                )}
              </p>
            </div>
          );

        case "tip":
          return (
            <div
              key={idx}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Lightbulb className="size-4" />
                <span>Зөвлөмж</span>
              </div>
              <p className="leading-relaxed">{item.text}</p>
            </div>
          );

        case "warning":
          return (
            <div
              key={idx}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                <span>Анхааруулга</span>
              </div>
              <p className="leading-relaxed">{item.text}</p>
            </div>
          );

        case "danger":
          return (
            <div
              key={idx}
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/30 dark:bg-red-950/30 dark:text-red-300"
            >
              <div className="mb-1 flex items-center gap-2 font-medium">
                <AlertTriangle className="size-4" />
                <span>Анхаар!</span>
              </div>
              <p className="leading-relaxed">{item.text}</p>
            </div>
          );

        case "info":
          return (
            <div
              key={idx}
              className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-800/30 dark:bg-sky-950/30 dark:text-sky-300"
            >
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Info className="size-4" />
                <span>Мэдээлэл</span>
              </div>
              <p className="leading-relaxed">{item.text}</p>
            </div>
          );

        case "code":
          return (
            <pre
              key={idx}
              className="overflow-x-auto rounded-lg border bg-muted p-3 text-xs font-mono"
            >
              <code>{item.code}</code>
            </pre>
          );

        case "table":
          return (
            <div key={idx} className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {item.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {item.rows.map((row, ri) => (
                    <tr key={ri} className="border-b last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

        case "separator":
          return <hr key={idx} className="border-t" />;

        case "spacer":
          return <div key={idx} className="h-2" />;

        default:
          return null;
      }
    });
  };

  return (
    <div className="mx-auto flex max-w-5xl gap-8 py-6">
      {/* Main content */}
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <BookOpen className="size-8 text-primary" />
            <h1 className="text-2xl font-bold">Гарын авлага</h1>
          </div>
          <p className="text-muted-foreground">
            TOLOM авто засварын удирдлагын системийг ашиглах дэлгэрэнгүй заавар
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Хайх..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {filteredSections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              ref={setSectionRef(section.id)}
              className="scroll-mt-20 rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left font-semibold hover:bg-accent/50 rounded-t-lg"
              >
                <span>{section.title}</span>
                {expandedSections.has(section.id) ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>
              {expandedSections.has(section.id) && (
                <div className="border-t px-5 py-4 space-y-2 text-sm text-muted-foreground">
                  {section.subsections
                    ? section.subsections.map((sub) => (
                        <div key={sub.id}>
                          <h3 className="text-base font-semibold text-foreground mb-2">
                            {sub.title}
                          </h3>
                          <div className="space-y-2">
                            {renderContent(sub.content)}
                          </div>
                        </div>
                      ))
                    : renderContent(section.content)}
                </div>
              )}
            </article>
          ))}
        </div>

        {filteredSections.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>Илэрц олдсонгүй</p>
            <p className="text-xs mt-1">
              Өөр хайлтын үг оруулах эсвэл бүх хэсгийг нээж үзнэ үү
            </p>
          </div>
        )}
      </div>

      {/* Right sidebar: TOC */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-20">
          <button
            onClick={() => setShowToc(!showToc)}
            className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <List className="size-3.5" />
            {showToc ? "Агуулга" : "Агуулга"}
            {showToc ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
          {showToc && (
            <nav className="space-y-0.5 border-l pl-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    toggleSection(section.id);
                    scrollToSection(section.id);
                  }}
                  className={`block w-full truncate text-left text-xs py-1 transition-colors hover:text-foreground ${
                    activeSection === section.id
                      ? "border-l-2 border-primary pl-2 font-medium text-primary -ml-[14px]"
                      : "pl-3 text-muted-foreground"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          )}
        </div>
      </aside>
    </div>
  );
}
