import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MapPin,
  MessageSquare,
  Search,
  Info,
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import api from '../utils/api';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 100px);

  @media (max-width: 768px) {
    padding: 10px;
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
    min-height: calc(100vh - 60px);
  }
`;

const SearchSection = styled.div`
  background: #1a2332;
  border: 3px solid #000;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 0 #000;

  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 20px;
  }
`;

const SearchTitle = styled.h2`
  color: #fff;
  font-size: 20px;
  margin-bottom: 20px;
  font-weight: 700;
  
  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 15px;
  }
`;

const SearchForm = styled.form`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 15px;
  align-items: end;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 10px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  color: #ccc;
  font-size: 14px;
  font-weight: 600;
`;

const Select = styled.select`
  padding: 12px 16px;
  background: #2a3441;
  border: 2px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23fff' d='M10.293 0.293a1 1 0 0 1 1.414 1.414l-5 5a1 1 0 0 1-1.414 0l-5-5A1 1 0 0 1 1.707.293L6 4.586 10.293.293z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: #ffc900;
  }

  &:hover {
    border-color: #666;
  }

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const Input = styled.input`
  padding: 12px 16px;
  background: #2a3441;
  border: 2px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #ffc900;
  }

  &:hover {
    border-color: #666;
  }

  &::placeholder {
    color: #888;
  }

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  background: #ffc900;
  color: #000;
  border: 3px solid #000;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #000;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 0 #000;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (max-width: 1024px) {
    grid-column: 1 / -1;
  }

  @media (max-width: 768px) {
    width: 100%;
    font-size: 16px;
  }
`;

const ResultsSection = styled.div`
  background: #fff;
  border: 3px solid #000;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 0 #000;

  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 12px;
  }
`;

const ResultsTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #000;

  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 18px;
`;

const NumbersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
  }
`;

const NumberCard = styled.div`
  background: #f8f9fa;
  border: 3px solid #000;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #000;
  }
  
  @media (max-width: 768px) {
    padding: 15px;
    border-radius: 10px;
  }
`;

const NumberHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 15px;
`;

const PhoneNumber = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #000;
  display: flex;
  align-items: center;
  gap: 8px;

  svg {
    color: #ffc900;
  }
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const NumberLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const NumberCapabilities = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const Capability = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => (props.$active ? '#e3f8e8' : '#f0f0f0')};
  color: ${props => (props.$active ? '#2e7d32' : '#999')};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const PriceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 2px solid #e0e0e0;
`;

const PriceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MonthlyFee = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #000;
`;


const BuyButton = styled.button`
  padding: 10px 20px;
  background: #ffc900;
  color: #000;
  border: 3px solid #000;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 #000;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 0 #000;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: #666;
  font-size: 18px;
`;

const InfoBox = styled.div`
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: start;
  gap: 12px;

  svg {
    color: #2196f3;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    margin: 0;
    color: #1976d2;
    font-size: 14px;
    line-height: 1.6;
  }
