# Onoo — Бүтээгдэхүүн, зах зээл ба арилжааны төлөвлөгөө (V2)

> **Хувилбар:** 2.0 · **Шинэчлэгдсэн:** 2026-07-10 · **Хариуцагч:** Тэмүүлэн
> **Төлөв:** Шийдвэр гаргахад бэлэн стратеги. Onoo-гийн одоогийн код нь прототипын нөөц бөгөөд туршилт эсвэл production-д бэлэн гэсэн нотолгоо биш.
> **V1-тэй хамаарал:** Энэ нь production дээр хараахан батлагдаагүй ажлын цаашдын стратеги. Энэ нь анхны хэрэгжилтийн төлөвлөгөөг хүчингүй болгохгүй; аль ажлыг эхлээд эрэмбэлж, бэхжүүлж, баталгаажуулж, арилжаалахыг чиглүүлэхэд ашигла.
> **Суурь:** [V1 бүтээгдэхүүний төлөвлөгөө](./onoo-sports-stats-platform-plan.md) нь анхны хэрэгжилтийн суурь хэвээр.
> **Дагалдах баримтууд:** [хэрэгжилтийн спецификаци](./onoo-implementation-spec.md) (V1 прототипийн зураглал; дараагийн хэрэгжилтээс өмнө уялдуулж засах шаардлагатай), [хэрэгжилтийн бүртгэл](../../apps/onoo/docs/ROADMAP.md), болон [архитектур](../../apps/onoo/docs/ARCHITECTURE.md).

## 1. Шийдвэрийн үндэс

Onoo-г дахиад нэг жирийн олон нийтэд зориулсан сагсан бөмбөгийн статистикийн вэбсайт болгон гаргаж болохгүй, мөн хоосон зах зээл рүү орж байна гэж үзэж болохгүй. Монголд аль хэдийн олон нийтэд нээлттэй сагсан бөмбөгийн статистикийн бүтээгдэхүүнүүд байгаа бөгөөд FIBA нь холбоо, лигүүдэд үнэгүй LiveStats бүтээгдэхүүн санал болгодог. Тиймээс нийтэд нээлттэй game center, хүснэгт, тоглогчийн профайл, box score нь ялгарах зүйл биш, харин заавал байх ёстой үндсэн түвшин юм.

Батлах ёстой бизнесийн загвар нь:

> **Onoo нь системээс үл хамаарах албан ёсны өгөгдлийн үйл ажиллагааны түнш: тоглолт бүрийг найдвартай, шалгах боломжтой, нийтлэх боломжтой бүртгэл болгодог — талбай дээрх capture эсвэл зөвшөөрөгдсөн source intake-ээс эхлээд reconciliation ба approval хүртэл, дараа нь Монгол хэлэнд нийцсэн media, sponsor, league-data feed болгон түгээдэг.**

Энэ нь Onoo шаардлагатай үед FIBA, Stat.mn, Leagues.mn, эсвэл тухайн лигийн өөрийн өгөгдлийн эх сурвалжийг ашиглах эсвэл нэгтгэх боломжтой гэсэн үг. Одоогийн tracker-ээ солихыг зөвхөн төлбөртэй, хэмжигдэхүйц workflow gap бодитоор нотлогдсон үед л санал болгоно.

### Дараагийн 90 хоногийн үр дүн

Доорх бүх нөхцөл биелтэл шинэ fan-app, хоёр дахь спорт, эсвэл өргөн олон нийтийн сайт дээр мөнгө зарцуулахгүй:

1. Нэр бүхий нэг лиг өгөгдөл/нийтлэх эрхийн гэрээ байгуулж, туршилтын урьдчилгаа төлсөн байна.
2. Дөрвөн бодит тоглолт чанарын босгыг давсан байна: нөхөн сэргээх боломжгүй алдаа 0, эцсийн оноо 100% зөв, баталгаажуулалт 24 цагийн дотор, scorer/admin сэтгэл ханамж дор хаяж 8/10.
3. Туршилт нь бие даасан Onoo tracker эсвэл түншлэл/интеграцийн workflow incumbents шийдэж чадахгүй төлбөртэй асуудлыг шийдэж байгааг нотолно.
4. Туршилтын дараа нэг улирлын гэрээ эсвэл sponsor-backed purchase order гарч ирнэ.

Одоо байгаа хэрэгжилт энэ бүхнийг хурдатгаж чадна. Гэхдээ эхлээд 9-р хэсгийн technical-readiness gate-ийг давах ёстой. “Feature exists in source” гэдэг нь “official байдлаар зарахад аюулгүй” гэсэн үг биш.

## 2. Бодит байдал: энэ ангилал аль хэдийн хөдөлгөөнтэй байна

Өмнөх “өрсөлдөгч бараг байхгүй” гэсэн дүгнэлт нь одоогийн нотолгоонд нийцэхгүй. Доорхыг хуучин тоглогчид, ойрын түншүүд, болон судлах зорилтот талууд гэж үз; хуулбарлах бүтээгдэхүүн гэж бүү хар.

