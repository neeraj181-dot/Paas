import React, { useState } from 'react';
import { Plus, Terminal, RefreshCw, AlertTriangle, CheckCircle, Hash } from 'lucide-react';
import { api } from '../services/api';

export default function DeployForm({ onDeploySuccess }) {
  const [appName, setAppName] = useState('');
  const [port, setPort] = useState('');
  
  // State for form validation errors
  const [errors, setErrors] = useState({});
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Notification states
  const [notification, setNotification] = useState(null); // { type: 'success'|'danger', message: '' }

  const validateForm = () => {
    const newErrors = {};
    
    // Validate app_name
    if (!appName.trim()) {
      newErrors.appName = 'Application name is required';
    } else {
      // Docker name regex: lowercase alphanumeric, hyphens, starts with alphanumeric
      const nameRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
      if (!nameRegex.test(appName)) {
        newErrors.appName = 'Lowercase alphanumeric & hyphens only. Must start/end with letters/numbers.';
      }
    }

    // Validate port
    if (!port) {
      newErrors.port = 'Port mapping is required';
    } else {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        newErrors.port = 'Port must be a valid number between 1 and 65535';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await api.deployApp(appName.trim(), port);
    setIsSubmitting(false);

    if (result.success) {
      setNotification({
        type: 'success',
        message: `Successfully deployed "${result.data.name}" mapped to port ${result.data.port}!`,
      });
      setAppName('');
      setPort('');
      setErrors({});
      if (onDeploySuccess) {
        onDeploySuccess();
      }
    } else {
      setNotification({
        type: 'danger',
        message: result.error || 'Deployment failed. Please verify that the name/port isn\'t already in use.',
      });
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <Terminal size={20} style={{ color: 'var(--primary)' }} />
          <span>Deploy Application</span>
        </h2>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          <div className="alert-icon">
            {notification.type === 'success' ? (
              <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            ) : (
              <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            )}
          </div>
          <div className="alert-content">{notification.message}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="appName">
            Application Name
          </label>
          <div className="input-container">
            <Terminal className="input-icon" />
            <input
              id="appName"
              type="text"
              className="form-input"
              placeholder="e.g. web-server"
              value={appName}
              onChange={(e) => setAppName(e.target.value.toLowerCase())}
              disabled={isSubmitting}
            />
          </div>
          {errors.appName && (
            <span className="validation-error">
              <AlertTriangle size={12} /> {errors.appName}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="port">
            Host Port Mapping
          </label>
          <div className="input-container">
            <Hash className="input-icon" />
            <input
              id="port"
              type="number"
              className="form-input"
              placeholder="e.g. 8080"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              disabled={isSubmitting}
              min="1"
              max="65535"
            />
          </div>
          {errors.port && (
            <span className="validation-error">
              <AlertTriangle size={12} /> {errors.port}
            </span>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="spinning" size={18} />
              <span>Deploying...</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span>Deploy App</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
