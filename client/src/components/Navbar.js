import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Phone, Users, CreditCard, Menu, X, LogIn, LogOut, User, Calculator, ChevronDown, Settings, PhoneIncoming, PhoneCall, ShoppingCart, DollarSign } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoComponent from './LogoComponent';

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
  background: white;
  border-bottom: 2px solid #f0f0f0;
  position: relative;
  z-index: 10000;

  @media (max-width: 768px) {
    padding: 16px 24px;
  }
`;

const Logo = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$hasBottomNav'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 800;
  color: #0a0f2f;

  svg {
    color: #0a0f2f;
  }
`;

const LogoText = styled.span.withConfig({
  shouldForwardProp: (prop) => !['$hasBottomNav'].includes(prop),
})`
  display: ${props => props.$hasBottomNav ? 'none' : 'inline'};
  
  @media (max-width: 768px) {
    display: ${props => props.$hasBottomNav ? 'none' : 'inline'};
  }
`;

const NavItems = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isOpen', '$hasBottomNav'].includes(prop),
})`
  display: flex;
  gap: 40px;
  align-items: center;

  @media (max-width: 768px) {
    display: ${props => props.$isOpen && !props.$hasBottomNav ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    padding: 24px;
    border-bottom: 2px solid #f0f0f0;
    gap: 16px;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
`;

const NavButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$primary'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  background: ${props => props.$primary ? '#FFC900' : 'transparent'};
  border: ${props => props.$primary ? '3px solid #000' : 'none'};
  border-radius: ${props => props.$primary ? '0' : '0'};
  color: ${props => props.$primary ? '#0a0f2f' : '#0a0f2f'};
  font-weight: ${props => props.$primary ? '800' : '600'};
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: ${props => props.$primary ? 'uppercase' : 'none'};

  &:hover {
    background: ${props => props.$primary ? '#FFC900' : '#f5f5f5'};
    transform: ${props => props.$primary ? 'translate(-2px, -2px)' : 'none'};
    box-shadow: ${props => props.$primary ? '2px 2px 0 #000' : 'none'};
    opacity: ${props => props.$primary ? '1' : '0.8'};
  }

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    padding: 16px 24px;
    margin-bottom: 8px;
  }
`;

const MenuToggle = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$hasBottomNav'].includes(prop),
})`
  display: none;
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;

  @media (max-width: 768px) {
    display: ${props => props.$hasBottomNav ? 'none' : 'block'};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

// Mobile Dropdown for logged-in users
const MobileDropdownContainer = styled.div`
  position: relative;
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileDropdownToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #FFC900;
  border: 2px solid #000;
  border-radius: 0;
  font-weight: 800;
  color: #0a0f2f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.3s ease;
  }
`;

const MobileDropdownMenu = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isOpen'].includes(prop),
})`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  z-index: 10002;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  margin-top: 8px;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
`;

const MobileDropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #0a0f2f;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #FFC900;
    color: #000;
  }

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MobileDropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #0a0f2f;
  background: none;
  border: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  width: 100%;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #FFC900;
    color: #000;
  }

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const DesktopDropdownContainer = styled.div`
  position: relative;
  display: none;
  
  @media (min-width: 769px) {
    display: block;
  }
`;

const DesktopDropdownToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border: 3px solid #000;
  border-radius: 8px;
  color: #0a0f2f;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #000;
    background: #FFC900;
  }

  svg {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }
`;

const DesktopDropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  background: white;
  border: 3px solid #000;
  border-radius: 12px;
  min-width: 200px;
  box-shadow: 0 4px 0 #000;
  overflow: hidden;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.3s ease;
  z-index: 10001;
`;

const DesktopDropdownItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #0a0f2f;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border-bottom: 2px solid #f0f0f0;

  &:hover {
    background: #FFC900;
    color: #000;
  }

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;


