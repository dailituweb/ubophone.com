import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Users, 
  Phone, 
  DollarSign, 
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  BarChart3,
  LineChart
} from 'lucide-react';
import UserManagement from '../components/admin/UserManagement';
import CallRecordsManagement from '../components/admin/CallRecordsManagement';
import FinanceManagement from '../components/admin/FinanceManagement';
import SystemMonitor from '../components/admin/SystemMonitor';

const Container = styled.div`
  min-height: 100vh;
  background: #0a0f2f;
  color: #ffffff;
`;

const Header = styled.div`
  background: #000000;
  border-bottom: 3px solid #FFC900;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFC900;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const AdminInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ffffff;
`;

const ActionButton = styled.button`
  background: ${props => props.danger ? '#ff4444' : '#FFC900'};
  color: ${props => props.danger ? '#ffffff' : '#000000'};
  border: 3px solid #000000;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const MainContent = styled.div`
  display: flex;
  min-height: calc(100vh - 80px);
`;

const Sidebar = styled.div`
  width: 250px;
  background: #000000;
  border-right: 3px solid #FFC900;
  padding: 2rem 0;
`;

const SidebarItem = styled.div`
  padding: 1rem 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: ${props => props.active ? '#000000' : '#ffffff'};
  background: ${props => props.active ? '#FFC900' : 'transparent'};
  border-left: ${props => props.active ? '5px solid #000000' : '5px solid transparent'};
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? '#FFC900' : 'rgba(255, 201, 0, 0.1)'};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const PageTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #FFC900;
  margin-bottom: 2rem;
  border-bottom: 3px solid #FFC900;
  padding-bottom: 0.5rem;
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

const StatValue = styled.div`
  font-size: 2.5rem;
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
  margin-top: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${props => props.positive ? '#00aa00' : '#aa0000'};
`;

const ChartContainer = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 1rem;
  border-bottom: 2px solid #FFC900;
  padding-bottom: 0.5rem;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const QuickActionCard = styled.div`
  background: #FFC900;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
`;

const QuickActionIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #000000;
`;

const QuickActionText = styled.div`
  font-weight: 600;
  color: #000000;
`;

const RecentActivity = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eeeeee;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.color || '#FFC900'};
  border: 2px solid #000000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityText = styled.div`
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.25rem;
`;

const ActivityTime = styled.div`
  font-size: 0.8rem;
  color: #666666;
