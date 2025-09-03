import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Loader, Shield, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0f2f 0%, #1a1f3a 100%);
  color: white;
  gap: 1rem;
`;

const LoadingSpinner = styled(Loader)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
`;

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0f2f 0%, #1a1f3a 100%);
  color: white;
  text-align: center;
  padding: 2rem;
`;

const ErrorCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
`;

const ErrorIcon = styled.div`
  color: #fbbf24;
  margin-bottom: 1rem;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: white;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #d1d5db;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  background: #FFC900;
  border: 2px solid #000;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #0a0f2f;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #000;
  }
`;

/**
 * Protected route component for admin pages
 * Handles authentication, authorization, and loading states
 */
function AdminProtectedRoute({ 
  children, 
  requiredPermissions = null,
  requiredRoles = null,
  fallback = null 
}) {
  const { 
    isAuthenticated, 
    isLoading, 
    admin, 
    hasPermission, 
    hasRole, // eslint-disable-line no-unused-vars
    hasAnyRole,
    refreshProfile
  } = useAdminAuth();
  const location = useLocation();

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <LoadingContainer>
        <Shield size={48} />
        <LoadingSpinner size={32} />
        <LoadingText>Verifying admin credentials...</LoadingText>
      </LoadingContainer>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/admin/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check for required permissions
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    const hasRequiredPermissions = permissions.every(permission => {
      if (typeof permission === 'string') {
        // Simple permission check (resource only, defaults to 'read')
        return hasPermission(permission, 'read');
      } else if (typeof permission === 'object') {
        // Detailed permission check { resource: 'users', action: 'write' }
        return hasPermission(permission.resource, permission.action);
      }
      return false;
    });

    if (!hasRequiredPermissions) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>
              <AlertTriangle size={48} />
            </ErrorIcon>
            <ErrorTitle>Access Denied</ErrorTitle>
            <ErrorMessage>
              You don't have the required permissions to access this page.
              Please contact your administrator if you believe this is an error.
            </ErrorMessage>
            <RetryButton onClick={() => window.history.back()}>
              Go Back
            </RetryButton>
          </ErrorCard>
        </ErrorContainer>
      );
    }
  }

  // Check for required roles
  if (requiredRoles) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequiredRole = hasAnyRole(roles);

    if (!hasRequiredRole) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>
              <AlertTriangle size={48} />
            </ErrorIcon>
            <ErrorTitle>Insufficient Privileges</ErrorTitle>
            <ErrorMessage>
              Your current role doesn't have access to this section.
              Required roles: {roles.join(', ')}
            </ErrorMessage>
            <RetryButton onClick={() => window.history.back()}>
              Go Back
            </RetryButton>
          </ErrorCard>
        </ErrorContainer>
      );
    }
  }

  // Check if admin data is available
  if (!admin) {
    return (
      <ErrorContainer>
        <ErrorCard>
          <ErrorIcon>
            <AlertTriangle size={48} />
          </ErrorIcon>
          <ErrorTitle>Profile Error</ErrorTitle>
          <ErrorMessage>
            Unable to load admin profile. Please try refreshing the page.
          </ErrorMessage>
          <RetryButton onClick={refreshProfile}>
            Retry
          </RetryButton>
        </ErrorCard>
      </ErrorContainer>
    );
  }

  // All checks passed, render the protected content
  return children || fallback;
}

/**
 * HOC for wrapping components with admin protection
 */
export const withAdminAuth = (
  Component, 
  requiredPermissions = null,
  requiredRoles = null
) => {
  return function AdminProtectedComponent(props) {
    return (
      <AdminProtectedRoute 
        requiredPermissions={requiredPermissions}
        requiredRoles={requiredRoles}
      >
        <Component {...props} />
      </AdminProtectedRoute>
    );
  };
};

/**
 * Hook for checking permissions in components
 */
export const useAdminPermissions = () => {
  const { hasPermission, hasRole, hasAnyRole, admin } = useAdminAuth();

  const checkPermission = (resource, action = 'read') => {
    return hasPermission(resource, action);
  };

  const checkRole = (roleName) => {
    return hasRole(roleName);
  };

  const checkAnyRole = (roleNames) => {
    return hasAnyRole(roleNames);
  };

  const isSuperAdmin = () => {
    return hasRole('super_admin');
  };

  const canManageAdmins = () => {
    return hasPermission('admins', 'write') || isSuperAdmin();
  };

  const canDeleteUsers = () => {
    return hasPermission('users', 'delete') || isSuperAdmin();
  };

  const canViewLogs = () => {
    return hasPermission('logs', 'read') || isSuperAdmin();
  };

  return {
    checkPermission,
    checkRole,
    checkAnyRole,
    isSuperAdmin,
    canManageAdmins,
    canDeleteUsers,
    canViewLogs,
    admin
  };
};

export default AdminProtectedRoute;