const STUDENT_ID_REGEX = /^\d{9}$/;
const ITEM_BARCODE_REGEX = /^\d{13}$/;

const currentHostname = window.location.hostname;
const isAllowedAutoTracker = 
    currentHostname.includes("alma.exlibrisgroup.com") ||
    currentHostname.includes("gbcllc02.gbc.local") ||
    currentHostname.includes("portal.azure.com") ||
    currentHostname.includes("portal.azure.net") ||
    currentHostname.includes("idm.georgebrown.ca") ||
    currentHostname.includes("llcprint.georgebrown.ca");

if (isAllowedAutoTracker) {

    document.addEventListener('input', (e) => {

      if (currentHostname.includes("llcprint.georgebrown.ca")) return;
      if (currentHostname.includes("gbcllc02.gbc.local")) return;
      if (currentHostname.includes("idm.georgebrown.ca")) return; 

      const path = e.composedPath && e.composedPath();
      const target = (path && path[0]) || e.target;

      if (target.closest && target.closest('#lib-tracker-host')) return;

      if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable)) return;

      let text = '';
      let cursorIndex = 0;
      try {
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
              text = target.value;
              cursorIndex = target.selectionStart !== null ? target.selectionStart : text.length;
          } else if (target.isContentEditable) {
              const selection = window.getSelection();
              if (selection.rangeCount > 0 && target.contains(selection.anchorNode)) {
                  text = selection.anchorNode.textContent;
                  cursorIndex = selection.anchorOffset;
              }
          }
      } catch (err) { text = target.value || ""; cursorIndex = text.length; }
      
      const url = window.location.href;
      const isAlma = currentHostname.includes("alma.exlibrisgroup.com");
      
      if (isAlma && (url.includes("fulfillment_checkout") || url.includes("return-items"))) return;

      if (isAlma && url.includes("patron-workbench")) {
          if (cursorIndex >= 13) {
              const item = text.substring(cursorIndex - 13, cursorIndex);
              if (ITEM_BARCODE_REGEX.test(item)) saveLog(item);
          }
      }

      if (!isAlma || (isAlma && !url.includes("fulfillment_checkout") && !url.includes("return-items"))) {
          if (cursorIndex >= 9) {
              const student = text.substring(cursorIndex - 9, cursorIndex);
              if (STUDENT_ID_REGEX.test(student)) {
                  if (cursorIndex >= 10 && /\d/.test(text.charAt(cursorIndex - 10))) return;
                  saveLog(student);
              }
          }
      }
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAlmaFormSubmit();
            checkIdmFormSubmit();
        }
    }, true);

    document.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.closest('#cbuttongo') || target.closest('button[aria-label="OK"]')) {
            checkAlmaFormSubmit();
        }
        
        if (target.closest('input[id="button.find"]')) {
            checkIdmFormSubmit();
        }
    }, true);

    function checkAlmaFormSubmit() {
        const url = window.location.href;
        if (!currentHostname.includes("alma.exlibrisgroup.com")) return;

        if (url.includes("fulfillment_checkout")) {
            const inputField = document.getElementById('pageBeandisplayNameOfUserOrUserIdendifier');
            if (inputField && inputField.value) {
                const match = inputField.value.trim().match(/(?:^|\D)(\d{9})(?:\D|$)/);
                if (match) saveLog(match[1]);
            }
        } else if (url.includes("return-items")) {
            const inputField = document.querySelector('input[placeholder="Scan Item Barcode"]');
            if (inputField && inputField.value) {
                const match = inputField.value.trim().match(/(?:^|\D)(\d{13})(?:\D|$)/);
                if (match) saveLog(match[1]);
            }
        }
    }

    function checkIdmFormSubmit() {
        if (!currentHostname.includes("idm.georgebrown.ca")) return;

        let isMain = false;
        try {
            isMain = window.top.location.href.includes("main");
        } catch (e) {
            isMain = window.location.href.includes("main");
        }

        if (!isMain) return;

        const inputField = document.getElementById('id.textentry.person.info');
        if (inputField && inputField.value) {

            const match = inputField.value.trim().match(/(?:^|\D)(\d{9})(?:\D|$)/);
            if (match) saveLog(match[1]);
        }
    }

    let isProcessingSubmit = false;
    document.addEventListener('submit', (e) => {
        if (isProcessingSubmit) return;
        const form = e.target;
        const adjustmentInput = form.querySelector('#adjustmentValue');
        
        if (adjustmentInput) {
            e.preventDefault(); 
            const amount = adjustmentInput.value;
            let studentId = null;
            const h1 = document.querySelector('h1');
            if (h1) { const match = h1.innerText.match(/\((\d{9})\)/); if (match) studentId = match[1]; }
            if (!studentId) {
                const userSpan = document.getElementById('username');
                if (userSpan) { const text = userSpan.innerText.trim(); if (STUDENT_ID_REGEX.test(text)) studentId = text; }
            }

            if (studentId && amount) {
                isProcessingSubmit = true;
                const cleanUrl = window.location.href.replace("UserDetails.aspx", "Transaction");
                const urlObj = new URL(cleanUrl);
                urlObj.searchParams.set("amt", amount); 
                
                saveLog(studentId, urlObj.toString()).then(() => {
                    if (e.submitter) form.requestSubmit(e.submitter); else form.submit();
                    isProcessingSubmit = false; 
                });
            } else {
                isProcessingSubmit = true;
                if (e.submitter) form.requestSubmit(e.submitter); else form.submit();
            }
        }
    }, true);

    document.addEventListener('click', (e) => {
        const url = window.location.href;
        
        if (currentHostname.includes("gbcllc02.gbc.local") && (url.includes("PrintedNotPickedUp") || url.includes("PrePrintQueue"))) {
            const target = e.target;
            
            if (target.tagName !== 'A') return;

            const text = target.innerText.toLowerCase();
            let actionType = null;

            if (text.includes("mark as picked up")) {
                actionType = "CardPickup";
            } else if (text.includes("mark as printed")) {
                actionType = "CardPrinted";
            }

            if (actionType) {
                const row = target.closest('tr');
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    if (cells.length > 1) {
                        const rawId = cells[1].innerText.trim();
                        
                        if (STUDENT_ID_REGEX.test(rawId)) {
                            const trackUrl = "http://gbcllc02.gbc.local/" + actionType; 
                            saveLog(rawId, trackUrl);
                        }
                    }
                }
            }
        }
    }, true);

}

