import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Phone, Delete, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import twilioService from '../services/twilioService';
import MicrophonePermissionModal from './MicrophonePermissionModal';
import { toast } from 'react-toastify';
import { queryClient } from '../App';
import axios from 'axios';

const DialerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  max-width: 520px;
  background: rgba(26, 35, 50, 0.8);
  backdrop-filter: blur(20px);
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    max-width: 380px;
    padding: 1.5rem;
    gap: 1rem;
  }

  @media (max-width: 480px) {
    max-width: 350px;
    padding: 1.25rem;
    gap: 0.9rem;
  }
`;

const BalanceDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.75rem 1.25rem;
`;

const BalanceLabel = styled.span`
  color: #9ca3af;
  font-size: 0.9rem;
`;

const BalanceAmount = styled.span`
  color: #FFC900;
  font-size: 1.2rem;
  font-weight: 700;
`;


const CallStatusDisplay = styled.div`
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.25rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(10px);
  box-shadow: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 0; /* Allow content to shrink */

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: #FFC900;
    background-size: 100% 100%;
    animation: none;
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
    min-width: 0; /* Allow content to shrink */
    margin-right: 1rem; /* Add space between status info and button */
  }
  
  .status-text {
    color: #FFC900;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
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
    color: #cbd5e0;
    font-size: 0.875rem;
    display: flex;
    gap: 1rem;
    font-weight: 500;
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
    background: #0a0f2f;
    border: 3px solid #000;
    border-radius: 0;
    color: #ef4444;
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: none;
    min-width: 100px;
    flex-shrink: 0; /* Prevent button from shrinking */
    
    &:hover {
      background: #666;
      transform: translateY(-1px);
      box-shadow: none;
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* Mobile responsive design */
  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .status-info {
      text-align: center;
      gap: 0.75rem;
      margin-right: 0; /* Reset margin for mobile */
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
        max-width: none; /* Remove max-width restriction on mobile */
        white-space: normal; /* Allow wrapping on mobile */
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

  /* Extra small screens */
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

const ServiceBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #ef4444;
  font-size: 0.85rem;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.8rem;
    padding: 0.65rem 0.9rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.6rem 0.8rem;
  }
`;

const CountrySelectDropdown = styled.select`
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem; /* Add right padding for arrow space */
  background: rgba(17, 24, 39, 0.8);
  border: 3px solid #000;
  border-radius: 0;
  color: #FFC900;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  appearance: none; /* Remove default arrow */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFC900' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center; /* Position arrow with proper spacing */
  background-size: 16px 16px;

  &:hover {
    border-color: #FFC900;
    background-color: rgba(17, 24, 39, 0.9);
  }

  &:focus {
    border-color: #FFC900;
    box-shadow: none;
  }

  option {
    background: #1a2332;
    color: #ffffff;
    padding: 0.5rem;
  }

  @media (max-width: 768px) {
    font-size: 0.9rem;
    padding: 0.65rem 2.25rem 0.65rem 0.65rem;
    background-position: right 0.65rem center;
    background-size: 14px 14px;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 0.6rem 2rem 0.6rem 0.6rem;
    background-position: right 0.6rem center;
    background-size: 12px 12px;
  }
`;

const PhoneInput = styled.div`
  display: flex;
  align-items: center;
  background: rgba(17, 24, 39, 0.8);
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.9rem 1.1rem;
  font-size: 1.3rem;
  color: #ffffff;
  min-height: 55px;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: #FFC900;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1rem;
    font-size: 1.2rem;
    min-height: 50px;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.9rem;
    font-size: 1.1rem;
    min-height: 48px;
  }
`;

const CountryCode = styled.span`
  color: #FFC900;
  margin-right: 0.5rem;
  font-weight: 600;
`;

const NumberDisplay = styled.input`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.3rem;
  flex: 1;
  outline: none;
  font-weight: 500;
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;

  &::placeholder {
    color: #6b7280;
    font-weight: 400;
  }

  &:focus {
    cursor: text;
  }

  /* 确保在移动设备上也能选择文本 */
  &::-webkit-input-placeholder {
    color: #6b7280;
    font-weight: 400;
  }

  &::-moz-placeholder {
    color: #6b7280;
    font-weight: 400;
  }

  &:-ms-input-placeholder {
    color: #6b7280;
    font-weight: 400;
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const AddContactButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${props => props.$hasNumber && props.$isLoggedIn ? 
    '#fff' : '#666'};
  border: 3px solid ${props => props.$hasNumber && props.$isLoggedIn ? 
    '#000' : '#666'};
  border-radius: 0;
  color: ${props => props.$hasNumber && props.$isLoggedIn ? '#FFC900' : '#6b7280'};
  padding: 0.6rem 0.9rem;
  cursor: ${props => props.$hasNumber && props.$isLoggedIn ? 'pointer' : 'not-allowed'};
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s ease;
  min-height: 42px;
  flex-shrink: 0;
  opacity: ${props => props.$hasNumber && props.$isLoggedIn ? 1 : 0.6};

  &:hover {
    background: ${props => props.$hasNumber && props.$isLoggedIn ? 
      '#FFC900' : '#666'};
    transform: ${props => props.$hasNumber && props.$isLoggedIn ? 'translateY(-1px)' : 'none'};
  }

  svg {
    width: 16px;
    height: 16px;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.7rem;
    min-height: 38px;
    font-size: 0.8rem;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
  
  @media (max-width: 480px) {
    padding: 0.4rem 0.6rem;
    min-height: 36px;
    font-size: 0.75rem;
    border-radius: 0.5rem;
    
    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

// Quick add contact modal styles
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
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(20px);
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: none;
`;

const QuickAddHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const QuickAddTitle = styled.h3`
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #FFC900;
    width: 18px;
    height: 18px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;

  &:hover {
    background: #FFC900;
    color: #000;
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
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.4rem;
`;

