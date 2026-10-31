// src/shared/components/Navigation/RoleBasedNavbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, AlertTriangle, CheckCircle2, PackageCheck, PlusCircle, Package, ChevronDown, Clock } from 'lucide-react';
import { logout } from '../../../store/slices/authSlice';

export const RoleBasedNavbar = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [taskCount, setTaskCount] = React.useState(0);
  const [newTaskCount, setNewTaskCount] = React.useState(0);
  const [salesNotifications, setSalesNotifications] = React.useState([]);
  const [inventoryNotifications, setInventoryNotifications] = React.useState([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notificationRef = React.useRef(null);
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  const quickActionsRef = React.useRef(null);
  const [openAdminGroup, setOpenAdminGroup] = React.useState(null);
  const adminNavRef = React.useRef(null);
  const [adminNotifications, setAdminNotifications] = React.useState([]);

  React.useEffect(() => {
    if (user?.role !== 'technician') return;

    const storageKey = `technician_last_seen_tasks_${user?.email || user?.id || 'default'}`;

    const loadTaskNotification = async () => {
      try {
        const response = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/dashboard/summary`);
        if (!response.ok) return;
        const summary = await response.json();
        const currentTasks = Number(summary?.pendingRepairs || 0);
        setTaskCount(currentTasks);

        const savedSeen = Number(localStorage.getItem(storageKey) || 0);
        if (!Number.isFinite(savedSeen)) {
          localStorage.setItem(storageKey, String(currentTasks));
          setNewTaskCount(0);
          return;
        }

        const delta = currentTasks - savedSeen;
        setNewTaskCount(delta > 0 ? delta : 0);
      } catch {
      }
    };

    loadTaskNotification();
    const interval = setInterval(loadTaskNotification, 30000);
    return () => clearInterval(interval);
  }, [SYSTEM_BACKEND_BASE_URL, user?.role, user?.email, user?.id]);

  React.useEffect(() => {
    if (user?.role !== 'sales') return;

    const storageKey = `sales_notifications_snapshot_${user?.email || user?.id || 'default'}`;

    const loadSalesNotifications = async () => {
      try {
        const [inventoryRes, repairRes] = await Promise.all([
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`),
          fetch(`${SYSTEM_BACKEND_BASE_URL}/api/repair-tasks`)
        ]);

        const inventory = inventoryRes.ok ? await inventoryRes.json() : [];
        const repairTasks = repairRes.ok ? await repairRes.json() : [];

        const previousSnapshot = JSON.parse(localStorage.getItem(storageKey) || '{"inventory":{},"completedTaskIds":[]}');
        const previousInventory = previousSnapshot.inventory || {};
        const previousCompletedTaskIds = new Set(previousSnapshot.completedTaskIds || []);

        const notifications = [];

        inventory.forEach((item) => {
          const previousQty = Number(previousInventory[item.id] ?? item.quantity);
          const currentQty = Number(item.quantity || 0);

          if (currentQty === 0) {
            notifications.push({
              id: `stockout-${item.id}`,
              type: 'stockout',
              title: `${item.name} is out of stock`,
              detail: 'Sales team should avoid promising this item until inventory is updated.',
              actionLabel: 'Open Sales',
              actionPath: '/sales'
            });
          }

          if (previousQty === 0 && currentQty > 0) {
            notifications.push({
              id: `restocked-${item.id}-${currentQty}`,
              type: 'restocked',
              title: `${item.name} has been restocked`,
              detail: `${currentQty} item${currentQty > 1 ? 's are' : ' is'} now available for sale.`,
              actionLabel: 'Open Sales',
              actionPath: '/sales'
            });
          }
        });

        repairTasks.forEach((task) => {
          if (task.status === 'COMPLETED' && !previousCompletedTaskIds.has(task.id)) {
            notifications.push({
              id: `repair-completed-${task.id}`,
              type: 'repair-completed',
              title: `Repair completed for ${task.deviceType || 'device'}${task.deviceModel ? ` — ${task.deviceModel}` : ''}`,
              detail: 'The salesperson can now update the customer for pickup or next step.',
              actionLabel: 'Open Repair Tasks',
              actionPath: '/sales-repairs'
            });
          }
        });

        const nextSnapshot = {
          inventory: inventory.reduce((acc, item) => {
            acc[item.id] = Number(item.quantity || 0);
            return acc;
          }, {}),
          completedTaskIds: repairTasks.filter((task) => task.status === 'COMPLETED').map((task) => task.id)
        };

        localStorage.setItem(storageKey, JSON.stringify(nextSnapshot));
        setSalesNotifications(notifications);
      } catch {
      }
    };

    loadSalesNotifications();
    const interval = setInterval(loadSalesNotifications, 30000);
    return () => clearInterval(interval);
  }, [SYSTEM_BACKEND_BASE_URL, user?.role, user?.email, user?.id]);

  React.useEffect(() => {
    if (user?.role !== 'inventory') return;

    const storageKey = `inventory_notifications_snapshot_${user?.email || user?.id || 'default'}`;

    const loadInventoryNotifications = async () => {
      try {
        const inventoryRes = await fetch(`${SYSTEM_BACKEND_BASE_URL}/api/inventory`);
        const inventory = inventoryRes.ok ? await inventoryRes.json() : [];

        const previousSnapshot = JSON.parse(localStorage.getItem(storageKey) || '{"quantities":{}}');
        const previousQuantities = previousSnapshot.quantities || {};
        const notifications = [];

        inventory.forEach((item) => {
          const previousQty = Number(previousQuantities[item.id] ?? item.quantity);
          const currentQty = Number(item.quantity || 0);
          const reorderPoint = Number(item.reorderPoint || 0);

          if (currentQty === 0) {
            notifications.push({
              id: `inventory-stockout-${item.id}`,
              type: 'stockout',
              title: `${item.name} is out of stock`,
              detail: 'This item needs urgent stock replenishment.',
              actionLabel: 'Open Inventory',
              actionPath: '/inventory'
            });
          } else if (currentQty <= reorderPoint) {
            notifications.push({
              id: `inventory-low-${item.id}`,
              type: 'low-stock',
              title: `${item.name} is running low`,
              detail: `${currentQty} left in stock. Reorder point is ${reorderPoint}.`,
              actionLabel: 'Open Inventory',
              actionPath: '/inventory'
            });
          }

          if (previousQty < reorderPoint && currentQty > reorderPoint) {
            notifications.push({
              id: `inventory-recovered-${item.id}-${currentQty}`,
              type: 'restocked',
              title: `${item.name} stock has recovered`,
              detail: `Current quantity is ${currentQty}, now above reorder point.`,
              actionLabel: 'Open Inventory',
              actionPath: '/inventory'
            });
          }
        });

        localStorage.setItem(storageKey, JSON.stringify({
          quantities: inventory.reduce((acc, item) => {
            acc[item.id] = Number(item.quantity || 0);
            return acc;
          }, {})
        }));

        setInventoryNotifications(notifications);
      } catch {
      }
    };

    loadInventoryNotifications();
    const interval = setInterval(loadInventoryNotifications, 30000);
    return () => clearInterval(interval);
  }, [SYSTEM_BACKEND_BASE_URL, user?.role, user?.email, user?.id]);

  React.useEffect(() => {
    if (user?.role !== 'admin') return;
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
          notifications.push({ id: 'admin-pending-users', type: 'pending-users', title: `${pendingUsers.length} account${pendingUsers.length > 1 ? 's' : ''} pending approval`, detail: 'New user registrations require your approval before they can log in.', actionPath: '/admin/pending-users' });
        }
        inventory.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const reorder = Number(item.reorderPoint || 0);
          if (qty === 0) {
            notifications.push({ id: `admin-stockout-${item.id}`, type: 'stockout', title: `${item.name} is out of stock`, detail: 'Urgent: replenishment needed.', actionPath: '/inventory' });
          } else if (qty <= reorder) {
            notifications.push({ id: `admin-low-${item.id}`, type: 'low-stock', title: `${item.name} is running low`, detail: `${qty} left. Reorder point: ${reorder}.`, actionPath: '/inventory' });
          }
        });
        repairTasks.forEach((task) => {
          if (task.status === 'PENDING') {
            notifications.push({ id: `admin-repair-${task.id}`, type: 'pending-repair', title: `Pending repair: ${task.deviceType || 'Device'}${task.deviceModel ? ` — ${task.deviceModel}` : ''}`, detail: 'Assign a technician to handle this repair.', actionPath: '/my-repair-tasks' });
          }
        });
        setAdminNotifications(notifications);
      } catch {}
    };
    loadAdminNotifications();
    const interval = setInterval(loadAdminNotifications, 30000);
    return () => clearInterval(interval);
  }, [SYSTEM_BACKEND_BASE_URL, user?.role]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target)) {
        setShowQuickActions(false);
      }
      if (adminNavRef.current && !adminNavRef.current.contains(event.target)) {
        setOpenAdminGroup(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = () => {
    if (user?.role !== 'technician') return;
    const storageKey = `technician_last_seen_tasks_${user?.email || user?.id || 'default'}`;
    localStorage.setItem(storageKey, String(taskCount));
    setNewTaskCount(0);
    navigate('/my-repair-tasks');
  };

  const handleSalesNotificationsToggle = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleSalesNotificationClick = (path) => {
    setShowNotifications(false);
    navigate(path);
  };

  const handleInventoryNotificationClick = (path) => {
    setShowNotifications(false);
    navigate(path);
  };

  // Define navigation items with role-based access
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: '📊',
      roles: ['admin', 'technician', 'inventory', 'sales']
    },
    { 
      path: '/diagnosis', 
      label: 'Fault Diagnosis', 
      icon: '🔍',
      roles: ['admin', 'technician']
    },
    { 
      path: '/failure-prediction', 
      label: 'Failure Prediction', 
      icon: '⚠️',
      roles: ['admin']
    },
    { 
      path: '/repair', 
      label: 'Repair Guide', 
      icon: '🔧',
      roles: ['admin']
    },
    {
      path: '/browse-spare-parts',
      label: 'Browse Spare Parts',
      icon: '📦',
      roles: ['admin']
    },
    {
      path: '/request-spare-parts',
      label: 'Spare Parts Request',
      icon: '🧾',
      roles: ['admin']
    },
    {
      path: '/my-repair-tasks',
      label: 'My Repair Tasks',
      icon: '🛠️',
      roles: ['admin', 'technician']
    },
    { 
      path: '/inventory', 
      label: 'Inventory', 
      icon: '📦',
      roles: ['admin', 'inventory']
    },
    { 
      path: '/sales', 
      label: 'Sales', 
      icon: '💰',
      roles: ['admin', 'sales']
    },
    {
      path: '/sales-history',
      label: 'Sales History',
      icon: '📋',
      roles: ['admin', 'sales']
    },
    {
      path: '/sales-repairs',
      label: 'Repair Tasks',
      icon: '🧰',
      roles: ['admin', 'sales']
    },
    { 
      path: '/customers', 
      label: 'Customers', 
      icon: '👥',
      roles: ['admin', 'sales']
    },
    { 
      path: '/technicians', 
      label: 'Technicians', 
      icon: '👨‍🔧',
      roles: ['admin']
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: '📈',
      roles: ['admin']
    }
  ];

  // Filter navigation items based on user role
  const accessibleNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const adminNavGroups = [
    {
      label: 'Repairs', icon: '🛠️',
      items: [
        { path: '/technicians', label: 'Technicians', icon: '👨‍🔧' },
        { path: '/repair-analytics', label: 'Repair Analytics', icon: '📊' },
        { path: '/repair-history', label: 'Repair History', icon: '📋' },
        { path: '/browse-spare-parts', label: 'Browse Spare Parts', icon: '📦' },
        { path: '/request-spare-parts', label: 'Spare Part Requests', icon: '🧾' },
      ]
    },
    {
      label: 'Inventory', icon: '📦',
      items: [
        { path: '/inventory', label: 'Inventory', icon: '📦' },
        { path: '/inventory/stock-alerts', label: 'Stock Alerts', icon: '🔔' },
        { path: '/inventory/view', label: 'View Stock', icon: '📋' },
      ]
    },
    {
      label: 'Sales', icon: '💰',
      items: [
        { path: '/sales', label: 'Sales', icon: '💰' },
        { path: '/sales-history', label: 'Sales History', icon: '📋' },
        { path: '/sales-analytics', label: 'Sales Analytics', icon: '📊' },
        { path: '/sales-repairs', label: 'Repair Tasks', icon: '🧰' },
        { path: '/customers', label: 'Customers', icon: '👥' },
      ]
    },
    {
      label: 'Management', icon: '📊',
      items: [
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/reports', label: 'Reports', icon: '📈' },
        { path: '/notifications', label: 'Notifications', icon: '🔔' },
        { path: '/admin/pending-users', label: 'User Approvals', icon: '✅' },
        { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
      ]
    },
  ];

  // Direct admin links (no dropdown)
  const adminDirectLinks = [
    { path: '/diagnosis', label: 'Fault Diagnosis', icon: '🔍' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const salesNotificationCount = salesNotifications.length;
  const inventoryNotificationCount = inventoryNotifications.length;

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="flex items-center justify-center px-3 py-1 rounded-lg" style={{ backgroundColor: '#c0392b' }}>
                <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.06em', fontSize: '1.1rem', color: '#fff', fontWeight: 900 }}>
                  COREX
                </span>
              </div>
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full tracking-wide">
                AI-POWERED
              </span>
            </div>
            {user?.role === 'admin' ? (
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-1" ref={adminNavRef}>
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                    isActive('/dashboard') ? 'text-blue-600 border-blue-600' : 'text-gray-700 hover:text-blue-600 border-transparent hover:border-blue-600'
                  }`}
                >
                  <span className="mr-1">📊</span>Dashboard
                </Link>
                
                {/* Direct Links */}
                {adminDirectLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                      isActive(link.path) ? 'text-blue-600 border-blue-600' : 'text-gray-700 hover:text-blue-600 border-transparent hover:border-blue-600'
                    }`}
                  >
                    <span className="mr-1">{link.icon}</span>{link.label}
                  </Link>
                ))}

                {/* Dropdown Groups */}
                {adminNavGroups.map((group) => (
                  <div key={group.label} className="relative">
                    <button
                      onClick={() => setOpenAdminGroup((prev) => prev === group.label ? null : group.label)}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                        group.items.some((item) => location.pathname.startsWith(item.path) && item.path !== '/')
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-700 hover:text-blue-600 border-transparent hover:border-blue-600'
                      }`}
                    >
                      <span className="mr-1">{group.icon}</span>
                      {group.label}
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </button>
                    {openAdminGroup === group.label && (
                      <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1">
                        {group.items.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => { setOpenAdminGroup(null); navigate(item.path); }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                              location.pathname === item.path ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
                            }`}
                          >
                            <span>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {accessibleNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user?.role === 'technician' && (
              <button
                onClick={handleOpenNotifications}
                title={newTaskCount > 0
                  ? `${newTaskCount} new repair task${newTaskCount > 1 ? 's' : ''}`
                  : 'No new repair tasks'}
                className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {newTaskCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {newTaskCount > 99 ? '99+' : newTaskCount}
                  </span>
                )}
              </button>
            )}

            {user?.role === 'sales' && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={handleSalesNotificationsToggle}
                  title={salesNotificationCount > 0
                    ? `${salesNotificationCount} notification${salesNotificationCount > 1 ? 's' : ''}`
                    : 'No notifications'}
                  className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {salesNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {salesNotificationCount > 99 ? '99+' : salesNotificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 max-h-[28rem] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                      <h3 className="text-sm font-semibold text-gray-900">Sales Notifications</h3>
                      <p className="text-xs text-gray-500">Inventory and repair updates that matter to sales</p>
                    </div>

                    {salesNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No new sales notifications right now.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {salesNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleSalesNotificationClick(notification.actionPath)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {notification.type === 'stockout' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                {notification.type === 'restocked' && <PackageCheck className="w-4 h-4 text-green-600" />}
                                {notification.type === 'repair-completed' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.detail}</p>
                                <p className="text-xs text-blue-600 font-medium mt-2">{notification.actionLabel}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user?.role === 'inventory' && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={handleSalesNotificationsToggle}
                  title={inventoryNotificationCount > 0
                    ? `${inventoryNotificationCount} stock notification${inventoryNotificationCount > 1 ? 's' : ''}`
                    : 'No stock notifications'}
                  className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {inventoryNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {inventoryNotificationCount > 99 ? '99+' : inventoryNotificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 max-h-[28rem] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                      <h3 className="text-sm font-semibold text-gray-900">Inventory Notifications</h3>
                      <p className="text-xs text-gray-500">Stock alerts and replenishment updates</p>
                    </div>

                    {inventoryNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No new stock notifications right now.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {inventoryNotifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleInventoryNotificationClick(notification.actionPath)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {notification.type === 'stockout' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                {notification.type === 'low-stock' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                {notification.type === 'restocked' && <PackageCheck className="w-4 h-4 text-green-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.detail}</p>
                                <p className="text-xs text-blue-600 font-medium mt-2">{notification.actionLabel}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {user?.role === 'admin' && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
                  title={adminNotifications.length > 0 ? `${adminNotifications.length} system alert${adminNotifications.length > 1 ? 's' : ''}` : 'No system alerts'}
                  className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {adminNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {adminNotifications.length > 99 ? '99+' : adminNotifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 max-h-[28rem] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                      <h3 className="text-sm font-semibold text-gray-900">System Alerts</h3>
                      <p className="text-xs text-gray-500">Pending approvals, inventory and repair alerts</p>
                    </div>
                    {adminNotifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">No active system alerts.</div>
                    ) : (
                      <div className="divide-y">
                        {adminNotifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { setShowNotifications(false); navigate(n.actionPath); }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {n.type === 'pending-users' && <Clock className="w-4 h-4 text-yellow-500" />}
                                {n.type === 'stockout' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                {n.type === 'low-stock' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                {n.type === 'pending-repair' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{n.detail}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                style={{ backgroundColor: '#c0392b' }}
              >
                {user?.fullName ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 capitalize leading-none mt-0.5">
                  {user?.role === 'inventory' ? 'Inventory Manager' : user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};