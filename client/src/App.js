import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled, { createGlobalStyle } from 'styled-components';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BottomNavigation from './components/BottomNavigation';
import IncomingCallManager from './components/IncomingCallManager';
import AuthProvider, { useAuth } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { createLazyRoute, createLazyWidget, preloadComponents, setupRoutePreloading } from './utils/lazyLoading';

// 优化的懒加载页面组件
const MonochromeHomePage = createLazyRoute(() => import('./pages/MonochromeHomePage'), 'Loading homepage...');
const LoginPage = createLazyRoute(() => import('./pages/LoginPage'), 'Loading login...');
const RegisterPage = createLazyRoute(() => import('./pages/RegisterPage'), 'Loading registration...');
const Dashboard = createLazyRoute(() => import('./pages/Dashboard'), 'Loading dashboard...');
const PhonePage = createLazyRoute(() => import('./pages/PhonePage'), 'Loading phone...');
const ContactsPage = createLazyRoute(() => import('./pages/ContactsPage'), 'Loading contacts...');
const Analytics = createLazyRoute(() => import('./pages/Analytics'), 'Loading analytics...');
const BuyCreditsPage = createLazyRoute(() => import('./pages/BuyCreditsPage'), 'Loading credits...');
const SubscriptionPage = createLazyRoute(() => import('./pages/SubscriptionPage'), 'Loading subscription...');
const CouponsPage = createLazyRoute(() => import('./pages/CouponsPage'), 'Loading coupons...');
const RatesPage = createLazyRoute(() => import('./pages/RatesPage'), 'Loading rates...');
const ForgotPasswordPage = createLazyRoute(() => import('./pages/ForgotPasswordPage'), 'Loading...');
const ResetPasswordPage = createLazyRoute(() => import('./pages/ResetPasswordPage'), 'Loading...');
const SocialCallbackPage = createLazyRoute(() => import('./pages/SocialCallbackPage'), 'Processing...');
const PrivacyPolicyPage = createLazyRoute(() => import('./pages/PrivacyPolicyPage'), 'Loading policy...');
const TermsOfServicePage = createLazyRoute(() => import('./pages/TermsOfServicePage'), 'Loading terms...');
const CookiePolicyPage = createLazyRoute(() => import('./pages/CookiePolicyPage'), 'Loading policy...');
const BuyPhoneNumber = createLazyRoute(() => import('./pages/BuyPhoneNumber'), 'Loading phone numbers...');
const BillingPage = createLazyRoute(() => import('./pages/BillingPage'), 'Loading billing...');

// 优化的懒加载组件
const PhoneNumberManagement = createLazyWidget(() => import('./components/PhoneNumberManagement'));
const IncomingCallHistory = createLazyWidget(() => import('./components/IncomingCallHistory'));
const CostAnalysis = createLazyWidget(() => import('./components/CostAnalysis'));

// 管理员页面
const AdminLogin = createLazyRoute(() => import('./pages/AdminLogin'), 'Loading admin...');
const AdminDashboard = createLazyRoute(() => import('./pages/AdminDashboard'), 'Loading admin dashboard...');

// Create a React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const GlobalStyle = createGlobalStyle`
  a {
    color: inherit;
    text-decoration: none;
  }
  
  /* Fix mobile viewport issues */
  @supports (height: 100dvh) {
    html {
      height: 100dvh;
    }
  }
`;

const AppContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$hasBottomNav'].includes(prop),
})`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: ${props => props.$hasBottomNav ? '60px' : '0'};
`;

// Simple loading fallback component
const LoadingFallback = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #FAFAFA;
  color: #0a0f2f;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f0f0f0;
    border-top: 3px solid #FFC900;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Loading component
const LoadingComponent = () => (
  <LoadingFallback>
    <div className="spinner"></div>
    Loading...
  </LoadingFallback>
);

// Admin auth check
function AdminRoute({ children }) {
  const location = useLocation();
  const adminToken = localStorage.getItem('adminToken');
  
  if (!adminToken) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// Inner component that has access to router location
function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Check if current page should show bottom navigation
  const memberCenterPages = [
    '/phone', 
    '/contacts', 
    '/analytics', 
    '/dashboard', 
    '/buy-credits',
    '/subscriptions',
    '/coupons',
    '/rates',
    '/phone-numbers',
    '/buy-phone-number',
    '/incoming-calls',
    '/cost-analysis'
  ];
  const isOnMemberPage = user && memberCenterPages.some(page => location.pathname.includes(page));
  const isOnAdminPage = location.pathname.startsWith('/admin');
  
  return (
    <AppContainer $hasBottomNav={isOnMemberPage}>
      {location.pathname !== '/' && !isOnAdminPage && <Navbar />}
      <Suspense fallback={<LoadingComponent />}>
        <Routes>
          <Route path="/" element={<MonochromeHomePage />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
          <Route path="/reset-password/:token" element={!user ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />
          <Route path="/auth/social-callback" element={<SocialCallbackPage />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/phone" element={user ? <PhonePage /> : <Navigate to="/login" />} />
          <Route path="/contacts" element={user ? <ContactsPage /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
          <Route path="/buy-credits" element={user ? <BuyCreditsPage /> : <Navigate to="/login" />} />
          <Route path="/subscriptions" element={user ? <SubscriptionPage /> : <Navigate to="/login" />} />
          <Route path="/coupons" element={user ? <CouponsPage /> : <Navigate to="/login" />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/rates" element={user ? <RatesPage /> : <Navigate to="/login" />} />
          <Route path="/phone-numbers" element={user ? <PhoneNumberManagement /> : <Navigate to="/login" />} />
          <Route path="/buy-phone-number" element={user ? <BuyPhoneNumber /> : <Navigate to="/login" />} />
          <Route path="/incoming-calls" element={user ? <IncomingCallHistory /> : <Navigate to="/login" />} />
          <Route path="/cost-analysis" element={user ? <CostAnalysis /> : <Navigate to="/login" />} />
          <Route path="/billing" element={user ? <BillingPage /> : <Navigate to="/login" />} />
          
          {/* Admin routes - use both versions */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Suspense>
      {/* Only show Footer on non-member center pages and non-admin pages */}
      {!isOnMemberPage && location.pathname !== '/' && !isOnAdminPage && <Footer />}
      {isOnMemberPage && <BottomNavigation />}
      
      {/* Global Incoming Call Manager - only for non-admin pages */}
      {!isOnAdminPage && <IncomingCallManager />}
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AppContainer>
  );
}

function App() {
  useEffect(() => {
    // 设置智能预加载
    const routeMap = {
      '/': MonochromeHomePage,
      '/dashboard': Dashboard,
      '/phone': PhonePage,
      '/contacts': ContactsPage,
      '/analytics': Analytics,
      '/buy-credits': BuyCreditsPage,
      '/subscription': SubscriptionPage,
      '/coupons': CouponsPage,
      '/rates': RatesPage,
      '/billing': BillingPage,
      '/buy-phone-number': BuyPhoneNumber
    };

    setupRoutePreloading(routeMap);

    // 预加载关键组件
    const criticalComponents = [Dashboard, PhonePage, ContactsPage];
    preloadComponents(criticalComponents);

    // 性能监控
    if (process.env.NODE_ENV === 'development') {
      // 监控组件加载时间
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('🚀 Page load time:', entry.loadEventEnd - entry.loadEventStart, 'ms');
          }
        }
      });
      observer.observe({ entryTypes: ['navigation'] });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AdminAuthProvider>
            <ThemeProvider>
              <GlobalStyle />
              <AppContent />
            </ThemeProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 