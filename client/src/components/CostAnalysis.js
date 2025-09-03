import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  DollarSign, 
  TrendingUp, 
  Phone, 
  Clock, 
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  background: #FAFAFA;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 0.5rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.25rem;
`;

const PeriodButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#FFC900' : 'transparent'};
  color: #0a0f2f;
  border: none;
  border-radius: 0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? '#FFC900' : '#f5f5f5'};
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SummaryCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 0 4px 0 #000;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 0 #000;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const CardTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CardIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.color || '#FFC900'};
  border: 2px solid #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a0f2f;
`;

const CardValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const CardSubtext = styled.div`
  font-size: 0.875rem;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PhoneNumbersList = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 0 4px 0 #000;
`;

const ListHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ListTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0a0f2f;
  margin: 0;
`;

const PhoneNumberItem = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;

  &:hover {
    background: #f8f8f8;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const PhoneInfo = styled.div`
  flex: 1;
`;

const PhoneNumber = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.25rem;
`;

const PhoneLabel = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const PhoneCosts = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;

const TotalCost = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
  color: #0a0f2f;
`;

const CostBreakdown = styled.div`
  font-size: 0.75rem;
  color: #666;
  display: flex;
  gap: 1rem;
`;

const UtilizationBar = styled.div`
  width: 80px;
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const UtilizationFill = styled.div`
  width: ${props => props.percentage}%;
  height: 100%;
  background: ${props => {
    if (props.percentage < 20) return '#ef4444';
    if (props.percentage < 50) return '#f59e0b';
    return '#10b981';
  }};
  transition: width 0.3s ease;
`;

