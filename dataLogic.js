// dataLogic.js

const REQUIRED_COLUMNS_CONST = ["Item Id", "Category", "Title", "Published Date", "Total Earnings ($USD)", "Earnings Change"];

// STRUKTUR BARU: ARTBOARD_DEFINITIONS
// Urutan dalam array ini PENTING. Definisi yang lebih spesifik/panjang sebaiknya diletakkan lebih dulu.
// Regex menggunakan \b untuk word boundary (mencocokkan kata utuh) dan i untuk case-insensitive.
const ARTBOARD_DEFINITIONS = [
    { canonical: "CV Resume", variations: [/\bcv resumes?\b/i, /\bresumes?\b/i, /\bcurriculum vitae\b/i] },
    { canonical: "Text Effect", variations: [/\btext effects?\b/i, /\bfont effects?\b/i, /\btypography effects?\b/i] },
    { canonical: "Photo Effect", variations: [/\bphoto effects?\b/i, /\bimage effects?\b/i] },
    { canonical: "Photoshop Action", variations: [/\bphotoshop actions?\b/i, /\bps actions?\b/i] },
    { canonical: "Lightroom Preset", variations: [/\blightroom presets?\b/i, /\blr presets?\b/i] },
    { canonical: "Instagram Post", variations: [/\binstagram posts?\b/i, /\big posts?\b/i] },
    { canonical: "Instagram Story", variations: [/\binstagram stories\b/i, /\big stories\b/i, /\bInstagram Story?\b/i, /\bInstagram Storys?\b/i, /\bInstagram Story?\b/i] },
    { canonical: "Social Media", variations: [/\bsocial media\b/i, /\bfacebook\b/i, /\btwitter\b/i, /\bpinterest\b/i, /\blinkedin\b/i] }, // Lebih umum, letakkan setelah yang spesifik
    { canonical: "Mobile Apps", variations: [/\bMobile Apps?\b/i, /\bMobile App?\b/i, /\bApps?\b/i] },
    { canonical: "Id Card", variations: [/\bId Card?\b/i ] },
    { canonical: "YouTube Thumbnail", variations: [/\byoutube thumbnails?\b/i] },
    { canonical: "Data Sheet", variations: [/\bData Sheet?\b/i, /\bData Sheets?\b/i] },
    { canonical: "Business Card", variations: [/\bbusiness cards?\b/i] },
    { canonical: "Landing Page", variations: [/\blanding pages?\b/i] },
    { canonical: "Website Template", variations: [/\bwebsite templates?\b/i, /\bweb templates?\b/i] },
    { canonical: "Email Template", variations: [/\bemail templates?\b/i] },
    { canonical: "UI Kit", variations: [/\bui kits?\b/i, /\bui design\b/i] },
    { canonical: "UX Kit", variations: [/\bux kits?\b/i, /\bux design\b/i] },
    { canonical: "Annual Report / Company Profile", variations: [/\bannual reports?\b/i,/\bproposal?\b/i,/\breport?\b/i,/\bCompany Profile?\b/i ] },
    { canonical: "Bifold Brochure", variations: [/\bbifolds?\b/i, /\bbifold brochures?\b/i] },
    { canonical: "Trifold Brochure", variations: [/\btrifolds?\b/i, /\btrifold brochures?\b/i] },
    { canonical: "Brochure", variations: [/\bbrochures?\b/i] }, // Lebih umum, setelah bifold/trifold
    { canonical: "Flyer", variations: [/\bflyers?\b/i, /\bflyer designs?\b/i] },
    { canonical: "Poster", variations: [/\bposters?\b/i] },
    { canonical: "Banner", variations: [/\bbanners?\b/i, /\bweb banners?\b/i, /\bad banners?\b/i, /\broll up banners?\b/i] }, // Termasuk variasi banner
    { canonical: "Billboard", variations: [/\bbillboards?\b/i] },
    { canonical: "Mockup", variations: [/\bmockups?\b/i, /\bmock-ups?\b/i, /\bscene creators?\b/i] },
    { canonical: "Logo", variations: [/\blogos?\b/i, /\blogo templates?\b/i] },
    { canonical: "Hero Header", variations: [/\bHero Header?\b/i, /\bHero Headers?\b/i,/\bHero Section?\b/i, /\bHero Page?\b/i,] },
    { canonical: "Illustration", variations: [/\billustrations?\b/i] },
    { canonical: "Pattern", variations: [/\bpatterns?\b/i, /\bseamless patterns?\b/i] },
    { canonical: "Font", variations: [/\bfonts?\b/i, /\btypefaces?\b/i, /\btypography\b/i] }, // Typography bisa tumpang tindih dengan Text Effect, urutan penting
    // "Presentation" akan ditangani oleh aturan kategori, tapi bisa ada di sini sebagai fallback jika kategori bukan "presentation-templates"
    { canonical: "Presentation", variations: [/\bpresentations?\b/i, /\bpowerpoints?\b/i, /\bkeynotes?\b/i, /\bslides?\b/i, /\bppt\b/i, /\bpptx\b/i] },
    { canonical: "Infographic", variations: [/\binfographics?\b/i] },
    { canonical: "Magazine", variations: [/\bmagazines?\b/i, /\bmagazine templates?\b/i] },
    { canonical: "Stationery", variations: [/\bstationery\b/i] },
    { canonical: "Registration Form", variations: [/\bRegistration Form\b/i, /\bform\b/i] },
    { canonical: "Study Case", variations: [/\bStudy Case\b/i, /\bSheet\b/i,/\bSheets\b/i ] },
    { canonical: "Invoice", variations: [/\bInvoice?\b/i, /\bInvoices\b/i] },
    { canonical: "Admin Dashboard", variations: [/\bAdmin Dashboard?\b/i, /\bDashboard?\b/i,] },
    { canonical: "Background", variations: [/\bbackgrounds?\b/i] },
    { canonical: "Texture", variations: [/\btextures?\b/i] },
    { canonical: "Certificate", variations: [/\bcertificates?\b/i] },
    { canonical: "Invitation", variations: [/\binvitations?\b/i] },
    { canonical: "Menu", variations: [/\bmenus?\b/i] },
    { canonical: "Newsletter", variations: [/\bnewsletters?\b/i] },
    { canonical: "Calendar", variations: [/\bcalendars?\b/i] },
    { canonical: "Planner", variations: [/\bplanners?\b/i] },
    { canonical: "Ebook", variations: [/\bebooks?\b/i, /\be-books?\b/i] },
    // Keyword umum seperti "Template" atau "Graphic" sebaiknya diletakkan di akhir atau dipertimbangkan dampaknya
    { canonical: "Template", variations: [/\btemplates?\b/i] },
    { canonical: "Graphic", variations: [/\bgraphics?\b/i] },
    { canonical: "Gift Voucher", variations: [/\bGift Voucher\b/i, /\bGift Vouchers\b/i] },
];

