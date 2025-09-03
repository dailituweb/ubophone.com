import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronDown, UserPlus } from 'lucide-react';
import { COUNTRY_OPTIONS } from '../../utils/countryOptions-complete';

const PhoneInputSection = styled.div`
  margin-bottom: 1.5rem;
`;

const PhoneInputContainer = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  overflow: hidden;
  transition: all 0.2s ease;

  &:focus-within {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const CountrySelector = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8f9fa;
  border: none;
  border-right: 2px solid #000;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: #e9ecef;
  }

  @media (max-width: 768px) {
    border-right: none;
    border-bottom: 2px solid #000;
    justify-content: center;
  }
`;

const CountryFlag = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 18px;
  background: #ddd;
  border: 1px solid #999;
  border-radius: 2px;
  font-size: 0.8rem;
  font-weight: bold;
  color: #333;

  &::before {
    content: '${props => props.flag || '🌍'}';
  }
`;

const CountryCode = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: #0a0f2f;
`;

const NumberInput = styled.input`
  flex: 1;
  border: none;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0a0f2f;
  background: transparent;
  outline: none;

  &::placeholder {
    color: #999;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    text-align: center;
    font-size: 1.2rem;
  }
`;

const AddContactButton = styled.button`
  background: ${props => props.$hasNumber && props.$isLoggedIn ? 
    '#FFC900' : '#f0f0f0'};
  color: ${props => props.$hasNumber && props.$isLoggedIn ? 
    '#0a0f2f' : '#999'};
  border: none;
  border-left: 2px solid #000;
  padding: 1rem;
  cursor: ${props => props.$hasNumber && props.$isLoggedIn ? 
    'pointer' : 'not-allowed'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.$hasNumber && props.$isLoggedIn ? 
      '#e6b400' : '#f0f0f0'};
  }

  @media (max-width: 768px) {
    border-left: none;
    border-top: 2px solid #000;
  }
`;

const CountryDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 3px solid #000;
  border-top: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const CountryOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: none;
  background: white;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

const CountryInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
`;

const CountryName = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: #0a0f2f;
`;

const PhoneNumberInput = memo(({ 
  value, 
  onChange, 
  onAddContact,
  selectedCountry,
  onCountryChange,
  isLoggedIn = false,
  placeholder = "Enter phone number"
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // 关闭下拉菜单
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  const handleCountrySelect = useCallback((country) => {
    onCountryChange?.(country);
    closeDropdown();
    inputRef.current?.focus();
  }, [onCountryChange, closeDropdown]);

  const handleInputChange = useCallback((e) => {
    const inputValue = e.target.value;
    // 只允许数字、+、-、空格、括号
    const cleanValue = inputValue.replace(/[^\d+\-\s()]/g, '');
    onChange?.(cleanValue);
  }, [onChange]);

  const handleAddContact = useCallback(() => {
    if (value && isLoggedIn) {
      onAddContact?.(value);
    }
  }, [value, isLoggedIn, onAddContact]);

  const hasNumber = value && value.trim().length > 0;

  return (
    <PhoneInputSection>
      <PhoneInputContainer>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <CountrySelector onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <CountryFlag flag={selectedCountry?.flag} />
            <CountryCode>{selectedCountry?.dialCode}</CountryCode>
            <ChevronDown size={16} />
          </CountrySelector>
          
          <CountryDropdown $isOpen={isDropdownOpen}>
            {COUNTRY_OPTIONS.slice(0, 20).map((country) => (
              <CountryOption
                key={country.code}
                onClick={() => handleCountrySelect(country)}
              >
                <CountryFlag flag={country.flag} />
                <CountryInfo>
                  <CountryName>{country.name}</CountryName>
                  <CountryCode>{country.dialCode}</CountryCode>
                </CountryInfo>
              </CountryOption>
            ))}
          </CountryDropdown>
        </div>

        <NumberInput
          ref={inputRef}
          type="tel"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="tel"
        />

        <AddContactButton
          $hasNumber={hasNumber}
          $isLoggedIn={isLoggedIn}
          onClick={handleAddContact}
          disabled={!hasNumber || !isLoggedIn}
          title={!isLoggedIn ? "Login to add contacts" : "Add to contacts"}
        >
          <UserPlus size={18} />
        </AddContactButton>
      </PhoneInputContainer>
    </PhoneInputSection>
  );
});

PhoneNumberInput.displayName = 'PhoneNumberInput';

export default PhoneNumberInput;
