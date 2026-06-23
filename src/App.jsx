import React, { useState, useEffect, useCallback } from 'react';
import { Server, Activity, Power, ShieldAlert } from 'lucide-react';
import Header from './components/Header';
import AppCard from './components/AppCard';
import DeployForm from './components/DeployForm';
import AppsTable from './components/AppsTable';
import { api } from './services/api';

export default function App() {
  const [apps, setApps] = useState([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  
  // Modal configurations
  const [deleteTarget, setDeleteTarget] = useState(null); // name of the app to delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch logic for dashboard metrics and container listings
  const loadDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoadingApps(true);
    }
    
    // 1. Check if backend is alive
    const statusResult = await api.checkStatus();
    const isOnline = statusResult.success;
    setBackendConnected(isOnline);

    if (isOnline) {
      // 2. Fetch running apps
      const appsResult = await api.fetchApps();
      if (appsResult.success) {
        setApps(appsResult.data);
      } else {
        console.error('Failed to load apps:', appsResult.error);
      }
    } else {
      // If backend goes offline, clear container list
      setApps([]);
    }
    
    setIsLoadingApps(false);
  }, []);

  // Poll dashboard data and check status on mount and every 5 seconds
  useEffect(() => {
    loadDashboardData(true); // Initial load with spinner

    const interval = setInterval(() => {
      loadDashboardData(false); // Silent background refresh
    }, 5000);

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Handle manual user refresh
  const handleManualRefresh = () => {
    loadDashboardData(true);
  };

  // Open deletion confirmation modal
  const handleDeleteRequest = (appName) => {
    setDeleteTarget(appName);
    setDeleteError(null);
  };

  // Close deletion confirmation modal
  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError(null);
    setIsDeleting(false);
  };

  // Confirm container destruction
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError(null);
    
    const result = await api.deleteApp(deleteTarget);
    setIsDeleting(false);

    if (result.success) {
      closeDeleteModal();
      loadDashboardData(true); // Reload with fresh state
    } else {
      setDeleteError(result.error || 'Failed to delete application.');
    }
  };

  // Compute stats for KPI cards
  const totalAppsCount = apps.length;
  const activeAppsCount = apps.filter(app => app.status === 'running').length;

  return (
    <div className="app-container">
      {/* Header with connection status */}
      <Header isConnected={backendConnected} />

      {/* KPI metric cards row */}
      <div className="metrics-grid">
        <AppCard 
          title="Total Applications" 
          value={totalAppsCount} 
          icon={Server} 
        />
        <AppCard 
          title="Active Containers" 
          value={activeAppsCount} 
          icon={Activity} 
          colorClass={activeAppsCount > 0 ? 'accent-green' : ''}
        />
        <AppCard 
          title="System Core Status" 
          value={backendConnected ? 'OPERATIONAL' : 'OFFLINE'} 
          icon={Power}
          colorClass={backendConnected ? 'status-online' : 'status-offline'}
        />
      </div>

      {/* Main dashboard splits */}
      <div className="dashboard-grid">
        {/* Left pane: Deployment controls */}
        <DeployForm onDeploySuccess={() => loadDashboardData(true)} />
        
        {/* Right pane: Active containers list */}
        <AppsTable 
          apps={apps} 
          isLoading={isLoadingApps} 
          onRefresh={handleManualRefresh} 
          onDeleteRequest={handleDeleteRequest}
        />
      </div>

      {/* Trash/Stop Confirmation Modal Overlay */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <ShieldAlert size={24} />
              <h3 className="modal-title">Delete Container</h3>
            </div>
            
            <div className="modal-body">
              <p>
                Are you absolutely sure you want to stop and permanently remove application{' '}
                <span className="modal-highlight">{deleteTarget}</span>?
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                This action is irreversible. All container settings and local data will be deleted.
              </p>
              
              {deleteError && (
                <div className="alert alert-danger" style={{ marginTop: '1rem', marginBottom: 0 }}>
                  <div className="alert-content">{deleteError}</div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--danger)', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
