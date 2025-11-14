<template>
  <div class="camera-module">
    <!-- Header -->
    <div class="camera-header">
      <h2>Camera Management</h2>
      <button @click="showAddCamera = true" class="btn-primary" v-if="!showAddCamera">
        + Add Camera
      </button>
    </div>

    <!-- Add Camera Form -->
    <div v-if="showAddCamera" class="add-camera-form">
      <h3>Add New Camera</h3>

      <div class="form-group">
        <label>Camera Name *</label>
        <input
          v-model="newCamera.cameraName"
          type="text"
          placeholder="e.g., Starboard Camera"
          @keyup.escape="resetForm"
        />
      </div>

      <div class="form-group">
        <label>RTSP URL *</label>
        <input
          v-model="newCamera.rtspUrl"
          type="text"
          placeholder="rtsp://user:password@192.168.1.100:554/stream"
          @keyup.escape="resetForm"
        />
        <small>Format: rtsp://[user:password@]host[:port][/path]</small>
      </div>

      <div class="form-group">
        <label>Boat ID *</label>
        <input
          v-model.number="newCamera.boatId"
          type="number"
          placeholder="Select boat"
          @keyup.escape="resetForm"
        />
      </div>

      <div class="form-actions">
        <button @click="addCamera" class="btn-success" :disabled="!canAddCamera">
          {{ isLoading ? 'Adding...' : 'Add Camera' }}
        </button>
        <button @click="resetForm" class="btn-secondary">Cancel</button>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <!-- No Cameras Message -->
    <div v-if="cameras.length === 0 && !showAddCamera" class="no-cameras">
      <p>No cameras configured yet. Add your first camera to get started!</p>
    </div>

    <!-- Cameras Grid -->
    <div v-else class="cameras-grid">
      <div v-for="camera in cameras" :key="camera.id" class="camera-card">
        <!-- Camera Name -->
        <div class="camera-title">
          <h3>{{ camera.cameraName }}</h3>
          <span class="camera-id">ID: {{ camera.id }}</span>
        </div>

        <!-- Snapshot Display -->
        <div class="snapshot-container">
          <img
            v-if="camera.lastSnapshotUrl"
            :src="camera.lastSnapshotUrl"
            :alt="camera.cameraName"
            class="snapshot"
            @click="viewFullscreen(camera)"
          />
          <div v-else class="no-snapshot">
            <p>No snapshot available</p>
            <small>Waiting for Home Assistant to send snapshot...</small>
          </div>
        </div>

        <!-- Snapshot Timestamp -->
        <div v-if="camera.lastSnapshotUrl" class="snapshot-timestamp">
          Last updated: {{ formatTimestamp(camera.updatedAt) }}
        </div>

        <!-- Camera Info -->
        <div class="camera-info">
          <div class="info-item">
            <label>RTSP URL:</label>
            <code>{{ maskUrl(camera.rtspUrl) }}</code>
          </div>
          <div class="info-item">
            <label>Created:</label>
            <span>{{ formatDate(camera.createdAt) }}</span>
          </div>
        </div>

        <!-- Webhook Configuration -->
        <div class="webhook-section">
          <h4>Home Assistant Integration</h4>
          <div class="webhook-url">
            <label>Webhook URL:</label>
            <div class="url-display">
              <code>{{ getWebhookUrl(camera) }}</code>
              <button @click="copyWebhook(camera)" class="btn-copy" title="Copy to clipboard">
                📋 Copy
              </button>
            </div>
          </div>

          <div class="webhook-token">
            <label>Webhook Token:</label>
            <div class="token-display">
              <code>{{ camera.webhookToken }}</code>
              <button @click="copyToken(camera)" class="btn-copy" title="Copy to clipboard">
                📋 Copy
              </button>
            </div>
          </div>

          <div class="ha-instructions">
            <details>
              <summary>Home Assistant Setup Instructions</summary>
              <div class="instructions-content">
                <p><strong>1. Add to your Home Assistant configuration.yaml:</strong></p>
                <pre><code>automation:
  - alias: "{{ camera.cameraName }} Snapshot to NaviDocs"
    trigger:
      platform: state
      entity_id: camera.{{ camera.cameraName | slugify }}
      to: 'recording'
    action:
      service: rest_command.navidocs_camera_update
      data:
        webhook_url: "{{ getWebhookUrl(camera) }}"
        image_url: "{{ '{{ state_attr(\'camera.' + (camera.cameraName | slugify) + '\', \'entity_picture\') }' }}"

