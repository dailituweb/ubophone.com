import React from 'react';
import styled from 'styled-components';
import { Phone, Users, User, DollarSign, PhoneIncoming } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 3px solid #000;
  padding: 0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom));
  display: none;
  z-index: 100;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.15);
  height: auto;
  min-height: 60px;

  @media (max-width: 768px) {
    display: block;
  }
`;

const NavItemsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  max-width: 500px;
  margin: 0 auto;
  padding: 0 0.5rem;
  gap: 0.5rem;

  @media (max-width: 480px) {
    padding: 0 0.25rem;
    gap: 0.25rem;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  color: ${props => props.$isActive ? '#000' : '#666'};
  background: ${props => props.$isActive ? '#FFC900' : 'transparent'};
  border: ${props => props.$isActive ? '2px solid #000' : '2px solid transparent'};
  font-weight: ${props => props.$isActive ? '800' : '600'};
  text-transform: uppercase;
  
  &:hover {
    color: #000;
    background: #FFC900;
    border: 2px solid #000;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  svg {
    width: 20px;
    height: 20px;
    transition: all 0.3s ease;
  }

  @media (max-width: 480px) {
    padding: 0.375rem 0.5rem;
    gap: 0.25rem;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const NavLabel = styled.span`
  font-size: 0.6rem;
  font-weight: inherit;
  text-align: center;
  white-space: nowrap;
  letter-spacing: 0.025em;

  @media (max-width: 480px) {
    font-size: 0.55rem;
  }
`;


function BottomNavigation() {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show bottom navigation if user is not logged in
  if (!user) {
    return null;
  }

  // Only show bottom navigation on member center pages
  const memberCenterPages = [
    '/phone', 
    '/contacts', 
    '/dashboard', 
    '/buy-credits',
    '/subscriptions',
    '/rates',
    '/phone-numbers',
    '/buy-phone-number',
    '/incoming-calls',
    '/cost-analysis'
  ];
  const isOnMemberPage = memberCenterPages.includes(location.pathname);

  if (!isOnMemberPage) {
    return null;
  }

  const navItems = [
    {
      path: '/phone',
      icon: Phone,
      label: 'Phone',
      id: 'phone'
    },
    {
      path: '/contacts',
      icon: Users,
      label: 'Contacts',
      id: 'contacts'
    },
    {
      path: '/cost-analysis',
      icon: DollarSign,
      label: 'Costs',
      id: 'cost-analysis'
    },
    {
      path: '/incoming-calls',
      icon: PhoneIncoming,
      label: 'Calls',
      id: 'incoming-calls'
    },
    {
      path: '/dashboard',
      icon: User,
      label: 'Profile',
      id: 'profile'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <BottomNavContainer>
      <NavItemsContainer>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <NavItem
              key={item.id}
              to={item.path}
              $isActive={active}
            >
              <IconComponent />
              <NavLabel>{item.label}</NavLabel>
            </NavItem>
          );
        })}
      </NavItemsContainer>
    </BottomNavContainer>
  );
}

export default BottomNavigation; 