const QuickInput = styled.input`
  width: 100%;
  background: rgba(55, 65, 81, 0.5);
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.65rem;
  color: #ffffff;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #FFC900;
    box-shadow: none;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background: rgba(55, 65, 81, 0.3);
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const PrefilledNumber = styled.div`
  background: #fff;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.65rem;
  color: #FFC900;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 14px;
    height: 14px;
    color: #FFC900;
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
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 80px;

  ${props => props.$primary ? `
    background: #FFC900;
    color: #000;
    
    &:hover {
      background: #0a0f2f;
      transform: translateY(-1px);
    }

    &:disabled {
      background: #666;
      cursor: not-allowed;
      transform: none;
    }
  ` : `
    background: rgba(55, 65, 81, 0.5);
    color: #9ca3af;
    border: 3px solid #000;
    
    &:hover {
      background: #FFC900;
      color: #000;
    }
  `}
`;

const DialPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 0.8rem 0;
  justify-items: center;

  @media (max-width: 768px) {
    gap: 0.9rem;
  }

  @media (max-width: 480px) {
    gap: 0.8rem;
  }
`;

const DialButton = styled.button`
  width: 75px;
  height: 75px;
  border-radius: 50%;
  background: rgba(17, 24, 39, 0.9);
  border: 3px solid #000;
  color: #ffffff;
  font-size: 1.6rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: none;

  &:hover {
    background: #FFC900;
    border-color: #FFC900;
    transform: scale(1.05);
    box-shadow: none;
  }

  &:active {
    transform: scale(0.95);
  }

  .letters {
    font-size: 0.65rem;
    color: #9ca3af;
    margin-top: -2px;
    font-weight: 400;
    letter-spacing: 0.3px;
  }

  @media (max-width: 768px) {
    width: 68px;
    height: 68px;
    font-size: 1.4rem;

    .letters {
      font-size: 0.6rem;
    }
  }

  @media (max-width: 480px) {
    width: 62px;
    height: 62px;
    font-size: 1.3rem;

    .letters {
      font-size: 0.55rem;
    }
  }
`;

const DeleteButton = styled.button`
  width: 55px;
  height: 55px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
`;

