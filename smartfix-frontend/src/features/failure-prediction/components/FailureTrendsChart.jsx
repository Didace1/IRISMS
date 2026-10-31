// src/features/failure-prediction/components/AlertList.jsx
import React from 'react';
import { Bell, XCircle, Clock, Wrench } from 'lucide-react';

export const AlertList = ({ alerts, onDismiss, onViewAction }) => {
  const getAlertIcon = (severity) => {
    switch(severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTimeAgo = (date) => {
    const minutes = Math.floor((new Date() - new Date(date)) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return `${Math.floor(minutes / 1440)} days ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
        <p className="text-sm text-gray-600">Components requiring immediate attention</p>
      </div>
      
      <div className="divide-y">
        {alerts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No critical alerts at this time</p>
            <p className="text-sm text-gray-500">All components are operating within normal parameters</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <span className="text-xs text-gray-500">{getTimeAgo(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <button
                      onClick={() => onViewAction(alert)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Wrench className="w-3 h-3 mr-1" />
                      View Action
                    </button>
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};