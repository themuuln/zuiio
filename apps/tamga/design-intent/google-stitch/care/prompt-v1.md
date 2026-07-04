---
title: Арчилгаа Prompt
screen: Care Calendar & Logs
version: 1
status: draft
date: 2026-06-10
---

# Арчилгаа — Care Calendar & Logs

Design a care calendar screen for a Mongolian horse management app called Tamga. This shows what care is due and what's been done.

Background: Warm white #FDF6F3.

Header:
- Title "Арчилгаа" in 28pt bold #2E2D2C
- Below: toggle pills — "Өнөөдөр" (selected, filled orange) / "7 хоног" / "Сар" in 15pt. Unselected pills have outline border #D4CBC8.

Body (scrollable):

Season alert — a full-width banner at top with warm orange background #F06A2E at 10% opacity, rounded 12dp. Inside: season icon (snowflake or sun) + "Зуны улирал: Тахлалт, вакцины хугацаа" in 15pt #2E2D2C.

Today's tasks — section title "Өнөөдөр" in 20pt semibold #2E2D2C. Below: 3 task items stacked. Each item: horse photo circle (40dp) on left, task name in 15pt #2E2D2C (like "Вакцинжуулалт"), horse name in 12pt #777171 below, and a checkbox on right (empty circle for pending, green checkmark for done). Items separated by hairline dividers.

Calendar strip — a horizontal scrollable row of 7 day circles showing this week. Each circle: day number in 13pt, day name below in 11pt. Today's circle is filled orange with white text. Days with events have a small colored dot below the circle. Days without events have no dot.

Upcoming — section title "Ирэх 7 хоног" in 20pt semibold. Below: 3 items, each with a small colored dot (orange/red), task description in 15pt #2E2D2C, horse name in 12pt #777171, and date in 12pt #777171 on right.

Footer:
- Tab bar: 5 icons with labels — "Нүүр" (home, gray), "Морьд" (horse, gray), "Арчилгаа" (calendar, filled orange), "Угшил" (tree, gray), "Зах" (bag, gray). White background, hairline top border.

Style: ultra-minimal flat, warm earth tones, functional. No shadows, no elevation. Tasks and calendar are the heroes. Mobile app (iPhone).