function validateCSVStructure(headers, uploadStatusElement, showStatusFunc) {
    if (!headers) {
        if (showStatusFunc && uploadStatusElement) showStatusFunc(uploadStatusElement, "Tidak dapat membaca header CSV.", 'error');
        return false;
    }
    const missingColumns = REQUIRED_COLUMNS_CONST.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
        if (showStatusFunc && uploadStatusElement) showStatusFunc(uploadStatusElement, `Kolom CSV hilang: ${missingColumns.join(', ')}. Mohon periksa file Anda.`, 'error');
        return false;
    }
    return true;
}

function convertRowDataTypes(row) {
    const newRow = {...row};
    try {
        let earnings = parseFloat(String(newRow["Total Earnings ($USD)"]).replace(/[^0-9.-]+/g,""));
        newRow["Total Earnings ($USD)"] = isNaN(earnings) ? 0 : earnings;
        
        let change = parseFloat(String(newRow["Earnings Change"]).replace(/[^0-9.-]+/g,""));
        newRow["Earnings Change"] = isNaN(change) ? 0 : change;
        
    } catch (e) {
        console.warn("Problem converting data types for row:", row, e);
        if (newRow["Total Earnings ($USD)"] === undefined) newRow["Total Earnings ($USD)"] = 0;
        if (newRow["Earnings Change"] === undefined) newRow["Earnings Change"] = 0;
    }
    return newRow;
}

function parseCSVWithPapaParse(file, onComplete, onError) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: onComplete,
        error: onError
    });
}

