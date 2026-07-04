---
title: Shell Prompt v3
screen: Shell (Main App Home)
version: 3
status: draft
date: 2026-06-10
---

# Shell — Main App Home (v3 — Actionable Dashboard)

Design a home screen for a Mongolian horse management app called Tamga that shows what needs attention right now.

Background: Warm white #FDF6F3.

Header:
- Top-left: "Сайн байна уу, Тэмүүлэн" in 28pt bold #2E2D2C
- Top-right: circular avatar (48dp, photo, border #D4CBC8)
- Below: weather pill — cloud icon + "Улаанбаатар · 18°C" + small orange warning dot in pill #F1E6E2

Body (scrollable):

Horse health strip: a horizontal scrollable row of 5 small horse avatars (56dp circles). Each has a thin colored border ring — 3 green rings (healthy), 1 orange ring (vaccination due), 1 red ring (attention needed). Below each circle: horse name in 11pt #777171. First horse is slightly larger (72dp) with a filled orange badge dot. This strip gives instant overview of all horses' health at a glance.

Needs attention card: a full-width card with warm white background #FFFFFF, soft rounded corners (16dp), thin border #D4CBC8. Inside: title "Анхаарах зүйлс" in 17pt semibold #2E2D2C with a small orange dot badge showing count "3". Below title: 3 action items stacked. Each item has a colored dot on left (orange for due soon, red for overdue), task name in 15pt #2E2D2C, and a small arrow right. Items: "Босоо хээр — Вакцин хугацаа дууссан" (red dot), "Түргэн — Тахлалт ирэх 7 хоногт" (orange dot), "Хүрэн гүү — Эхэлсэн 180 хоног" (orange dot). Bottom of card: "Бүгдийг харах" text link in orange 15pt.

Upcoming section: section title "Ирэх арга хэмжээ" in 20pt semibold #2E2D2C with generous spacing. Below: 2 event cards side by side. Each card: 160dp wide, white background, rounded 12dp, thin border. Inside each: event name in 15pt bold #2E2D2C, date in 12pt #777171, small location pin icon + city name. First card: "Улсын уралдаан" / "6-р сарын 15" / "Төв аймаг". Second card: "Баяр наадам" / "7-р сарын 11" / "Улаанбаатар".

Recent activity: section title "Сүүлийн үйлдлүүд" in 20pt semibold. Below: 2 feed items. Each item: small circular horse photo (40dp) on left, activity text in 15pt #2E2D2C, timestamp in 12pt #777171, and status badge on right (green pill "Баталгаатай" or orange "Хүлээгдэж байна"). Items separated by hairline dividers.

Footer:
- Bottom tab bar: 5 tabs. "Нүүр" (home, filled orange), "Морьд" (horse outline, gray), "Уралдаан" (trophy, gray), "Газар зүй" (map, gray), "Зах" (bag, gray). White bg, hairline top border, labels 10pt.

Style: ultra-minimal flat, warm earth tones, editorial. No shadows, no elevation. The health strip and attention card are the visual heroes — actionable information, not decoration. Mobile app (iPhone).
