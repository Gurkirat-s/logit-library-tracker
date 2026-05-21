export interface LogEntry {
  number: string;
  url: string;
  time: string;
}

export const saveLog = async (
  number: string,
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

  // Save the new log
  logs.push({ number: number, url: currentUrl, time: timestamp });
  await browser.storage.local.set({ logs: logs });
  console.log('Log saved:', number, currentUrl);
};
