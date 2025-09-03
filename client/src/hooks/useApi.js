import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

// API base configuration
const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

// Fetch wrapper with authentication and error handling
const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${url}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// Hook for billing summary data
export const useBillingSummary = (dateRange = 'month') => {
  return useQuery({
    queryKey: ['billingSummary', dateRange],
    queryFn: () => apiFetch(`/api/billing/summary?range=${dateRange}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for billing history
export const useBillingHistory = (filter = 'all', dateRange = 'month') => {
  return useQuery({
    queryKey: ['billingHistory', filter, dateRange],
    queryFn: () => apiFetch(`/api/billing/history?filter=${filter}&range=${dateRange}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for dashboard analytics data
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      // 始终使用需要认证的端点
      console.log('📊 Loading dashboard data...');
      try {
        const dashboardData = await apiFetch('/api/analytics/dashboard');
        console.log('📊 Dashboard data loaded:', dashboardData);
        return dashboardData;
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        
        // 如果 API 调用失败，返回默认数据
        return {
          summary: {
            totalCalls: 0,
            totalMinutes: 0,
            totalSpent: 0,
            recentCalls: 0
          }
        };
      }
    },
    staleTime: 30 * 1000, // 30秒内认为数据是新鲜的
    cacheTime: 5 * 60 * 1000, // 5分钟缓存时间
    refetchOnWindowFocus: true, // 启用窗口焦点刷新
    refetchInterval: false, // 关闭定时刷新，依赖WebSocket触发
    refetchIntervalInBackground: false, // 关闭后台刷新
    retry: 2,
  });
};

// Mock call history data for development (now unused, replaced with inline data)

// Hook for call history with infinite loading
export const useCallHistory = () => {
  return useInfiniteQuery({
    queryKey: ['callHistory'],
    queryFn: async ({ pageParam = 1 }) => {
      console.log('📞 Call History Debug:', {
        nodeEnv: process.env.NODE_ENV,
        pageParam: pageParam
      });
      
      // 始终尝试从真实 API 获取数据（需要认证）
      console.log('📞 Loading call history from database API');
      try {
        const callHistoryData = await apiFetch(`/api/calls/history?page=${pageParam}&limit=20`);
        console.log('📞 Database call history data:', callHistoryData);
        return callHistoryData;
      } catch (error) {
        console.error('❌ Error loading call history from API:', error);
        
        // 如果 API 调用失败，返回空数据
        return {
          calls: [],
          pagination: {
            page: pageParam,
            limit: 20,
            total: 0,
            hasNext: false,
            hasPrev: false
          }
        };
      }
    },
    getNextPageParam: (lastPage) => 
      lastPage.pagination?.hasNext ? lastPage.pagination.page + 1 : undefined,
    staleTime: 15 * 1000, // 15秒内认为数据是新鲜的
    cacheTime: 2 * 60 * 1000, // 2分钟缓存时间
    refetchOnWindowFocus: true, // 启用窗口焦点刷新
    refetchInterval: false, // 关闭定时刷新，依赖WebSocket触发
    refetchIntervalInBackground: false, // 关闭后台刷新
    retry: 2,
  });
};

// Hook for call history with regular pagination
export const useCallHistoryPaged = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['callHistory', page, limit],
    queryFn: () => apiFetch(`/api/calls/history?page=${page}&limit=${limit}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    keepPreviousData: true, // Keep previous data while loading new page
  });
};

// Hook for user profile data
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => apiFetch('/api/auth/profile'),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

// Hook for call rates
export const useCallRates = (country) => {
  return useQuery({
    queryKey: ['callRates', country],
    queryFn: () => apiFetch(`/api/calls/rates?country=${country}`),
    staleTime: 60 * 60 * 1000, // 1 hour - rates don't change often
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!country, // Only fetch if country is provided
  });
};

// Export apiFetch for use in components
export { apiFetch };