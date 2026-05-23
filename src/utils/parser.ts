export function getTransactionDetails(urlStr: string) {
  try {
    if (urlStr.startsWith('manual-entry://')) {
      let raw = decodeURIComponent(urlStr.replace('manual-entry://', ''));
      if (raw === 'Password/Account')
        return {
          method: 'Manual',
          category: 'IT & Software',
          service: 'Password / Account Help',
        };
      if (raw === 'WiFi')
        return {
          method: 'Manual',
          category: 'IT & Software',
          service: 'WiFi Assistance',
        };
      if (raw.includes('AppsAnywhere'))
        return {
          method: 'Manual',
          category: 'IT & Software',
          service: 'AppsAnywhere',
        };
      if (raw.includes('Auto_Desk'))
        return {
          method: 'Manual',
          category: 'IT & Software',
          service: 'Auto Desk',
        };
      if (raw.includes('Office365'))
        return {
          method: 'Manual',
          category: 'IT & Software',
          service: 'Office365',
        };
      if (raw.includes('Other'))
        return {
          method: 'Manual',
          category: 'IT & Software',
          service: 'Software (Other)',
        };
      if (raw === 'Print Assistance')
        return {
          method: 'Manual',
          category: 'Printing',
          service: 'Print Assistance',
        };
      if (raw === '3D-Print')
        return {
          method: 'Manual',
          category: 'Printing',
          service: '3D-Print (Casa Loma)',
        };
      if (raw === 'Directions')
        return {
          method: 'Manual',
          category: 'General Assistance',
          service: 'Directions',
        };
      if (raw === 'Miscellaneous')
        return {
          method: 'Manual',
          category: 'General Assistance',
          service: 'Miscellaneous',
        };
      return {
        method: 'Manual',
        category: 'General Assistance',
        service: raw.replace(/_/g, ' '),
      };
    }

    const urlObj = new URL(urlStr);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    if (domain.includes('gbcllc02.gbc.local')) {
      if (urlStr.includes('CardPickup'))
        return {
          method: 'Auto',
          category: 'ID Card Services',
          service: 'Card Picked Up',
        };
      if (urlStr.includes('CardPrinted'))
        return {
          method: 'Auto',
          category: 'ID Card Services',
          service: 'Card Printed',
        };
    }

    let amt = searchParams.get('amt');
    if (!amt && urlStr.includes('amt=')) {
      const match = urlStr.match(/amt=([^&]+)/);
      if (match) amt = match[1];
    }
    if (amt) {
      const val = parseFloat(amt);
      return {
        method: 'Auto',
        category: 'Printing',
        service: val < 0 ? 'Print Credits Subtracted' : 'Print Credits Added',
      };
    }

    if (domain.includes('alma.exlibrisgroup.com')) {
      if (path.includes('fulfillment_checkout'))
        return {
          method: 'Auto',
          category: 'Circulation',
          service: 'Student Lookup',
        };
      if (path.includes('patron-workbench'))
        return {
          method: 'Auto',
          category: 'Circulation',
          service: 'Item Check-Out',
        };
      if (path.includes('return-items'))
        return {
          method: 'Auto',
          category: 'Circulation',
          service: 'Item Check-In',
        };
      return {
        method: 'Auto',
        category: 'Circulation',
        service: 'Other Circulation',
      };
    }

    if (
      domain.includes('portal.azure.com') ||
      domain.includes('portal.azure.net')
    )
      return {
        method: 'Auto',
        category: 'IT & Software',
        service: 'MFA Reset',
      };

    if (domain.includes('idm.georgebrown.ca'))
      return {
        method: 'Auto',
        category: 'IT & Software',
        service: 'Password Reset',
      };

    if (
      domain.includes('llcprint.georgebrown.ca') ||
      urlStr.includes('Transaction')
    )
      return {
        method: 'Auto',
        category: 'Printing',
        service: 'Print Credits (Unknown)',
      };

    return {
      method: 'Auto',
      category: 'Other',
      service: 'Unknown Web Service',
    };
  } catch (e) {
    return { method: 'Unknown', category: 'Other', service: 'Unknown Error' };
  }
}

export function formatCSVDate(dateObj: Date) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getDayOfWeek(dateObj: Date) {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[dateObj.getDay()];
}