function manualParseCSV(csvText, headers, onComplete, onError) {
    try {
        const lines = csvText.split(/\r\n|\n/);
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            let row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] ? values[index].replace(/^"|"$/g, '').trim() : '';
            });
            data.push(convertRowDataTypes(row));
        }
        onComplete(data);
    } catch (e) {
        onError(e);
    }
}

function filterData(processedData, searchTerm, startDate, endDate, category) {
    const searchTermLower = searchTerm.toLowerCase();
    return processedData.filter(item => {
        let matchesSearch = true;
        if (searchTermLower) {
            matchesSearch = (item.Title && item.Title.toLowerCase().includes(searchTermLower)) ||
                            (item.Category && item.Category.toLowerCase().includes(searchTermLower));
        }

        let matchesDate = true;
        if (item["Published Date"]) { 
            const itemDate = item["Published Date"];
            if (startDate && itemDate < startDate) matchesDate = false;
            if (endDate && itemDate > endDate) matchesDate = false;
        } else if (startDate || endDate) { 
            matchesDate = false;
        }
        
        let matchesCategory = true;
        if (category) {
            matchesCategory = item.Category === category;
        }

        return matchesSearch && matchesDate && matchesCategory;
    });
}

function calculateSummaryStatistics(data) {
    if (!data || data.length === 0) {
        return { 
            totalItems: 0, totalEarnings: 0, taxAmount: 0, categoriesCount: 0, 
            categoryStatsRaw: {}, 
            yearlyEarnings: {}, topItems: [],
            topPositiveChangeItems: [], 
            categoryPerformance: [],
            topArtboardsByEarnings: [] 
        };
    }

    const totalItems = data.length;
    const totalEarnings = data.reduce((sum, item) => sum + (item["Total Earnings ($USD)"] || 0), 0);
    const taxAmount = totalEarnings * 0.15;
    
    const categoryStatsRaw = data.reduce((acc, item) => {
        const category = item.Category || "Uncategorized";
        if (!acc[category]) {
            acc[category] = { count: 0, earnings: 0 };
        }
        acc[category].count++;
        acc[category].earnings += (item["Total Earnings ($USD)"] || 0);
        return acc;
    }, {});
    
    const categoriesCount = Object.keys(categoryStatsRaw).length;

    const yearlyEarnings = data.reduce((acc, item) => {
        try {
            if (item["Published Date"] && typeof item["Published Date"] === 'string' && item["Published Date"].length >= 4) {
                const year = item["Published Date"].substring(0, 4);
                if (!/^\d{4}$/.test(year)) return acc;
                if (!acc[year]) acc[year] = 0;
                acc[year] += (item["Total Earnings ($USD)"] || 0);
            }
        } catch (e) { console.warn("Could not parse year for yearly earnings:", item["Published Date"], item); }
        return acc;
    }, {});

    const topItems = [...data]
        .sort((a, b) => (b["Total Earnings ($USD)"] || 0) - (a["Total Earnings ($USD)"] || 0))
        .slice(0, 30);

    const topPositiveChangeItems = [...data]
        .filter(item => (item["Earnings Change"] || 0) > 0) 
        .sort((a, b) => (b["Earnings Change"] || 0) - (a["Earnings Change"] || 0))
        .slice(0, 30);

    const categoryPerformance = Object.entries(categoryStatsRaw).map(([name, stats]) => ({
        name: name,
        itemCount: stats.count,
        totalEarnings: stats.earnings,
        averageEarningsPerItem: stats.count > 0 ? (stats.earnings / stats.count) : 0
    }));

    const artboardAggregates = {}; 
    const otherKeywordString = "Lainnya (Other)";
    const presentationCanonicalKeyword = "Presentation"; 

    data.forEach(item => {
        const itemCategoryLower = String(item.Category || "").toLowerCase();
        const titleString = String(item.Title || "").trim();
        const itemTitleForList = item.Title || "Judul Tidak Diketahui";
        const earnings = item["Total Earnings ($USD)"] || 0;
        let assignedKeyword = null; 
        
        const itemInfoForList = { 
            id: item["Item Id"], 
            title: itemTitleForList, 
            earnings: earnings,
            link: item["Item URL"] || item["URL"] || item["Link"] // <-- Tambahkan baris ini
        };

        // 1. Aturan Khusus untuk kategori "presentation-templates"
        if (itemCategoryLower === "presentation-templates") {
            assignedKeyword = presentationCanonicalKeyword;
        } 
        // 2. Jika tidak ditangani oleh aturan kategori, coba filter berdasarkan judul
        else if (titleString) { 
            const titleLower = titleString.toLowerCase();
            for (const definition of ARTBOARD_DEFINITIONS) { 
                for (const regexPattern of definition.variations) {
                    if (regexPattern.test(titleLower)) {
                        assignedKeyword = definition.canonical;
                        break; // Keluar dari loop variasi, keyword ditemukan untuk definisi ini
                    }
                }
                if (assignedKeyword) {
                    break; // Keluar dari loop definisi, item sudah diklasifikasikan
                }
            }
        }

        // 3. Jika masih belum terklasifikasi, masukkan ke "Lainnya (Other)"
        if (!assignedKeyword) {
            assignedKeyword = otherKeywordString;
        }

        // Agregasi data ke keyword yang sudah ditentukan
        if (!artboardAggregates[assignedKeyword]) {
            artboardAggregates[assignedKeyword] = { totalEarnings: 0, itemCount: 0, items: [] };
        }
        artboardAggregates[assignedKeyword].totalEarnings += earnings;
        artboardAggregates[assignedKeyword].itemCount += 1;
        artboardAggregates[assignedKeyword].items.push(itemInfoForList);
    });
    
    const topArtboardsByEarnings = Object.entries(artboardAggregates)
        .map(([keyword, aggregates]) => ({
            keyword: keyword,
            totalEarnings: aggregates.totalEarnings,
            itemCount: aggregates.itemCount,
            items: aggregates.items 
        }))
        .sort((a, b) => b.totalEarnings - a.totalEarnings); 

    return { 
        totalItems, totalEarnings, taxAmount, categoriesCount, 
        categoryStatsRaw, 
        yearlyEarnings, topItems,
        topPositiveChangeItems, 
        categoryPerformance,
        topArtboardsByEarnings 
    };
}

