<template>
  <div
    class="image-overlay"
    :style="overlayStyle"
    @click="handleClick"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    role="button"
    tabindex="0"
    :aria-label="`Image ${image.imageIndex + 1} - Click to view full size`"
    @keydown.enter="handleClick"
    @keydown.space="handleClick"
  >
    <!-- Semi-transparent border indicator -->
    <div class="overlay-border"></div>

    <!-- Tooltip showing OCR text on hover -->
    <div
      v-if="showTooltip && image.extractedText"
      class="image-tooltip"
      role="tooltip"
    >
      <div class="tooltip-header">
        <span class="tooltip-title">Extracted Text</span>
        <span v-if="image.textConfidence" class="tooltip-confidence">
          {{ Math.round(image.textConfidence * 100) }}% confidence
        </span>
      </div>
      <div class="tooltip-text">{{ image.extractedText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    required: true,
    validator: (image) => {
      return image && image.id && image.position
    }
  },
  canvasWidth: {
    type: Number,
    required: true
  },
  canvasHeight: {
    type: Number,
    required: true
  },
  pdfScale: {
    type: Number,
    default: 1.5
  }
})

const emit = defineEmits(['click'])

const showTooltip = ref(false)

/**
 * Calculate overlay position and size based on PDF coordinates
 * Position from DB is in PDF coordinates, we need to convert to canvas pixels
 */
const overlayStyle = computed(() => {
  let position
  try {
    position = typeof props.image.position === 'string'
      ? JSON.parse(props.image.position)
      : props.image.position
  } catch (e) {
    console.error('Error parsing image position:', e)
    return {}
  }

  if (!position || !position.x || !position.y || !position.width || !position.height) {
    return {}
  }

  // Convert PDF coordinates to canvas pixels
  // The position is in PDF points, we need to scale it to match the canvas
  const scale = props.pdfScale

  const left = position.x * scale
  const top = position.y * scale
  const width = position.width * scale
  const height = position.height * scale

  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    cursor: 'pointer',
    zIndex: 10
  }
})

function handleClick(event) {
  event.preventDefault()
  emit('click', props.image)
}
</script>

<style scoped>
.image-overlay {
  position: absolute;
  transition: all 0.2s ease;
}

.image-overlay:hover {
  transform: scale(1.02);
  z-index: 20 !important;
}

.image-overlay:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.overlay-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid rgba(59, 130, 246, 0.4);
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  pointer-events: none;
}

.image-overlay:hover .overlay-border {
  border-color: rgba(59, 130, 246, 0.8);
  background-color: rgba(59, 130, 246, 0.2);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.image-tooltip {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-width: 300px;
  min-width: 200px;
  z-index: 1000;
  pointer-events: none;
  animation: tooltipFadeIn 0.2s ease;
}

/* Arrow pointing down */
.image-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.9);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.tooltip-title {
  font-weight: 600;
  font-size: 0.875rem;
}

.tooltip-confidence {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.tooltip-text {
  font-size: 0.875rem;
  line-height: 1.5;
  max-height: 150px;
  overflow-y: auto;
  word-wrap: break-word;
}

/* Scrollbar styling for tooltip text */
.tooltip-text::-webkit-scrollbar {
  width: 4px;
}

.tooltip-text::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.tooltip-text::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.tooltip-text::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .image-overlay,
  .overlay-border,
  .image-tooltip {
    transition: none;
    animation: none;
  }

  .image-overlay:hover {
    transform: none;
  }

  @keyframes tooltipFadeIn {
    from, to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .overlay-border {
    border-color: rgba(59, 130, 246, 1);
    border-width: 3px;
  }

  .image-overlay:hover .overlay-border {
    background-color: rgba(59, 130, 246, 0.3);
  }

  .image-tooltip {
    background-color: black;
    border: 2px solid white;
  }

  .image-tooltip::after {
    border-top-color: white;
  }
}

/* Ensure tooltip stays on screen */
.image-tooltip {
  max-width: min(300px, 90vw);
}

/* If overlay is near top of screen, show tooltip below instead */
.image-overlay[data-position="bottom"] .image-tooltip {
  bottom: auto;
  top: calc(100% + 12px);
}

.image-overlay[data-position="bottom"] .image-tooltip::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: rgba(0, 0, 0, 0.9);
}
</style>
