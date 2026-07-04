---
title: Horses (Морьд) Prompt
screen: Horses — Herd Registry
version: 1
status: draft
date: 2026-06-10
---

# Морьд — Herd Registry

Design a horse list screen for a Mongolian horse management app called Tamga. This shows the owner's full herd with status at a glance.

Background: Warm white #FDF6F3.

Header:
- Title "Миний морьд" in 28pt bold #2E2D2C
- Below: 3 stat pills in a row — "44 морь" (bold), "40 Эрүүл" (green text), "4 Анхаарах" (orange text). Pills have background #F1E6E2, softly rounded.

Body (scrollable):

Search bar — full-width, rounded corners, magnifying glass icon left, placeholder "Морь хайх..." in 15pt #777171. Background #F1E6E2, no border.

Filter chips — horizontal scrollable row of pill chips below search. Chips: "Бүгд" (selected, filled orange), "Эрүүл", "Анхаарах", "Үржүүлэг", "Зарах". Selected chip: orange bg white text. Unselected: outline #D4CBC8, text #777171.

Horse list — 4 items stacked vertically. Each item: horse photo circle (56dp) on left, horse name in 17pt #2E2D2C, breed and age in 13pt #777171 below name, and a small colored status dot on right (green/orange/red). Items separated by hairline dividers #D4CBC8.

Floating action button — bottom-right, orange circle with white plus icon. Positioned above the tab bar.

Footer:
- Tab bar: 5 icons with labels — "Нүүр" (home, gray), "Морьд" (horse, filled orange), "Арчилгаа" (calendar, gray), "Угшил" (tree, gray), "Зах" (bag, gray). White background, hairline top border.

Style: ultra-minimal flat, warm earth tones, clean list. No shadows, no elevation. Quick scanning is the priority. Mobile app (iPhone).
