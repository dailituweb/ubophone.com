import React, { memo, useState } from 'react';
import styled from 'styled-components';
import { X, ShoppingCart, Search } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #FFC900;
  border-bottom: 3px solid #000;
`;

const ModalTitle = styled.h2`
  color: #0a0f2f;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(10, 15, 47, 0.1);
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const SearchSection = styled.div`
  margin-bottom: 2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const SearchButton = styled.button`
  background: #0a0f2f;
  color: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1a1f3f;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const NumbersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
`;

const NumberItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #000;
  border-radius: 0;
  background: #f8f9fa;
`;

const NumberInfo = styled.div`
  flex: 1;
`;

const NumberDisplay = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.25rem;
`;

const NumberDetails = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const PurchaseButton = styled.button`
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e6b400;
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

// 模拟可用号码数据
const mockAvailableNumbers = [
  {
    phoneNumber: '+1234567890',
    locality: 'New York, NY',
    region: 'NY',
    capabilities: { voice: true, sms: true, mms: true },
    cost: '$1.00/month'
  },
  {
    phoneNumber: '+1987654321',
    locality: 'Los Angeles, CA',
    region: 'CA',
    capabilities: { voice: true, sms: true, mms: false },
    cost: '$1.00/month'
  },
  {
    phoneNumber: '+1555123456',
    locality: 'Chicago, IL',
    region: 'IL',
    capabilities: { voice: true, sms: true, mms: true },
    cost: '$1.00/month'
  }
];

const NumberPurchaseModal = memo(({ 
  isOpen, 
  onClose, 
  onPurchase 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    
    // 模拟API调用
    setTimeout(() => {
      setAvailableNumbers(mockAvailableNumbers);
      setIsSearching(false);
    }, 1000);
  };

  const handlePurchase = async (number) => {
    setIsPurchasing(true);
    
    try {
      await onPurchase({
        phoneNumber: number.phoneNumber,
        locality: number.locality,
        region: number.region,
        capabilities: number.capabilities
      });
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatCapabilities = (capabilities) => {
    const caps = [];
    if (capabilities.voice) caps.push('Voice');
    if (capabilities.sms) caps.push('SMS');
    if (capabilities.mms) caps.push('MMS');
    return caps.join(', ');
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Purchase Phone Number</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <SearchSection>
            <SearchInput
              type="text"
              placeholder="Enter area code or city (e.g., 212, New York)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <SearchButton 
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
            >
              <Search size={16} style={{ marginRight: '0.5rem' }} />
              {isSearching ? 'Searching...' : 'Search Numbers'}
            </SearchButton>
          </SearchSection>

          <NumbersList>
            {isSearching ? (
              <LoadingState>Searching for available numbers...</LoadingState>
            ) : availableNumbers.length === 0 ? (
              <EmptyState>
                <p>Enter a search term to find available phone numbers.</p>
              </EmptyState>
            ) : (
              availableNumbers.map((number, index) => (
                <NumberItem key={index}>
                  <NumberInfo>
                    <NumberDisplay>{number.phoneNumber}</NumberDisplay>
                    <NumberDetails>
                      {number.locality} • {formatCapabilities(number.capabilities)} • {number.cost}
                    </NumberDetails>
                  </NumberInfo>
                  
                  <PurchaseButton
                    onClick={() => handlePurchase(number)}
                    disabled={isPurchasing}
                  >
                    <ShoppingCart size={14} style={{ marginRight: '0.25rem' }} />
                    {isPurchasing ? 'Purchasing...' : 'Purchase'}
                  </PurchaseButton>
                </NumberItem>
              ))
            )}
          </NumbersList>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
});

NumberPurchaseModal.displayName = 'NumberPurchaseModal';

export default NumberPurchaseModal;
