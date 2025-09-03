import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Users, 
  Phone, 
  DollarSign, 
  Activity,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Database,
  Server
} from 'lucide-react';
import { toast } from 'react-toastify';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute';
import AdminLayout from '../../components/admin/AdminLayout';
import adminAuthService from '../../services/adminAuthService';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #FAFAFA;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin: 0;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const RefreshButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$loading'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  font-weight: 700;
  color: #0a0f2f;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.$loading ? 'none' : 'translate(-2px, -2px)'};
    box-shadow: ${props => props.$loading ? 'none' : '2px 2px 0 #000'};
  }

  svg {
    animation: ${props => props.$loading ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PeriodSelect = styled.select`
  padding: 0.75rem 1rem;
  border: 3px solid #000;
  border-radius: 0;
  font-weight: 600;
  background: white;
  color: #0a0f2f;
  cursor: pointer;

  &:focus {
    outline: none;
    background: #FFC900;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MetricIconWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$color'].includes(prop),
})`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${props => props.$color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000;
`;

const MetricTrend = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isPositive'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isPositive ? '#059669' : '#dc2626'};
`;

const MetricTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MetricValue = styled.div`
  font-size: 2.25rem;
  font-weight: 800;
  color: #0a0f2f;
  margin: 0;
  line-height: 1;
`;

const MetricSubtext = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.5rem 0 0 0;
`;

const ActivitySection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ActivityCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #0a0f2f;
  margin: 0 0 1rem 0;
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
`;

const ActivityIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$success'].includes(prop),
})`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${props => props.$success ? '#10b981' : '#f59e0b'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityAction = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #0a0f2f;
`;

const ActivityDetails = styled.div`
  font-size: 0.75rem;
  color: #64748b;
`;

const SystemHealthCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
`;

const HealthGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const HealthItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
`;

const HealthStatus = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$status'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => {
    switch (props.$status) {
      case 'healthy': return '#059669';
      case 'warning': return '#d97706';
      case 'critical': return '#dc2626';
      default: return '#64748b';
    }
  }};
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #dc2626;
  font-weight: 600;
  text-align: center;
