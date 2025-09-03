import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class AdminAuthService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/admin`;
    this.tokenKey = 'admin_access_token';
    this.refreshTokenKey = 'admin_refresh_token';
    
    // Configure axios interceptors
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use((config) => {
      if (config.url.includes('/admin/')) {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && 
            originalRequest.url.includes('/admin/') && 
            !originalRequest._retry) {
          
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              this.setTokens(response.tokens.accessToken, refreshToken);
              originalRequest.headers.Authorization = `Bearer ${response.tokens.accessToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            this.logout();
            if (window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials) {
    try {
      // 修复：硬编码API端点以确保生产环境中路径正确
      const response = await axios.post(`/api/admin/auth/login`, credentials);
      
      if (response.data.tokens) {
        this.setTokens(
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );
        this.setAdminData(response.data.admin);
      }

      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        // 修复：硬编码API端点
        await axios.post(`/api/admin/auth/logout`);
      }
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    } finally {
      this.clearTokens();
      this.clearAdminData();
    }
  }

  async logoutAll() {
    try {
      await axios.post(`${this.baseURL}/auth/logout-all`);
    } catch (error) {
      console.warn('Logout all request failed:', error.message);
    } finally {
      this.clearTokens();
      this.clearAdminData();
    }
  }

  async refreshToken(refreshToken) {
    try {
      // 修复：硬编码API端点
      const response = await axios.post(`/api/admin/auth/refresh`, {
        refreshToken
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getProfile() {
    try {
      // 修复：硬编码API端点
      const response = await axios.get(`/api/admin/auth/profile`);
      this.setAdminData(response.data.admin);
      return response.data.admin;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async getSessions() {
    try {
      const response = await axios.get(`${this.baseURL}/auth/sessions`);
      return response.data.sessions;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Token management
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.tokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshTokenKey, refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  // Admin data management
  setAdminData(adminData) {
    localStorage.setItem('admin_data', JSON.stringify(adminData));
  }

  getAdminData() {
    const data = localStorage.getItem('admin_data');
    return data ? JSON.parse(data) : null;
  }

  clearAdminData() {
    localStorage.removeItem('admin_data');
  }

  // Authentication state
  isAuthenticated() {
    return !!this.getToken();
  }

  hasPermission(resource, action = 'read') {
    const adminData = this.getAdminData();
    if (!adminData || !adminData.role || !adminData.role.permissions) {
      return false;
    }

    const permissions = adminData.role.permissions;
    const resourcePermissions = permissions[resource];

    if (!resourcePermissions) {
      return false;
    }

    return !!resourcePermissions[action];
  }

  hasRole(roleName) {
    const adminData = this.getAdminData();
    return adminData?.role?.name === roleName;
  }

  hasAnyRole(roleNames) {
    const adminData = this.getAdminData();
    if (!adminData?.role?.name) {
      return false;
    }
    return roleNames.includes(adminData.role.name);
  }

  // Utility methods
  handleError(error) {
    if (error.response?.status === 401) {
      this.clearTokens();
      this.clearAdminData();
    }
    
    console.error('Admin API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.response?.data?.code
    });
  }

  // Session validation
  validateSession() {
    const token = this.getToken();
    const adminData = this.getAdminData();

    if (!token || !adminData) {
      return false;
    }

    try {
      // Basic JWT expiration check (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        this.clearTokens();
        this.clearAdminData();
        return false;
      }

      return true;
    } catch (error) {
      this.clearTokens();
      this.clearAdminData();
      return false;
    }
  }

  // Admin-specific API helpers
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  createAuthenticatedRequest(config = {}) {
    return {
      ...config,
      headers: {
        ...config.headers,
        ...this.getAuthHeaders()
      }
    };
  }
}

// Create and export singleton instance
const adminAuthService = new AdminAuthService();
export default adminAuthService;