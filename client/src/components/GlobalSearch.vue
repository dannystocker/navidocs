<template>
  <div class="global-search">
    <!-- Search Input -->
    <div class="search-container">
      <div class="search-input-wrapper">
        <i aria-hidden="true" class="material-icons">search</i>
        <input
          v-model="query"
          type="text"
          placeholder="Search inventory, maintenance, cameras, contacts, expenses..."
          class="search-input"
          @keyup.enter="performSearch"
          @input="handleInputChange"
          @focus="showResults = true"
          @blur="delayedHide"
        />
        <button
          v-if="query"
          class="clear-btn"
          aria-label="Clear search"
          @click="clearSearch"
        >
          <i aria-hidden="true" class="material-icons">close</i>
        </button>
      </div>

      <!-- Module Filter -->
      <select
        v-model="selectedModule"
        class="module-filter"
        @change="performSearch"
      >
        <option value="">All Modules</option>
        <option value="inventory_items">Inventory</option>
        <option value="maintenance_records">Maintenance</option>
        <option value="camera_feeds">Cameras</option>
        <option value="contacts">Contacts</option>
        <option value="expenses">Expenses</option>
      </select>
    </div>

    <!-- Search Results Dropdown -->
    <transition name="fade">
      <div
        v-if="showResults && (query || loading)"
        class="search-results-dropdown"
      >
        <!-- Loading State -->
        <div v-if="loading" class="search-state">
          <div class="loader"></div>
          <p>Searching...</p>
        </div>

        <!-- No Query -->
        <div v-else-if="!query" class="search-state">
          <p>Start typing to search</p>
        </div>

        <!-- Results Groups -->
        <template v-else-if="Object.keys(results).length > 0">
          <!-- Inventory Results -->
          <div
            v-if="results.inventory_items && results.inventory_items.hits.length > 0"
            class="result-group"
          >
            <h4 class="module-header">
              <i class="material-icons">storage</i> Inventory
            </h4>
            <div
              v-for="item in results.inventory_items.hits.slice(0, 3)"
              :key="`inv-${item.id}`"
              class="result-item"
              @click="navigateToItem('inventory', item)"
            >
              <div class="result-title">{{ item.name }}</div>
              <div class="result-meta">
                <span class="category">{{ item.category }}</span>
                <span class="value">${{ item.current_value }}</span>
              </div>
            </div>
            <div
              v-if="results.inventory_items.totalHits > 3"
              class="show-more"
              @click="viewAllResults('inventory_items')"
            >
              Show all {{ results.inventory_items.totalHits }} results
            </div>
          </div>

          <!-- Maintenance Results -->
          <div
            v-if="results.maintenance_records && results.maintenance_records.hits.length > 0"
            class="result-group"
          >
            <h4 class="module-header">
              <i class="material-icons">build</i> Maintenance
            </h4>
            <div
              v-for="record in results.maintenance_records.hits.slice(0, 3)"
              :key="`main-${record.id}`"
              class="result-item"
              @click="navigateToItem('maintenance', record)"
            >
              <div class="result-title">{{ record.service_type }}</div>
              <div class="result-meta">
                <span class="provider">{{ record.provider }}</span>
                <span class="date">{{ formatDate(record.date) }}</span>
              </div>
            </div>
            <div
              v-if="results.maintenance_records.totalHits > 3"
              class="show-more"
              @click="viewAllResults('maintenance_records')"
            >
              Show all {{ results.maintenance_records.totalHits }} results
            </div>
          </div>

          <!-- Camera Results -->
          <div
            v-if="results.camera_feeds && results.camera_feeds.hits.length > 0"
            class="result-group"
          >
            <h4 class="module-header">
              <i class="material-icons">videocam</i> Cameras
            </h4>
            <div
              v-for="camera in results.camera_feeds.hits.slice(0, 3)"
              :key="`cam-${camera.id}`"
              class="result-item"
              @click="navigateToItem('camera', camera)"
            >
              <div class="result-title">{{ camera.camera_name }}</div>
              <div class="result-meta">
                <span class="status">Active</span>
              </div>
            </div>
            <div
              v-if="results.camera_feeds.totalHits > 3"
              class="show-more"
              @click="viewAllResults('camera_feeds')"
            >
              Show all {{ results.camera_feeds.totalHits }} results
            </div>
          </div>

          <!-- Contacts Results -->
          <div
            v-if="results.contacts && results.contacts.hits.length > 0"
            class="result-group"
          >
            <h4 class="module-header">
              <i class="material-icons">person</i> Contacts
            </h4>
            <div
              v-for="contact in results.contacts.hits.slice(0, 3)"
              :key="`contact-${contact.id}`"
              class="result-item"
              @click="navigateToItem('contact', contact)"
            >
              <div class="result-title">{{ contact.name }}</div>
              <div class="result-meta">
                <span class="type">{{ contact.type }}</span>
                <span class="email" v-if="contact.email">{{ contact.email }}</span>
              </div>
            </div>
            <div
              v-if="results.contacts.totalHits > 3"
              class="show-more"
              @click="viewAllResults('contacts')"
            >
              Show all {{ results.contacts.totalHits }} results
            </div>
          </div>

          <!-- Expenses Results -->
          <div
            v-if="results.expenses && results.expenses.hits.length > 0"
            class="result-group"
          >
            <h4 class="module-header">
              <i class="material-icons">receipt</i> Expenses
            </h4>
            <div
              v-for="expense in results.expenses.hits.slice(0, 3)"
              :key="`exp-${expense.id}`"
              class="result-item"
              @click="navigateToItem('expense', expense)"
            >
              <div class="result-title">{{ expense.category }}</div>
              <div class="result-meta">
                <span class="amount">${{ expense.amount }} {{ expense.currency }}</span>
                <span class="date">{{ formatDate(expense.date) }}</span>
              </div>
            </div>
            <div
              v-if="results.expenses.totalHits > 3"
              class="show-more"
              @click="viewAllResults('expenses')"
            >
              Show all {{ results.expenses.totalHits }} results
            </div>
          </div>
        </template>

        <!-- No Results -->
        <div v-else class="search-state empty">
          <p>No results found for "{{ query }}"</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'GlobalSearch',
  setup() {
    const router = useRouter();
    const query = ref('');
    const selectedModule = ref('');
    const showResults = ref(false);
    const loading = ref(false);
    const results = reactive({});
    let searchTimeout = null;
    let hideTimeout = null;

    const handleInputChange = () => {
      clearTimeout(searchTimeout);
      loading.value = true;

      searchTimeout = setTimeout(() => {
        if (query.value.length > 0) {
          performSearch();
        } else {
          loading.value = false;
          Object.keys(results).forEach(key => delete results[key]);
        }
      }, 300); // Debounce search
    };

    const performSearch = async () => {
      if (!query.value.trim()) {
        loading.value = false;
        return;
      }

      loading.value = true;

      try {
        const params = new URLSearchParams({
          q: query.value,
          limit: 5,
          offset: 0
        });

        if (selectedModule.value) {
          params.append('module', selectedModule.value);
        }

        const response = await fetch(`/api/search/query?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();

        // Clear previous results
        Object.keys(results).forEach(key => delete results[key]);

        // Populate new results
        if (data.results && data.results.modules) {
          Object.assign(results, data.results.modules);
        }
      } catch (error) {
        console.error('Search error:', error);
        // Show error message to user
      } finally {
        loading.value = false;
      }
    };

    const clearSearch = () => {
      query.value = '';
      selectedModule.value = '';
      showResults.value = false;
      Object.keys(results).forEach(key => delete results[key]);
    };

    const navigateToItem = (type, item) => {
      showResults.value = false;

      switch (type) {
        case 'inventory':
          router.push(`/inventory/${item.boat_id}?itemId=${item.id}`);
          break;
        case 'maintenance':
          router.push(`/maintenance/${item.boat_id}?recordId=${item.id}`);
          break;
        case 'camera':
          router.push(`/cameras/${item.boat_id}?cameraId=${item.id}`);
          break;
        case 'contact':
          router.push(`/contacts?contactId=${item.id}`);
          break;
        case 'expense':
          router.push(`/expenses/${item.boat_id}?expenseId=${item.id}`);
          break;
      }
    };

    const viewAllResults = (module) => {
      router.push({
        name: 'SearchResults',
        query: {
          q: query.value,
          module: selectedModule.value || module
        }
      });
      showResults.value = false;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    };

    const delayedHide = () => {
      hideTimeout = setTimeout(() => {
        showResults.value = false;
      }, 200);
    };

    return {
      query,
      selectedModule,
      showResults,
      loading,
      results,
      handleInputChange,
      performSearch,
      clearSearch,
      navigateToItem,
      viewAllResults,
      formatDate,
      delayedHide
    };
  }
};
</script>

<style scoped>
.global-search {
  width: 100%;
  position: relative;
}

.search-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
}

.search-input-wrapper i {
  color: #999;
  margin-right: 8px;
  font-size: 20px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: transparent;
}

.search-input::placeholder {
  color: #ccc;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn i {
  font-size: 18px;
  color: #999;
}

.clear-btn:hover i {
  color: #333;
}

.module-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 500px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-state {
  padding: 24px;
  text-align: center;
  color: #999;
}

.search-state.empty {
  color: #666;
}

.loader {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.result-group {
  border-bottom: 1px solid #eee;
  padding: 12px 0;
}

.result-group:last-child {
  border-bottom: none;
}

.module-header {
  padding: 8px 16px;
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-header i {
  font-size: 16px;
}

.result-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f9f9f9;
}

.result-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.category,
.provider,
.type,
.status {
  display: inline-block;
  padding: 2px 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
}

.value,
.date,
.amount,
.email {
  color: #666;
}

.show-more {
  padding: 8px 16px;
  text-align: center;
  font-size: 12px;
  color: #3498db;
  cursor: pointer;
  font-weight: 500;
  border-top: 1px solid #eee;
  transition: background-color 0.2s;
}

.show-more:hover {
  background-color: #f9f9f9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .search-container {
    flex-direction: column;
  }

  .search-results-dropdown {
    max-height: 400px;
  }

  .result-meta {
    flex-wrap: wrap;
  }
}
</style>
