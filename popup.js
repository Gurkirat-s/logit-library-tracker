const toggleBtn = document.getElementById('toggleBtn');
const panelBtn = document.getElementById('panelBtn');
const exportBtn = document.getElementById('exportBtn');
const clearMemBtn = document.getElementById('clearMemBtn');
const locationSelect = document.getElementById('locationSelect');
const logContainer = document.getElementById('log-container');
const statsTable = document.getElementById('stats-table');

function getServiceType(urlStr) {
  try {
    if (urlStr.startsWith("manual-entry://")) {
      let raw = urlStr.replace("manual-entry://", "");
      return decodeURIComponent(raw).replace(/_/g, " ");
    }
    const urlObj = new URL(urlStr);
    const domain = urlObj.hostname;
    const path = urlObj.href; 
    const searchParams = urlObj.searchParams;

    if (domain.includes("gbcllc02.gbc.local") || path.includes("CardPickup")) {
        return "Card Pickup";
    }

    let amt = searchParams.get('amt');
    if (!amt && urlStr.includes('amt=')) {
       const match = urlStr.match(/amt=([^&]+)/);
       if (match) amt = match[1];
    }
    if (amt) {
      const val = parseFloat(amt);
      return val < 0 ? "Print Credits Subtracted" : "Print Credits Added";
    }
    if (domain.includes("alma.exlibrisgroup.com")) {
        if (path.includes("fulfillment_checkout")) return "Circulation: Student Lookup"; 
        if (path.includes("patron-workbench"))     return "Circulation: Item Check-Out";
        if (path.includes("return-items"))         return "Circulation: Item Check-In";
        return "Circulation: Other";
    }
    if (domain.includes("portal.azure.com") || domain.includes("portal.azure.net")) return "IT: MFA Reset";
    if (domain.includes("idm.georgebrown.ca"))     return "IT: Password Reset";
    if (domain.includes("llcprint.georgebrown.ca") || path.includes("Transaction")) return "Print Credits (Unknown)"; 
    return "Other Web Service"; 
  } catch (e) { 
      if (urlStr.includes("manual-entry")) return "Manual Log";
      return "Unknown Source"; 
  }
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
  let csvContent = "Location,Timestamp,Service_Type,Input_ID,Domain,Full_URL\n";
  logs.forEach(log => {
    const cleanUrl = log.url.replace(/"/g, '""');
    const cleanId = `="${log.number}"`; 
    const serviceType = getServiceType(log.url);
    const csvService = serviceType.replace(/: /g, ' - ').replace(/,/g, '');
    let domain = "Unknown";
    if (log.url.startsWith("manual")) domain = "Manual Entry";
    else { try { domain = new URL(log.url).hostname; } catch(e){} }
    csvContent += `"${location}","${log.time}","${csvService}",${cleanId},"${domain}","${cleanUrl}"\n`;
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


  const todayStr = new Date().toLocaleDateString();
  const todaysLogs = allLogs.filter(log => {

      return new Date(log.time).toLocaleDateString() === todayStr;
  });

  if (todaysLogs.length === 0) {
    logContainer.innerHTML = '<div style="padding:10px; color:#ccc;">No activity today.</div>';
    statsTable.innerHTML = '<tr><td style="color:#6a737d; font-style:italic;">0 transactions</td></tr>';
    return;
  }


  todaysLogs.slice().reverse().slice(0, 50).forEach(log => {
    const div = document.createElement('div');
    div.className = 'log-entry';
    let displayService = getServiceType(log.url);
    let borderColor = "transparent"; 
    if (log.number === "Manual") {
        borderColor = "#17a2b8"; 
    } else if (displayService.includes("Card Pickup")) {
        borderColor = "#dc3545"; // Red for Pickup
    } else if (displayService.includes("Circulation")) {
        borderColor = "#fd7e14"; 
    } else if (displayService.includes("Print Credits")) {
        borderColor = "#28a745"; 
    } else if (displayService.includes("Password")) {
        borderColor = "#6f42c1"; 
    } else if (displayService.includes("MFA")) {
        borderColor = "#e83e8c"; 
    }
    div.style.borderLeft = `4px solid ${borderColor}`;
    div.innerHTML = `
      <span style="font-weight:bold">${log.number}</span>
      <span class="log-time" style="font-size:10px">${displayService}</span>
    `;
    logContainer.appendChild(div);
  });
  
  const counts = {};
  todaysLogs.forEach(log => {
    const type = getServiceType(log.url);
    counts[type] = (counts[type] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  statsTable.innerHTML = '';
  sorted.forEach(([name, count]) => {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${name}</td><td class="count-col">${count}</td>`;
    statsTable.appendChild(row);
  });
}
