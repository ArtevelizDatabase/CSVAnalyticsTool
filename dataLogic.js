// dataLogic.js

const REQUIRED_COLUMNS_CONST = ["Item Id", "Category", "Title", "Published Date", "Total Earnings ($USD)", "Earnings Change"];

// STRUKTUR BARU: ARTBOARD_DEFINITIONS
const ARTBOARD_DEFINITIONS = [
    { canonical: "CV Resume", variations: [/\bcv resumes?\b/i, /\bresumes?\b/i, /\bcurriculum vitae\b/i] },
    { canonical: "Text Effect", variations: [/\btext effects?\b/i, /\bfont effects?\b/i, /\btypography effects?\b/i] },
    { canonical: "Photo Effect", variations: [/\bphoto effects?\b/i, /\bimage effects?\b/i] },
    { canonical: "Photoshop Action", variations: [/\bphotoshop actions?\b/i, /\bps actions?\b/i] },
    { canonical: "Lightroom Preset", variations: [/\blightroom presets?\b/i, /\blr presets?\b/i] },
    { canonical: "Instagram Post", variations: [/\binstagram posts?\b/i, /\big posts?\b/i] },
    { canonical: "Instagram Story", variations: [/\binstagram stories\b/i, /\big stories\b/i, /\bInstagram Story?\b/i, /\bInstagram Storys?\b/i, /\bInstagram Story?\b/i] },
    { canonical: "Social Media", variations: [/\bsocial media\b/i, /\bfacebook\b/i, /\btwitter\b/i, /\bpinterest\b/i, /\blinkedin\b/i] },
    { canonical: "Mobile Apps", variations: [/\bMobile Apps?\b/i, /\bMobile App?\b/i, /\bApps?\b/i] },
    { canonical: "Id Card", variations: [/\bId Card?\b/i ] },
    { canonical: "YouTube Thumbnail", variations: [/\byoutube thumbnails?\b/i] },
    { canonical: "Data Sheet", variations: [/\bData Sheet?\b/i, /\bData Sheets?\b/i] },
    { canonical: "Business Card", variations: [/business cards?/i, /business card/i] },
    { canonical: "Landing Page", variations: [/\blanding pages?\b/i] },
    { canonical: "Website Template", variations: [/\bwebsite templates?\b/i, /\bweb templates?\b/i] },
    { canonical: "Email Template", variations: [/\bemail templates?\b/i] },
    { canonical: "UI Kit", variations: [/\bui kits?\b/i, /\bui design\b/i] },
    { canonical: "UX Kit", variations: [/\bux kits?\b/i, /\bux design\b/i] },
    { canonical: "Annual Report / Company Profile", variations: [/\bannual reports?\b/i,/\bproposal?\b/i,/\breport?\b/i,/\bCompany Profile?\b/i ] },
    { canonical: "Bifold Brochure", variations: [/\bbifolds?\b/i, /\bbifold brochures?\b/i] },
    { canonical: "Trifold Brochure", variations: [/\btrifolds?\b/i, /\btrifold brochures?\b/i] },
    { canonical: "Brochure", variations: [/\bbrochures?\b/i] }, 
    { canonical: "Flyer", variations: [/\bflyers?\b/i, /\bflyer designs?\b/i] },
    { canonical: "Poster", variations: [/\bposters?\b/i] },
    { canonical: "Banner", variations: [/\bbanners?\b/i, /\bweb banners?\b/i, /\bad banners?\b/i, /\broll up banners?\b/i] },
    { canonical: "Billboard", variations: [/\bbillboards?\b/i] },
    { canonical: "Mockup", variations: [/\bmockups?\b/i, /\bmock-ups?\b/i, /\bscene creators?\b/i] },
    { canonical: "Logo", variations: [/\blogos?\b/i, /\blogo templates?\b/i] },
    { canonical: "Hero Header", variations: [/\bHero Header?\b/i, /\bHero Headers?\b/i,/\bHero Section?\b/i, /\bHero Page?\b/i,] },
    { canonical: "Illustration", variations: [/\billustrations?\b/i] },
    { canonical: "Pattern", variations: [/\bpatterns?\b/i, /\bseamless patterns?\b/i] },
    { canonical: "Font", variations: [/\bfonts?\b/i, /\btypefaces?\b/i, /\btypography\b/i] }, 
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

        // Standardize date format to YYYY-MM-DD if possible, handle various input formats
        if (newRow["Published Date"]) {
            const dateStr = String(newRow["Published Date"]);
            // Attempt to parse common date formats (e.g., MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD)
            let parsedDate;
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) { // YYYY-MM-DD
                 parsedDate = new Date(dateStr);
            } else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) { // MM/DD/YYYY or D/M/YYYY
                const parts = dateStr.split('/');
                // Assuming MM/DD/YYYY for simplicity; adjust if DD/MM/YYYY is more common
                parsedDate = new Date(parts[2], parts[0] - 1, parts[1]); 
            } else if (dateStr.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) { // DD-MM-YYYY or MM-DD-YYYY
                 const parts = dateStr.split('-');
                 // Assuming DD-MM-YYYY for simplicity
                 parsedDate = new Date(parts[2], parts[1] - 1, parts[0]);
            } else {
                // Try direct parsing if format is not recognized, might be ISO or other standard
                parsedDate = new Date(dateStr);
            }

            if (parsedDate && !isNaN(parsedDate)) {
                const year = parsedDate.getFullYear();
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const day = String(parsedDate.getDate()).padStart(2, '0');
                newRow["Published Date"] = `${year}-${month}-${day}`;
            } else {
                // console.warn(`Could not parse date: ${dateStr}. Leaving as is or setting to null.`);
                // newRow["Published Date"] = null; // Or keep original if preferred
            }
        }
        
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
            const itemDate = item["Published Date"]; // Assumes YYYY-MM-DD
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
    const defaultStats = { 
        totalItems: 0, totalEarnings: 0, taxAmount: 0, categoriesCount: 0, 
        categoryStatsRaw: {}, yearlyEarnings: {}, topItems: [],
        topPositiveChangeItems: [], categoryPerformance: [],
        topArtboardsByEarnings: [], monthlyEarnings: {}, 
        monthlyPublicationCounts: {}, avgEarningsChangePerCategory: []
    };

    if (!data || data.length === 0) return defaultStats;

    const totalItems = data.length;
    const totalEarnings = data.reduce((sum, item) => sum + (item["Total Earnings ($USD)"] || 0), 0);
    const taxAmount = totalEarnings * 0.15;
    
    const categoryStatsRaw = data.reduce((acc, item) => {
        const category = item.Category || "Uncategorized";
        if (!acc[category]) {
            acc[category] = { count: 0, earnings: 0, totalChange: 0 };
        }
        acc[category].count++;
        acc[category].earnings += (item["Total Earnings ($USD)"] || 0);
        acc[category].totalChange += (item["Earnings Change"] || 0);
        return acc;
    }, {});
    
    const categoriesCount = Object.keys(categoryStatsRaw).length;

    const yearlyEarnings = {};
    const monthlyEarnings = {};
    const monthlyPublicationCounts = {};

    data.forEach(item => {
        const pubDate = item["Published Date"]; // Assumes YYYY-MM-DD
        const earnings = item["Total Earnings ($USD)"] || 0;
        if (pubDate && typeof pubDate === 'string' && pubDate.length >= 7) { // YYYY-MM
            try {
                const year = pubDate.substring(0, 4);
                const monthYear = pubDate.substring(0, 7); // YYYY-MM

                if (/^\d{4}$/.test(year)) {
                    yearlyEarnings[year] = (yearlyEarnings[year] || 0) + earnings;
                }
                if (/^\d{4}-\d{2}$/.test(monthYear)) {
                    monthlyEarnings[monthYear] = (monthlyEarnings[monthYear] || 0) + earnings;
                    monthlyPublicationCounts[monthYear] = (monthlyPublicationCounts[monthYear] || 0) + 1;
                }
            } catch (e) { 
                console.warn("Could not parse year/month for item:", item, e); 
            }
        }
    });

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

    const avgEarningsChangePerCategory = Object.entries(categoryStatsRaw)
        .map(([name, stats]) => ({
            name: name,
            avgChange: stats.count > 0 ? (stats.totalChange / stats.count) : 0,
            itemCount: stats.count
        }))
        .sort((a,b) => b.avgChange - a.avgChange); // Sort by average change descending

    const artboardAggregates = {}; 
    const otherKeywordString = "Lainnya (Other)";
    const presentationCanonicalKeyword = "Presentation"; 

    data.forEach(item => {
        const itemCategoryLower = String(item.Category || "").toLowerCase();
        const titleString = String(item.Title || "").trim();
        const itemTitleForList = item.Title || "Judul Tidak Diketahui";
        const earningsVal = item["Total Earnings ($USD)"] || 0; // Renamed to avoid conflict
        let assignedKeyword = null; 

        const itemInfoForList = { 
            id: item["Item Id"], 
            title: itemTitleForList, 
            earnings: earningsVal,
            link: item["Item URL"] || item["URL"] || item["Link"]
        };

        if (itemCategoryLower === "presentation-templates") {
            assignedKeyword = presentationCanonicalKeyword;
        } else {
            const foundByCategory = ARTBOARD_DEFINITIONS.find(def => def.canonical.toLowerCase() === item.Category?.toLowerCase());
            if (foundByCategory) {
                assignedKeyword = foundByCategory.canonical;
            }
        }
        
        if (!assignedKeyword && titleString) { 
            const titleLower = titleString.toLowerCase();
            for (const definition of ARTBOARD_DEFINITIONS) { 
                for (const regexPattern of definition.variations) {
                    if (regexPattern.test(titleLower)) {
                        assignedKeyword = definition.canonical;
                        break;
                    }
                }
                if (assignedKeyword) break;
            }
        }
        
        if (!assignedKeyword) {
            assignedKeyword = otherKeywordString;
        }

        if (!artboardAggregates[assignedKeyword]) {
            artboardAggregates[assignedKeyword] = { totalEarnings: 0, itemCount: 0, items: [] };
        }
        artboardAggregates[assignedKeyword].totalEarnings += earningsVal;
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
        categoryStatsRaw, yearlyEarnings, topItems,
        topPositiveChangeItems, categoryPerformance,
        topArtboardsByEarnings, monthlyEarnings, 
        monthlyPublicationCounts, avgEarningsChangePerCategory
    };
}

function sortData(dataArray, columnName, direction) {
    dataArray.sort((a, b) => {
        let valA = a[columnName];
        let valB = b[columnName];

        if (["Total Earnings ($USD)", "Earnings Change", "totalEarnings", "avgChange"].includes(columnName)) {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else if (columnName === "Published Date") {
            // Assuming YYYY-MM-DD format for direct string comparison
            valA = String(valA);
            valB = String(valB);
        } else if (typeof valA === 'string' && typeof valB === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        } else if (typeof valA === 'number' && typeof valB === 'number') {
            // No change needed
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