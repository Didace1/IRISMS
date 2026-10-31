import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Bell, 
  Search, 
  Settings, 
  User, 
  LogOut,
  AlertTriangle,
  PackageCheck,
  ChevronDown,
  Brain
} from 'lucide-react';
import { logout } from '../../../store/slices/authSlice';

export const InventoryTopBar = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [inventoryNotifications, setInventoryNotifications] = useState([]);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load inventory notifications
  useEffect(() => {
    const loadInventoryNotifications = async () => {
      try {
        const inventoryRes = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
        const inventory = inventoryRes.ok ? await inventoryRes.json() : [];
        const notifications = [];
        
        inventory.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const reorder = Number(item.reorderPoint || 0);
          if (qty === 0) {
            notifications.push({ 
              id: `inventory-stockout-${item.id}`, 
              type: 'stockout', 
              title: `${item.name} is out of stock`, 
              detail: 'This item needs urgent stock replenishment.', 
              actionPath: '/inventory',
              priority: 'high'
            });
          } else if (qty <= reorder) {
            notifications.push({ 
              id: `inventory-low-${item.id}`, 
              type: 'low-stock', 
              title: `${item.name} is running low`, 
              detail: `${qty} left in stock. Reorder point is ${reorder}.`, 
              actionPath: '/inventory',
              priority: 'medium'
            });
          }
        });
        
        setInventoryNotifications(notifications);
      } catch {}
    };
    
    loadInventoryNotifications();
    const interval = setInterval(loadInventoryNotifications, 30000);
    return () => clearInterval(interval);
  }, [SYSTEM_BACKEND_BASE_URL]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement inventory search functionality
      console.log('Searching inventory for:', searchQuery);
      navigate(`/inventory?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'stockout':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'low-stock':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'restocked':
        return <PackageCheck className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const highPriorityCount = inventoryNotifications.filter(n => n.priority === 'high').length;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left Section - Search */}
        <div className="flex items-center flex-1 max-w-lg">
          <form onSubmit={handleSearch} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search inventory items..."
            />
          </form>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* AI Recommendations Button */}
          <button
            onClick={() => navigate('/inventory/ai-recommendations')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="AI Recommendations"
          >
            <Brain className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Stock Notifications"
            >
              <Bell className="w-5 h-5" />
              {inventoryNotifications.length > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ${highPriorityCount > 0 ? 'animate-pulse' : ''}`}>
                  {inventoryNotifications.length > 99 ? '99+' : inventoryNotifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Stock Notifications</h3>
                    <span className="text-xs text-gray-500">{inventoryNotifications.length} total</span>
                  </div>
                </div>

                {inventoryNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No stock alerts at this time</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {inventoryNotifications.slice(0, 10).map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(notification.actionPath);
                        }}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 mb-1">{notification.title}</p>
                            <p className="text-xs text-gray-600">{notification.detail}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                                notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {notification.priority} priority
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {inventoryNotifications.length > 10 && (
                  <div className="p-3 border-t bg-gray-50 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/notifications');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: '#2563eb' }}
              >
                {user?.fullName ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'I'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Inventory Manager'}</p>
                <p className="text-xs text-gray-500">Inventory Manager</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: '#2563eb' }}
                    >
                      {user?.fullName ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'I'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'Inventory Manager'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                        Inventory Manager
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900">Profile Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900">Settings</span>
                  </button>

                  <div className="border-t border-gray-100 my-2"></div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};