`;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  const formatTimeAgo = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/data/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdminInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminInfo(data.admin);
      }
    } catch (error) {
      console.error('Admin info error:', error);
    }
  }, []);

  const fetchRecentActivity = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch recent users, calls, and system events
      const [usersResponse, callsResponse, systemResponse] = await Promise.all([
        fetch('/api/admin/data/users?limit=5&sortBy=createdAt&sortOrder=DESC', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/data/calls?limit=5&sortBy=createdAt&sortOrder=DESC', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/admin/data/system/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      const activities = [];

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        usersData.data.users.slice(0, 2).forEach(user => {
          activities.push({
            icon: Users,
            color: '#4CAF50',
            text: `New user registered: ${user.username}`,
            time: formatTimeAgo(user.createdAt)
          });
        });
      }

      if (callsResponse.ok) {
        const callsData = await callsResponse.json();
        callsData.data.calls.slice(0, 2).forEach(call => {
          activities.push({
            icon: Phone,
            color: '#2196F3',
            text: `Call ${call.status}: ${call.toNumber || call.fromNumber}`,
            time: formatTimeAgo(call.createdAt)
          });
        });
      }

      if (systemResponse.ok) {
        activities.push({
          icon: Activity,
          color: '#FF9800',
          text: 'System stats updated',
          time: formatTimeAgo(new Date())
        });
      }

      // Sort by time and take most recent
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activities.slice(0, 5));

    } catch (error) {
      console.error('Recent activity error:', error);
    }
  }, [formatTimeAgo]);

  useEffect(() => {
    fetchDashboardData();
    fetchAdminInfo();
    fetchRecentActivity();
  }, [fetchDashboardData, fetchAdminInfo, fetchRecentActivity]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // 即使出错也要清除token
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'calls', label: 'Call Records', icon: Phone },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'system', label: 'System Monitor', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <Container>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem',
          color: '#FFC900'
        }}>
          Loading...
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Logo>UboPhone Admin Dashboard</Logo>
        <HeaderActions>
          {adminInfo && (
            <AdminInfo>
              <span>{adminInfo.username}</span>
              <span>({adminInfo.role})</span>
            </AdminInfo>
          )}
          <ActionButton onClick={handleLogout} danger>
            <LogOut size={16} />
            Logout
          </ActionButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <Sidebar>
          {sidebarItems.map(item => (
            <SidebarItem
              key={item.id}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon />
              {item.label}
            </SidebarItem>
          ))}
        </Sidebar>

        <ContentArea>
          {activeTab === 'dashboard' && (
            <>
              <PageTitle>Dashboard Overview</PageTitle>
              
              <StatsGrid>
                <StatCard color="#4CAF50">
                  <StatValue>{dashboardData?.overview?.totalUsers || 0}</StatValue>
                  <StatLabel>Total Users</StatLabel>
                  <StatChange positive>
                    <TrendingUp size={14} />
                    +{dashboardData?.overview?.newUsersToday || 0} today
                  </StatChange>
                </StatCard>

                <StatCard color="#2196F3">
                  <StatValue>{dashboardData?.overview?.totalCalls || 0}</StatValue>
                  <StatLabel>Total Calls</StatLabel>
                  <StatChange positive>
                    <TrendingUp size={14} />
                    +{dashboardData?.overview?.callsToday || 0} today
                  </StatChange>
                </StatCard>

                <StatCard color="#FF9800">
                  <StatValue>${dashboardData?.overview?.totalRevenue?.toFixed(2) || '0.00'}</StatValue>
                  <StatLabel>Total Revenue</StatLabel>
                  <StatChange positive>
                    <TrendingUp size={14} />
                    +${dashboardData?.overview?.revenueToday?.toFixed(2) || '0.00'} today
                  </StatChange>
                </StatCard>

                <StatCard color="#9C27B0">
                  <StatValue>{dashboardData?.overview?.activeUsers || 0}</StatValue>
                  <StatLabel>Active Users</StatLabel>
                  <StatChange positive>
                    <CheckCircle size={14} />
                    Online
                  </StatChange>
                </StatCard>
              </StatsGrid>

              <ChartContainer>
                <ChartTitle>7-Day Trends</ChartTitle>
                {dashboardData?.trends && dashboardData.trends.length > 0 ? (
                  <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0' }}>
                    {dashboardData.trends.map((trend, index) => (
                      <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: '#666666', marginBottom: '0.5rem' }}>
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2196F3', marginBottom: '0.25rem' }}>
                          {trend.calls}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#FF9800' }}>
                          ${trend.revenue.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    height: '200px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#666666'
                  }}>
                    <LineChart size={48} />
                    <span style={{ marginLeft: '1rem' }}>Loading chart data...</span>
                  </div>
                )}
              </ChartContainer>

              <QuickActionsGrid>
                <QuickActionCard onClick={() => setActiveTab('users')}>
                  <QuickActionIcon><Users size={32} /></QuickActionIcon>
                  <QuickActionText>User Management</QuickActionText>
                </QuickActionCard>

                <QuickActionCard onClick={() => setActiveTab('calls')}>
                  <QuickActionIcon><Phone size={32} /></QuickActionIcon>
                  <QuickActionText>Call Records</QuickActionText>
                </QuickActionCard>

                <QuickActionCard onClick={() => setActiveTab('finance')}>
                  <QuickActionIcon><DollarSign size={32} /></QuickActionIcon>
                  <QuickActionText>Finance</QuickActionText>
                </QuickActionCard>

                <QuickActionCard onClick={() => setActiveTab('system')}>
                  <QuickActionIcon><Activity size={32} /></QuickActionIcon>
                  <QuickActionText>System Monitor</QuickActionText>
                </QuickActionCard>
              </QuickActionsGrid>

              <RecentActivity>
                <ChartTitle>Recent Activity</ChartTitle>
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <ActivityItem key={index}>
                      <ActivityIcon color={activity.color}>
                        <activity.icon size={20} />
                      </ActivityIcon>
                      <ActivityContent>
                        <ActivityText>{activity.text}</ActivityText>
                        <ActivityTime>{activity.time}</ActivityTime>
                      </ActivityContent>
                    </ActivityItem>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666666' }}>
                    <Clock size={32} />
                    <div style={{ marginTop: '0.5rem' }}>No recent activity</div>
                  </div>
                )}
              </RecentActivity>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <PageTitle>User Management</PageTitle>
              <UserManagement />
            </>
          )}

          {activeTab === 'calls' && (
            <>
              <PageTitle>Call Records Management</PageTitle>
              <CallRecordsManagement />
            </>
          )}

          {activeTab === 'finance' && (
            <>
              <PageTitle>Finance Management</PageTitle>
              <FinanceManagement />
            </>
          )}

          {activeTab === 'system' && (
            <>
              <PageTitle>System Monitor</PageTitle>
              <SystemMonitor />
            </>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'calls' && activeTab !== 'finance' && activeTab !== 'system' && (
            <>
              <PageTitle>{sidebarItems.find(item => item.id === activeTab)?.label}</PageTitle>
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#666666',
                background: '#ffffff',
                border: '3px solid #000000'
              }}>
                <Settings size={48} />
                <div style={{ marginTop: '1rem' }}>
                  {sidebarItems.find(item => item.id === activeTab)?.label} module coming soon...
                </div>
              </div>
            </>
          )}
        </ContentArea>
      </MainContent>
    </Container>
  );
}

export default AdminDashboard; 