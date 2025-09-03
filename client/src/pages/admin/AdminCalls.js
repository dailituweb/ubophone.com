import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Phone,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Play,
  Clock,
  DollarSign,
  Activity,
  PhoneCall,
  PhoneOff,
  AlertCircle,
  CheckCircle,
  Eye,
  Ban
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute';
import { useTheme } from '../../context/ThemeContext';
import adminAuthService from '../../services/adminAuthService';
import { toast } from 'react-toastify';

const CallsContainer = styled.div.withConfig({
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
    gap: 1rem;
  }
`;

const Title = styled.h1.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.$theme.primaryText};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$variant', '$loading', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return props.$theme.accent;
      case 'secondary': return props.$theme.cardBackground;
      case 'danger': return props.$theme.errorColor;
      case 'success': return props.$theme.successColor;
      default: return props.$theme.cardBackground;
    }
  }};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  font-weight: 600;
  color: ${props => {
    switch (props.$variant) {
      case 'danger':
      case 'success': return 'white';
      default: return props.$theme.primaryText;
    }
  }};
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  &:hover {
    transform: ${props => props.$loading ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.$loading ? 'none' : `0 4px 12px ${props.$theme.shadowColor}`};
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
    
    span {
      display: none;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
`;

const StatCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px ${props => props.$theme.shadowColor};
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$color', '$theme'].includes(prop),
})`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: ${props => props.$color || props.$theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${props => props.$theme.borderColor};

  @media (max-width: 480px) {
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const StatValue = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 2rem;
  font-weight: 800;
  color: ${props => props.$theme.primaryText};
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 0.875rem;
  color: ${props => props.$theme.secondaryText};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const FilterSection = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: ${props => props.$theme.inputBg};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$theme.primaryText};
  transition: all 0.3s ease;

  &::placeholder {
    color: ${props => props.$theme.secondaryText};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.$theme.accent};
    box-shadow: 0 0 0 3px rgba(255, 201, 0, 0.1);
  }
`;

const SearchIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.$theme.secondaryText};
  pointer-events: none;
`;

const FilterSelect = styled.select.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  width: 100%;
  padding: 0.75rem 1rem;
  background: ${props => props.$theme.inputBg};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.$theme.primaryText};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.$theme.accent};
    box-shadow: 0 0 0 3px rgba(255, 201, 0, 0.1);
  }
`;

const CallsTable = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.mutedBg};
  border-bottom: 2px solid ${props => props.$theme.borderColor};
  padding: 1rem 1.5rem;
  font-weight: 700;
  color: ${props => props.$theme.primaryText};
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 2fr 1fr auto;
    gap: 0.5rem;
  }
`;

const TableRow = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  border-bottom: 1px solid ${props => props.$theme.borderColor};
  padding: 1rem 1.5rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
  gap: 1rem;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$theme.hoverColor};
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 0.75rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 2fr 1fr auto;
    gap: 0.5rem;
  }
`;

const CallInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CallNumbers = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${props => props.$theme.primaryText};

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const CallMeta = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 0.75rem;
  color: ${props => props.$theme.secondaryText};
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => !['$status', '$theme'].includes(prop),
})`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch (props.$status) {
      case 'completed': return props.$theme.successColor;
      case 'failed': return props.$theme.errorColor;
      case 'in-progress': return props.$theme.warningColor;
      case 'ringing': return '#3b82f6';
      default: return props.$theme.secondaryText;
    }
  }};
  color: white;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
  }
`;

const Duration = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 600;
  color: ${props => props.$theme.primaryText};
  display: flex;
  align-items: center;
  gap: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const Cost = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 700;
  color: ${props => props.$theme.primaryText};
  display: flex;
  align-items: center;
  gap: 0.25rem;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const ActionMenu = styled.div`
  position: relative;
`;

const ActionMenuButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: 1px solid ${props => props.$theme.borderColor};
  border-radius: 6px;
  color: ${props => props.$theme.secondaryText};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$theme.hoverColor};
    color: ${props => props.$theme.primaryText};
  }