`;

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = useCallback(async (period = selectedPeriod) => {
    try {
      setIsLoading(true);
      setError(null);

      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch(
        `/api/admin/dashboard/overview?period=${period}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error.message);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handlePeriodChange = (e) => {
    const newPeriod = e.target.value;
    setSelectedPeriod(newPeriod);
    fetchDashboardData(newPeriod);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (error) {
    return (
      <AdminLayout>
        <DashboardContainer>
          <ErrorMessage>
            <AlertCircle size={20} style={{ marginRight: '0.5rem' }} />
            {error}
          </ErrorMessage>
        </DashboardContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <DashboardContainer>
      <Header>
        <Title>Dashboard</Title>
        <Controls>
          <PeriodSelect value={selectedPeriod} onChange={handlePeriodChange}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </PeriodSelect>
          <RefreshButton onClick={handleRefresh} $loading={isLoading}>
            <RefreshCw size={16} />
            Refresh
          </RefreshButton>
        </Controls>
      </Header>

      {dashboardData && (
        <>
          <MetricsGrid>
            <MetricCard>
              <MetricHeader>
                <MetricIconWrapper $color="#3b82f6">
                  <Users size={24} color="white" />
                </MetricIconWrapper>
                <MetricTrend $isPositive={dashboardData.metrics.users.growthRate >= 0}>
                  {dashboardData.metrics.users.growthRate >= 0 ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  {Math.abs(dashboardData.metrics.users.growthRate)}%
                </MetricTrend>
              </MetricHeader>
              <MetricTitle>Total Users</MetricTitle>
              <MetricValue>{formatNumber(dashboardData.metrics.users.total)}</MetricValue>
              <MetricSubtext>
                {dashboardData.metrics.users.new} new users this {selectedPeriod}
              </MetricSubtext>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricIconWrapper $color="#10b981">
                  <Phone size={24} color="white" />
                </MetricIconWrapper>
                <MetricTrend $isPositive={dashboardData.metrics.calls.growthRate >= 0}>
                  {dashboardData.metrics.calls.growthRate >= 0 ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                  {Math.abs(dashboardData.metrics.calls.growthRate)}%
                </MetricTrend>
              </MetricHeader>
              <MetricTitle>Total Calls</MetricTitle>
              <MetricValue>{formatNumber(dashboardData.metrics.calls.total)}</MetricValue>
              <MetricSubtext>
                {formatDuration(dashboardData.metrics.calls.avgDuration)} avg duration
              </MetricSubtext>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricIconWrapper $color="#f59e0b">
                  <DollarSign size={24} color="white" />
                </MetricIconWrapper>
                <MetricTrend $isPositive={true}>
                  <ArrowUpRight size={16} />
                  Revenue
                </MetricTrend>
              </MetricHeader>
              <MetricTitle>Total Revenue</MetricTitle>
              <MetricValue>{formatCurrency(dashboardData.metrics.revenue.total)}</MetricValue>
              <MetricSubtext>
                {formatCurrency(dashboardData.metrics.revenue.inPeriod)} this {selectedPeriod}
              </MetricSubtext>
            </MetricCard>

            <MetricCard>
              <MetricHeader>
                <MetricIconWrapper $color="#8b5cf6">
                  <Activity size={24} color="white" />
                </MetricIconWrapper>
                <MetricTrend $isPositive={true}>
                  <TrendingUp size={16} />
                  Active
                </MetricTrend>
              </MetricHeader>
              <MetricTitle>Active Users</MetricTitle>
              <MetricValue>{formatNumber(dashboardData.metrics.users.active)}</MetricValue>
              <MetricSubtext>
                {((dashboardData.metrics.users.active / dashboardData.metrics.users.total) * 100).toFixed(1)}% of total
              </MetricSubtext>
            </MetricCard>
          </MetricsGrid>

          <ActivitySection>
            <ActivityCard>
              <CardTitle>Recent Activity</CardTitle>
              <ActivityList>
                {dashboardData.recentActivity.map((activity, index) => (
                  <ActivityItem key={index}>
                    <ActivityIcon $success={activity.success}>
                      {activity.success ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </ActivityIcon>
                    <ActivityContent>
                      <ActivityAction>
                        {activity.admin?.name || 'System'} {activity.action} {activity.resource}
                      </ActivityAction>
                      <ActivityDetails>
                        {new Date(activity.timestamp).toLocaleString()}
                      </ActivityDetails>
                    </ActivityContent>
                  </ActivityItem>
                ))}
              </ActivityList>
            </ActivityCard>

            <SystemHealthCard>
              <CardTitle>System Health</CardTitle>
              <HealthGrid>
                <HealthItem>
                  <span>Database</span>
                  <HealthStatus $status="healthy">
                    <Database size={16} />
                    Online
                  </HealthStatus>
                </HealthItem>
                <HealthItem>
                  <span>API Services</span>
                  <HealthStatus $status="healthy">
                    <Server size={16} />
                    Operational
                  </HealthStatus>
                </HealthItem>
                <HealthItem>
                  <span>Payment Processing</span>
                  <HealthStatus $status="healthy">
                    <CheckCircle size={16} />
                    Processing
                  </HealthStatus>
                </HealthItem>
                <HealthItem>
                  <span>Overall Score</span>
                  <HealthStatus $status="healthy">
                    <Activity size={16} />
                    {dashboardData.systemHealth.score}/100
                  </HealthStatus>
                </HealthItem>
              </HealthGrid>
            </SystemHealthCard>
          </ActivitySection>

          {lastUpdated && (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
              <Clock size={14} style={{ marginRight: '0.5rem' }} />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </DashboardContainer>
    </AdminLayout>
  );
}

// Wrap with protection requiring dashboard read permission
export default function ProtectedAdminDashboard() {
  return (
    <AdminProtectedRoute requiredPermissions={[{ resource: 'dashboard', action: 'read' }]}>
      <AdminDashboard />
    </AdminProtectedRoute>
  );
}