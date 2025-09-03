import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Users,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Edit,
  DollarSign,
  Ban,
  CheckCircle,
  Eye,
  TrendingUp,
  Activity
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute';
import { useTheme } from '../../context/ThemeContext';
import adminAuthService from '../../services/adminAuthService';
import { toast } from 'react-toastify';

const UsersContainer = styled.div.withConfig({
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
      default: return props.$theme.cardBackground;
    }
  }};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 8px;
  font-weight: 600;
  color: ${props => {
    switch (props.$variant) {
      case 'danger': return 'white';
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
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: center;

  @media (max-width: 1024px) {
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

const StatTrend = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$isPositive', '$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$isPositive ? props.$theme.successColor : props.$theme.errorColor};

  @media (max-width: 480px) {
    font-size: 0.75rem;
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

const UsersTable = styled.div.withConfig({
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

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const UserAvatar = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$theme.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
  border: 2px solid ${props => props.$theme.borderColor};

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
`;

const UserDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 600;
  color: ${props => props.$theme.primaryText};
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const UserEmail = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 0.75rem;
  color: ${props => props.$theme.secondaryText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

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
  background: ${props => props.$status === 'active' ? props.$theme.successColor : props.$theme.errorColor};
  color: white;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
  }
`;

const BalanceAmount = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 700;
  color: ${props => props.$theme.primaryText};
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-size: 0.75rem;
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

const Pagination = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: ${props => props.$theme.cardBackground};
  border-top: 2px solid ${props => props.$theme.borderColor};

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

const PaginationInfo = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  color: ${props => props.$theme.secondaryText};
  font-size: 0.875rem;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$active', '$disabled', '$theme'].includes(prop),
})`
  padding: 0.5rem 1rem;
  background: ${props => {
    if (props.$active) return props.$theme.accent;
    if (props.$disabled) return props.$theme.mutedBg;
    return props.$theme.cardBackground;
  }};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 6px;
  color: ${props => {
    if (props.$disabled) return props.$theme.secondaryText;
    return props.$theme.primaryText;
  }};
  font-weight: 600;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => {
      if (props.$disabled) return props.$theme.mutedBg;
      if (props.$active) return props.$theme.accent;
      return props.$theme.hoverColor;
    }};
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

function AdminUsers() {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
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

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters
      });

      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch(`/api/admin/users?${queryParams}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.itemsPerPage]);

  const fetchStats = useCallback(async () => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch('/api/admin/users/stats/overview', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    fetchUsers(page);
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      let response;

      switch (action) {
        case 'toggleStatus':
          response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PATCH',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: data.isActive })
          });
          break;
        
        case 'adjustBalance':
          response = await fetch(`/api/admin/users/${userId}/adjust-balance`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        
        default:
          return;
      }

      if (response.ok) {
        toast.success(`User ${action} completed successfully`);
        fetchUsers(pagination.currentPage);
        fetchStats();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error(`User ${action} error:`, error);
      toast.error(`Failed to ${action} user`);
    }
    setActiveActionMenu(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getInitials = (firstName, lastName, email) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <StatsGrid>
        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#3b82f6" $theme={theme}>
              <Users size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <TrendingUp size={16} />
              12%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.totalUsers.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Users
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#10b981" $theme={theme}>
              <CheckCircle size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <TrendingUp size={16} />
              8%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.activeUsers.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Active Users
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#f59e0b" $theme={theme}>
              <DollarSign size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <TrendingUp size={16} />
              15%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {formatCurrency(stats.totalBalance)}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Balance
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#8b5cf6" $theme={theme}>
              <Activity size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <TrendingUp size={16} />
              23%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {(stats.totalUsers - stats.inactiveUsers).toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Active Users
          </StatLabel>
        </StatCard>
      </StatsGrid>
    );
  };

  const renderUsersTable = () => {
    if (isLoading) {
      return (
        <LoadingSpinner $theme={theme}>
          <div className="spinner"></div>
          Loading users...
        </LoadingSpinner>
      );
    }

    if (users.length === 0) {
      return (
        <LoadingSpinner $theme={theme}>
          No users found
        </LoadingSpinner>
      );
    }

    return (
      <UsersTable $theme={theme}>
        <TableHeader $theme={theme}>
          <span>User</span>
          <span className="hidden-mobile">Status</span>
          <span>Balance</span>
          <span className="hidden-mobile">Calls</span>
          <span className="hidden-tablet">Joined</span>
          <span>Actions</span>
        </TableHeader>

        {users.map((user) => (
          <TableRow key={user.id} $theme={theme}>
            <UserInfo>
              <UserAvatar $theme={theme}>
                {getInitials(user.firstName, user.lastName, user.email)}
              </UserAvatar>
              <UserDetails>
                <UserName $theme={theme}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username}
                </UserName>
                <UserEmail $theme={theme}>
                  {user.email}
                </UserEmail>
              </UserDetails>
            </UserInfo>

            <div className="hidden-mobile">
              <StatusBadge $status={user.isActive ? 'active' : 'inactive'} $theme={theme}>
                {user.isActive ? <CheckCircle size={12} /> : <Ban size={12} />}
                {user.isActive ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>

            <BalanceAmount $theme={theme}>
              {formatCurrency(user.balance)}
            </BalanceAmount>

            <div className="hidden-mobile">
              {user.stats?.totalCalls || 0}
            </div>

            <div className="hidden-tablet">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>

            <ActionMenu>
              <ActionMenuButton 
                $theme={theme}
                onClick={() => setActiveActionMenu(activeActionMenu === user.id ? null : user.id)}
              >
                <MoreVertical size={16} />
              </ActionMenuButton>

              <ActionDropdown $visible={activeActionMenu === user.id} $theme={theme}>
                <ActionItem $theme={theme}>
                  <Eye size={16} />
                  View Details
                </ActionItem>
                <ActionItem $theme={theme}>
                  <Edit size={16} />
                  Edit User
                </ActionItem>
                <ActionItem $theme={theme}>
                  <DollarSign size={16} />
                  Adjust Balance
                </ActionItem>
                <ActionItem 
                  $variant={user.isActive ? "danger" : "default"} 
                  $theme={theme}
                  onClick={() => handleUserAction('toggleStatus', user.id, { isActive: !user.isActive })}
                >
                  {user.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </ActionItem>
              </ActionDropdown>
            </ActionMenu>
          </TableRow>
        ))}

        <Pagination $theme={theme}>
          <PaginationInfo $theme={theme}>
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} users
          </PaginationInfo>

          <PaginationButtons>
            <PaginationButton
              $disabled={pagination.currentPage === 1}
              $theme={theme}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              Previous
            </PaginationButton>
            
            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
              const page = index + 1;
              return (
                <PaginationButton
                  key={page}
                  $active={page === pagination.currentPage}
                  $theme={theme}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PaginationButton>
              );
            })}

            <PaginationButton
              $disabled={pagination.currentPage === pagination.totalPages}
              $theme={theme}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              Next
            </PaginationButton>
          </PaginationButtons>
        </Pagination>
      </UsersTable>
    );
  };

  return (
    <AdminLayout>
      <UsersContainer $theme={theme}>
        <Header>
          <Title $theme={theme}>
            <Users size={32} />
            User Management
          </Title>
          
          <HeaderActions>
            <ActionButton $variant="secondary" $theme={theme}>
              <Download size={16} />
              <span>Export</span>
            </ActionButton>
            <ActionButton $variant="secondary" $theme={theme}>
              <Upload size={16} />
              <span>Import</span>
            </ActionButton>
            <ActionButton 
              $variant="primary" 
              $theme={theme}
              $loading={isLoading}
              onClick={() => fetchUsers(pagination.currentPage)}
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
                placeholder="Search users by name, email, or username..."
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FilterSelect>

            <FilterSelect
              $theme={theme}
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt">Sort by Join Date</option>
              <option value="lastLogin">Sort by Last Login</option>
              <option value="username">Sort by Username</option>
              <option value="email">Sort by Email</option>
              <option value="balance">Sort by Balance</option>
            </FilterSelect>

            <ActionButton $variant="secondary" $theme={theme}>
              <Filter size={16} />
            </ActionButton>
          </FilterGrid>
        </FilterSection>

        {renderStats()}
        {renderUsersTable()}
      </UsersContainer>
    </AdminLayout>
  );
}

// Wrap with protection requiring users read permission
export default function ProtectedAdminUsers() {
  return (
    <AdminProtectedRoute requiredPermissions={[{ resource: 'users', action: 'read' }]}>
      <AdminUsers />
    </AdminProtectedRoute>
  );
}