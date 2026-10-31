import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wrench,
  Bell,
  LogOut,
  User,
  Package,
  Search,
  History
} from 'lucide-react';

export const TechnicianSidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/my-repair-tasks', icon: Wrench, label: 'My Repair Tasks' },
    { path: '/my-repair-history', icon: History, label: 'My Repair History' },
    { path: '/browse-spare-parts', icon: Search, label: 'Browse Spare Parts' },
    { path: '/request-spare-parts', icon: Package, label: 'Request Spare Parts' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
  ];

  return (
    <div className="w-64 bg-blue-600 text-white min-h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold">COREX LTD</h1>
            <p className="text-xs text-blue-200">Technician Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.username || 'Technician'}</p>
            <p className="text-xs text-blue-200 capitalize">{user.role || 'technician'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-red-600 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};
