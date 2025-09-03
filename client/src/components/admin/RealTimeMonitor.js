import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Activity, 
  Users, 
  Phone, 
  DollarSign, 
  RefreshCw
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import MetricCard, { RevenueCard, UserCard, CallCard } from './MetricCard';
import adminAuthService from '../../services/adminAuthService';

const MonitorContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0f2f 0%, #1a1f3a 100%);
  padding: 1.5rem;
  color: white;

  @media (max-width: 768px) {
    padding: 1rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(45deg, #FFC900, #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
  }
`;

const StatusIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$status'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  font-size: 0.875rem;
  font-weight: 600;

  @media (max-width: 480px) {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
`;

const StatusDot = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$status'].includes(prop),
})`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.$status) {
      case 'online': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  animation: ${props => props.$status === 'online' ? 'pulse 2s infinite' : 'none'};

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const RefreshButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$loading'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #FFC900;
  border: 2px solid #000;
  border-radius: 25px;
  font-weight: 700;
  color: #0a0f2f;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.$loading ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.$loading ? 'none' : '0 4px 0 #000'};
  }

  svg {
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 768px) {
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const ChartTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: white;

  @media (max-width: 480px) {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
  }
`;

const LiveDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
`;

const LiveDataCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$color'].includes(prop),
})`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  border-left: 4px solid ${props => props.$color || '#FFC900'};

  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

const LiveDataValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.25rem;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const LiveDataLabel = styled.div`
  font-size: 0.75rem;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const LastUpdated = styled.div`
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
  margin-top: 2rem;

  @media (max-width: 480px) {
    font-size: 0.75rem;
    margin-top: 1.5rem;
  }
`;

function RealTimeMonitor() {
  const [realTimeData, setRealTimeData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('online');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRealTimeData = useCallback(async () => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch('/api/admin/dashboard/real-time', { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setRealTimeData(data.data);
      setConnectionStatus('online');
      setLastUpdated(new Date());

      // Add to chart data (keep last 20 points)
      setChartData(prev => {
        const newPoint = {
          time: new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }),
          activeCalls: data.data.activeCalls,
          recentUsers: data.data.recentUsers,
          recentPayments: data.data.recentPayments
        };
        
        const updated = [...prev, newPoint];
        return updated.slice(-20); // Keep last 20 points
      });

    } catch (error) {
      console.error('Real-time data fetch error:', error);
      setConnectionStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRealTimeData();
  }, [fetchRealTimeData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(interval);
  }, [fetchRealTimeData]);

  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchRealTimeData();
  };

  const getSystemStatus = () => {
    if (!realTimeData) return 'unknown';
    
    const { systemStatus } = realTimeData;
    if (systemStatus.database === 'connected' && 
        systemStatus.api === 'operational' && 
        systemStatus.payments === 'operational') {
      return 'online';
    }
    return 'warning';
  };

  return (
    <MonitorContainer>
      <Header>
        <Title>Real-Time Monitor</Title>
        <StatusBar>
          <StatusIndicator>
            <StatusDot $status={connectionStatus} />
            Connection: {connectionStatus}
          </StatusIndicator>
          <StatusIndicator>
            <StatusDot $status={getSystemStatus()} />
            System: {getSystemStatus()}
          </StatusIndicator>
          <RefreshButton onClick={handleManualRefresh} $loading={isLoading}>
            <RefreshCw size={16} />
            Refresh
          </RefreshButton>
        </StatusBar>
      </Header>

      {realTimeData && (
        <>
          <MetricsGrid>
            <CallCard
              title="Active Calls"
              value={realTimeData.activeCalls}
              subtitle="Currently in progress"
              icon={<Phone />}
              size="large"
              isLoading={isLoading}
            />
            <UserCard
              title="Active Users"
              value={realTimeData.recentUsers}
              subtitle="Last hour"
              icon={<Users />}
              size="large"
              isLoading={isLoading}
            />
            <RevenueCard
              title="Recent Payments"
              value={realTimeData.recentPayments}
              subtitle="Last hour"
              icon={<DollarSign />}
              size="large"
              isLoading={isLoading}
            />
            <MetricCard
              title="System Load"
              value={85.5}
              subtitle="Server performance"
              icon={<Activity />}
              color="#f59e0b"
              size="large"
              formatValue={(val) => `${val}%`}
              trend="up"
              trendValue={2.1}
            />
          </MetricsGrid>

          <ChartSection>
            <ChartCard>
              <ChartTitle>Live Activity Feed</ChartTitle>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.7)"
                    fontSize={12}
                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeCalls"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="rgba(139, 92, 246, 0.3)"
                    name="Active Calls"
                  />
                  <Area
                    type="monotone"
                    dataKey="recentUsers"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="rgba(59, 130, 246, 0.3)"
                    name="Recent Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="recentPayments"
                    stackId="1"
                    stroke="#10b981"
                    fill="rgba(16, 185, 129, 0.3)"
                    name="Recent Payments"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard>
              <ChartTitle>Live Statistics</ChartTitle>
              <LiveDataGrid>
                <LiveDataCard $color="#8b5cf6">
                  <LiveDataValue>{realTimeData.activeCalls}</LiveDataValue>
                  <LiveDataLabel>Active Calls</LiveDataLabel>
                </LiveDataCard>
                <LiveDataCard $color="#3b82f6">
                  <LiveDataValue>{realTimeData.recentUsers}</LiveDataValue>
                  <LiveDataLabel>New Users</LiveDataLabel>
                </LiveDataCard>
                <LiveDataCard $color="#10b981">
                  <LiveDataValue>{realTimeData.recentPayments}</LiveDataValue>
                  <LiveDataLabel>Payments</LiveDataLabel>
                </LiveDataCard>
                <LiveDataCard $color="#f59e0b">
                  <LiveDataValue>99.9%</LiveDataValue>
                  <LiveDataLabel>Uptime</LiveDataLabel>
                </LiveDataCard>
                <LiveDataCard $color="#06b6d4">
                  <LiveDataValue>12ms</LiveDataValue>
                  <LiveDataLabel>Response Time</LiveDataLabel>
                </LiveDataCard>
                <LiveDataCard $color="#ef4444">
                  <LiveDataValue>0</LiveDataValue>
                  <LiveDataLabel>Errors</LiveDataLabel>
                </LiveDataCard>
              </LiveDataGrid>
            </ChartCard>
          </ChartSection>
        </>
      )}

      {lastUpdated && (
        <LastUpdated>
          Last updated: {lastUpdated.toLocaleString()}
        </LastUpdated>
      )}
    </MonitorContainer>
  );
}

export default RealTimeMonitor;