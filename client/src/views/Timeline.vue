<template>
  <div class="timeline-page">
    <header class="timeline-header">
      <h1>Activity Timeline</h1>
      <div class="filters">
        <select v-model="filters.eventType" @change="loadEvents">
          <option value="">All Events</option>
          <option value="document_upload">Document Uploads</option>
          <option value="maintenance_log">Maintenance</option>
          <option value="warranty_claim">Warranty</option>
        </select>
      </div>
    </header>

    <!-- Skeleton Loading -->
    <div v-if="loading && events.length === 0" class="loading-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-event">
        <div class="skeleton-icon"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>
    </div>

    <div v-else class="timeline-container">
      <div v-for="(group, date) in groupedEvents" :key="date" class="timeline-group">
        <div class="date-marker">{{ date }}</div>

        <div v-for="event in group" :key="event.id" class="timeline-event">
          <div class="event-icon" :class="`icon-${event.event_type}`">
            <i :class="getEventIcon(event.event_type)"></i>
          </div>

          <div class="event-content">
            <div class="event-header">
              <h3>{{ event.event_title }}</h3>
              <span class="event-time">{{ formatTime(event.created_at) }}</span>
            </div>

            <p class="event-description">{{ event.event_description }}</p>

            <div class="event-meta">
              <span class="event-user">{{ event.user.name }}</span>
            </div>

            <a
              v-if="event.reference_id"
              :href="`/${event.reference_type}/${event.reference_id}`"
              class="event-link"
            >
              View {{ event.reference_type }} →
            </a>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <button @click="loadMore" :disabled="loading">
          {{ loading ? 'Loading...' : 'Load More' }}
        </button>
      </div>

      <!-- Enhanced Empty State -->
      <div v-if="events.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>No activity yet</h2>
        <p>Upload your first document to see activity here!</p>
        <router-link to="/" class="btn-primary">
          Upload Document
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const events = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const offset = ref(0);

const filters = ref({
  eventType: ''
});

// Group events by date
const groupedEvents = computed(() => {
  const groups = {};

  events.value.forEach(event => {
    const date = new Date(event.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey;
    if (isSameDay(date, today)) {
      groupKey = 'Today';
    } else if (isSameDay(date, yesterday)) {
      groupKey = 'Yesterday';
    } else if (isWithinDays(date, 7)) {
      groupKey = date.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (isWithinDays(date, 30)) {
      groupKey = 'This Month';
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(event);
  });

  return groups;
});

async function loadEvents() {
  loading.value = true;

  try {
    const token = localStorage.getItem('token');
    const orgId = localStorage.getItem('organizationId');

    const params = {
      limit: 50,
      offset: offset.value,
      ...filters.value
    };

    const response = await axios.get(
      `http://localhost:8001/api/organizations/${orgId}/timeline`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params
      }
    );

    if (offset.value === 0) {
      events.value = response.data.events;
    } else {
      events.value.push(...response.data.events);
    }

    hasMore.value = response.data.pagination.hasMore;
  } catch (error) {
    console.error('Failed to load timeline:', error);
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  offset.value += 50;
  loadEvents();
}

function getEventIcon(eventType) {
  const icons = {
    document_upload: '📄',
    maintenance_log: '🔧',
    warranty_claim: '⚠️',
    settings_change: '⚙️'
  };
  return icons[eventType] || '📋';
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function isSameDay(d1, d2) {
  return d1.toDateString() === d2.toDateString();
}

function isWithinDays(date, days) {
  const diff = Date.now() - date.getTime();
  return diff < days * 24 * 60 * 60 * 1000;
}

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.timeline-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.timeline-header h1 {
  font-size: 2rem;
  font-weight: 600;
}

.filters select {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
}

.timeline-container {
  max-width: 800px;
  margin: 0 auto;
}

.date-marker {
  font-size: 0.875rem;
  font-weight: 600;
  color: #525252;
  margin: 2rem 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-event {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.timeline-event:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.event-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.25rem;
  background: #f5f5f5;
}

.icon-document_upload { background: #e3f2fd; }
.icon-maintenance_log { background: #e8f5e9; }
.icon-warranty_claim { background: #fff3e0; }

.event-content {
  flex: 1;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.5rem;
}

.event-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.event-time {
  font-size: 0.875rem;
  color: #757575;
}

.event-description {
  color: #424242;
  margin-bottom: 0.75rem;
}

.event-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #757575;
}

.event-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #1976d2;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
}

.event-link:hover {
  text-decoration: underline;
}

.load-more {
  text-align: center;
  margin-top: 2rem;
}

.load-more button {
  padding: 0.75rem 2rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.load-more button:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
}

/* Skeleton Loading */
.loading-skeleton {
  max-width: 800px;
  margin: 0 auto;
}

.skeleton-event {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

.skeleton-title {
  height: 20px;
  width: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.skeleton-text {
  height: 14px;
  width: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-text.short {
  width: 40%;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Enhanced Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #424242;
}

.empty-state p {
  color: #757575;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #1976d2;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1565c0;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .timeline-page {
    padding: 1rem;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .timeline-header h1 {
    font-size: 1.5rem;
  }

  .filters {
    width: 100%;
  }

  .filters select {
    width: 100%;
  }

  .timeline-event {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .event-icon {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .event-header {
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-start;
  }

  .skeleton-event {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .skeleton-title {
    width: 80%;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 3rem;
  }

  .empty-state h2 {
    font-size: 1.25rem;
  }
}
</style>
