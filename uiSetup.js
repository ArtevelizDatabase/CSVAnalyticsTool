// uiSetup.js

/**
 * Mengambil semua elemen DOM yang dibutuhkan oleh aplikasi.
 * @returns {object} Objek berisi referensi ke elemen-elemen DOM.
 */
function getDOMElements() {
    return {
        themeToggleButton: document.getElementById('themeToggle'),
        sunIcon: document.querySelector('#themeToggle .icon-sun'),
        moonIcon: document.querySelector('#themeToggle .icon-moon'),
        csvFileInput: document.getElementById('csvFile'),
        dropArea: document.getElementById('dropArea'),
        fileNameDisplay: document.getElementById('fileName'),
        processCsvButton: document.getElementById('processCsvButton'), // Assuming you might re-add this button
        uploadStatus: document.getElementById('uploadStatus'),
        totalItemsValue: document.getElementById('totalItemsValue'),
        totalEarningsValue: document.getElementById('totalEarningsValue'),
        taxAmountValue: document.getElementById('taxAmountValue'),
        categoriesCountValue: document.getElementById('categoriesCountValue'),
        dataTableBody: document.getElementById('dataTableBody'),
        interactiveDataTable: document.getElementById('interactiveDataTable'),
        paginationContainer: document.getElementById('paginationContainer'),
        itemsPerPageSelect: document.getElementById('itemsPerPage'),
        tableStatus: document.getElementById('tableStatus'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        searchTermInput: document.getElementById('searchTerm'),
        startDateInput: document.getElementById('startDate'),
        endDateInput: document.getElementById('endDate'),
        categoryFilterSelect: document.getElementById('categoryFilter'),
        applyFiltersButton: document.getElementById('applyFiltersButton'),
        clearFiltersButton: document.getElementById('clearFiltersButton'),
        exportCsvButton: document.getElementById('exportCsvButton'),
        exportJsonButton: document.getElementById('exportJsonButton'),
        exportTypeSelect: document.getElementById('exportType'),
        exportStatus: document.getElementById('exportStatus'),
        topItemsTableBody: document.getElementById('topItemsTableBody'),
        topCategoriesByEarningsTableBody: document.getElementById('topCategoriesByEarningsTableBody'),
        topCategoriesByCountTableBody: document.getElementById('topCategoriesByCountTableBody'), // Kept for potential future use
        topPositiveChangeItemsTableBody: document.getElementById('topPositiveChangeItemsTableBody'),
        topArtboardsTableBody: document.getElementById('topArtboardsTableBody'), 
        itemDetailsModal: document.getElementById('itemDetailsModal'),
        closeModalButton: document.getElementById('closeModalButton'),
        modalTitle: document.getElementById('modalTitle'),
        modalBody: document.getElementById('modalBody'),
        yearlyEarningsChartCanvas: document.getElementById('yearlyEarningsChart'),
        categoryDistributionChartCanvas: document.getElementById('categoryDistributionChart'),
        topArtboardsChartCanvas: document.getElementById('topArtboardsChart'),
        monthlyEarningsTrendChartCanvas: document.getElementById('monthlyEarningsTrendChart'), // New
        itemPublicationTrendChartCanvas: document.getElementById('itemPublicationTrendChart'), // New
        avgEarningsChangeByCategoryChartCanvas: document.getElementById('avgEarningsChangeByCategoryChart'), // New
        currentYearSpan: document.getElementById('currentYear'),
        filterOptionsSectionTrigger: document.querySelector('#filterOptionsSection .collapsible-trigger'),
        collapsibleTriggers: document.querySelectorAll('.collapsible-trigger'),
        noPopularItemsTableBody: document.getElementById('noPopularItemsTableBody'),
        afterTaxValue: document.getElementById('afterTaxValue'),
    };
}

/**
 * Mengatur fungsionalitas buka/tutup untuk semua bagian yang dapat diciutkan.
 * @param {NodeListOf<Element>} triggers - Kumpulan elemen trigger collapsible.
 */
function setupCollapsibleSections(triggers) {
    triggers.forEach(button => {
        const content = button.nextElementSibling;
        if (!content || !content.classList.contains('collapsible-content')) {
            // console.warn('Collapsible trigger does not have a valid sibling content element:', button);
            return;
        }

        const isInitiallyExpanded = button.getAttribute('aria-expanded') === 'true';
        if (isInitiallyExpanded) {
            content.classList.add('expanded');
            const icon = button.querySelector('.collapsible-icon');
            if (icon) icon.textContent = '-';
        } else {
            content.classList.remove('expanded');
            const icon = button.querySelector('.collapsible-icon');
            if (icon) icon.textContent = '+';
        }

        button.addEventListener('click', () => {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            button.setAttribute('aria-expanded', String(!isExpanded));
            content.classList.toggle('expanded');
            const icon = button.querySelector('.collapsible-icon');
            if (icon) icon.textContent = isExpanded ? '+' : '-';
        });
    });
}

/**
 * Mengatur event listener untuk modal detail item.
 */
function setupModalEventListeners(elements, closeModalHandler) {
    if (elements.closeModalButton) {
        elements.closeModalButton.addEventListener('click', closeModalHandler);
    }
    if (elements.itemDetailsModal) {
        elements.itemDetailsModal.addEventListener('click', (event) => {
            if (event.target === elements.itemDetailsModal) {
                closeModalHandler();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (elements.itemDetailsModal && event.key === 'Escape' && elements.itemDetailsModal.style.display === 'flex') {
            closeModalHandler();
        }
    });
}

/**
 * Menampilkan overlay loading.
 */
function showLoading(elements, message = "Memproses...") {
    if (elements.loadingOverlay) {
        const pElement = elements.loadingOverlay.querySelector('p');
        if (pElement) pElement.textContent = message;
        elements.loadingOverlay.style.display = 'flex';
    }
}

/**
 * Menyembunyikan overlay loading.
 */
function hideLoading(elements) {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.style.display = 'none';
    }
}

/**
 * Menampilkan pesan status pada elemen tertentu.
 */
function showStatus(element, message, type = 'info') {
    if (element) {
        element.textContent = message;
        element.className = `status-message ${type}`; 
        element.setAttribute('aria-live', 'assertive');
        
        if (element.statusTimeoutId) {
            clearTimeout(element.statusTimeoutId);
        }
        element.statusTimeoutId = setTimeout(() => {
            if (element) { 
                element.setAttribute('aria-live', 'polite');
                element.textContent = '';
                element.className = 'status-message'; 
            }
        }, 7000); 
    }
}


/**
 * Menerapkan tema (light/dark) ke aplikasi.
 */
function applyTheme(theme, sunIcon, moonIcon) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (sunIcon && moonIcon) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'inline';
        } else {
            sunIcon.style.display = 'inline';
            moonIcon.style.display = 'none';
        }
    }
}

/**
 * Menginisialisasi manajemen tema.
 */
function initializeTheme(elements) {
    if (elements.themeToggleButton && elements.sunIcon && elements.moonIcon) {
        elements.themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme, elements.sunIcon, elements.moonIcon);
        });

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (savedTheme) {
            applyTheme(savedTheme, elements.sunIcon, elements.moonIcon);
        } else if (prefersDark) {
            applyTheme('dark', elements.sunIcon, elements.moonIcon);
        } else {
            applyTheme('light', elements.sunIcon, elements.moonIcon); 
        }
    }
}