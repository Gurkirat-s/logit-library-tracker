import { getTransactionDetails } from './parser';

export interface LogEntry {
  number: string | null;
  url: string;
  time: string;
  method: string;
  category: string;
  service: string;
  location: string;
  duration?: string;
}

export const saveLog = async (
  number: string | null,
  overrideUrl: string | null = null,
  duration: string | null = null,
) => {
  const data = (await browser.storage.local.get([
    'isRecording',
    'logs',
    'location',
  ])) as {
    isRecording?: boolean;
    logs?: LogEntry[];
    location?: string;
  };

  if (!data.isRecording) {
    console.log('Logging paused. Ignored:', number);
    return;
  }

  const logs: LogEntry[] = data.logs || [];
  const currentUrl = overrideUrl || window.location.href;
  const timestamp = new Date().toISOString();
  const currentLocation = data.location || 'Unknown_Location';

  const lastEntry = logs[logs.length - 1];
  if (
    lastEntry &&
    lastEntry.number === number &&
    lastEntry.url === currentUrl
  ) {
    if (!currentUrl.startsWith('manual-entry')) return;
  }

  const details = getTransactionDetails(currentUrl);

  logs.push({
    number: number,
    url: currentUrl,
    time: timestamp,
    method: details.method,
    category: details.category,
    service: details.service,
    location: currentLocation,
    duration: duration || '',
  });

  await browser.storage.local.set({ logs: logs });
  console.log(
    'Structured Log saved:',
    details.service,
    duration ? `(${duration})` : '',
  );
};
