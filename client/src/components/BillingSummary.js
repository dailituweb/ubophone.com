import React from 'react';
import styled from 'styled-components';
import { DollarSign, Phone, Globe, CreditCard } from 'lucide-react';
import { useBillingSummary } from '../hooks/useApi';

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
`;

const StatCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || '#FFC900'};
  }

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    gap: 0.75rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  }
`;

const IconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: ${props => props.bg || '#FFC900'};
  border: 2px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.625rem;
  }
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: #000;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const BillingSummary = ({ dateRange }) => {
  const { data: summary, loading } = useBillingSummary(dateRange);

  const summaryData = summary || {
    totalSpent: 0,
    callCharges: 0,
    phoneNumbers: 0,
    credits: 0
  };

  return (
    <SummaryGrid>
      <StatCard color="#3B82F6">
        <IconWrapper bg="#DBEAFE">
          <DollarSign size={24} />
        </IconWrapper>
        <StatContent>
          <StatLabel>Total Spent</StatLabel>
          <StatValue>${loading ? '...' : summaryData.totalSpent.toFixed(2)}</StatValue>
        </StatContent>
      </StatCard>

      <StatCard color="#10B981">
        <IconWrapper bg="#D1FAE5">
          <Phone size={24} />
        </IconWrapper>
        <StatContent>
          <StatLabel>Call Charges</StatLabel>
          <StatValue>${loading ? '...' : summaryData.callCharges.toFixed(2)}</StatValue>
        </StatContent>
      </StatCard>

      <StatCard color="#F59E0B">
        <IconWrapper bg="#FEF3C7">
          <Globe size={24} />
        </IconWrapper>
        <StatContent>
          <StatLabel>Phone Numbers</StatLabel>
          <StatValue>${loading ? '...' : summaryData.phoneNumbers.toFixed(2)}</StatValue>
        </StatContent>
      </StatCard>

      <StatCard color="#22C55E">
        <IconWrapper bg="#BBF7D0">
          <CreditCard size={24} />
        </IconWrapper>
        <StatContent>
          <StatLabel>Credits Left</StatLabel>
          <StatValue>${loading ? '...' : summaryData.credits.toFixed(2)}</StatValue>
        </StatContent>
      </StatCard>
    </SummaryGrid>
  );
};

export default BillingSummary;