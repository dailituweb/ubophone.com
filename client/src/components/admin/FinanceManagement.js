import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  DollarSign, 
  CreditCard, 
  Phone, 
  RefreshCw,
  Download,
  Filter,
  PieChart,
  LineChart,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const Container = styled.div`
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #FFC900;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? '#FFC900' : '#ffffff'};
  color: ${props => props.primary ? '#000000' : '#666666'};
  border: 3px solid #000000;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const PeriodButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#FFC900' : '#ffffff'};
  color: ${props => props.active ? '#000000' : '#666666'};
  border: 2px solid #000000;
  border-radius: 0;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? '#FFC900' : '#f8f9fa'};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    height: 6px;
    background: ${props => props.color || '#FFC900'};
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.positive ? '#00aa00' : '#aa0000'};
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RevenueChart = styled.div`
  height: 300px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1rem 0;
  border-bottom: 2px solid #000000;
  margin-bottom: 1rem;
`;

const ChartBar = styled.div`
  flex: 1;
  background: ${props => props.color || '#FFC900'};
  border: 2px solid #000000;
  border-radius: 0;
  height: ${props => props.height}%;
  min-height: 10px;
  position: relative;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ChartLabel = styled.div`
  font-size: 0.7rem;
  color: #666666;
  text-align: center;
  margin-top: 0.5rem;
  font-weight: 600;
`;

const ChartValue = styled.div`
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: #000000;
  background: #ffffff;
  padding: 0.25rem;
  border: 1px solid #000000;
  white-space: nowrap;
`;

const PieChartContainer = styled.div`
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const PieChartElement = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: conic-gradient(
    #4CAF50 0deg ${props => props.callRevenue}deg,
    #2196F3 ${props => props.callRevenue}deg ${props => props.callRevenue + props.rechargeRevenue}deg,
    #FF9800 ${props => props.callRevenue + props.rechargeRevenue}deg 360deg
  );
  border: 3px solid #000000;
  margin-bottom: 1rem;
`;

const PieLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  background: ${props => props.color};
  border: 1px solid #000000;
`;

const TransactionsSection = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
`;

const TransactionsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TransactionsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: #f8f9fa;
  }
`;

const TransactionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const TransactionIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
`;

const TransactionDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TransactionTitle = styled.div`
  font-weight: 600;
  color: #000000;
`;

const TransactionDate = styled.div`
  font-size: 0.8rem;
  color: #666666;
`;

