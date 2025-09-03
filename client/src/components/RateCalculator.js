import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChevronDown, Calculator, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CalculatorContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 16px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.125rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-transform: uppercase;
  
  svg {
    color: #FFC900;
    width: 20px;
    height: 20px;
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1rem;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const FormSection = styled.div`
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SelectWrapper = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const CountrySelect = styled.select`
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px solid #000;
  border-radius: 12px;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
  appearance: none;
  
  &:hover {
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }
  
  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.3);
  }
  
  option {
    padding: 0.75rem;
    background: white;
    color: #0a0f2f;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem;
    font-size: 0.9rem;
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #0a0f2f;
  pointer-events: none;
  z-index: 1;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const CallTypeSection = styled.div`
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    margin-bottom: 1rem;
  }
`;

const CallTypeButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CallTypeButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: ${props => props.$active ? '#FFC900' : 'white'};
  border: 2px solid #000;
  border-radius: 12px;
  color: #0a0f2f;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? '#e6b800' : '#f8f8f8'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 0.625rem;
    font-size: 0.8rem;
  }
`;

const ResultSection = styled.div`
  background: linear-gradient(135deg, #0a0f2f 0%, #1a2332 100%);
  border: 3px solid #000;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  color: white;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin: 1rem 0;
  }
`;

const CallInfo = styled.div`
  color: white;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const CountryDisplay = styled.div`
  color: white;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
`;

const RateDisplay = styled.div`
  color: #FFC900;
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0.5rem 0;
  font-family: 'SF Mono', Monaco, monospace;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const CallNowButton = styled.button`
  width: 100%;
  background: #FFC900;
  border: 3px solid #000;
  color: #0a0f2f;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  
  &:hover {
    background: #e6b800;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 20px;
    height: 20px;
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem 1.25rem;
    font-size: 1rem;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const RateCalculator = () => {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [callType, setCallType] = useState('mobile');
  const [currentRate, setCurrentRate] = useState(0.02);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load all countries immediately on component mount
  useEffect(() => {
    const fetchAllCountries = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/rates/all');
        if (response.data && response.data.data) {
          const countriesData = Object.entries(response.data.data)
            .map(([code, data]) => ({
              code,
              name: data.country,
              flag: getCountryFlag(code),
              rate: data.rate,
              phoneCode: data.phoneCode || '+1'
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          
          setCountries(countriesData);
          console.log(`✅ Loaded all ${countriesData.length} countries`);
          // Log sample countries to verify phoneCode
          console.log('Sample countries with phoneCode:', 
            countriesData.slice(0, 5).map(c => ({ code: c.code, name: c.name, phoneCode: c.phoneCode }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
        // Fallback to empty array, will show loading state
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllCountries();
  }, []);

  // Get country flag emoji - auto-generate from country code
  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    
    // Convert country code to flag emoji
    // Each country code letter maps to a regional indicator symbol
    const codePoints = countryCode.toUpperCase().split('').map(char => {
      return 127397 + char.charCodeAt(0);
    });
    
    return String.fromCodePoint(...codePoints);
  };

  // Get current country info
  const currentCountry = countries.find(c => c.code === selectedCountry);

  // Set rate when country changes
  useEffect(() => {
    const currentCountry = countries.find(c => c.code === selectedCountry);
    if (currentCountry) {
      // 立即使用本地费率，无需API调用
      setCurrentRate(currentCountry.rate);
      setLoading(false);
    } else {
      // 如果找不到国家，尝试从 API 获取
      const fetchRate = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`/api/rates/country/${selectedCountry}?callType=${callType}`);
          if (response.data && response.data.data && response.data.data.rate) {
            setCurrentRate(response.data.data.rate);
          } else {
            setCurrentRate(0.02);
          }
        } catch (error) {
          console.warn('Failed to fetch rate for country:', selectedCountry, error);
          setCurrentRate(0.02);
        } finally {
          setLoading(false);
        }
      };
      fetchRate();
    }
  }, [selectedCountry, callType, countries]);

  const handleCallNow = () => {
    if (user) {
      // Navigate to phone page with pre-selected country phone code
      // Get phoneCode from the current country data
      const currentCountryData = countries.find(c => c.code === selectedCountry);
      const phoneCode = currentCountryData?.phoneCode || '+1';
      console.log('Navigating with phoneCode:', phoneCode, 'for country:', selectedCountry);
      navigate(`/phone?countryCode=${phoneCode}`);
    } else {
      // Navigate to registration page
      navigate('/register');
    }
  };

  // Show loading state until all countries are loaded
  if (loading || countries.length === 0) {
    return (
      <CalculatorContainer>
        <Header>
          <Title>
            <Calculator />
            Calculate Your Call Cost
          </Title>
        </Header>
        <FormSection>
          <FormLabel>Loading all countries...</FormLabel>
        </FormSection>
      </CalculatorContainer>
    );
  }

  return (
    <CalculatorContainer>
      <Header>
        <Title>
          <Calculator />
          Calculate Your Call Cost
        </Title>
      </Header>

      <FormSection>
        <FormLabel>I'm calling</FormLabel>
        <SelectWrapper>
          <CountrySelect
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </CountrySelect>
          <SelectIcon>
            <ChevronDown />
          </SelectIcon>
        </SelectWrapper>
      </FormSection>

      <CallTypeSection>
        <FormLabel>To a</FormLabel>
        <CallTypeButtons>
          <CallTypeButton
            $active={callType === 'mobile'}
            onClick={() => setCallType('mobile')}
          >
            📱 Mobile
          </CallTypeButton>
          <CallTypeButton
            $active={callType === 'landline'}
            onClick={() => setCallType('landline')}
          >
            📞 Landline
          </CallTypeButton>
        </CallTypeButtons>
      </CallTypeSection>

      <ResultSection>
        <CallInfo>Your call will cost</CallInfo>
        <CountryDisplay>
          {currentCountry?.flag} {currentCountry?.name}
        </CountryDisplay>
        <RateDisplay>
          {loading ? 'Loading...' : `$${currentRate?.toFixed(3)} per minute`}
        </RateDisplay>
      </ResultSection>

      <CallNowButton onClick={handleCallNow}>
        <Phone />
        Call {currentCountry?.flag} {currentCountry?.name} now
      </CallNowButton>
    </CalculatorContainer>
  );
};

export default RateCalculator;