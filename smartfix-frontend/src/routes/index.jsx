// src/routes/index.jsx (update)
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { FaultDiagnosisPage } from '../features/fault-diagnosis/FaultDiagnosisPage';
import { FailurePredictionPage } from '../features/failure-prediction/FailurePredictionPage';
import { LoginForm } from '../features/auth/components/LoginForm';
import { Navbar } from '../shared/components/Navigation/Navbar';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppLayout = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  return (
    <>
      {isAuthenticated && <Navbar />}
      <div className={isAuthenticated ? '' : ''}>
        {children}
      </div>
    </>
  );
};

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          <Route path="/diagnosis" element={
            <PrivateRoute>
              <FaultDiagnosisPage />
            </PrivateRoute>
          } />
          <Route path="/failure-prediction" element={
            <PrivateRoute>
              <FailurePredictionPage />
            </PrivateRoute>
          } />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};