import { saveLog } from './logger';

const STUDENT_ID_REGEX = /^\d{9}$/;
const ITEM_BARCODE_REGEX = /^\d{13}$/;

export const setupAutoTrackers = (currentHostname: string) => {
  // Listens to input of 9-digit student IDs and 13-digit item barcodes across the site
  document.addEventListener(
    'input',
    (e: Event) => {
      if (
        currentHostname.includes('llcprint.georgebrown.ca') ||
        currentHostname.includes('gbcllc02.gbc.local') ||
        currentHostname.includes('idm.georgebrown.ca')
      )
        return;

      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest && target.closest('#lib-tracker-host')) return;

      const isInputOrTextarea =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (!isInputOrTextarea && !target.isContentEditable) return;

      let text = '';
      let cursorIndex = 0;

      try {
        if (isInputOrTextarea) {
          const inputElem = target as HTMLInputElement | HTMLTextAreaElement;
          text = inputElem.value;
          cursorIndex =
            inputElem.selectionStart !== null
              ? inputElem.selectionStart
              : text.length;
        } else if (target.isContentEditable) {
          const selection = window.getSelection();
          if (
            selection &&
            selection.rangeCount > 0 &&
            selection.anchorNode &&
            target.contains(selection.anchorNode)
          ) {
            text = selection.anchorNode.textContent || '';
            cursorIndex = selection.anchorOffset;
          }
        }
      } catch (err) {
        text = (target as HTMLInputElement).value || '';
        cursorIndex = text.length;
      }

      const url = window.location.href;
      const isAlma = currentHostname.includes('alma.exlibrisgroup.com');

      if (
        isAlma &&
        (url.includes('fulfillment_checkout') || url.includes('return-items'))
      )
        return;

      if (isAlma && url.includes('patron-workbench')) {
        if (cursorIndex >= 13) {
          const item = text.substring(cursorIndex - 13, cursorIndex);
          if (ITEM_BARCODE_REGEX.test(item)) saveLog(item);
        }
      }

      if (
        !isAlma ||
        (isAlma &&
          !url.includes('fulfillment_checkout') &&
          !url.includes('return-items'))
      ) {
        if (cursorIndex >= 9) {
          const student = text.substring(cursorIndex - 9, cursorIndex);
          if (STUDENT_ID_REGEX.test(student)) {
            if (cursorIndex >= 10 && /\d/.test(text.charAt(cursorIndex - 10)))
              return;
            saveLog(student);
          }
        }
      }
    },
    true,
  );

  // ALMA Form Submit Helper
  const checkAlmaFormSubmit = () => {
    const url = window.location.href;
    if (!currentHostname.includes('alma.exlibrisgroup.com')) return;

    if (url.includes('fulfillment_checkout')) {
      const inputField = document.getElementById(
        'pageBeandisplayNameOfUserOrUserIdendifier',
      ) as HTMLInputElement;
      if (inputField && inputField.value) {
        const match = inputField.value.trim().match(/(?:^|\D)(\d{9})(?:\D|$)/);
        if (match) saveLog(match[1]);
      }
    } else if (url.includes('return-items')) {
      const inputField = document.querySelector(
        'input[placeholder="Scan Item Barcode"]',
      ) as HTMLInputElement;
      if (inputField && inputField.value) {
        const match = inputField.value.trim().match(/(?:^|\D)(\d{13})(?:\D|$)/);
        if (match) saveLog(match[1]);
      }
    }
  };

  // IDM Form Submit Helper
  const checkIdmFormSubmit = () => {
    if (!currentHostname.includes('idm.georgebrown.ca')) return;
    let isMain = false;
    try {
      isMain = window.top?.location.href.includes('main') || false;
    } catch (e) {
      isMain = window.location.href.includes('main');
    }

    if (!isMain) return;

    const inputField = document.getElementById(
      'id.textentry.person.info',
    ) as HTMLInputElement;
    if (inputField && inputField.value) {
      const match = inputField.value.trim().match(/(?:^|\D)(\d{9})(?:\D|$)/);
      if (match) saveLog(match[1]);
    }
  };

  // Checks for form submit with enter and click on Alma and IDM
  document.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        checkAlmaFormSubmit();
        checkIdmFormSubmit();
      }
    },
    true,
  );

  document.addEventListener(
    'click',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (
        target.closest('#cbuttongo') ||
        target.closest('button[aria-label="OK"]')
      ) {
        checkAlmaFormSubmit();
      }
      if (target.closest('input[id="button.find"]')) {
        checkIdmFormSubmit();
      }

      const url = window.location.href;
      if (
        currentHostname.includes('gbcllc02.gbc.local') &&
        (url.includes('PrintedNotPickedUp') || url.includes('PrePrintQueue'))
      ) {
        if (target.tagName !== 'A') return;

        const text = target.innerText.toLowerCase();
        let actionType: string | null = null;

        if (text.includes('mark as picked up')) actionType = 'CardPickup';
        else if (text.includes('mark as printed')) actionType = 'CardPrinted';

        if (actionType) {
          const row = target.closest('tr');
          if (row) {
            const cells = row.getElementsByTagName('td');
            if (cells.length > 1) {
              const rawId = cells[1].innerText.trim();
              if (STUDENT_ID_REGEX.test(rawId)) {
                const trackUrl = 'http://gbcllc02.gbc.local/' + actionType;
                saveLog(rawId, trackUrl);
              }
            }
          }
        }
      }
    },
    true,
  );

  // PaperCut Submit Helper
  let isProcessingSubmit = false;
  document.addEventListener(
    'submit',
    (e: SubmitEvent) => {
      if (isProcessingSubmit) return;
      const form = e.target as HTMLFormElement;
      const adjustmentInput = form.querySelector(
        '#adjustmentValue',
      ) as HTMLInputElement;

      if (adjustmentInput) {
        e.preventDefault();
        const amount = adjustmentInput.value;
        let studentId: string | null = null;

        const h1 = document.querySelector('h1');
        if (h1) {
          const match = h1.innerText.match(/\((\d{9})\)/);
          if (match) studentId = match[1];
        }
        if (!studentId) {
          const userSpan = document.getElementById('username');
          if (userSpan) {
            const text = userSpan.innerText.trim();
            if (STUDENT_ID_REGEX.test(text)) studentId = text;
          }
        }

        if (studentId && amount) {
          isProcessingSubmit = true;
          const cleanUrl = window.location.href.replace(
            'UserDetails.aspx',
            'Transaction',
          );
          const urlObj = new URL(cleanUrl);
          urlObj.searchParams.set('amt', amount);

          saveLog(studentId, urlObj.toString()).then(() => {
            if (e.submitter) form.requestSubmit(e.submitter);
            else form.submit();
            isProcessingSubmit = false;
          });
        } else {
          isProcessingSubmit = true;
          if (e.submitter) form.requestSubmit(e.submitter);
          else form.submit();
        }
      }
    },
    true,
  );
};
