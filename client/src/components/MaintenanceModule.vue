<template>
  <div class="maintenance-module bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-4xl font-bold text-white mb-2">Maintenance Log</h1>
          <p class="text-white/60">Track service history and upcoming maintenance</p>
        </div>
        <button
          @click="showAddForm = true"
          class="btn btn-primary flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Service Record
        </button>
      </div>

      <!-- Boat Selector -->
      <div class="mb-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
        <label class="block text-sm font-medium text-white/70 mb-2">Select Boat</label>
        <select
          v-model="selectedBoatId"
          @change="loadMaintenanceData"
          class="w-full md:w-48 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
        >
          <option value="">All Boats</option>
          <option v-for="boat in boats" :key="boat.id" :value="boat.id">
            {{ boat.name || `Boat ${boat.id}` }}
          </option>
        </select>
      </div>

      <!-- Filter and View Toggle -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="flex-1">
          <input
            v-model="serviceTypeFilter"
            placeholder="Filter by service type..."
            class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
          />
        </div>
        <div class="flex gap-2">
          <button
            @click="viewMode = 'calendar'"
            :class="['px-4 py-2 rounded-lg transition-all', viewMode === 'calendar' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20']"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            @click="viewMode = 'list'"
            :class="['px-4 py-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20']"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Upcoming Maintenance Alert -->
      <div v-if="upcomingAlert.urgent > 0 || upcomingAlert.warning > 0" class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-if="upcomingAlert.urgent > 0" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-red-400 font-semibold">{{ upcomingAlert.urgent }} Urgent</p>
              <p class="text-red-300 text-sm">Services due within 7 days</p>
            </div>
          </div>
        </div>
        <div v-if="upcomingAlert.warning > 0" class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p class="text-yellow-400 font-semibold">{{ upcomingAlert.warning }} Warning</p>
              <p class="text-yellow-300 text-sm">Services due within 30 days</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Calendar View -->
      <div v-if="viewMode === 'calendar'" class="mb-8">
        <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Maintenance Calendar</h2>
          <div class="grid grid-cols-7 gap-2 mb-4">
            <div v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day" class="text-center text-white/60 font-medium text-sm">
              {{ day }}
            </div>
          </div>
          <div class="grid grid-cols-7 gap-2">
            <div
              v-for="date in calendarDays"
              :key="date.toString()"
              :class="[
                'aspect-square p-2 rounded-lg border transition-all cursor-pointer',
                getDateClass(date)
              ]"
              @click="selectedDate = date"
            >
              <div class="text-sm font-medium text-white">{{ date.getDate() }}</div>
              <div class="text-xs text-white/60">
                {{ getMaintenanceCountForDate(date) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar Day Details -->
        <div v-if="selectedDate" class="mt-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h3 class="text-lg font-semibold text-white mb-4">
            {{ selectedDate.toLocaleDateString() }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="record in getMaintenanceForDate(selectedDate)"
              :key="record.id"
              class="bg-white/5 border border-white/20 rounded-lg p-4 hover:border-pink-400/50 transition-all"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-white">{{ record.service_type }}</p>
                  <p class="text-sm text-white/60">{{ record.provider || 'No provider' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-pink-400 font-medium" v-if="record.cost">
                    {{ currencyFormat(record.cost) }}
                  </p>
                </div>
              </div>
            </div>
            <p v-if="getMaintenanceForDate(selectedDate).length === 0" class="text-white/60 text-center py-4">
              No maintenance on this date
            </p>
          </div>
        </div>
      </div>

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="space-y-4">
        <!-- Upcoming Maintenance Section -->
        <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Upcoming Maintenance</h2>
          <div class="space-y-3">
            <div
              v-for="record in upcomingMaintenance"
              :key="record.id"
              :class="[
                'p-4 rounded-lg border transition-all cursor-pointer hover:border-pink-400/50',
                record.urgency === 'urgent' ? 'bg-red-500/10 border-red-500/30' :
                record.urgency === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-white/5 border-white/20'
              ]"
              @click="selectRecord(record)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="font-semibold text-white">{{ record.service_type }}</p>
                  <p class="text-sm text-white/60 mt-1">{{ record.provider || 'No provider specified' }}</p>
                  <p class="text-sm text-white/50 mt-1">Scheduled: {{ formatDate(record.date) }}</p>
                </div>
                <div class="text-right">
                  <p class="text-lg font-semibold" :class="getUrgencyColor(record.urgency)">
                    {{ record.days_until_due }} days
                  </p>
                  <p class="text-pink-400 font-medium" v-if="record.cost">
                    {{ currencyFormat(record.cost) }}
                  </p>
                  <p class="text-xs text-white/50 mt-2">{{ record.urgency }}</p>
                </div>
              </div>
            </div>
            <p v-if="upcomingMaintenance.length === 0" class="text-white/60 text-center py-8">
              No upcoming maintenance scheduled
            </p>
          </div>
        </div>

        <!-- Service History Section -->
        <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-white mb-4">Service History</h2>
          <div class="space-y-3">
            <div
              v-for="record in filteredServiceHistory"
              :key="record.id"
              class="p-4 rounded-lg border border-white/20 bg-white/5 hover:border-pink-400/50 transition-all cursor-pointer"
              @click="selectRecord(record)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <p class="font-semibold text-white">{{ record.service_type }}</p>
                  <p class="text-sm text-white/60 mt-1">{{ record.provider || 'No provider specified' }}</p>
                  <p class="text-sm text-white/50 mt-1">Completed: {{ formatDate(record.date) }}</p>
                  <p v-if="record.notes" class="text-sm text-white/50 mt-2">{{ record.notes }}</p>
                </div>
                <div class="text-right">
                  <p class="text-pink-400 font-medium" v-if="record.cost">
                    {{ currencyFormat(record.cost) }}
                  </p>
                  <p class="text-xs text-white/50 mt-2">
                    {{ formatDate(record.created_at) }}
                  </p>
                </div>
              </div>
            </div>
            <p v-if="filteredServiceHistory.length === 0" class="text-white/60 text-center py-8">
              No service history
            </p>
          </div>
        </div>
      </div>

      <!-- Add/Edit Form Modal -->
      <Transition name="modal">
        <div v-if="showAddForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <!-- Form Header -->
            <div class="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold text-white">
                {{ editingRecord ? 'Edit Service Record' : 'Add New Service Record' }}
              </h2>
              <button
                @click="closeForm"
                class="text-white/70 hover:text-pink-400 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Form Content -->
            <div class="p-6 space-y-4">
              <!-- Boat Selection -->
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Boat *</label>
                <select
                  v-model.number="formData.boatId"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
                >
                  <option value="">Select a boat</option>
                  <option v-for="boat in boats" :key="boat.id" :value="boat.id">
                    {{ boat.name || `Boat ${boat.id}` }}
                  </option>
                </select>
              </div>

              <!-- Service Type -->
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Service Type *</label>
                <input
                  v-model="formData.service_type"
                  type="text"
                  placeholder="e.g., Engine Oil Change, Hull Inspection"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
                />
              </div>

              <!-- Service Date -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-white/70 mb-2">Service Date *</label>
                  <input
                    v-model="formData.date"
                    type="date"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/70 mb-2">Next Due Date</label>
                  <input
                    v-model="formData.next_due_date"
                    type="date"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <!-- Provider and Cost -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-white/70 mb-2">Service Provider</label>
                  <input
                    v-model="formData.provider"
                    type="text"
                    placeholder="e.g., Marina Services Inc."
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-white/70 mb-2">Cost</label>
                  <input
                    v-model.number="formData.cost"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-white/70 mb-2">Notes</label>
                <textarea
                  v-model="formData.notes"
                  placeholder="Add any additional details..."
                  rows="4"
                  class="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-pink-400 resize-none"
                ></textarea>
              </div>

              <!-- Error Message -->
              <div v-if="formError" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p class="text-red-400">{{ formError }}</p>
              </div>

              <!-- Form Actions -->
              <div class="flex gap-3 pt-4">
                <button
                  @click="closeForm"
                  class="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  @click="saveRecord"
                  :disabled="isSubmitting"
                  class="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Saving...' : editingRecord ? 'Update' : 'Save' }}
                </button>
                <button
                  v-if="editingRecord"
                  @click="deleteRecord"
                  :disabled="isSubmitting"
                  class="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Record Detail Modal -->
      <Transition name="modal">
        <div v-if="selectedRecord && !showAddForm" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-lg max-w-2xl w-full">
            <div class="bg-slate-900/95 backdrop-blur border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 class="text-2xl font-bold text-white">Service Details</h2>
              <button
                @click="selectedRecord = null"
                class="text-white/70 hover:text-pink-400 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-white/60 text-sm">Service Type</p>
                  <p class="text-white font-semibold">{{ selectedRecord.service_type }}</p>
                </div>
                <div>
                  <p class="text-white/60 text-sm">Provider</p>
                  <p class="text-white font-semibold">{{ selectedRecord.provider || 'Not specified' }}</p>
                </div>
                <div>
                  <p class="text-white/60 text-sm">Service Date</p>
                  <p class="text-white font-semibold">{{ formatDate(selectedRecord.date) }}</p>
                </div>
                <div>
                  <p class="text-white/60 text-sm">Next Due</p>
                  <p class="text-white font-semibold">{{ selectedRecord.next_due_date ? formatDate(selectedRecord.next_due_date) : 'Not scheduled' }}</p>
                </div>
                <div>
                  <p class="text-white/60 text-sm">Cost</p>
                  <p class="text-pink-400 font-semibold">{{ selectedRecord.cost ? currencyFormat(selectedRecord.cost) : 'Not specified' }}</p>
                </div>
                <div>
                  <p class="text-white/60 text-sm">Record Created</p>
                  <p class="text-white font-semibold">{{ formatDate(selectedRecord.created_at) }}</p>
                </div>
              </div>

              <div v-if="selectedRecord.notes" class="border-t border-white/10 pt-4">
                <p class="text-white/60 text-sm mb-2">Notes</p>
                <p class="text-white bg-white/5 p-3 rounded-lg">{{ selectedRecord.notes }}</p>
              </div>

              <div class="flex gap-3 pt-4">
                <button
                  @click="selectedRecord = null"
                  class="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                  Close
                </button>
                <button
                  @click="editSelectedRecord"
                  class="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-all"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'MaintenanceModule',
  setup() {
    // State
    const boats = ref([]);
    const selectedBoatId = ref('');
    const maintenanceRecords = ref([]);
    const upcomingMaintenanceList = ref([]);
    const showAddForm = ref(false);
    const editingRecord = ref(null);
    const selectedRecord = ref(null);
    const selectedDate = ref(null);
    const viewMode = ref('list');
    const serviceTypeFilter = ref('');
    const isSubmitting = ref(false);
    const formError = ref('');

    const formData = ref({
      boatId: '',
      service_type: '',
      date: '',
      provider: '',
      cost: null,
      next_due_date: '',
      notes: ''
    });

    // Computed
    const filteredServiceHistory = computed(() => {
      return maintenanceRecords.value.filter(record => {
        if (serviceTypeFilter.value && record.service_type !== serviceTypeFilter.value) {
          return false;
        }
        return true;
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const upcomingMaintenance = computed(() => {
      return upcomingMaintenanceList.value
        .filter(record => {
          if (serviceTypeFilter.value && record.service_type !== serviceTypeFilter.value) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.days_until_due - b.days_until_due);
    });

    const upcomingAlert = computed(() => {
      return {
        urgent: upcomingMaintenanceList.value.filter(r => r.urgency === 'urgent').length,
        warning: upcomingMaintenanceList.value.filter(r => r.urgency === 'warning').length
      };
    });

    const calendarDays = computed(() => {
      const days = [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      for (let i = 0; i < 42; i++) {
        days.push(new Date(startDate));
        startDate.setDate(startDate.getDate() + 1);
      }
      return days;
    });

    // Methods
    const loadBoats = async () => {
      // Mock data - in real app, fetch from API
      boats.value = [
        { id: 1, name: 'Sailboat Alpha' },
        { id: 2, name: 'Motor Yacht Beta' },
        { id: 3, name: 'Catamaran Gamma' }
      ];
    };

    const loadMaintenanceData = async () => {
      try {
        // Mock data - in real app, fetch from API
        if (selectedBoatId.value) {
          maintenanceRecords.value = [
            {
              id: 1,
              boat_id: selectedBoatId.value,
              service_type: 'Engine Oil Change',
              date: '2025-10-15',
              provider: 'Marina Services Inc.',
              cost: 150,
              next_due_date: '2026-04-15',
              notes: 'Regular maintenance performed',
              created_at: '2025-10-15T10:00:00Z'
            },
            {
              id: 2,
              boat_id: selectedBoatId.value,
              service_type: 'Hull Inspection',
              date: '2025-09-20',
              provider: 'Professional Inspectors LLC',
              cost: 300,
              next_due_date: '2026-09-20',
              notes: 'Minor cosmetic damage noted',
              created_at: '2025-09-20T14:30:00Z'
            }
          ];

          // Load upcoming maintenance
          upcomingMaintenanceList.value = [
            {
              id: 3,
              boat_id: selectedBoatId.value,
              service_type: 'Propeller Cleaning',
              date: '2025-11-20',
              provider: 'Harbor Maintenance',
              cost: 100,
              next_due_date: '2025-11-28',
              days_until_due: 14,
              urgency: 'warning',
              notes: 'Scheduled cleaning',
              created_at: '2025-11-14T10:00:00Z'
            },
            {
              id: 4,
              boat_id: selectedBoatId.value,
              service_type: 'Battery Check',
              date: '2025-11-25',
              provider: 'Electrical Services',
              cost: 75,
              next_due_date: '2025-11-20',
              days_until_due: 6,
              urgency: 'urgent',
              notes: 'Winter preparation',
              created_at: '2025-11-14T10:00:00Z'
            }
          ];
        }
      } catch (error) {
        console.error('Error loading maintenance data:', error);
      }
    };

    const getMaintenanceCountForDate = (date) => {
      const count = maintenanceRecords.value.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === date.toDateString();
      }).length;
      return count > 0 ? count : '';
    };

    const getMaintenanceForDate = (date) => {
      return maintenanceRecords.value.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.toDateString() === date.toDateString();
      });
    };

    const getDateClass = (date) => {
      const now = new Date();
      const isCurrentMonth = date.getMonth() === now.getMonth();
      const hasRecords = getMaintenanceCountForDate(date) > 0;
      const isSelected = selectedDate.value && date.toDateString() === selectedDate.value.toDateString();

      if (isSelected) return 'bg-pink-500 border-pink-500 text-white';
      if (hasRecords && isCurrentMonth) return 'bg-pink-500/20 border-pink-500/50 text-white';
      if (hasRecords) return 'bg-pink-500/10 border-pink-500/30 text-white';
      return isCurrentMonth ? 'bg-white/5 border-white/10 text-white' : 'bg-white/2 border-white/5 text-white/40';
    };

    const getUrgencyColor = (urgency) => {
      if (urgency === 'urgent') return 'text-red-400';
      if (urgency === 'warning') return 'text-yellow-400';
      return 'text-white';
    };

    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const currencyFormat = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR'
      }).format(value);
    };

    const selectRecord = (record) => {
      selectedRecord.value = record;
    };

    const editSelectedRecord = () => {
      editingRecord.value = selectedRecord.value;
      formData.value = { ...selectedRecord.value, boatId: selectedRecord.value.boat_id };
      selectedRecord.value = null;
      showAddForm.value = true;
    };

    const closeForm = () => {
      showAddForm.value = false;
      editingRecord.value = null;
      formData.value = {
        boatId: '',
        service_type: '',
        date: '',
        provider: '',
        cost: null,
        next_due_date: '',
        notes: ''
      };
      formError.value = '';
    };

    const saveRecord = async () => {
      formError.value = '';

      if (!formData.value.boatId || !formData.value.service_type || !formData.value.date) {
        formError.value = 'Please fill in all required fields';
        return;
      }

      isSubmitting.value = true;
      try {
        // In a real app, make API call to POST /api/maintenance or PUT /api/maintenance/:id
        console.log('Saving record:', formData.value);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        if (editingRecord.value) {
          const index = maintenanceRecords.value.findIndex(r => r.id === editingRecord.value.id);
          if (index !== -1) {
            maintenanceRecords.value[index] = { ...editingRecord.value, ...formData.value };
          }
        } else {
          maintenanceRecords.value.push({
            id: Math.max(...maintenanceRecords.value.map(r => r.id), 0) + 1,
            ...formData.value,
            boat_id: formData.value.boatId,
            created_at: new Date().toISOString()
          });
        }

        closeForm();
      } catch (error) {
        formError.value = error.message || 'Failed to save record';
      } finally {
        isSubmitting.value = false;
      }
    };

    const deleteRecord = async () => {
      if (!confirm('Are you sure you want to delete this record?')) return;

      isSubmitting.value = true;
      try {
        // In a real app, make API call to DELETE /api/maintenance/:id
        const index = maintenanceRecords.value.findIndex(r => r.id === editingRecord.value.id);
        if (index !== -1) {
          maintenanceRecords.value.splice(index, 1);
        }
        closeForm();
      } catch (error) {
        formError.value = error.message || 'Failed to delete record';
      } finally {
        isSubmitting.value = false;
      }
    };

    // Lifecycle
    onMounted(() => {
      loadBoats();
      loadMaintenanceData();
    });

    return {
      boats,
      selectedBoatId,
      maintenanceRecords,
      upcomingMaintenanceList,
      showAddForm,
      editingRecord,
      selectedRecord,
      selectedDate,
      viewMode,
      serviceTypeFilter,
      isSubmitting,
      formError,
      formData,
      filteredServiceHistory,
      upcomingMaintenance,
      upcomingAlert,
      calendarDays,
      loadMaintenanceData,
      getMaintenanceCountForDate,
      getMaintenanceForDate,
      getDateClass,
      getUrgencyColor,
      formatDate,
      currencyFormat,
      selectRecord,
      editSelectedRecord,
      closeForm,
      saveRecord,
      deleteRecord
    };
  }
};
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-all;
}

.btn-primary {
  @apply bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-lg;
}

.btn-outline {
  @apply border border-white/20 text-white hover:border-white/40 bg-white/5;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.spinner {
  @apply rounded-full border-2 border-transparent border-t-current animate-spin;
}
</style>
