const toggleBtn = document.getElementById('toggleBtn');
const panelBtn = document.getElementById('panelBtn');
const exportBtn = document.getElementById('exportBtn');
const clearMemBtn = document.getElementById('clearMemBtn');
const locationSelect = document.getElementById('locationSelect');
const logContainer = document.getElementById('log-container');
const statsTable = document.getElementById('stats-table');

function getTransactionDetails(urlStr) {
  try {
    if (urlStr.startsWith("manual-entry://")) {
      let raw = decodeURIComponent(urlStr.replace("manual-entry://", ""));
      if (raw === "Password/Account") return { method: "Manual", category: "IT & Software", service: "Password / Account Help" };
      if (raw === "WiFi") return { method: "Manual", category: "IT & Software", service: "WiFi Assistance" };
      if (raw.includes("AppsAnywhere")) return { method: "Manual", category: "IT & Software", service: "AppsAnywhere" };
      if (raw.includes("Auto_Desk")) return { method: "Manual", category: "IT & Software", service: "Auto Desk" };
      if (raw.includes("Office365")) return { method: "Manual", category: "IT & Software", service: "Office365" };
      if (raw.includes("Other")) return { method: "Manual", category: "IT & Software", service: "Software (Other)" };
      if (raw === "Print Assistance") return { method: "Manual", category: "Printing", service: "Print Assistance" };
      if (raw === "3D-Print") return { method: "Manual", category: "Printing", service: "3D-Print (Casa Loma)" };
      if (raw === "Directions") return { method: "Manual", category: "General Assistance", service: "Directions" };
      if (raw === "Miscellaneous") return { method: "Manual", category: "General Assistance", service: "Miscellaneous" };
      return { method: "Manual", category: "General Assistance", service: raw.replace(/_/g, " ") };
    }

    const urlObj = new URL(urlStr);
    const domain = urlObj.hostname;
    const path = urlObj.pathname; 
    const searchParams = urlObj.searchParams;

    if (domain.includes("gbcllc02.gbc.local")) {
        if (urlStr.includes("CardPickup")) return { method: "Auto", category: "ID Card Services", service: "Card Picked Up" };
        if (urlStr.includes("CardPrinted")) return { method: "Auto", category: "ID Card Services", service: "Card Printed" };
    }

    let amt = searchParams.get('amt');
    if (!amt && urlStr.includes('amt=')) {
       const match = urlStr.match(/amt=([^&]+)/);
       if (match) amt = match[1];
    }
    if (amt) {
      const val = parseFloat(amt);
      return { method: "Auto", category: "Printing", service: val < 0 ? "Print Credits Subtracted" : "Print Credits Added" };
    }

    if (domain.includes("alma.exlibrisgroup.com")) {
        if (path.includes("fulfillment_checkout")) return { method: "Auto", category: "Circulation", service: "Student Lookup" }; 
        if (path.includes("patron-workbench"))     return { method: "Auto", category: "Circulation", service: "Item Check-Out" };
        if (path.includes("return-items"))         return { method: "Auto", category: "Circulation", service: "Item Check-In" };
        return { method: "Auto", category: "Circulation", service: "Other Circulation" };
    }

    if (domain.includes("portal.azure.com") || domain.includes("portal.azure.net")) 
        return { method: "Auto", category: "IT & Software", service: "MFA Reset" };
    
    if (domain.includes("idm.georgebrown.ca"))     
        return { method: "Auto", category: "IT & Software", service: "Password Reset" };
    
    if (domain.includes("llcprint.georgebrown.ca") || urlStr.includes("Transaction")) 
        return { method: "Auto", category: "Printing", service: "Print Credits (Unknown)" }; 
    
    return { method: "Auto", category: "Other", service: "Unknown Web Service" }; 
  } catch (e) { 
      return { method: "Unknown", category: "Other", service: "Unknown Error" }; 
  }
}

function parseLogTime(timeStr) {
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? new Date() : d; 
}

function formatCSVDate(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatCSVTime(dateObj) {
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function getDayOfWeek(dateObj) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dateObj.getDay()];
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await browser.storage.local.get(['isRecording', 'logs', 'location', 'showPanel']);
  if (data.location) locationSelect.value = data.location;
  updatePanelButton(data.showPanel);
  updateUI(data);
});

locationSelect.addEventListener('change', (e) => {
  const newLoc = e.target.value;
  browser.storage.local.set({ location: newLoc });
  browser.storage.local.get('showPanel').then(d => {
      if(d.showPanel) {
          browser.storage.local.set({ showPanel: false }).then(() => {
              setTimeout(() => browser.storage.local.set({ showPanel: true }), 50);
          });
      }
  });
});

toggleBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get(['isRecording', 'location']);
  if (!data.location || locationSelect.value === "") {
    alert("Please select your Campus Location before starting.");
    locationSelect.focus();
    return;
  }
  const newState = !data.isRecording;
  await browser.storage.local.set({ isRecording: newState });
  updateUI(await browser.storage.local.get(['isRecording', 'logs']));
});

panelBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get('showPanel');
  const newState = !data.showPanel;
  await browser.storage.local.set({ showPanel: newState });
  updatePanelButton(newState);
});

function updatePanelButton(isVisible) {
  panelBtn.textContent = isVisible ? "Hide Panel" : "Show Panel";
  panelBtn.style.backgroundColor = isVisible ? "#6c757d" : "#17a2b8"; 
}

exportBtn.addEventListener('click', async () => {
  const data = await browser.storage.local.get(['logs', 'location']);
  const logs = data.logs || [];
  const location = data.location || "Unknown_Location";
  
  if (logs.length === 0) { alert("No data to export."); return; }
  
  let csvContent = "Location,Date,Day_of_Week,Time,Method,Category,Specific_Service,Input_ID,Full_URL\n";
  
  logs.forEach(log => {
    const cleanUrl = log.url.replace(/"/g, '""');
    const details = getTransactionDetails(log.url);
    const dateObj = parseLogTime(log.time);
    
    const dateIso = formatCSVDate(dateObj);
    const dayOfWeek = getDayOfWeek(dateObj);
    const timeStr = formatCSVTime(dateObj);
    
    let cleanId = "";
    if (/^\d{9}$/.test(log.number) || /^\d{13}$/.test(log.number)) {
        cleanId = log.number;
    }
    
    csvContent += `"${location}","${dateIso}","${dayOfWeek}","${timeStr}","${details.method}","${details.category}","${details.service}","${cleanId}","${cleanUrl}"\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "library_stats.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

clearMemBtn.addEventListener('click', async () => {
  if (confirm("PERMANENTLY DELETE ALL RECORDS?")) {
    await browser.storage.local.set({ logs: [] });
    updateUI(await browser.storage.local.get(['isRecording', 'logs']));
  }
});

function updateUI(data) {
  const isRecording = data.isRecording || false;
  const allLogs = data.logs || [];
  toggleBtn.textContent = isRecording ? 'Stop' : 'Record';
  toggleBtn.classList.toggle('recording', isRecording);
  locationSelect.disabled = isRecording; 
  logContainer.innerHTML = '';

  const todayDateStr = formatCSVDate(new Date());
  
  const todaysLogs = allLogs.filter(log => {
      const logDateObj = parseLogTime(log.time);
      return formatCSVDate(logDateObj) === todayDateStr;
  });

  if (todaysLogs.length === 0) {
    logContainer.innerHTML = '<div style="padding:10px; color:#ccc;">No activity today.</div>';
    statsTable.innerHTML = '<tr><td style="color:#6a737d; font-style:italic;">0 transactions</td></tr>';
    return;
  }

  todaysLogs.slice().reverse().slice(0, 50).forEach(log => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    const details = getTransactionDetails(log.url);
    
    let borderColor = "#ccc"; 
    if (details.category === "Circulation") borderColor = "#fd7e14"; 
    else if (details.category === "ID Card Services") borderColor = "#0d6efd";
    else if (details.category === "IT & Software") borderColor = "#6f42c1";
    else if (details.category === "Printing") borderColor = "#28a745";
    else if (details.category === "General Assistance") borderColor = "#6c757d";
    
    div.style.borderLeft = `4px solid ${borderColor}`;

    const numberSpan = document.createElement('span');
    numberSpan.style.fontWeight = 'bold';
    numberSpan.textContent = log.number;
    
    let displayName = details.service;
    if (details.category === "Circulation") {
        displayName = `Circulation: ${details.service}`;
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.style.fontSize = '10px';
    timeSpan.textContent = displayName; 
    
    div.appendChild(numberSpan);
    div.appendChild(timeSpan);
    logContainer.appendChild(div);
  });
  
  const counts = {};
  todaysLogs.forEach(log => {
    const details = getTransactionDetails(log.url);
    
    let statName = details.service;
    if (details.category === "Circulation") {
        statName = `Circulation: ${details.service}`;
    } else if (["AppsAnywhere", "Auto Desk", "Office365", "Software (Other)"].includes(details.service)) {
        statName = "Software";
    }
    
    counts[statName] = (counts[statName] || 0) + 1;
  });
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  statsTable.innerHTML = '';
  sorted.forEach(([name, count]) => {
    const row = document.createElement('tr');
    
    const nameTd = document.createElement('td');
    nameTd.textContent = name;
    
    const countTd = document.createElement('td');
    countTd.className = 'count-col';
    countTd.textContent = count;
    
    row.appendChild(nameTd);
    row.appendChild(countTd);
    statsTable.appendChild(row);
  });
}