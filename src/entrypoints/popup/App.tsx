type StoredData = {
  showPanel?: boolean;
  location?: string;
  isRecording?: boolean;
};

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [showPanel, setShowPanel] = useState(false);
  const [location, setLocation] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    browser.storage.local
      .get(['showPanel', 'location', 'isRecording'])
      .then((data: StoredData) => {
        console.log(data);
        setShowPanel(!!data.showPanel);
        setLocation(typeof data.location === 'string' ? data.location : '');
        setIsRecording(!!data.isRecording);
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
    console.log('Button Clicked');
    const newState: boolean = !showPanel;
    setShowPanel(newState);
    await browser.storage.local.set({ showPanel: newState });
  };

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
          id="toggleBtn"
          className={isRecording ? 'recording' : ''}
          onClick={handletoggleRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button id="panelBtn" onClick={togglePanel}>
          {showPanel ? 'Hide Panel' : 'Show Panel'}
        </button>
        <button id="exportBtn">Export CSV</button>
      </div>

      <div className="stats-box">
        <div className="stats-header">Session Totals</div>
        <table id="stats-table">
          <tbody>
            <tr>
              <td style={{ color: '#aaa' }}>No data yet...</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Recent Activity</h3>
      <div id="log-container"></div>

      <button id="clearMemBtn">Clear All Memory</button>
    </>
  );
}

export default App;
