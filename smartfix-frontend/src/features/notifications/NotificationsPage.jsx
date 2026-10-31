// src/features/notifications/NotificationsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle2, PackageCheck, Clock, Trash2, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const NotificationsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [user?.role, user?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // For inventory role, generate stock notifications from inventory data
      if (user?.role === 'inventory') {
        const inventoryRes = await fetch(`${API_BASE}/api/inventory`);
        const inventory = inventoryRes.ok ? await inventoryRes.json() : [];
        const stockNotifications = [];
        
        inventory.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const reorder = Number(item.reorderPoint || 0);
          const createdAt = new Date().toISOString();
          
          if (qty === 0) {
            stockNotifications.push({ 
              id: `stockout-${item.id}`,
              type: 'stockout',
              title: `${item.name} is out of stock`,
              detail: 'This item needs urgent stock replenishment.',
              actionPath: '/inventory',
              actionLabel: 'View Inventory',
              isRead: false,
              createdAt: createdAt,
              priority: 'high'
            });
          } else if (qty <= reorder) {
            stockNotifications.push({ 
              id: `low-stock-${item.id}`,
              type: 'low-stock',
              title: `${item.name} is running low`,
              detail: `Only ${qty} units left in stock. Reorder point is ${reorder} units.`,
              actionPath: '/inventory',
              actionLabel: 'View Inventory',
              isRead: false,
              createdAt: createdAt,
              priority: 'medium'
            });
          }
        });
        
        // Sort by priority (high first)
        stockNotifications.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        
        setItems(stockNotifications);
        setUnreadCount(stockNotifications.length);
      } else {
        // For other roles, fetch from backend API
        const params = new URLSearchParams({
          role: user?.role || 'admin',
        });
        if (user?.id) {
          params.append('userId', user.id);
        }

        const response = await fetch(`${API_BASE}/api/notifications?${params}`);
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          console.error('Failed to load notifications');
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const params = new URLSearchParams({
        role: user?.role || 'admin',
      });
      if (user?.id) {
        params.append('userId', user.id);
      }

      const response = await fetch(`${API_BASE}/api/notifications/unread-count?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const clearHistory = async () => {
    // For inventory role with local notifications, just clear the state
    if (user?.role === 'inventory') {
      setItems([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
      return;
    }

    // For other roles, call backend API
    try {
      const params = new URLSearchParams({
        role: user?.role || 'admin',
      });
      if (user?.id) {
        params.append('userId', user.id);
      }

      const response = await fetch(`${API_BASE}/api/notifications/clear-all?${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('All notifications cleared');
        setItems([]);
        setUnreadCount(0);
      } else {
        toast.error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const markAsRead = async (notificationId) => {
    // For inventory role with local notifications, just update local state
    if (user?.role === 'inventory') {
      setItems(items.map(item => 
        item.id === notificationId ? { ...item, isRead: true } : item
      ));
      const newUnreadCount = items.filter(item => item.id !== notificationId && !item.isRead).length;
      setUnreadCount(newUnreadCount);
      return;
    }

    // For other roles, call backend API
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update local state
        setItems(items.map(item => 
          item.id === notificationId ? { ...item, isRead: true } : item
        ));
        loadUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    // For inventory role with local notifications, just update local state
    if (user?.role === 'inventory') {
      setItems(items.map(item => ({ ...item, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      return;
    }

    // For other roles, call backend API
    try {
      const params = new URLSearchParams({
        role: user?.role || 'admin',
      });
      if (user?.id) {
        params.append('userId', user.id);
      }

      const response = await fetch(`${API_BASE}/api/notifications/mark-all-read?${params}`, {
        method: 'PUT',
      });

      if (response.ok) {
        toast.success('All notifications marked as read');
        setItems(items.map(item => ({ ...item, isRead: true })));
        setUnreadCount(0);
      } else {
        toast.error('Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const Icon = ({ type }) => {
    if (type === 'stockout') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (type === 'low-stock') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    if (type === 'restocked') return <PackageCheck className="w-4 h-4 text-green-600" />;
    if (type === 'repair-completed') return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    if (type === 'warranty-expiry') return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    return <Bell className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow">
        <div className="px-6 py-5 border-b rounded-t-xl bg-gray-50 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500">
              {user?.role === 'inventory' ? 'Inventory Manager' : (user?.role || 'User')} notifications
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline">Back</button>
        </div>

        <div className="px-6 py-4 flex flex-wrap gap-3 items-center justify-end border-b">
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead} 
                className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark all read
              </button>
            )}
            <button 
              onClick={clearHistory} 
              className="flex items-center gap-1 text-xs text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500 text-sm">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No notifications found.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li 
                key={n.id} 
                className={`px-6 py-4 flex items-start gap-3 hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}
                onClick={() => !n.isRead && markAsRead(n.id)}
              >
                <div className="mt-0.5"><Icon type={n.type} /></div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                    {n.title}
                  </p>
                  {n.detail && <p className="text-xs text-gray-500 mt-1">{n.detail}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}</span>
                  </div>
                </div>
                {n.actionPath && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(n.actionPath);
                    }} 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {n.actionLabel || 'Open'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
