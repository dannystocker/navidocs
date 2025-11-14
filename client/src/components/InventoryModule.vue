<template>
  <div class="inventory-module">
    <h2>Inventory Tracking</h2>
    <p class="subtitle">Manage boat equipment and track depreciation</p>

    <div class="toolbar">
      <button @click="showAddForm = true" class="btn-primary">Add Equipment</button>
      <div class="filters">
        <select v-model="filterCategory" class="filter-select">
          <option value="">All Categories</option>
          <option>Electronics</option>
          <option>Safety</option>
          <option>Engine</option>
          <option>Sails</option>
          <option>Navigation</option>
          <option>Other</option>
        </select>
      </div>
    </div>

    <div v-if="showAddForm" class="modal-overlay" @click="closeAddForm">
      <div class="modal-content" @click.stop>
        <h3>Add Equipment</h3>
        <form @submit.prevent="addItem" class="add-form">
          <div class="form-group">
            <label>Equipment Name *</label>
            <input v-model="newItem.name" placeholder="e.g., Main Sail, GPS Unit" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select v-model="newItem.category">
                <option value="">Select Category</option>
                <option>Electronics</option>
                <option>Safety</option>
                <option>Engine</option>
                <option>Sails</option>
                <option>Navigation</option>
                <option>Other</option>
              </select>
            </div>

            <div class="form-group">
              <label>Purchase Date</label>
              <input v-model="newItem.purchase_date" type="date" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Purchase Price (€) *</label>
              <input v-model="newItem.purchase_price" type="number" step="0.01" placeholder="0.00" required />
            </div>

            <div class="form-group">
              <label>Depreciation Rate (%)</label>
              <input v-model="newItem.depreciation_rate" type="number" step="0.01" placeholder="10" />
              <small>Annual depreciation rate (e.g., 0.1 = 10%)</small>
            </div>
          </div>

          <div class="form-group">
            <label>Photos</label>
            <div class="file-input-wrapper">
              <input type="file" @change="handlePhotoUpload" multiple accept="image/*" />
              <p v-if="photos.length > 0" class="file-count">{{ photos.length }} file(s) selected</p>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Save Equipment</button>
            <button type="button" @click="closeAddForm" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="filteredInventory.length === 0" class="empty-state">
      <p>No equipment added yet. Click "Add Equipment" to get started.</p>
    </div>

    <div v-else class="inventory-grid">
      <div v-for="item in filteredInventory" :key="item.id" class="item-card">
        <div v-if="item.photo_urls && item.photo_urls.length > 0" class="item-image">
          <img :src="item.photo_urls[0]" :alt="item.name" @error="handleImageError" />
        </div>
        <div v-else class="item-image-placeholder">
          <div class="placeholder-icon">📷</div>
        </div>

        <div class="item-content">
          <h3>{{ item.name }}</h3>
          <p class="category" v-if="item.category">{{ item.category }}</p>

          <div class="item-details">
            <div class="detail-row">
              <span class="label">Purchase Price:</span>
              <span class="value">€{{ formatPrice(item.purchase_price) }}</span>
            </div>

            <div class="detail-row">
              <span class="label">Current Value:</span>
              <span class="value highlight">€{{ formatPrice(item.current_value) }}</span>
            </div>

            <div class="detail-row">
              <span class="label">Depreciation:</span>
              <span class="value">{{ calculateDepreciation(item) }}%</span>
            </div>

            <div v-if="item.purchase_date" class="detail-row">
              <span class="label">Purchased:</span>
              <span class="value">{{ formatDate(item.purchase_date) }}</span>
            </div>

            <div v-if="item.notes" class="detail-row">
              <span class="label">Notes:</span>
              <span class="value">{{ item.notes }}</span>
            </div>
          </div>

          <div class="item-actions">
            <button @click="editItem(item)" class="btn-edit">Edit</button>
            <button @click="deleteItem(item.id)" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <p>Loading inventory...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventoryModule',
  data() {
    return {
      inventory: [],
      showAddForm: false,
      loading: true,
      filterCategory: '',
      newItem: {
        name: '',
        category: '',
        purchase_date: '',
        purchase_price: 0,
        depreciation_rate: 0.1
      },
      photos: []
    };
  },

  computed: {
    filteredInventory() {
      if (!this.filterCategory) {
        return this.inventory;
      }
      return this.inventory.filter(item => item.category === this.filterCategory);
    }
  },

  async mounted() {
    await this.loadInventory();
  },

  methods: {
    async loadInventory() {
      try {
        this.loading = true;
        const boatId = this.$route.params.boatId || 1;
        const token = localStorage.getItem('token');

        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch(`/api/inventory/${boatId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.inventory = await response.json();
      } catch (error) {
        console.error('Error loading inventory:', error);
        this.inventory = [];
      } finally {
        this.loading = false;
      }
    },

    async addItem() {
      try {
        if (!this.newItem.name) {
          alert('Equipment name is required');
          return;
        }

        const formData = new FormData();
        const boatId = this.$route.params.boatId || 1;

        formData.append('boat_id', boatId);
        formData.append('name', this.newItem.name);
        formData.append('category', this.newItem.category);
        formData.append('purchase_date', this.newItem.purchase_date);
        formData.append('purchase_price', this.newItem.purchase_price || 0);
        formData.append('depreciation_rate', this.newItem.depreciation_rate || 0.1);

        this.photos.forEach(photo => {
          formData.append('photos', photo);
        });

        const token = localStorage.getItem('token');
        const response = await fetch('/api/inventory', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        this.closeAddForm();
        await this.loadInventory();
      } catch (error) {
        console.error('Error adding inventory item:', error);
        alert('Failed to add equipment: ' + error.message);
      }
    },

    handlePhotoUpload(e) {
      this.photos = Array.from(e.target.files);
    },

    calculateDepreciation(item) {
      if (!item.purchase_date || !item.depreciation_rate) return 0;

      const purchaseDate = new Date(item.purchase_date);
      const now = new Date();
      const years = (now - purchaseDate) / (365 * 24 * 60 * 60 * 1000);

      if (years < 0) return 0;

      const depreciationPercent = (1 - Math.pow(1 - item.depreciation_rate, years)) * 100;
      return Math.round(depreciationPercent);
    },

    formatPrice(price) {
      return parseFloat(price).toFixed(2);
    },

    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return dateStr;
      }
    },

    handleImageError(event) {
      event.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22%3EImage not found%3C/text%3E%3C/svg%3E';
    },

    editItem(item) {
      console.log('Edit functionality coming soon for item:', item);
      alert('Edit functionality coming in next update');
    },

    async deleteItem(id) {
      if (!confirm('Are you sure you want to delete this equipment?')) {
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await this.loadInventory();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        alert('Failed to delete equipment: ' + error.message);
      }
    },

    closeAddForm() {
      this.showAddForm = false;
      this.resetForm();
    },

    resetForm() {
      this.newItem = {
        name: '',
        category: '',
        purchase_date: '',
        purchase_price: 0,
        depreciation_rate: 0.1
      };
      this.photos = [];
    }
  }
};
</script>

<style scoped>
.inventory-module {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  margin: 0 0 8px 0;
  color: #1a1a1a;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  margin: 0 0 24px 0;
  color: #666;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #f0f0f0;
  color: #1a1a1a;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-edit {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background: #45a049;
}

.btn-delete {
  background: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.btn-delete:hover {
  background: #da190b;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 24px;
  color: #1a1a1a;
  font-size: 22px;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  color: #1a1a1a;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group small {
  margin-top: 4px;
  color: #999;
  font-size: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.file-input-wrapper {
  position: relative;
  border: 2px dashed #ddd;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.file-input-wrapper:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.file-input-wrapper input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-count {
  margin: 8px 0 0 0;
  color: #667eea;
  font-size: 12px;
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.form-actions button {
  flex: 1;
}

/* Inventory Grid */
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.item-card {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.item-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.item-card:hover .item-image img {
  transform: scale(1.05);
}

.item-image-placeholder {
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.placeholder-icon {
  opacity: 0.5;
}

.item-content {
  padding: 20px;
}

.item-content h3 {
  margin: 0 0 8px 0;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 600;
}

.category {
  margin: 0 0 16px 0;
  color: #667eea;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.detail-row .label {
  color: #666;
  font-weight: 500;
}

.detail-row .value {
  color: #1a1a1a;
  font-weight: 600;
}

.detail-row .value.highlight {
  color: #4CAF50;
  font-weight: 700;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 768px) {
  .inventory-module {
    padding: 16px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .inventory-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }
}
</style>