`;

const ActionDropdown = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$visible', '$theme'].includes(prop),
})`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  min-width: 160px;
  box-shadow: 0 8px 24px ${props => props.$theme.shadowColor};
  display: ${props => props.$visible ? 'block' : 'none'};
  z-index: 1000;
`;

const ActionItem = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$variant', '$theme'].includes(prop),
})`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: ${props => {
    switch (props.$variant) {
      case 'danger': return props.$theme.errorColor;
      default: return props.$theme.primaryText;
    }
  }};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid ${props => props.$theme.borderColor};

  &:hover {
    background: ${props => props.$theme.hoverColor};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const LoadingSpinner = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  color: ${props => props.$theme.secondaryText};
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid ${props => props.$theme.borderColor};
    border-top: 4px solid ${props => props.$theme.accent};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function AdminCalls() {
  const { theme } = useTheme();
  const [calls, setCalls] = useState([]);
  const [stats, setStats] = useState(null);
  const [liveCalls, setLiveCalls] = useState([]); // eslint-disable-line no-unused-vars
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [activeActionMenu, setActiveActionMenu] = useState(null);

  const fetchCalls = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters
      });

      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch(`/api/admin/calls?${queryParams}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setCalls(data.data.calls);
        setPagination(data.data.pagination);
      } else {
        throw new Error('Failed to fetch calls');
      }
    } catch (error) {
      console.error('Calls fetch error:', error);
      toast.error('Failed to load calls');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.itemsPerPage]);

  const fetchStats = useCallback(async () => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      const [statsResponse, liveResponse] = await Promise.all([
        fetch('/api/admin/calls/stats/overview', { headers }),
        fetch('/api/admin/calls/live', { headers })
      ]);
      
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.data.overview);
      }
      
      if (liveResponse.ok) {
        const data = await liveResponse.json();
        setLiveCalls(data.data.calls);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
    fetchStats();
    
    // Refresh live calls every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchCalls, fetchStats]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleCallAction = async (action, callId) => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      let response;

      switch (action) {
        case 'terminate':
          response = await fetch(`/api/admin/calls/${callId}/terminate`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Terminated by admin' })
          });
          break;
        
        default:
          return;
      }

      if (response.ok) {
        toast.success(`Call ${action} completed successfully`);
        fetchCalls(pagination.currentPage);
        fetchStats();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error(`Call ${action} error:`, error);
      toast.error(`Failed to ${action} call`);
    }
    setActiveActionMenu(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={12} />;
      case 'failed':
        return <AlertCircle size={12} />;
      case 'in-progress':
        return <PhoneCall size={12} />;
      case 'ringing':
        return <Activity size={12} />;
      default:
        return <PhoneOff size={12} />;
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <StatsGrid>
        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#3b82f6" $theme={theme}>
              <Phone size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.totalCalls.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Calls
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#10b981" $theme={theme}>
              <Activity size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.liveCalls}
          </StatValue>
          <StatLabel $theme={theme}>
            Live Calls
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#f59e0b" $theme={theme}>
              <DollarSign size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {formatCurrency(stats.totalRevenue)}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Revenue
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#8b5cf6" $theme={theme}>
              <Clock size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {Math.floor(stats.totalDuration / 60).toLocaleString()}m
          </StatValue>
          <StatLabel $theme={theme}>
            Total Duration
          </StatLabel>
        </StatCard>
      </StatsGrid>
    );
  };

  const renderCallsTable = () => {
    if (isLoading) {
      return (
        <LoadingSpinner $theme={theme}>
          <div className="spinner"></div>
          Loading calls...
        </LoadingSpinner>
      );
    }

    if (calls.length === 0) {
      return (
        <LoadingSpinner $theme={theme}>
          No calls found
        </LoadingSpinner>
      );
    }

    return (
      <CallsTable $theme={theme}>
        <TableHeader $theme={theme}>
          <span>Call Details</span>
          <span className="hidden-mobile">Status</span>
          <span>Duration</span>
          <span className="hidden-mobile">Cost</span>
          <span className="hidden-tablet">Date</span>
          <span>Actions</span>
        </TableHeader>

        {calls.map((call) => (
          <TableRow key={call.id} $theme={theme}>
            <CallInfo>
              <CallNumbers $theme={theme}>
                <Phone size={16} />
                {call.fromNumber} → {call.toNumber}
              </CallNumbers>
              <CallMeta $theme={theme}>
                {call.user && (
                  <>
                    <span>{call.user.username}</span>
                    <span>•</span>
                  </>
                )}
                <span>{call.callSid}</span>
              </CallMeta>
            </CallInfo>

            <div className="hidden-mobile">
              <StatusBadge $status={call.status} $theme={theme}>
                {getStatusIcon(call.status)}
                {call.status}
              </StatusBadge>
            </div>

            <Duration $theme={theme}>
              <Clock size={16} />
              {formatDuration(call.duration)}
            </Duration>

            <div className="hidden-mobile">
              <Cost $theme={theme}>
                <DollarSign size={16} />
                {formatCurrency(call.cost || 0)}
              </Cost>
            </div>

            <div className="hidden-tablet">
              {new Date(call.createdAt).toLocaleDateString()}
            </div>

            <ActionMenu>
              <ActionMenuButton 
                $theme={theme}
                onClick={() => setActiveActionMenu(activeActionMenu === call.id ? null : call.id)}
              >
                <MoreVertical size={16} />
              </ActionMenuButton>

              <ActionDropdown $visible={activeActionMenu === call.id} $theme={theme}>
                <ActionItem $theme={theme}>
                  <Eye size={16} />
                  View Details
                </ActionItem>
                {call.recordingUrl && (
                  <ActionItem $theme={theme}>
                    <Play size={16} />
                    Play Recording
                  </ActionItem>
                )}
                {(call.status === 'ringing' || call.status === 'in-progress') && (
                  <ActionItem 
                    $variant="danger" 
                    $theme={theme}
                    onClick={() => handleCallAction('terminate', call.id)}
                  >
                    <Ban size={16} />
                    Terminate Call
                  </ActionItem>
                )}
              </ActionDropdown>
            </ActionMenu>
          </TableRow>
        ))}
      </CallsTable>
    );
  };

  return (
    <AdminLayout>
      <CallsContainer $theme={theme}>
        <Header>
          <Title $theme={theme}>
            <Phone size={32} />
            Call Records
          </Title>
          
          <HeaderActions>
            <ActionButton $variant="secondary" $theme={theme}>
              <Download size={16} />
              <span>Export</span>
            </ActionButton>
            <ActionButton 
              $variant="primary" 
              $theme={theme}
              $loading={isLoading}
              onClick={() => {
                fetchCalls(pagination.currentPage);
                fetchStats();
              }}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </ActionButton>
          </HeaderActions>
        </Header>

        <FilterSection $theme={theme}>
          <FilterGrid>
            <SearchContainer>
              <SearchIcon $theme={theme}>
                <Search size={20} />
              </SearchIcon>
              <SearchInput
                $theme={theme}
                placeholder="Search by phone number, call ID, or user..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </SearchContainer>

            <FilterSelect
              $theme={theme}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="in-progress">In Progress</option>
              <option value="ringing">Ringing</option>
              <option value="missed">Missed</option>
              <option value="canceled">Canceled</option>
            </FilterSelect>

            <FilterSelect
              $theme={theme}
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt">Sort by Date</option>
              <option value="duration">Sort by Duration</option>
              <option value="cost">Sort by Cost</option>
              <option value="status">Sort by Status</option>
            </FilterSelect>

            <ActionButton $variant="secondary" $theme={theme}>
              <Filter size={16} />
            </ActionButton>
          </FilterGrid>
        </FilterSection>

        {renderStats()}
        {renderCallsTable()}
      </CallsContainer>
    </AdminLayout>
  );
}

// Wrap with protection requiring calls read permission
export default function ProtectedAdminCalls() {
  return (
    <AdminProtectedRoute requiredPermissions={[{ resource: 'calls', action: 'read' }]}>
      <AdminCalls />
    </AdminProtectedRoute>
  );
}