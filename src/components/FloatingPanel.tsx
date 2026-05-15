import './FloatingPanel.css';

interface FloatingPanelProps {
  userLocation: string;
}

export default function FloatingPanel({ userLocation }: FloatingPanelProps) {
  return (
    <div className="floating-panel">
      <div className="drag-handle" title="Drag to move"></div>

      <button data-id="Print Assistance">Print Help</button>
      <button data-id="WiFi">WiFi</button>
      <button data-id="Password/Account">Password/Account</button>

      {/* Conditional Rendering: Only shows if location is Casa Loma */}
      {userLocation === 'Casa Loma' && (
        <button data-id="3D-Print">3D-Print</button>
      )}

      <button data-id="Directions">Directions</button>
      <button data-id="Miscellaneous">Misc</button>

      <div className="menu-container">
        <button style={{ backgroundColor: '#468faf' }}>Software ▲</button>
        <div className="submenu">
          <button data-id="Software_-_AppsAnywhere">AppsAnywhere</button>
          <button data-id="Software_-_Auto_Desk">Auto Desk</button>
          <button data-id="Software_-_Office365">Office365</button>
          <button data-id="Software_-_Other">Other</button>
        </div>
      </div>
    </div>
  );
}
