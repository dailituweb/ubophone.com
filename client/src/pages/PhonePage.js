import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Phone, UserPlus, Delete, ChevronDown, Globe, 
  CreditCard, MessageSquare, ArrowRight, CheckCircle, Info, X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import twilioService from '../services/twilioService';
import webSocketService from '../services/websocketService';
import MicrophonePermissionModal from '../components/MicrophonePermissionModal';
import { COUNTRY_OPTIONS } from '../utils/countryOptions-complete';

const PhonePageContainer = styled.div`
  min-height: 100vh;
  padding: 1.5rem;
  background: #FAFAFA;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }
`;

const PageContent = styled.div`
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

// Tutorial Card Styles
const TutorialCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #FFC900;
  }
`;

const TutorialBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const TutorialTitle = styled.h3`
  color: #0a0f2f;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
`;

const TutorialDescription = styled.p`
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  font-weight: 500;
`;

const TutorialActions = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const TutorialButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => props.primary ? '#FFC900' : 'white'};
  color: ${props => props.primary ? '#0a0f2f' : '#0a0f2f'};
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
    background: ${props => props.primary ? '#FFC900' : '#f5f5f5'};
  }
`;

const SkipButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  margin-left: auto;

  &:hover {
    color: #0a0f2f;
  }
`;

// Main Dialer Container
const DialerContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }
`;

// Balance and Status Section
const StatusSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const BalanceDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
`;


// Call From Section
const CallFromSection = styled.div`
  margin-bottom: 1.5rem;
`;

const CallFromHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const CallFromLabel = styled.div`
  color: #0a0f2f;
  font-size: 0.875rem;
  font-weight: 600;
`;










const CallFromSelector = styled.div`
  position: relative;
`;

const CallFromButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.75rem 1rem;
  color: #0a0f2f;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;

  &:hover {
    background: #f5f5f5;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const CallFromOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const CallFromDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  z-index: 10;
  overflow: hidden;
  margin-top: 0.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const DropdownOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  position: relative;

  &:hover {
    background: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }

  ${props => props.$isDefault && `
    background: #FFF8E1;
    border-left: 4px solid #FFC900;
    
    &::after {
      content: '✓';
      position: absolute;
      right: 1rem;
      color: #FFC900;
      font-weight: 800;
    }
  `}

  ${props => props.$comingSoon && `
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      background: none;
    }
  `}
`;

const OptionIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OptionDetails = styled.div`
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const OptionTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OptionSubtitle = styled.div`
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
`;

const OptionUsage = styled.div`
  font-size: 0.7rem;
  color: #999;
  font-weight: 400;
`;

const OptionLabel = styled.span`
  background: #FFC900;
  color: #0a0f2f;
  border: 1px solid #000;
  border-radius: 0;
  font-size: 0.6rem;
  font-weight: 800;
  padding: 0.1rem 0.3rem;
  text-transform: uppercase;
  margin-left: 0.5rem;
`;

const ComingSoonBadge = styled.span`
  background: #f0f0f0;
  color: #666;
  border: 1px solid #ccc;
  border-radius: 0;
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.1rem 0.3rem;
  text-transform: uppercase;
  margin-left: auto;
`;

const NewBadge = styled.span`
  background: #FFC900;
  color: #0a0f2f;
  border: 1px solid #000;
  border-radius: 0;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 0.125rem 0.375rem;
  margin-left: auto;
  text-transform: uppercase;
`;

const CountryDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  z-index: 20;
  overflow: hidden;
  margin-top: 0.25rem;
  min-width: 200px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
`;

const CountryOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
  font-weight: 500;

  &:hover {
    background: #f5f5f5;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CountryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const CountryName = styled.span`
  font-size: 0.8rem;
  color: #666;
  margin-left: auto;
`;

// Phone Input Section
const PhoneInputSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PhoneInput = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 1rem;
  transition: all 0.3s ease;
  position: relative;

  &:focus-within {
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }
`;

const CountryFlag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0a0f2f;
  font-weight: 600;
  margin-right: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;

  &:hover {
    color: #FFC900;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
    margin-right: 0.25rem;
    font-size: 0.9rem;
  }
`;

const NumberInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #0a0f2f;
  font-size: 1.1rem;
  font-weight: 600;

  &::placeholder {
    color: #666;
  }
`;

const AddContactAction = styled.button`
  background: ${props => props.$hasNumber && props.$isLoggedIn ? 
    '#FFC900' : '#f5f5f5'};
  border: 2px solid ${props => props.$hasNumber && props.$isLoggedIn ? 
    '#000' : '#ccc'};
  border-radius: 0;
  color: ${props => props.$hasNumber && props.$isLoggedIn ? '#0a0f2f' : '#666'};
  cursor: ${props => props.$hasNumber && props.$isLoggedIn ? 'pointer' : 'not-allowed'};
  padding: 0.5rem;
  transition: all 0.3s ease;
  opacity: ${props => props.$hasNumber && props.$isLoggedIn ? 1 : 0.6};
  font-weight: 600;

  &:hover {
    background: ${props => props.$hasNumber && props.$isLoggedIn ? 
      '#FFC900' : '#f5f5f5'};
    transform: ${props => props.$hasNumber && props.$isLoggedIn ? 'translate(-2px, -2px)' : 'none'};
    box-shadow: ${props => props.$hasNumber && props.$isLoggedIn ? '2px 2px 0 #000' : 'none'};
  }
`;

// Dialer Pad
const DialPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const DialButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: white;
  border: 3px solid #000;
  color: ${props => props.$keyboardMode === 'ABC' ? '#999' : '#0a0f2f'};
  font-size: 1.5rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin: 0 auto;

  &:hover {
    background: #FFC900;
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(255, 201, 0, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }

  .letters {
    font-size: 0.6rem;
    color: ${props => props.$keyboardMode === 'ABC' ? '#000' : '#999'};
    margin-top: -2px;
    font-weight: ${props => props.$keyboardMode === 'ABC' ? '800' : '500'};
    letter-spacing: 0.3px;
  }

  @media (max-width: 480px) {
    width: 65px;
    height: 65px;
    font-size: 1.4rem;

    .letters {
      font-size: 0.55rem;
    }
  }
`;

// Action Buttons
const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
`;

const CallButton = styled.button`
  background: #FFC900;
  color: #0a0f2f;
  border: 3px solid #000;
  border-radius: 50%;
  width: 65px;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(255, 201, 0, 0.3);
  font-weight: 800;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 40px rgba(255, 201, 0, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

const DeleteButton = styled.button`
  background: white;
  color: #ef4444;
  border: 2px solid #ef4444;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ef4444;
    color: white;
    transform: scale(1.1);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ToggleButton = styled.button`
  background: white;
  color: #000;
  border: 2px solid #000;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.75rem;

  &:hover {
    background: #FFC900;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
    font-size: 0.7rem;
  }
`;

// Call Status Display - updated for yellow-black flat style
const CallStatusDisplay = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #FFC900;
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  .status-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
    margin-right: 1rem;
  }
  
  .status-text {
    color: #0a0f2f;
    font-weight: 800;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-transform: uppercase;
    
    &::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #FFC900;
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
  }
  
  .call-details {
    color: #666;
    font-size: 0.875rem;
    display: flex;
    gap: 1rem;
    font-weight: 600;
    flex-wrap: wrap;
    
    span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      
      &:first-child::before {
        content: '⏱️';
        font-size: 0.75rem;
      }
      
      &:nth-child(2)::before {
        content: '💰';
        font-size: 0.75rem;
      }
      
      &:last-child {
        word-break: break-all;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        
        @media (min-width: 769px) {
          max-width: 180px;
        }
        
        @media (min-width: 1024px) {
          max-width: 220px;
        }
        
        &::before {
          content: '📞';
          font-size: 0.75rem;
          flex-shrink: 0;
        }
      }
    }
  }
  
  .end-call-btn {
    background: white;
    border: 3px solid #ef4444;
    border-radius: 0;
    color: #ef4444;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 800;
    text-transform: uppercase;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    min-width: 100px;
    flex-shrink: 0;
    
    &:hover {
      background: #ef4444;
      color: white;
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }

    &:active {
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .status-info {
      text-align: center;
      gap: 0.75rem;
      margin-right: 0;
    }
    
    .status-text {
      font-size: 1.1rem;
      justify-content: center;
    }
    
    .call-details {
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.8rem;
      
      span:last-child {
        max-width: none;
        white-space: normal;
        text-overflow: initial;
        overflow: visible;
      }
    }
    
    .end-call-btn {
      align-self: center;
      padding: 0.875rem 2rem;
      font-size: 0.9rem;
      min-width: 120px;
    }
  }

  @media (max-width: 480px) {
    padding: 0.875rem;
    border-radius: 0.875rem;
    
    .status-text {
      font-size: 1rem;
    }
    
    .call-details {
      gap: 0.75rem;
      font-size: 0.75rem;
      
      span {
        &::before {
          font-size: 0.7rem;
        }
      }
    }
    
    .end-call-btn {
      padding: 0.75rem 1.75rem;
      font-size: 0.875rem;
      min-width: 110px;
      border-radius: 0.625rem;
    }
  }

  @media (max-width: 360px) {
    .call-details {
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
    }
    
    .end-call-btn {
      width: 100%;
      padding: 0.875rem;
      min-width: auto;
    }
  }
`;

// 快速添加联系人模态框样式 - 适配PhonePage的风格
const QuickAddModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const QuickAddContent = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
`;

const QuickAddHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const QuickAddTitle = styled.h3`
  color: #0a0f2f;
  font-size: 1.1rem;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;

  svg {
    color: #FFC900;
    width: 18px;
    height: 18px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f5f5;
    color: #0a0f2f;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const QuickFormGroup = styled.div`
  margin-bottom: 1rem;
`;

const QuickLabel = styled.label`
  display: block;
  color: #0a0f2f;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
`;

const QuickInput = styled.input`
  width: 100%;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.65rem;
  color: #0a0f2f;
  font-size: 0.85rem;
  font-weight: 500;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }

  &::placeholder {
    color: #666;
  }

  &:disabled {
    background: #f5f5f5;
    color: #666;
    cursor: not-allowed;
  }
