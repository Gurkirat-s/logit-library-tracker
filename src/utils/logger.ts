import { getTransactionDetails } from './parser';

export interface LogEntry {
  number: string | null;
  url: string;
  time: string;
  method: string;
  category: string;
  service: string;
}

export const saveLog = async (
  number: string | null,
  overrideUrl: string | null = null,
) => {
  // Fetch current state of isRecording flag and logs stored in storage
  const data = (await browser.storage.local.get(['isRecording', 'logs'])) as {
    isRecording?: boolean;
    logs?: LogEntry[];
  };

  // Respect the recording toggle!
  if (!data.isRecording) {
    console.log('Logging paused. Ignored:', number);
    return;
  }

  const logs: LogEntry[] = data.logs || [];
  const currentUrl = overrideUrl || window.location.href;
  const timestamp = new Date().toISOString();

  // Prevent rapid duplicate logs (except for manual entries)
  const lastEntry = logs[logs.length - 1];
  if (
    lastEntry &&
    lastEntry.number === number &&
    lastEntry.url === currentUrl
  ) {
    if (!currentUrl.startsWith('manual-entry')) return;
  }

  // Streamlined Pipeline: Parse the data NOW, not during render
  const details = getTransactionDetails(currentUrl);

  // Save the newly structured log
  logs.push({
    number: number,
    url: currentUrl,
    time: timestamp,
    method: details.method,
    category: details.category,
    service: details.service,
  });

  await browser.storage.local.set({ logs: logs });
  console.log('Structured Log saved:', number, details.service);
};
