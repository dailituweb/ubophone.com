import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  BarChart3, 
  Globe, 
  Activity, 
  Monitor,
  TrendingUp,
  Users,
  Phone,
  DollarSign,
  Clock,
  Minimize2
} from 'lucide-react';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute';
import AdminLayout from '../../components/admin/AdminLayout';
import { RevenueCard, UserCard, CallCard, TimeCard } from '../../components/admin/MetricCard';
import RealTimeMonitor from '../../components/admin/RealTimeMonitor';
import GeographicHeatmap from '../../components/admin/GeographicHeatmap';
import TrendAnalysis from '../../components/admin/TrendAnalysis';
import { useTheme } from '../../context/ThemeContext';
import adminAuthService from '../../services/adminAuthService';

const AnalyticsContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  min-height: 100vh;
  background: ${props => props.$theme.background};
  padding: 2rem;

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

const Title = styled.h1.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.$theme.primaryText};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const ViewControls = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    width: 100%;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const ViewButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$active', '$variant', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => {
    if (props.$active) return props.$theme.accent;
    return props.$variant === 'danger' ? '#ef4444' : props.$theme.cardBackground;
  }};
  border: 3px solid ${props => props.$theme.borderColor};
  border-radius: 0;
  font-weight: 700;
  color: ${props => props.$variant === 'danger' ? 'white' : props.$theme.primaryText};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 ${props => props.$theme.borderColor};
  }

  @media (max-width: 480px) {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    
    span {
      display: none;
    }
  }
`;

const MetricsOverview = styled.div`
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

const VisualizationGrid = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$view'].includes(prop),
})`
  display: grid;
  gap: 2rem;
  
  ${props => {
    switch (props.$view) {
      case 'realtime':
        return 'grid-template-columns: 1fr;';
      case 'geographic':
        return 'grid-template-columns: 1fr;';
      case 'trends':
        return 'grid-template-columns: 1fr;';
      case 'split':
        return `
          grid-template-columns: 1fr 1fr;
          @media (max-width: 1024px) {
            grid-template-columns: 1fr;
          }
        `;
      default:
        return `
          grid-template-columns: 1fr;
          grid-template-rows: auto auto auto;
        `;
    }
  }}

  @media (max-width: 768px) {
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    gap: 1rem;
  }
`;

const FullscreenOverlay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible'].includes(prop),
})`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 10000;
  display: ${props => props.$visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FullscreenContent = styled.div`
  width: 100%;
  height: 100%;
  max-width: 100vw;
  max-height: 100vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const FullscreenHeader = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10001;
`;

const CloseButton = styled.button`
  background: rgba(0, 0, 0, 0.8);
  border: none;
  color: white;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
  font-size: 1.125rem;