browser.storage.local.get(['showPanel', 'location']).then(data => {
    if (data.showPanel) createFloatingPanel(data.location);
});

browser.storage.onChanged.addListener((changes) => {
    if (changes.showPanel) {
        browser.storage.local.get('location').then(data => {
            if (changes.showPanel.newValue) createFloatingPanel(data.location);
            else removeFloatingPanel();
        });
    }
});

function removeFloatingPanel() {
    const host = document.getElementById('lib-tracker-host');
    if (host) host.remove();
}

function createFloatingPanel(userLocation) {
    if (document.getElementById('lib-tracker-host')) return; 

    const host = document.createElement('div');
    host.id = 'lib-tracker-host';
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
        :host { all: initial; }
        .panel {
            display: flex; flex-direction: row; align-items: center; gap: 6px;
            background-color: #fdfdfd; border: 1px solid #e0e0e0;
            border-radius: 10px; padding: 5px 10px 5px 6px;
            position: fixed; bottom: 20px; right: 20px;
            z-index: 2147483647; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: "Inter", system-ui, -apple-system, sans-serif; user-select: none;
        }
        .drag-handle {
            width: 6px; height: 22px;
            background: repeating-linear-gradient(to bottom, #ccc, #ccc 2px, transparent 2px, transparent 4px);
            cursor: grab; margin-right: 4px; opacity: 0.5;
        }
        .drag-handle:active { cursor: grabbing; }
        button {
            background-color: #468faf; color: white; border: none;
            padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
            cursor: pointer; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.1s;
        }
        button:hover { transform: translateY(-1px); filter: brightness(1.1); }
        button:active { transform: translateY(0); }
        .menu-container { position: relative; display: flex; }
        .submenu {
            display: none; position: absolute; bottom: 110%; left: 50%;
            transform: translateX(-50%); background-color: #fff;
            padding: 5px; border-radius: 8px; border: 1px solid #eee;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); flex-direction: column;
            gap: 4px; min-width: 120px; animation: fadeUp 0.1s ease-out;
        }
        .menu-container::after {
            content: ""; position: absolute; bottom: 80%; left: -20%;
            width: 140%; height: 40px; background: transparent; z-index: -1;
        }
        .menu-container:hover .submenu { display: flex; }
        @keyframes fadeUp { from { opacity: 0; transform: translate(-50%, 5px); } to { opacity: 1; transform: translate(-50%, 0); } }
    `;
    shadow.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'panel';
    
    wrapper.innerHTML = `
        <div class="drag-handle" title="Drag to move"></div>
        <button data-id="Print Assistance">Print Help</button>
        <button data-id="WiFi">WiFi</button>
        <button data-id="Password/Account">Password/Account</button>
        <span id="dynamic-btn-anchor"></span>
        <button data-id="Directions">Directions</button>
        <button data-id="Miscellaneous">Misc</button>
        <div class="menu-container">
            <button style="background-color:#468faf;">Software ▲</button>
            <div class="submenu">
                <button data-id="Software_-_AppsAnywhere">AppsAnywhere</button>
                <button data-id="Software_-_Auto_Desk">Auto Desk</button>
                <button data-id="Software_-_Office365">Office365</button>
                <button data-id="Software_-_Other">Other</button>
            </div>
        </div>
    `;

    const anchor = wrapper.querySelector('#dynamic-btn-anchor');
    if (userLocation === "Casa Loma") {
        const extraBtn = document.createElement('button');
        extraBtn.setAttribute('data-id', '3D-Print');
        extraBtn.textContent = '3D-Print';
        wrapper.insertBefore(extraBtn, anchor);
    }
    anchor.remove();

    shadow.appendChild(wrapper);

    wrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const serviceId = btn.getAttribute('data-id');
        if (!serviceId) return;

        const originalText = btn.innerText;
        const originalColor = btn.style.backgroundColor;
        btn.innerText = "✓";
        btn.style.backgroundColor = "#28a745";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = originalColor;
        }, 800);

        const virtualUrl = "manual-entry://" + serviceId;
        saveLog("Manual", virtualUrl);
    });

    makeDraggable(wrapper, shadow.querySelector('.drag-handle'));
}

function makeDraggable(element, handle) {
    let isDragging = false;
    let startX, startY;
    handle.addEventListener('mousedown', (e) => {
        isDragging = true; startX = e.clientX; startY = e.clientY;
        const rect = element.getBoundingClientRect();
        element.style.bottom = 'auto'; element.style.right = 'auto';
        element.style.left = rect.left + 'px'; element.style.top = rect.top + 'px';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        element.style.left = (parseFloat(element.style.left) + dx) + 'px';
        element.style.top = (parseFloat(element.style.top) + dy) + 'px';
        startX = e.clientX; startY = e.clientY;
    });
    window.addEventListener('mouseup', () => { isDragging = false; });
}

function saveLog(number, overrideUrl = null) {
  return browser.storage.local.get(['isRecording', 'logs']).then((data) => {
    if (!data.isRecording) return; 
    const logs = data.logs || [];
    const currentUrl = overrideUrl || window.location.href;
    const timestamp = new Date().toISOString(); 
    
    const lastEntry = logs[logs.length - 1];
    if (lastEntry && lastEntry.number === number && lastEntry.url === currentUrl) {
       if (!currentUrl.startsWith("manual-entry")) return; 
    }
    logs.push({ number: number, url: currentUrl, time: timestamp });
    return browser.storage.local.set({ logs: logs });
  });
}