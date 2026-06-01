import React, { useRef, useEffect, useState } from 'react';
import { saveLog } from '../utils/logger';
import panelCss from './FloatingPanel.css?inline';

interface FloatingPanelProps {
  userLocation: string;
}

export default function FloatingPanel({ userLocation }: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Time Tracking State
  const [pendingService, setPendingService] = useState<string | null>(null);

  const isDragging = useRef(false);
  const position = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const isFirstDrag = useRef(true);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;

    if (panelRef.current && isFirstDrag.current) {
      const rect = panelRef.current.getBoundingClientRect();
      panelRef.current.style.bottom = 'auto';
      panelRef.current.style.right = 'auto';
      panelRef.current.style.left = `${rect.left}px`;
      panelRef.current.style.top = `${rect.top}px`;
      isFirstDrag.current = false;
    }

    dragStart.current = {
      x: e.clientX - position.current.x,
      y: e.clientY - position.current.y,
    };

    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    browser.storage.local.get('panelPosition').then((data) => {
      const pos = data.panelPosition as
        | { top: number; left: number }
        | undefined;

      if (pos && panelRef.current) {
        const safeTop = Math.max(0, Math.min(pos.top, window.innerHeight - 50));
        const safeLeft = Math.max(
          0,
          Math.min(pos.left, window.innerWidth - 100),
        );

        panelRef.current.style.bottom = 'auto';
        panelRef.current.style.right = 'auto';
        panelRef.current.style.top = `${safeTop}px`;
        panelRef.current.style.left = `${safeLeft}px`;
        isFirstDrag.current = false;
      }
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !panelRef.current) return;

      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;

      position.current = { x: newX, y: newY };
      panelRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.userSelect = '';

        if (panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          browser.storage.local.set({
            panelPosition: { top: rect.top, left: rect.left },
          });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleServiceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const serviceId = btn.getAttribute('data-id');
    if (serviceId) {
      setPendingService(serviceId);
    }
  };

  const handleTimeSelect = async (duration: string) => {
    if (!pendingService) return;
    const virtualUrl = 'manual-entry://' + pendingService;

    await saveLog('Manual', virtualUrl, duration);

    setPendingService(null);
  };

  return (
    <div
      ref={panelRef}
      className="floating-panel"
      style={{
        transform: `translate(${position.current.x}px, ${position.current.y}px)`,
        willChange: 'transform',
      }}
    >
      <div
        className="drag-handle"
        title="Drag to move"
        onMouseDown={handleMouseDown}
      ></div>

      {pendingService ? (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
            paddingLeft: '4px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#666',
              marginRight: '4px',
            }}
          >
            Time:
          </span>
          <button
            style={{ backgroundColor: '#28a745' }}
            onClick={() => handleTimeSelect('< 2m')}
          >
            &lt; 2m
          </button>
          <button
            style={{ backgroundColor: '#fd7e14' }}
            onClick={() => handleTimeSelect('2-5m')}
          >
            2-5m
          </button>
          <button
            style={{ backgroundColor: '#dc3545' }}
            onClick={() => handleTimeSelect('5-15m')}
          >
            5-15m
          </button>
          <button
            style={{ backgroundColor: '#6f42c1' }}
            onClick={() => handleTimeSelect('15m+')}
          >
            15m+
          </button>
          <button
            style={{ backgroundColor: '#6c757d', marginLeft: '6px' }}
            onClick={() => setPendingService(null)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
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
            <button>Software ▲</button>
            <div className="submenu">
              <button
                data-id="Software_-_AppsAnywhere"
                onClick={handleServiceClick}
              >
                AppsAnywhere
              </button>
              <button
                data-id="Software_-_Auto_Desk"
                onClick={handleServiceClick}
              >
                Auto Desk
              </button>
              <button
                data-id="Software_-_Office365"
                onClick={handleServiceClick}
              >
                Office365
              </button>
              <button data-id="Software_-_Other" onClick={handleServiceClick}>
                Other
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
