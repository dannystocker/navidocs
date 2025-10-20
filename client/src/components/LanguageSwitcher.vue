<template>
  <div class="language-switcher">
    <button
      @click="toggleDropdown"
      class="language-button"
      :title="$t('language.select')"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
      <span class="language-code">{{ currentLocale.toUpperCase() }}</span>
      <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <transition name="dropdown">
      <div v-if="isOpen" class="language-dropdown">
        <button
          v-for="locale in availableLocales"
          :key="locale"
          @click="changeLocale(locale)"
          class="language-option"
          :class="{ active: currentLocale === locale }"
        >
          <span class="language-flag">{{ getFlag(locale) }}</span>
          <span class="language-name">{{ $t(`language.${locale}`) }}</span>
          <svg v-if="currentLocale === locale" class="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'

const { locale } = useI18n()

const isOpen = ref(false)
const availableLocales = ['en', 'fr']

const currentLocale = computed(() => locale.value)

const flags = {
  en: '🇬🇧',
  fr: '🇫🇷'
}

function getFlag(locale) {
  return flags[locale] || '🌐'
}

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function changeLocale(newLocale) {
  setLocale(newLocale)
  isOpen.value = false
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const switcher = event.target.closest('.language-switcher')
  if (!switcher && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 92, 178, 0.5);
}

.language-code {
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 12rem;
  background: rgba(30, 30, 50, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 1000;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.language-option.active {
  background: rgba(255, 92, 178, 0.1);
  color: #ff5cb2;
}

.language-flag {
  font-size: 1.25rem;
}

.language-name {
  flex: 1;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