function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close mobile menu
      if (isOpen && !event.target.closest('nav') && !event.target.closest('a')) {
        setIsOpen(false);
      }
      // Close mobile dropdown menu
      if (mobileDropdownOpen && !event.target.closest('[data-mobile-dropdown]')) {
        setMobileDropdownOpen(false);
      }
      // Close desktop dropdown menu
      if (desktopDropdownOpen && !event.target.closest('[data-desktop-dropdown]')) {
        setDesktopDropdownOpen(false);
      }
    };

    // Add a small delay to avoid conflicts with the menu button click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen, mobileDropdownOpen, desktopDropdownOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileDropdownOpen(false);
  };

  const handleMobileDropdownItemClick = () => {
    setMobileDropdownOpen(false);
  };

  const handleDesktopDropdownItemClick = () => {
    setDesktopDropdownOpen(false);
  };

  return (
    <NavContainer>
      <Logo $hasBottomNav={!!user}>
        {user ? (
          <img src="/logo-ubo.png" alt="Ubophone" width="32" height="32" />
        ) : (
          <LogoComponent size="32px" />
        )}
        <LogoText $hasBottomNav={!!user}>Ubophone</LogoText>
      </Logo>

      {/* Mobile Dropdown for logged-in users */}
      {user && (
        <MobileDropdownContainer data-mobile-dropdown>
          <MobileDropdownToggle onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}>
            <Settings />
            <ChevronDown style={{ transform: mobileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </MobileDropdownToggle>
          <MobileDropdownMenu $isOpen={mobileDropdownOpen}>
            <MobileDropdownItem to="/dashboard" onClick={handleMobileDropdownItemClick}>
              <User />
              Dashboard
            </MobileDropdownItem>
            <MobileDropdownItem to="/phone-numbers" onClick={handleMobileDropdownItemClick}>
              <PhoneCall />
              Phone Numbers
            </MobileDropdownItem>
            <MobileDropdownItem to="/buy-phone-number" onClick={handleMobileDropdownItemClick}>
              <ShoppingCart />
              Buy Number
            </MobileDropdownItem>
            <MobileDropdownItem to="/billing" onClick={handleMobileDropdownItemClick}>
              <DollarSign />
              Billing
            </MobileDropdownItem>
            {process.env.NODE_ENV === 'development' && (
              <MobileDropdownItem to="/test-incoming-calls" onClick={handleMobileDropdownItemClick}>
                <Settings />
                Test Calls
              </MobileDropdownItem>
            )}
            <MobileDropdownButton onClick={handleLogout}>
              <LogOut />
              Logout
            </MobileDropdownButton>
          </MobileDropdownMenu>
        </MobileDropdownContainer>
      )}

      <NavItems $isOpen={isOpen} $hasBottomNav={!!user}>
        {user ? (
          <>
            <Link to="/phone" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton>
                <Phone />
                Phone
              </NavButton>
            </Link>
            
            <Link to="/contacts" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton>
                <Users />
                Contacts
              </NavButton>
            </Link>
            
            <Link to="/incoming-calls" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton>
                <PhoneIncoming />
                Calls
              </NavButton>
            </Link>
            
            <Link to="/rates" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton>
                <Calculator />
                Rates
              </NavButton>
            </Link>
            
            <Link to="/buy-credits" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton $primary>
                <CreditCard />
                Buy Credits
              </NavButton>
            </Link>
            
            <Link to="/dashboard" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton>
                <User />
                Dashboard
              </NavButton>
            </Link>

            <DesktopDropdownContainer data-desktop-dropdown>
              <DesktopDropdownToggle onClick={() => setDesktopDropdownOpen(!desktopDropdownOpen)}>
                <User />
                Account
                <ChevronDown style={{ transform: desktopDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </DesktopDropdownToggle>
              <DesktopDropdownMenu $isOpen={desktopDropdownOpen}>
                <DesktopDropdownItem to="/phone-numbers" onClick={handleDesktopDropdownItemClick}>
                  <PhoneCall />
                  Manage Numbers
                </DesktopDropdownItem>
                <DesktopDropdownItem to="/buy-phone-number" onClick={handleDesktopDropdownItemClick}>
                  <ShoppingCart />
                  Buy Phone Number
                </DesktopDropdownItem>
                <DesktopDropdownItem to="/billing" onClick={handleDesktopDropdownItemClick}>
                  <DollarSign />
                  Billing & Usage
                </DesktopDropdownItem>
                <DesktopDropdownItem as="button" onClick={() => { handleLogout(); handleDesktopDropdownItemClick(); }} style={{ 
                  background: 'none', 
                  border: 'none', 
                  width: '100%', 
                  textAlign: 'left',
                  cursor: 'pointer' 
                }}>
                  <LogOut />
                  Logout
                </DesktopDropdownItem>
              </DesktopDropdownMenu>
            </DesktopDropdownContainer>
          </>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton>
                <LogIn />
                Login
              </NavButton>
            </Link>
            
            <Link to="/register" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
              <NavButton $primary>
                <User />
                Sign Up
              </NavButton>
            </Link>
          </>
        )}
      </NavItems>

      <MenuToggle onClick={() => setIsOpen(!isOpen)} $hasBottomNav={!!user}>
        {isOpen ? <X /> : <Menu />}
      </MenuToggle>
    </NavContainer>
  );
}

export default Navbar; 