function sortData(dataArray, columnName, direction) {
    dataArray.sort((a, b) => {
        let valA = a[columnName];
        let valB = b[columnName];

        if (columnName === "Total Earnings ($USD)" || columnName === "Earnings Change" || columnName === "totalEarnings") {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
        } else { 
            valA = String(valA).toLowerCase();
            valB = String(valB).toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function prepareDataForExport(exportType, currentFilteredData, summaryStats) {
    let dataToExport = [];
    let fileName = "exported_data";

    switch(exportType) {
        case "all":
            dataToExport = currentFilteredData;
            fileName = "all_filtered_items";
            break;
        case "topItems": 
            dataToExport = summaryStats.topItems;
            fileName = "top_performing_items_overall";
            break;
        case "categoryStats": 
            dataToExport = summaryStats.categoryPerformance.map(cat => ({
                Category: cat.name,
                ItemCount: cat.itemCount,
                TotalEarnings: parseFloat(cat.totalEarnings.toFixed(2)),
                AverageEarningsPerItem: parseFloat(cat.averageEarningsPerItem.toFixed(2))
            }));
            fileName = "category_performance_statistics";
            break;
        case "topChangeItems":
             dataToExport = summaryStats.topPositiveChangeItems.map(item => ({
                ItemId: item["Item Id"],
                Title: item.Title,
                Category: item.Category,
                EarningsChange: parseFloat((item["Earnings Change"] || 0).toFixed(2))
            }));
            fileName = "top_earnings_change_items";
            break;
        case "topArtboards":
            dataToExport = summaryStats.topArtboardsByEarnings.map(artboard => ({
                ArtboardKeyword: artboard.keyword,
                TotalEarnings: parseFloat(artboard.totalEarnings.toFixed(2)),
                ItemCount: artboard.itemCount,
            }));
            fileName = "top_artboards_by_earnings";
            break;
        default:
            return null; 
    }
    
    if (!dataToExport || dataToExport.length === 0) {
        return { dataToExport: [], fileName }; 
    }
    if (dataToExport.length > 0 && typeof dataToExport[0] !== 'object') {
        console.warn("Data ekspor bukan array objek, mengkonversi:", dataToExport);
        dataToExport = dataToExport.map(val => ({ value: val }));
    }

    return { dataToExport, fileName };
}

function triggerDownload(content, fileName, contentType) {
    const a = document.createElement("a");
    const blob = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}