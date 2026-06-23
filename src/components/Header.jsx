import React from 'react';
import { CloudLightning, Wifi, WifiOff } from 'lucide-react';

export default function Header({ isConnected }) {
  return (
    <header>
      <div className="header-title-section">
        <h1>
          <CloudLightning 
            className="logo-icon" 
            style={{ 
              color: 'var(--primary)', 
              filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' 
            }} 
            size={32} 
          />
          <span>Mini PaaS</span>
        </h1>
        <p>Deploy and manage Docker applications in real-time</p>
      </div>
      
      <div className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? (
          <>
            <Wifi size={16} />
            <span>Backend Online</span>
            <span className="status-dot pulse" />
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Backend Offline</span>
            <span className="status-dot" />
          </>
        )}
      </div>
    </header>
  );
}
