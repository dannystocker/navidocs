<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <!-- Header -->
    <header class="glass border-b border-white/10 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Expense Tracking
            </h1>
            <p class="text-white/50 text-sm mt-1">Manage shared expenses with OCR receipt scanning</p>
          </div>
          <button
            @click="showAddForm = !showAddForm"
            class="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200"
          >
            + Add Expense
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Add Expense Form -->
      <div v-if="showAddForm" class="mb-8">
        <div class="glass rounded-lg p-6 border border-white/10 shadow-xl">
          <h2 class="text-xl font-semibold text-white mb-6">Create New Expense</h2>

          <form @submit.prevent="submitExpense" class="space-y-6">
            <!-- Basic Info Row -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Amount *</label>
                <input
                  v-model.number="form.amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:border-blue-400 focus:bg-white/10 transition"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Currency *</label>
                <select
                  v-model="form.currency"
                  required
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:border-blue-400 focus:bg-white/10 transition"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Date *</label>
                <input
                  v-model="form.date"
                  type="date"
                  required
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:border-blue-400 focus:bg-white/10 transition"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">Category *</label>
                <select
                  v-model="form.category"
                  required
                  class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white focus:border-blue-400 focus:bg-white/10 transition"
                >
                  <option value="">Select Category</option>
                  <option value="fuel">Fuel</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="moorage">Moorage</option>
                  <option value="insurance">Insurance</option>
                  <option value="supplies">Supplies</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">Description</label>
              <input
                v-model="form.description"
                type="text"
                class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 focus:border-blue-400 focus:bg-white/10 transition"
                placeholder="Optional description"
              />
            </div>

            <!-- Receipt Upload -->
            <div class="border-2 border-dashed border-white/20 rounded-lg p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-white">Receipt Image</p>
                  <p class="text-xs text-white/50 mt-1">Upload JPG, PNG, WebP or PDF (max 10MB)</p>
                  <input
                    ref="receiptInput"
                    type="file"
                    @change="handleReceiptUpload"
                    class="hidden"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                  />
                </div>
                <button
                  type="button"
                  @click="$refs.receiptInput.click()"
                  class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
                >
                  Choose File
                </button>
              </div>
              <p v-if="form.receipt" class="text-sm text-blue-400 mt-2">
                ✓ {{ form.receipt.name }}
              </p>
            </div>

            <!-- User Split Section -->
            <div class="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 class="text-sm font-semibold text-white mb-4">Split Among Users</h3>
              <div class="space-y-2">
                <div v-for="(share, index) in splitUsers" :key="index" class="flex items-center gap-2">
                  <input
                    v-model="splitUsers[index].userId"
                    type="text"
                    placeholder="User ID or Name"
                    class="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-white/40 text-sm focus:border-blue-400 transition"
                  />
                  <div class="flex items-center gap-1">
                    <input
                      v-model.number="splitUsers[index].percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      class="w-20 px-2 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:border-blue-400 transition"
                    />
                    <span class="text-white/50 text-sm">%</span>
                  </div>
                  <button
                    type="button"
                    @click="splitUsers.splice(index, 1)"
                    class="px-2 py-2 text-red-400 hover:bg-red-500/20 rounded transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <button
                type="button"
                @click="addSplitUser"
                class="mt-3 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition"
              >
                + Add User
              </button>

              <div class="mt-3 text-sm text-white/70">
                <p>Total: {{ splitPercentageTotal }}%
                  <span v-if="splitPercentageTotal !== 100" class="text-yellow-400">
                    (should be 100%)
                  </span>
                </p>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex gap-2 justify-end">
              <button
                type="button"
                @click="showAddForm = false; resetForm()"
                class="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!canSubmit"
                class="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Expense
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Filters -->
      <div class="glass rounded-lg p-4 border border-white/10 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">Status</label>
            <select
              v-model="filters.status"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:border-blue-400 transition"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="settled">Settled</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">Category</label>
            <select
              v-model="filters.category"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:border-blue-400 transition"
            >
              <option value="">All</option>
              <option value="fuel">Fuel</option>
              <option value="maintenance">Maintenance</option>
              <option value="moorage">Moorage</option>
              <option value="insurance">Insurance</option>
              <option value="supplies">Supplies</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">Start Date</label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:border-blue-400 transition"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-white/80 mb-2">End Date</label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:border-blue-400 transition"
            />
          </div>
        </div>

        <div class="flex gap-2 mt-4">
          <button
            @click="applyFilters"
            class="px-4 py-2 bg-blue-500/20 border border-blue-400/50 text-blue-400 rounded text-sm hover:bg-blue-500/30 transition"
          >
            Apply Filters
          </button>
          <button
            @click="resetFilters"
            class="px-4 py-2 bg-white/5 border border-white/10 text-white rounded text-sm hover:bg-white/10 transition"
          >
            Reset
          </button>
          <button
            @click="exportToCSV"
            class="px-4 py-2 bg-green-500/20 border border-green-400/50 text-green-400 rounded text-sm hover:bg-green-500/30 transition ml-auto"
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="glass rounded-lg p-4 border border-white/10">
          <p class="text-white/70 text-sm">Total Expenses</p>
          <p class="text-2xl font-bold text-blue-400 mt-2">{{ filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2) }}</p>
        </div>

        <div class="glass rounded-lg p-4 border border-white/10">
          <p class="text-white/70 text-sm">Pending Approval</p>
          <p class="text-2xl font-bold text-yellow-400 mt-2">{{ filteredExpenses.filter(e => e.approvalStatus === 'pending').length }}</p>
        </div>

        <div class="glass rounded-lg p-4 border border-white/10">
          <p class="text-white/70 text-sm">Approved</p>
          <p class="text-2xl font-bold text-green-400 mt-2">{{ filteredExpenses.filter(e => e.approvalStatus === 'approved').length }}</p>
        </div>

        <div class="glass rounded-lg p-4 border border-white/10">
          <p class="text-white/70 text-sm">Categories</p>
          <p class="text-2xl font-bold text-cyan-400 mt-2">{{ uniqueCategories.length }}</p>
        </div>
      </div>

      <!-- Category Breakdown Chart -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="glass rounded-lg p-6 border border-white/10">
          <h3 class="text-lg font-semibold text-white mb-4">Expenses by Category</h3>
          <div class="space-y-2">
            <div v-for="(amount, cat) in categoryTotals" :key="cat" class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-white/70 capitalize">{{ cat }}</span>
                <span class="text-white font-medium">{{ amount.toFixed(2) }}</span>
              </div>
              <div class="w-full bg-white/5 rounded-full h-2">
                <div
                  class="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  :style="{ width: (amount / (filteredExpenses.reduce((sum, e) => sum + e.amount, 0) || 1) * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Split Summary -->
        <div class="glass rounded-lg p-6 border border-white/10">
          <h3 class="text-lg font-semibold text-white mb-4">Split Summary</h3>
          <div class="space-y-3">
            <div v-for="(total, userId) in userTotals" :key="userId" class="bg-white/5 rounded p-3">
              <div class="flex justify-between items-center">
                <span class="text-white font-medium">{{ userId }}</span>
                <span class="text-cyan-400 font-semibold">{{ parseFloat(total).toFixed(2) }}</span>
              </div>
            </div>
            <div v-if="Object.keys(userTotals).length === 0" class="text-white/50 text-sm text-center py-6">
              No split data yet
            </div>
          </div>
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="glass rounded-lg border border-white/10 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white/5 border-b border-white/10">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-white/80">Date</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-white/80">Category</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-white/80">Amount</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-white/80">Description</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-white/80">Status</th>
                <th class="px-4 py-3 text-center text-sm font-semibold text-white/80">Receipt</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-white/80">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="expense in filteredExpenses"
                :key="expense.id"
                class="border-b border-white/5 hover:bg-white/5 transition"
              >
                <td class="px-4 py-3 text-sm text-white">{{ formatDate(expense.date) }}</td>
                <td class="px-4 py-3 text-sm text-white/70 capitalize">{{ expense.category }}</td>
                <td class="px-4 py-3 text-sm text-right font-medium text-cyan-400">
                  {{ expense.amount.toFixed(2) }} {{ expense.currency }}
                </td>
                <td class="px-4 py-3 text-sm text-white/70">{{ expense.description || '-' }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    :class="[
                      'inline-block px-2 py-1 rounded text-xs font-medium',
                      expense.approvalStatus === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : expense.approvalStatus === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 text-blue-400'
                    ]"
                  >
                    {{ expense.approvalStatus }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    v-if="expense.receiptUrl"
                    @click="viewReceipt(expense)"
                    class="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    View
                  </button>
                  <span v-else class="text-white/50 text-sm">-</span>
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button
                    v-if="expense.approvalStatus === 'pending'"
                    @click="approveExpense(expense.id)"
                    class="text-green-400 hover:text-green-300 text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    v-if="expense.approvalStatus === 'pending'"
                    @click="deleteExpense(expense.id)"
                    class="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                  <button
                    v-if="expense.receiptUrl && !expense.ocrText"
                    @click="processOCR(expense.id)"
                    class="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    OCR
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredExpenses.length === 0" class="text-center py-12">
          <p class="text-white/50">No expenses found</p>
        </div>
      </div>

      <!-- Receipt Preview Modal -->
      <div
        v-if="selectedReceipt"
        @click="selectedReceipt = null"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div @click.stop class="bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-white">Receipt Preview</h3>
            <button
              @click="selectedReceipt = null"
              class="text-white/50 hover:text-white transition"
            >
              ✕
            </button>
          </div>
          <img
            v-if="!selectedReceipt.receiptUrl.endsWith('.pdf')"
            :src="selectedReceipt.receiptUrl"
            alt="Receipt"
            class="w-full rounded border border-white/10"
          />
          <div v-else class="bg-white/5 rounded p-4 text-white/50 text-center py-12">
            PDF Receipt - Download to view
          </div>
          <div v-if="selectedReceipt.ocrText" class="mt-4 bg-white/5 rounded p-4 text-sm text-white/70 max-h-48 overflow-y-auto">
            <p class="font-medium text-white mb-2">OCR Text:</p>
            <pre class="whitespace-pre-wrap text-xs">{{ selectedReceipt.ocrText }}</pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'ExpenseModule',
  data() {
    return {
      expenses: [],
      filteredExpenses: [],
      showAddForm: false,
      selectedReceipt: null,
      userTotals: {},
      categoryTotals: {},

      form: {
        amount: null,
        currency: 'EUR',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        receipt: null
      },

      splitUsers: [
        { userId: 'user1', percentage: 50 },
        { userId: 'user2', percentage: 50 }
      ],

      filters: {
        status: '',
        category: '',
        startDate: '',
        endDate: ''
      }
    };
  },

  computed: {
    splitPercentageTotal() {
      return this.splitUsers.reduce((sum, u) => sum + (u.percentage || 0), 0);
    },

    canSubmit() {
      return this.form.amount > 0
        && this.form.category
        && this.form.date
        && this.splitPercentageTotal === 100;
    },

    uniqueCategories() {
      return [...new Set(this.filteredExpenses.map(e => e.category))];
    }
  },

  methods: {
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    handleReceiptUpload(event) {
      this.form.receipt = event.target.files[0];
    },

    addSplitUser() {
      this.splitUsers.push({
        userId: `user${this.splitUsers.length + 1}`,
        percentage: 0
      });
    },

    async submitExpense() {
      try {
        const formData = new FormData();
        formData.append('boatId', '1'); // Would be from context
        formData.append('amount', this.form.amount);
        formData.append('currency', this.form.currency);
        formData.append('date', this.form.date);
        formData.append('category', this.form.category);
        formData.append('description', this.form.description);
        formData.append('splitUsers', JSON.stringify(
          Object.fromEntries(
            this.splitUsers.map(u => [u.userId, u.percentage])
          )
        ));

        if (this.form.receipt) {
          formData.append('receipt', this.form.receipt);
        }

        const response = await fetch('/api/expenses', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          alert('Expense created successfully');
          this.resetForm();
          this.showAddForm = false;
          this.loadExpenses();
        } else {
          alert('Failed to create expense');
        }
      } catch (error) {
        console.error('Error submitting expense:', error);
        alert('Error: ' + error.message);
      }
    },

    async loadExpenses() {
      try {
        // Mock data for demo - in production would fetch from API
        this.expenses = [
          {
            id: '1',
            boatId: '1',
            amount: 150.00,
            currency: 'EUR',
            date: '2025-11-10',
            category: 'fuel',
            description: 'Fuel at marina',
            receiptUrl: null,
            ocrText: null,
            splitUsers: { user1: 50, user2: 50 },
            approvalStatus: 'pending'
          },
          {
            id: '2',
            boatId: '1',
            amount: 200.00,
            currency: 'EUR',
            date: '2025-11-08',
            category: 'maintenance',
            description: 'Engine service',
            receiptUrl: '/uploads/receipts/sample.jpg',
            ocrText: null,
            splitUsers: { user1: 100, user2: 0 },
            approvalStatus: 'approved'
          }
        ];
        this.applyFilters();
        this.updateTotals();
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    },

    applyFilters() {
      this.filteredExpenses = this.expenses.filter(expense => {
        if (this.filters.status && expense.approvalStatus !== this.filters.status) return false;
        if (this.filters.category && expense.category !== this.filters.category) return false;
        if (this.filters.startDate && expense.date < this.filters.startDate) return false;
        if (this.filters.endDate && expense.date > this.filters.endDate) return false;
        return true;
      });
      this.updateTotals();
    },

    resetFilters() {
      this.filters = {
        status: '',
        category: '',
        startDate: '',
        endDate: ''
      };
      this.applyFilters();
    },

    updateTotals() {
      // Category totals
      this.categoryTotals = {};
      this.filteredExpenses.forEach(exp => {
        this.categoryTotals[exp.category] = (this.categoryTotals[exp.category] || 0) + exp.amount;
      });

      // User totals
      this.userTotals = {};
      this.filteredExpenses.forEach(exp => {
        Object.entries(exp.splitUsers).forEach(([userId, percentage]) => {
          const userShare = exp.amount * percentage / 100;
          this.userTotals[userId] = (parseFloat(this.userTotals[userId] || 0) + userShare).toFixed(2);
        });
      });
    },

    async approveExpense(expenseId) {
      try {
        const response = await fetch(`/api/expenses/${expenseId}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approverUserId: 'current-user' })
        });

        if (response.ok) {
          alert('Expense approved');
          this.loadExpenses();
        }
      } catch (error) {
        console.error('Error approving expense:', error);
      }
    },

    async deleteExpense(expenseId) {
      if (!confirm('Are you sure you want to delete this expense?')) return;

      try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Expense deleted');
          this.loadExpenses();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    },

    async processOCR(expenseId) {
      try {
        const response = await fetch(`/api/expenses/${expenseId}/ocr`, {
          method: 'POST'
        });

        if (response.ok) {
          const data = await response.json();
          alert('OCR processed: ' + data.confidence * 100 + '%');
          this.loadExpenses();
        }
      } catch (error) {
        console.error('Error processing OCR:', error);
      }
    },

    viewReceipt(expense) {
      this.selectedReceipt = expense;
    },

    exportToCSV() {
      const headers = ['Date', 'Category', 'Amount', 'Currency', 'Description', 'Status'];
      const rows = this.filteredExpenses.map(e => [
        e.date,
        e.category,
        e.amount,
        e.currency,
        e.description || '',
        e.approvalStatus
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },

    resetForm() {
      this.form = {
        amount: null,
        currency: 'EUR',
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        receipt: null
      };
      this.splitUsers = [
        { userId: 'user1', percentage: 50 },
        { userId: 'user2', percentage: 50 }
      ];
    }
  },

  mounted() {
    this.loadExpenses();
  }
};
</script>

<style scoped>
.glass {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(10px);
}

input[type="file"] {
  display: none;
}

table {
  border-collapse: collapse;
}
</style>