`;

function AdminAnalytics() {
  const { theme } = useTheme();
  const [currentView, setCurrentView] = useState('overview');
  const [fullscreenComponent, setFullscreenComponent] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const headers = adminAuthService.getAuthHeaders();
        const response = await fetch('/api/admin/dashboard/overview', { headers });
        
        if (response.ok) {
          const data = await response.json();
          setOverviewData(data.data);
        }
      } catch (error) {
        console.error('Overview data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  const openFullscreen = (component) => {
    setFullscreenComponent(component);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setFullscreenComponent(null);
    document.body.style.overflow = 'auto';
  };

  const renderOverviewMetrics = () => {
    if (isLoading) {
      return (
        <LoadingMessage>Loading analytics data...</LoadingMessage>
      );
    }

    if (!overviewData) {
      return (
        <LoadingMessage>Unable to load analytics data</LoadingMessage>
      );
    }

    const metrics = [
      {
        key: 'users',
        component: (
          <UserCard
            title="Total Users"
            value={overviewData.metrics.users.total}
            subtitle={`${overviewData.metrics.users.new} new this ${overviewData.period}`}
            icon={<Users />}
            trend="up"
            trendValue={overviewData.metrics.users.growthRate}
            onClick={() => openFullscreen('trends')}
          />
        )
      },
      {
        key: 'calls',
        component: (
          <CallCard
            title="Total Calls"
            value={overviewData.metrics.calls.total}
            subtitle={`${overviewData.metrics.calls.inPeriod} this ${overviewData.period}`}
            icon={<Phone />}
            trend={overviewData.metrics.calls.growthRate >= 0 ? 'up' : 'down'}
            trendValue={overviewData.metrics.calls.growthRate}
            onClick={() => openFullscreen('realtime')}
          />
        )
      },
      {
        key: 'revenue',
        component: (
          <RevenueCard
            title="Total Revenue"
            value={overviewData.metrics.revenue.total}
            subtitle={`$${overviewData.metrics.revenue.inPeriod.toLocaleString()} this ${overviewData.period}`}
            icon={<DollarSign />}
            trend="up"
            onClick={() => openFullscreen('trends')}
          />
        )
      },
      {
        key: 'duration',
        component: (
          <TimeCard
            title="Call Duration"
            value={overviewData.metrics.calls.totalMinutes * 60}
            subtitle={`Avg: ${Math.floor(overviewData.metrics.calls.avgDuration / 60)}m`}
            icon={<Clock />}
            onClick={() => openFullscreen('trends')}
          />
        )
      }
    ];

    return metrics.map(metric => (
      <div key={metric.key}>
        {metric.component}
      </div>
    ));
  };

  const renderVisualization = () => {
    switch (currentView) {
      case 'realtime':
        return <RealTimeMonitor />;
      
      case 'geographic':
        return <GeographicHeatmap />;
      
      case 'trends':
        return <TrendAnalysis />;
      
      case 'split':
        return (
          <>
            <GeographicHeatmap />
            <TrendAnalysis />
          </>
        );
      
      default:
        return (
          <>
            <RealTimeMonitor />
            <GeographicHeatmap />
            <TrendAnalysis />
          </>
        );
    }
  };

  const renderFullscreenContent = () => {
    switch (fullscreenComponent) {
      case 'realtime':
        return <RealTimeMonitor />;
      case 'geographic':
        return <GeographicHeatmap />;
      case 'trends':
        return <TrendAnalysis />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <AnalyticsContainer $theme={theme}>
        <Header>
          <Title $theme={theme}>Analytics Dashboard</Title>
          <ViewControls>
            <ViewButton 
              $active={currentView === 'overview'} 
              $theme={theme}
              onClick={() => setCurrentView('overview')}
            >
              <BarChart3 size={16} />
              <span>Overview</span>
            </ViewButton>
            <ViewButton 
              $active={currentView === 'realtime'} 
              $theme={theme}
              onClick={() => setCurrentView('realtime')}
            >
              <Activity size={16} />
              <span>Real-time</span>
            </ViewButton>
            <ViewButton 
              $active={currentView === 'geographic'} 
              $theme={theme}
              onClick={() => setCurrentView('geographic')}
            >
              <Globe size={16} />
              <span>Geographic</span>
            </ViewButton>
            <ViewButton 
              $active={currentView === 'trends'} 
              $theme={theme}
              onClick={() => setCurrentView('trends')}
            >
              <TrendingUp size={16} />
              <span>Trends</span>
            </ViewButton>
            <ViewButton 
              $active={currentView === 'split'} 
              $theme={theme}
              onClick={() => setCurrentView('split')}
            >
              <Monitor size={16} />
              <span>Split View</span>
            </ViewButton>
          </ViewControls>
        </Header>

      {currentView === 'overview' && (
        <MetricsOverview>
          {renderOverviewMetrics()}
        </MetricsOverview>
      )}

      <VisualizationGrid $view={currentView}>
        {renderVisualization()}
      </VisualizationGrid>

      <FullscreenOverlay $visible={!!fullscreenComponent}>
        <FullscreenContent>
          <FullscreenHeader>
            <CloseButton onClick={closeFullscreen}>
              <Minimize2 size={20} />
            </CloseButton>
          </FullscreenHeader>
          {renderFullscreenContent()}
        </FullscreenContent>
      </FullscreenOverlay>
    </AnalyticsContainer>
    </AdminLayout>
  );
}

// Wrap with protection requiring analytics read permission
export default function ProtectedAdminAnalytics() {
  return (
    <AdminProtectedRoute requiredPermissions={[{ resource: 'analytics', action: 'read' }]}>
      <AdminAnalytics />
    </AdminProtectedRoute>
  );
}