`;

const PrefilledNumber = styled.div`
  background: #FFC900;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.65rem;
  color: #0a0f2f;
  font-size: 0.85rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 14px;
    height: 14px;
    color: #0a0f2f;
  }
`;

const QuickButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const QuickButton = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 0;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #000;
  min-width: 80px;

  ${props => props.$primary ? `
    background: #FFC900;
    color: #0a0f2f;
    
    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  ` : `
    background: white;
    color: #0a0f2f;
    
    &:hover {
      background: #f5f5f5;
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  `}
`;

// 🔔 来电模式样式
const IncomingCallContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #FFC900;
    animation: shimmer 2s linear infinite;
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    max-width: 100%;
  }
`;

const IncomingCallStatus = styled.div`
  color: #FFC900;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const IncomingCallNumber = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  word-break: break-all;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const IncomingCallDetails = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const IncomingCallTimer = styled.div`
  background: #f5f5f5;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.75rem 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #0a0f2f;
  font-weight: 600;
`;

const IncomingCallActions = styled.div`
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;

  @media (max-width: 768px) {
    gap: 1.5rem;
  }
`;

const IncomingCallButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 3px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => props.accept && `
    background: #FFC900;
    color: #000;
    box-shadow: 0 8px 32px rgba(255, 201, 0, 0.4);
    
    &:hover {
      background: #e6b600;
      transform: scale(1.1);
      box-shadow: 0 12px 40px rgba(255, 201, 0, 0.6);
    }
  `}
  
  ${props => props.decline && `
    background: #0a0f2f;
    color: white;
    box-shadow: 0 8px 32px rgba(10, 15, 47, 0.4);
    
    &:hover {
      background: #1a1f3f;
      transform: scale(1.1);
      box-shadow: 0 12px 40px rgba(10, 15, 47, 0.6);
    }
  `}

  svg {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 768px) {
    width: 65px;
    height: 65px;
    
    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

// Country options - Complete list sorted alphabetically by country name

// Emergency Numbers Database - 紧急电话号码数据库
const EMERGENCY_NUMBERS = {
  // 北美
  'US': ['911', '112'],
  'CA': ['911', '112'],
  
  // 欧洲
  'GB': ['999', '112'],
  'DE': ['112', '110'],
  'FR': ['112', '15', '17', '18'],
  'IT': ['112', '113', '115', '118'],
  'ES': ['112', '091', '080', '085'],
  'NL': ['112'],
  'SE': ['112'],
  'NO': ['112', '113'],
  'DK': ['112'],
  'FI': ['112'],
  'CH': ['112', '117', '118', '144'],
  'AT': ['112', '122', '133', '144'],
  'BE': ['112', '101'],
  'PT': ['112'],
  'GR': ['112', '100', '199'],
  'PL': ['112', '997', '998', '999'],
  'CZ': ['112', '150', '155', '158'],
  'HU': ['112', '104', '105', '107'],
  'RO': ['112'],
  'UA': ['112', '101', '102', '103'],
  
  // 亚洲
  'CN': ['110', '119', '120', '122'],
  'JP': ['110', '119', '118'],
  'KR': ['112', '119'],
  'IN': ['112', '100', '101', '102', '108'],
  'TH': ['191', '199', '1554', '1155'],
  'MY': ['999'],
  'SG': ['999', '995'],
  'PH': ['117', '911'],
  'ID': ['112', '110', '118', '119'],
  'VN': ['113', '114', '115'],
  'HK': ['999'],
  'TW': ['110', '119'],
  
  // 大洋洲
  'AU': ['000', '112'],
  'NZ': ['111'],
  
  // 中东/非洲
  'IL': ['100', '101', '102'],
  'EG': ['122', '123'],
  'SA': ['997', '998', '999'],
  'AE': ['999', '997', '998'],
  'ZA': ['10111', '10177', '112'],
  'TR': ['112', '155', '156'],
  
  // 南美
  'BR': ['190', '192', '193'],
  'AR': ['101', '107', '911'],
  'CL': ['133', '134', '135'],
  'CO': ['123', '132'],
  'PE': ['105', '116', '117'],
  'MX': ['911', '066'],
  
  // 通用国际紧急号码
  'GLOBAL': ['112']
};

// Emergency Warning Styled Components - 紧急电话警告样式组件
const EmergencyWarning = styled.div`
  background: #ef4444;
  color: white;
  border: 3px solid #dc2626;
  border-radius: 0;
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
  animation: emergencyPulse 2s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #FFC900;
    animation: shimmer 2s linear infinite;
  }

  @keyframes emergencyPulse {
    0%, 100% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.9; 
      transform: scale(1.01);
    }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

const EmergencyIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  
  .emergency-icon {
    font-size: 1.5rem;
    animation: emergencyBlink 1s ease-in-out infinite;
  }
  
  @keyframes emergencyBlink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.5; }
  }
