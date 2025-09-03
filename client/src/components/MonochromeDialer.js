import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import twilioService from '../services/twilioService';
import MicrophonePermissionModal from './MicrophonePermissionModal';
import axios from 'axios';

const DialerContainer = styled.div`
  max-width: 100%;
`;

const Display = styled.div`
  background: #F5F5F5;
  border: 2px solid #E0E0E0;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
  position: relative;
`;

const HiddenInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
`;

const PhoneNumber = styled.div`
  font-size: 32px;
  font-weight: 600;
  color: #000;
  font-family: 'SF Mono', Monaco, monospace;
  min-height: 40px;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const CountrySelect = styled.select`
  width: 100%;
  padding: 16px 20px;
  border: 1px solid #666;
  border-radius: 0;
  font-size: 16px;
  font-weight: 600;
  background: white;
  color: #0a0f2f;
  cursor: pointer;
  margin-bottom: 24px;
  outline: none;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230a0f2f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  
  &:focus {
    border-color: #666;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  }
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
  
  option {
    color: #0a0f2f;
    background: white;
    font-weight: 500;
    padding: 12px;
  }
`;

const Keypad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const Key = styled.button`
  padding: 20px;
  background: #F5F5F5;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #000;
  cursor: pointer;
  transition: all 0.15s;
  outline: none;
  
  &:hover {
    background: #FFC900;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    font-size: 20px;
  }
  
  @media (max-width: 480px) {
    padding: 14px;
    font-size: 18px;
  }
`;

const ActionRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;


const DeleteButton = styled.button`
  background: #F5F5F5;
  border: 2px solid #E0E0E0;
  color: #333;
  padding: 18px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  
  &:hover {
    background: #E0E0E0;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CallButton = styled.button`
  background: #FFC900;
  border: none;
  color: #000;
  padding: 18px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  outline: none;
  position: relative;
  
  &:hover {
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.end-call {
    background: #dc2626;
    color: white;
  }
`;

const PhoneIcon = styled.span`
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 3px solid currentColor;
    border-radius: 4px;
    transform: rotate(-25deg);
  }
  
  &::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 1px;
    top: 3px;
    left: 9px;
  }
`;

const CallStatus = styled.div`
  text-align: center;
  padding: 20px;
  background: ${props => props.isActive ? '#FFC900' : '#F5F5F5'};
  border: ${props => props.isActive ? 'none' : '3px solid #E0E0E0'};
  color: ${props => props.isActive ? '#0a0f2f' : '#666'};
  border-radius: 12px;
  margin-top: 10px;
  margin-bottom: 30px;
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  }
`;

const CallInfo = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 20px;
  font-size: 14px;
  color: #0a0f2f;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  span:last-child {
    color: #0a0f2f;
    font-weight: 700;
  }
`;

const BalanceInfo = styled.div`
  text-align: center;
  padding: 20px;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  margin-bottom: 24px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }
  
  .balance-label {
    font-size: 12px;
    color: #000;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
  
  .balance-amount {
    font-size: 28px;
    font-weight: 800;
    color: #000;
    margin-top: 4px;
  }
`;

