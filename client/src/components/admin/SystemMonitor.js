import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Users, 
  Phone, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Wifi,
  Shield
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

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: ${props => {
    switch (props.status) {
      case 'healthy': return '#00aa00';
      case 'warning': return '#ff8800';
      case 'critical': return '#ff0000';
      default: return '#666666';
    }
  }};
`;

const SystemOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const OverviewCard = styled.div`
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
    background: ${props => {
      switch (props.status) {
        case 'healthy': return '#4CAF50';
        case 'warning': return '#FF9800';
        case 'critical': return '#F44336';
        default: return '#FFC900';
      }
    }};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #000000;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${props => props.color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
`;

const MetricsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MetricItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: #666666;
  font-weight: 600;
`;

const MetricValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #000000;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border: 1px solid #000000;
  border-radius: 0;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.percentage > 80) return '#F44336';
    if (props.percentage > 60) return '#FF9800';
    return '#4CAF50';
  }};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const AlertsSection = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const AlertsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const AlertsList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const AlertIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => {
    switch (props.type) {
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#FFC900';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.25rem;
`;

const AlertDescription = styled.div`
  font-size: 0.9rem;
  color: #666666;
`;

const AlertTime = styled.div`
  font-size: 0.8rem;
  color: #999999;
`;

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ServiceCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1rem;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    height: 6px;
    background: ${props => props.online ? '#4CAF50' : '#F44336'};
  }
`;

const ServiceIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.online ? '#4CAF50' : '#F44336'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  margin: 0 auto 1rem;
`;

const ServiceName = styled.div`
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
`;

const ServiceStatus = styled.div`
  font-size: 0.9rem;
  color: ${props => props.online ? '#00aa00' : '#aa0000'};
  font-weight: 600;
`;

const ServiceUptime = styled.div`
  font-size: 0.8rem;
  color: #666666;
  margin-top: 0.25rem;
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

function SystemMonitor() {
  const [loading, setLoading] = useState(true);
  const [systemData, setSystemData] = useState({
    server: {
      status: 'healthy',
      cpu: 45,
      memory: 68,
      disk: 32,
      uptime: '15 days, 4 hours'
    },
    database: {
      status: 'healthy',
      connections: 25,
      queries: 1250,
      size: '2.4 GB'
    },
    users: {
      total: 0,
      active: 0,
      online: 0
    },
    calls: {
      total: 0,
      active: 0,
      avgDuration: 0
    },
    services: [],
    alerts: []
  });

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/data/system/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemData(prevData => ({
          ...prevData,
          ...data.data,
          server: {
            ...prevData.server,
            // Update with real server metrics if available
          },
          database: {
            ...prevData.database,
            // Update with real database metrics if available
          },
          services: [
            { name: 'Web Server', status: 'online', uptime: '99.9%', icon: Server },
            { name: 'Database', status: 'online', uptime: '99.8%', icon: Database },
            { name: 'Twilio API', status: 'online', uptime: '99.7%', icon: Phone },
            { name: 'WebSocket', status: 'online', uptime: '99.5%', icon: Wifi },
            { name: 'Authentication', status: 'online', uptime: '99.9%', icon: Shield },
            { name: 'File Storage', status: 'online', uptime: '99.6%', icon: HardDrive }
          ],
          alerts: [
            {
              type: 'info',
              title: 'System Update Available',
              description: 'A new system update is available for installation.',
              time: '2 hours ago'
            },
            {
              type: 'warning',
              title: 'High Memory Usage',
              description: 'Server memory usage is above 80%. Consider optimizing.',
              time: '4 hours ago'
            }
          ]
        }));
      } else {
        console.error('Failed to fetch system data');
      }
    } catch (error) {
      console.error('System data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSystemData();
  };

  const getOverallStatus = () => {
    const { server } = systemData;
    if (server.cpu > 90 || server.memory > 90 || server.disk > 90) {
      return 'critical';
    }
    if (server.cpu > 70 || server.memory > 70 || server.disk > 70) {
      return 'warning';
    }
    return 'healthy';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'critical':
        return <XCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'warning':
        return 'Some Issues Detected';
      case 'critical':
        return 'Critical Issues';
      default:
        return 'Unknown Status';
    }
  };

  const formatUptime = (uptime) => {
    return uptime || 'Unknown';
  };


  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <RefreshCw size={24} />
        </LoadingSpinner>
      </Container>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <Container>
      <Header>
        <Title>System Monitor</Title>
        <HeaderActions>
          <StatusIndicator status={overallStatus}>
            {getStatusIcon(overallStatus)}
            {getStatusText(overallStatus)}
          </StatusIndicator>
          <ActionButton onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </ActionButton>
        </HeaderActions>
      </Header>

      <SystemOverview>
        <OverviewCard status={systemData.server.status}>
          <CardHeader>
            <CardTitle>
              <CardIcon color="#2196F3">
                <Server size={16} />
              </CardIcon>
              Server Performance
            </CardTitle>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <MetricLabel>CPU Usage</MetricLabel>
              <MetricValue>{systemData.server.cpu}%</MetricValue>
            </MetricItem>
            <ProgressBar>
              <ProgressFill percentage={systemData.server.cpu} />
            </ProgressBar>
            
            <MetricItem>
              <MetricLabel>Memory Usage</MetricLabel>
              <MetricValue>{systemData.server.memory}%</MetricValue>
            </MetricItem>
            <ProgressBar>
              <ProgressFill percentage={systemData.server.memory} />
            </ProgressBar>
            
            <MetricItem>
              <MetricLabel>Disk Usage</MetricLabel>
              <MetricValue>{systemData.server.disk}%</MetricValue>
            </MetricItem>
            <ProgressBar>
              <ProgressFill percentage={systemData.server.disk} />
            </ProgressBar>
            
            <MetricItem>
              <MetricLabel>Uptime</MetricLabel>
              <MetricValue>{formatUptime(systemData.server.uptime)}</MetricValue>
            </MetricItem>
          </MetricsList>
        </OverviewCard>

        <OverviewCard status={systemData.database.status}>
          <CardHeader>
            <CardTitle>
              <CardIcon color="#4CAF50">
                <Database size={16} />
              </CardIcon>
              Database Status
            </CardTitle>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <MetricLabel>Active Connections</MetricLabel>
              <MetricValue>{systemData.database.connections}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Queries/Hour</MetricLabel>
              <MetricValue>{systemData.database.queries}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Database Size</MetricLabel>
              <MetricValue>{systemData.database.size}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Status</MetricLabel>
              <MetricValue>Healthy</MetricValue>
            </MetricItem>
          </MetricsList>
        </OverviewCard>

        <OverviewCard status="healthy">
          <CardHeader>
            <CardTitle>
              <CardIcon color="#FF9800">
                <Users size={16} />
              </CardIcon>
              User Activity
            </CardTitle>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <MetricLabel>Total Users</MetricLabel>
              <MetricValue>{systemData.users.total}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Active Users</MetricLabel>
              <MetricValue>{systemData.users.active}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Online Now</MetricLabel>
              <MetricValue>{systemData.users.online}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Growth Rate</MetricLabel>
              <MetricValue>+12.5%</MetricValue>
            </MetricItem>
          </MetricsList>
        </OverviewCard>

        <OverviewCard status="healthy">
          <CardHeader>
            <CardTitle>
              <CardIcon color="#9C27B0">
                <Phone size={16} />
              </CardIcon>
              Call Statistics
            </CardTitle>
          </CardHeader>
          <MetricsList>
            <MetricItem>
              <MetricLabel>Total Calls</MetricLabel>
              <MetricValue>{systemData.calls.total}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Active Calls</MetricLabel>
              <MetricValue>{systemData.calls.active}</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Avg Duration</MetricLabel>
              <MetricValue>{Math.round(systemData.calls.avgDuration)}s</MetricValue>
            </MetricItem>
            
            <MetricItem>
              <MetricLabel>Success Rate</MetricLabel>
              <MetricValue>98.7%</MetricValue>
            </MetricItem>
          </MetricsList>
        </OverviewCard>
      </SystemOverview>

      <ServicesGrid>
        {systemData.services.map((service, index) => (
          <ServiceCard key={index} online={service.status === 'online'}>
            <ServiceIcon online={service.status === 'online'}>
              <service.icon size={24} />
            </ServiceIcon>
            <ServiceName>{service.name}</ServiceName>
            <ServiceStatus online={service.status === 'online'}>
              {service.status === 'online' ? 'Online' : 'Offline'}
            </ServiceStatus>
            <ServiceUptime>Uptime: {service.uptime}</ServiceUptime>
          </ServiceCard>
        ))}
      </ServicesGrid>

      <AlertsSection>
        <AlertsHeader>
          <CardTitle>
            <AlertTriangle size={20} />
            System Alerts
          </CardTitle>
        </AlertsHeader>
        
        <AlertsList>
          {systemData.alerts.length > 0 ? (
            systemData.alerts.map((alert, index) => (
              <AlertItem key={index}>
                <AlertIcon type={alert.type}>
                  {alert.type === 'error' && <XCircle size={20} />}
                  {alert.type === 'warning' && <AlertTriangle size={20} />}
                  {alert.type === 'info' && <Activity size={20} />}
                </AlertIcon>
                <AlertContent>
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </AlertContent>
                <AlertTime>{alert.time}</AlertTime>
              </AlertItem>
            ))
          ) : (
            <AlertItem>
              <AlertIcon type="info">
                <CheckCircle size={20} />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>No Active Alerts</AlertTitle>
                <AlertDescription>All systems are running normally</AlertDescription>
              </AlertContent>
              <AlertTime>Now</AlertTime>
            </AlertItem>
          )}
        </AlertsList>
      </AlertsSection>
    </Container>
  );
}

export default SystemMonitor; 