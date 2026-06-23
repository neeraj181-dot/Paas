import React from 'react';

export default function AppCard({ title, value, icon: Icon, colorClass = '' }) {
  return (
    <div className={`metric-card ${colorClass}`}>
      <div className="metric-icon-wrapper">
        {Icon && <Icon size={22} />}
      </div>
      <div className="metric-info">
        <h3>{title}</h3>
        <div className="metric-value">{value}</div>
      </div>
    </div>
  );
}
