<!-- Layout: Map & Lost Horse Finder -->
Design a map and lost horse finder section for a mobile app.

Include:
- Main map screen with lost horse markers, geofence circles, and nearby pins
- Report lost horse form with GPS location
- Lost horse detail screen with found/cancel actions
- Active reports list sorted by distance
- Geofence alerts history screen
- Geofence setup screen with map tap
- Nearby horses discovery screen with radius filter

Interactions:
- Map markers tap to show detail callout
- FAB opens report form
- Geofence circles are tappable for edit
- Radius filter chips update nearby results
- Bottom sheet slides up for report list

Style: map-focused design, orange (#F06A2E) markers and alerts, warm overlay panels, clean map UI, system font

Optimize for mobile, full-screen map, GPS integration, smooth marker animations

---

<!-- Component: Map Screen -->
Design a full-screen map view for a mobile horse lost-and-found app.

Include:
- Full-screen map (MapLibre/Mapbox style, warm-toned map tiles)
- Top bar (floating, semi-transparent): search input with location icon
- Map markers:
  - Lost horse markers: red pin with horse icon, pulse animation
  - Geofence circles: orange semi-transparent fill with orange border
  - Nearby horse pins: small orange dots with photo thumbnail on zoom
- Bottom sheet (peek height 120dp): "Ойролцоо морьд" (Nearby Horses) header with count
- Orange FAB (bottom-right): alert icon for reporting lost horse
- Current location button (bottom-right, above FAB): crosshair icon
- Legend overlay (tap to toggle): marker type colors

Style: immersive full-screen map, orange accent markers, semi-transparent floating UI elements, warm map style, system font for overlays

Optimize for mobile, smooth pan/zoom, marker clustering at zoom levels, GPS accuracy circle

---

<!-- Component: Report Lost Horse Screen -->
Design a lost horse report form for a mobile app.

Include:
- "Алдсан морь мэдээлэх" (Report Lost Horse) title with back arrow
- Horse selector at top: "Морь сонгох" (Select Horse) — dropdown or card with photo + name
- Location section:
  - Map preview showing selected location (150dp height, rounded)
  - "Байршил сонгох" (Select Location) — tap map to drop pin, or "Одоогийн байршил" (Current Location) button
  - Address text below map preview (reverse geocoded)
- Search radius selector: chip row — "5 км" | "10 км" | "25 км" | "50 км" — orange active
- Description textarea: "Тайлбар" (Description) — "Хаана, хэзээ алдсан..." (Where, when lost...)
- "Мэдээлэх" (Report) primary button — full-width, orange
- Warning: "Таны байршлыг бусад хэрэглэгчидэд харуулна" (Your location will be shown to other users)

Style: map-integrated form, warm background, orange radius chips, clean form fields, prominent map preview, system font

Optimize for mobile, GPS permission request, location picker modal

---

<!-- Component: Lost Horse Detail Screen -->
Design a lost horse report detail screen for mobile.

Include:
- Horse photo hero (full-width, 180dp, rounded bottom corners)
- Status banner at top of content: "Хайж байна" (Searching) with orange background
- Horse info: name, breed, last seen date, coat color
- Location section: mini map with marker showing last known location
- "Хамгийн сүүлд харагдсан" (Last Seen) label with timestamp
- Reporter info: avatar, name, phone (masked)
- Action buttons:
  - "Олсон" (Found) primary button — green (#0A6B1C), full-width
  - "Цуцлах" (Cancel Report) text button — red (#C41012)
- Share button for spreading the word
- Distance from user (if location available): "Танаас 12.5 км"

Style: urgent but clean, orange status banner, map preview, clear action buttons, warm palette, system font

Optimize for mobile, one-tap found/cancel with confirmation dialog, share to social

---

<!-- Component: Active Reports Screen -->
Design an active lost horse reports list for mobile.

Include:
- "Идэвхтэй мэдээллүүд" (Active Reports) title with back arrow
- Sort indicator: "Зайгаар" (By Distance) — tappable to change sort
- Report cards in vertical list:
  - Horse photo thumbnail (60dp, rounded)
  - Horse name (Headline)
  - "Алдсан: [date]" (Lost: [date]) in muted text
  - Distance badge: "12.5 км" (pill, orange text)
  - Status indicator: orange dot for active
- Empty state: map illustration + "Идэвхтэй мэдээлэл алга" (No active reports)
- Pull-to-refresh for updates

Style: warm grouped background, white cards, distance badges, clean list layout, iOS grouped list pattern, system font

Optimize for mobile, real-time updates, pull-to-refresh, distance-based sorting

---

<!-- Component: Geofence Alerts Screen -->
Design a geofence alert notification history screen for mobile.

Include:
- "Гео хашааны мэдэгдэл" (Geofence Alerts) title with back arrow
- Alert cards in vertical list (newest first):
  - Alert icon (orange for enter, red for exit)
  - Geofence name (Headline)
  - "Нэвтэрсэн" (Entered) or "Гарсан" (Exited) label
  - Horse name + timestamp
  - Mini map thumbnail showing location (optional)
- Clear all button at top-right: "Бүгдийг арилгах" (Clear All)
- Empty state: bell illustration + "Мэдэгдэл алга" (No alerts yet)

Style: notification list, warm background, color-coded alert icons (orange enter, red exit), clean card layout, system font

Optimize for mobile, swipe to dismiss individual alerts, real-time push integration

---

<!-- Component: Geofence Setup Screen -->
Design a geofence creation screen using map interaction on mobile.

Include:
- "Гео хашаа үүсгэх" (Create Geofence) title with back arrow
- Full-screen map with geofence drawing mode:
  - Tap to place fence center point (orange pin)
  - Radius slider overlay at bottom: "Радиус: 5 км" (Radius: 5 km)
  - Visual circle preview on map (orange semi-transparent fill)
- Name input field (floating above map): "Нэр" (Name) — "Миний хашаа" (My Pasture) placeholder
- Color picker: 4 preset colors (orange, blue, green, red) for the geofence
- "Хадгалах" (Save) primary button — full-width, orange, floating at bottom
- "Цуцлах" (Cancel) text button next to save

Style: map-first design, orange geofence circle, floating input fields, minimal chrome, system font

Optimize for mobile, drag radius slider, real-time circle preview, GPS integration

---

<!-- Component: Nearby Horses Screen -->
Design a nearby horses discovery screen for mobile.

Include:
- "Ойролцоо морьд" (Nearby Horses) title with back arrow
- Radius filter chips: "5 км" | "10 км" | "25 км" | "50 км" — orange active chip
- Map preview at top (200dp): shows pins for nearby horses
- Horse cards in list below map:
  - Horse photo thumbnail (56dp, rounded)
  - Horse name (Headline)
  - Breed + coat color (Body, muted)
  - Distance: "3.2 км" (Caption, orange)
  - Owner avatar (small, overlapping)
- Empty state: compass illustration + "Ойролцоо морь алга" (No nearby horses)
- "Газрын зурагт харах" (View on Map) button at bottom

Style: map + list hybrid, warm background, orange distance badges, clean cards, system font

Optimize for mobile, real-time location updates, radius filter requery, skeleton loading
