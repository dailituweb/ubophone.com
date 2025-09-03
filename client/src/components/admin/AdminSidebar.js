import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Home,
  UserCog,
  Database,
  Phone,
  AlertTriangle,
  Hash,
  DollarSign
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SidebarContainer = styled.aside.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: ${props => props.$collapsed ? '80px' : '280px'};
  background: ${props => props.$theme.sidebarBg};
  border-right: 3px solid ${props => props.$theme.borderColor};
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 1024px) {
    width: ${props => props.$collapsed ? '0' : '280px'};
    transform: translateX(${props => props.$collapsed ? '-100%' : '0'});
  }

  @media (max-width: 768px) {
    width: ${props => props.$collapsed ? '0' : '100vw'};
    border-right: none;
    border-bottom: 3px solid ${props => props.$theme.borderColor};
  }
`;

const SidebarHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'space-between'};
  padding: 1.5rem ${props => props.$collapsed ? '1rem' : '1.5rem'};
  border-bottom: 2px solid ${props => props.$theme.borderColor};
  min-height: 80px;
`;

const Logo = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: ${props => props.$collapsed ? '1.25rem' : '1.5rem'};
  font-weight: 800;
  color: ${props => props.$theme.primaryText};
  transition: all 0.3s ease;

  span {
    opacity: ${props => props.$collapsed ? '0' : '1'};
    transform: translateX(${props => props.$collapsed ? '-10px' : '0'});
    transition: all 0.3s ease;
    white-space: nowrap;
  }
`;

const CollapseButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: ${props => props.$theme.accent};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 50%;
  color: ${props => props.$theme.primaryText};
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.$collapsed ? '1' : '1'};

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px ${props => props.$theme.shadowColor};
  }

  @media (max-width: 1024px) {
    display: ${props => props.$collapsed ? 'none' : 'flex'};
  }
`;

const Navigation = styled.nav`
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
`;

const NavGroup = styled.div`
  margin-bottom: 2rem;
`;

const NavGroupTitle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${props => props.$theme.secondaryText};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 1.5rem;
  margin-bottom: 0.75rem;
  opacity: ${props => props.$collapsed ? '0' : '1'};
  transform: translateX(${props => props.$collapsed ? '-10px' : '0'});
  transition: all 0.3s ease;
`;

const NavItem = styled(Link).withConfig({
  shouldForwardProp: (prop) => !['$active', '$collapsed', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem ${props => props.$collapsed ? '1.5rem' : '1.5rem'};
  margin: 0 0.75rem;
  border-radius: 8px;
  background: ${props => props.$active ? props.$theme.accent : 'transparent'};
  color: ${props => props.$active ? props.$theme.primaryText : props.$theme.secondaryText};
  text-decoration: none;
  font-weight: ${props => props.$active ? '700' : '600'};
  transition: all 0.3s ease;
  position: relative;
  justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};

  &:hover {
    background: ${props => props.$active ? props.$theme.accent : props.$theme.hoverColor};
    color: ${props => props.$theme.primaryText};
    transform: translateX(2px);
  }

  .nav-text {
    opacity: ${props => props.$collapsed ? '0' : '1'};
    transform: translateX(${props => props.$collapsed ? '-10px' : '0'});
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .nav-icon {
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  ${props => props.$collapsed && `
    .nav-text {
      position: absolute;
      left: 100%;
      margin-left: 1rem;
      background: ${props.$theme.cardBackground};
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 2px solid ${props.$theme.borderColor};
      box-shadow: 0 4px 12px ${props.$theme.shadowColor};
      opacity: 0;
      pointer-events: none;
      z-index: 1001;
      min-width: 120px;
    }

    &:hover .nav-text {
      opacity: 1;
      pointer-events: auto;
    }
  `}
`;

const NotificationBadge = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$count', '$theme'].includes(prop),
})`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${props => props.$theme.errorColor};
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  display: ${props => props.$count > 0 ? 'block' : 'none'};
  line-height: 1.2;
`;

const SidebarFooter = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  padding: 1rem;
  border-top: 2px solid ${props => props.$theme.borderColor};
  text-align: center;
`;

const VersionInfo = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$collapsed', '$theme'].includes(prop),
})`
  font-size: 0.75rem;
  color: ${props => props.$theme.secondaryText};
  opacity: ${props => props.$collapsed ? '0' : '1'};
  transition: opacity 0.3s ease;
