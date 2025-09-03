import React from 'react';
import styled from 'styled-components';
import { Filter, Phone, Globe, CreditCard, Package } from 'lucide-react';

const FilterContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  flex: 1;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: ${props => props.active ? '#000' : 'white'};
  color: ${props => props.active ? 'white' : '#000'};
  border: 3px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
    background: ${props => props.active ? '#000' : '#f5f5f5'};
  }

  @media (max-width: 480px) {
    justify-content: center;
    padding: 0.875rem 1rem;
  }
`;

const DateRangeSelect = styled.select`
  padding: 0.75rem 1.25rem;
  background: white;
  color: #000;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
  padding-right: 2.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 0.875rem 1rem;
  }
`;

const BillingFilters = ({ filter, setFilter, dateRange, setDateRange }) => {
  const filters = [
    { id: 'all', label: 'All', icon: Filter },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'numbers', label: 'Numbers', icon: Globe },
    { id: 'credits', label: 'Credits', icon: CreditCard },
    { id: 'subscriptions', label: 'Subscriptions', icon: Package }
  ];

  return (
    <FilterContainer>
      <FilterGroup>
        {filters.map(({ id, label, icon: Icon }) => (
          <FilterButton
            key={id}
            active={filter === id}
            onClick={() => setFilter(id)}
          >
            <Icon size={16} />
            {label}
          </FilterButton>
        ))}
      </FilterGroup>

      <DateRangeSelect 
        value={dateRange} 
        onChange={(e) => setDateRange(e.target.value)}
      >
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="all">All Time</option>
      </DateRangeSelect>
    </FilterContainer>
  );
};

export default BillingFilters;