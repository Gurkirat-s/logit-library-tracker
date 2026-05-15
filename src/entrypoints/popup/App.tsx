import './App.css';

function App() {
  return (
    <>
      <div className="header-row">
        <h2>Library Tracker</h2>
        <select id="locationSelect" defaultValue="">
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
        <button id="toggleBtn">Start Record</button>
        <button id="panelBtn">Show Panel</button>
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
      <div id="log-container">
        {/* We will dynamically inject React log entries here later */}
      </div>

      <button id="clearMemBtn">Clear All Memory</button>
    </>
  );
}

export default App;