const TransactionAmount = styled.div`
  font-weight: 700;
  color: ${props => props.positive ? '#00aa00' : '#aa0000'};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function FinanceManagement() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [financeData, setFinanceData] = useState({
    overview: {
      totalRevenue: 0,
      callRevenue: 0,
      rechargeRevenue: 0,
      totalTransactions: 0,
      avgTransactionAmount: 0
    },
    trends: [],
    recentTransactions: []
  });

  const periods = [
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' }
  ];

  const fetchFinanceData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/data/finance/overview?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFinanceData(data.data);
      } else {
        console.error('Failed to fetch finance data');
      }
    } catch (error) {
      console.error('Finance data error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchFinanceData();
  }, [selectedPeriod, fetchFinanceData]);

  const handleRefresh = () => {
    fetchFinanceData();
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'recharge':
        return <CreditCard size={20} />;
      case 'call':
        return <Phone size={20} />;
      case 'refund':
        return <ArrowDown size={20} />;
      default:
        return <DollarSign size={20} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'recharge':
        return '#4CAF50';
      case 'call':
        return '#2196F3';
      case 'refund':
        return '#F44336';
      default:
        return '#FFC900';
    }
  };

  const calculatePieChartAngles = () => {
    const total = financeData.overview.totalRevenue;
    if (total === 0) return { callRevenue: 0, rechargeRevenue: 0 };
    
    const callAngle = (financeData.overview.callRevenue / total) * 360;
    const rechargeAngle = (financeData.overview.rechargeRevenue / total) * 360;
    
    return { callRevenue: callAngle, rechargeRevenue: rechargeAngle };
  };

  const pieAngles = calculatePieChartAngles();

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <RefreshCw size={24} />
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Finance Management</Title>
        <HeaderActions>
          <ActionButton onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </ActionButton>
          <ActionButton>
            <Download size={16} />
            Export Report
          </ActionButton>
        </HeaderActions>
      </Header>

      <PeriodSelector>
        {periods.map(period => (
          <PeriodButton
            key={period.id}
            active={selectedPeriod === period.id}
            onClick={() => handlePeriodChange(period.id)}
          >
            {period.label}
          </PeriodButton>
        ))}
      </PeriodSelector>

      <StatsGrid>
        <StatCard color="#4CAF50">
          <StatHeader>
            <StatIcon color="#4CAF50">
              <DollarSign size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{formatCurrency(financeData.overview.totalRevenue)}</StatValue>
          <StatLabel>Total Revenue</StatLabel>
          <StatChange positive>
            <ArrowUp size={12} />
            +12.5% from last period
          </StatChange>
        </StatCard>

        <StatCard color="#2196F3">
          <StatHeader>
            <StatIcon color="#2196F3">
              <Phone size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{formatCurrency(financeData.overview.callRevenue)}</StatValue>
          <StatLabel>Call Revenue</StatLabel>
          <StatChange positive>
            <ArrowUp size={12} />
            +8.3% from last period
          </StatChange>
        </StatCard>

        <StatCard color="#FF9800">
          <StatHeader>
            <StatIcon color="#FF9800">
              <CreditCard size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{formatCurrency(financeData.overview.rechargeRevenue)}</StatValue>
          <StatLabel>Recharge Revenue</StatLabel>
          <StatChange positive>
            <ArrowUp size={12} />
            +15.7% from last period
          </StatChange>
        </StatCard>

        <StatCard color="#9C27B0">
          <StatHeader>
            <StatIcon color="#9C27B0">
              <PieChart size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{financeData.overview.totalTransactions}</StatValue>
          <StatLabel>Total Transactions</StatLabel>
          <StatChange positive>
            <ArrowUp size={12} />
            +6.2% from last period
          </StatChange>
        </StatCard>

        <StatCard color="#607D8B">
          <StatHeader>
            <StatIcon color="#607D8B">
              <LineChart size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{formatCurrency(financeData.overview.avgTransactionAmount)}</StatValue>
          <StatLabel>Avg Transaction</StatLabel>
          <StatChange>
            <ArrowUp size={12} />
            +2.1% from last period
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ChartsSection>
        <ChartContainer>
          <ChartTitle>
            <LineChart size={20} />
            Revenue Trends
          </ChartTitle>
          <RevenueChart>
            {financeData.trends && financeData.trends.length > 0 ? (
              financeData.trends.map((trend, index) => {
                const maxRevenue = Math.max(...financeData.trends.map(t => t.revenue));
                const height = maxRevenue > 0 ? (trend.revenue / maxRevenue) * 100 : 10;
                
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ChartBar height={height} color="#4CAF50">
                      <ChartValue>{formatCurrency(trend.revenue)}</ChartValue>
                    </ChartBar>
                    <ChartLabel>
                      {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </ChartLabel>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: '#666666'
              }}>
                <LineChart size={48} />
                <span style={{ marginLeft: '1rem' }}>No data available</span>
              </div>
            )}
          </RevenueChart>
        </ChartContainer>

        <ChartContainer>
          <ChartTitle>
            <PieChart size={20} />
            Revenue Breakdown
          </ChartTitle>
          <PieChartContainer>
            <PieChartElement 
              callRevenue={pieAngles.callRevenue}
              rechargeRevenue={pieAngles.rechargeRevenue}
            />
            <PieLegend>
              <LegendItem>
                <LegendColor color="#4CAF50" />
                <span>Call Revenue ({formatCurrency(financeData.overview.callRevenue)})</span>
              </LegendItem>
              <LegendItem>
                <LegendColor color="#2196F3" />
                <span>Recharge Revenue ({formatCurrency(financeData.overview.rechargeRevenue)})</span>
              </LegendItem>
              <LegendItem>
                <LegendColor color="#FF9800" />
                <span>Other ({formatCurrency(financeData.overview.totalRevenue - financeData.overview.callRevenue - financeData.overview.rechargeRevenue)})</span>
              </LegendItem>
            </PieLegend>
          </PieChartContainer>
        </ChartContainer>
      </ChartsSection>

      <TransactionsSection>
        <TransactionsHeader>
          <ChartTitle>
            <CreditCard size={20} />
            Recent Transactions
          </ChartTitle>
          <ActionButton>
            <Filter size={16} />
            Filter
          </ActionButton>
        </TransactionsHeader>
        
        <TransactionsList>
          {financeData.recentTransactions && financeData.recentTransactions.length > 0 ? (
            financeData.recentTransactions.map((transaction, index) => (
              <TransactionItem key={index}>
                <TransactionInfo>
                  <TransactionIcon color={getTransactionColor(transaction.type)}>
                    {getTransactionIcon(transaction.type)}
                  </TransactionIcon>
                  <TransactionDetails>
                    <TransactionTitle>{transaction.description}</TransactionTitle>
                    <TransactionDate>{formatDate(transaction.createdAt)}</TransactionDate>
                  </TransactionDetails>
                </TransactionInfo>
                <TransactionAmount positive={transaction.amount > 0}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </TransactionAmount>
              </TransactionItem>
            ))
          ) : (
            <TransactionItem>
              <TransactionInfo>
                <TransactionIcon color="#666666">
                  <DollarSign size={20} />
                </TransactionIcon>
                <TransactionDetails>
                  <TransactionTitle>No recent transactions</TransactionTitle>
                  <TransactionDate>Transactions will appear here</TransactionDate>
                </TransactionDetails>
              </TransactionInfo>
            </TransactionItem>
          )}
        </TransactionsList>
      </TransactionsSection>
    </Container>
  );
}

export default FinanceManagement; 