import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Phone, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useDashboardData } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import CallHistory from '../components/CallHistory';

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
  }
`;



const StatsGrid = styled.div`
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
    background: #FFC900;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;

    &::before {
      opacity: 1;
    }
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const IconWrapper = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 0;
  background: #FFC900;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
  }
`;

const StatContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 0.25rem;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

// 骨架屏组件
const SkeletonStatCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 201, 0, 0.2), transparent);
    transform: translateX(-100%);
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const SkeletonIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 0;
  background: #f0f0f0;
  border: 3px solid #ddd;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
  }
`;

const SkeletonContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SkeletonLine = styled.div`
  height: ${props => props.height || '16px'};
  background: #f0f0f0;
  border-radius: 0;
  width: ${props => props.width || '100%'};
`;


const CallHistoryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;


// 优化的统计卡片组件，使用 React.memo 防止不必要的重渲染
const StatCardComponent = React.memo(({ icon, value, label, isLoading }) => (
  isLoading ? (
    <SkeletonStatCard>
      <SkeletonIcon />
      <SkeletonContent>
        <SkeletonLine height="32px" width="60%" />
        <SkeletonLine height="16px" width="80%" />
      </SkeletonContent>
    </SkeletonStatCard>
  ) : (
    <StatCard>
      <IconWrapper>
        {icon}
      </IconWrapper>
      <StatContent>
        <StatValue>{value}</StatValue>
        <StatLabel>{label}</StatLabel>
      </StatContent>
    </StatCard>
  )
));

StatCardComponent.displayName = 'StatCardComponent';

function Dashboard() {
  const { data: dashboardData, isLoading: loading } = useDashboardData();
  
  // Initialize WebSocket for real-time updates
  const { lastMessage } = useWebSocket();
  
  // Log WebSocket activity
  React.useEffect(() => {
    if (lastMessage) {
      console.log('📊 Dashboard received WebSocket message:', lastMessage);
    }
  }, [lastMessage]);

  // Extract stats from API response or use defaults
  const stats = useMemo(() => {
    if (!dashboardData?.summary) {
      return {
        totalCalls: 0,
        totalMinutes: 0,
        totalSpent: 0,
        recentCalls: 0
      };
    }

    return {
      totalCalls: dashboardData.summary.totalCalls || 0,
      totalMinutes: Math.round(dashboardData.summary.totalMinutes || 0),
      totalSpent: dashboardData.summary.totalSpent || 0,
      recentCalls: dashboardData.summary.recentCalls || 0
    };
  }, [dashboardData]);

  // 使用 useMemo 缓存统计卡片数据
  const statCards = useMemo(() => [
    {
      icon: <Phone size={24} />,
      value: stats?.totalCalls || 0,
      label: 'Total Calls'
    },
    {
      icon: <Clock size={24} />,
      value: stats?.totalMinutes || 0,
      label: 'Minutes Talked'
    },
    {
      icon: <DollarSign size={24} />,
      value: `$${(stats?.totalSpent || 0).toFixed(2)}`,
      label: 'Total Spent'
    },
    {
      icon: <TrendingUp size={24} />,
      value: stats?.recentCalls || 0,
      label: 'Calls This Month'
    }
  ], [stats]);

  return (
    <Container>
      <Header>
        <Title>
          Dashboard
        </Title>
      </Header>

      <StatsGrid>
        {statCards.map((card, index) => (
          <StatCardComponent
            key={index}
            icon={card.icon}
            value={card.value}
            label={card.label}
            isLoading={loading}
          />
        ))}
      </StatsGrid>

      {/* 实时显示的 Call History 组件 */}
      <CallHistoryContainer>
        <CallHistory />
      </CallHistoryContainer>
    </Container>
  );
}

export default Dashboard;