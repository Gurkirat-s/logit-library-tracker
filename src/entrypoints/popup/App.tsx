import { useState, useEffect } from 'react';
import { formatCSVDate, formatCSVTime, getDayOfWeek } from '../../utils/parser';
import logoUrl from '../../assets/icon.svg';
import { type LogEntry } from '../../utils/logger';
import './App.css';

type StoredData = {
  showPanel?: boolean;
  location?: string;
  isRecording?: boolean;
  logs?: LogEntry[];
};

function App() {
  const [showPanel, setShowPanel] = useState(false);
  const [location, setLocation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    browser.storage.local
      .get(['showPanel', 'location', 'isRecording', 'logs'])
      .then((data: StoredData) => {
        setShowPanel(!!data.showPanel);
        setIsRecording(!!data.isRecording);
        setLocation(typeof data.location === 'string' ? data.location : '');
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      });
  }, []);

  const handleLocationChange = async (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    await browser.storage.local.set({ location: newLocation });
  };

  const handletoggleRecording = async () => {
    if (!location) {
      alert('Please select a location before starting recording.');
      document.getElementById('locationSelect')?.focus();
      return;
    }
    const newRecordingState = !isRecording;
    setIsRecording(newRecordingState);
    await browser.storage.local.set({ isRecording: newRecordingState });
  };

  const togglePanel = async () => {
    const newState: boolean = !showPanel;
    setShowPanel(newState);
    await browser.storage.local.set({ showPanel: newState });
  };

  const clearMemory = async () => {
    if (
      window.confirm(
        'Do you want permanently clear all logs and reset settings?',
      )
    ) {
      await browser.storage.local.clear();
      setLogs([]);
      setLocation('');
      setIsRecording(false);
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      alert('No data to export.');
      return;
    }

    let csvContent =
      'Location,Date,Day_of_Week,Time,Method,Category,Specific_Service,Duration,Input_ID,Full_URL\n';

    logs.forEach((log) => {
      const cleanUrl = log.url.replace(/"/g, '""');
      const dateObj = new Date(log.time);

      const dateIso = formatCSVDate(dateObj);
      const dayOfWeek = getDayOfWeek(dateObj);
      const timeStr = formatCSVTime(dateObj);

      let cleanId = '';
      if (
        log.number &&
        (/^\d{9}$/.test(log.number) || /^\d{13}$/.test(log.number))
      ) {
        cleanId = log.number;
      }

      const isManual = log.method === 'Manual';
      const finalMethod = isManual ? 'Manual' : log.method;
      const logLocation = log.location || 'Unknown';
      const logDuration = log.duration || '';

      csvContent += `"${logLocation}","${dateIso}","${dayOfWeek}","${timeStr}","${finalMethod}","${log.category}","${log.service}","${logDuration}","${cleanId}","${cleanUrl}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library_stats.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const todayDateStr = formatCSVDate(new Date());

  const todaysLogs = logs.filter((log) => {
    const logDate = new Date(log.time);
    return formatCSVDate(logDate) === todayDateStr;
  });

  const counts: Record<string, number> = {};
  todaysLogs.forEach((log) => {
    let statName = log.service;
    if (log.category === 'Circulation') {
      statName = `Circulation: ${log.service}`;
    } else if (
      ['AppsAnywhere', 'Auto Desk', 'Office365', 'Software (Other)'].includes(
        log.service,
      )
    ) {
      statName = 'Software';
    }
    counts[statName] = (counts[statName] || 0) + 1;
  });

  const sortedStats = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Circulation':
        return { bg: '#fff7ed', border: '#fdba74', text: '#c2410c' }; // Orange
      case 'ID Card Services':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }; // Blue
      case 'IT & Software':
        return { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' }; // Purple
      case 'Printing':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' }; // Green
      default:
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' }; // Slate for General/Misc
    }
  };

  return (
    <>
      <div className="header-row">
        <div className="brand-container">
          <img src={logoUrl} alt="LogIT Logo" className="brand-logo" />
          <h2>LogIT</h2>
        </div>
        <select
          id="locationSelect"
          value={location}
          onChange={handleLocationChange}
        >
          <option value="" disabled>
            Select Location
          </option>
          <option value="Casa Loma">Casa Loma</option>
          <option value="Waterfront">Waterfront</option>
          <option value="St. James">St. James</option>
          <option value="TMU">TMU</option>
        </select>
      </div>

      <div className="controls-row">
        <button
          id="recordBtn"
          className={isRecording ? 'recording' : ''}
          onClick={handletoggleRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button
          id="panelBtn"
          className={showPanel ? 'active-panel' : ''}
          onClick={togglePanel}
        >
          {showPanel ? 'Hide Panel' : 'Show Panel'}
        </button>
        <button id="exportBtn" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div className="stats-header">Session Totals</div>
      <div className="compact-stats-container">
        {sortedStats.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>
            No data yet today...
          </div>
        ) : (
          sortedStats.map(([name, count]) => (
            <div className="stat-pill" key={name}>
              <span className="stat-label">{name}</span>
              <span className="stat-value">{count}</span>
            </div>
          ))
        )}
      </div>

      <h3>Recent Activity</h3>
      <div id="log-container">
        {todaysLogs.length === 0 ? (
          <div style={{ padding: '10px', color: '#94a3b8' }}>
            Awaiting first interaction...
          </div>
        ) : (
          todaysLogs
            .slice()
            .reverse()
            .slice(0, 50)
            .map((log, index) => {
              const styles = getCategoryStyles(log.category);
              let displayName = log.duration
                ? `${log.service} (${log.duration})`
                : log.service;
              if (log.category === 'Circulation')
                displayName = `Circulation: ${log.service}`;

              return (
                <div
                  key={index}
                  className="log-entry"
                  style={{
                    backgroundColor: styles.bg,
                    borderLeft: `4px solid ${styles.border}`,
                  }}
                >
                  <span className="log-id" style={{ color: styles.text }}>
                    {log.number || 'Manual'}
                  </span>
                  <span className="log-service" style={{ color: styles.text }}>
                    {displayName}
                  </span>
                </div>
              );
            })
        )}
      </div>

      <button id="clearMemBtn" onClick={clearMemory}>
        Clear All Memory
      </button>
    </>
  );
}

export default App;
