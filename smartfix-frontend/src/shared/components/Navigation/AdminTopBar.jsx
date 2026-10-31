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
  Clock,
  UserCheck,
  ChevronDown,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Moon,
  Sun,
  Maximize,
  Minimize,
  RefreshCw
} from 'lucide-react';
import { logout } from '../../../store/slices/authSlice';

export const AdminTopBar = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Load admin notifications
  useEffect(() => {
    const loadAdminNotifications = async () => {
      try {
        const [inventoryRes, repairRes, pendingRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/auth/pending`)
        ]);
        
        const inventory = inventoryRes.ok ? await inventoryRes.json() : [];
        const repairTasks = repairRes.ok ? await repairRes.json() : [];
        const pendingUsers = pendingRes.ok ? await pendingRes.json() : [];
        const notifications = [];
        
        if (pendingUsers.length > 0) {
          notifications.push({ 
            id: 'admin-pending-users', 
            type: 'pending-users', 
            title: `${pendingUsers.length} account${pendingUsers.length > 1 ? 's' : ''} pending approval`, 
            detail: 'New user registrations require your approval before they can log in.', 
            actionPath: '/admin/pending-users',
            priority: 'high'
          });
        }
        
        inventory.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const reorder = Number(item.reorderPoint || 0);
          if (qty === 0) {
            notifications.push({ 
              id: `admin-stockout-${item.id}`, 
              type: 'stockout', 
              title: `${item.name} is out of stock`, 
              detail: 'Urgent: replenishment needed.', 
              actionPath: '/inventory',
              priority: 'high'
            });
          } else if (qty <= reorder) {
            notifications.push({ 
              id: `admin-low-${item.id}`, 
              type: 'low-stock', 
              title: `${item.name} is running low`, 
              detail: `${qty} left. Reorder point: ${reorder}.`, 
              actionPath: '/inventory',
              priority: 'medium'
            });
          }
        });
        
        repairTasks.forEach((task) => {
          if (task.status === 'PENDING') {
            notifications.push({ 
              id: `admin-repair-${task.id}`, 
              type: 'pending-repair', 
              title: `Pending repair: ${task.deviceType || 'Device'}${task.deviceModel ? ` — ${task.deviceModel}` : ''}`, 
              detail: 'Assign a technician to handle this repair.', 
              actionPath: '/my-repair-tasks',
              priority: 'medium'
            });
          }
        });
        
        setAdminNotifications(notifications);
      } catch {}
    };
    
    loadAdminNotifications();
    const interval = setInterval(loadAdminNotifications, 30000);
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
      // Implement global search functionality
      console.log('Searching for:', searchQuery);
      // You can navigate to a search results page or filter current page
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pending-users':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      case 'stockout':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'low-stock':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'pending-repair':
        return <Clock className="w-4 h-4 text-orange-500" />;
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
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const highPriorityCount = adminNotifications.filter(n => n.priority === 'high').length;

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
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500"
              placeholder="Search inventory, users, reports..."
            />
          </form>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button
            onClick={refreshPage}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh Page"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {adminNotifications.length > 0 && (
                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ${highPriorityCount > 0 ? 'animate-pulse' : ''}`}>
                  {adminNotifications.length > 99 ? '99+' : adminNotifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">System Notifications</h3>
                    <span className="text-xs text-gray-500">{adminNotifications.length} total</span>
                  </div>
                </div>

                {adminNotifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications at this time</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {adminNotifications.slice(0, 10).map((notification) => (
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
                                'bg-blue-100 text-blue-700'
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

                {adminNotifications.length > 10 && (
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
                style={{ backgroundColor: '#c0392b' }}
              >
                {user?.fullName ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'A'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Admin User'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b bg-gray-50 rounded-t-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: '#c0392b' }}
                    >
                      {user?.fullName ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.fullName || 'Admin User'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full mt-1">
                        Administrator
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
                      navigate('/admin/settings');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900">System Settings</span>
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