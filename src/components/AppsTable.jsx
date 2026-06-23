import React from 'react';
import { Server, RefreshCw, Trash2, Container } from 'lucide-react';

export default function AppsTable({ apps, isLoading, onRefresh, onDeleteRequest }) {
  return (
    <div className="panel" style={{ flexGrow: 1 }}>
      <div className="panel-header">
        <h2 className="panel-title">
          <Server size={20} style={{ color: 'var(--primary)' }} />
          <span>Running Applications</span>
        </h2>
        
        <div className="table-actions">
          <button 
            className="btn-refresh" 
            onClick={onRefresh} 
            disabled={isLoading}
            title="Refresh application list"
          >
            <RefreshCw className={isLoading ? 'spinning' : ''} size={16} />
          </button>
        </div>
      </div>

      <div className="table-responsive">
        {apps.length === 0 ? (
          <div className="empty-state">
            <Container size={40} className="empty-state-icon" />
            <h3>No applications found</h3>
            <p>Deploy your first Nginx container using the deployment form on the left.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>App Name</th>
                <th>Container ID</th>
                <th>Status</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.name}>
                  <td>
                    <div className="app-name-cell">
                      <span style={{ color: 'var(--secondary)' }}>⚡</span>
                      {app.name}
                    </div>
                  </td>
                  <td>
                    <span className="id-badge">{app.id || 'N/A'}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${app.status === 'running' ? 'running' : 'stopped'}`}>
                      <span className="status-dot" />
                      {app.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-danger"
                      onClick={() => onDeleteRequest(app.name)}
                      title={`Delete ${app.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
