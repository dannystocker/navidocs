/**
 * NaviDocs - Document Viewer Module
 * Mobile-optimized UI for viewing yacht documentation
 *
 * RECOVERY NOTE: Mobile UI patch recovered from StackCP on 2025-11-27
 * Includes responsive design fixes for iPad/tablet viewing
 */

class DocViewer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            zoom: 1.0,
            theme: 'light',
            ...options
        };
        this.currentPage = 1;
        this.totalPages = 0;
        this.isLoading = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTouchGestures();
        this.applyTheme();
    }

    setupEventListeners() {
        // Navigation buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="prev-page"]')) {
                this.previousPage();
            }
            if (e.target.matches('[data-action="next-page"]')) {
                this.nextPage();
            }
            if (e.target.matches('[data-action="zoom-in"]')) {
                this.zoomIn();
            }
            if (e.target.matches('[data-action="zoom-out"]')) {
                this.zoomOut();
            }
        });
    }

    setupTouchGestures() {
        // Mobile pinch-to-zoom and swipe support
        let touchStartX = 0;
        let touchStartDistance = 0;

        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                touchStartDistance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
            touchStartX = e.touches[0].clientX;
        });

        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (distance > touchStartDistance * 1.1) {
                    this.zoomIn();
                } else if (distance < touchStartDistance * 0.9) {
                    this.zoomOut();
                }
            }
        });

        this.container.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;

            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.nextPage();
                } else {
                    this.previousPage();
                }
            }
        });
    }

    async loadDocument(url) {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load document');

            const data = await response.json();
            this.totalPages = data.pages || 0;
            this.renderPage(this.currentPage);
        } catch (error) {
            console.error('DocViewer error:', error);
            this.showError('Failed to load document');
        } finally {
            this.isLoading = false;
        }
    }

    renderPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) return;
        this.currentPage = pageNum;

        const page = this.container.querySelector('[data-page-number]');
        if (page) {
            page.dataset.pageNumber = pageNum;
            page.style.transform = `scale(${this.options.zoom})`;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.renderPage(this.currentPage - 1);
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.renderPage(this.currentPage + 1);
        }
    }

    zoomIn() {
        this.options.zoom = Math.min(this.options.zoom + 0.1, 3.0);
        this.renderPage(this.currentPage);
    }

    zoomOut() {
        this.options.zoom = Math.max(this.options.zoom - 0.1, 0.5);
        this.renderPage(this.currentPage);
    }

    applyTheme() {
        if (this.options.theme === 'dark') {
            this.container.classList.add('dark-mode');
        } else {
            this.container.classList.remove('dark-mode');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'doc-viewer-error';
        errorDiv.textContent = message;
        this.container.appendChild(errorDiv);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocViewer;
}

/**
 * RECOVERY ANALYSIS:
 * - Mobile UI optimizations for tablet/iPad viewing (Swiss-made yacht market)
 * - Touch gesture support: swipe navigation, pinch-to-zoom
 * - Responsive zoom control with min/max constraints
 * - Dark mode theme support
 * - Error handling for graceful degradation
 *
 * AUDIT TRAIL:
 * - Recovered from: /public_html/icantwait.ca/public/js/
 * - Feature: Mobile UX patch for Phase 2
 * - Status: Integration pending (frontend wiring)
 * - Source branch: fix/production-sync-2025
 */
