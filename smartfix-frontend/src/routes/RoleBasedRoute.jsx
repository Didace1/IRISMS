// src/routes/RoleBasedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const RoleBasedRoute = ({ children, allowedRoles, allowedPermissions }) => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Check role permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  // Check specific permissions
  if (allowedPermissions && allowedPermissions.length > 0) {
    const hasPermission = allowedPermissions.some(permission => 
      user.permissions.includes(permission) || user.permissions.includes('all')
    );
    if (!hasPermission) {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return children;
};