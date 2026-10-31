import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle,
  FileText,
  Bell,
  Settings,
  Eye,
  Plus,
  Brain,
  BarChart3,
  PackageX
} from 'lucide-react';

export const InventorySidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/inventory', label: 'Manage Stock', icon: Package },
    { path: '/inventory/stock-out', label: 'Stock Out Items', icon: PackageX },
    { path: '/inventory/stock-alerts', label: 'Stock Alerts', icon: AlertTriangle },
    { path: '/inventory/view', label: 'View Stock', icon: Eye },
    { path: '/inventory/ai-recommendations', label: 'AI Recommendations', icon: Brain },
    { path: '/inventory/reports', label: 'Inventory Reports', icon: BarChart3 },
    { path: '/notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="w-64 bg-blue-600 text-white h-screen flex flex-col shadow-lg border-r border-blue-700">
      {/* Header */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <Package className="w-7 h-7 text-blue-800" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">COREX LTD</h1>
            <p className="text-sm text-blue-200">Inventory Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-xl font-medium text-white">
              {user?.firstName?.charAt(0) || 'I'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-blue-200 truncate">Inventory Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-4 text-lg font-medium rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <Icon className="w-7 h-7 mr-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-blue-700">
        <div className="text-xs text-blue-200 text-center">
          <p>COREX LTD Inventory v1.0</p>
          <p className="mt-1">© 2024 Corex Ltd</p>
        </div>
      </div>
    </div>
  );
};