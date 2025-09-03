import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BillingSummary from '../components/BillingSummary';
import BillingFilters from '../components/BillingFilters';
import BillingHistory from '../components/BillingHistory';

const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background: #FAFAFA;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem calc(80px + env(safe-area-inset-bottom)) 0.25rem;
    min-height: calc(100vh - 60px);
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
    gap: 0.5rem;
  }
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1rem;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const BillingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Container>
      <Header>
        <Title>
          <DollarSign size={40} />
          Billing & Usage
        </Title>
        <Subtitle>Track your spending and usage history</Subtitle>
      </Header>

      <BillingSummary dateRange={dateRange} />
      
      <BillingFilters 
        filter={filter}
        setFilter={setFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      
      <BillingHistory 
        filter={filter}
        dateRange={dateRange}
      />
    </Container>
  );
};

export default BillingPage;