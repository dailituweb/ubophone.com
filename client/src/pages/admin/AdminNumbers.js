import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Hash,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Plus,
  Edit,
  UserPlus,
  UserMinus,
  Trash2,
  MapPin,
  DollarSign,
  Phone,
  Globe,
  Activity,
  CheckCircle,
  AlertCircle,
  Ban,
  Eye,
  Archive
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute';
import { useTheme } from '../../context/ThemeContext';
import adminAuthService from '../../services/adminAuthService';
import { toast } from 'react-toastify';

const NumbersContainer = styled.div.withConfig({
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

const NumbersTable = styled.div.withConfig({
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

const NumberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const NumberValue = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: ${props => props.$theme.primaryText};
  font-family: 'Courier New', monospace;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const NumberMeta = styled.div.withConfig({
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
      case 'available': return props.$theme.successColor;
      case 'assigned': return props.$theme.warningColor;
      case 'reserved': return '#3b82f6';
      case 'blocked': return props.$theme.errorColor;
      default: return props.$theme.secondaryText;
    }
  }};
  color: white;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
  }
`;

const TypeBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => !['$type', '$theme'].includes(prop),
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
    switch (props.$type) {
      case 'local': return '#64748b';
      case 'toll-free': return '#8b5cf6';
      case 'mobile': return '#10b981';
      default: return props.$theme.secondaryText;
    }
  }};
  color: white;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
  }
`;

const Price = styled.div.withConfig({
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

const AssignedUser = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 0.875rem;
  color: ${props => props.$theme.primaryText};
  display: flex;
  align-items: center;
  gap: 0.25rem;

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

function AdminNumbers() {
  const { theme } = useTheme();
  const [numbers, setNumbers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    country: '',
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

  const fetchNumbers = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters
      });

      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch(`/api/admin/numbers?${queryParams}`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        setNumbers(data.data.phoneNumbers);
        setPagination(data.data.pagination);
      } else {
        throw new Error('Failed to fetch phone numbers');
      }
    } catch (error) {
      console.error('Numbers fetch error:', error);
      toast.error('Failed to load phone numbers');
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.itemsPerPage]);

  const fetchStats = useCallback(async () => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      const response = await fetch('/api/admin/numbers/stats/overview', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchNumbers();
    fetchStats();
  }, [fetchNumbers, fetchStats]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleNumberAction = async (action, numberId, data = {}) => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      let response;

      switch (action) {
        case 'updateStatus':
          response = await fetch(`/api/admin/numbers/${numberId}`, {
            method: 'PATCH',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        
        case 'assign':
          response = await fetch(`/api/admin/numbers/${numberId}/assign`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        
        case 'unassign':
          response = await fetch(`/api/admin/numbers/${numberId}/unassign`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        
        case 'delete':
          response = await fetch(`/api/admin/numbers/${numberId}`, {
            method: 'DELETE',
            headers
          });
          break;
        
        default:
          return;
      }

      if (response.ok) {
        toast.success(`Number ${action} completed successfully`);
        fetchNumbers(pagination.currentPage);
        fetchStats();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error(`Number ${action} error:`, error);
      toast.error(`Failed to ${action} number`);
    }
    setActiveActionMenu(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPhoneNumber = (number) => {
    if (!number) return '';
    // Format as (XXX) XXX-XXXX for US numbers
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const formatted = cleaned.slice(1);
      return `+1 (${formatted.slice(0, 3)}) ${formatted.slice(3, 6)}-${formatted.slice(6)}`;
    }
    return number;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle size={12} />;
      case 'assigned':
        return <Activity size={12} />;
      case 'reserved':
        return <Archive size={12} />;
      case 'blocked':
        return <Ban size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'local':
        return <MapPin size={12} />;
      case 'toll-free':
        return <Phone size={12} />;
      case 'mobile':
        return <Activity size={12} />;
      default:
        return <Hash size={12} />;
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <StatsGrid>
        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#3b82f6" $theme={theme}>
              <Hash size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.totalNumbers.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Numbers
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#10b981" $theme={theme}>
              <CheckCircle size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.availableNumbers.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Available
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#f59e0b" $theme={theme}>
              <Activity size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {stats.assignedNumbers.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Assigned
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#8b5cf6" $theme={theme}>
              <DollarSign size={24} color="white" />
            </StatIcon>
          </StatHeader>
          <StatValue $theme={theme}>
            {formatCurrency(stats.totalMonthlyRevenue)}
          </StatValue>
          <StatLabel $theme={theme}>
            Monthly Revenue
          </StatLabel>
        </StatCard>
      </StatsGrid>
    );
  };

  const renderNumbersTable = () => {
    if (isLoading) {
      return (
        <LoadingSpinner $theme={theme}>
          <div className="spinner"></div>
          Loading phone numbers...
        </LoadingSpinner>
      );
    }

    if (numbers.length === 0) {
      return (
        <LoadingSpinner $theme={theme}>
          No phone numbers found
        </LoadingSpinner>
      );
    }

    return (
      <NumbersTable $theme={theme}>
        <TableHeader $theme={theme}>
          <span>Phone Number</span>
          <span className="hidden-mobile">Status</span>
          <span>Type</span>
          <span className="hidden-mobile">Price</span>
          <span className="hidden-tablet">Assigned To</span>
          <span>Actions</span>
        </TableHeader>

        {numbers.map((number) => (
          <TableRow key={number.id} $theme={theme}>
            <NumberInfo>
              <NumberValue $theme={theme}>
                <Phone size={16} />
                {formatPhoneNumber(number.number)}
              </NumberValue>
              <NumberMeta $theme={theme}>
                <Globe size={12} />
                <span>{number.country}</span>
                {number.region && (
                  <>
                    <span>•</span>
                    <span>{number.region}</span>
                  </>
                )}
              </NumberMeta>
            </NumberInfo>

            <div className="hidden-mobile">
              <StatusBadge $status={number.status} $theme={theme}>
                {getStatusIcon(number.status)}
                {number.status}
              </StatusBadge>
            </div>

            <TypeBadge $type={number.type} $theme={theme}>
              {getTypeIcon(number.type)}
              {number.type}
            </TypeBadge>

            <div className="hidden-mobile">
              <Price $theme={theme}>
                <DollarSign size={16} />
                {formatCurrency(number.monthlyPrice)}/mo
              </Price>
            </div>

            <div className="hidden-tablet">
              {number.assignments && number.assignments.length > 0 ? (
                <AssignedUser $theme={theme}>
                  {number.assignments[0].user?.username || 'Unknown User'}
                </AssignedUser>
              ) : (
                <span style={{ color: theme.secondaryText, fontSize: '0.875rem' }}>
                  Unassigned
                </span>
              )}
            </div>

            <ActionMenu>
              <ActionMenuButton 
                $theme={theme}
                onClick={() => setActiveActionMenu(activeActionMenu === number.id ? null : number.id)}
              >
                <MoreVertical size={16} />
              </ActionMenuButton>

              <ActionDropdown $visible={activeActionMenu === number.id} $theme={theme}>
                <ActionItem $theme={theme}>
                  <Eye size={16} />
                  View Details
                </ActionItem>
                <ActionItem $theme={theme}>
                  <Edit size={16} />
                  Edit Number
                </ActionItem>
                {number.status === 'available' ? (
                  <ActionItem $theme={theme}>
                    <UserPlus size={16} />
                    Assign User
                  </ActionItem>
                ) : number.status === 'assigned' ? (
                  <ActionItem 
                    $theme={theme}
                    onClick={() => handleNumberAction('unassign', number.id, { reason: 'Unassigned by admin' })}
                  >
                    <UserMinus size={16} />
                    Unassign
                  </ActionItem>
                ) : null}
                <ActionItem 
                  $variant="danger" 
                  $theme={theme}
                  onClick={() => handleNumberAction('delete', number.id)}
                >
                  <Trash2 size={16} />
                  Remove
                </ActionItem>
              </ActionDropdown>
            </ActionMenu>
          </TableRow>
        ))}
      </NumbersTable>
    );
  };

  return (
    <AdminLayout>
      <NumbersContainer $theme={theme}>
        <Header>
          <Title $theme={theme}>
            <Hash size={32} />
            Number Pool
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
            <ActionButton $variant="success" $theme={theme}>
              <Plus size={16} />
              <span>Add Numbers</span>
            </ActionButton>
            <ActionButton 
              $variant="primary" 
              $theme={theme}
              $loading={isLoading}
              onClick={() => {
                fetchNumbers(pagination.currentPage);
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
                placeholder="Search by phone number, region, or friendly name..."
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
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="reserved">Reserved</option>
              <option value="blocked">Blocked</option>
            </FilterSelect>

            <FilterSelect
              $theme={theme}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="local">Local</option>
              <option value="toll-free">Toll-Free</option>
              <option value="mobile">Mobile</option>
            </FilterSelect>

            <FilterSelect
              $theme={theme}
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
            >
              <option value="">All Countries</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="UK">United Kingdom</option>
            </FilterSelect>

            <ActionButton $variant="secondary" $theme={theme}>
              <Filter size={16} />
            </ActionButton>
          </FilterGrid>
        </FilterSection>

        {renderStats()}
        {renderNumbersTable()}
      </NumbersContainer>
    </AdminLayout>
  );
}

// Wrap with protection requiring phone_numbers read permission
export default function ProtectedAdminNumbers() {
  return (
    <AdminProtectedRoute requiredPermissions={[{ resource: 'phone_numbers', action: 'read' }]}>
      <AdminNumbers />
    </AdminProtectedRoute>
  );
}