// Complete list of countries
const countries = [
  { code: 'AL', name: 'Albania', prefix: '+355', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', prefix: '+213', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', prefix: '+376', flag: '🇦🇩' },
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', prefix: '+374', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', prefix: '+61', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', prefix: '+43', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', prefix: '+994', flag: '🇦🇿' },
  { code: 'BD', name: 'Bangladesh', prefix: '+880', flag: '🇧🇩' },
  { code: 'BY', name: 'Belarus', prefix: '+375', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', prefix: '+32', flag: '🇧🇪' },
  { code: 'BA', name: 'Bosnia and Herzegovina', prefix: '+387', flag: '🇧🇦' },
  { code: 'BR', name: 'Brazil', prefix: '+55', flag: '🇧🇷' },
  { code: 'BG', name: 'Bulgaria', prefix: '+359', flag: '🇧🇬' },
  { code: 'KH', name: 'Cambodia', prefix: '+855', flag: '🇰🇭' },
  { code: 'CA', name: 'Canada', prefix: '+1', flag: '🇨🇦' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'CN', name: 'China', prefix: '+86', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', prefix: '+57', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', prefix: '+385', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic', prefix: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', prefix: '+45', flag: '🇩🇰' },
  { code: 'EC', name: 'Ecuador', prefix: '+593', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', prefix: '+20', flag: '🇪🇬' },
  { code: 'EE', name: 'Estonia', prefix: '+372', flag: '🇪🇪' },
  { code: 'FO', name: 'Faroe Islands', prefix: '+298', flag: '🇫🇴' },
  { code: 'FJ', name: 'Fiji', prefix: '+679', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', prefix: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France', prefix: '+33', flag: '🇫🇷' },
  { code: 'GE', name: 'Georgia', prefix: '+995', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', prefix: '+49', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', prefix: '+30', flag: '🇬🇷' },
  { code: 'GL', name: 'Greenland', prefix: '+299', flag: '🇬🇱' },
  { code: 'GT', name: 'Guatemala', prefix: '+502', flag: '🇬🇹' },
  { code: 'HK', name: 'Hong Kong', prefix: '+852', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', prefix: '+36', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', prefix: '+354', flag: '🇮🇸' },
  { code: 'IN', name: 'India', prefix: '+91', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', prefix: '+62', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', prefix: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', prefix: '+964', flag: '🇮🇶' },
  { code: 'IL', name: 'Israel', prefix: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', prefix: '+39', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', prefix: '+81', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', prefix: '+962', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', prefix: '+7', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', prefix: '+254', flag: '🇰🇪' },
  { code: 'XK', name: 'Kosovo', prefix: '+383', flag: '🇽🇰' },
  { code: 'KG', name: 'Kyrgyzstan', prefix: '+996', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', prefix: '+856', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', prefix: '+371', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', prefix: '+961', flag: '🇱🇧' },
  { code: 'LI', name: 'Liechtenstein', prefix: '+423', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', prefix: '+370', flag: '🇱🇹' },
  { code: 'MO', name: 'Macau', prefix: '+853', flag: '🇲🇴' },
  { code: 'MY', name: 'Malaysia', prefix: '+60', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', prefix: '+52', flag: '🇲🇽' },
  { code: 'MD', name: 'Moldova', prefix: '+373', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', prefix: '+377', flag: '🇲🇨' },
  { code: 'ME', name: 'Montenegro', prefix: '+382', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', prefix: '+212', flag: '🇲🇦' },
  { code: 'MM', name: 'Myanmar', prefix: '+95', flag: '🇲🇲' },
  { code: 'NP', name: 'Nepal', prefix: '+977', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', prefix: '+31', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', prefix: '+64', flag: '🇳🇿' },
  { code: 'NG', name: 'Nigeria', prefix: '+234', flag: '🇳🇬' },
  { code: 'MK', name: 'North Macedonia', prefix: '+389', flag: '🇲🇰' },
  { code: 'NO', name: 'Norway', prefix: '+47', flag: '🇳🇴' },
  { code: 'PK', name: 'Pakistan', prefix: '+92', flag: '🇵🇰' },
  { code: 'PA', name: 'Panama', prefix: '+507', flag: '🇵🇦' },
  { code: 'PE', name: 'Peru', prefix: '+51', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', prefix: '+63', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', prefix: '+48', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', prefix: '+351', flag: '🇵🇹' },
  { code: 'RO', name: 'Romania', prefix: '+40', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', prefix: '+7', flag: '🇷🇺' },
  { code: 'SM', name: 'San Marino', prefix: '+378', flag: '🇸🇲' },
  { code: 'SA', name: 'Saudi Arabia', prefix: '+966', flag: '🇸🇦' },
  { code: 'RS', name: 'Serbia', prefix: '+381', flag: '🇷🇸' },
  { code: 'SG', name: 'Singapore', prefix: '+65', flag: '🇸🇬' },
  { code: 'SI', name: 'Slovenia', prefix: '+386', flag: '🇸🇮' },
  { code: 'ZA', name: 'South Africa', prefix: '+27', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', prefix: '+82', flag: '🇰🇷' },
  { code: 'ES', name: 'Spain', prefix: '+34', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', prefix: '+94', flag: '🇱🇰' },
  { code: 'SE', name: 'Sweden', prefix: '+46', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', prefix: '+41', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', prefix: '+963', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', prefix: '+886', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', prefix: '+992', flag: '🇹🇯' },
  { code: 'TH', name: 'Thailand', prefix: '+66', flag: '🇹🇭' },
  { code: 'TN', name: 'Tunisia', prefix: '+216', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', prefix: '+90', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', prefix: '+993', flag: '🇹🇲' },
  { code: 'AE', name: 'UAE', prefix: '+971', flag: '🇦🇪' },
  { code: 'UA', name: 'Ukraine', prefix: '+380', flag: '🇺🇦' },
  { code: 'GB', name: 'United Kingdom', prefix: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', prefix: '+1', flag: '🇺🇸' },
  { code: 'UZ', name: 'Uzbekistan', prefix: '+998', flag: '🇺🇿' },
  { code: 'VA', name: 'Vatican City', prefix: '+39', flag: '🇻🇦' },
  { code: 'VE', name: 'Venezuela', prefix: '+58', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', prefix: '+84', flag: '🇻🇳' }
];

const MonochromeDialer = () => {
  const { user, balance } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [isCallActive, setIsCallActive] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [callStatus, setCallStatus] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [callCost, setCallCost] = useState(0);
  const [isInitializingTwilio, setIsInitializingTwilio] = useState(false);
  const [twilioReady, setTwilioReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [microphonePermission, setMicrophonePermission] = useState('unknown');
  const [voiceServiceAvailable, setVoiceServiceAvailable] = useState(true);
  const [initializationAttempted, setInitializationAttempted] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [callTimer, setCallTimer] = useState(null);
  const [currentRate, setCurrentRate] = useState(0.02); // Current rate per minute
  
  // 初始化和更新显示余额
  useEffect(() => {
    const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
    setDisplayBalance(currentBalance);
  }, [balance]);

  // 监听 localStorage 变化以实时更新余额
  useEffect(() => {
    const handleStorageChange = () => {
      const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
      setDisplayBalance(currentBalance);
    };

    // 监听storage事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 创建自定义事件监听（同一标签页）
    const handleBalanceUpdate = (e) => {
      setDisplayBalance(e.detail);
    };
    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
    };
  }, [balance]);

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
      if (selectedCountry) {
        const rate = await getRateForCountry(selectedCountry, phoneNumber);
        setCurrentRate(rate);
      }
    };
    updateRate();
  }, [selectedCountry, phoneNumber, getRateForCountry]);
  
  // Save call record to database
  const saveCallRecord = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('📞 Skipping call record save - no authentication token');
        return;
      }
      
      // For mock users, skip saving to database but log the action
      if (token === 'mock-token') {
        console.log('📞 Mock user - call record simulation (not saved to database)');
        return;
      }
      
      // Get country name from selected country
      const country = countries.find(c => c.code === selectedCountry);
      const countryName = country ? country.name : 'Unknown';
      
      // Format the full phone number
      const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : country.prefix + phoneNumber.replace(/[^\d]/g, '');
      
      const response = await fetch('/api/calls/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          country: countryName,
          duration: callDuration, // in seconds
          cost: callCost,
          rate: currentRate
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('📞 Call record saved to database:', result);
        toast.success('Call record saved successfully');
      } else {
        console.error('❌ Failed to save call record:', response.statusText);
      }
    } catch (error) {
      console.error('❌ Error saving call record:', error);
    }
  }, [phoneNumber, selectedCountry, callDuration, callCost, currentRate]);

  // 初始化Twilio设备
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
          
          // 设置通话状态监听器
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

            if (status === 'connecting') {
              setCallStatus('connecting');
            } else if (status === 'ringing') {
              setCallStatus('ringing');
            } else if (status === 'accepted' || status === 'connected') {
              setCallStatus('connected');
              // 开始计时
              const timer = setInterval(() => {
                setCallDuration(prev => {
                  const newDuration = prev + 1;
                  setCallCost(newDuration * currentRate / 60);
                  return newDuration;
                });
              }, 1000);
              setCallTimer(timer);
            } else if (status === 'disconnected') {
              // Save call record if call had duration
              if (callDuration > 0) {
                saveCallRecord();
              }
              
              setCallStatus('');
              setIsCallActive(false);
              setCallDuration(0);
              setCallCost(0.00);
              if (callTimer) {
                clearInterval(callTimer);
                setCallTimer(null);
              }
            }
          });
          
          // 检查麦克风权限状态
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
  }, [user, callTimer, currentRate, callDuration, saveCallRecord]);

  // 重试初始化函数
  const retryInitialization = useCallback(() => {
    console.log('🔄 Retrying Twilio initialization...');
    setInitializationAttempted(false);
    setTwilioReady(false);
    setLastError(null);
    setVoiceServiceAvailable(true);
    setIsInitializingTwilio(false);
    setTimeout(() => {
      if (user?.token) {
        setInitializationAttempted(true);
        initializeTwilio();
      }
    }, 500);
  }, [user, initializeTwilio]);

  // 检查麦克风权限
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

  // 初始化逻辑
  useEffect(() => {
    console.log('🔄 Dialer useEffect - User state:', {
      hasUser: !!user,
      userEmail: user?.email,
      initializationAttempted,
      twilioReady,
      isInitializingTwilio
    });
    
    if (user?.token && !initializationAttempted && !isInitializingTwilio) {
      console.log('🚀 Starting Twilio initialization...');
      setInitializationAttempted(true);
      initializeTwilio();
    }

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

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      twilioService.destroy();
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isCallActive && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
        setCallCost(prev => prev + currentRate / 60);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive, callStatus, currentRate]);

  const handleKeyPress = (digit) => {
    if (phoneNumber.length < 15) {
      // 自动过滤，只允许数字和特殊字符
      const filtered = String(digit).replace(/[^\d*#+]/g, '');
      if (filtered) {
        setPhoneNumber(prev => prev + filtered);
      }
    }
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (number) => {
    if (!number) return selectedCountry === 'US' ? '+1 (___) ___-____' : `${countries.find(c => c.code === selectedCountry)?.prefix || ''} ____________`;
    
    if (selectedCountry === 'US' || selectedCountry === 'CA') {
      // Format for US/Canada numbers
      if (number.length <= 3) {
        return `+1 (${number}`;
      } else if (number.length <= 6) {
        return `+1 (${number.slice(0, 3)}) ${number.slice(3)}`;
      } else {
        return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6, 10)}`;
      }
    } else {
      // For other countries, just show the number with prefix
      const country = countries.find(c => c.code === selectedCountry);
      return `${country?.prefix || ''} ${number}`;
    }
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

    // Validate phone number
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    if (cleanNumber.length < 7) {
      toast.error('Please enter a valid phone number');
      return;
    }

    // 立即设置UI为准备状态，提供即时反馈
    setIsCallActive(true);
    setCallStatus('preparing');
    setCallDuration(0);
    setCallCost(0.00);
    
    console.log('📞 Call initiated, will save record when completed');

    // 使用选择的国家代码格式化电话号码
    const country = countries.find(c => c.code === selectedCountry);
    let formattedNumber = phoneNumber;
    if (!formattedNumber.startsWith('+')) {
      formattedNumber = country.prefix + cleanNumber;
    }

    try {
      // 检查音频上下文状态并尝试恢复
      const audioContext = twilioService.checkAudioContextState();
      console.log('🎵 Audio context state:', audioContext);
      
      if (audioContext.needsInteraction) {
        console.log('🎵 Resuming audio context due to user interaction...');
        await twilioService.resumeAudioContext();
      }

      // 强制请求麦克风权限（为真实通话）
      console.log('🎤 Current microphone permission:', microphonePermission);
      
      const permissionResult = await twilioService.requestMicrophonePermission();
      
      if (permissionResult.success && permissionResult.granted) {
        setMicrophonePermission('granted');
        console.log('✅ Microphone permission granted for real call');
      } else {
        console.log('❌ Microphone permission denied:', permissionResult);
        setShowPermissionModal(true);
        // 恢复UI状态
        setIsCallActive(false);
        setCallStatus('');
        return;
      }

      // 更新状态为连接中
      setCallStatus('connecting');
      
      // 使用Twilio发起通话
      const result = await twilioService.makeCall(formattedNumber);
      
      if (!result.success) {
        toast.error(`Call failed: ${result.error}`);
        setIsCallActive(false);
        setCallStatus('');
      }
    } catch (error) {
      console.error('Error making call:', error);
      toast.error('Failed to make call');
      setIsCallActive(false);
      setCallStatus('');
    }
  };

  const handleHangup = () => {
    // Save call record if call had duration
    if (callDuration > 0) {
      saveCallRecord();
    }
    
    setCallStatus('');
    setIsCallActive(false);
    setCallDuration(0);
    setCallCost(0.00);
    setPhoneNumber('');
    
    // 清除计时器
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // 挂断Twilio通话
    try {
      twilioService.hangupCall();
    } catch (error) {
      console.error('Error hanging up call:', error);
    }
    
    toast.info('Call ended');
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

  return (
    <DialerContainer>
      {user && (
        <BalanceInfo>
          <div className="balance-label">Current Balance</div>
          <div className="balance-amount">${displayBalance.toFixed(2)}</div>
        </BalanceInfo>
      )}

      
      <Display>
        <HiddenInput
          type="text"
          value=""
          onChange={() => {}} // 不使用onChange，只用于粘贴
          onPaste={(e) => {
            // 处理粘贴事件，自动过滤符号
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            const filtered = pastedText.replace(/[^\d*#+]/g, '');
            if (filtered) {
              setPhoneNumber(prev => {
                const newNumber = prev + filtered;
                return newNumber.length <= 15 ? newNumber : prev;
              });
            }
          }}
          placeholder="Click here to paste phone number"
        />
        <PhoneNumber>
          {formatPhoneNumber(phoneNumber)}
        </PhoneNumber>
      </Display>
      
      <CountrySelect 
        value={selectedCountry} 
        onChange={(e) => setSelectedCountry(e.target.value)}
      >
        {countries.map(country => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name} ({country.prefix})
          </option>
        ))}
      </CountrySelect>
      
      <Keypad>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
          <Key
            key={digit}
            onClick={() => handleKeyPress(digit)}
            disabled={isCallActive}
          >
            {digit}
          </Key>
        ))}
      </Keypad>
      
      <ActionRow>
        <DeleteButton onClick={handleDelete} disabled={isCallActive}>
          Delete
        </DeleteButton>
        {isCallActive ? (
          <CallButton className="end-call" onClick={handleHangup}>
            <PhoneIcon /> End Call
          </CallButton>
        ) : (
          <CallButton onClick={handleCall} disabled={!phoneNumber}>
            <PhoneIcon /> Call Now
          </CallButton>
        )}
      </ActionRow>
      
      {isCallActive && (
        <>
          <CallStatus isActive={true}>
            {callStatus === 'preparing' ? 'PREPARING...' : 
             callStatus === 'connecting' ? 'CONNECTING...' : 
             callStatus === 'ringing' ? 'RINGING' : 
             callStatus === 'connected' ? 'CONNECTED' : 
             callStatus.toUpperCase()}
          </CallStatus>
          {callStatus === 'connected' && (
            <>
              <CallInfo>
                <span>Duration</span>
                <span>{formatDuration(callDuration)}</span>
              </CallInfo>
              <CallInfo>
                <span>Cost</span>
                <span>${callCost.toFixed(3)} (${currentRate.toFixed(3)}/min)</span>
              </CallInfo>
            </>
          )}
        </>
      )}
      
      {/* Microphone Permission Modal */}
      <MicrophonePermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        permissionStatus={microphonePermission}
      />
    </DialerContainer>
  );
};

export default MonochromeDialer;