| Байгаа сонголт | 2026-07-10-ны байдлын нотолгоо | Onoo-д үзүүлэх утга |
|---|---|---|
| [Stat.mn](https://www.stat.mn/) | Лиг, баг, тоглогч, улирал, бүх цаг үе, тоглолтын статистикийн дэлгэцүүдийг үзүүлдэг; 8+ лиг, 70+ улирал, 1,000+ багийг харуулдаг бөгөөд 100,000 MNT/сар бүхий хостлосон лигийн төлөвлөгөө зарласан. | Ердийн hosted stats site нь үнийн доод жишигтэй байна. Managed үйл ажиллагааг commodity hosting шиг үнэ тогтоож болохгүй. |
| [Leagues.mn](https://leagues.mn/) | Монголын лигүүдийн одоогийн хуваарь, хүснэгт, үр дүн, box score, тоглогчийн тоглолтын log, хуваалцах боломж, холбогдсон видеог нийтэлдэг. | Нийтэд нээлттэй тоглогчийн хуудас ба live score нь ялгарах цорын ганц шалтгаан биш. Үүнийг портал/түгээлийн түнш болгож чадах эсэхийг шалга. |
| [MSports](https://msports.mn/competitions) | Олон спортын хэрэглэгчийн веб/апп түгээлт ажиллуулдаг бөгөөд Үндэсний Сагсан Бөмбөгийн Супер Лигийг бусад тэмцээнүүдийн хамт жагсаадаг. | Анхны шууд өрсөлдөгчөөс илүү хүчтэй broadcast, sponsor, distribution channel байх магадлалтай. Data-entry болон арилжааны загварыг газар дээр нь баталгаажуул. |
| [FIBA LiveStats](https://about.fiba.basketball/en/services/data-and-video-solutions/fiba-live-stats) | FIBA-ийн мэдээлснээр холбоо, лигүүдэд үнэгүй бөгөөд бодит цагийн цуглуулга, game center, API/XML export, scoreboard/TV integration-уудыг багтаадаг. | “Official basketball statistics software” гэж зах зээлд зарж болохгүй юм шиг аашилж болохгүй. MBA-тай хамт FIBA compatibility, approval, data rights, local workflow gap-уудыг заавал баталгаажуул. |

### Шаардлагатай өрсөлдөгч ба түншийн судалгаа

30 хоногийн дотор MBA/FIBA холбоо баригч, Stat.mn, Leagues.mn, MSports, хоёр лигийн оператор, дөрвөн scorekeeper, гурван клубийн GM, гурван боломжит sponsor-тай уулз. Амьд тоглолт бүр дээр дараахыг тэмдэглэ:

- Өгөгдлийг хэн үүсгэдэг, залруулдаг, баталгаажуулдаг, эзэмшдэг, экспортолдог вэ.
- Offline байдал, төхөөрөмж сэргээх нөхцөл, handoff, мөн эцсийн онооны reconciliation явц.
- Олон нийтэд гарах үр дүн audit trail ба албан ёсны approval-той эсэх.
- Одоогийн арилжааны нөхцөл, лигийн data rights, sponsor/broadcast шаардлага, interoperability.
- Худалдан авагч яг одоо юуг сайжруулахад мөнгө төлөх вэ.

Шийдвэрийн мод:

```text
Зөвшөөрөгдсөн эх сурвалж аль хэдийн ажиллаж байна → Onoo-ийн intake, баталгаажуулалт, үйл ажиллагаа, түгээлтийг санал болго.
Зөвшөөрөгдсөн эх сурвалжид төлбөртэй найдвартай ажиллагаа/ажлын урсгалын gap байна → тэр gap-д зориулж Onoo tracker-ийг туршина.
Аль алинд нь ч худалдан авагч мөнгө төлөхгүй → түншлэл хий, сегментээ нарийсга, эсвэл scope-оо тэлэхээс өмнө зогс.
```

## 3. Зах зээлийн байрлал ба анхны хамгийн сайн хэрэглэгч

### Байрлал тогтоолт

Энэ гадаад амлалтыг зөвхөн шаардлагатай нотолгоо бүрдсэний дараа ашигла:

> **Үр дүн бүрт score биш, эх сурвалж, хяналтын мөр, нэртэй төлөв байна.**

Эхний нээлт дээр “Монголын бүх тамирчны цорын ганц үнэн эх сурвалж” гэж амлахгүй. Нэг нэгээр нь баталгаажсан тэмцээн бүрээр тэр нэр хүндийг ол.

### Хэрэглэгч сонгох шалгуур

Анхны хэрэглэгч нь заавал хамгийн нэр хүндтэй лиг байх албагүй. Доорх бүх шалгуураар хамгийн өндөр оноо авсан лигийг сонго:

| Шалгуур | Доод нотолгоо |
|---|---|
| Төлбөртэй operational pain | Худалдан авагч одоогийн data, verification, sponsor, media, scorer-cost-ийн асуудлаа хэлж, төлбөртэй pilot саналд зөвшөөрнө. |
| Шийдвэр гаргах хүртээмж | Нэр бүхий operations owner data rights-ийг гарын үсэг зурж, үр дүнг баталж чадна. |
| Удирдах боломжтой улирал | Хуваарь, venue access нь тодорхой, 20–100 тоглолттой урьдчилан таамаглах боломжтой тэмцээн. |
| Data rights | Хуваарь, roster, үр дүн, logo, player media, historical import, public publication-д бичгээр зөвшөөрөлтэй. |
| Үйл ажиллагааны түнш | Эхний тоглолтоос өмнө lead scorer, backup scorer, approving official нэрлэгдсэн байна. |
| Арилжааны зам | Туршилт эхлэхээс өмнө тохирсон conversion price, төлбөрийн хуваарь, renewal ярилцлага байна. |

National top league нь одоо байгаа системийг төлбөртэй gap нотолгоогүй, эсвэл эрх/шийдвэрийн процесс нь тодорхойгүй байвал түрүүлж сонгохгүй. Их сургууль, эмэгтэйчүүдийн, бүсийн, youth, 3x3, эсвэл шинээр өсөн нэмэгдэж буй лиг нь Onoo-д бүтэн улирлын coverage, data rights, мөн лавлагаа болох үр дүн өгч чадвал илүү сайн beachhead байж болно.

### Нэн тэргүүний дулаан зам — Space League

Space League бол одоо хамгийн эхний outreach зам: түүний founder аль хэдийн энэ app-д сонирхолтой байгаагаа илэрхийлсэн бөгөөд лиг, scorer, media, sponsor, эсвэл холбооны танилцуулга нээх боломжтой. Нийтэд харагдах ул мөрөөр энэ нь зөвхөн Улаанбаатарын сагсан бөмбөгийн лиг/community гэдэг нь л тодорхой; V2 нь одоогийн ангилал, улирлын хэмжээ, өмчлөл, холбооны статус, эсвэл арилжааны загварыг таамаглахгүй. Founder-ийн сонирхлыг хүчтэй баталгаажуулалт ба executive-sponsor боломж гэж үз; харин гарын үсэг зурсан buyer, data rights, эсвэл туршсан workflow-ыг орлох зүйл гэж бүү хар.

Эхний founder working session дараахыг тодруулах ёстой:

1. Founder туршилтыг батлах уу, ивээн тэтгэх үү, эсвэл батлах хүнийг танилцуулах уу.
2. Space League-ийн календарь, тоглолтын тоо, одоогийн data supplier, scorekeeper workflow, мөн яг ямар доголдол/өвдөлтийг засахыг хүсэж байгааг тогтоох.
3. Тоглолт, roster, logo, athlete media, historical data нийтлэх эрх, мөн үр дүнг official гэж нэрлэх нөхцөл.
4. Ямар танилцуулгууд хамгийн их тус болох вэ: approving official, lead scorekeeper, broadcast/media partner, sponsor, MBA/FIBA холбоо баригч.
5. Төлбөртэй эсвэл sponsor-backed дөрвөн тоглолтын pilot, conversion price, мөн ганц хариуцлагатай operations lead.

Хамгийн эхний санал бол 8-р хэсгийн системээс үл хамаарах pilot: Onoo нь шууд орлуулахыг шаардахгүйгээр одоо байгаа зөвшөөрөгдсөн source-ыг сайжруулж болох ч хэмжигдэхүйц verified-data үр дүн заавал гаргана.

### Хийх ажил

| Худалдан авагч / хэрэглэгч | Onoo-оос гүйцэтгүүлэх ажил | Үр ашгийн нотолгоо |
|---|---|---|
| Лигийн operations lead | Тоглолтын өдрийн ба дараах data workflow-ийг удирдаж, хугацаандаа итгэлтэй үр дүн гаргах. | Гарын авлагын reconciliation багасах, SLA дотор баталгаажсан box score, маргаан цөөрөх. |
| Scorekeeper | Үйл явдлыг хурдан capture хийх, connectivity/device failure-ээс сэргээх, шударга алдааг аюулгүй засах. | Алдагдсан event байхгүй, засварын ажил бага, сургасан итгэлтэй ажиллагаа. |
| Комиссар / approving official | Үр дүн provisional, verified, corrected, эсвэл official эсэхийг шийдэх. | Ил харагдах review queue, гарын үсэгтэй revision history, чимээгүй edit байхгүй. |
| Клубийн GM / дасгалжуулагч | Excel хуудас үүсгэхгүйгээр өрсөлдөгч болон тоглогчийн найдвартай мэдээлэл авах. | Цаг хугацаанд нь экспорт/тайлан, мэдэгдсэн provenance, ашигтай scouting шийдвэр. |
| Media / broadcaster / sponsor | Найдвартай live болон эцсийн мэдээллийг дахин ашиглах форматтай нийтлэх. | Embed хийх боломжтой game feed, баталгаажсан recap, хэмжигдсэн branded deliverable. |
| Тамирчин / fan | Тоглолт эсвэл карьерыг ойлгомжтой бүртгэл хэлбэрээр олох. | Өгөгдөл итгэлтэй болмогц үнэгүй public profile ба game page. |

## 4. Onoo-г юугаар хамгаалах вэ

Moat нь raw box-score math биш. Энэ бол data rights, operational reliability, trusted governance, local workflow, болон distribution-ийн нийлбэр юм.

1. **Гэрээт data rights ба бүтэн улирлын coverage.** Лигийн гарын үсэгтэй гэрээ, бүтэн улирал, мөн хууль ёсны historical import-ууд value-ийг давхарлаж өсгөнө. Зөвшөөрөлгүйгээр өрсөлдөгчийн өгөгдлийг хуулах эсвэл republish хийхгүй.
2. **Provenance ба correction governance.** Олон нийтэд гарах үр дүн бүр “Live provisional”, “League verified”, “Official”, эсвэл “Historical import” гэсэн төлөвийн шошготой байна. Засвар нь шинэ revision хэлбэрээр ил харагддаг байх ёстой, чимээгүй overwrite биш.
3. **Тоглолтын өдрийн үйл ажиллагааны систем.** Сургасан scorer workflow, backup device/paper protocol, sync health, recovery, quality assurance, verification SLA нь ердийн вэбсайтаар амархан хуулбарлагдахгүй.
4. **Системээс үл хамаарах interoperability.** Зөвшөөрөгдсөн FIBA/incumbent feed-ийг импортлох эсвэл normalize хийх, media/graphics руу экспортлох, лигийг нэг системд түгжихгүй байх. Onoo нь scorer-of-record биш байсан ч хэрэгтэй байна.
5. **Монгол хэлт түгээлт.** Орон нутгийн хэл, нэр/alias зохицуулалт, лигийн workflow, sponsor тайлан, payment/registration-ийн интеграц нь зөвхөн trusted-record layer ажиллаж эхэлсний дараа ялгарал болно.

## 5. Бүтээгдэхүүний хүрээ: туршилтын бүтээгдэхүүн

### Төлбөртэй туршилтад гаргах ба ажиллуулах зүйлс

Хамгийн жижиг зарагдах боломжтой vertical slice нь нэг сагсан бөмбөгийн формат, нэг тэмцээн, нэг бүрэн урсгал байна:

1. Лиг/тэмцээн, roster, тоглолт, venue, scorer, approving official-ийн тохиргоо.
2. Зөвшөөрөгдсөн source intake: live event capture **эсвэл** source-тэй historical/manual box-score import.
3. Үлдэх боломжтой game journal, sync health-ийн ил харагдах байдал, нэг authoritative scorer device, backup/recovery procedure, post-game reconciliation checklist.
4. Finalize → review → verify → publish-correction workflow, immutable revision history-той.
5. Бодит public game page, энгийн standings, team/roster page, export, мөн embeddable final-data feed.
6. Queue health, unverified game, correction, incident, SLA reporting бүхий game-operations console.
7. Source scan/URL, importer, confidence, reviewer, historical-import label бүхий minimal data-import tool.

### Арилжааны нээлтээс тодорхой хойшлуулах зүйлс

- Dedicated Expo fan app ба push notifications.
- Athlete claims, төлбөртэй athlete profile, эсвэл default-аар public DOB.
- Advanced analytics, shot chart, lineup analysis, player comparison, open API.
- Multi-sport engine, registrations, payments, ticketing, fantasy, эсвэл betting.
- Ads, таамагласан sponsor banner, video hosting, мөн өргөн consumer-growth campaign.

Эдгээр surface-уудын одоо байгаа кодыг feature flag-ийн ард эсвэл дотоод demo хэлбэрээр үлдээж болно. Тэд launch order-ыг тогтоохгүй.

### Илүү сайн, үндсэн түвшнээс давсан туршлага бий болгох бүтээгдэхүүний сайжруулалтууд

| Чадамж | Яагаад чухал вэ | Туршилтын тодорхойлолт |
|---|---|---|
| Provenance badge ба revision timeline | Итгэлийг fan, media, league leadership-д ил болгоно. | Үр дүн бүр эх сурвалж, төлөв, reviewer, published revision number-оо харуулна. |
| Scorekeeper command center | Live тоглолтын хамгийн эмзэг мөчийг хамгаална. | Sync count, хамгийн сүүлд server хүлээсэн цаг, battery/network checklist, backup device, “need help” incident action. |
| Approved data import | Event-source зарчмыг зөрчихгүйгээр backfill хийх боломж олгоно. | Versioned source record approved source/revision-ээс feed хийнэ; импортолсон тоглолтыг live event capture гэж үзүүлэхгүй. |
| Media/sponsor feed | Худалдан авагчид stats page-ээс цааш бизнесийн үр дүн өгнө. | Нэртэй data status болон post-game recap input-тай энгийн embed/export. |
| Identity resolution | Хоёр давхар career record үүрд алдагдахаас сэргийлнэ. | Alias, буцааж болох merge, redirect URL, болон шалгасан claim/dispute зам. |
| League health dashboard | Data quality-ийг renewal яриа болгож хувиргана. | Coverage, verification time, correction, incident, sponsor/media delivery-ийг улирлаар харуулна. |

## 6. Өгөгдөл, итгэлцэл, үйл ажиллагааны загвар

### Маргаангүй бүртгэлийн загвар

Одоогийн төлөвлөгөөний event-sourcing зорилго зөв ч, гарын авлагын historical entry нь derived table-ууд руу шууд бичих ёсгүй. Нэг source model ашигла:

| Source type | Хадгалах оролт | Олон нийтэд харагдах шошго | Засварын зам |
|---|---|---|---|
| Live play-by-play | Нэр бүхий tracker session/device-ээс append-only event journal. | Шууд урьдчилсан → баталгаажсан/албан ёсны. | Шинэ game revision дотор void/replacement event. |
| Зөвшөөрөгдсөн source import | Анхны source reference/file + normalized imported event эсвэл box-score submission. | Historical import эсвэл authorized feed. | Шинэ хянагдсан import version; анхны өгөгдөл хадгалагдана. |
| Manual backfill | Эх сурвалжийн нотолгоо хавсаргасан operator-entered box-score submission. | Historical import. | Шинэ submission/reviewer decision; чимээгүй derived-table edit байхгүй. |

Derived table, standings, leaders, болон public page-ууд нь approved source/revision-ийн projection юм. Тэд сэргээгдэх боломжтой, тусдаа edit хийх зүйл биш.

### Шаардлагатай бүртгэлийн төлөвүүд

```text
төлөвлөгдсөн → шууд урьдчилсан → эцсийн хяналт хүлээгдэж буй → лигээр баталгаажсан → албан ёсны
                                      │
                                      └─ засвар хүссэн → засварын хяналт → дараагийн баталгаажсан/албан ёсны хувилбар
```

- Зөвхөн verified/official үр дүн official career record болон official standings-д тооцогдоно. Хэрэв provisional үр дүн standings-д гарвал тухайн харагдацыг бүхэлд нь provisional гэж шошгол.
- “Official” гэдэг нь гэрээт/лигийн approval status болохоос FIBA approval гэсэн баталгаа биш. FIBA approval-ийг тусгайлан авч байж л тэгж нэрлэнэ.
- Approving official, шалтгаан, өмнөх/дараах revision, publication timestamp-ийг хадгал.

### Олон нийтэд нээлтээ хийхээс өмнөх data ба privacy бодлого

- Төрсөн огноо, тоглогчийн зураг, утас/имэйл, claim-ийн нотолгоо, төхөөрөмжийн ID, оператор/audit өгөгдлийг анхнаасаа хувийн гэж үз. Fan page-ууд нь raw event/audit мөр биш, шүүсэн public view уншина.
- Зураг болон youth data-д лиг болон тоглогч/асран хамгаалагчийн тодорхой зөвшөөрөл ав. Насанд хүрээгүй хүүхдүүдэд visibility-ийг болгоомжтой тохируулж, guardian-consent урсгал бий болго.
- Player alias, merge history, correction/claim review, appeal, takedown, retention, data-export процессыг хадгал.
- Public media upload-ыг идэвхжүүлэхээс өмнө upload ownership, MIME/size limit, moderation, storage quota-гаа бич.
- Гэрээнд лигийн operational record-ийн өмчлөл, Onoo-ийн platform IP, мөн зөвшөөрөл өгсөн тохиолдолд Onoo-ийн data-г host болон aggregate хийх non-exclusive эрхийг тодорхой заавал тусгана.

### Тоглолтын өдрийн staffing

Pilot дээр нэг authoritative scorer device-ээс эхэл. Dual scorekeeper reconciliation нь дараагийн үеийн боломж; pilot дээр хоёр хяналтгүй offline stream-ийг нийлүүлэх шалтаг биш.

| Үүрэг | Тоглолтоос өмнө | Тоглолтын үеэр | Тоглолтын дараа |
|---|---|---|---|
| Лигийн operations lead | Roster, эрх, venue, official, schedule-ийг баталгаажуулна. | Eligibility эсвэл schedule-ийн асуудлыг шийднэ. | Засварыг батална/хүснэ, улирлын тайланг эзэмшинэ. |
| Lead scorer | Device, clock, roster checklist-ийг дуусгана. | Data capture, sync хяналт, paper backup procedure мөрдөнө. | Эцэслэж, official score sheet-тэй тулгана. |
| Backup scorer / runner | Цэнэглэсэн backup device, paper score sheet-ийг барина. | Бичигдсэн handoff procedure-ийн дагуу л takeover хийнэ. | Ашигласан бол incident note-д гарын үсэг зурна. |
| Onoo QA | Бэлтгэл байдлыг шалгаж, health dashboard-ийг хянана. | Incident-д хариу өгч, data consistency-г баталгаажуулна. | Quality report гаргаж, review руу дамжуулна. |
| Approving official | Tip-off-оос өмнө нэрлэгдсэн байна. | Дүрмийн эсвэл маргааны чухал шийдвэрт бэлэн байна. | Тохирсон SLA дотор verified/official болгоно. |

Доод runbook: төхөөрөмж/battery/network check, local journal receipt check, paper fallback, takeover алхам, failed-sync escalation, end-of-game reconciliation, correction deadline, postmortem template.

## 7. Go-to-market: эхлээд түнш, дараа нь өрсөлдөөн

### Үе -1 — discovery ба partnership (1–2 долоо хоног)

1. Шаардлагатай ярилцлагуудыг хийж, 2–4 амьд тоглолт ажигла.
2. FIBA LiveStats, Stat.mn, Leagues.mn, MSports дээр data entry, auditability, offline use, rights, export, мөн хэн мөнгө төлдөг тал дээр нарийвчилсан teardown хий.
3. Холбогдох incumbent бүрээс white-label, ingest, API, revenue-share, эсвэл portal-distribution partnership байгаа эсэхийг асуу.
4. Space League-ийн founder-ыг дулаан sponsor route болгон эхлүүл; түүнтэй холбогдох танилцуулгуудыг ашиглан бодит workflow-ийг ажиглаж, design partner-ийг зөвхөн төлбөртэй асуудал, нэр бүхий approver, тоглолтын календарь, data-rights path байгаа үед сонго.

**Gate:** хоёр боломжит худалдан авагч ижил paid gap-ийг нэрлэнэ; нэг нь letter of intent эсвэл pilot agreement дээр гарын үсэг зурна. Хэрэв тэгэхгүй бол clone бүү бүтээ. Түншлэл, өөр сегмент, эсвэл зогсолт сонго.

### Үе 0 — technical recovery ба rehearsal (3–5 долоо хоног)

1. 9-р хэсгийн бүх P0 release blocker-ийг дуусга.
2. Эх сурвалжийн нотолгоотой, бие даасан хяналттай licensed historical scoresheet 10 ширхэг импортол.
3. Offline, reload, stale authentication, duplicate submission, device handoff, correction scenario орсон 3–5 scrimmage явуул.
4. Lead scorer, backup scorer, operations lead, approving official-ийг runbook-аар сурга.

**Gate:** clean deployment давтагдана; rehearsal бүр тохирсон failure mode-уудаар амьд гарна; эцсийн оноо бүр official sheet-тэй таарна; data чимээгүй алдагдах эсвэл өөрчлөгдөхгүй.

### Үе 1 — төлбөртэй дөрвөн тоглолтын нотолгоо (6–8 долоо хоног)

Системээс үл хамаарах “Onoo Official Data Operations Pilot” санал болго. Хэрэв FIBA эсвэл incumbent нь зөвшөөрөгдсөн source бол Onoo түүний эргэн тойронд reconciliation, verification, publishing, distribution-ийг гүйцэтгэнэ. Хэрэв тохиролцсон асуудал шаардвал Onoo өөрийн tracker-ийг ажиллуулна.

Гаралт:

- Roster/game setup ба сургагдсан operator-ууд.
- Source/revision trail-тэй дөрвөн тоглолтын coverage.
- Зөвшөөрөгдсөн газарт live provisional feed, 24 цагийн дотор final audited box score, export/embed, pilot quality report.
- Ямар ч output-ыг official гэж нэрлэхээс өмнө тодорхой approval.

**Gate:** төлбөрийн урьдчилгаа орсон, нөхөн сэргээх боломжгүй алдаа 0, эцсийн оноо зөв, verification SLA хангагдсан, COGS зорилтот түвшинд, дөрөв дэх тоглолтоос өмнө улирлын conversion уулзалт товлогдсон байна.

### Үе 2 — төлбөртэй бүтэн улирлын reference (нэг улирал)

Шоу тоглолт биш, нэг бүтэн тэмцээнийг бүрэн cover хий. Долоо хоног тутмын operations report нийтэл, sponsor/media амлалтыг хүргэ, засварыг ил тод хий, renewal evidence цуглуул.

**Gate:** эхний renewal эсвэл sponsor-backed order, eligible game coverage 80%+, тохирсон quality/SLA зорилт, эерэг contribution margin. Үүний дараа л хоёр дахь лиг рүү ор.

### Үе 3 — давтагдах өргөтгөл

Сургасан лигийн staff-тай Certified mode-д хоёр дахь ба гурав дахь лигийг нэм. Борлуулалтын зардлыг бууруулдаг эсвэл өгөгдөл түгээлтийг илүү үнэ цэнтэй болгодог partner channel-ийг түрүүлж тавь. Нэг тодорхой худалдан авагч commit хийсэн үед л league operations, team analytics, commercial data feed нэм.

## 8. Орлогын загвар ба үнийн туршилтууд

### Орлогын дараалал

1. **Төлбөртэй official-data operations** — setup, training, coverage, reconciliation, verification.
2. **League operations SaaS** — trusted record өдөр тутам ашиглагдаж эхэлсний дараах schedule, registration, roster, approval, support.
3. **Sponsor-funded official-data package** — branded recap, verified leaderboard, live-feed placement, хэмжигдсэн report; таамагласан banner inventory биш.
4. **Club scouting/analytics** — өгөгдлийн бүрэн байдал батлагдсаны дараах authorized export, opponent report, advanced analysis.
5. **Commercial media/broadcast API** — contract, attribution-той, жилийн доод хэмжээтэй, rate-limited өгөгдлийн эрх.
6. **Payments/ticketing take rate** — provider terms, payout responsibility, transaction economics тодорхой болсны дараа л.

Үндсэн athlete болон fan record-уудыг үнэгүй байлга. Athlete-ээс visibility эсвэл ranking-ийн төлбөр авч болохгүй. Хожим нэмэгдэх bilingual recruiting dossier эсвэл verified media profile нь тусдаа, өндөр эрсдэлтэй үр дүн бий болгодог тул төлбөртэй байж болно.

### Ажлын rate card — одоогоор баттай үнэ гэж бүү зарла, зөвхөн турш

Stat.mn-ийн зарласан 100,000 MNT/сарын төлөвлөгөө нь hosting-ийн жишиг болохоос courtside labor, verification, эсвэл commercial data rights-ийн үнэ биш. Доорх нь мэргэжлийн эсвэл сайн санхүүжсэн лигүүдэд зориулсан pilot hypothesis; жижиг amateur лигүүдийн хувьд partner/referral эсвэл self-serve байх ёстой, managed coverage-ийг татаасаар дэмжих хэрэггүй.

| Санал | Үнийн таамаглал | Оруулсан үнэ цэнэ | Төлбөрийн нөхцөл |
|---|---:|---|---|
| Лигийн staff pilot | 800,000 MNT | 400,000 MNT-ийн training/setup + 100,000 MNT-ээр дөрвөн тоглолтын QA/platform support. | 50% урьдчилгаа; 14 хоногийн дотор байгуулагдсан улирлын гэрээнд суутган тооцно. |
| Managed official-data pilot | 2,000,000 MNT | 600,000 MNT-ийн setup/training + 350,000 MNT-ээр дөрвөн managed тоглолт. | 50% урьдчилгаа; 14 хоногийн дотор байгуулсан улирлын гэрээнд суутгана. |
| Onoo Certified | 3,000,000 MNT улирлын setup + official тоглолт бүрт 150,000 MNT; доод тал нь 25 тоглолт. | Лигийн staff capture; Onoo training, QA, verification workflow, public/data feed. | Нэг улирлын доод хугацаа; улирлын өмнө 50%, нээлтийн үед 40%, эцсийн reconciliation-ийн дараа 10%. |
| Onoo Official | 5,000,000 MNT улирлын setup + managed тоглолт бүрт 350,000 MNT. | Onoo lead scorer, remote QA, recovery/reconciliation, verification SLA. | Улирлын ижил нөхцөл; аялал болон түрээсийн төхөөрөмжийг өртгөөр нь тооцно. |
| Club scouting, дараа нь | Клуб бүрт 2,000,000–8,000,000 MNT / улирал. | Зөвшөөрөгдсөн тайлан, экспорт, opponent analytics. | Жилийн/улирлын гэрээ. |
| Sponsor/media/API, дараа нь | Захиалгат жилийн доод хэмжээ. | Эрхийн хяналттай verified feed, branded deliverable, эсвэл media/graphics integration. | Тусдаа data/sponsor гэрээ. |

Pilot нь санаатайгаар **үнэгүй биш**. Хөнгөлөлтийг reference, case study, эсвэл тодорхой non-exclusive license-ээр солилцож болно. Харин хязгааргүй scorer labor эсвэл “дараа нь төлнө” гэсэн бүдэг амлалтаар сольж болохгүй.

### Unit economics

Тоглолт ба улирлыг дараах загвараар хяна:

```text
Орлого = улирлын setup
       + (Certified тоглолт × 150,000 MNT)
       + (managed тоглолт × 350,000 MNT)
       + sponsor/data лицензүүд

COGS = scorer-ийн бодит өртөгтэй хөдөлмөр + remote QA + аялал + төхөөрөмж/data-ийн элэгдэл
     + reconciliation/support + төлбөрийн шимтгэл + partner revenue share
```

Арилжааны хамгаалалтын босго:

- Certified mode-ийн gross margin зорилт: дор хаяж 70%.
- Managed mode-ийн gross margin зорилт: дор хаяж 50%.
- Certified тоглолтод бодит COGS 50,000 MNT-ээс, managed тоглолтод 175,000 MNT-ээс доош байхыг масштаблахаас өмнө батал.
- Гэрээт мөнгөний дор хаяж 50%-ийг улирал эхлэхээс өмнө цуглуул.
- Хэрэв dual-entry эсвэл гадаад аялал хэрэгтэй бол үнийг дахин тогтоо; эдгээр зардлыг flat hosted-site subscription дотор нууцалж болохгүй.

Жишиг томьёо: 239 тоглолттой улирал энэ rate card-оор Certified дээр 38.85 сая MNT, managed дээр 88.65 сая MNT орлого гаргана. Эдгээр нь төлөвлөгөөний таамаглал болохоос forecast биш; scorer labor болон лигийн төлөх сонирхолыг төлбөртэй pilot дээр нотлох ёстой.

### Эхний тоглолтоос өмнө заавал байх гэрээний нөхцөл

- Нэг улирлын доод хугацаа ба төлбөрийн хуваарь.
- Лиг, баг, тоглогч, logo, schedule, historical, media, result data-ийг тохирсон surface-үүдэд ашиглах зөвшөөрөл.
- Raw operational data, Onoo platform IP, export rights, termination/takedown process-ийн тодорхой эзэмшигч.
- “Live”, “verified”, “official”-ийн тодорхойлолт; correction window; escalation contact; publication SLA.
- Үйлчилгээний хүрээ: scorer, tablet, connectivity, venue access, backup, travel, approval-ыг хэн нийлүүлэх.
- Sponsor revenue share нь хэмжигдэхүйц deliverable-тэй тусдаа гэрээнд байх.

## 9. Одоогийн прототипын production-readiness gate

Одоогийн repository-д Onoo-ийн нэлээд хэмжээний source code байгаа ч implementation inventory нь deploy хийхэд бэлэн бүтээгдэхүүний нотолгоо биш. Дараах асуудлуудыг энэ төлөвлөгөөний review үеэр баталгаажуулсан бөгөөд эдгээр нь P0 blocker юм.

| Блокер | Батлагдсан нөхцөл | Шаардлагатай шийдэл |
|---|---|---|
| Давтагдах боломжтой database | Бүртгэгдсэн migrations 001–004, 008, 009-ийг агуулж байгаа ч functions нь дутуу RLS, rollup, RPC migrations-ээс хамаарч байна. Migration 009 нь tracked base schema-д байхгүй membership column-ыг мөн заадаг. | Эхлээд hosted migration history-г Git-тэй харьцуул. Нэг цэвэр migration chain сэргээж эсвэл дахин байгуул, clean reset/seed ажиллуул, generated types-ийг дахин үүсгэ, үүнийг CI-required болго. Танихгүй production schema-г сохроор patch хийхгүй. |
| Authorization ба data isolation | Зорьсон RLS/helper functions tracked chain-д алга; service-role authorization ба polymorphic membership handling аюултай/бүрэн бус байна. | Бүх record-changing path-ыг нарийн хүрээтэй authenticated RPC/Edge endpoint-ын ард байрлуул. Role, league, roster, status, sport, period, idempotency-г server-side enforce хий. Role-matrix integration test нэм. |
| Official lock ба correction | Шууд update, correction record дутуу, зөрчилтэй manual box entry нь үр дүнг чимээгүй өөрчилж чадна. | Tracker session, immutable event/revision ID, correction request/review table, DB-enforced state transition, public revision number нэм. |
| Offline амлалт | Tracker одоогоор durable per-game journal бус, memory queue шиг ажиллаж байна. | IndexedDB-д network activity-ээс өмнө operation-уудыг хадгал; acknowledgement state, retry/backoff, reload-ын дараах recovery, ил sync health, single-writer handoff protocol-ыг барь. Бодит device failure mode-уудыг тестэл. |
| Бодит data surface | Public/admin path-д mock/fallback data болон mocked manual-entry урсгал хэвээр байна. | Demo data-г устга эсвэл маш тод label тавь. Pilot нь зөвхөн бодит schedule → roster → live/final → verified → public box score/standings урсгалаар явна. |
| Mobile claims | App нь type-check-ийг цэвэр давахгүй; phone auth/push/PWA гэсэн амлалтууд tracked configuration-аар deploy хийх боломжгүй байна. | Mobile, athlete claims, push, PWA marketing-ийг хойшлуул. Web pilot-оо эхлээд найдвартай болго; build/type/runtime болон operational gate-ууд давсны дараа surface бүрийг буцааж оруул. |
| Domain consistency | Одоогийн event source, derived table, types, rules, player identity, tiebreaker нь төлөвлөсөн model-оос зөрж байна. | Versioned basketball ruleset, source/provenance layer, player alias/merge, roster/game invariant, official scoresheet дээр суурилсан тестүүд бий болго. |

### Шаардлагатай engineering дараалал

1. Product-scope өргөтгөлийг царцааж, remote/database state-ийг inventory хийнэ.
2. Цэвэр schema baseline сэргээ; reset, seed, generated-type diff, function checks, RLS tests-ийг CI-д ажиллуул.
3. Нэг secure vertical slice бүтээ: schedule → roster → assigned scorer → durable live journal → final → verified → real public result.
4. Undo/edit-ийг explicit void/replacement operation болгон загварчил. Client-generated stable ID болон session бүрийн ordering-ийг хадгал.
5. Automated unit/property test plus бодит төхөөрөмжийн chaos test явуул: airplane mode, reload, duplicate event, expired auth, browser sleep, queue recovery, device handoff, finalization, correction.
6. Queue depth, sync failure, rejected event, function error, verification time, realtime latency, restore drill-д observability нэм. Backup/PITR болон event-log export procedure-ийг хадгал.
7. Аливаа гэрээт тоглолтоос өмнө 3–5 supervised scrimmage хий.

Энэ дараалал болон pilot quality gate бүрэн дуусаагүй цагт олон нийтэд “official” гэж зарлахыг хориглоно.

## 10. Метрик ба шийдвэрийн gate

### Итгэлцэл ба үйл ажиллагааны метрик

| Метрик | Pilot зорилт | Дутсан үед эзэн/үйлдэл |
|---|---:|---|
| Нөхөн сэргээх боломжгүй event алдагдал | 0 | Coverage-ийг өргөтгөхөө зогсоо; дараагийн тоглолтоос өмнө incident review хий. |
| Official sheet-тэй харьцуулахад эцсийн онооны зөв байдал | 100% | Official үр дүн нийтлэхгүй; source ба root cause-ийг зас. |
| Баталгаажсан үр дүнгийн хугацаа | Хамгийн ихдээ 24 цаг | Нэр бүхий approver руу escalation хийж, provisional шошготой нийтэл. |
| Шууд шинэчлэлтийн latency | Network байгаа үед 2 секундээс доош | Local capture-аас тусад нь хэмж; data integrity-ийг shortcut-оор бүү сайжруул. |
| Бүрэн roster/device checklist-тэй эхэлсэн тоглолт | Дор хаяж 95% | Owner/scorer-ийг дахин сурга; setup workflow-ийг зас. |
| Чухал correction rate | Pilot-ын явцад буурч, тайлбарлагдсан байна | Сургалт, UX, source quality, rule definition-ийг шалга. |
| Admin/scorer сэтгэл ханамж | Дор хаяж 8/10 | Яаралтай ярилц; retention-тэй feature request-ийг эндүүрч бүү үз. |

### Арилжааны метрик

| Метрик | Gate |
|---|---|
| Төлбөртэй discovery | Хоёр худалдан авагч ижил unmet paid need-ийг нэрлэнэ. |
| Pilot commitment | Field work эхлэхээс өмнө дор хаяж 1,000,000 MNT deposit + data/right-to-publish нөхцөл. |
| Тоглолтын contribution | COGS нь 8-р хэсэгт заасан хязгаарт багтана. |
| Conversion | Pilot хаагдсанаас хойш 14 хоногийн дотор дор хаяж нэг улирлын гэрээ эсвэл sponsor-backed purchase order. |
| Давтагдах чадвар | Хоёр дахь спорт эсвэл fan-app launch нэмэхээс өмнө эхний renewal ба target margin. |
| Түгээлт | Sponsor/media commitment-ийг CPM эсвэл speculative views биш, delivered verified asset-оор хэмжинэ. |

### Kill, pivot, partner дүрэм

- **Partner:** Incumbent нь зөвшөөрөгдсөн source-оо эзэмшдэг ч Onoo-ийн verification, operations, эсвэл distribution layer-ийг ашигтай revenue share-тайгаар зөвшөөрнө.
- **Narrow:** Regional, youth, women’s, university, 3x3 зэрэг сегментүүдэд эрх ба төлбөртэй workflow gap байгаа боловч top league дээр байхгүй.
- **Pivot:** Анхны live capture амжилтгүй боловч data import/verification, media feed, эсвэл league operations үнэ цэнээрээ батлагдана.
- **Stop:** Төлбөртэй pilot байхгүй, гэрээт data rights байхгүй, эсвэл discovery-ийн дараа нэг ч худалдан авагч gap-аа нэрлэхгүй. Илүү consumer feature нэмж нөхөх гэж бүү оролд.

## 11. Нээлттэй шийдвэрүүд ба эзэн

| Шийдвэр | Шаардлагатай нотолгоо | Pilot-оос өмнөх хугацаа |
|---|---|---|
| Space League founder route | Founder-ийн үүрэг, approval эрхтэй buyer эсэх, одоогийн supplier/workflow, эрхийн зам, холбож өгөх танилцуулгууд, мөн төлбөртэй/sponsor-backed pilot commitment. | Эхний founder working session; Phase 0 санхүүжилтээс өмнө. |
| Анхны design-partner лиг | Гарын үсэгтэй buyer, calendar, эрх, operations owner, budget. | Technical recovery санхүүжихээс өмнө. |
| Build vs integrate | Ажиглагдсан FIBA/incumbent workflow, эрх, төлбөртэй gap. | Phase -1-ийн төгсгөл. |
| Scorekeeper model | Лигийн staff vs managed coverage-ийн дөрвөн тоглолтын cost/time/quality харьцуулалт. | Pilot хаах үе. |
| Data ownership/license | Raw data, media, public page, export, termination-ийг хянасан signed contract. | Data import/publication хийхээс өмнө. |
| Brand/name/domain/trademark | Боломжтой эсэх, хэрэглэгчийн хариу, шаардлагатай бол хууль эрхийн шалгалт. | Public launch-оос өмнө. |
| Youth/athlete identity policy | Consent, guardian, claim/dispute, deletion, visibility policy. | Public youth profile гаргахаас өмнө. |
| Payments/ticketing | Provider contract, fee, payout/tax responsibility, мөн худалдан авагчийн commitment. | Эхний улирлын renewal-аас хойш л. |

## 12. Эх сурвалж ба баримт бичгийн хяналтын тэмдэглэл

Энэ төлөвлөгөө нь local implementation review болон 2-р хэсэгт линктэй public market evidence дээр үндэслэсэн. Өрсөлдөгчийн хуудас болон FIBA-ийн хэрэгслүүд өөрчлөгдөж болох тул үнэ тогтоохоос өмнө, эсвэл орлуулах шийдвэр гаргахаас өмнө competitor/partner discovery-г дахин ажиллуул.

V1 implementation specification нь прототипын лавлагаа болж үлдэнэ. Гэхдээ энэ нь энэ стратегитэй болон одоогийн source-тай мэдэгдэж буй зөрчилтэй. Тиймээс 5, 6, 9-р хэсгүүдтэй source model, database, RLS, correction workflow, acceptance test-үүдийг уялдуулж дуусах хүртэл execution authority биш юм.
