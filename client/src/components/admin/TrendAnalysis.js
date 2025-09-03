import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  TrendingUp, 
  BarChart3, 
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AnalysisContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.cardBackground};
  border: 3px solid ${props => props.$theme.borderColor};
  border-radius: 0;
  padding: 1.5rem;
  height: 100%;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0f2f;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 2px solid #000;
  border-radius: 0;
  font-weight: 600;
  background: white;
  color: #0a0f2f;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    background: #FFC900;
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.5rem;
    min-width: 100px;
  }
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$variant', '$loading'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return '#FFC900';
      case 'secondary': return '#f8fafc';
      default: return 'white';
    }
  }};
  border: 2px solid #000;
  border-radius: 0;
  font-weight: 600;
  color: #0a0f2f;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.$loading ? 'none' : 'translate(-1px, -1px)'};
    box-shadow: ${props => props.$loading ? 'none' : '1px 1px 0 #000'};
  }

  svg {
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
    
    span {
      display: none;
    }
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  @media (max-width: 768px) {
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
`;

const ChartCard = styled.div`
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #0a0f2f;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }
`;

const TrendGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const TrendCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$trend'].includes(prop),
})`
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid ${props => props.$trend === 'up' ? '#10b981' : props.$trend === 'down' ? '#ef4444' : '#6b7280'};

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const TrendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const TrendLabel = styled.div`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const TrendIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$trend'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${props => props.$trend === 'up' ? '#10b981' : props.$trend === 'down' ? '#ef4444' : '#6b7280'};
`;

const TrendValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const TrendSubtext = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '0.75rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        border: 'none'
      }}>
        <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Mock data - in production, this would come from your API
const generateMockData = (days = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: Math.floor(Math.random() * 500) + 200,
      calls: Math.floor(Math.random() * 800) + 300,
      revenue: Math.floor(Math.random() * 5000) + 2000,
      duration: Math.floor(Math.random() * 10000) + 5000
    });
  }
  
  return data;
};


function TrendAnalysis() {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('30d');
  const [chartType, setChartType] = useState('line');
  const [isLoading, setIsLoading] = useState(false);
  const [trends, setTrends] = useState({});

  const fetchTrendData = useCallback(async (selectedPeriod = period) => {
    setIsLoading(true);
    try {
      // In production, fetch from your API
      // const headers = adminAuthService.getAuthHeaders();
      // const response = await fetch(`/api/admin/dashboard/trends?period=${selectedPeriod}`, { headers });
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const mockData = generateMockData(days);
      setChartData(mockData);
      
      // Calculate trends
      if (mockData.length >= 2) {
        const latest = mockData[mockData.length - 1];
        const previous = mockData[mockData.length - 2];
        
        setTrends({
          users: {
            current: latest.users,
            change: ((latest.users - previous.users) / previous.users * 100).toFixed(1),
            trend: latest.users > previous.users ? 'up' : 'down'
          },
          calls: {
            current: latest.calls,
            change: ((latest.calls - previous.calls) / previous.calls * 100).toFixed(1),
            trend: latest.calls > previous.calls ? 'up' : 'down'
          },
          revenue: {
            current: latest.revenue,
            change: ((latest.revenue - previous.revenue) / previous.revenue * 100).toFixed(1),
            trend: latest.revenue > previous.revenue ? 'up' : 'down'
          },
          duration: {
            current: latest.duration,
            change: ((latest.duration - previous.duration) / previous.duration * 100).toFixed(1),
            trend: latest.duration > previous.duration ? 'up' : 'down'
          }
        });
      }
      
    } catch (error) {
      console.error('Trend data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetchTrendData(newPeriod);
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Users', 'Calls', 'Revenue', 'Duration'],
      ...chartData.map(item => [
        item.date,
        item.users,
        item.calls,
        item.revenue,
        item.duration
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trend_analysis_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="users" stackId="1" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.3)" name="Users" />
            <Area type="monotone" dataKey="calls" stackId="1" stroke="#10b981" fill="rgba(16, 185, 129, 0.3)" name="Calls" />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#f59e0b" fill="rgba(245, 158, 11, 0.3)" name="Revenue" />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="users" fill="#3b82f6" name="Users" />
            <Bar dataKey="calls" fill="#10b981" name="Calls" />
            <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" />
          </BarChart>
        );
      
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="displayDate" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Users" />
            <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Calls" />
            <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} name="Revenue" />
          </LineChart>
        );
    }
  };

  return (
    <AnalysisContainer $theme={theme}>
      <Header>
        <Title>
          <TrendingUp size={24} />
          Trend Analysis
        </Title>
        <Controls>
          <Select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </Select>
          <Select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
          </Select>
          <Button onClick={() => fetchTrendData()} $loading={isLoading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>
          <Button onClick={handleExport} $variant="secondary">
            <Download size={16} />
            <span>Export</span>
          </Button>
        </Controls>
      </Header>

      <ChartGrid>
        <ChartCard style={{ position: 'relative' }}>
          {isLoading && (
            <LoadingOverlay>
              <div>Loading trend data...</div>
            </LoadingOverlay>
          )}
          <ChartTitle>
            <BarChart3 size={20} />
            Performance Trends
          </ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            {renderChart()}
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>
            <Info size={20} />
            Key Insights
          </ChartTitle>
          <TrendGrid>
            {Object.entries(trends).map(([key, data]) => (
              <TrendCard key={key} $trend={data.trend}>
                <TrendHeader>
                  <TrendLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</TrendLabel>
                  <TrendIndicator $trend={data.trend}>
                    {data.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(data.change)}%
                  </TrendIndicator>
                </TrendHeader>
                <TrendValue>
                  {key === 'revenue' ? `$${data.current?.toLocaleString()}` :
                   key === 'duration' ? `${Math.floor(data.current / 60)}m` :
                   data.current?.toLocaleString()}
                </TrendValue>
                <TrendSubtext>
                  vs. previous period
                </TrendSubtext>
              </TrendCard>
            ))}
          </TrendGrid>
        </ChartCard>
      </ChartGrid>
    </AnalysisContainer>
  );
}

export default TrendAnalysis;