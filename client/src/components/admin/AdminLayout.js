import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useTheme } from '../../context/ThemeContext';

const LayoutContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  min-height: 100vh;
  background: ${props => props.$theme.background};
  color: ${props => props.$theme.primaryText};
  transition: all 0.3s ease;
`;

const MainContent = styled.main.withConfig({
  shouldForwardProp: (prop) => !['$sidebarCollapsed', '$theme'].includes(prop),
})`
  margin-left: ${props => props.$sidebarCollapsed ? '80px' : '280px'};
  min-height: calc(100vh - 80px);
  transition: margin-left 0.3s ease;
  
  @media (max-width: 1024px) {
    margin-left: 0;
  }

  @media (max-width: 768px) {
    min-height: calc(100vh - 70px);
  }
`;

const ContentWrapper = styled.div`
  padding: 0;
  width: 100%;
  height: 100%;
`;

function AdminLayout({ children }) {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Load sidebar state from localStorage
    const savedState = localStorage.getItem('admin-sidebar-collapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    } else {
      // Auto-collapse on smaller screens
      setSidebarCollapsed(window.innerWidth <= 1024);
    }

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Save sidebar state to localStorage
    localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <LayoutContainer $theme={theme}>
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={toggleSidebar} 
      />
      
      <AdminHeader 
        sidebarCollapsed={sidebarCollapsed} 
        onToggleSidebar={toggleSidebar} 
      />
      
      <MainContent $sidebarCollapsed={sidebarCollapsed} $theme={theme}>
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
}

export default AdminLayout;