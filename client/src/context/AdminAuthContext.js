import React, { createContext, useContext, useReducer, useEffect } from 'react';
import adminAuthService from '../services/adminAuthService';

// Action types
const ADMIN_AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_ADMIN: 'SET_ADMIN',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_PERMISSIONS: 'UPDATE_PERMISSIONS'
};

// Initial state
const initialState = {
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: null
};

// Reducer
const adminAuthReducer = (state, action) => {
  switch (action.type) {
    case ADMIN_AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case ADMIN_AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        admin: action.payload.admin,
        permissions: action.payload.admin?.role?.permissions || null,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case ADMIN_AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        admin: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };

    case ADMIN_AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        admin: null,
        permissions: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case ADMIN_AUTH_ACTIONS.SET_ADMIN:
      return {
        ...state,
        admin: action.payload.admin,
        permissions: action.payload.admin?.role?.permissions || null,
        isAuthenticated: !!action.payload.admin,
        isLoading: false,
        error: null
      };

    case ADMIN_AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading
      };

    case ADMIN_AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ADMIN_AUTH_ACTIONS.UPDATE_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload.permissions
      };

    default:
      return state;
  }
};

// Create context
const AdminAuthContext = createContext();

// Custom hook to use admin auth context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

// Provider component
export const AdminAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminAuthReducer, initialState);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: ADMIN_AUTH_ACTIONS.SET_LOADING, payload: { loading: true } });

        // Check if admin is already authenticated
        if (adminAuthService.isAuthenticated() && adminAuthService.validateSession()) {
          const adminData = adminAuthService.getAdminData();
          
          if (adminData) {
            dispatch({
              type: ADMIN_AUTH_ACTIONS.SET_ADMIN,
              payload: { admin: adminData }
            });
          } else {
            // Token exists but no admin data, try to fetch profile
            try {
              const admin = await adminAuthService.getProfile();
              dispatch({
                type: ADMIN_AUTH_ACTIONS.SET_ADMIN,
                payload: { admin }
              });
            } catch (error) {
              // Profile fetch failed, clear tokens
              adminAuthService.clearTokens();
              adminAuthService.clearAdminData();
              dispatch({ type: ADMIN_AUTH_ACTIONS.LOGOUT });
            }
          }
        } else {
          dispatch({ type: ADMIN_AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: ADMIN_AUTH_ACTIONS.LOGOUT });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: ADMIN_AUTH_ACTIONS.LOGIN_START });

      const response = await adminAuthService.login(credentials);

      dispatch({
        type: ADMIN_AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { admin: response.admin }
      });

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: ADMIN_AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: errorMessage }
      });

      throw error;
    }
  };

  // Logout function
  const logout = async (logoutAll = false) => {
    try {
      if (logoutAll) {
        await adminAuthService.logoutAll();
      } else {
        await adminAuthService.logout();
      }
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      dispatch({ type: ADMIN_AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    try {
      const admin = await adminAuthService.getProfile();
      dispatch({
        type: ADMIN_AUTH_ACTIONS.SET_ADMIN,
        payload: { admin }
      });
      return admin;
    } catch (error) {
      console.error('Profile refresh error:', error);
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: ADMIN_AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Permission helpers
  const hasPermission = (resource, action = 'read') => {
    return adminAuthService.hasPermission(resource, action);
  };

  const hasRole = (roleName) => {
    return adminAuthService.hasRole(roleName);
  };

  const hasAnyRole = (roleNames) => {
    return adminAuthService.hasAnyRole(roleNames);
  };

  // Check if current admin is super admin
  const isSuperAdmin = () => {
    return hasRole('super_admin');
  };

  // Get admin display name
  const getDisplayName = () => {
    if (!state.admin) return '';
    return `${state.admin.firstName} ${state.admin.lastName}`.trim() || state.admin.username;
  };

  // Get admin initials for avatar
  const getInitials = () => {
    if (!state.admin) return '';
    const firstName = state.admin.firstName || '';
    const lastName = state.admin.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 
           state.admin.username.charAt(0).toUpperCase();
  };

  // Context value
  const value = {
    // State
    admin: state.admin,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    permissions: state.permissions,

    // Actions
    login,
    logout,
    refreshProfile,
    clearError,

    // Permission helpers
    hasPermission,
    hasRole,
    hasAnyRole,
    isSuperAdmin,

    // Utility functions
    getDisplayName,
    getInitials,

    // Service access (for advanced usage)
    authService: adminAuthService
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;