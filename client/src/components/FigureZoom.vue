<template>
  <div
    v-if="isOpen"
    class="figure-zoom-lightbox"
    role="dialog"
    aria-modal="true"
    aria-label="Figure viewer with zoom controls"
    @keydown="handleKeydown"
  >
    <div class="lightbox-overlay" @click="$emit('close')"></div>

    <div class="lightbox-content">
      <img
        ref="imageRef"
        :src="imageSrc"
        :alt="imageAlt"
        class="zoom-image"
        :style="imageStyle"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      />

      <div class="zoom-controls">
        <button
          class="zoom-btn zoom-in"
          :disabled="scale >= MAX_SCALE"
          aria-label="Zoom in"
          title="Zoom in (+)"
          @click="zoomIn"
        >
          <span aria-hidden="true">+</span>
        </button>
        <button
          class="zoom-btn zoom-out"
          :disabled="scale <= MIN_SCALE"
          aria-label="Zoom out"
          title="Zoom out (-)"
          @click="zoomOut"
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          class="zoom-btn zoom-reset"
          aria-label="Reset zoom"
          title="Reset zoom (0)"
          @click="reset"
        >
          <span aria-hidden="true">⟲</span>
        </button>
        <span class="zoom-level" aria-live="polite">{{ zoomPercentage }}%</span>
      </div>

      <button
        class="close-btn"
        aria-label="Close viewer"
        title="Close (Esc)"
        @click="$emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

/**
 * FRANK-AI Figure Zoom Component (Vue 3)
 * Provides pan/zoom functionality for figure lightbox
 * Supports mouse wheel, drag, touch pinch, and keyboard controls
 */

// Props
const props = defineProps({
  imageSrc: {
    type: String,
    required: true
  },
  imageAlt: {
    type: String,
    default: 'Zoomed figure'
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close']);

// Constants
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.3;

// Reactive state
const imageRef = ref(null);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const isPinching = ref(false);
const initialPinchDistance = ref(0);
const lastTouchX = ref(0);
const lastTouchY = ref(0);

// Check for reduced motion preference
const reducedMotion = ref(
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
);

// Computed properties
const zoomPercentage = computed(() => Math.round(scale.value * 100));

const imageStyle = computed(() => {
  // Use spring easing for premium feel (respects prefers-reduced-motion)
  const easing = reducedMotion.value
    ? 'ease-out'
    : 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const duration = reducedMotion.value ? '0.15s' : '0.3s';

  return {
    transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
    transition: `transform ${duration} ${easing}`,
    cursor: scale.value > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default'
  };
});

/**
 * Reset zoom state
 */
function reset() {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  isDragging.value = false;
}

/**
 * Zoom in
 */
function zoomIn() {
  setZoom(scale.value + ZOOM_STEP);
}

/**
 * Zoom out
 */
function zoomOut() {
  setZoom(scale.value - ZOOM_STEP);
}

/**
 * Set zoom level
 */
function setZoom(newScale) {
  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  // Reset position when zooming out to min scale
  if (scale.value === MIN_SCALE) {
    translateX.value = 0;
    translateY.value = 0;
  }
}

/**
 * Handle mouse wheel zoom
 */
function handleWheel(e) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  setZoom(scale.value + delta);
}

/**
 * Handle mouse drag start
 */
function handleMouseDown(e) {
  if (scale.value <= 1) return;

  isDragging.value = true;
  startX.value = e.clientX - translateX.value;
  startY.value = e.clientY - translateY.value;
  e.preventDefault();
}

/**
 * Handle mouse drag move
 */
function handleMouseMove(e) {
  if (!isDragging.value || scale.value <= 1) return;

  translateX.value = e.clientX - startX.value;
  translateY.value = e.clientY - startY.value;
}

/**
 * Handle mouse drag end
 */
function handleMouseUp() {
  if (isDragging.value) {
    isDragging.value = false;
  }
}

/**
 * Handle touch start (pan and pinch)
 */
function handleTouchStart(e) {
  if (e.touches.length === 2) {
    // Pinch zoom start
    isPinching.value = true;
    initialPinchDistance.value = getTouchDistance(e.touches);
    e.preventDefault();
  } else if (e.touches.length === 1 && scale.value > 1) {
    // Pan start
    lastTouchX.value = e.touches[0].clientX - translateX.value;
    lastTouchY.value = e.touches[0].clientY - translateY.value;
  }
}

/**
 * Handle touch move (pan and pinch)
 */
function handleTouchMove(e) {
  if (e.touches.length === 2 && isPinching.value) {
    // Pinch zoom
    const currentDistance = getTouchDistance(e.touches);
    const scaleChange = currentDistance / initialPinchDistance.value;
    setZoom(scale.value * scaleChange);
    initialPinchDistance.value = currentDistance;
    e.preventDefault();
  } else if (e.touches.length === 1 && scale.value > 1) {
    // Pan
    translateX.value = e.touches[0].clientX - lastTouchX.value;
    translateY.value = e.touches[0].clientY - lastTouchY.value;
    e.preventDefault();
  }
}

/**
 * Handle touch end
 */
function handleTouchEnd() {
  isPinching.value = false;
}

/**
 * Get distance between two touch points
 */
function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeydown(e) {
  switch (e.key) {
    case '+':
    case '=':
      zoomIn();
      e.preventDefault();
      break;
    case '-':
    case '_':
      zoomOut();
      e.preventDefault();
      break;
    case '0':
      reset();
      e.preventDefault();
      break;
    case 'Escape':
      emit('close');
      e.preventDefault();
      break;
  }
}

// Watch for isOpen changes to reset zoom
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    reset();
  }
});

// Lifecycle hooks
onMounted(() => {
  // Bind global mouse events for drag
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Update reduced motion preference if it changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = (e) => {
      reducedMotion.value = e.matches;
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMotionPreference);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(updateMotionPreference);
    }
  }
});

onUnmounted(() => {
  // Cleanup global event listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = (e) => {
      reducedMotion.value = e.matches;
    };

    // Modern browsers
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', updateMotionPreference);
    } else {
      // Fallback for older browsers
      mediaQuery.removeListener(updateMotionPreference);
    }
  }
});
</script>

<style scoped>
.figure-zoom-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(4px);
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  transform-origin: center center;
}

.zoom-controls {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.zoom-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.zoom-btn:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.zoom-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.zoom-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.zoom-btn:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

.zoom-level {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 3rem;
  text-align: center;
  padding: 0 0.5rem;
}

.close-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 3rem;
  height: 3rem;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  color: white;
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.close-btn:active {
  transform: scale(0.95);
}

.close-btn:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .zoom-image,
  .zoom-btn,
  .close-btn {
    transition-duration: 0.1s;
  }

  .zoom-btn:hover:not(:disabled),
  .close-btn:hover {
    transform: none;
  }

  .zoom-btn:active:not(:disabled),
  .close-btn:active {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .zoom-controls {
    background-color: black;
    border: 2px solid white;
  }

  .zoom-btn {
    background-color: black;
    border: 1px solid white;
  }

  .close-btn {
    background-color: black;
    border: 2px solid white;
  }
}
</style>
