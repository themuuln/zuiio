<template>
  <div class="tutorial-step">
    <div class="step-badge">
      <span class="step-number">{{ step }}</span>
      <span class="step-title" v-if="title">{{ title }}</span>
    </div>
    <div class="step-image-wrapper">
      <img :src="resolvedImage" :alt="title || `Step ${step}`" class="step-image" />
      <div
        v-for="marker in markers"
        :key="marker.id"
        class="step-marker"
        :style="{
          left: marker.x + '%',
          top: marker.y + '%',
          '--marker-color': marker.color || '#3b82f6',
        }"
      >
        <span class="marker-dot">{{ marker.label || marker.id }}</span>
        <svg
          v-if="marker.arrow"
          class="marker-arrow"
          :style="{ transform: `rotate(${marker.arrow}deg)` }"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
    <p v-if="$slots.default" class="step-description">
      <slot />
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  step: { type: [Number, String], required: true },
  title: { type: String, default: "" },
  image: { type: String, required: true },
  markers: {
    type: Array,
    default: () => [],
    // Each marker: { id, x (percent), y (percent), label?, color?, arrow? (degrees) }
  },
});

// VitePress base path (e.g. "/guide/") — prepend to image paths from public/
const baseUrl = import.meta.env.BASE_URL || "/";
const resolvedImage = computed(() => {
  const img = props.image;
  // If image already starts with http or the base path, use as-is
  if (img.startsWith("http") || img.startsWith(baseUrl)) return img;
  // Otherwise prepend the base path
  return baseUrl + img.replace(/^\//, "");
});
</script>

<style scoped>
.tutorial-step {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
}

.step-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.step-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.step-image-wrapper {
  position: relative;
  line-height: 0;
}

.step-image {
  width: 100%;
  display: block;
}

.step-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.marker-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--marker-color);
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: marker-pulse 2s ease-in-out infinite;
}

.marker-arrow {
  position: absolute;
  width: 20px;
  height: 20px;
  color: var(--marker-color);
  top: 100%;
  left: 50%;
  transform-origin: center;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
}

.step-description {
  padding: 0.75rem 1rem;
  margin: 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  border-top: 1px solid var(--vp-c-divider);
  line-height: 1.6;
}

@keyframes marker-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
  50% { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.3); }
}
</style>
