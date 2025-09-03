import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Phone,
  Calendar,
  Globe,
  Users,
  Zap,
  Activity,
  Volume2,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const AnalyticsContainer = styled.div`
  padding: 2rem;
  background: #ffffff;
  min-height: 100vh;
  color: #000000;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #FFC900;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Subtitle = styled.p`
  color: #9ca3af;
  font-size: 1.125rem;
`;

const DateRange = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const DateInput = styled.input`
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  color: #000000;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #FFC900;
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
  transition: all 0.3s ease;

  &:hover {
    background: #ffffff;
    border-color: #FFC900;
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0;
  background: #FFC900;
  color: #0a0f2f;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #9ca3af;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatChange = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.positive ? '#FFC900' : '#ef4444'};
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ChartCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 2rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #FFC900;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const SimpleChart = styled.div`
  width: 100%;
  height: 300px;
  display: flex;
  align-items: end;
  justify-content: space-around;
  padding: 1rem 0;
  border-bottom: 3px solid #000000;
  position: relative;
`;

const ChartBar = styled.div`
  width: 40px;
  background: #FFC900;
  border-radius: 0;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background: #0a0f2f;
  }
`;

const ChartLabel = styled.div`
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
`;

const ChartValue = styled.div`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #FFC900;
  font-weight: 600;
  text-align: center;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
`;

const InsightCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
`;

const InsightTitle = styled.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: #FFC900;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InsightList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const InsightItem = styled.li`
  padding: 0.75rem 0;
  border-bottom: 3px solid #000000;
  display: flex;
  justify-content: between;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const InsightLabel = styled.span`
  color: #e5e7eb;
`;

const InsightValue = styled.span`
  color: #FFC900;
  font-weight: 600;
`;

const QualityIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  
  ${props => {
    switch (props.level) {
      case 'excellent':
        return 'background: #FFC900; color: #0a0f2f;';
      case 'good':
        return 'background: #FFC900; color: #0a0f2f;';
      case 'fair':
        return 'background: rgba(251, 191, 36, 0.2); color: #fbbf24;';
      case 'poor':
        return 'background: rgba(239, 68, 68, 0.2); color: #ef4444;';
      default:
        return 'background: rgba(156, 163, 175, 0.2); color: #9ca3af;';
    }
  }}
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  
  &::after {
    content: '';
    width: 3rem;
    height: 3rem;
    border: 3px solid #000000;
    border-top: 3px solid #FFC900;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

function CallAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const response = await fetch(`/api/analytics/detailed?${params}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // 如果API不存在，使用模拟数据
        setAnalytics(generateMockAnalytics());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // 使用模拟数据
      setAnalytics(generateMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalytics = () => {
    return {
      overview: {
        totalCalls: 127,
        totalDuration: 3840, // seconds
        totalCost: 76.80,
        averageCallDuration: 180,
        successRate: 94.5,
        recordingsCount: 98
      },
      trends: {
        callVolume: [
          { date: '2024-01-01', calls: 12 },
          { date: '2024-01-02', calls: 18 },
          { date: '2024-01-03', calls: 15 },
          { date: '2024-01-04', calls: 22 },
          { date: '2024-01-05', calls: 19 },
          { date: '2024-01-06', calls: 25 },
          { date: '2024-01-07', calls: 16 }
        ],
        previousPeriod: {
          totalCalls: 98,
          totalCost: 62.40
        }
      },
      quality: {
        averageMos: 4.2,
        distribution: {
          excellent: 45,
          good: 38,
          fair: 12,
          poor: 5
        }
      },
      geographical: {
        countries: [
          { country: 'United States', calls: 68, cost: 41.20 },
          { country: 'Canada', calls: 23, cost: 13.80 },
          { country: 'United Kingdom', calls: 18, cost: 12.60 },
          { country: 'Australia', calls: 12, cost: 8.40 },
          { country: 'China', calls: 6, cost: 3.60 }
        ]
      },
      insights: {
        peakHours: [
          { hour: '09:00', calls: 15 },
          { hour: '14:00', calls: 22 },
          { hour: '16:00', calls: 18 }
        ],
        averageWaitTime: 3.2,
        dropRate: 5.5,
        customerSatisfaction: 4.3
      }
    };
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getQualityLevel = (mos) => {
    if (mos >= 4.0) return 'excellent';
    if (mos >= 3.5) return 'good';
    if (mos >= 2.5) return 'fair';
    return 'poor';
  };

  if (!user) {
    return (
      <AnalyticsContainer>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Please login to view call analytics</h2>
        </div>
      </AnalyticsContainer>
    );
  }

  if (loading) {
    return (
      <AnalyticsContainer>
        <Header>
          <Title>
            <BarChart3 size={40} />
            Call Analytics
          </Title>
        </Header>
        <LoadingSpinner />
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <Header>
        <Title>
          <BarChart3 size={40} />
          Call Analytics
        </Title>
        <Subtitle>Detailed insights into your call performance and quality</Subtitle>
      </Header>

      <DateRange>
        <span style={{ color: '#9ca3af' }}>Date Range:</span>
        <DateInput
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <span style={{ color: '#9ca3af' }}>to</span>
        <DateInput
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </DateRange>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon>
              <Phone size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{analytics?.overview?.totalCalls || 0}</StatValue>
          <StatLabel>Total Calls</StatLabel>
          {analytics?.trends?.previousPeriod && (
            <StatChange positive={analytics.overview.totalCalls > analytics.trends.previousPeriod.totalCalls}>
              <TrendingUp size={14} />
              {((analytics.overview.totalCalls - analytics.trends.previousPeriod.totalCalls) / analytics.trends.previousPeriod.totalCalls * 100).toFixed(1)}%
            </StatChange>
          )}
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon>
              <Clock size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{formatDuration(analytics?.overview?.totalDuration || 0)}</StatValue>
          <StatLabel>Total Duration</StatLabel>
          <StatChange positive={true}>
            <Activity size={14} />
            Avg: {formatDuration(analytics?.overview?.averageCallDuration || 0)}
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon>
              <DollarSign size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>${(analytics?.overview?.totalCost || 0).toFixed(2)}</StatValue>
          <StatLabel>Total Cost</StatLabel>
          {analytics?.trends?.previousPeriod && (
            <StatChange positive={false}>
              <TrendingUp size={14} />
              ${((analytics.overview.totalCost - analytics.trends.previousPeriod.totalCost)).toFixed(2)}
            </StatChange>
          )}
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon>
              <Zap size={24} />
            </StatIcon>
          </StatHeader>
          <StatValue>{(analytics?.overview?.successRate || 0).toFixed(1)}%</StatValue>
          <StatLabel>Success Rate</StatLabel>
          <StatChange positive={true}>
            <TrendingUp size={14} />
            High quality
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>
            <BarChart3 size={20} />
            Call Volume Trend
          </ChartTitle>
          <SimpleChart>
            {analytics?.trends?.callVolume?.map((item, index) => (
              <ChartBar
                key={index}
                style={{ height: `${(item.calls / 25) * 100}%` }}
              >
                <ChartValue>{item.calls}</ChartValue>
                <ChartLabel>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}</ChartLabel>
              </ChartBar>
            ))}
          </SimpleChart>
        </ChartCard>

        <ChartCard>
          <ChartTitle>
            <Volume2 size={20} />
            Call Quality Distribution
          </ChartTitle>
          <div style={{ padding: '2rem 0' }}>
            {analytics?.quality?.distribution && Object.entries(analytics.quality.distribution).map(([level, count]) => (
              <div key={level} style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <QualityIndicator level={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </QualityIndicator>
                <span style={{ color: '#FFC900', fontWeight: '600' }}>{count} calls</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FFC900' }}>
              {analytics?.quality?.averageMos?.toFixed(1)} MOS
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Average Quality Score
            </div>
          </div>
        </ChartCard>
      </ChartsGrid>

      <InsightsGrid>
        <InsightCard>
          <InsightTitle>
            <Globe size={20} />
            Geographic Distribution
          </InsightTitle>
          <InsightList>
            {analytics?.geographical?.countries?.slice(0, 5).map((country, index) => (
              <InsightItem key={index}>
                <InsightLabel>{country.country}</InsightLabel>
                <div>
                  <InsightValue>{country.calls} calls</InsightValue>
                  <span style={{ color: '#9ca3af', marginLeft: '0.5rem' }}>
                    ${country.cost.toFixed(2)}
                  </span>
                </div>
              </InsightItem>
            ))}
          </InsightList>
        </InsightCard>

        <InsightCard>
          <InsightTitle>
            <Users size={20} />
            Performance Insights
          </InsightTitle>
          <InsightList>
            <InsightItem>
              <InsightLabel>Average Wait Time</InsightLabel>
              <InsightValue>{analytics?.insights?.averageWaitTime?.toFixed(1)}s</InsightValue>
            </InsightItem>
            <InsightItem>
              <InsightLabel>Drop Rate</InsightLabel>
              <InsightValue>{analytics?.insights?.dropRate?.toFixed(1)}%</InsightValue>
            </InsightItem>
            <InsightItem>
              <InsightLabel>Customer Satisfaction</InsightLabel>
              <InsightValue>{analytics?.insights?.customerSatisfaction?.toFixed(1)}/5.0</InsightValue>
            </InsightItem>
            <InsightItem>
              <InsightLabel>Recordings Captured</InsightLabel>
              <InsightValue>{analytics?.overview?.recordingsCount || 0}</InsightValue>
            </InsightItem>
          </InsightList>
        </InsightCard>

        <InsightCard>
          <InsightTitle>
            <Calendar size={20} />
            Peak Call Hours
          </InsightTitle>
          <InsightList>
            {analytics?.insights?.peakHours?.map((hour, index) => (
              <InsightItem key={index}>
                <InsightLabel>{hour.hour}</InsightLabel>
                <InsightValue>{hour.calls} calls</InsightValue>
              </InsightItem>
            ))}
          </InsightList>
        </InsightCard>
      </InsightsGrid>
    </AnalyticsContainer>
  );
}

export default CallAnalytics; 