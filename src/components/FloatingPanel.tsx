import React, { useState, useRef, useEffect } from 'react';
import { saveLog } from '../utils/logger';
import panelCss from './FloatingPanel.css?inline'; // Using WXT's inline CSS

interface FloatingPanelProps {
  userLocation: string;
}

export default function FloatingPanel({ userLocation }: FloatingPanelProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Click handler for all manual service buttons
  const handleServiceClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const serviceId = btn.getAttribute('data-id');
    if (!serviceId) return;

    //Save original styles
    const originalText = btn.innerText;
    const originalColor = btn.style.backgroundColor;

    //Apply visual feedback
    btn.innerText = '✓';
    btn.style.backgroundColor = '#28a745'; // Success green

    //Revert after 800ms
    setTimeout(() => {
      btn.innerText = originalText;
      btn.style.backgroundColor = originalColor;
    }, 800);

    //Send to storage
    const virtualUrl = 'manual-entry://' + serviceId;
    console.log('Manual Service Clicked:', serviceId, virtualUrl); // Delete after
    await saveLog('Manual', virtualUrl);
  };

  return (
    <div
      className="floating-panel"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      <div
        className="drag-handle"
        title="Drag to move"
        onMouseDown={handleMouseDown}
      ></div>

      {/* onClick handler added to every button */}
      <button data-id="Print Assistance" onClick={handleServiceClick}>
        Print Help
      </button>
      <button data-id="WiFi" onClick={handleServiceClick}>
        WiFi
      </button>
      <button data-id="Password/Account" onClick={handleServiceClick}>
        Password/Account
      </button>

      {userLocation === 'Casa Loma' && (
        <button data-id="3D-Print" onClick={handleServiceClick}>
          3D-Print
        </button>
      )}

      <button data-id="Directions" onClick={handleServiceClick}>
        Directions
      </button>
      <button data-id="Miscellaneous" onClick={handleServiceClick}>
        Misc
      </button>

      <div className="menu-container">
        <button style={{ backgroundColor: '#468faf' }}>Software ▲</button>
        <div className="submenu">
          <button
            data-id="Software_-_AppsAnywhere"
            onClick={handleServiceClick}
          >
            AppsAnywhere
          </button>
          <button data-id="Software_-_Auto_Desk" onClick={handleServiceClick}>
            Auto Desk
          </button>
          <button data-id="Software_-_Office365" onClick={handleServiceClick}>
            Office365
          </button>
          <button data-id="Software_-_Other" onClick={handleServiceClick}>
            Other
          </button>
        </div>
      </div>
    </div>
  );
}
