import React, { memo } from 'react';
import styled from 'styled-components';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatusSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8f9fa;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e9ecef;
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }
`;

const BalanceIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #FFC900;
  border: 2px solid #000;
  border-radius: 0;
`;

const BalanceInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const BalanceAmount = styled.div`
  font-size: 1.1rem;
  font-weight: 800;
  color: #0a0f2f;
`;

const BalanceLabel = styled.div`
  font-size: 0.75rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
`;

const TopUpButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;

  &:hover {
    background: #e6b400;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
  }
`;

const BalanceDisplay = memo(({ balance, isLoading = false }) => {
  const navigate = useNavigate();

  const handleTopUp = () => {
    navigate('/buy-credits');
  };

  const formatBalance = (amount) => {
    if (isLoading) return '...';
    if (typeof amount !== 'number') return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  const getBalanceStatus = (amount) => {
    if (isLoading) return 'Loading...';
    if (amount < 1) return 'Low Balance';
    if (amount < 5) return 'Balance OK';
    return 'Good Balance';
  };

  return (
    <StatusSection>
      <BalanceContainer>
        <BalanceIcon>
          <CreditCard size={16} color="#0a0f2f" />
        </BalanceIcon>
        <BalanceInfo>
          <BalanceAmount>{formatBalance(balance)}</BalanceAmount>
          <BalanceLabel>{getBalanceStatus(balance)}</BalanceLabel>
        </BalanceInfo>
      </BalanceContainer>
      
      <TopUpButton onClick={handleTopUp}>
        Top Up
        <ArrowRight size={14} />
      </TopUpButton>
    </StatusSection>
  );
});

BalanceDisplay.displayName = 'BalanceDisplay';

export default BalanceDisplay;