const RecommendationsPanel = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 0 4px 0 #000;
`;

const RecommendationItem = styled.div`
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const RecommendationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const PriorityBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${props => {
    switch (props.priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  }};
  color: white;
  border: 2px solid #000;
`;

const RecommendationTitle = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #0a0f2f;
`;

const RecommendationDescription = styled.div`
  font-size: 0.875rem;
  color: #666;
  line-height: 1.4;
`;

const SavingsAmount = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #10b981;
  margin-top: 0.5rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #666;
  font-size: 1.125rem;
  gap: 1rem;
`;

function CostAnalysis() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  const fetchCostAnalysis = useCallback(async (selectedPeriod = period) => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/phone-numbers/cost-analysis?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Failed to fetch cost analysis');
      }
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      toast.error('Error loading cost analysis');
    } finally {
      setLoading(false);
    }
  }, [user?.token, period]);

  useEffect(() => {
    if (user) {
      fetchCostAnalysis();
    }
  }, [user, fetchCostAnalysis]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchCostAnalysis(newPeriod);
  };

  if (!user) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Please login to view cost analysis</h2>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <BarChart3 className="animate-spin" size={24} />
          <span>Loading cost analysis...</span>
        </LoadingSpinner>
      </Container>
    );
  }

  if (!data || data.summary.totalNumbers === 0) {
    return (
      <Container>
        <Header>
          <Title>
            <DollarSign size={32} />
            Cost Analysis
          </Title>
        </Header>
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', border: '3px solid #000' }}>
          <Phone size={64} color="#666" />
          <h3 style={{ marginTop: '1rem', color: '#0a0f2f' }}>No Phone Numbers Found</h3>
          <p style={{ color: '#666' }}>Purchase some phone numbers to view cost analysis.</p>
        </div>
      </Container>
    );
  }

  const { summary, phoneNumbers, recommendations } = data;

  return (
    <Container>
      <Header>
        <Title>
          <DollarSign size={32} />
          Cost Analysis
        </Title>
        <PeriodSelector>
          <PeriodButton 
            active={period === 'month'} 
            onClick={() => handlePeriodChange('month')}
          >
            This Month
          </PeriodButton>
          <PeriodButton 
            active={period === 'year'} 
            onClick={() => handlePeriodChange('year')}
          >
            This Year
          </PeriodButton>
          <PeriodButton 
            active={period === '30days'} 
            onClick={() => handlePeriodChange('30days')}
          >
            Last 30 Days
          </PeriodButton>
        </PeriodSelector>
      </Header>

      <SummaryGrid>
        <SummaryCard>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
            <CardIcon color="#ef4444">
              <DollarSign size={20} />
            </CardIcon>
          </CardHeader>
          <CardValue>${summary.totalCost.toFixed(2)}</CardValue>
          <CardSubtext>
            Monthly: ${summary.totalMonthlyCost.toFixed(2)} | Calls: ${summary.totalCallCost.toFixed(2)}
          </CardSubtext>
        </SummaryCard>

        <SummaryCard>
          <CardHeader>
            <CardTitle>Active Numbers</CardTitle>
            <CardIcon color="#10b981">
              <Phone size={20} />
            </CardIcon>
          </CardHeader>
          <CardValue>{summary.activeNumbers}</CardValue>
          <CardSubtext>
            of {summary.totalNumbers} total numbers
          </CardSubtext>
        </SummaryCard>

        <SummaryCard>
          <CardHeader>
            <CardTitle>Total Usage</CardTitle>
            <CardIcon color="#f59e0b">
              <Clock size={20} />
            </CardIcon>
          </CardHeader>
          <CardValue>{summary.totalMinutes}</CardValue>
          <CardSubtext>
            minutes across {summary.totalCalls} calls
          </CardSubtext>
        </SummaryCard>

        <SummaryCard>
          <CardHeader>
            <CardTitle>Avg Cost/Number</CardTitle>
            <CardIcon color="#8b5cf6">
              <TrendingUp size={20} />
            </CardIcon>
          </CardHeader>
          <CardValue>${summary.averageCostPerNumber.toFixed(2)}</CardValue>
          <CardSubtext>
            Utilization: {summary.averageUtilization.toFixed(1)}%
          </CardSubtext>
        </SummaryCard>
      </SummaryGrid>

      <MainContent>
        <PhoneNumbersList>
          <ListHeader>
            <BarChart3 size={24} />
            <ListTitle>Numbers Cost Breakdown</ListTitle>
          </ListHeader>
          {phoneNumbers.map((phone) => (
            <PhoneNumberItem key={phone.id}>
              <PhoneInfo>
                <PhoneNumber>{phone.phoneNumber}</PhoneNumber>
                <PhoneLabel>
                  {phone.label || phone.type} • {phone.usage.totalCalls} calls • {phone.usage.totalMinutes} min
                </PhoneLabel>
                <UtilizationBar>
                  <UtilizationFill percentage={phone.usage.utilizationRate} />
                </UtilizationBar>
              </PhoneInfo>
              <PhoneCosts>
                <TotalCost>${phone.costs.totalCost.toFixed(2)}</TotalCost>
                <CostBreakdown>
                  <span>Monthly: ${phone.costs.monthlyFeeProrated.toFixed(2)}</span>
                  <span>Calls: ${phone.costs.callCost.toFixed(2)}</span>
                </CostBreakdown>
              </PhoneCosts>
            </PhoneNumberItem>
          ))}
        </PhoneNumbersList>

        <RecommendationsPanel>
          <ListHeader>
            <Lightbulb size={24} />
            <ListTitle>Optimization Tips</ListTitle>
          </ListHeader>
          {recommendations.length === 0 ? (
            <RecommendationItem>
              <RecommendationDescription>
                Great! Your phone number usage is optimized. No recommendations at this time.
              </RecommendationDescription>
            </RecommendationItem>
          ) : (
            recommendations.map((rec, index) => (
              <RecommendationItem key={index}>
                <RecommendationHeader>
                  <PriorityBadge priority={rec.priority}>
                    {rec.priority}
                  </PriorityBadge>
                  <RecommendationTitle>{rec.title}</RecommendationTitle>
                </RecommendationHeader>
                <RecommendationDescription>
                  {rec.description}
                </RecommendationDescription>
                {rec.potentialSavings && (
                  <SavingsAmount>
                    Potential savings: ${rec.potentialSavings.toFixed(2)}/month
                  </SavingsAmount>
                )}
              </RecommendationItem>
            ))
          )}
        </RecommendationsPanel>
      </MainContent>
    </Container>
  );
}

export default CostAnalysis;