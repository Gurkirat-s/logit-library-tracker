import './App.css';

function App() {
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    console.log('Hello');
    browser.storage.local.get('showPanel').then((data) => {
      console.log(data);
      setShowPanel(!!data.showPanel);
    });
  });

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
      <div id="log-container">{/* Transaction Entries */}</div>

      <button id="clearMemBtn">Clear All Memory</button>
    </>
  );
}

export default App;
