import React, { useState, useRef, useEffect } from 'react';

interface FloatingPanelProps {
  userLocation: string;
}

export default function FloatingPanel({ userLocation }: FloatingPanelProps) {
  // 1. State to track the current drag offset
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Remember exactly where the mouse grabbed the handle
  const dragStart = useRef({ x: 0, y: 0 });

  // Triggered when the user clicks down on the textured handle
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // Track mouse movement while dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      // Calculate new position
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      className="floating-panel"
      style={{
        //Apply the position
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      <div
        className="drag-handle"
        title="Drag to move"
        onMouseDown={handleMouseDown}
      ></div>

      <button data-id="Print Assistance">Print Help</button>
      <button data-id="WiFi">WiFi</button>
      <button data-id="Password/Account">Password/Account</button>

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
