import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Clock,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const HeaderContainer = styled.header.withConfig({
  shouldForwardProp: (prop) => !['$sidebarCollapsed', '$theme'].includes(prop),
})`
  position: fixed;
  top: 0;
  left: ${props => props.$sidebarCollapsed ? '80px' : '280px'};
  right: 0;
  height: 80px;
  background: ${props => props.$theme.headerBg};
  border-bottom: 3px solid ${props => props.$theme.borderColor};
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  transition: left 0.3s ease;

  @media (max-width: 1024px) {
    left: 0;
    padding: 0 1rem;
  }

  @media (max-width: 768px) {
    padding: 0 0.75rem;
    height: 70px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  max-width: 600px;
`;

const MobileMenuButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: none;
  background: none;
  border: none;
  color: ${props => props.$theme.primaryText};
  cursor: pointer;
  padding: 0.5rem;

  @media (max-width: 1024px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const SearchContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$expanded', '$theme'].includes(prop),
})`
  position: relative;
  flex: 1;
  max-width: 500px;

  @media (max-width: 768px) {
    max-width: ${props => props.$expanded ? '300px' : '200px'};
  }

  @media (max-width: 480px) {
    max-width: ${props => props.$expanded ? '250px' : '150px'};
  }
`;

const SearchInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: ${props => props.$theme.inputBg};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$theme.primaryText};
  transition: all 0.3s ease;

  &::placeholder {
    color: ${props => props.$theme.secondaryText};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.$theme.accent};
    box-shadow: 0 0 0 3px rgba(255, 201, 0, 0.1);
  }

  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem 0.5rem 2.5rem;
    font-size: 0.8rem;
  }
`;

const SearchIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.$theme.secondaryText};
  pointer-events: none;

  @media (max-width: 480px) {
    left: 0.75rem;
  }
`;

const SearchResults = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible', '$theme'].includes(prop),
})`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  margin-top: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 8px 24px ${props => props.$theme.shadowColor};
  display: ${props => props.$visible ? 'block' : 'none'};
  z-index: 1000;
`;

const SearchResultItem = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$theme.borderColor};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.$theme.hoverColor};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ResultTitle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 600;
  color: ${props => props.$theme.primaryText};
  margin-bottom: 0.25rem;
`;

const ResultPath = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 0.75rem;
  color: ${props => props.$theme.secondaryText};
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const ThemeToggle = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${props => props.$theme.inputBg};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  color: ${props => props.$theme.primaryText};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$theme.accent};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px ${props => props.$theme.shadowColor};
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
`;

const NotificationContainer = styled.div`
  position: relative;
`;

const NotificationButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$hasNotifications', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: ${props => props.$theme.inputBg};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  color: ${props => props.$theme.primaryText};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: ${props => props.$theme.accent};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px ${props => props.$theme.shadowColor};
  }

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: ${props => props.$theme.errorColor};
    border-radius: 50%;
    display: ${props => props.$hasNotifications ? 'block' : 'none'};
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
`;

const NotificationDropdown = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible', '$theme'].includes(prop),
})`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  min-width: 320px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 8px 24px ${props => props.$theme.shadowColor};
  display: ${props => props.$visible ? 'block' : 'none'};
  z-index: 1000;

  @media (max-width: 480px) {
    min-width: 280px;
    right: -120px;
  }
`;

const NotificationHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  padding: 1rem;
  border-bottom: 2px solid ${props => props.$theme.borderColor};
  font-weight: 700;
  color: ${props => props.$theme.primaryText};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationItem = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$read', '$theme'].includes(prop),
})`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.$theme.borderColor};
  cursor: pointer;
  transition: background 0.2s ease;
  background: ${props => props.$read ? 'transparent' : `${props.$theme.accent}20`};

  &:hover {
    background: ${props => props.$theme.hoverColor};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const NotificationIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$type', '$theme'].includes(prop),
})`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: ${props => {
    switch (props.$type) {
      case 'warning': return props.$theme.warningColor;
      case 'error': return props.$theme.errorColor;
      case 'success': return props.$theme.successColor;
      default: return props.$theme.secondaryText;
    }
  }};
`;

const NotificationText = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 600;
  color: ${props => props.$theme.primaryText};
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
`;

const NotificationMessage = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  color: ${props => props.$theme.secondaryText};
  font-size: 0.75rem;
  line-height: 1.4;
`;

const NotificationTime = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  color: ${props => props.$theme.secondaryText};
  font-size: 0.7rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.$theme.inputBg};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  color: ${props => props.$theme.primaryText};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$theme.accent};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px ${props => props.$theme.shadowColor};
  }

  @media (max-width: 768px) {
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    padding: 0.25rem 0.5rem;
    
    .user-name {
      display: none;
    }
  }
`;

const UserAvatar = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.$theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  border: 2px solid ${props => props.$theme.borderColor};

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
`;

const UserDropdown = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible', '$theme'].includes(prop),
})`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 8px 24px ${props => props.$theme.shadowColor};
  display: ${props => props.$visible ? 'block' : 'none'};
  z-index: 1000;
`;

const UserDropdownItem = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: transparent;
  border: none;
  color: ${props => props.$theme.primaryText};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid ${props => props.$theme.borderColor};

  &:hover {
    background: ${props => props.$theme.hoverColor};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const HeaderSpacer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$sidebarCollapsed'].includes(prop),
})`
  height: 80px;
  margin-left: ${props => props.$sidebarCollapsed ? '80px' : '280px'};
  transition: margin-left 0.3s ease;

  @media (max-width: 1024px) {
    margin-left: 0;
  }

  @media (max-width: 768px) {
    height: 70px;
  }
`;

