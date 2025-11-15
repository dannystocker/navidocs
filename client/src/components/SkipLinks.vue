<template>
  <div class="skip-links" aria-label="Skip navigation links">
    <a href="#main-content" class="skip-link">
      Skip to main content
    </a>
    <a href="#search-input" class="skip-link">
      Skip to search
    </a>
    <a href="#navigation" class="skip-link">
      Skip to navigation
    </a>
  </div>
</template>

<script setup>
// SkipLinks component
// Provides keyboard-accessible skip navigation for screen readers
// Links are hidden until focused via Tab key
</script>

<style scoped>
.skip-links {
  position: relative;
  z-index: 10000;
}

.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: rgb(236, 72, 153);
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  transition: top 0.2s ease;
  z-index: 10001;
}

.skip-link:focus {
  top: 0;
  outline: 3px solid white;
  outline-offset: 2px;
}

.skip-link:hover {
  background: rgb(219, 39, 119);
}

/* Ensure skip links are above all other content */
.skip-link:focus {
  position: fixed;
  top: 0;
  left: 0;
}
</style>
