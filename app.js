// app.js
document.addEventListener('DOMContentLoaded', () => {
    const elements = getDOMElements(); 

    let rawCsvData = [];
    let processedData = [];
    let filteredData = [];
    let currentSortColumn = null;
    let currentSortDirection = 'asc';
    let currentPage = 1;
    let itemsPerPage = elements.itemsPerPageSelect ? parseInt(elements.itemsPerPageSelect.value, 10) : 10;
    
    let yearlyEarningsChartInstance = null;
    let categoryDistributionChartInstance = null;
    let topArtboardsChartInstance = null;
    let monthlyEarningsTrendChartInstance = null; // New
    let itemPublicationTrendChartInstance = null; // New
    let avgEarningsChangeByCategoryChartInstance = null; // New
    
    const REQUIRED_COLUMNS = ["Item Id", "Category", "Title", "Published Date", "Total Earnings ($USD)", "Earnings Change"];

    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    initializeTheme(elements); 
    setupCollapsibleSections(elements.collapsibleTriggers); 
    setupModalEventListeners(elements, closeModalHandler); 
    if(elements.currentYearSpan) elements.currentYearSpan.textContent = new Date().getFullYear();
    setupTableHeader(); 
    updateAllVisualizations(); // Initial call with empty data

    function setupCsvUploadEvents() {
        if (!elements.dropArea || !elements.csvFileInput) return;
        elements.dropArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            elements.dropArea.classList.add('dragover');
            const indicator = elements.dropArea.querySelector('.drop-area-indicator');
            if(indicator) indicator.style.display = 'block';
        });
        elements.dropArea.addEventListener('dragleave', () => {
            elements.dropArea.classList.remove('dragover');
            const indicator = elements.dropArea.querySelector('.drop-area-indicator');
            if(indicator) indicator.style.display = 'none';
        });
        elements.dropArea.addEventListener('drop', (event) => {
            event.preventDefault();
            elements.dropArea.classList.remove('dragover');
            const indicator = elements.dropArea.querySelector('.drop-area-indicator');
            if(indicator) indicator.style.display = 'none';
            const files = event.dataTransfer.files;
            if (files.length > 0) startCsvProcessing(files[0]);
        });
        elements.csvFileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (files.length > 0) startCsvProcessing(files[0]);
        });
    }
    setupCsvUploadEvents();

    function startCsvProcessing(file) {
        if (!file || file.type !== "text/csv") {
            if(elements.fileNameDisplay) elements.fileNameDisplay.textContent = "";
            showStatus(elements.uploadStatus, "Format file tidak valid. Harap unggah file CSV.", 'error');
            return;
        }

        if(elements.fileNameDisplay) elements.fileNameDisplay.textContent = `File dipilih: ${file.name}`;
        showLoading(elements, "Mem-parsing CSV..."); 

        if (typeof Papa !== 'undefined' && typeof Papa.parse === 'function') { 
            parseCSVWithPapaParse(file, 
                (results) => { 
                    if (results.errors.length > 0) {
                        console.error("PapaParse Errors:", results.errors);
                        showStatus(elements.uploadStatus, `Error parsing CSV: ${results.errors.map(e => e.message).join(', ')}`, 'error');
                        hideLoading(elements); 
                        return;
                    }
                    if (!validateCSVStructure(results.meta.fields, elements.uploadStatus, showStatus, REQUIRED_COLUMNS_CONST)) { 
                         hideLoading(elements);
                        return;
                    }
                    rawCsvData = results.data.map(row => convertRowDataTypes(row)); 
                    finishInitialDataProcessing();
                },
                (error) => { 
                    console.error("PapaParse File Error:", error);
                    showStatus(elements.uploadStatus, `Error membaca file: ${error.message}`, 'error');
                    hideLoading(elements);
                }
            );
        } else { 
            const reader = new FileReader();
            reader.onload = function(event) {
                const csvText = event.target.result;
                const lines = csvText.split(/\r\n|\n/);
                if (lines.length < 2) {
                     showStatus(elements.uploadStatus, "File CSV kosong atau tidak memiliki header.", 'error');
                     hideLoading(elements);
                     return;
                }
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                if (!validateCSVStructure(headers, elements.uploadStatus, showStatus, REQUIRED_COLUMNS_CONST)) { 
                     hideLoading(elements);
                    return;
                }
                manualParseCSV(csvText, headers, 
                    (data) => { 
                        rawCsvData = data;
                        finishInitialDataProcessing();
                    },
                    (e) => { 
                        console.error("Manual Parse Error:", e);
                        showStatus(elements.uploadStatus, `Error memproses CSV: ${e.message}`, 'error');
                        hideLoading(elements);
                    }
                );
            };
            reader.onerror = function() {
                showStatus(elements.uploadStatus, "Gagal membaca file.", 'error');
                hideLoading(elements);
            };
            reader.readAsText(file);
        }
    }

    function finishInitialDataProcessing() {
        processedData = [...rawCsvData];
        filteredData = [...processedData];
        populateCategoryFilterUI();
        updateAllVisualizations();
        showStatus(elements.uploadStatus, `Berhasil memproses ${processedData.length} item.`, 'success');
        
        if (elements.filterOptionsSectionTrigger && elements.filterOptionsSectionTrigger.getAttribute('aria-expanded') === 'false') {
             elements.filterOptionsSectionTrigger.click(); 
        }
        hideLoading(elements); 
    }

    function applyFiltersAndRefresh() {
        showLoading(elements, "Menerapkan filter...");
        const searchTerm = elements.searchTermInput ? elements.searchTermInput.value : ""; 
        const startDate = elements.startDateInput ? elements.startDateInput.value : "";
        const endDate = elements.endDateInput ? elements.endDateInput.value : "";
        const category = elements.categoryFilterSelect ? elements.categoryFilterSelect.value : "";

        filteredData = filterData(processedData, searchTerm, startDate, endDate, category); 
        
        currentPage = 1;
        updateAllVisualizations();
        hideLoading(elements);
        showStatus(elements.tableStatus, `${filteredData.length} item ditemukan setelah filter.`, 'info');
    }
    const debouncedApplyFilters = debounce(applyFiltersAndRefresh, 500);

    if(elements.applyFiltersButton) elements.applyFiltersButton.addEventListener('click', applyFiltersAndRefresh);
    if(elements.clearFiltersButton) elements.clearFiltersButton.addEventListener('click', () => {
        if(elements.searchTermInput) elements.searchTermInput.value = '';
        if(elements.startDateInput) elements.startDateInput.value = '';
        if(elements.endDateInput) elements.endDateInput.value = '';
        if(elements.categoryFilterSelect) elements.categoryFilterSelect.value = '';
        applyFiltersAndRefresh(); 
        showStatus(elements.tableStatus, 'Filter dibersihkan.', 'info');
    });
    if(elements.searchTermInput) elements.searchTermInput.addEventListener('input', debouncedApplyFilters);
    if(elements.startDateInput) elements.startDateInput.addEventListener('change', applyFiltersAndRefresh);
    if(elements.endDateInput) elements.endDateInput.addEventListener('change', applyFiltersAndRefresh);
    if(elements.categoryFilterSelect) elements.categoryFilterSelect.addEventListener('change', applyFiltersAndRefresh);

    function populateCategoryFilterUI() {
        if (!elements.categoryFilterSelect) return;
        const categories = [...new Set(processedData.map(item => item.Category || "Uncategorized"))].sort();
        elements.categoryFilterSelect.innerHTML = '<option value="">Semua Kategori</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            elements.categoryFilterSelect.appendChild(option);
        });
    }
    
    function renderGenericTable(tableBodyElement, dataArray, columnsConfig, noDataMessage, maxRows = Infinity) {
        if (!tableBodyElement) return;
        tableBodyElement.innerHTML = '';
        if (!dataArray || dataArray.length === 0) {
            const row = tableBodyElement.insertRow();
            const cell = row.insertCell();
            cell.colSpan = columnsConfig.length; 
            cell.textContent = noDataMessage;
            cell.style.textAlign = "center";
            return;
        }
        dataArray.slice(0, maxRows).forEach((itemData, index) => { 
            const row = tableBodyElement.insertRow();
            if (itemData && itemData["Item Id"]) { 
                row.setAttribute('data-item-id', itemData["Item Id"]); 
            }

            columnsConfig.forEach(col => {
                let value;
                if (col.isIndex) {
                    value = index + 1;
                } else if (itemData && col.key !== undefined) { 
                    value = itemData[col.key];
                } else {
                    value = ''; 
                }
                
                if (col.formatter && itemData && itemData[col.key] !== undefined) { 
                    value = col.formatter(itemData[col.key]);
                } else if (col.formatter && col.isIndex) { 
                    value = col.formatter(index + 1);
                }

                const cell = row.insertCell();
                const linkUrl = itemData["Item URL"] || itemData["URL"] || itemData["Link"];

                if (col.key === "Title") {
                    if (linkUrl) {
                        const link = document.createElement('a');
                        link.href = linkUrl;
                        link.textContent = value || '-';
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.className = 'artboard-link'; 
                        cell.appendChild(link);
                    } else {
                        cell.textContent = value || '-';
                    }
                } else {
                    cell.textContent = (value !== undefined && value !== null) ? String(value) : '-';
                }
            });
        });
    }

    function renderExpandableTopArtboardsTable(tableBodyElement, artboardsData, noDataMessage, maxRows = Infinity) {
        if (!tableBodyElement) return;
        tableBodyElement.innerHTML = '';

        if (!artboardsData || artboardsData.length === 0) {
            const row = tableBodyElement.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5; 
            cell.textContent = noDataMessage;
            cell.style.textAlign = "center";
            return;
        }

        artboardsData.slice(0, maxRows).forEach((artboard, index) => {
            const row = tableBodyElement.insertRow();
            row.classList.add('expandable-artboard-row');

            row.insertCell().textContent = index + 1;

            const keywordCell = row.insertCell();
            const expandIcon = document.createElement('span');
            expandIcon.className = 'expand-icon';
            expandIcon.textContent = '►'; 
            keywordCell.appendChild(expandIcon);
            keywordCell.appendChild(document.createTextNode(` ${artboard.keyword}`));


            row.insertCell().textContent = (artboard.itemCount || 0).toLocaleString();
            row.insertCell().textContent = `$${(artboard.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            
            const avg = artboard.itemCount ? artboard.totalEarnings / artboard.itemCount : 0;
            row.insertCell().textContent = `$${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;


            const subRow = tableBodyElement.insertRow();
            subRow.classList.add('artboard-items-sublist');
            subRow.style.display = 'none';
            const subCell = subRow.insertCell();
            subCell.colSpan = 5; 

            const itemList = document.createElement('ul');
            if (artboard.items && artboard.items.length > 0) {
                artboard.items.forEach(itemDetail => {
                    const listItem = document.createElement('li');
                    const linkUrl = itemDetail.link || itemDetail["Item URL"] || itemDetail["URL"] || itemDetail["Link"];
                    if (linkUrl) {
                        const link = document.createElement('a');
                        link.href = linkUrl;
                        link.textContent = itemDetail.title || 'Judul tidak tersedia';
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.className = 'artboard-link'; 
                        listItem.appendChild(link);
                    } else {
                        listItem.textContent = itemDetail.title || 'Judul tidak tersedia';
                    }
                    
                    const earningsText = ` (Pendapatan: $${(itemDetail.earnings || 0).toFixed(2)})`;
                    listItem.appendChild(document.createTextNode(earningsText));
                    itemList.appendChild(listItem);
                });
            } else {
                const listItem = document.createElement('li');
                listItem.textContent = (artboard.itemCount > 0) ? 'Memuat detail item...' : 'Tidak ada detail item untuk keyword ini.';
                itemList.appendChild(listItem);
            }
            subCell.appendChild(itemList);

            row.addEventListener('click', () => {
                const isHidden = subRow.style.display === 'none';
                subRow.style.display = isHidden ? '' : 'none';
                expandIcon.textContent = isHidden ? '▼' : '►'; // Icon changes on expand/collapse
            });
        });
    }
    
    function displayAllStatsUI(stats) {
        if(elements.totalItemsValue) elements.totalItemsValue.textContent = stats.totalItems.toLocaleString();
        if(elements.totalEarningsValue) elements.totalEarningsValue.textContent = `$${stats.totalEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if(elements.taxAmountValue) {
            elements.taxAmountValue.textContent = `$${stats.taxAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if(elements.afterTaxValue) {
            const afterTax = stats.totalEarnings * 0.85; // Assuming 15% tax
            elements.afterTaxValue.textContent = `$${afterTax.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        if(elements.categoriesCountValue) elements.categoriesCountValue.textContent = stats.categoriesCount.toLocaleString();

        renderGenericTable(elements.topItemsTableBody, stats.topItems, [
            { isIndex: true },
            { key: "Title" },
            { key: "Category" },
            { key: "Total Earnings ($USD)", formatter: val => `$${(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` }
        ], "Tidak ada data top items.", 30); 

        const sortedByEarnings = [...stats.categoryPerformance].sort((a, b) => b.totalEarnings - a.totalEarnings);
        renderGenericTable(elements.topCategoriesByEarningsTableBody, sortedByEarnings, [
            { isIndex: true },
            { key: "name" },
            { key: "totalEarnings", formatter: val => `$${(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` },
            { key: "itemCount", formatter: val => (val || 0).toLocaleString() },
            { 
                key: "averageEarningsPerItem", 
                formatter: val => `$${(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` 
            }
        ], "Tidak ada data peringkat kategori berdasarkan pendapatan.", 10);


        const tbody = elements.topCategoriesByEarningsTableBody;
        if (tbody && sortedByEarnings.length > 0) {
            const totalEarningsVal = sortedByEarnings.reduce((sum, cat) => sum + (cat.totalEarnings || 0), 0);
            const totalItemsVal = sortedByEarnings.reduce((sum, cat) => sum + (cat.itemCount || 0), 0);
            const avgEarnings = totalItemsVal > 0 ? totalEarningsVal / totalItemsVal : 0;

            const totalRow = document.createElement('tr');
            totalRow.style.fontWeight = 'bold';
            totalRow.style.background = 'var(--card-border, #f0f0f0)'; 
            totalRow.innerHTML = `
                <td colspan="2" style="text-align:left;">Total Seluruh Kategori</td>
                <td>$${totalEarningsVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${totalItemsVal.toLocaleString()}</td>
                <td>$${avgEarnings.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
            tbody.appendChild(totalRow);
        }

        renderGenericTable(elements.topPositiveChangeItemsTableBody, stats.topPositiveChangeItems, [
            { isIndex: true },
            { key: "Title" },
            { key: "Category" },
            { key: "Earnings Change", formatter: val => `$${(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` }
        ], "Tidak ada item dengan kenaikan pendapatan positif.", 30);


        if (elements.topArtboardsTableBody) { 
            renderExpandableTopArtboardsTable(elements.topArtboardsTableBody, stats.topArtboardsByEarnings, "Tidak ada data artboard/keyword yang ditemukan."); 
        }

        if (elements.noPopularItemsTableBody) {
            const noPopularItems = filteredData.filter(item => parseEarningsToNumber(item["Total Earnings ($USD)"]) === 0);
            renderNoPopularItemsTable(elements.noPopularItemsTableBody, noPopularItems, "Semua item memiliki penjualan.");
        }
    }
    
    function setupTableHeader() { 
        if (!elements.interactiveDataTable || !elements.interactiveDataTable.tHead) return;
        const tHead = elements.interactiveDataTable.tHead;
        while (tHead.firstChild) {
            tHead.removeChild(tHead.firstChild);
        }
        const headerRow = tHead.insertRow(0); 
        REQUIRED_COLUMNS.forEach(colName => { 
            const th = document.createElement('th');
            th.textContent = colName;
            th.scope = "col";
            th.dataset.column = colName; 
            th.setAttribute('aria-sort', 'none');
            const sortIndicator = document.createElement('span');
            sortIndicator.className = 'sort-indicator';
            th.appendChild(sortIndicator);
            th.addEventListener('click', () => handleSortRequest(colName));
            headerRow.appendChild(th);
        });
    }

    function renderTableUI() { 
        if (!elements.dataTableBody) return;
        elements.dataTableBody.innerHTML = '';
        if (filteredData.length === 0) {
            const row = elements.dataTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = REQUIRED_COLUMNS.length; 
            cell.textContent = "Tidak ada data untuk ditampilkan.";
            cell.style.textAlign = "center";
            if(elements.tableStatus) elements.tableStatus.textContent = "Tidak ada data.";
            renderPaginationUI();
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filteredData.slice(startIndex, endIndex);

        paginatedItems.forEach(item => {
            const row = elements.dataTableBody.insertRow();
            row.classList.add('clickable-row');
            if (item && item["Item Id"]) {
                row.setAttribute('data-item-id', item["Item Id"]);
            }
            row.setAttribute('tabindex', '0');
            row.addEventListener('click', () => showItemDetailsModal(item["Item Id"])); 
            row.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') showItemDetailsModal(item["Item Id"]); 
            });

            REQUIRED_COLUMNS.forEach(colName => { 
                const cell = row.insertCell();
                let value = item[colName]; 
                if (colName === "Total Earnings ($USD)" || colName === "Earnings Change") {
                    value = (typeof value === 'number') ? `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : (value || '-');
                }
                cell.textContent = (value !== undefined && value !== null) ? String(value) : '-';
            });
        });
        renderPaginationUI();
        if(elements.tableStatus) elements.tableStatus.textContent = `Menampilkan ${paginatedItems.length > 0 ? startIndex + 1 : 0}-${Math.min(endIndex, filteredData.length)} dari ${filteredData.length} item.`;
    }

    function handleSortRequest(columnName) {
        if (currentSortColumn === columnName) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = columnName;
            currentSortDirection = 'asc';
        }

        if(elements.interactiveDataTable && elements.interactiveDataTable.tHead) {
            elements.interactiveDataTable.tHead.querySelectorAll('th').forEach(th => {
                const indicator = th.querySelector('.sort-indicator');
                if (!indicator) return; 
                if (th.dataset.column === columnName) {
                    th.setAttribute('aria-sort', currentSortDirection === 'asc' ? 'ascending' : 'descending');
                    indicator.textContent = currentSortDirection === 'asc' ? ' ▲' : ' ▼';
                } else {
                    th.setAttribute('aria-sort', 'none');
                    indicator.textContent = '';
                }
            });
        }

        sortData(filteredData, currentSortColumn, currentSortDirection); 
        currentPage = 1;
        renderTableUI();
    }

    if(elements.itemsPerPageSelect) elements.itemsPerPageSelect.addEventListener('change', (event) => {
        itemsPerPage = parseInt(event.target.value, 10);
        currentPage = 1;
        renderTableUI();
    });

    function renderPaginationUI() {
        if (!elements.paginationContainer) return;
        elements.paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);

        if (totalPages <= 1 && filteredData.length > 0) { 
             elements.paginationContainer.innerHTML = `<span style="padding: 0.5rem;">Halaman 1 dari 1</span>`; 
             return;
        }
        if (totalPages <= 0) { 
            elements.paginationContainer.innerHTML = `<span style="padding: 0.5rem;">Tidak ada data untuk paginasi.</span>`;
            return;
        }

        const createButton = (text, page, isDisabled = false, isCurrent = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = isDisabled;
            if (isCurrent) {
                button.setAttribute('aria-current', 'page');
                button.classList.add('current-page');
            } else {
                button.setAttribute('aria-label', `Ke halaman ${page}`);
            }
            button.addEventListener('click', () => {
                currentPage = page;
                renderTableUI();
                const firstRow = elements.dataTableBody ? elements.dataTableBody.querySelector('tr[tabindex="0"]') : null;
                if (firstRow) firstRow.focus();
            });
            return button;
        };
        
        elements.paginationContainer.appendChild(createButton('<< Pertama', 1, currentPage === 1));
        elements.paginationContainer.appendChild(createButton('< Sebelumnya', currentPage - 1, currentPage === 1));

        const pageRange = 2;
        let startPage = Math.max(1, currentPage - pageRange);
        let endPage = Math.min(totalPages, currentPage + pageRange);
        if (currentPage - pageRange <= 1) endPage = Math.min(totalPages, 1 + (pageRange*2));
        if (currentPage + pageRange >= totalPages) startPage = Math.max(1, totalPages - (pageRange*2));
        
        if (startPage > 1) {
            elements.paginationContainer.appendChild(createButton('1', 1));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0 0.5rem';
                elements.paginationContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            elements.paginationContainer.appendChild(createButton(String(i), i, false, i === currentPage));
        }

        if (endPage < totalPages) {
             if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '0 0.5rem';
                elements.paginationContainer.appendChild(ellipsis);
            }
            elements.paginationContainer.appendChild(createButton(String(totalPages), totalPages));
        }
        
        elements.paginationContainer.appendChild(createButton('Berikutnya >', currentPage + 1, currentPage === totalPages));
        elements.paginationContainer.appendChild(createButton('Terakhir >>', totalPages, currentPage === totalPages));
        
        const pageInfo = document.createElement('span');
        pageInfo.style.marginLeft = "10px";
        pageInfo.textContent = ` Halaman ${currentPage} dari ${totalPages}`;
        pageInfo.setAttribute('aria-live', 'polite');
        elements.paginationContainer.appendChild(pageInfo);
    }

    function renderChartsUI(stats) {
        const allChartCanvases = [
            elements.yearlyEarningsChartCanvas, 
            elements.categoryDistributionChartCanvas, 
            elements.topArtboardsChartCanvas,
            elements.monthlyEarningsTrendChartCanvas,
            elements.itemPublicationTrendChartCanvas,
            elements.avgEarningsChangeByCategoryChartCanvas
        ];

        if (typeof Chart === 'undefined' || typeof Chart !== 'function') {
            console.warn("Chart.js is not loaded or not a constructor.");
            allChartCanvases.forEach(canvas => {
                if (canvas && canvas.parentElement) {
                    let pError = canvas.parentElement.querySelector('p.chart-error-message');
                    if (!pError) {
                        pError = document.createElement('p');
                        pError.className = 'chart-error-message';
                        pError.textContent = "Library Chart.js tidak termuat. Visualisasi tidak tersedia.";
                        canvas.parentElement.insertBefore(pError, canvas);
                    }
                    canvas.style.display = 'none';
                }
            });
            return;
        } else {
             allChartCanvases.forEach(canvas => {
                if (canvas && canvas.parentElement) {
                    const pError = canvas.parentElement.querySelector('p.chart-error-message');
                    if (pError) pError.remove();
                    canvas.style.display = 'block'; 
                }
            });
        }

        // Destroy existing chart instances
        if (yearlyEarningsChartInstance) yearlyEarningsChartInstance.destroy();
        if (categoryDistributionChartInstance) categoryDistributionChartInstance.destroy();
        if (topArtboardsChartInstance) topArtboardsChartInstance.destroy();
        if (monthlyEarningsTrendChartInstance) monthlyEarningsTrendChartInstance.destroy();
        if (itemPublicationTrendChartInstance) itemPublicationTrendChartInstance.destroy();
        if (avgEarningsChangeByCategoryChartInstance) avgEarningsChangeByCategoryChartInstance.destroy();

        // Helper to display "No Data" message on a canvas
        const noDataForChart = (canvas) => {
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#333';
            ctx.font = "16px " + (getComputedStyle(document.documentElement).getPropertyValue('--font-family-sans').trim() || "Arial");
            ctx.fillText('Tidak ada data untuk ditampilkan pada chart ini.', canvas.width / 2, canvas.height / 2);
            ctx.restore();
        };

        // --- Yearly Earnings Chart ---
        if (elements.yearlyEarningsChartCanvas && stats && stats.yearlyEarnings && Object.keys(stats.yearlyEarnings).length > 0) {
            const yearlyCtx = elements.yearlyEarningsChartCanvas.getContext('2d');
            yearlyEarningsChartInstance = new Chart(yearlyCtx, {
                type: 'bar',
                data: {
                    labels: Object.keys(stats.yearlyEarnings).sort(),
                    datasets: [{
                        label: 'Total Earnings ($USD)',
                        data: Object.keys(stats.yearlyEarnings).sort().map(year => stats.yearlyEarnings[year]),
                        backgroundColor: 'rgba(0, 123, 255, 0.7)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: value => '$' + value.toLocaleString() } } }, plugins: { legend: { display: true }, title: { display: true, text: 'Pendapatan Tahunan' } } }
            });
        } else if (elements.yearlyEarningsChartCanvas) {
            noDataForChart(elements.yearlyEarningsChartCanvas);
        }

        // --- Category Distribution Chart ---
        if (elements.categoryDistributionChartCanvas && stats && stats.categoryPerformance && stats.categoryPerformance.length > 0) {
            const categoryCtx = elements.categoryDistributionChartCanvas.getContext('2d');
            const categoryLabels = stats.categoryPerformance.map(cat => cat.name);
            const categoryEarningsData = stats.categoryPerformance.map(cat => cat.totalEarnings);
            const categoryColors = categoryLabels.map((_, i) => `hsl(${(i * 360 / (categoryLabels.length || 1)) % 360}, 70%, 60%)`);

            categoryDistributionChartInstance = new Chart(categoryCtx, {
                type: 'pie',
                data: {
                    labels: categoryLabels,
                    datasets: [{ label: 'Earnings Distribution', data: categoryEarningsData, backgroundColor: categoryColors, hoverOffset: 4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Distribusi Pendapatan per Kategori' }, tooltip: { callbacks: { label: function(context) { let label = context.label || ''; if (label) label += ': '; if (context.parsed !== null) label += '$' + context.parsed.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); return label; } } } } }
            });
        } else if (elements.categoryDistributionChartCanvas) {
            noDataForChart(elements.categoryDistributionChartCanvas);
        }

        // --- Monthly Total Earnings Trend Chart ---
        if (elements.monthlyEarningsTrendChartCanvas && stats && stats.monthlyEarnings && Object.keys(stats.monthlyEarnings).length > 0) {
            const monthlyCtx = elements.monthlyEarningsTrendChartCanvas.getContext('2d');
            const sortedMonths = Object.keys(stats.monthlyEarnings).sort();
            monthlyEarningsTrendChartInstance = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: sortedMonths,
                    datasets: [{
                        label: 'Total Earnings Bulanan ($USD)',
                        data: sortedMonths.map(month => stats.monthlyEarnings[month]),
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { callback: value => '$' + value.toLocaleString() } }, x: { ticks: { autoSkip: true, maxTicksLimit: 12 } } },
                    plugins: { legend: { display: true }, title: { display: true, text: 'Trend Pendapatan Total Bulanan' } }
                }
            });
        } else if (elements.monthlyEarningsTrendChartCanvas) {
            noDataForChart(elements.monthlyEarningsTrendChartCanvas);
        }
        
        // --- Item Publication Trend Chart ---
        if (elements.itemPublicationTrendChartCanvas && stats && stats.monthlyPublicationCounts && Object.keys(stats.monthlyPublicationCounts).length > 0) {
            const pubCtx = elements.itemPublicationTrendChartCanvas.getContext('2d');
            const sortedPubMonths = Object.keys(stats.monthlyPublicationCounts).sort();
            itemPublicationTrendChartInstance = new Chart(pubCtx, {
                type: 'bar',
                data: {
                    labels: sortedPubMonths,
                    datasets: [{
                        label: 'Jumlah Item Dipublikasikan',
                        data: sortedPubMonths.map(month => stats.monthlyPublicationCounts[month]),
                        backgroundColor: 'rgba(255, 159, 64, 0.7)',
                        borderColor: 'rgba(255, 159, 64, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { ticks: { autoSkip: true, maxTicksLimit: 12 } } },
                    plugins: { legend: { display: true }, title: { display: true, text: 'Trend Publikasi Item Bulanan' } }
                }
            });
        } else if (elements.itemPublicationTrendChartCanvas) {
            noDataForChart(elements.itemPublicationTrendChartCanvas);
        }

        // --- Average Earnings Change per Category Chart ---
        if (elements.avgEarningsChangeByCategoryChartCanvas && stats && stats.avgEarningsChangePerCategory && stats.avgEarningsChangePerCategory.length > 0) {
            const avgChangeCtx = elements.avgEarningsChangeByCategoryChartCanvas.getContext('2d');
            const avgChangeLabels = stats.avgEarningsChangePerCategory.map(cat => cat.name);
            const avgChangeData = stats.avgEarningsChangePerCategory.map(cat => cat.avgChange);
            const avgChangeColors = avgChangeLabels.map((_, i) => `hsl(${((i * 360 / (avgChangeLabels.length || 1)) + 90) % 360}, 70%, 65%)`);
            
            // Dynamic height for horizontal bar chart
            const barHeight = 30; // pixels per bar
            const padding = 80; // for title, legend, axes
            const dynamicHeight = Math.max(300, Math.min(avgChangeLabels.length * barHeight + padding, 1200));
            elements.avgEarningsChangeByCategoryChartCanvas.parentElement.classList.add('horizontal-bar-dynamic-height'); // Add class for CSS
            elements.avgEarningsChangeByCategoryChartCanvas.height = dynamicHeight;


            avgEarningsChangeByCategoryChartInstance = new Chart(avgChangeCtx, {
                type: 'bar',
                data: {
                    labels: avgChangeLabels,
                    datasets: [{
                        label: 'Rata-rata Perubahan Pendapatan ($USD)',
                        data: avgChangeData,
                        backgroundColor: avgChangeColors,
                        borderColor: avgChangeColors.map(c => c.replace('0.65', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y', // Horizontal bar chart
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { beginAtZero: true, ticks: { callback: value => '$' + value.toLocaleString() } },
                        y: { ticks: { autoSkip: false } } // Show all category labels
                    },
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Rata-rata Perubahan Pendapatan per Kategori' },
                        tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.x !== null) label += '$' + context.parsed.x.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); return label; } } }
                    }
                }
            });
        } else if (elements.avgEarningsChangeByCategoryChartCanvas) {
            elements.avgEarningsChangeByCategoryChartCanvas.parentElement.classList.remove('horizontal-bar-dynamic-height');
            noDataForChart(elements.avgEarningsChangeByCategoryChartCanvas);
        }


        // --- Top Artboards/Keywords by Earnings Chart ---
        if (elements.topArtboardsChartCanvas && stats && stats.topArtboardsByEarnings && stats.topArtboardsByEarnings.length > 0) {
            const topArtboardsCtx = elements.topArtboardsChartCanvas.getContext('2d');
            const topNArtboards = stats.topArtboardsByEarnings; 
            const artboardLabels = topNArtboards.map(ab => ab.keyword);

            const dynamicHeightArtboards = Math.max(400, Math.min(artboardLabels.length * 35 + 80, 1200)); // 35px per bar + padding
            elements.topArtboardsChartCanvas.height = dynamicHeightArtboards;

            const artboardEarningsData = topNArtboards.map(ab => ab.totalEarnings);
            const artboardColors = artboardLabels.map((_, i) => `hsl(${((i * 360 / (artboardLabels.length || 1)) + 45) % 360}, 65%, 65%)`);

            topArtboardsChartInstance = new Chart(topArtboardsCtx, {
                type: 'bar', 
                data: {
                    labels: artboardLabels,
                    datasets: [{
                        label: 'Total Earnings ($USD)',
                        data: artboardEarningsData,
                        backgroundColor: artboardColors,
                        borderColor: artboardColors.map(color => color.replace('0.65', '1')),
                        borderWidth: 1,
                        borderRadius: 4 
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { callback: value => '$' + value.toLocaleString() } },
                        x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } } // Allow rotation if labels are long
                    },
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Top Artboards/Keywords by Earnings' },
                        tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) { label += '$' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}); } return label; } } }
                    }
                }
            });
        } else if (elements.topArtboardsChartCanvas) {
            noDataForChart(elements.topArtboardsChartCanvas);
        }
    }

    function showItemDetailsModal(itemId) { 
        const item = filteredData.find(d => d && d["Item Id"] === itemId); 
        if (!item) return;

        if(elements.modalTitle) elements.modalTitle.textContent = `Detail untuk: ${item.Title || 'N/A'}`;
        let detailsHtml = '<ul>';
        for (const key in item) {
            if (Object.hasOwnProperty.call(item, key)) {
                let value = item[key];
                if (key === "Total Earnings ($USD)" || key === "Earnings Change") {
                     value = (typeof value === 'number') ? `$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : (value || '-');
                }
                detailsHtml += `<li><strong>${key.replace(/_/g, ' ')}:</strong> ${value !== undefined && value !== null ? String(value) : '-'}</li>`;
            }
        }
        detailsHtml += '</ul>';
        const itemLink = item["Item URL"] || item["URL"] || item["Link"];
        if (itemLink) {
            detailsHtml += `<p><a href="${itemLink}" target="_blank" rel="noopener noreferrer" class="artboard-link">Lihat Item di Sumber Asli</a></p>`;
        }
        if(elements.modalBody) elements.modalBody.innerHTML = detailsHtml;
        if(elements.itemDetailsModal) elements.itemDetailsModal.style.display = 'flex';
        if(elements.closeModalButton) elements.closeModalButton.focus();
    }
    
    function closeModalHandler() {
        if(elements.itemDetailsModal) elements.itemDetailsModal.style.display = 'none';
    }

    function handleExport(format) {
        const currentStats = calculateSummaryStatistics(filteredData); 
        const exportSelection = elements.exportTypeSelect ? elements.exportTypeSelect.value : "all";
        const exportPayload = prepareDataForExport(exportSelection, filteredData, currentStats); 

        if (!exportPayload || !exportPayload.dataToExport || exportPayload.dataToExport.length === 0) {
            showStatus(elements.exportStatus, "Tidak ada data untuk diekspor.", 'info');
            return;
        }
        
        const { dataToExport, fileName } = exportPayload;

        if (format === 'csv') {
            let csvContent = "";
            if (dataToExport.length > 0) {
                const headers = Object.keys(dataToExport[0]);
                csvContent += headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(",") + "\r\n"; 
                dataToExport.forEach(row => {
                    const values = headers.map(header => {
                        let cell = row[header] === null || row[header] === undefined ? "" : String(row[header]);
                        cell = `"${String(cell).replace(/"/g, '""')}"`; 
                        return cell;
                    });
                    csvContent += values.join(",") + "\r\n";
                });
            }
            triggerDownload(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;'); 
        } else if (format === 'json') {
            const jsonContent = JSON.stringify(dataToExport, null, 2);
            triggerDownload(jsonContent, `${fileName}.json`, 'application/json;charset=utf-8;'); 
        }
        showStatus(elements.exportStatus, `Data berhasil diekspor sebagai ${format.toUpperCase()}.`, 'success');
    }
    if(elements.exportCsvButton) elements.exportCsvButton.addEventListener('click', () => handleExport('csv'));
    if(elements.exportJsonButton) elements.exportJsonButton.addEventListener('click', () => handleExport('json'));

    function updateAllVisualizations() {
        const currentStats = calculateSummaryStatistics(filteredData); 
        displayAllStatsUI(currentStats); 
        renderTableUI(); 
        renderChartsUI(currentStats);
    }
    
    function parseEarningsToNumber(val) {
        if (typeof val === "number") return val;
        if (val === null || val === undefined || typeof val !== 'string') return 0;
        return parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;
    }

    function renderNoPopularItemsTable(tableBodyElement, dataArray, noDataMessage) {
        if (!tableBodyElement) return;
        tableBodyElement.innerHTML = '';
        if (!dataArray || dataArray.length === 0) {
            const row = tableBodyElement.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4;
            cell.textContent = noDataMessage;
            cell.style.textAlign = "center";
            return;
        }
        dataArray.forEach((item, idx) => {
            const row = tableBodyElement.insertRow();
            row.insertCell().textContent = idx + 1;
            const titleCell = row.insertCell();
            const linkUrl = item["Item URL"] || item["URL"] || item["Link"];
            if (linkUrl) {
                const link = document.createElement('a');
                link.href = linkUrl;
                link.textContent = item.Title || '-';
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                link.className = 'no-popular-link artboard-link'; // Ensure consistent link styling
                titleCell.appendChild(link);
            } else {
                titleCell.textContent = item.Title || '-';
            }
            row.insertCell().textContent = item.Category || '-';
            const earning = parseEarningsToNumber(item["Total Earnings ($USD)"]);
            row.insertCell().textContent = `$${earning.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        });
    }

    function renderFilteredTopPositiveChangeItemsTable(stats) {
        const select = document.getElementById('topPositiveChangeItemsCategoryFilter');
        const selectedCategory = select ? select.value : "";

        let filteredItems = stats.topPositiveChangeItems;
        if (selectedCategory) {
            filteredItems = stats.topPositiveChangeItems.filter(item =>
                (item.Category || "").toLowerCase() === selectedCategory
            );
        }
        renderGenericTable(
            elements.topPositiveChangeItemsTableBody,
            filteredItems,
            [
                { isIndex: true },
                { key: "Title" },
                { key: "Category" },
                { key: "Earnings Change", formatter: val => `$${(val || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` }
            ],
            "Tidak ada item dengan kenaikan pendapatan positif.",
            30
        );
    }

    renderFilteredTopPositiveChangeItemsTable(stats);

    console.log("CSV Analytics Tool Initialized with enhanced chart features.");
});