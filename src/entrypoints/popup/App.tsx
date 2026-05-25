import { useState, useEffect } from 'react';
import { formatCSVDate, formatCSVTime, getDayOfWeek } from '../../utils/parser';
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
    }
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      alert('No data to export.');
      return;
    }

    let csvContent =
      'Location,Date,Day_of_Week,Time,Method,Category,Specific_Service,Input_ID,Full_URL\n';

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

      // Access properties directly from the log object!
      csvContent += `"${location}","${dateIso}","${dayOfWeek}","${timeStr}","${finalMethod}","${log.category}","${log.service}","${cleanId}","${cleanUrl}"\n`;
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
    // Access properties directly from the log object!
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

  return (
    <>
      <div className="header-row">
        <h2>Library Tracker</h2>
        <select
          id="locationSelect"
          defaultValue=""
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
        <button id="panelBtn" onClick={togglePanel}>
          {showPanel ? 'Hide Panel' : 'Show Panel'}
        </button>
        <button id="exportBtn" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div className="stats-box">
        <div className="stats-header">Session Totals</div>
        <table id="stats-table">
          <tbody>
            {sortedStats.length === 0 ? (
              <tr>
                <td style={{ color: '#aaa' }}>No data yet...</td>
              </tr>
            ) : (
              sortedStats.map(([name, count]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td className="count-col">{count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3>Recent Activity</h3>
      <div id="log-container">
        {todaysLogs.length === 0 ? (
          <div style={{ padding: '10px', color: '#ccc' }}>
            No activity today.
          </div>
        ) : (
          todaysLogs
            .slice()
            .reverse()
            .slice(0, 50)
            .map((log, index) => {
              let borderColor = '#ccc';

              // Access properties directly from the log object!
              if (log.category === 'Circulation') borderColor = '#fd7e14';
              else if (log.category === 'ID Card Services')
                borderColor = '#0d6efd';
              else if (log.category === 'IT & Software')
                borderColor = '#6f42c1';
              else if (log.category === 'Printing') borderColor = '#28a745';
              else if (log.category === 'General Assistance')
                borderColor = '#6c757d';

              let displayName = log.service;
              if (log.category === 'Circulation')
                displayName = `Circulation: ${log.service}`;

              return (
                <div
                  key={index}
                  className="log-entry"
                  style={{ borderLeft: `4px solid ${borderColor}` }}
                >
                  <span style={{ fontWeight: 'bold' }}>{log.number}</span>
                  <span className="log-time" style={{ fontSize: '10px' }}>
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
