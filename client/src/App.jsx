import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LeadDetail from './pages/LeadDetail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import Workflows from './pages/Workflows';
import WorkflowBuilder from './pages/WorkflowBuilder';
import OAuthCallback from './pages/OAuthCallback';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

export default function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/leads/:id" element={
                    <PrivateRoute>
                        <LeadDetail />
                    </PrivateRoute>
                } />
                <Route path="/settings" element={
                    <PrivateRoute>
                        <Settings />
                    </PrivateRoute>
                } />
                <Route path="/profile" element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                } />

                <Route path="/billing" element={
                    <PrivateRoute>
                        <Billing />
                    </PrivateRoute>
                } />
                <Route path="/workflows" element={
                    <PrivateRoute>
                        <Workflows />
                    </PrivateRoute>
                } />
                <Route path="/workflows/:id" element={
                    <PrivateRoute>
                        <WorkflowBuilder />
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}
