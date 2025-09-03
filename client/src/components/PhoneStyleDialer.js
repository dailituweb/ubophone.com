import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, UserPlus, Delete, ChevronDown, Globe 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { COUNTRY_OPTIONS } from '../utils/countryOptions-complete';

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
  
  @media (max-width: 480px) {
    padding: 1rem;
    max-width: 100%;
    margin: 0;
    border-radius: 0;
  }
  
  @media (max-width: 360px) {
    padding: 0.75rem;
    border-width: 2px;
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

function PhoneStyleDialer() {
  const navigate = useNavigate();
  const { user, balance } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCallFromDropdown, setShowCallFromDropdown] = useState(false);
  const [selectedCallFrom, setSelectedCallFrom] = useState('public');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_OPTIONS.find(c => c.code === '+1' && c.name === 'United States') || 
    COUNTRY_OPTIONS.find(c => c.code === '+1') || 
    COUNTRY_OPTIONS[0]
  );
  const [keyboardMode, setKeyboardMode] = useState('123');
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

  // Call from options
  const callFromOptions = [
    {
      id: 'public',
      icon: <Globe size={16} />,
      title: 'Public number',
      subtitle: 'Default calling option',
      usage: 'Free • Standard rates',
      isDefault: selectedCallFrom === 'public'
    }
  ];

  // Dialer pad numbers
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

  // Format phone number input
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

  const handleDialPad = (value) => {
    if (keyboardMode === 'ABC') {
      const item = dialPadNumbers.find(item => item.number === value);
      if (item && item.letters) {
        const firstLetter = item.letters.charAt(0);
        const newValue = phoneNumber + firstLetter;
        handlePhoneNumberChange(newValue);
      } else {
        const newValue = phoneNumber + value;
        handlePhoneNumberChange(newValue);
      }
    } else {
      const newValue = phoneNumber + value;
      handlePhoneNumberChange(newValue);
    }
  };

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
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

    if (!user) {
      navigate('/login');
      return;
    }

    // Navigate to phone page with the entered number
    navigate(`/phone?number=${encodeURIComponent(phoneNumber)}&countryCode=${encodeURIComponent(selectedCountry.code)}`);
  };

  const handleAddContact = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number first');
      return;
    }

    navigate(`/phone?number=${encodeURIComponent(phoneNumber)}&countryCode=${encodeURIComponent(selectedCountry.code)}&contact=add`);
  };

  const handleCallFromSelect = (optionId) => {
    setSelectedCallFrom(optionId);
    setShowCallFromDropdown(false);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  // Check if should show add contact button
  const shouldShowAddContact = phoneNumber.trim().length > 0 && user;
  const cleanPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
  const isValidNumber = cleanPhoneNumber.length >= 7;

  return (
    <DialerContainer>
      {/* Balance and Status */}
      <StatusSection>
        <BalanceDisplay>
          {user ? `Balance: $${(balance || 0).toFixed(5)}` : 'Sign up to start calling'}
        </BalanceDisplay>
      </StatusSection>

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
                  onClick={() => handleCallFromSelect(option.id)}
                  $isDefault={option.isDefault}
                >
                  <OptionIcon>{option.icon}</OptionIcon>
                  <OptionDetails>
                    <OptionTitle>{option.title}</OptionTitle>
                    <OptionSubtitle>{option.subtitle}</OptionSubtitle>
                    {option.usage && <OptionUsage>{option.usage}</OptionUsage>}
                  </OptionDetails>
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
            onChange={(e) => handlePhoneNumberChange(e.target.value)}
            onPaste={(e) => {
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
          onClick={handleCall}
          disabled={!phoneNumber.trim()}
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
  );
}

export default PhoneStyleDialer;