function AdminHeader({ sidebarCollapsed, onToggleSidebar }) {
  const navigate = useNavigate();
  const { logout, getDisplayName, getInitials } = useAdminAuth();
  const { theme, toggleTheme, currentTheme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // Mock notifications - in production, fetch from API
    setNotifications([
      {
        id: 1,
        type: 'warning',
        title: 'High System Load',
        message: 'Server CPU usage is at 85%',
        time: '2 minutes ago',
        read: false
      },
      {
        id: 2,
        type: 'success',
        title: 'Backup Completed',
        message: 'Daily backup completed successfully',
        time: '1 hour ago',
        read: false
      },
      {
        id: 3,
        type: 'info',
        title: 'New User Registration',
        message: '5 new users registered today',
        time: '3 hours ago',
        read: true
      }
    ]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.trim().length > 0) {
      // Mock search results - in production, call your search API
      const mockResults = [
        { title: 'User Management', path: '/admin/users', type: 'page' },
        { title: 'System Settings', path: '/admin/settings', type: 'page' },
        { title: 'Analytics Dashboard', path: '/admin/analytics', type: 'page' },
        { title: 'Call Reports', path: '/admin/reports', type: 'page' }
      ].filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (result) => {
    navigate(result.path);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const getThemeIcon = () => {
    switch (currentTheme) {
      case 'dark':
        return <Moon size={20} />;
      case 'light':
        return <Sun size={20} />;
      default:
        return <Monitor size={20} />;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertCircle size={16} />;
      case 'error':
        return <X size={16} />;
      case 'success':
        return <CheckCircle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <>
      <HeaderContainer $sidebarCollapsed={sidebarCollapsed} $theme={theme}>
        <LeftSection>
          <MobileMenuButton $theme={theme} onClick={onToggleSidebar}>
            {sidebarCollapsed ? <Menu size={24} /> : <X size={24} />}
          </MobileMenuButton>

          <SearchContainer ref={searchRef} $theme={theme}>
            <SearchIcon $theme={theme}>
              <Search size={20} />
            </SearchIcon>
            <SearchInput
              $theme={theme}
              placeholder="Search users, reports, settings..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
            />
            
            <SearchResults $visible={showSearchResults} $theme={theme}>
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <SearchResultItem
                    key={index}
                    $theme={theme}
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <ResultTitle $theme={theme}>{result.title}</ResultTitle>
                    <ResultPath $theme={theme}>{result.path}</ResultPath>
                  </SearchResultItem>
                ))
              ) : (
                <SearchResultItem $theme={theme}>
                  <ResultTitle $theme={theme}>No results found</ResultTitle>
                  <ResultPath $theme={theme}>Try different keywords</ResultPath>
                </SearchResultItem>
              )}
            </SearchResults>
          </SearchContainer>
        </LeftSection>

        <RightSection>
          <ThemeToggle $theme={theme} onClick={toggleTheme}>
            {getThemeIcon()}
          </ThemeToggle>

          <NotificationContainer ref={notificationRef}>
            <NotificationButton
              $hasNotifications={unreadNotifications > 0}
              $theme={theme}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={20} />
            </NotificationButton>

            <NotificationDropdown $visible={showNotifications} $theme={theme}>
              <NotificationHeader $theme={theme}>
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    background: theme.errorColor, 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: '10px' 
                  }}>
                    {unreadNotifications}
                  </span>
                )}
              </NotificationHeader>

              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  $read={notification.read}
                  $theme={theme}
                >
                  <NotificationContent>
                    <NotificationIcon $type={notification.type} $theme={theme}>
                      {getNotificationIcon(notification.type)}
                    </NotificationIcon>
                    <NotificationText>
                      <NotificationTitle $theme={theme}>
                        {notification.title}
                      </NotificationTitle>
                      <NotificationMessage $theme={theme}>
                        {notification.message}
                      </NotificationMessage>
                      <NotificationTime $theme={theme}>
                        <Clock size={12} />
                        {notification.time}
                      </NotificationTime>
                    </NotificationText>
                  </NotificationContent>
                </NotificationItem>
              ))}
            </NotificationDropdown>
          </NotificationContainer>

          <UserMenuContainer ref={userMenuRef}>
            <UserButton
              $theme={theme}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <UserAvatar $theme={theme}>
                {getInitials()}
              </UserAvatar>
              <span className="user-name">{getDisplayName()}</span>
              <ChevronDown size={16} />
            </UserButton>

            <UserDropdown $visible={showUserMenu} $theme={theme}>
              <UserDropdownItem
                $theme={theme}
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/admin/profile');
                }}
              >
                <User size={16} />
                Profile
              </UserDropdownItem>
              <UserDropdownItem
                $theme={theme}
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/admin/settings');
                }}
              >
                <Settings size={16} />
                Settings
              </UserDropdownItem>
              <UserDropdownItem $theme={theme} onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </UserDropdownItem>
            </UserDropdown>
          </UserMenuContainer>
        </RightSection>
      </HeaderContainer>

      <HeaderSpacer $sidebarCollapsed={sidebarCollapsed} />
    </>
  );
}

export default AdminHeader;