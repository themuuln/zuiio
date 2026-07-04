<!-- Component: Unified Search Screen -->
Design a unified search screen for a mobile horse management app.

Include:
- Back arrow + search input field (auto-focused, large text) at top
- Search suggestions/recent searches below input:
  - "Сүүлийн хайлтууд" (Recent Searches) section header
  - List of recent search terms with clock icon and clear (X) button
- Active search results (appear as user types):
  - Segmented filter: "Бүгд" (All) | "Удам" (Lineage) | "Морьд" (Horses) | "Арга хэмжээ" (Events)
  - Results grouped by category with section headers:
    - Lineage results: horse name + breed + photo thumbnail
    - Horse results: horse card (photo, name, owner, location)
    - Event results: event card (name, date, type badge)
- Each result tappable, navigates to detail
- Empty state: "Хайлтад тохицсон зүйл алга" (No results found) with search illustration
- "Хайлтыг цэвэрлэх" (Clear Search) text button

Style: search-focused, warm background, orange active filter, clean result cards with thumbnails, system font

Optimize for mobile, real-time search-as-you-type, keyboard dismiss on scroll, recent search persistence