`;

const MobileOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible'].includes(prop),
})`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.$visible ? '1' : '0'};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;

  @media (max-width: 1024px) {
    display: block;
  }
`;

function AdminSidebar({ collapsed, onToggleCollapse }) {
  const location = useLocation();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState({
    users: 3,
    system: 1,
    alerts: 0
  });

  useEffect(() => {
    // Simulate fetching notification counts
    const fetchNotifications = () => {
      // In production, fetch from your API
      setNotifications({
        users: Math.floor(Math.random() * 10),
        system: Math.floor(Math.random() * 5),
        alerts: Math.floor(Math.random() * 3)
      });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    {
      group: 'Overview',
      items: [
        { 
          path: '/admin/dashboard', 
          label: 'Dashboard', 
          icon: <Home size={20} className="nav-icon" />,
          notifications: 0
        },
        { 
          path: '/admin/analytics', 
          label: 'Analytics', 
          icon: <BarChart3 size={20} className="nav-icon" />,
          notifications: 0
        }
      ]
    },
    {
      group: 'Business Management',
      items: [
        { 
          path: '/admin/users', 
          label: 'User Management', 
          icon: <Users size={20} className="nav-icon" />,
          notifications: notifications.users
        },
        { 
          path: '/admin/calls', 
          label: 'Call Records', 
          icon: <Phone size={20} className="nav-icon" />,
          notifications: 0
        },
        { 
          path: '/admin/numbers', 
          label: 'Number Pool', 
          icon: <Hash size={20} className="nav-icon" />,
          notifications: 0
        },
        { 
          path: '/admin/finance', 
          label: 'Financial Center', 
          icon: <DollarSign size={20} className="nav-icon" />,
          notifications: 0
        }
      ]
    },
    {
      group: 'System',
      items: [
        { 
          path: '/admin/system', 
          label: 'System Health', 
          icon: <Database size={20} className="nav-icon" />,
          notifications: notifications.system
        },
        { 
          path: '/admin/admins', 
          label: 'Admin Users', 
          icon: <UserCog size={20} className="nav-icon" />,
          notifications: 0
        },
        { 
          path: '/admin/alerts', 
          label: 'System Alerts', 
          icon: <AlertTriangle size={20} className="nav-icon" />,
          notifications: notifications.alerts
        },
        { 
          path: '/admin/settings', 
          label: 'Settings', 
          icon: <Settings size={20} className="nav-icon" />,
          notifications: 0
        }
      ]
    }
  ];

  const isCurrentPath = (path) => location.pathname === path;

  const handleOverlayClick = () => {
    if (window.innerWidth <= 1024) {
      onToggleCollapse();
    }
  };

  return (
    <>
      <MobileOverlay $visible={!collapsed} onClick={handleOverlayClick} />
      
      <SidebarContainer $collapsed={collapsed} $theme={theme}>
        <SidebarHeader $collapsed={collapsed} $theme={theme}>
          <Logo $collapsed={collapsed} $theme={theme}>
            <Shield size={collapsed ? 24 : 28} />
            <span>Admin Panel</span>
          </Logo>
          
          <CollapseButton
            $collapsed={collapsed}
            $theme={theme}
            onClick={onToggleCollapse}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </CollapseButton>
        </SidebarHeader>

        <Navigation>
          {navigationItems.map((group) => (
            <NavGroup key={group.group}>
              <NavGroupTitle $collapsed={collapsed} $theme={theme}>
                {group.group}
              </NavGroupTitle>
              
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  to={item.path}
                  $active={isCurrentPath(item.path)}
                  $collapsed={collapsed}
                  $theme={theme}
                  style={{ position: 'relative' }}
                >
                  {item.icon}
                  <span className="nav-text">{item.label}</span>
                  {item.notifications > 0 && (
                    <NotificationBadge $count={item.notifications} $theme={theme}>
                      {item.notifications}
                    </NotificationBadge>
                  )}
                </NavItem>
              ))}
            </NavGroup>
          ))}
        </Navigation>

        <SidebarFooter $collapsed={collapsed} $theme={theme}>
          <VersionInfo $collapsed={collapsed} $theme={theme}>
            v1.0.0
          </VersionInfo>
        </SidebarFooter>
      </SidebarContainer>
    </>
  );
}

export default AdminSidebar;