import React, { useEffect, useState } from 'react';
import { CheckCircle, Wrench, AlertCircle, ShoppingCart, Package } from 'lucide-react';

export const RecentActivities = ({ userRole }) => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/reports/activities`);
        const data = await response.json();
        if (response.ok) {
          setActivities(data);
        } else {
          setActivities([]);
        }
      } catch {
        setActivities([]);
      }
    };
    loadActivities();
  }, []);

  const getActivityIcon = (type, status) => {
    if (type === 'repair' && status === 'completed') 
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (type === 'repair') 
      return <Wrench className="w-5 h-5 text-blue-500" />;
    if (type === 'diagnosis') 
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    if (type === 'inventory') 
      return <Package className="w-5 h-5 text-red-500" />;
    return <ShoppingCart className="w-5 h-5 text-purple-500" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b">
            {getActivityIcon(activity.type, activity.status)}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{activity.title}</p>
              {activity.customer && (
                <p className="text-sm text-gray-500">Customer: {activity.customer}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};