`;

function BuyPhoneNumber() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [areaCode, setAreaCode] = useState('');
  const [contains, setContains] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [purchasingNumber, setPurchasingNumber] = useState(null);

  // Only US and Canada for phone number purchase
  const countryCodes = [
    { dialCode: '+1', name: 'United States', isoCode: 'US', flag: '🇺🇸' },
    { dialCode: '+1', name: 'Canada', isoCode: 'CA', flag: '🇨🇦' }
  ];

  // Auto-load US numbers on component mount
  useEffect(() => {
    const loadDefaultNumbers = async () => {
      setIsSearching(true);
      setHasSearched(true);
      
      try {
        const params = new URLSearchParams({
          countryCode: 'US',
        });
        
        console.log('📞 Loading default US numbers...');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/phone-numbers/available?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📞 Default US numbers loaded:', data);
          console.log('📞 Raw response data:', data);
          console.log('📞 Available numbers array:', data.availableNumbers);
          console.log('📞 First number structure:', data.availableNumbers?.[0]);
          
          setAvailableNumbers(prev => {
            console.log('Previous:', prev);
            console.log('New:', data.availableNumbers);
            return data.availableNumbers || [];
          });
        } else {
          console.error('Failed to load default numbers');
        }
      } catch (error) {
        console.error('Error loading default numbers:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    loadDefaultNumbers();
  }, []); // Run only once on mount

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        countryCode: selectedCountry,
      });

      if (areaCode) {
        params.append('areaCode', areaCode);
      }
      if (contains) {
        params.append('contains', contains);
      }

      console.log('📞 Searching with params:', Object.fromEntries(params));

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phone-numbers/available?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📞 Phone numbers search response:', data);
        console.log('📞 Raw response data:', data);
        console.log('📞 Available numbers array:', data.availableNumbers);
        console.log('📞 First number structure:', data.availableNumbers?.[0]);
        
        setAvailableNumbers(prev => {
          console.log('Previous:', prev);
          console.log('New:', data.availableNumbers);
          return data.availableNumbers || [];
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Search failed:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to search numbers');
      }
    } catch (error) {
      console.error('Search error:', error);
      setAvailableNumbers([]);
      toast.error(error.message || 'Failed to search for phone numbers. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePurchase = async (number) => {
    setPurchasingNumber(number.phoneNumber);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone-numbers/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumber: number.phoneNumber,
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to purchase phone number');
      }
      toast.success(`Successfully purchased ${number.phoneNumber}!`);
      setTimeout(() => {
        navigate('/phone-numbers');
      }, 2000);
    } catch (error) {
      console.error('Error purchasing phone number:', error);
      toast.error(
        error.response?.data?.error || 'Failed to purchase phone number.'
      );
    } finally {
      setPurchasingNumber(null);
    }
  };

  return (
    <PageContainer>
      <InfoBox>
        <Info size={20} />
        <p>
     Searching for different country? Contact us to get a number from a country not listed above!
        </p>
      </InfoBox>

      <SearchSection>
        <SearchTitle>Click Refresh results to load more</SearchTitle>
        <SearchForm onSubmit={handleSearch}>
          <InputGroup>
            <InputLabel>Country</InputLabel>
            <Select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              {countryCodes.map((country) => (
                <option key={country.isoCode} value={country.isoCode}>
                  {country.flag} {country.name} ({country.dialCode})
                </option>
              ))}
            </Select>
          </InputGroup>
          <InputGroup>
            <InputLabel>Area Code (Optional)</InputLabel>
            <Input
              type="text"
              placeholder="e.g., 415"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              maxLength="5"
            />
          </InputGroup>
          <InputGroup>
            <InputLabel>Contains Digits (Optional)</InputLabel>
            <Input
              type="text"
              placeholder="e.g., 1234"
              value={contains}
              onChange={(e) => setContains(e.target.value)}
              maxLength="10"
            />
          </InputGroup>
          <SearchButton type="submit" disabled={isSearching}>
            <Search size={20} />
            {isSearching ? 'Searching...' : 'Refresh results'}
          </SearchButton>
        </SearchForm>
      </SearchSection>

      <ResultsSection>
        <ResultsTitle>
          {hasSearched
            ? availableNumbers.length > 0
              ? `${availableNumbers.length} Numbers Found`
              : 'No Numbers Found'
            : 'Available Numbers'}
        </ResultsTitle>

        {isSearching ? (
          <LoadingContainer>Searching for available numbers...</LoadingContainer>
        ) : !hasSearched ? (
          <NoResults>
            Search for available phone numbers to get started
          </NoResults>
        ) : availableNumbers?.length === 0 ? (
          <NoResults>
            No numbers found matching your criteria. Try adjusting your search parameters.
          </NoResults>
        ) : (
          <NumbersGrid>
            {availableNumbers.map((number, index) => {
              console.log('Rendering number:', number.phoneNumber || number.phone_number, number);
              return (
              <NumberCard key={number.phoneNumber || number.phone_number || index}>
                <NumberHeader>
                  <div>
                    <PhoneNumber>
                      <Phone size={20} />
                      {number.phoneNumber || number.phone_number || 'Unknown'}
                    </PhoneNumber>
                    <NumberLocation>
                      <MapPin />
                      {number.locality || 'N/A'}, {number.region || 'N/A'}
                    </NumberLocation>
                  </div>
                </NumberHeader>
                <NumberCapabilities>
                  <Capability $active={number.capabilities?.voice}>
                    <Phone size={14} />
                    Voice
                  </Capability>
                  <Capability $active={number.capabilities?.sms}>
                    <MessageSquare size={14} />
                    SMS
                  </Capability>
                </NumberCapabilities>
                <PriceSection>
                  <PriceInfo>
                    <MonthlyFee>${number.monthlyFee || '0.00'}/mo</MonthlyFee>
                  
                  </PriceInfo>
                  <BuyButton
                    onClick={() => handlePurchase(number)}
                    disabled={purchasingNumber === number.phoneNumber}
                  >
                    {purchasingNumber === number.phoneNumber
                      ? 'Purchasing...'
                      : 'Buy'}
                  </BuyButton>
                </PriceSection>
              </NumberCard>
            )})}
          </NumbersGrid>
        )}
      </ResultsSection>
    </PageContainer>
  );
}

export default BuyPhoneNumber;