rest_command:
  navidocs_camera_update:
    url: "{{ getWebhookUrl(camera) }}"
    method: POST
    payload: '{"snapshot_url":"{{ '{{ image_url }}' }}","event_type":"motion"}'</code></pre>

                <p><strong>2. Or use generic ONVIF/RTSP camera directly:</strong></p>
                <pre><code>camera:
  - platform: onvif
    host: YOUR_CAMERA_IP
    username: YOUR_USERNAME
    password: YOUR_PASSWORD</code></pre>

                <p><strong>3. Send snapshot webhook (test):</strong></p>
                <pre><code>curl -X POST {{ getWebhookUrl(camera) }} \
  -H "Content-Type: application/json" \
  -d '{"snapshot_url":"https://example.com/snapshot.jpg","type":"motion"}'</code></pre>
              </div>
            </details>
          </div>
        </div>

        <!-- Stream Info -->
        <div class="stream-section">
          <h4>Stream Configuration</h4>
          <div class="stream-info">
            <p><strong>Proxy Endpoint:</strong></p>
            <code>{{ getProxyUrl(camera) }}</code>
            <small>For clients that cannot access RTSP directly</small>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="camera-actions">
          <button
            @click="editCamera(camera)"
            class="btn-edit"
            title="Edit camera settings"
          >
            ✏️ Edit
          </button>
          <button
            @click="viewFullscreen(camera)"
            v-if="camera.lastSnapshotUrl"
            class="btn-fullscreen"
            title="View fullscreen"
          >
            ⛶ Fullscreen
          </button>
          <button
            @click="deleteCamera(camera)"
            class="btn-danger"
            title="Remove camera"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingCamera" class="modal-overlay" @click="closeEdit">
      <div class="modal-content" @click.stop>
        <h3>Edit Camera</h3>

        <div class="form-group">
          <label>Camera Name</label>
          <input v-model="editingCamera.cameraName" type="text" />
        </div>

        <div class="form-group">
          <label>RTSP URL</label>
          <input v-model="editingCamera.rtspUrl" type="text" />
        </div>

        <div class="form-actions">
          <button @click="saveEdit" class="btn-success" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
          <button @click="closeEdit" class="btn-secondary">Cancel</button>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>
    </div>

    <!-- Fullscreen Modal -->
    <div v-if="fullscreenCamera" class="modal-overlay" @click="closeFullscreen">
      <div class="modal-content fullscreen-modal" @click.stop>
        <button @click="closeFullscreen" class="btn-close">✕</button>
        <img
          :src="fullscreenCamera.lastSnapshotUrl"
          :alt="fullscreenCamera.cameraName"
          class="fullscreen-image"
        />
        <p class="fullscreen-title">{{ fullscreenCamera.cameraName }}</p>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
      <button @click="successMessage = ''" class="btn-close-message">✕</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CameraModule',
  data() {
    return {
      cameras: [],
      newCamera: {
        cameraName: '',
        rtspUrl: '',
        boatId: null
      },
      editingCamera: null,
      fullscreenCamera: null,
      showAddCamera: false,
      isLoading: false,
      errorMessage: '',
      successMessage: '',
      apiBaseUrl: process.env.VUE_APP_API_URL || 'http://localhost:3001/api'
    };
  },

  computed: {
    canAddCamera() {
      return (
        this.newCamera.cameraName.trim().length > 0 &&
        this.newCamera.rtspUrl.trim().length > 0 &&
        this.newCamera.boatId !== null
      );
    }
  },

  methods: {
    async loadCameras(boatId) {
      if (!boatId) return;

      try {
        this.isLoading = true;
        const response = await fetch(`${this.apiBaseUrl}/cameras/${boatId}`);

        if (!response.ok) {
          throw new Error('Failed to load cameras');
        }

        const data = await response.json();
        this.cameras = data.cameras || [];
      } catch (error) {
        this.errorMessage = `Error loading cameras: ${error.message}`;
        console.error('Error loading cameras:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async addCamera() {
      if (!this.canAddCamera) return;

      try {
        this.isLoading = true;
        this.errorMessage = '';

        const response = await fetch(`${this.apiBaseUrl}/cameras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cameraName: this.newCamera.cameraName,
            rtspUrl: this.newCamera.rtspUrl,
            boatId: this.newCamera.boatId
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add camera');
        }

        const data = await response.json();
        this.cameras.push(data.camera);

        this.successMessage = `Camera "${data.camera.cameraName}" added successfully!`;
        this.resetForm();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Error adding camera:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async deleteCamera(camera) {
      if (!confirm(`Are you sure you want to delete "${camera.cameraName}"?`)) {
        return;
      }

      try {
        this.isLoading = true;
        this.errorMessage = '';

        const response = await fetch(`${this.apiBaseUrl}/cameras/${camera.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete camera');
        }

        this.cameras = this.cameras.filter(c => c.id !== camera.id);
        this.successMessage = 'Camera deleted successfully!';

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Error deleting camera:', error);
      } finally {
        this.isLoading = false;
      }
    },

    editCamera(camera) {
      this.editingCamera = { ...camera };
      this.errorMessage = '';
    },

    async saveEdit() {
      if (!this.editingCamera) return;

      try {
        this.isLoading = true;
        this.errorMessage = '';

        const response = await fetch(`${this.apiBaseUrl}/cameras/${this.editingCamera.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cameraName: this.editingCamera.cameraName,
            rtspUrl: this.editingCamera.rtspUrl
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update camera');
        }

        const data = await response.json();
        const index = this.cameras.findIndex(c => c.id === data.camera.id);
        if (index !== -1) {
          this.cameras[index] = data.camera;
        }

        this.successMessage = 'Camera updated successfully!';
        this.closeEdit();

        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Error updating camera:', error);
      } finally {
        this.isLoading = false;
      }
    },

    closeEdit() {
      this.editingCamera = null;
      this.errorMessage = '';
    },

    viewFullscreen(camera) {
      this.fullscreenCamera = camera;
    },

    closeFullscreen() {
      this.fullscreenCamera = null;
    },

    resetForm() {
      this.newCamera = {
        cameraName: '',
        rtspUrl: '',
        boatId: null
      };
      this.showAddCamera = false;
      this.errorMessage = '';
    },

    copyWebhook(camera) {
      const url = this.getWebhookUrl(camera);
      navigator.clipboard.writeText(url).then(() => {
        this.successMessage = 'Webhook URL copied!';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      });
    },

    copyToken(camera) {
      navigator.clipboard.writeText(camera.webhookToken).then(() => {
        this.successMessage = 'Token copied!';
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      });
    },

    getWebhookUrl(camera) {
      const baseUrl = process.env.VUE_APP_PUBLIC_URL || window.location.origin;
      return `${baseUrl}/api/cameras/webhook/${camera.webhookToken}`;
    },

    getProxyUrl(camera) {
      const baseUrl = process.env.VUE_APP_API_URL || 'http://localhost:3001/api';
      return `${baseUrl}/cameras/proxy/${camera.id}`;
    },

    maskUrl(url) {
      if (!url) return '';
      // Show first and last part, hide credentials
      const match = url.match(/^(rtsp?:\/\/)([^@]*@)?(.*)$/);
      if (match) {
        return `${match[1]}***@${match[3]}`;
      }
      return url.substring(0, 30) + '...';
    },

    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      return new Date(dateString).toLocaleDateString();
    },

    formatTimestamp(dateString) {
      if (!dateString) return 'Unknown';
      return new Date(dateString).toLocaleString();
    }
  },

  mounted() {
    // Load cameras if boatId is provided via props
    if (this.$attrs['boatId']) {
      this.loadCameras(this.$attrs['boatId']);
    }
  }
};
</script>

<style scoped>
.camera-module {
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #ddd;
}

.camera-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

/* Form Styles */
.add-camera-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 2px solid #007bff;
}

.add-camera-form h3 {
  margin-top: 0;
  color: #007bff;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* Button Styles */
.btn-primary, .btn-success, .btn-secondary, .btn-danger,
.btn-edit, .btn-fullscreen, .btn-copy, .btn-close {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-success:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-edit {
  background-color: #17a2b8;
  color: white;
  flex: 1;
}

.btn-edit:hover {
  background-color: #138496;
}

.btn-fullscreen {
  background-color: #ffc107;
  color: #333;
  flex: 1;
}

.btn-fullscreen:hover {
  background-color: #e0a800;
}

.btn-copy {
  background-color: #20c997;
  color: white;
  padding: 5px 10px;
  font-size: 12px;
  margin-left: auto;
}

.btn-copy:hover {
  background-color: #1aa179;
}

.btn-close {
  background-color: transparent;
  color: #666;
  padding: 5px;
  float: right;
}

.btn-close-message {
  background-color: transparent;
  color: #666;
  border: none;
  padding: 0;
  cursor: pointer;
  margin-left: 10px;
}

/* Message Styles */
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 12px;
  border-radius: 4px;
  margin-top: 15px;
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Grid Layout */
.cameras-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.camera-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
}

.camera-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.camera-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.camera-title h3 {
  margin: 0;
  color: #333;
}

.camera-id {
  color: #999;
  font-size: 12px;
  background-color: #f0f0f0;
  padding: 3px 8px;
  border-radius: 3px;
}

/* Snapshot Styles */
.snapshot-container {
  margin-bottom: 15px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f9f9f9;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

.snapshot {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.snapshot:hover {
  transform: scale(1.02);
}

.no-snapshot {
  text-align: center;
  color: #999;
  padding: 20px;
}

.snapshot-timestamp {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

/* Info Styles */
.camera-info {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 13px;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.info-item label {
  font-weight: 600;
  color: #666;
}

code {
  background-color: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #d63384;
  word-break: break-all;
}

/* Webhook Section */
.webhook-section, .stream-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.webhook-section h4, .stream-section h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 14px;
}

.webhook-url, .webhook-token {
  margin-bottom: 10px;
}

.webhook-url label, .webhook-token label {
  display: block;
  font-weight: 600;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.url-display, .token-display {
  display: flex;
  gap: 5px;
  background-color: #f0f0f0;
  padding: 8px;
  border-radius: 4px;
  align-items: center;
}

.url-display code, .token-display code {
  flex: 1;
  overflow-x: auto;
}

/* HA Instructions */
.ha-instructions {
  margin-top: 10px;
}

.ha-instructions summary {
  cursor: pointer;
  color: #007bff;
  font-weight: 600;
  font-size: 13px;
  padding: 5px;
}

.ha-instructions summary:hover {
  text-decoration: underline;
}

.instructions-content {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  font-size: 12px;
}

.instructions-content p {
  margin: 10px 0 5px 0;
  color: #333;
}

.instructions-content pre {
  background-color: #272822;
  color: #f8f8f2;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
  line-height: 1.4;
  margin: 5px 0;
}

.instructions-content code {
  background-color: transparent;
  color: #f8f8f2;
  padding: 0;
}

/* Stream Info */
.stream-info {
  font-size: 12px;
}

.stream-info p {
  margin: 5px 0;
}

/* Camera Actions */
.camera-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.fullscreen-modal {
  max-width: 90vw;
  max-height: 90vh;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.fullscreen-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 85vh;
}

.fullscreen-title {
  padding: 10px;
  text-align: center;
  color: #333;
  margin: 0;
}

/* No Cameras Message */
.no-cameras {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;
  color: #999;
}

/* Responsive */
@media (max-width: 768px) {
  .cameras-grid {
    grid-template-columns: 1fr;
  }

  .camera-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .camera-actions {
    flex-direction: column;
  }

  .btn-edit, .btn-fullscreen, .btn-danger {
    flex: 1;
  }

  .modal-content {
    max-width: 95%;
  }
}
</style>