const CallButton = styled.button`
  flex: 1;
  height: 55px;
  border-radius: 0;
  background: #FFC900;
  border: 3px solid #000;
  color: #000;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: none;
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

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
  { number: '#', letters: '' },
];

// Complete country list - 247 countries in alphabetical order
const countries = [
  { code: '+93', name: 'Afghanistan', flag: '🇦🇫', country: 'AF' },
  { code: '+358', name: 'Åland Islands', flag: '🇦🇽', country: 'AX' },
  { code: '+355', name: 'Albania', flag: '🇦🇱', country: 'AL' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿', country: 'DZ' },
  { code: '+1684', name: 'American Samoa', flag: '🇦🇸', country: 'AS' },
  { code: '+376', name: 'Andorra', flag: '🇦🇩', country: 'AD' },
  { code: '+244', name: 'Angola', flag: '🇦🇴', country: 'AO' },
  { code: '+1264', name: 'Anguilla', flag: '🇦🇮', country: 'AI' },
  { code: '+672', name: 'Antarctica', flag: '🇦🇶', country: 'AQ' },
  { code: '+1268', name: 'Antigua and Barbuda', flag: '🇦🇬', country: 'AG' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷', country: 'AR' },
  { code: '+374', name: 'Armenia', flag: '🇦🇲', country: 'AM' },
  { code: '+297', name: 'Aruba', flag: '🇦🇼', country: 'AW' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', country: 'AU' },
  { code: '+43', name: 'Austria', flag: '🇦🇹', country: 'AT' },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿', country: 'AZ' },
  { code: '+1242', name: 'Bahamas', flag: '🇧🇸', country: 'BS' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', country: 'BH' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', country: 'BD' },
  { code: '+1246', name: 'Barbados', flag: '🇧🇧', country: 'BB' },
  { code: '+375', name: 'Belarus', flag: '🇧🇾', country: 'BY' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪', country: 'BE' },
  { code: '+501', name: 'Belize', flag: '🇧🇿', country: 'BZ' },
  { code: '+229', name: 'Benin', flag: '🇧🇯', country: 'BJ' },
  { code: '+1441', name: 'Bermuda', flag: '🇧🇲', country: 'BM' },
  { code: '+975', name: 'Bhutan', flag: '🇧🇹', country: 'BT' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴', country: 'BO' },
  { code: '+387', name: 'Bosnia and Herzegovina', flag: '🇧🇦', country: 'BA' },
  { code: '+267', name: 'Botswana', flag: '🇧🇼', country: 'BW' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', country: 'BR' },
  { code: '+246', name: 'British Indian Ocean Territory', flag: '🇮🇴', country: 'IO' },
  { code: '+1284', name: 'British Virgin Islands', flag: '🇻🇬', country: 'VG' },
  { code: '+673', name: 'Brunei', flag: '🇧🇳', country: 'BN' },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬', country: 'BG' },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫', country: 'BF' },
  { code: '+257', name: 'Burundi', flag: '🇧🇮', country: 'BI' },
  { code: '+855', name: 'Cambodia', flag: '🇰🇭', country: 'KH' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲', country: 'CM' },
  { code: '+1', name: 'Canada', flag: '🇨🇦', country: 'CA' },
  { code: '+238', name: 'Cape Verde', flag: '🇨🇻', country: 'CV' },
  { code: '+599', name: 'Caribbean Netherlands', flag: '🇧🇶', country: 'BQ' },
  { code: '+1345', name: 'Cayman Islands', flag: '🇰🇾', country: 'KY' },
  { code: '+236', name: 'Central African Republic', flag: '🇨🇫', country: 'CF' },
  { code: '+235', name: 'Chad', flag: '🇹🇩', country: 'TD' },
  { code: '+56', name: 'Chile', flag: '🇨🇱', country: 'CL' },
  { code: '+61', name: 'Christmas Island', flag: '🇨🇽', country: 'CX' },
  { code: '+61', name: 'Cocos Islands', flag: '🇨🇨', country: 'CC' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴', country: 'CO' },
  { code: '+269', name: 'Comoros', flag: '🇰🇲', country: 'KM' },
  { code: '+682', name: 'Cook Islands', flag: '🇨🇰', country: 'CK' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷', country: 'CR' },
  { code: '+225', name: 'Côte d\'Ivoire', flag: '🇨🇮', country: 'CI' },
  { code: '+385', name: 'Croatia', flag: '🇭🇷', country: 'HR' },
  { code: '+53', name: 'Cuba', flag: '🇨🇺', country: 'CU' },
  { code: '+599', name: 'Curaçao', flag: '🇨🇼', country: 'CW' },
  { code: '+357', name: 'Cyprus', flag: '🇨🇾', country: 'CY' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿', country: 'CZ' },
  { code: '+243', name: 'Democratic Republic of the Congo', flag: '🇨🇩', country: 'CD' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰', country: 'DK' },
  { code: '+253', name: 'Djibouti', flag: '🇩🇯', country: 'DJ' },
  { code: '+1767', name: 'Dominica', flag: '🇩🇲', country: 'DM' },
  { code: '+1809', name: 'Dominican Republic', flag: '🇩🇴', country: 'DO' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨', country: 'EC' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', country: 'EG' },
  { code: '+503', name: 'El Salvador', flag: '🇸🇻', country: 'SV' },
  { code: '+240', name: 'Equatorial Guinea', flag: '🇬🇶', country: 'GQ' },
  { code: '+291', name: 'Eritrea', flag: '🇪🇷', country: 'ER' },
  { code: '+372', name: 'Estonia', flag: '🇪🇪', country: 'EE' },
  { code: '+268', name: 'Eswatini', flag: '🇸🇿', country: 'SZ' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹', country: 'ET' },
  { code: '+500', name: 'Falkland Islands', flag: '🇫🇰', country: 'FK' },
  { code: '+298', name: 'Faroe Islands', flag: '🇫🇴', country: 'FO' },
  { code: '+679', name: 'Fiji', flag: '🇫🇯', country: 'FJ' },
  { code: '+358', name: 'Finland', flag: '🇫🇮', country: 'FI' },
  { code: '+33', name: 'France', flag: '🇫🇷', country: 'FR' },
  { code: '+594', name: 'French Guiana', flag: '🇬🇫', country: 'GF' },
  { code: '+689', name: 'French Polynesia', flag: '🇵🇫', country: 'PF' },
  { code: '+262', name: 'French Southern Territories', flag: '🇹🇫', country: 'TF' },
  { code: '+241', name: 'Gabon', flag: '🇬🇦', country: 'GA' },
  { code: '+220', name: 'Gambia', flag: '🇬🇲', country: 'GM' },
  { code: '+995', name: 'Georgia', flag: '🇬🇪', country: 'GE' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', country: 'DE' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭', country: 'GH' },
  { code: '+350', name: 'Gibraltar', flag: '🇬🇮', country: 'GI' },
  { code: '+30', name: 'Greece', flag: '🇬🇷', country: 'GR' },
  { code: '+299', name: 'Greenland', flag: '🇬🇱', country: 'GL' },
  { code: '+1473', name: 'Grenada', flag: '🇬🇩', country: 'GD' },
  { code: '+590', name: 'Guadeloupe', flag: '🇬🇵', country: 'GP' },
  { code: '+1671', name: 'Guam', flag: '🇬🇺', country: 'GU' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹', country: 'GT' },
  { code: '+44', name: 'Guernsey', flag: '🇬🇬', country: 'GG' },
  { code: '+224', name: 'Guinea', flag: '🇬🇳', country: 'GN' },
  { code: '+245', name: 'Guinea-Bissau', flag: '🇬🇼', country: 'GW' },
  { code: '+592', name: 'Guyana', flag: '🇬🇾', country: 'GY' },
  { code: '+509', name: 'Haiti', flag: '🇭🇹', country: 'HT' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳', country: 'HN' },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰', country: 'HK' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺', country: 'HU' },
  { code: '+354', name: 'Iceland', flag: '🇮🇸', country: 'IS' },
  { code: '+91', name: 'India', flag: '🇮🇳', country: 'IN' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', country: 'ID' },
  { code: '+98', name: 'Iran', flag: '🇮🇷', country: 'IR' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶', country: 'IQ' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪', country: 'IE' },
  { code: '+44', name: 'Isle of Man', flag: '🇮🇲', country: 'IM' },
  { code: '+972', name: 'Israel', flag: '🇮🇱', country: 'IL' },
  { code: '+39', name: 'Italy', flag: '🇮🇹', country: 'IT' },
  { code: '+1876', name: 'Jamaica', flag: '🇯🇲', country: 'JM' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', country: 'JP' },
  { code: '+44', name: 'Jersey', flag: '🇯🇪', country: 'JE' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴', country: 'JO' },
  { code: '+7', name: 'Kazakhstan', flag: '🇰🇿', country: 'KZ' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', country: 'KE' },
  { code: '+686', name: 'Kiribati', flag: '🇰🇮', country: 'KI' },
  { code: '+383', name: 'Kosovo', flag: '🇽🇰', country: 'XK' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', country: 'KW' },
  { code: '+996', name: 'Kyrgyzstan', flag: '🇰🇬', country: 'KG' },
  { code: '+856', name: 'Laos', flag: '🇱🇦', country: 'LA' },
  { code: '+371', name: 'Latvia', flag: '🇱🇻', country: 'LV' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧', country: 'LB' },
  { code: '+266', name: 'Lesotho', flag: '🇱🇸', country: 'LS' },
  { code: '+231', name: 'Liberia', flag: '🇱🇷', country: 'LR' },
  { code: '+218', name: 'Libya', flag: '🇱🇾', country: 'LY' },
  { code: '+423', name: 'Liechtenstein', flag: '🇱🇮', country: 'LI' },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹', country: 'LT' },
  { code: '+352', name: 'Luxembourg', flag: '🇱🇺', country: 'LU' },
  { code: '+853', name: 'Macau', flag: '🇲🇴', country: 'MO' },
  { code: '+261', name: 'Madagascar', flag: '🇲🇬', country: 'MG' },
  { code: '+265', name: 'Malawi', flag: '🇲🇼', country: 'MW' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', country: 'MY' },
  { code: '+960', name: 'Maldives', flag: '🇲🇻', country: 'MV' },
  { code: '+223', name: 'Mali', flag: '🇲🇱', country: 'ML' },
  { code: '+356', name: 'Malta', flag: '🇲🇹', country: 'MT' },
  { code: '+692', name: 'Marshall Islands', flag: '🇲🇭', country: 'MH' },
  { code: '+596', name: 'Martinique', flag: '🇲🇶', country: 'MQ' },
  { code: '+222', name: 'Mauritania', flag: '🇲🇷', country: 'MR' },
  { code: '+230', name: 'Mauritius', flag: '🇲🇺', country: 'MU' },
  { code: '+262', name: 'Mayotte', flag: '🇾🇹', country: 'YT' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', country: 'MX' },
  { code: '+691', name: 'Micronesia', flag: '🇫🇲', country: 'FM' },
  { code: '+373', name: 'Moldova', flag: '🇲🇩', country: 'MD' },
  { code: '+377', name: 'Monaco', flag: '🇲🇨', country: 'MC' },
  { code: '+976', name: 'Mongolia', flag: '🇲🇳', country: 'MN' },
  { code: '+382', name: 'Montenegro', flag: '🇲🇪', country: 'ME' },
  { code: '+1664', name: 'Montserrat', flag: '🇲🇸', country: 'MS' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦', country: 'MA' },
  { code: '+258', name: 'Mozambique', flag: '🇲🇿', country: 'MZ' },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲', country: 'MM' },
  { code: '+264', name: 'Namibia', flag: '🇳🇦', country: 'NA' },
  { code: '+674', name: 'Nauru', flag: '🇳🇷', country: 'NR' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', country: 'NP' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', country: 'NL' },
  { code: '+687', name: 'New Caledonia', flag: '🇳🇨', country: 'NC' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', country: 'NZ' },
  { code: '+505', name: 'Nicaragua', flag: '🇳🇮', country: 'NI' },
  { code: '+227', name: 'Niger', flag: '🇳🇪', country: 'NE' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', country: 'NG' },
  { code: '+683', name: 'Niue', flag: '🇳🇺', country: 'NU' },
  { code: '+672', name: 'Norfolk Island', flag: '🇳🇫', country: 'NF' },
  { code: '+850', name: 'North Korea', flag: '🇰🇵', country: 'KP' },
  { code: '+389', name: 'North Macedonia', flag: '🇲🇰', country: 'MK' },
  { code: '+1670', name: 'Northern Mariana Islands', flag: '🇲🇵', country: 'MP' },
  { code: '+47', name: 'Norway', flag: '🇳🇴', country: 'NO' },
  { code: '+968', name: 'Oman', flag: '🇴🇲', country: 'OM' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', country: 'PK' },
  { code: '+680', name: 'Palau', flag: '🇵🇼', country: 'PW' },
  { code: '+970', name: 'Palestine', flag: '🇵🇸', country: 'PS' },
  { code: '+507', name: 'Panama', flag: '🇵🇦', country: 'PA' },
  { code: '+675', name: 'Papua New Guinea', flag: '🇵🇬', country: 'PG' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾', country: 'PY' },
  { code: '+51', name: 'Peru', flag: '🇵🇪', country: 'PE' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', country: 'PH' },
  { code: '+872', name: 'Pitcairn Islands', flag: '🇵🇳', country: 'PN' },
  { code: '+48', name: 'Poland', flag: '🇵🇱', country: 'PL' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹', country: 'PT' },
  { code: '+1787', name: 'Puerto Rico', flag: '🇵🇷', country: 'PR' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', country: 'QA' },
  { code: '+242', name: 'Republic of the Congo', flag: '🇨🇬', country: 'CG' },
  { code: '+262', name: 'Réunion', flag: '🇷🇪', country: 'RE' },
  { code: '+40', name: 'Romania', flag: '🇷🇴', country: 'RO' },
  { code: '+7', name: 'Russia', flag: '🇷🇺', country: 'RU' },
  { code: '+250', name: 'Rwanda', flag: '🇷🇼', country: 'RW' },
  { code: '+590', name: 'Saint Barthélemy', flag: '🇧🇱', country: 'BL' },
  { code: '+290', name: 'Saint Helena', flag: '🇸🇭', country: 'SH' },
  { code: '+1869', name: 'Saint Kitts and Nevis', flag: '🇰🇳', country: 'KN' },
  { code: '+1758', name: 'Saint Lucia', flag: '🇱🇨', country: 'LC' },
  { code: '+590', name: 'Saint Martin', flag: '🇲🇫', country: 'MF' },
  { code: '+508', name: 'Saint Pierre and Miquelon', flag: '🇵🇲', country: 'PM' },
  { code: '+1784', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', country: 'VC' },
  { code: '+685', name: 'Samoa', flag: '🇼🇸', country: 'WS' },
  { code: '+378', name: 'San Marino', flag: '🇸🇲', country: 'SM' },
  { code: '+239', name: 'São Tomé and Príncipe', flag: '🇸🇹', country: 'ST' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', country: 'SA' },
  { code: '+221', name: 'Senegal', flag: '🇸🇳', country: 'SN' },
  { code: '+381', name: 'Serbia', flag: '🇷🇸', country: 'RS' },
  { code: '+248', name: 'Seychelles', flag: '🇸🇨', country: 'SC' },
  { code: '+232', name: 'Sierra Leone', flag: '🇸🇱', country: 'SL' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', country: 'SG' },
  { code: '+1721', name: 'Sint Maarten', flag: '🇸🇽', country: 'SX' },
  { code: '+421', name: 'Slovakia', flag: '🇸🇰', country: 'SK' },
  { code: '+386', name: 'Slovenia', flag: '🇸🇮', country: 'SI' },
  { code: '+677', name: 'Solomon Islands', flag: '🇸🇧', country: 'SB' },
  { code: '+252', name: 'Somalia', flag: '🇸🇴', country: 'SO' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', country: 'ZA' },
  { code: '+500', name: 'South Georgia', flag: '🇬🇸', country: 'GS' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', country: 'KR' },
  { code: '+211', name: 'South Sudan', flag: '🇸🇸', country: 'SS' },
  { code: '+34', name: 'Spain', flag: '🇪🇸', country: 'ES' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', country: 'LK' },
  { code: '+249', name: 'Sudan', flag: '🇸🇩', country: 'SD' },
  { code: '+597', name: 'Suriname', flag: '🇸🇷', country: 'SR' },
  { code: '+47', name: 'Svalbard and Jan Mayen', flag: '🇸🇯', country: 'SJ' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', country: 'SE' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', country: 'CH' },
  { code: '+963', name: 'Syria', flag: '🇸🇾', country: 'SY' },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼', country: 'TW' },
  { code: '+992', name: 'Tajikistan', flag: '🇹🇯', country: 'TJ' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿', country: 'TZ' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', country: 'TH' },
  { code: '+670', name: 'Timor-Leste', flag: '🇹🇱', country: 'TL' },
  { code: '+228', name: 'Togo', flag: '🇹🇬', country: 'TG' },
  { code: '+690', name: 'Tokelau', flag: '🇹🇰', country: 'TK' },
  { code: '+676', name: 'Tonga', flag: '🇹🇴', country: 'TO' },
  { code: '+1868', name: 'Trinidad and Tobago', flag: '🇹🇹', country: 'TT' },
  { code: '+216', name: 'Tunisia', flag: '🇹🇳', country: 'TN' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷', country: 'TR' },
  { code: '+993', name: 'Turkmenistan', flag: '🇹🇲', country: 'TM' },
  { code: '+1649', name: 'Turks and Caicos Islands', flag: '🇹🇨', country: 'TC' },
  { code: '+688', name: 'Tuvalu', flag: '🇹🇻', country: 'TV' },
  { code: '+1', name: 'U.S. Minor Outlying Islands', flag: '🇺🇲', country: 'UM' },
  { code: '+1340', name: 'U.S. Virgin Islands', flag: '🇻🇮', country: 'VI' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬', country: 'UG' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦', country: 'UA' },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', country: 'AE' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', country: 'GB' },
  { code: '+1', name: 'United States', flag: '🇺🇸', country: 'US' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾', country: 'UY' },
  { code: '+998', name: 'Uzbekistan', flag: '🇺🇿', country: 'UZ' },
  { code: '+678', name: 'Vanuatu', flag: '🇻🇺', country: 'VU' },
  { code: '+39', name: 'Vatican City', flag: '🇻🇦', country: 'VA' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪', country: 'VE' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', country: 'VN' },
  { code: '+681', name: 'Wallis and Futuna', flag: '🇼🇫', country: 'WF' },
  { code: '+212', name: 'Western Sahara', flag: '🇪🇭', country: 'EH' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪', country: 'YE' },
  { code: '+260', name: 'Zambia', flag: '🇿🇲', country: 'ZM' },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼', country: 'ZW' }
];

function Dialer() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lastDialedNumber, setLastDialedNumber] = useState(''); // Save last dialed number
  const [selectedCountryIndex, setSelectedCountryIndex] = useState(0);
  const [callStatus, setCallStatus] = useState(null); // 'connecting', 'ringing', 'connected', 'disconnected'
  const [callDuration, setCallDuration] = useState(0);
  const [callCost, setCallCost] = useState(0.00);
  const [callTimer, setCallTimer] = useState(null);
  
  // Use ref to save latest values, avoid closure issues
  const callDurationRef = useRef(0);
  const callCostRef = useRef(0.00);
  const lastDialedNumberRef = useRef('');
  const [isInitializingTwilio, setIsInitializingTwilio] = useState(false);
  const [twilioReady, setTwilioReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('unknown');
  const [voiceServiceAvailable, setVoiceServiceAvailable] = useState(true);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [displayBalance, setDisplayBalance] = useState(0); // For real-time balance display
  const [currentRate, setCurrentRate] = useState(0.02); // Current rate per minute
  
  // Quick add contact state
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    country: ''
  });
  
  const { user, balance, updateBalance } = useAuth();

  // Initialize display balance
  useEffect(() => {
    const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
    setDisplayBalance(currentBalance);
  }, [balance]);

  // 防重复保存的通话记录保存函数
  const persistCall = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No token, skipping call save');
      return;
    }

    // 使用多重回退确保有号码
    const durationSec = Number(callDurationRef.current) || 0;
    const number = lastDialedNumberRef.current || 
                   phoneNumber || 
                   (twilioService.currentCall?.parameters?.To) || 
                   'unknown';

    // 生成唯一的通话会话ID，用于防重复
    const callSessionId = `${number}_${Math.floor(Date.now() / 10000)}`; // 10秒内的通话视为同一个
    
    // 检查是否已经保存过这个通话会话
    const savedCallsKey = 'recentlySavedCalls';
    const recentlySaved = JSON.parse(localStorage.getItem(savedCallsKey) || '[]');
    
    if (recentlySaved.includes(callSessionId)) {
      console.log('🔄 Call already saved for this session, skipping:', callSessionId);
      return;
    }

    // 构建请求数据（允许 duration = 0）
    const requestData = {
      phoneNumber: number,
      country: selectedCountry.name || 'Unknown',
      duration: durationSec,
      cost: callCostRef.current || 0,
      rate: currentRate,
      status: durationSec > 0 ? 'completed' : 'failed',
      callSid: `CA${Date.now()}${Math.random().toString(36).substr(2, 6)}` // 生成唯一callSid
    };

    console.log('📤 persistCall → Saving call record:', requestData);

    try {
      const response = await axios.post('/api/calls', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Call saved successfully:', response.data);
      
      // 标记这个通话会话已保存
      const updatedSaved = [...recentlySaved, callSessionId];
      // 只保留最近50个会话ID，避免localStorage膨胀
      if (updatedSaved.length > 50) {
        updatedSaved.splice(0, updatedSaved.length - 50);
      }
      localStorage.setItem(savedCallsKey, JSON.stringify(updatedSaved));
      
      // Update balance if returned by server
      if (response.data?.remainingBalance !== undefined) {
        localStorage.setItem('currentBalance', response.data.remainingBalance.toString());
        setDisplayBalance(response.data.remainingBalance);
      }
      
      // Refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
    } catch (err) {
      console.error('❌ persistCall error:', err);
      // Still refresh data even if save fails
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['callHistory'] });
    }
  }, [phoneNumber, selectedCountry.name, currentRate, queryClient]);

  // Get currently selected country
  const selectedCountry = countries[selectedCountryIndex];

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
      if (selectedCountry && selectedCountry.country) {
        const rate = await getRateForCountry(selectedCountry.country, phoneNumber);
        setCurrentRate(rate);
      }
    };
    updateRate();
  }, [selectedCountry, phoneNumber, getRateForCountry]);

  // Initialize Twilio device - remove circular dependency
  const initializeTwilio = useCallback(async () => {
      // Prevent duplicate initialization attempts
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
          
          // Initialize Twilio device
          console.log('🔄 Calling twilioService.initialize...');
          const result = await twilioService.initialize(tokenData.token);
          console.log('📋 Twilio initialization result:', result);
          
          if (result.success) {
            // Mark as ready even if device may timeout due to audio policy
            setTwilioReady(true);
            setVoiceServiceAvailable(true);
            console.log('✅ Twilio initialized successfully - ready for calls');
            
            // Set up call status listener
            twilioService.setCallStatusCallback((status, data) => {
              try {
                console.log('📞 ===== CALL STATUS CALLBACK TRIGGERED =====');
                console.log('📞 Call status changed:', status, data);
                console.log('📞 Current callDuration:', callDuration);
                console.log('📞 User token type:', user?.token === 'mock-token' ? 'mock' : 'real');
                console.log('📞 lastDialedNumberRef.current:', lastDialedNumberRef.current);
                console.log('📞 ===============================================');

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

              // 所有可能的连接状态都要设置号码
              if ((status === 'connecting' || status === 'ringing' || status === 'connected')
                  && data?.to && !lastDialedNumberRef.current) {
                console.log('📞 Setting lastDialedNumberRef from status:', status, 'to:', data.to);
                lastDialedNumberRef.current = data.to;
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
                if (callTimer) {
                  clearInterval(callTimer);
                }
                
                // Start timer with real-time balance deduction
                const timer = setInterval(() => {
                  setCallDuration(prev => {
                    const newDuration = prev + 1;
                    // Calculate cost using current rate per minute
                    const newCost = newDuration * currentRate / 60;
                    setCallCost(newCost);
                    
                    // 同步更新 refs
                    callDurationRef.current = newDuration;
                    callCostRef.current = newCost;
                    
                    // Update display balance in real-time (every second) - for UI only
                    const costPerSecond = currentRate / 60; // current rate per minute / 60 seconds
                    const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
                    const newBalance = Math.max(0, currentBalance - costPerSecond);
                    // Only update display balance, don't call updateBalance to avoid state confusion
                    localStorage.setItem('currentBalance', newBalance.toString());
                    setDisplayBalance(newBalance); // Immediately update display balance
                    
                    return newDuration;
                  });
                }, 1000);
                setCallTimer(timer);
              } else if (status === 'disconnected') {
                console.log('📞 Call disconnected - cleaning up and saving');
                console.log('📞 Call duration:', callDurationRef.current);
                console.log('📞 Call cost:', callCostRef.current);
                console.log('📞 lastDialedNumberRef.current:', lastDialedNumberRef.current);
                
                // 先清理定时器，确保 duration 是最新值
                if (callTimer) {
                  clearInterval(callTimer);
                  setCallTimer(null);
                }
                
                // 立即保存通话记录（只在disconnected时调用一次）
                persistCall();
                
                // 然后重置状态
                setCallStatus(null);
                setCallDuration(0);
                setCallCost(0.00);
                callDurationRef.current = 0;
                callCostRef.current = 0.00;
              }
              } catch (error) {
                console.error('❌ Error in call status callback:', error);
                console.error('❌ Status:', status);
                console.error('❌ Data:', data);
                // 错误情况下不保存，避免重复记录
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
  }, [user]); // Remove frequently changing dependencies

  // Retry initialization function
  const retryInitialization = useCallback(() => {
    console.log('🔄 Retrying Twilio initialization...');
    setInitializationAttempted(false);
    setTwilioReady(false);
    setLastError(null);
    setVoiceServiceAvailable(true);
    setIsInitializingTwilio(false);
    // Re-initialize after short delay
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
    console.log('🔄 Dialer useEffect - User state:', {
      hasUser: !!user,
      userEmail: user?.email,
      initializationAttempted,
      twilioReady,
      isInitializingTwilio
    });
    
    // Only call when user is logged in and initialization not attempted
    if (user?.token && !initializationAttempted && !isInitializingTwilio) {
      console.log('🚀 Starting Twilio initialization...');
      setInitializationAttempted(true);
      initializeTwilio();
    }

    // If user logs out, reset all states
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      twilioService.destroy();
    };
  }, []);

  const handleDialPad = (value) => {
    // If in an active call, send DTMF tone instead of adding to phone number
    if (callStatus === 'connected') {
      console.log('📞 Sending DTMF tone during call:', value);
      console.log('📞 Current call status:', callStatus);
      console.log('📞 Twilio service currentCall:', twilioService.currentCall);
      
      // In development mode, simulate successful DTMF sending
      if (process.env.NODE_ENV === 'development' && !twilioService.currentCall) {
        console.log('📞 Development mode: Simulating DTMF tone:', value);
        toast.success(`Sent (Test): ${value}`, { autoClose: 1000 });
        return;
      }
      
      try {
        const result = twilioService.sendDTMF(value);
        console.log('📞 DTMF result:', result);
        if (result.success) {
          toast.success(`Sent: ${value}`, { autoClose: 1000 });
        } else {
          toast.error(`Failed to send tone: ${result.error}`);
        }
      } catch (error) {
        console.error('Error sending DTMF:', error);
        toast.error('Failed to send tone');
      }
      return;
    }

    // Normal dialing mode - add to phone number
    setPhoneNumber(prev => prev + value);
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCountryChange = (e) => {
    const countryIndex = parseInt(e.target.value);
    console.log('Country changed to index:', countryIndex, 'Country:', countries[countryIndex]);
    setSelectedCountryIndex(countryIndex);
  };

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!user) {
      toast.error('Please login to make calls');
      return;
    }

    if (!balance || balance < 0.20) {
      toast.error('Insufficient balance. Please add credits.');
      return;
    }

    if (!voiceServiceAvailable) {
      // Show friendly message instead of error
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

    // Validate phone number (basic validation)
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    if (cleanNumber.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // Check audio context state and try to recover
    const audioContext = twilioService.checkAudioContextState();
    console.log('🎵 Audio context state:', audioContext);
    
    if (audioContext.needsInteraction) {
      console.log('🎵 Resuming audio context due to user interaction...');
      await twilioService.resumeAudioContext();
    }

    // Force request microphone permission (for real calls)
    console.log('🎤 Current microphone permission:', microphonePermission);
    
    // Always request permission to ensure real call
    const permissionResult = await twilioService.requestMicrophonePermission();
    
    if (permissionResult.success && permissionResult.granted) {
      setMicrophonePermission('granted');
      console.log('✅ Microphone permission granted for real call');
    } else {
      console.log('❌ Microphone permission denied:', permissionResult);
      // Show permission guidance modal
      setShowPermissionModal(true);
      return;
    }

    // Format phone number using selected country code
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = selectedCountry.code + cleanNumber;
    }

    // 在调用 Twilio 之前就设置号码
    lastDialedNumberRef.current = formattedNumber;
    setLastDialedNumber(formattedNumber);

    try {
      // Initiate call using Twilio
      const result = await twilioService.makeCall(formattedNumber);
      
      if (result.success) {
        setCallStatus('connecting');
        setCallDuration(0);
        setCallCost(0.00);
        callDurationRef.current = 0;
        callCostRef.current = 0.00;
      } else {
        // 呼叫失败，记录失败状态但不重复调用persistCall
        console.log('📞 Call failed, will be saved on disconnected event:', result.error);
        // Check if this is a development mode webhook error
        if (result.error && result.error.includes('ngrok')) {
          toast.error('Development Mode: Voice calling requires ngrok setup. See DEVELOPMENT.md for instructions.', {
            autoClose: 8000
          });
        } else {
          toast.error(`Call failed: ${result.error}`);
        }
      }
    } catch (error) {
      // 异常情况记录但不重复调用persistCall
      console.error('Error making call:', error);
      console.log('📞 Call exception, will be saved on disconnected event if call was initiated');
      if (error.message && error.message.includes('ngrok')) {
        toast.error('Development Mode: Voice calling requires ngrok setup. See DEVELOPMENT.md for instructions.', {
          autoClose: 8000
        });
      } else {
        toast.error('Failed to make call');
      }
    }
  };

  const handleCallEnd = () => {
    console.log('📞 handleCallEnd called - cleaning up');
    
    // 先清理定时器
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // 挂断 Twilio 通话（会触发disconnected事件并保存记录）
    try {
      twilioService.hangupCall();
    } catch (error) {
      console.error('Error hanging up call:', error);
      // 如果挂断失败，手动保存记录
      persistCall();
    }
    
    // 最后重置状态
    setCallStatus(null);
    setCallDuration(0);
    setCallCost(0.00);
    setPhoneNumber('');
    callDurationRef.current = 0;
    callCostRef.current = 0.00;
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

  // Quick add contact functionality
  const handleQuickAddContact = useCallback(() => {
    if (!user) {
      toast.error('Please login to add contacts');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number first');
      return;
    }

    // Reset form and open modal
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

      // Format phone number
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
        // Add source tag to indicate this was added from dialer panel
        source: 'dialer'
      };

      // Simulation handling in development mode
      if (process.env.NODE_ENV === 'development' && token === 'mock-token') {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('Mock: Adding contact from dialer:', contactData);
        
        // Close modal and show success message
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

  // Check if add contact button should be shown
  const shouldShowAddContact = phoneNumber.trim().length > 0 && user;
  const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
  const isValidNumber = cleanPhoneNumber.length >= 7;

  return (
    <DialerContainer>
      <BalanceDisplay>
        <BalanceLabel>Balance:</BalanceLabel>
        <BalanceAmount>${displayBalance.toFixed(2)}</BalanceAmount>
      </BalanceDisplay>

      {/* Development Mode Testing Banner */}
      {process.env.NODE_ENV === 'development' && (
        <ServiceBanner style={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)', color: '#ffc107' }}>
          🧪 Development Mode: 
          <button 
            onClick={() => {
              if (callStatus === 'connected') {
                setCallStatus(null);
                setCallDuration(0);
                setCallCost(0.00);
                if (callTimer) {
                  clearInterval(callTimer);
                  setCallTimer(null);
                }
              } else {
                setCallStatus('connected');
                setCallDuration(0);
                setCallCost(0.00);
                // Start test timer
                const timer = setInterval(() => {
                  setCallDuration(prev => {
                    const newDuration = prev + 1;
                    const newCost = newDuration * currentRate / 60;
                    setCallCost(newCost);
                    
                    // Update ref values
                    callDurationRef.current = newDuration;
                    callCostRef.current = newCost;
                    
                    const costPerSecond = currentRate / 60;
                    const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
                    const newBalance = Math.max(0, currentBalance - costPerSecond);
                    // Test mode also only updates display balance, don't call updateBalance
                    localStorage.setItem('currentBalance', newBalance.toString());
                    setDisplayBalance(newBalance);
                    
                    return newDuration;
                  });
                }, 1000);
                setCallTimer(timer);
              }
            }}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              background: 'rgba(255, 193, 7, 0.2)',
              border: '1px solid rgba(255, 193, 7, 0.5)',
              borderRadius: '4px',
              color: '#ffc107',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            {callStatus === 'connected' ? 'Stop Test Call' : 'Test Call Mode'}
          </button>
        </ServiceBanner>
      )}

      {/* Service Status Banner */}
      {!voiceServiceAvailable && !isInitializingTwilio && (
        <ServiceBanner>
          📞 Voice calling is currently unavailable. Other services are working normally.
          {lastError && (
            <div style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>
              Error: {lastError}
            </div>
          )}
          <button 
            onClick={() => {
              setInitializationAttempted(false);
              setVoiceServiceAvailable(true);
              setLastError(null);
            }}
            style={{
              marginLeft: '10px',
              padding: '4px 8px',
              background: '#FFC900',
              border: '3px solid #000',
              borderRadius: '0',
              color: '#000',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Retry
          </button>
        </ServiceBanner>
      )}

      {/* Call status display */}
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
              <span>Cost: ${callCost.toFixed(3)} (${currentRate.toFixed(3)}/min)</span>
              <span>To: {selectedCountry.code + phoneNumber}</span>
            </div>
          </div>
          <button className="end-call-btn" onClick={handleCallEnd}>
            End Call
          </button>
        </CallStatusDisplay>
      )}

      {/* Country selector - full version */}
      <div style={{ marginBottom: '1rem' }}>
        <CountrySelectDropdown
          value={selectedCountryIndex}
          onChange={handleCountryChange}
        >
          {countries.map((country, index) => (
            <option 
              key={index} 
              value={index}
            >
              {country.flag} {country.name} ({country.code})
            </option>
          ))}
        </CountrySelectDropdown>
      </div>

      <PhoneInput>
        <CountryCode>{selectedCountry.code}</CountryCode>
        <NumberDisplay
          value={phoneNumber}
          onChange={(e) => {
            // 自动过滤，保留数字、+号、*号、#号
            const filtered = e.target.value.replace(/[^\d+*#]/g, '');
            setPhoneNumber(filtered);
          }}
          onPaste={(e) => {
            // 处理粘贴事件，自动过滤符号
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            console.log('📋 Pasted text:', pastedText);

            // 更智能的过滤：保留数字、+号、*号、#号，移除其他符号
            const filtered = pastedText.replace(/[^\d+*#]/g, '');
            console.log('📋 Filtered text:', filtered);

            if (filtered) {
              // 替换当前号码而不是追加
              setPhoneNumber(filtered);
              console.log('📋 Phone number set to:', filtered);
            }
          }}
          onKeyDown={(e) => {
            // 允许常用的键盘操作
            const allowedKeys = [
              'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
              'Home', 'End', 'Tab', 'Enter', 'Escape'
            ];

            // 允许 Ctrl/Cmd + 任何键（复制、粘贴、全选等）
            if (e.ctrlKey || e.metaKey) {
              return; // 允许所有组合键
            }

            // 允许数字、+号、*号、#号
            if (/[\d+*#]/.test(e.key) || allowedKeys.includes(e.key)) {
              return; // 允许这些按键
            }

            // 阻止其他按键（如字母等）
            e.preventDefault();
          }}
          placeholder="Enter phone number"
          autoComplete="tel"
          spellCheck={false}
        />
        <AddContactButton 
          $hasNumber={shouldShowAddContact}
          $isLoggedIn={!!user}
          onClick={handleQuickAddContact}
          title={
            !user ? 'Please login to add contacts' :
            !phoneNumber.trim() ? 'Enter a phone number to add contact' :
            !isValidNumber ? 'Enter a valid phone number' :
            'Add this number to contacts'
          }
        >
          <UserPlus />
        </AddContactButton>
      </PhoneInput>

      <DialPad>
        {dialPadNumbers.map((item) => (
          <DialButton
            key={item.number}
            onClick={() => handleDialPad(item.number)}
          >
            {item.number}
            {item.letters && <div className="letters">{item.letters}</div>}
          </DialButton>
        ))}
      </DialPad>

      <ActionButtons>
        <DeleteButton onClick={handleDelete}>
          <Delete />
        </DeleteButton>
        
        <CallButton 
          onClick={handleCall}
          disabled={!voiceServiceAvailable}
          style={{
            opacity: voiceServiceAvailable ? 1 : 0.6,
            cursor: voiceServiceAvailable ? 'pointer' : 'not-allowed'
          }}
        >
          <Phone />
        </CallButton>
      </ActionButtons>


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
    </DialerContainer>
  );
}

export default Dialer; 