`;

const EmergencyTitle = styled.div`
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const EmergencyMessage = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  opacity: 0.95;
`;

function PhonePage() {
  // 使用 useSearchParams 获取URL参数
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // All refs grouped together
  const urlCallHandled = useRef(false); // 修复竞态条件：确保URL来电只处理一次
  const incomingCallTimerRef = useRef(null);
  const handleIncomingCallDeclineRef = useRef(null); // 用于避免循环依赖
  const incomingCallDataRef = useRef(null); // 用于存储最新的incomingCallData
  const callSavedRef = useRef(false);
  const callTimerRef = useRef(null);
  const callDurationRef = useRef(0);
  const callCostRef = useRef(0);
  const lastDialedNumberRef = useRef('');
  const currentRateRef = useRef(0.02);

  // All state grouped by functionality
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    // 初始化时就检查localStorage，避免教程闪现
    const hasSeenTutorial = localStorage.getItem('phoneTutorialCompleted');
    return !hasSeenTutorial;
  });
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showCallFromDropdown, setShowCallFromDropdown] = useState(false);
  const [selectedCallFrom, setSelectedCallFrom] = useState('public');
  const [userPhoneNumbers, setUserPhoneNumbers] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_OPTIONS.find(c => c.code === '+1' && c.name === 'United States') || COUNTRY_OPTIONS.find(c => c.code === '+1') || COUNTRY_OPTIONS[0]);
  const [keyboardMode, setKeyboardMode] = useState('123'); // '123' or 'ABC'
  const [emergencyWarning, setEmergencyWarning] = useState(false);
  
  // 自动检测并设置国家代码，同时清理重复的国家代码
  const detectAndSetCountryFromNumber = useCallback((inputNumber) => {
    if (!inputNumber.startsWith('+')) return null;
    
    // 提取国家代码，从最长的开始匹配（避免短代码误匹配）
    const sortedCountries = [...COUNTRY_OPTIONS].sort((a, b) => b.code.length - a.code.length);
    
    for (const country of sortedCountries) {
      const countryCode = country.code.replace(/\s/g, ''); // 去除空格
      if (inputNumber.startsWith(countryCode)) {
        // 只有当检测到的国家与当前选择的不同时才更新
        if (selectedCountry.code !== country.code) {
          console.log('🌍 Auto-detected country:', country.name, countryCode);
          setSelectedCountry(country);
          
          // 🔧 关键修复：从输入中移除国家代码，只保留本地号码
          const localNumber = inputNumber.substring(countryCode.length);
          setPhoneNumber(localNumber);
          
          // 静默检测，不显示提示（用户体验更流畅）
          // toast.success(`🌍 Detected: ${country.flag} ${country.name}`, { 
          //   autoClose: 2000,
          //   position: 'top-center'
          // });
          
          console.log('📞 Cleaned number:', {
            original: inputNumber,
            countryCode: countryCode,
            localNumber: localNumber,
            finalDisplay: `${country.code} ${localNumber}`
          });
        }
        return country;
      }
    }
    
    return null;
  }, [selectedCountry.code]);

  // 紧急号码检测函数
  const getCountryCodeFromName = useCallback((countryName) => {
    const countryMappings = {
      'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'GB', 
      'Germany': 'DE', 'France': 'FR', 'Italy': 'IT', 'Spain': 'ES',
      'Netherlands': 'NL', 'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK',
      'Finland': 'FI', 'Switzerland': 'CH', 'Austria': 'AT', 'Belgium': 'BE',
      'Portugal': 'PT', 'Greece': 'GR', 'Poland': 'PL', 'Czech Republic': 'CZ',
      'Hungary': 'HU', 'Romania': 'RO', 'Ukraine': 'UA',
      'China': 'CN', 'Japan': 'JP', 'South Korea': 'KR', 'India': 'IN',
      'Thailand': 'TH', 'Malaysia': 'MY', 'Singapore': 'SG', 'Philippines': 'PH',
      'Indonesia': 'ID', 'Vietnam': 'VN', 'Hong Kong': 'HK', 'Taiwan': 'TW',
      'Australia': 'AU', 'New Zealand': 'NZ',
      'Israel': 'IL', 'Egypt': 'EG', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE',
      'South Africa': 'ZA', 'Turkey': 'TR',
      'Brazil': 'BR', 'Argentina': 'AR', 'Chile': 'CL', 'Colombia': 'CO',
      'Peru': 'PE', 'Mexico': 'MX'
    };
    
    for (const [countryName_key, code] of Object.entries(countryMappings)) {
      if (countryName.includes(countryName_key)) {
        return code;
      }
    }
    return 'US'; // 默认值
  }, []);

  const isEmergencyNumber = useCallback((phoneNumber, selectedCountry) => {
    if (!phoneNumber) return false;
    
    // 清理号码，只保留数字
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    if (cleanNumber.length === 0) return false;
    
    // 获取国家代码
    const countryCode = getCountryCodeFromName(selectedCountry.name);
    const emergencyList = EMERGENCY_NUMBERS[countryCode] || [];
    
    // 也检查全球通用号码
    const globalEmergency = EMERGENCY_NUMBERS.GLOBAL || [];
    const allEmergencyNumbers = [...emergencyList, ...globalEmergency];
    
    // 检查是否匹配紧急号码
    return allEmergencyNumbers.some(emergency => {
      return cleanNumber === emergency || 
             cleanNumber.endsWith(emergency) ||
             (emergency.length >= 3 && cleanNumber.startsWith(emergency));
    });
  }, [getCountryCodeFromName]);

  // 格式化电话号码输入
  const handlePhoneNumberChange = useCallback((value) => {
    // 自动过滤，只保留数字和+号
    const filtered = value.replace(/[^\d+]/g, '');
    
    // 确保+号只能在开头
    let finalValue = filtered;
    if (filtered.includes('+')) {
      const plusIndex = filtered.indexOf('+');
      if (plusIndex > 0) {
        // 如果+号不在开头，移除所有+号然后在开头添加
        const withoutPlus = filtered.replace(/\+/g, '');
        finalValue = '+' + withoutPlus;
      }
    }
    
    // 🔧 防止无限循环：只有当值真正改变时才设置
    if (finalValue !== phoneNumber) {
      setPhoneNumber(finalValue);
      
      // 检查是否为紧急号码
      const isEmergency = isEmergencyNumber(finalValue, selectedCountry);
      setEmergencyWarning(isEmergency);
      
      // 如果输入以+开头且长度足够，尝试自动检测国家
      if (finalValue.startsWith('+') && finalValue.length >= 3) {
        // 🔧 添加延迟避免在状态更新过程中触发检测
        setTimeout(() => {
          detectAndSetCountryFromNumber(finalValue);
        }, 0);
      }
    }
  }, [detectAndSetCountryFromNumber, phoneNumber, isEmergencyNumber, selectedCountry]);
  
  // 🔔 Incoming call state management
  const [incomingCallMode, setIncomingCallMode] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [incomingCallTimer, setIncomingCallTimer] = useState(30);
  const [isNavigationInitialized, setIsNavigationInitialized] = useState(true); // 默认已初始化，避免闪烁
  // 移除 returnToPath - 挂断后停留在 /phone 页面
  
  // Twilio call state
  const [callStatus, setCallStatus] = useState(null); // 'connecting', 'ringing', 'connected', 'disconnected'
  const [callDuration, setCallDuration] = useState(0);
  const [callCost, setCallCost] = useState(0.00);
  const [isInitializingTwilio, setIsInitializingTwilio] = useState(false);
  const [twilioReady, setTwilioReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('unknown');
  const [voiceServiceAvailable, setVoiceServiceAvailable] = useState(true);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [displayBalance, setDisplayBalance] = useState(0); // 用于实时显示余额
  
  // 快速添加联系人状态
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    country: ''
  });
  
  const { user, balance, updateBalance } = useAuth();

  // 初始化显示余额
  useEffect(() => {
    const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
    setDisplayBalance(currentBalance);
  }, [balance]);

  // 🔔 定义来电事件处理函数 - 移到useEffect外部避免Hooks规则违反
  const handleCallTimeout = useCallback(() => {
    console.log('⏰ PhonePage: Incoming call timeout');
    
    // 防护：只有在真正有来电时才处理timeout
    if (incomingCallMode && incomingCallData) {
      console.log('⏰ Processing timeout for active call:', incomingCallData.callSid);
      setIncomingCallMode(false);
      setIncomingCallData(null);
      setIncomingCallTimer(30);
      
      // 清理计时器
      if (incomingCallTimerRef.current) {
        clearInterval(incomingCallTimerRef.current);
        incomingCallTimerRef.current = null;
      }
    } else {
      console.log('⏰ Ignoring timeout event - no active incoming call');
    }
  }, [incomingCallMode, incomingCallData]);

  const handleIncomingCallCanceled = useCallback((cancelData) => {
    console.log('❌ PhonePage: Incoming call canceled by caller', cancelData);
    
    // 立即清理所有相关的来电状态
    setIncomingCallMode(false);
    setIncomingCallData(null);
    setIncomingCallTimer(0); // 修复：重置计时器以隐藏UI

    // 确保计时器ref也被清理
    if (incomingCallTimerRef.current) {
      clearInterval(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    
    // 显示用户友好的提示
    const reasonText = cancelData.reason === 'caller_hangup' ? 'Caller ended the call' : 
                      cancelData.reason === 'no-answer' ? 'Call not answered' :
                      cancelData.reason === 'busy' ? 'Line was busy' : 'Call ended';
    
    toast.info(reasonText, { autoClose: 3000 });
    
    console.log('✅ PhonePage: Incoming call state cleaned up');
  }, []);

  // 🔔 设置来电监听逻辑 - 当用户在拨号页面时接收来电事件
  useEffect(() => {
    if (!user) return;

    // 检查是否通过来电跳转到这个页面
    const urlParams = new URLSearchParams(location.search);
    const isIncomingCall = urlParams.get('incoming') === 'true';
    const callDataParam = urlParams.get('callData');
    
    // 修复竞态条件：增加 urlCallHandled.current 检查
    if (isIncomingCall && callDataParam && !urlCallHandled.current) {
      urlCallHandled.current = true; // 标记为已处理
      try {
        const callData = JSON.parse(decodeURIComponent(callDataParam));
        console.log('📞 PhonePage: Received incoming call from URL params', callData);
        
        // 🔧 关键修复：检查是否已经处理过，避免重复处理导致闪烁
        if (!incomingCallMode && !incomingCallData) {
          console.log('📞 Processing incoming call from URL - first time');
          
          // 立即批量设置所有状态，避免多次渲染
          React.startTransition(() => {
            setIncomingCallMode(true);
            setIncomingCallData(callData);
            setIncomingCallTimer(30);
          });
          
          // 立即清理URL参数，避免后续重复处理
          const newUrl = new URL(window.location);
          newUrl.searchParams.delete('incoming');
          newUrl.searchParams.delete('callData');
          newUrl.searchParams.delete('returnTo');
          window.history.replaceState({}, '', newUrl);
          
          console.log('📞 来电激活完成，URL参数已清理');
        } else {
          console.log('📞 Incoming call already processed, skipping');
        }
        
      } catch (error) {
        console.error('❌ PhonePage: Error parsing incoming call data:', error);
      }
    }

    // 监听来电事件（当用户已经在拨号页面时）
    const handleIncomingCall = (callData) => {
      console.log('📞 PhonePage: Direct incoming call received', callData);
      
      // 🔧 修复：使用 startTransition 确保状态更新的优先级，避免与UI更新冲突
      React.startTransition(() => {
        setIncomingCallMode(true);
        setIncomingCallData(callData);
        setIncomingCallTimer(30);
        setShowTutorial(false); // 隐藏教程
      });
    };

    // 添加WebSocket事件监听
    webSocketService.on('incoming_call', handleIncomingCall);
    webSocketService.on('incoming_call_timeout', handleCallTimeout);
    webSocketService.on('incoming_call_canceled', handleIncomingCallCanceled);

    return () => {
      webSocketService.off('incoming_call', handleIncomingCall);
      webSocketService.off('incoming_call_timeout', handleCallTimeout);
      webSocketService.off('incoming_call_canceled', handleIncomingCallCanceled);
    };
  }, [user, location.search, handleCallTimeout, handleIncomingCallCanceled, incomingCallData, incomingCallMode]); // 添加缺失的依赖

  // 初始化国家选择（基于URL参数countryCode）
  useEffect(() => {
    if (!searchParams) {
      return;
    }

    const urlCountryCode = searchParams.get('countryCode');
    
    if (urlCountryCode) {
      const normalizedCode = urlCountryCode.startsWith('+') ? urlCountryCode : `+${urlCountryCode}`;
      
      // 在 COUNTRY_OPTIONS 中查找匹配的国家（支持容错处理）
      const matchedCountry = COUNTRY_OPTIONS.find(country => {
        // 移除所有空格进行比较，增强容错性
        const cleanCountryCode = country.code.replace(/\s/g, '');
        const cleanNormalizedCode = normalizedCode.replace(/\s/g, '');
        return cleanCountryCode === cleanNormalizedCode;
      });
      
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
      }
    }
  }, [searchParams]);

  // 备用机制：使用直接URL解析，防止searchParams时序问题
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryCodeParam = urlParams.get('countryCode');
    
    if (countryCodeParam) {
      const timer = setTimeout(() => {
        const normalizedCode = countryCodeParam.startsWith('+') ? countryCodeParam : `+${countryCodeParam}`;
        
        const matchedCountry = COUNTRY_OPTIONS.find(country => {
          const cleanCountryCode = country.code.replace(/\s/g, '');
          const cleanNormalizedCode = normalizedCode.replace(/\s/g, '');
          return cleanCountryCode === cleanNormalizedCode;
        });
        
        if (matchedCountry) {
          setSelectedCountry(matchedCountry);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Fetch user's phone numbers with enhanced information
  const fetchUserPhoneNumbers = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await fetch('/api/phone-numbers', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const phoneNumbers = data.phoneNumbers || [];
        setUserPhoneNumbers(phoneNumbers);
        
        // Auto-select default number if one exists and no number is currently selected
        if (phoneNumbers.length > 0 && selectedCallFrom === 'public') {
          const defaultNumber = phoneNumbers.find(num => num.isDefault);
          if (defaultNumber) {
            setSelectedCallFrom(`number_${defaultNumber.id}`);
            console.log('📞 Auto-selected default caller ID:', defaultNumber.phoneNumber);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  }, [user?.token, selectedCallFrom]);

  useEffect(() => {
    if (user?.token) {
      fetchUserPhoneNumbers();
    }
  }, [user, fetchUserPhoneNumbers]);

  // Detect phone number type (mobile vs landline) - returns null if uncertain
  const detectPhoneType = useCallback((phoneNumber, countryCode) => {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    
    // Moldova specific detection
    if (countryCode === 'MD') {
      const localNumber = cleanNumber.replace(/^373/, '');
      if (localNumber.startsWith('6') || localNumber.startsWith('7') || localNumber.startsWith('8')) {
        return 'mobile';
      } else if (localNumber.startsWith('2') || localNumber.startsWith('3')) {
        return 'landline';
      }
    }
    
    // US/Canada detection
    if (countryCode === 'US' || countryCode === 'CA') {
      return 'mobile'; // Same rate anyway
    }
    
    // UK detection
    if (countryCode === 'GB') {
      const localNumber = cleanNumber.replace(/^44/, '');
      if (localNumber.startsWith('7')) {
        return 'mobile';
      } else if (localNumber.startsWith('1') || localNumber.startsWith('2')) {
        return 'landline';
      }
    }
    
    // Return null if uncertain - backend will use highest rate
    return null;
  }, []);

  // Function to get rate for selected country with phone type detection
  const getRateForCountry = useCallback(async (countryCode, phoneNumber = '') => {
    try {
      const phoneType = detectPhoneType(phoneNumber, countryCode);
      // If detection successful, use specific rate; otherwise backend uses highest rate
      const url = phoneType 
        ? `/api/rates/country/${countryCode}?callType=${phoneType}`
        : `/api/rates/country/${countryCode}`;
      const response = await axios.get(url);
      if (response.data && response.data.data && response.data.data.rate) {
        return response.data.data.rate;
      }
    } catch (error) {
      console.warn('Failed to fetch rate for country:', countryCode, error);
    }
    // Fallback to default rate
    return 0.02;
  }, [detectPhoneType]);


  // Update rate when country or phone number changes
  useEffect(() => {
    const updateRate = async () => {
      // Simple country code mapping
      const countryMappings = {
        'United States': 'US', 'Canada': 'CA', 'United Kingdom': 'GB', 'Moldova': 'MD',
        'Germany': 'DE', 'France': 'FR', 'Australia': 'AU', 'Brazil': 'BR',
        'India': 'IN', 'Japan': 'JP', 'China': 'CN', 'Thailand': 'TH',
        'Malaysia': 'MY', 'Singapore': 'SG', 'Vietnam': 'VN', 'Philippines': 'PH',
        'Indonesia': 'ID', 'South Korea': 'KR', 'Hong Kong': 'HK', 'Russia': 'RU',
        'Mexico': 'MX', 'Italy': 'IT', 'Spain': 'ES', 'Netherlands': 'NL',
        'Sweden': 'SE', 'South Africa': 'ZA', 'Turkey': 'TR', 'Poland': 'PL',
        'Argentina': 'AR', 'Chile': 'CL', 'Colombia': 'CO', 'Peru': 'PE',
        'Ukraine': 'UA', 'Romania': 'RO', 'Czech Republic': 'CZ', 'Hungary': 'HU',
        'Greece': 'GR', 'Portugal': 'PT', 'Belgium': 'BE', 'Austria': 'AT',
        'Switzerland': 'CH', 'Denmark': 'DK', 'Finland': 'FI', 'Norway': 'NO',
        'Israel': 'IL', 'Egypt': 'EG', 'Saudi Arabia': 'SA', 'United Arab Emirates': 'AE'
      };
      
      let mappedCountryCode = 'US'; // Default
      for (const [countryName, code] of Object.entries(countryMappings)) {
        if (selectedCountry.name.includes(countryName)) {
          mappedCountryCode = code;
          break;
        }
      }
      
      const rate = await getRateForCountry(mappedCountryCode, phoneNumber);
      currentRateRef.current = rate;
    };
    
    updateRate();
  }, [selectedCountry, phoneNumber, getRateForCountry]);

  // Save call function
  const persistCall = useCallback(async (forceStatus = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No token, skipping call save');
      return;
    }

    // 从 refs 获取最新值
    const duration = Number(callDurationRef.current) || 0;
    const phoneNumber = lastDialedNumberRef.current || 'unknown';
    const cost = Number(callCostRef.current) || 0;
    const rate = Number(currentRateRef.current) || 0.02;
    
    let status = forceStatus;
    if (!status) {
      status = duration > 0 ? 'completed' : 'failed';
    }

    const requestData = {
      phoneNumber: phoneNumber,
      country: selectedCountry.name || 'Unknown',
      duration: duration,
      cost: cost,
      rate: rate,
      status: status
    };

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 通话记录保存成功:', result);
        
        // Update balance if returned by server
        if (result?.remainingBalance !== undefined) {
          localStorage.setItem('currentBalance', result.remainingBalance.toString());
          setDisplayBalance(result.remainingBalance);
        }
      } else {
        console.error('❌ 保存通话记录失败:', response.statusText);
      }
    } catch (err) {
      console.error('❌ 保存通话记录失败:', err);
    }
  }, [selectedCountry.name]);

  // Tutorial steps
  const tutorialSteps = [
    {
      title: "Enter a phone number",
      description: "Type a phone number you want to call. You can use the dial pad or type directly."
    },
    {
      title: "Choose your country",
      description: "Click on the country flag and code to select the correct country for your call."
    },
    {
      title: "Make your call",
      description: "Press the green call button to start your call. You can end it anytime by pressing the red button."
    }
  ];


  // Call from options - enhanced with labels and statistics
  const callFromOptions = [
    {
      id: 'public',
      icon: <Globe size={16} />,
      title: 'Public number',
      subtitle: 'Default calling option',
      usage: 'Free • Standard rates',
      isDefault: selectedCallFrom === 'public'
    },
    ...userPhoneNumbers.map(number => ({
      id: `number_${number.id}`,
      icon: <Phone size={16} />,
      title: number.phoneNumber,
      subtitle: number.callerIdName || number.type || 'Personal Number',
      usage: `${number.type} • ${number.country || 'US'}`,
      label: number.label || null,
      isUserNumber: true,
      isDefault: selectedCallFrom === `number_${number.id}`,
      // Add usage stats if available
      stats: number.callsThisMonth ? `${number.callsThisMonth} calls this month` : null
    })),
    {
      id: 'custom',
      icon: <MessageSquare size={16} />,
      title: 'Custom caller ID',
      subtitle: 'Set your own caller ID',
      usage: 'Advanced feature',
      comingSoon: true
    },
    {
      id: 'buy',
      icon: <CreditCard size={16} />,
      title: 'Buy phone number',
      subtitle: 'Get a dedicated number',
      usage: 'Starting from $1/month',
      isNew: true
    }
  ];

  // Vanity Number conversion mapping
  const vanityToNumber = {
    'A': '2', 'B': '2', 'C': '2',
    'D': '3', 'E': '3', 'F': '3',
    'G': '4', 'H': '4', 'I': '4',
    'J': '5', 'K': '5', 'L': '5',
    'M': '6', 'N': '6', 'O': '6',
    'P': '7', 'Q': '7', 'R': '7', 'S': '7',
    'T': '8', 'U': '8', 'V': '8',
    'W': '9', 'X': '9', 'Y': '9', 'Z': '9'
  };

  // Convert vanity number (letters) to digits while preserving country codes
  const convertVanityToNumber = (input) => {
    if (!input) return input;
    
    // Find the country code (starts with + and followed by digits)
    const countryCodeMatch = input.match(/^\+\d+/);
    const countryCode = countryCodeMatch ? countryCodeMatch[0] : '';
    const remainingNumber = countryCode ? input.substring(countryCode.length) : input;
    
    // Convert letters to numbers
    const convertedNumber = remainingNumber
      .toUpperCase()
      .split('')
      .map(char => vanityToNumber[char] || char)
      .join('');
    
    return countryCode + convertedNumber;
  };

  // Dialer pad numbers - enhanced for vanity number support
  const dialPadNumbers = [
    { number: '1', letters: '' },
    { number: '2', letters: 'ABC' },
    { number: '3', letters: 'DEF' },
    { number: '4', letters: 'GHI' },
    { number: '5', letters: 'JKL' },
    { number: '6', letters: 'MNO' },
    { number: '7', letters: 'PQRS' },
    { number: '8', letters: 'TUV' },
    { number: '9', letters: 'WXYZ' },
    { number: '*', letters: '' },
    { number: '0', letters: '+' },
    { number: '#', letters: '' }
  ];

  // Get display letters for ABC mode
  const getDisplayLetters = (item) => {
    if (keyboardMode === 'ABC' && item.letters) {
      return item.letters.split('').join(' ');
    }
    return item.letters;
  };

  // Initialize Twilio service - similar to HomePage Dialer
  const initializeTwilio = useCallback(async () => {
    if (!user?.token) {
      console.log('❌ No user token available for Twilio initialization');
      return;
    }
    
    setIsInitializingTwilio(true);
    setLastError(null);
    
    try {
      console.log('🔑 Requesting Twilio token with user:', user?.email || 'unknown');
      
      const tokenResponse = await fetch('/api/twilio/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      console.log('📞 Token response status:', tokenResponse.status);

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        
        console.log('🔄 Calling twilioService.initialize...');
        const result = await twilioService.initialize(tokenData.token);
        console.log('📋 Twilio initialization result:', result);
        
        if (result.success) {
          setTwilioReady(true);
          setVoiceServiceAvailable(true);
          console.log('✅ Twilio initialized successfully - ready for calls');
          
          // Set up call status listener
          twilioService.setCallStatusCallback((status, data) => {
            console.log('Call status changed:', status, data);

            // 处理 token 刷新事件
            if (status === 'token_refreshed') {
              toast.success('Token 已刷新，请重试通话', { autoClose: 3000 });
              return;
            }

            // 处理错误事件
            if (status === 'error') {
              if (data.code === 'TOKEN_EXPIRED') {
                if (data.needsReload) {
                  toast.error('Token 已过期，请刷新页面重新登录', {
                    autoClose: 5000,
                    onClick: () => window.location.reload()
                  });
                } else {
                  toast.error(data.error, { autoClose: 3000 });
                }
                return; // 只对 token 过期错误返回
              } else if (data.code === 'TOKEN_EXPIRED_REFRESHED') {
                toast.warning('Token 已过期并已刷新，请重新发起通话', { autoClose: 3000 });
                return; // 只对 token 刷新错误返回
              } else {
                // 其他错误继续执行原有逻辑，不返回
                toast.error(data.error || 'Call error', { autoClose: 3000 });
              }
            }

            // 在各个状态都确保号码存在
            if (['connecting', 'ringing', 'connected'].includes(status)) {
              if (data.to && !lastDialedNumberRef.current) {
                lastDialedNumberRef.current = data.to;
              }
            }
            
            if (status === 'connecting') {
              setCallStatus('connecting');
            } else if (status === 'ringing') {
              setCallStatus('ringing');
            } else if (status === 'accepted' || status === 'connected') {
              setCallStatus('connected');
              // 再次确保号码已设置
              if (data?.to && !lastDialedNumberRef.current) {
                lastDialedNumberRef.current = data.to;
              }
              
              // 先清理现有计时器
              if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
              }
              
              // Start timer with real-time balance deduction
              callTimerRef.current = setInterval(() => {
                setCallDuration(prev => {
                  const newDuration = prev + 1;
                  // Calculate cost using current rate
                  const currentRateValue = currentRateRef.current || 0.02;
                  const newCost = newDuration * currentRateValue / 60;
                  setCallCost(newCost);
                  
                  // 同步更新 refs
                  callDurationRef.current = newDuration;
                  callCostRef.current = newCost;
                  
                  // Deduct from balance in real-time (every second)
                  const costPerSecond = currentRateValue / 60; // Dynamic rate per minute / 60 seconds
                  const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
                  const newBalance = Math.max(0, currentBalance - costPerSecond);
                  updateBalance(newBalance);
                  localStorage.setItem('currentBalance', newBalance.toString());
                  setDisplayBalance(newBalance); // 立即更新显示余额
                  
                  return newDuration;
                });
              }, 1000);
            } else if (status === 'disconnected') {
              console.log('📞 Call disconnected by remote party - handling cleanup');
              console.log('📞 Call duration:', callDurationRef.current);
              console.log('📞 Call cost:', callCostRef.current);
              console.log('📞 lastDialedNumberRef.current:', lastDialedNumberRef.current);
              
              // 清除计时器
              if (callTimerRef.current) {
                clearInterval(callTimerRef.current);
                callTimerRef.current = null;
              }
              
              // 保存通话记录（如果尚未保存）
              if (!callSavedRef.current && callDurationRef.current > 0) {
                console.log('📝 Saving call record from remote disconnect...');
                persistCall();
                callSavedRef.current = true;
              }
              
              // 重置所有状态（包括来电状态）
              setCallStatus(null);
              setCallDuration(0);
              setCallCost(0.00);
              setIsCallActive(false);
              callDurationRef.current = 0;
              callCostRef.current = 0.00;
              
              // 🔥 关键修复：远程挂断时也要清理来电状态
              setIncomingCallMode(false);
              setIncomingCallData(null);
              setIncomingCallTimer(0);
              
              // 立即清理来电计时器引用
              if (incomingCallTimerRef.current) {
                clearInterval(incomingCallTimerRef.current);
                incomingCallTimerRef.current = null;
              }
              
              // 通话结束后停留在当前页面，不返回原页面
              console.log('📞 Call ended by remote, staying on /phone page');
            }
          });
          
          // Check microphone permission status
          try {
            const permissionStatus = await twilioService.getMicrophonePermissionStatus();
            if (permissionStatus.success) {
              setMicrophonePermission(permissionStatus.status);
            }
          } catch (permError) {
            console.warn('Could not check microphone permission:', permError);
          }
        } else {
          console.error('❌ Failed to initialize Twilio:', result.error);
          setVoiceServiceAvailable(false);
          setLastError(result.error || 'Twilio initialization failed');
        }
      } else {
        const errorData = await tokenResponse.json().catch(() => ({}));
        console.error('❌ Token request failed:', tokenResponse.status, errorData);
        
        if (tokenResponse.status === 401) {
          setLastError('Authentication failed');
        } else if (errorData.errorCode === 'TWILIO_NOT_CONFIGURED') {
          setLastError('Twilio not configured on server');
        } else {
          setLastError(`Token request failed: ${tokenResponse.status}`);
        }
        setVoiceServiceAvailable(false);
      }
    } catch (error) {
      console.error('Error initializing Twilio:', error);
      setLastError(error.message || 'Initialization failed');
      setVoiceServiceAvailable(false);
    } finally {
      setIsInitializingTwilio(false);
    }
  }, [user, balance, updateBalance, persistCall]);

  // Retry initialization function
  const retryInitialization = useCallback(() => {
    console.log('🔄 Retrying Twilio initialization...');
    setInitializationAttempted(false);
    setTwilioReady(false);
    setLastError(null);
    setVoiceServiceAvailable(true);
    setIsInitializingTwilio(false);
    // Short delay before re-initializing
    setTimeout(() => {
      if (user?.token) {
        setInitializationAttempted(true);
        initializeTwilio();
      }
    }, 500);
  }, [user, initializeTwilio]);

  // Check microphone permission
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      if (user) {
        try {
          const permissionStatus = await twilioService.getMicrophonePermissionStatus();
          if (permissionStatus.success) {
            setMicrophonePermission(permissionStatus.status);
            console.log('🎤 Microphone permission status:', permissionStatus.status);
          }
        } catch (error) {
          console.error('Error checking microphone permission:', error);
        }
      }
    };

    checkMicrophonePermission();
  }, [user]);

  // Simplified initialization logic
  useEffect(() => {
    console.log('🔄 PhonePage useEffect - User state:', {
      hasUser: !!user,
      userEmail: user?.email,
      initializationAttempted,
      twilioReady,
      isInitializingTwilio
    });
    
    // Only call when user is logged in and hasn't attempted initialization
    if (user?.token && !initializationAttempted && !isInitializingTwilio) {
      console.log('🚀 Starting Twilio initialization...');
      setInitializationAttempted(true);
      initializeTwilio();
    }

    // If user logs out, reset all state
    if (!user && initializationAttempted) {
      console.log('👤 User logged out - resetting Twilio state');
      setInitializationAttempted(false);
      setTwilioReady(false);
      setVoiceServiceAvailable(true);
      setIsInitializingTwilio(false);
      setLastError(null);
      twilioService.destroy();
    }
  }, [user, initializationAttempted, isInitializingTwilio, twilioReady, initializeTwilio]);

  // Component cleanup - unified cleanup logic
  useEffect(() => {
    return () => {
      // Clear all timers
      if (incomingCallTimerRef.current) {
        clearInterval(incomingCallTimerRef.current);
        incomingCallTimerRef.current = null;
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      
      // Clean up services
      twilioService.destroy();
      
      // Remove WebSocket listeners (if any were added globally)
      webSocketService.off('incoming_call');
      webSocketService.off('incoming_call_timeout');
      webSocketService.off('callEnded');
    };
  }, []);

  useEffect(() => {
    // Tutorial state is now handled in useState initializer
    
    // 设置页面背景色为扁平浅色主题
    document.body.style.background = '#FAFAFA';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.background = '#FAFAFA';
    document.documentElement.style.backgroundAttachment = 'fixed';
    document.documentElement.style.minHeight = '100vh';
    
    // 🔧 修复：在组件初始化时立即设置导航初始化状态（如果没有来电参数）
    const urlParams = new URLSearchParams(window.location.search);
    const hasIncomingCall = urlParams.get('incoming') === 'true';
    if (!hasIncomingCall && !isNavigationInitialized) {
      setIsNavigationInitialized(true);
    }
    
    // 清理函数
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.minHeight = '';
      document.documentElement.style.background = '';
      document.documentElement.style.backgroundAttachment = '';
      document.documentElement.style.minHeight = '';
    };
  }, [isNavigationInitialized]); // 添加缺失的依赖

  // 处理其他URL参数（number和contact）- 独立于countryCode处理
  useEffect(() => {
    const numberParam = searchParams.get('number');
    const contactParam = searchParams.get('contact');
    
    if (numberParam) {
      setPhoneNumber(numberParam);
      
      if (contactParam) {
        setShowTutorial(false);
      }
    }
  }, [searchParams]);

  const handleDialPad = (value) => {
    // If in an active call, send DTMF tone instead of adding to phone number
    if (callStatus === 'connected') {
      console.log('📞 Sending DTMF tone during call:', value);
      try {
        const result = twilioService.sendDTMF(value);
        if (result.success) {
          toast.success(`Sent: ${value}`, { autoClose: 1000 });
        } else {
          toast.error('Failed to send tone');
        }
      } catch (error) {
        console.error('Error sending DTMF:', error);
        toast.error('Failed to send tone');
      }
      return;
    }

    // Normal dialing mode - add to phone number
    if (keyboardMode === 'ABC') {
      // In ABC mode, cycle through letters on each press
      const item = dialPadNumbers.find(item => item.number === value);
      if (item && item.letters) {
        // For now, just add the first letter of each group
        // In a real implementation, you might want to implement T9-style cycling
        const firstLetter = item.letters.charAt(0);
        const newValue = phoneNumber + firstLetter;
        handlePhoneNumberChange(newValue);
      } else {
        const newValue = phoneNumber + value;
        handlePhoneNumberChange(newValue);
      }
    } else {
      // Normal number mode
      const newValue = phoneNumber + value;
      handlePhoneNumberChange(newValue);
    }
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    // 检查是否为紧急号码
    if (isEmergencyNumber(phoneNumber, selectedCountry)) {
      toast.error('Emergency calls are not allowed on this platform for security reasons', {
        autoClose: 5000,
        style: {
          background: '#ef4444',
          color: 'white',
          border: '3px solid #dc2626'
        }
      });
      return;
    }

    // 🔄 重置通话保存标记（新的通话开始）
    callSavedRef.current = false;
    console.log('🔄 Reset callSavedRef for new call');

    if (!user) {
      toast.error('Please login to make calls');
      return;
    }

    if (!balance || balance < 0.20) {
      toast.error('Insufficient balance. Please add credits.');
      return;
    }

    if (!voiceServiceAvailable) {
      toast.info('📞 Voice calling service is currently unavailable. Please try again later.');
      return;
    }

    if (!twilioReady) {
      if (lastError) {
        toast.error(`Calling service error: ${lastError}. Click to retry initialization.`, {
          onClick: retryInitialization,
          autoClose: false
        });
      } else if (isInitializingTwilio) {
        toast.info('Calling service is initializing. Please wait...');
      } else {
        toast.error('Calling service not ready. Click to retry initialization.', {
          onClick: retryInitialization,
          autoClose: false
        });
      }
      return;
    }

    // Convert vanity number to digits before validation
    const convertedNumber = convertVanityToNumber(phoneNumber);
    console.log('📞 Original number:', phoneNumber);
    console.log('📞 Converted number:', convertedNumber);
    
    // Show conversion notification if number contained letters
    if (convertedNumber !== phoneNumber) {
      toast.info(`Converting ${phoneNumber} → ${convertedNumber}`, { autoClose: 2000 });
    }

    // Validate phone number (basic validation)
    const cleanNumber = convertedNumber.replace(/[^\d]/g, '');
    if (cleanNumber.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Check audio context state and try to resume
    const audioContext = twilioService.checkAudioContextState();
    console.log('🎵 Audio context state:', audioContext);
    
    if (audioContext.needsInteraction) {
      console.log('🎵 Resuming audio context due to user interaction...');
      await twilioService.resumeAudioContext();
    }

    // Always request microphone permission for real calls
    console.log('🎤 Current microphone permission:', microphonePermission);
    
    const permissionResult = await twilioService.requestMicrophonePermission();
    
    if (permissionResult.success && permissionResult.granted) {
      setMicrophonePermission('granted');
      console.log('✅ Microphone permission granted for real call');
    } else {
      console.log('❌ Microphone permission denied:', permissionResult);
      // Show permission guide modal
      setShowPermissionModal(true);
      return;
    }
    

    // Format phone number with selected country code (use converted number)
    let formattedNumber = convertedNumber;
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = selectedCountry.code + cleanNumber;
    }

    // 在发起通话前先结束现有通话（如果有）
    if (callStatus) {
      console.log('📞 Ending existing call before starting new one');
      await handleEndCall();
      // 短暂延迟确保完全断开
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 在发起通话前就确保号码已保存
    lastDialedNumberRef.current = formattedNumber;

    try {
      // 🔧 获取用户选择的来电显示号码
      let selectedCallerIdNumber = null;
      if (selectedCallFrom !== 'public') {
        // 从用户购买的号码中找到选择的号码
        const selectedPhoneNumber = userPhoneNumbers.find(num => `number_${num.id}` === selectedCallFrom);
        if (selectedPhoneNumber) {
          selectedCallerIdNumber = selectedPhoneNumber.phoneNumber;
          console.log('📞 Using selected caller ID:', selectedCallerIdNumber);
        }
      } else {
        console.log('📞 Using public/default caller ID');
      }
      
      // Make call using Twilio with selected caller ID
      const result = await twilioService.makeCall(formattedNumber, selectedCallerIdNumber);
      
      if (result.success) {
        setIsCallActive(true);
        setCallStatus('connecting');
        setCallDuration(0);
        setCallCost(0.00);
        callDurationRef.current = 0;
        callCostRef.current = 0.00;
      } else {
        // 失败时也要保存记录
        await persistCall('failed');
        // Check if it's a development mode webhook error
        if (result.error && result.error.includes('ngrok')) {
          toast.error('Development Mode: Voice calling requires ngrok setup. See DEVELOPMENT.md for instructions.', {
            autoClose: 8000
          });
        } else {
          toast.error(`Call failed: ${result.error}`);
        }
      }
    } catch (error) {
      // 异常情况也要保存记录
      await persistCall('failed');
      console.error('Error making call:', error);
      if (error.message && error.message.includes('ngrok')) {
        toast.error('Development Mode: Voice calling requires ngrok setup. See DEVELOPMENT.md for instructions.', {
          autoClose: 8000
        });
      } else {
        toast.error('Failed to make call');
      }
    }
  };


  const handleEndCall = useCallback(async () => {
    console.log('📞 handleEndCall called - immediate disconnect with background save');
    
    // 🔧 修复：批量清理所有来电和通话状态，防止状态冲突
    setIncomingCallMode(false);
    setIncomingCallData(null);
    setIncomingCallTimer(0);
    
    // 立即清理来电计时器引用
    if (incomingCallTimerRef.current) {
      clearInterval(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    
    // 🚀 立即断开 Twilio 连接，给用户即时反馈
    try {
      twilioService.hangupCall();
      console.log('✅ Twilio call disconnected immediately');
    } catch (error) {
      console.error('Error hanging up call:', error);
    }
    
    // 🚀 立即清除计时器
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    // 🚀 立即重置UI状态，给用户即时反馈
    setCallStatus(null);
    setCallDuration(0);
    setCallCost(0.00);
    setIsCallActive(false);
    // 清除 refs
    callDurationRef.current = 0;
    callCostRef.current = 0.00;
    
    // 🔄 手动挂断时保存通话记录（防止重复保存）
    if (!callSavedRef.current) {
      console.log('📝 Saving call record from manual hangup...');
      try {
        await persistCall();
        callSavedRef.current = true; // ✔️ 保存完成后立即标记
        console.log('✅ Call record saved successfully from manual hangup');
      } catch (error) {
        console.error('❌ Failed to save call record from manual hangup:', error);
      }
    } else {
      console.log('📝 Call record already saved, skipping manual save');
    }
    
    // 挂断后停留在当前页面，不返回原页面
    console.log('📞 Call ended, staying on /phone page');
  }, [persistCall]);

  // 🔔 监听WebSocket的callEnded事件
  useEffect(() => {
    if (!user) return;
    
    const handleCallEnded = (data) => {
      console.log('📡 Received callEnded event from WebSocket:', data);
      
      // 检查是否是当前通话
      const currentCall = twilioService.getCallStatus();
      if (currentCall.hasActiveCall && currentCall.callSid === data.callSid) {
        console.log('📞 Current call ended by remote party via WebSocket');
        
        // 调用handleEndCall进行清理
        handleEndCall();
      }
    };
    
    // 🔥 新增：监听来电阶段挂断事件
    const handleIncomingCallEnded = (data) => {
      console.log('📞 Received incoming_call_ended event from WebSocket:', data);
      
      // 检查是否是当前来电
      if (incomingCallMode && incomingCallData && incomingCallData.callSid === data.callSid) {
        console.log('📞 Current incoming call ended by remote party - clearing incoming call UI');
        
        // 立即清理来电状态
        setIncomingCallMode(false);
        setIncomingCallData(null);
        setIncomingCallTimer(0);
        
        // 清理倒计时器
        if (incomingCallTimerRef.current) {
          clearInterval(incomingCallTimerRef.current);
          incomingCallTimerRef.current = null;
        }
        
        // 停止铃声
        webSocketService.stopRingtone();
        
        console.log('✅ Incoming call UI cleared due to remote hangup');
      }
    };
    
    // 监听callEnded事件
    webSocketService.on('callEnded', handleCallEnded);
    
    // 监听incoming_call_ended事件
    webSocketService.on('incoming_call_ended', handleIncomingCallEnded);
    
    // 清理监听器
    return () => {
      webSocketService.off('callEnded', handleCallEnded);
      webSocketService.off('incoming_call_ended', handleIncomingCallEnded);
    };
  }, [user, handleEndCall, incomingCallMode, incomingCallData]);

  // 快速添加联系人功能
  const handleAddContact = useCallback(() => {
    if (!user) {
      toast.error('Please login to add contacts');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number first');
      return;
    }

    // 重置表单并打开模态框
    setNewContact({
      name: '',
      email: '',
      country: selectedCountry.name
    });
    setShowQuickAddModal(true);
  }, [user, phoneNumber, selectedCountry.name]);

  const handleQuickAddInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewContact(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleQuickAddSubmit = useCallback(async () => {
    if (!newContact.name.trim()) {
      toast.error('Contact name is required');
      return;
    }

    setIsAddingContact(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to add contacts');
        setShowQuickAddModal(false);
        return;
      }

      // 格式化电话号码
      const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
      let formattedNumber = phoneNumber;
      if (!formattedNumber.startsWith('+')) {
        formattedNumber = selectedCountry.code + cleanNumber;
      }

      const contactData = {
        name: newContact.name.trim(),
        phone: formattedNumber,
        email: newContact.email.trim() || '',
        country: newContact.country || selectedCountry.name,
        // 添加来源标记，表示这是从PhonePage添加的
        source: 'phone_page'
      };

      // 开发模式下的模拟处理
      if (process.env.NODE_ENV === 'development' && token === 'mock-token') {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('Mock: Adding contact from PhonePage:', contactData);
        
        // 关闭模态框并显示成功消息
        setShowQuickAddModal(false);
        setNewContact({ name: '', email: '', country: '' });
        toast.success(`📞 ${newContact.name} added to contacts!`);
        return;
      }

      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        setShowQuickAddModal(false);
        setNewContact({ name: '', email: '', country: '' });
        toast.success(`📞 ${newContact.name} added to contacts!`);
      } else if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        setShowQuickAddModal(false);
      } else if (response.status === 409) {
        toast.error('This phone number is already in your contacts');
      } else if (response.status >= 500) {
        toast.error('Server error occurred. Please try again.');
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to add contact' }));
        toast.error(error.message || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to add contact. Please try again.');
      }
    } finally {
      setIsAddingContact(false);
    }
  }, [newContact, phoneNumber, selectedCountry]);

  const handleQuickAddCancel = useCallback(() => {
    setShowQuickAddModal(false);
    setNewContact({ name: '', email: '', country: '' });
    setIsAddingContact(false);
  }, []);

  // 🔔 来电处理函数
  const handleIncomingCallAccept = useCallback(async (callData) => {
    console.log('✅ PhonePage: Accepting incoming call', callData);
    
    // 立即清理倒计时器
    if (incomingCallTimerRef.current) {
      clearInterval(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    
    // 防止重复接听
    if (isCallActive || callStatus) {
      console.warn('⚠️ Already has active call, ignoring duplicate accept');
      return;
    }
    
    // 切换到通话状态
    setIncomingCallTimer(0);
    setIncomingCallMode(false);
    setIncomingCallData(null);
    setCallStatus('connecting');
    setIsCallActive(true);
    
    // 🔄 重置通话保存标记（新的来电接听开始）
    callSavedRef.current = false;
    console.log('🔄 Reset callSavedRef for incoming call');
    
    try {
      // 检查Twilio是否已准备好
      if (!twilioReady) {
        toast.error('Voice service not ready. Please try again.');
        return;
      }

      // 检查麦克风权限
      const permissionResult = await twilioService.requestMicrophonePermission();
      if (!permissionResult.success || !permissionResult.granted) {
        toast.error('Microphone permission required to accept calls');
        setShowPermissionModal(true);
        return;
      }

      // 通过WebSocket接受来电
      webSocketService.acceptCall(callData);
      
      // 设置来电号码用于计费和显示
      lastDialedNumberRef.current = callData.fromNumber;
      
      try {
        console.log('🔗 Accepting queued call...');

        // 调用后端API获取队列信息
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('User not authenticated');
        }

        const response = await fetch('/api/incoming-calls/accept-queued-call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            callSid: callData.callSid
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to get call queue info`);
        }

        const responseData = await response.json();
        const { token: newToken, queueName } = responseData;

        if (!queueName) {
          throw new Error('No queue name received from server');
        }

        // 如果有新的 token，先重新初始化 Twilio
        if (newToken) {
          console.log('🔄 Re-initializing Twilio with new token for incoming call');
          const initResult = await twilioService.initialize(newToken);
          if (!initResult.success) {
            throw new Error(`Failed to initialize Twilio: ${initResult.error}`);
          }
        }

        // 使用队列名称接听来电
        const result = await twilioService.acceptQueuedCall(queueName);

        if (result.success) {
          console.log('✅ Connected to call queue');
          toast.success('Call connected!', { autoClose: 3000 });
        } else {
          throw new Error(result.error || 'Failed to connect to queue');
        }

      } catch (error) {
        console.error('❌ Error accepting call:', error);

        // 提供用户友好的错误信息
        let errorMessage = 'Failed to accept call';
        if (error.message.includes('not ready')) {
          errorMessage = 'Voice service not ready. Please refresh and try again.';
        } else if (error.message.includes('authenticated')) {
          errorMessage = 'Please log in again to accept calls.';
        } else if (error.message.includes('queue')) {
          errorMessage = 'Call connection failed. The caller may have hung up.';
        } else if (error.message.includes('Twilio')) {
          errorMessage = 'Voice service error. Please try again.';
        }

        toast.error(errorMessage, { autoClose: 5000 });

        // 重置状态到来电模式，让用户可以重试
        setCallStatus(null);
        setIsCallActive(false);
        setIncomingCallMode(true);
        setIncomingCallData(callData);
        setIncomingCallTimer(15); // 给用户15秒重试时间

        // 重新启动倒计时
        if (incomingCallTimerRef.current) {
          clearInterval(incomingCallTimerRef.current);
        }
        incomingCallTimerRef.current = setInterval(() => {
          setIncomingCallTimer(prev => {
            if (prev <= 1) {
              // 使用 ref 来调用函数和获取数据，避免依赖问题
              const currentData = incomingCallDataRef.current;
              if (currentData && handleIncomingCallDeclineRef.current) {
                setTimeout(() => handleIncomingCallDeclineRef.current(currentData), 0);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error accepting incoming call:', error);
      toast.error('Failed to accept call');
      setIncomingCallMode(false);
      setIncomingCallData(null);
    }
  }, [isCallActive, callStatus, twilioReady, setShowPermissionModal]);

  const handleIncomingCallDecline = useCallback(async (callData) => {
    console.log('❌ PhonePage: Declining incoming call', callData);
    
    // 🔧 修复：使用 startTransition 确保状态更新的优先级
    React.startTransition(() => {
      setIncomingCallMode(false);
      setIncomingCallData(null);
      setIncomingCallTimer(0);
    });
    
    // 立即清理来电计时器引用
    if (incomingCallTimerRef.current) {
      clearInterval(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    
    try {
      // 通过WebSocket拒绝来电
      webSocketService.declineCall(callData);
      
      toast.info('Call declined - sent to voicemail');
      
      // 拒绝后停留在当前页面，不返回原页面
      console.log('📞 Call declined, staying on /phone page');
      
    } catch (error) {
      console.error('❌ Error declining incoming call:', error);
      toast.error('Failed to decline call');
      setIncomingCallMode(false);
      setIncomingCallData(null);
    }
  }, []);

  // 将函数存储到 ref 中以避免循环依赖
  handleIncomingCallDeclineRef.current = handleIncomingCallDecline;

  // 同步 incomingCallData 到 ref
  useEffect(() => {
    incomingCallDataRef.current = incomingCallData;
  }, [incomingCallData]);

  // 来电倒计时处理 - 优化：稳定的计时器管理，避免重复创建
  useEffect(() => {
    // 清理上一次 timer
    if (incomingCallTimerRef.current) {
      clearInterval(incomingCallTimerRef.current);
      incomingCallTimerRef.current = null;
    }
    
    // 只有在来电模式且初始倒计时>0时启动，确保状态稳定
    if (incomingCallMode && incomingCallTimer > 0 && isNavigationInitialized) {
      incomingCallTimerRef.current = window.setInterval(() => {
        setIncomingCallTimer(prev => {
          if (prev <= 1) {
            // 使用 ref 来调用函数和获取数据，避免依赖问题
            const currentData = incomingCallDataRef.current;
            if (currentData && handleIncomingCallDeclineRef.current) {
              setTimeout(() => handleIncomingCallDeclineRef.current(currentData), 0);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (incomingCallTimerRef.current) {
        clearInterval(incomingCallTimerRef.current);
        incomingCallTimerRef.current = null;
      }
    };
  }, [incomingCallMode, isNavigationInitialized, incomingCallTimer]); // 移除 incomingCallData 依赖

  // Enhanced phone number management handlers


  const handleCallFromSelect = (optionId) => {
    if (optionId === 'buy') {
      // Navigate to phone number management
      window.location.href = '/phone-numbers';
    } else if (optionId === 'custom') {
      toast.info('Custom caller ID feature coming soon...');
    } else {
      setSelectedCallFrom(optionId);
    }
    setShowCallFromDropdown(false);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('phoneTutorialCompleted', 'true');
  };

  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      // Last step - complete tutorial
      closeTutorial();
    }
  };

  const handlePermissionGranted = () => {
    setMicrophonePermission('granted');
    setShowPermissionModal(false);
    toast.success('🎤 Microphone permission granted! You can now make calls.');
  };

  const handlePermissionDenied = (error) => {
    setMicrophonePermission('denied');
    console.error('Microphone permission denied:', error);
    toast.error('Microphone permission is required for voice calls');
  };

  // 检查是否应该显示添加联系人按钮
  const shouldShowAddContact = phoneNumber.trim().length > 0 && user;
  const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
  const isValidNumber = cleanPhoneNumber.length >= 7;

  // 优化：简化条件检查，避免频繁重渲染和状态冲突
  const isIncomingCallActive = (
    isNavigationInitialized && // 确保导航已完成初始化
    incomingCallMode &&
    !!incomingCallData &&
    !!incomingCallData.fromNumber && // 确保有来电号码
    !isCallActive &&
    !callStatus &&
    incomingCallTimer > 0
    // 移除 isProcessingUrlParams 条件，避免状态冲突
  );

  return (
    <PhonePageContainer>
      <PageContent>
        {/* Tutorial Card */}
        {showTutorial && (
          <TutorialCard>
            <TutorialBadge>
              <Info size={14} />
              Tutorial
            </TutorialBadge>
            <TutorialTitle>{tutorialSteps[tutorialStep].title}</TutorialTitle>
            <TutorialDescription>
              {tutorialSteps[tutorialStep].description}
            </TutorialDescription>
            <TutorialActions>
              {tutorialStep < tutorialSteps.length - 1 ? (
                <TutorialButton primary onClick={handleTutorialNext}>
                  Next <ArrowRight size={14} />
                </TutorialButton>
              ) : (
                <TutorialButton primary onClick={closeTutorial}>
                  Finish <CheckCircle size={14} />
                </TutorialButton>
              )}
              <SkipButton onClick={closeTutorial}>
                Skip tutorial
              </SkipButton>
            </TutorialActions>
          </TutorialCard>
        )}

        {/* 🔔 来电模式 UI - 替换拨号界面 */}
        {isIncomingCallActive ? (
          <IncomingCallContainer>
            <IncomingCallStatus>
              <Phone size={16} />
              Incoming Call
            </IncomingCallStatus>
            
            <IncomingCallNumber>
              {incomingCallData.fromNumber}
            </IncomingCallNumber>
            
            <IncomingCallDetails>
              <span>Unknown Caller</span>
              <span>To: {incomingCallData.toNumber}</span>
            </IncomingCallDetails>
            
            <IncomingCallTimer>
              <div>⏰ Auto-reject in {incomingCallTimer}s</div>
            </IncomingCallTimer>
            
            <IncomingCallActions>
              <IncomingCallButton 
                decline 
                onClick={() => handleIncomingCallDecline(incomingCallData)}
                title="拒绝通话"
              >
                <X size={24} />
              </IncomingCallButton>
              
              <IncomingCallButton 
                accept 
                onClick={() => handleIncomingCallAccept(incomingCallData)}
                title="接听通话"
              >
                <Phone size={24} />
              </IncomingCallButton>
            </IncomingCallActions>
          </IncomingCallContainer>
        ) : (
          /* 正常拨号界面 - 只有非来电模式时才显示 */
          <DialerContainer>
          {/* Balance and Status */}
          <StatusSection>
            <BalanceDisplay>
              Balance: ${displayBalance.toFixed(5)}
            </BalanceDisplay>
          </StatusSection>

          {/* Call Status Display - Inline Status */}
          {callStatus && (
            <CallStatusDisplay>
              <div className="status-info">
                <div className="status-text">
                  {callStatus === 'connecting' && '📞 Connecting call...'}
                  {callStatus === 'ringing' && '📞 Ringing...'}
                  {callStatus === 'connected' && '📞 Connected'}
                </div>
                <div className="call-details">
                  <span>Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}</span>
                  <span>Cost: ${callCost.toFixed(3)}</span>
                  <span>To: {selectedCountry.code + phoneNumber}</span>
                </div>
              </div>
              <button className="end-call-btn" onClick={handleEndCall}>
                End Call
              </button>
            </CallStatusDisplay>
          )}

          {/* Call From Section */}
          <CallFromSection>
            <CallFromHeader>
              <CallFromLabel>Call from:</CallFromLabel>
            </CallFromHeader>
            
            <CallFromSelector>
              <CallFromButton 
                onClick={() => setShowCallFromDropdown(!showCallFromDropdown)}
              >
                <CallFromOption>
                  {callFromOptions.find(opt => opt.id === selectedCallFrom)?.icon}
                  <span>{callFromOptions.find(opt => opt.id === selectedCallFrom)?.title}</span>
                </CallFromOption>
                <ChevronDown size={16} />
              </CallFromButton>
              
              {showCallFromDropdown && (
                <CallFromDropdown>
                  {callFromOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
                      onClick={() => option.comingSoon ? null : handleCallFromSelect(option.id)}
                      $isDefault={option.isDefault}
                      $comingSoon={option.comingSoon}
                    >
                      <OptionIcon>{option.icon}</OptionIcon>
                      <OptionDetails>
                        <OptionTitle>
                          {option.title}
                          {option.label && <OptionLabel>{option.label}</OptionLabel>}
                        </OptionTitle>
                        <OptionSubtitle>{option.subtitle}</OptionSubtitle>
                        {option.usage && <OptionUsage>{option.usage}</OptionUsage>}
                        {option.stats && <OptionUsage>{option.stats}</OptionUsage>}
                      </OptionDetails>
                      {option.isNew && <NewBadge>NEW</NewBadge>}
                      {option.comingSoon && <ComingSoonBadge>Soon</ComingSoonBadge>}
                    </DropdownOption>
                  ))}
                </CallFromDropdown>
              )}
            </CallFromSelector>
          </CallFromSection>

          {/* Phone Input */}
          <PhoneInputSection>
            {/* Emergency Warning Display */}
            {emergencyWarning && (
              <EmergencyWarning>
                <EmergencyIcon>
                  <span className="emergency-icon">🚨</span>
                </EmergencyIcon>
                <EmergencyTitle>Emergency Number Detected</EmergencyTitle>
                <EmergencyMessage>
                  Emergency calls are not allowed on this platform for security reasons. 
                  Please use your device's native dialer for emergency services.
                </EmergencyMessage>
              </EmergencyWarning>
            )}

            <PhoneInput>
              <CountryFlag onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
                {selectedCountry.flag} {selectedCountry.code}
              </CountryFlag>
              <NumberInput
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  handlePhoneNumberChange(e.target.value);
                }}
                onPaste={(e) => {
                  // 处理粘贴事件，自动过滤符号
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData('text');
                  handlePhoneNumberChange(phoneNumber + pastedText);
                }}
                placeholder="Enter phone number"
              />
              <AddContactAction 
                $hasNumber={shouldShowAddContact}
                $isLoggedIn={!!user}
                onClick={handleAddContact}
                title={
                  !user ? 'Please login to add contacts' :
                  !phoneNumber.trim() ? 'Enter a phone number to add contact' :
                  !isValidNumber ? 'Enter a valid phone number' :
                  'Add this number to contacts'
                }
              >
                <UserPlus size={18} />
              </AddContactAction>
              
              {showCountryDropdown && (
                <CountryDropdown>
                  {COUNTRY_OPTIONS.map((country, index) => (
                    <CountryOption
                      key={index}
                      onClick={() => handleCountrySelect(country)}
                    >
                      <CountryInfo>
                        {country.flag} {country.code}
                      </CountryInfo>
                      <CountryName>{country.name}</CountryName>
                    </CountryOption>
                  ))}
                </CountryDropdown>
              )}
            </PhoneInput>
          </PhoneInputSection>

          {/* Dialer Pad */}
          <DialPad>
            {dialPadNumbers.map((item, index) => (
              <DialButton
                key={index}
                $keyboardMode={keyboardMode}
                onClick={() => handleDialPad(item.number)}
              >
                <div>{item.number}</div>
                {item.letters && (
                  <div className="letters">
                    {keyboardMode === 'ABC' ? getDisplayLetters(item) : item.letters}
                  </div>
                )}
              </DialButton>
            ))}
          </DialPad>

          {/* Action Buttons */}
          <ActionButtons>
            <ToggleButton onClick={() => setKeyboardMode(prev => prev === '123' ? 'ABC' : '123')}>
              {keyboardMode === '123' ? 'ABC' : '123'}
            </ToggleButton>
            
            <CallButton 
              onClick={isCallActive ? handleEndCall : handleCall}
              disabled={!phoneNumber.trim() || (!balance || balance < 0.20) || emergencyWarning}
            >
              <Phone />
            </CallButton>
            
            {phoneNumber.trim() && (
              <DeleteButton onClick={handleDelete}>
                <Delete />
              </DeleteButton>
            )}
            {!phoneNumber.trim() && <div></div>}
          </ActionButtons>
        </DialerContainer>
        )}
      </PageContent>

      {/* Microphone Permission Modal */}
      <MicrophonePermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        permissionStatus={microphonePermission}
      />

      {/* Quick Add Contact Modal */}
      {showQuickAddModal && (
        <QuickAddModal onClick={handleQuickAddCancel}>
          <QuickAddContent onClick={(e) => e.stopPropagation()}>
            <QuickAddHeader>
              <QuickAddTitle>
                <UserPlus />
                Add Contact
              </QuickAddTitle>
              <CloseButton onClick={handleQuickAddCancel}>
                <X />
              </CloseButton>
            </QuickAddHeader>

            <QuickFormGroup>
              <QuickLabel>Phone Number</QuickLabel>
              <PrefilledNumber>
                <Phone />
                {selectedCountry.code} {phoneNumber}
              </PrefilledNumber>
            </QuickFormGroup>

            <QuickFormGroup>
              <QuickLabel htmlFor="contact-name">Name *</QuickLabel>
              <QuickInput
                id="contact-name"
                name="name"
                type="text"
                placeholder="Enter contact name"
                value={newContact.name}
                onChange={handleQuickAddInputChange}
                disabled={isAddingContact}
                autoFocus
              />
            </QuickFormGroup>

            <QuickFormGroup>
              <QuickLabel htmlFor="contact-email">Email (optional)</QuickLabel>
              <QuickInput
                id="contact-email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={newContact.email}
                onChange={handleQuickAddInputChange}
                disabled={isAddingContact}
              />
            </QuickFormGroup>

            <QuickFormGroup>
              <QuickLabel htmlFor="contact-country">Country</QuickLabel>
              <QuickInput
                id="contact-country"
                name="country"
                type="text"
                placeholder="Enter country"
                value={newContact.country}
                onChange={handleQuickAddInputChange}
                disabled={isAddingContact}
              />
            </QuickFormGroup>

            <QuickButtonGroup>
              <QuickButton 
                onClick={handleQuickAddCancel}
                disabled={isAddingContact}
              >
                Cancel
              </QuickButton>
              <QuickButton 
                $primary
                onClick={handleQuickAddSubmit}
                disabled={isAddingContact || !newContact.name.trim()}
              >
                {isAddingContact ? 'Adding...' : 'Add Contact'}
              </QuickButton>
            </QuickButtonGroup>
          </QuickAddContent>
        </QuickAddModal>
      )}
    </PhonePageContainer>
  );
}

export default PhonePage; 