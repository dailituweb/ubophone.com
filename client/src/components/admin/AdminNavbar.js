'use strict';

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  BarChart3, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield,
  User,
  ChevronDown,
  Bell,
  Search
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 3px solid #000;
  z-index: 9999;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const NavItems = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isOpen'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-bottom: 3px solid #000;
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }
`;

const NavLink = styled(Link).withConfig({
  shouldForwardProp: (prop) => !['$active'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => props.$active ? '#FFC900' : 'transparent'};
  border: 2px solid ${props => props.$active ? '#000' : 'transparent'};
  border-radius: 0;
  color: #0a0f2f;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.$active ? '#FFC900' : '#f8fafc'};
    border-color: #000;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 2px solid #000;
  border-radius: 0;
  color: #0a0f2f;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #FFC900;
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
`;

const Dropdown = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isOpen'].includes(prop),
})`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: ${props => props.$isOpen ? 'block' : 'none'};
  z-index: 10000;
`;

const DropdownItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: none;
  color: #0a0f2f;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #e2e8f0;

  &:hover {
    background: #FFC900;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const MobileToggle = styled.button`
  display: none;
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;

  @media (max-width: 768px) {
    display: block;
  }
`;

const Spacer = styled.div`
  height: 80px;

  @media (max-width: 768px) {
    height: 70px;
  }
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    display: ${props => props.hasNotifications ? 'block' : 'none'};
  }
`;

function AdminNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout, getDisplayName, getInitials } = useAdminAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
    { path: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
    { path: '/admin/users', label: 'Users', icon: <Users size={18} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  const isCurrentPath = (path) => location.pathname === path;

  if (!admin) {
    return <Spacer />;
  }

  return (
    <>
      <NavContainer>
        <Logo>
          <Shield size={24} />
          Admin Panel
        </Logo>

        <NavItems $isOpen={isMenuOpen}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              $active={isCurrentPath(item.path)}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </NavItems>

        <UserMenu>
          <NotificationBadge hasNotifications={true}>
            <Bell size={20} color="#64748b" />
          </NotificationBadge>

          <UserButton onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#FFC900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              border: '2px solid #000'
            }}>
              {getInitials()}
            </div>
            <span style={{ 
              maxWidth: '120px', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {getDisplayName()}
            </span>
            <ChevronDown size={16} />
          </UserButton>

          <Dropdown $isOpen={isUserMenuOpen}>
            <DropdownItem onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/admin/profile');
            }}>
              <User size={16} />
              Profile
            </DropdownItem>
            <DropdownItem onClick={() => {
              setIsUserMenuOpen(false);
              navigate('/admin/settings');
            }}>
              <Settings size={16} />
              Settings
            </DropdownItem>
            <DropdownItem onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </DropdownItem>
          </Dropdown>

          <MobileToggle onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </MobileToggle>
        </UserMenu>
      </NavContainer>
      <Spacer />
    </>
  );
}

export default AdminNavbar;