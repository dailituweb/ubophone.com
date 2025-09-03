import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  DollarSign,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  CreditCard,
  Receipt,
  FileText,
  Eye,
  RefreshCcw,
  Ban,
  CheckCircle,
  AlertCircle,
  PieChart,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminProtectedRoute from '../../components/admin/AdminProtectedRoute';
import { useTheme } from '../../context/ThemeContext';
import adminAuthService from '../../services/adminAuthService';
import { toast } from 'react-toastify';

const FinanceContainer = styled.div.withConfig({
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

const TabNavigation = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  background: ${props => props.$theme.cardBackground};
  border: 2px solid ${props => props.$theme.borderColor};
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    overflow-x: auto;
    gap: 0.25rem;
  }
`;

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$active', '$theme'].includes(prop),
})`
  padding: 0.75rem 1.5rem;
  background: ${props => props.$active ? props.$theme.accent : 'transparent'};
  border: none;
  border-radius: 8px;
  font-weight: 600;
  color: ${props => props.$active ? props.$theme.primaryText : props.$theme.secondaryText};
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  &:hover {
    background: ${props => props.$active ? props.$theme.accent : props.$theme.hoverColor};
    color: ${props => props.$theme.primaryText};
  }

  @media (max-width: 480px) {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
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

const DataTable = styled.div.withConfig({
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

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TransactionId = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-weight: 600;
  color: ${props => props.$theme.primaryText};
  font-family: 'Courier New', monospace;

  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const TransactionMeta = styled.div.withConfig({
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
      case 'pending': return props.$theme.warningColor;
      case 'processing': return '#3b82f6';
      case 'refunded': return '#8b5cf6';
      default: return props.$theme.secondaryText;
    }
  }};
  color: white;

  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.125rem 0.5rem;
  }
`;

const Amount = styled.div.withConfig({
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

const PaymentMethod = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$theme'].includes(prop),
})`
  font-size: 0.875rem;
  color: ${props => props.$theme.primaryText};
  display: flex;
  align-items: center;
  gap: 0.25rem;
  text-transform: capitalize;

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

function AdminFinance() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    period: 'month',
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

  const fetchFinanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = adminAuthService.getAuthHeaders();
      
      if (activeTab === 'overview') {
        const response = await fetch(`/api/admin/finance/overview?period=${filters.period}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } else if (activeTab === 'payments') {
        const queryParams = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.itemsPerPage.toString(),
          search: filters.search,
          status: filters.status,
          paymentMethod: filters.paymentMethod,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder
        });

        const response = await fetch(`/api/admin/finance/payments?${queryParams}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setData(data.data.payments);
          setPagination(data.data.pagination);
        }
      } else if (activeTab === 'invoices') {
        const queryParams = new URLSearchParams({
          page: pagination.currentPage.toString(),
          limit: pagination.itemsPerPage.toString(),
          search: filters.search,
          status: filters.status
        });

        const response = await fetch(`/api/admin/finance/invoices?${queryParams}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setData(data.data.invoices);
          setPagination(data.data.pagination);
        }
      }
    } catch (error) {
      console.error('Finance data fetch error:', error);
      toast.error('Failed to load finance data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filters, pagination.currentPage, pagination.itemsPerPage]);

  useEffect(() => {
    fetchFinanceData();
  }, [fetchFinanceData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters(prev => ({ ...prev, search: '', status: '' }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleTransactionAction = async (action, transactionId, data = {}) => {
    try {
      const headers = adminAuthService.getAuthHeaders();
      let response;

      switch (action) {
        case 'refund':
          response = await fetch(`/api/admin/finance/payments/${transactionId}/refund`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          break;
        
        default:
          return;
      }

      if (response.ok) {
        toast.success(`Transaction ${action} completed successfully`);
        fetchFinanceData();
      } else {
        throw new Error('Action failed');
      }
    } catch (error) {
      console.error(`Transaction ${action} error:`, error);
      toast.error(`Failed to ${action} transaction`);
    }
    setActiveActionMenu(null);
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
      case 'pending':
        return <Activity size={12} />;
      case 'processing':
        return <RefreshCcw size={12} />;
      case 'refunded':
        return <Ban size={12} />;
      default:
        return <AlertCircle size={12} />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'stripe':
      case 'credit_card':
        return <CreditCard size={16} />;
      case 'paypal':
        return <DollarSign size={16} />;
      case 'admin_adjustment':
      case 'admin_refund':
        return <Receipt size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  const renderOverviewStats = () => {
    if (!stats || !stats.overview) return null;

    const overview = stats.overview;
    
    return (
      <StatsGrid>
        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#10b981" $theme={theme}>
              <DollarSign size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <ArrowUpRight size={16} />
              12%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {formatCurrency(overview.totalRevenue)}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Revenue
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#3b82f6" $theme={theme}>
              <Receipt size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <ArrowUpRight size={16} />
              8%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {overview.totalPayments.toLocaleString()}
          </StatValue>
          <StatLabel $theme={theme}>
            Total Payments
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#f59e0b" $theme={theme}>
              <Activity size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <ArrowUpRight size={16} />
              15%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {formatCurrency(overview.avgPaymentAmount)}
          </StatValue>
          <StatLabel $theme={theme}>
            Avg Payment
          </StatLabel>
        </StatCard>

        <StatCard $theme={theme}>
          <StatHeader>
            <StatIcon $color="#8b5cf6" $theme={theme}>
              <Activity size={24} color="white" />
            </StatIcon>
            <StatTrend $isPositive={true} $theme={theme}>
              <ArrowUpRight size={16} />
              23%
            </StatTrend>
          </StatHeader>
          <StatValue $theme={theme}>
            {formatCurrency(overview.totalUserBalance)}
          </StatValue>
          <StatLabel $theme={theme}>
            User Balances
          </StatLabel>
        </StatCard>
      </StatsGrid>
    );
  };

  const renderDataTable = () => {
    if (isLoading) {
      return (
        <LoadingSpinner $theme={theme}>
          <div className="spinner"></div>
          Loading {activeTab}...
        </LoadingSpinner>
      );
    }

    if (data.length === 0) {
      return (
        <LoadingSpinner $theme={theme}>
          No {activeTab} found
        </LoadingSpinner>
      );
    }

    const isPayments = activeTab === 'payments';

    return (
      <DataTable $theme={theme}>
        <TableHeader $theme={theme}>
          <span>{isPayments ? 'Transaction' : 'Invoice'}</span>
          <span className="hidden-mobile">Status</span>
          <span>Amount</span>
          <span className="hidden-mobile">{isPayments ? 'Method' : 'Due Date'}</span>
          <span className="hidden-tablet">Date</span>
          <span>Actions</span>
        </TableHeader>

        {data.map((item) => (
          <TableRow key={item.id} $theme={theme}>
            <TransactionInfo>
              <TransactionId $theme={theme}>
                {isPayments ? item.transactionId || item.id : item.invoiceNumber || item.id}
              </TransactionId>
              <TransactionMeta $theme={theme}>
                {item.user && (
                  <>
                    <span>{item.user.username}</span>
                    <span>•</span>
                  </>
                )}
                <span>{item.description || 'Payment'}</span>
              </TransactionMeta>
            </TransactionInfo>

            <div className="hidden-mobile">
              <StatusBadge $status={item.status} $theme={theme}>
                {getStatusIcon(item.status)}
                {item.status}
              </StatusBadge>
            </div>

            <Amount $theme={theme}>
              <DollarSign size={16} />
              {formatCurrency(item.amount)}
            </Amount>

            <div className="hidden-mobile">
              {isPayments ? (
                <PaymentMethod $theme={theme}>
                  {getPaymentMethodIcon(item.paymentMethod)}
                  {item.paymentMethod?.replace('_', ' ')}
                </PaymentMethod>
              ) : (
                <span>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}</span>
              )}
            </div>

            <div className="hidden-tablet">
              {new Date(item.createdAt).toLocaleDateString()}
            </div>

            <ActionMenu>
              <ActionMenuButton 
                $theme={theme}
                onClick={() => setActiveActionMenu(activeActionMenu === item.id ? null : item.id)}
              >
                <MoreVertical size={16} />
              </ActionMenuButton>

              <ActionDropdown $visible={activeActionMenu === item.id} $theme={theme}>
                <ActionItem $theme={theme}>
                  <Eye size={16} />
                  View Details
                </ActionItem>
                {isPayments && item.status === 'completed' && (
                  <ActionItem 
                    $variant="danger" 
                    $theme={theme}
                    onClick={() => handleTransactionAction('refund', item.id, { 
                      type: 'full', 
                      reason: 'Admin refund' 
                    })}
                  >
                    <RefreshCcw size={16} />
                    Process Refund
                  </ActionItem>
                )}
                <ActionItem $theme={theme}>
                  <Download size={16} />
                  Download Receipt
                </ActionItem>
              </ActionDropdown>
            </ActionMenu>
          </TableRow>
        ))}
      </DataTable>
    );
  };

  return (
    <AdminLayout>
      <FinanceContainer $theme={theme}>
        <Header>
          <Title $theme={theme}>
            <DollarSign size={32} />
            Financial Center
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
              onClick={fetchFinanceData}
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </ActionButton>
          </HeaderActions>
        </Header>

        <TabNavigation $theme={theme}>
          <TabButton 
            $active={activeTab === 'overview'} 
            $theme={theme}
            onClick={() => handleTabChange('overview')}
          >
            <Activity size={16} />
            Overview
          </TabButton>
          <TabButton 
            $active={activeTab === 'payments'} 
            $theme={theme}
            onClick={() => handleTabChange('payments')}
          >
            <CreditCard size={16} />
            Payments
          </TabButton>
          <TabButton 
            $active={activeTab === 'invoices'} 
            $theme={theme}
            onClick={() => handleTabChange('invoices')}
          >
            <FileText size={16} />
            Invoices
          </TabButton>
          <TabButton 
            $active={activeTab === 'reports'} 
            $theme={theme}
            onClick={() => handleTabChange('reports')}
          >
            <PieChart size={16} />
            Reports
          </TabButton>
        </TabNavigation>

        {activeTab === 'overview' && renderOverviewStats()}

        {(activeTab === 'payments' || activeTab === 'invoices') && (
          <FilterSection $theme={theme}>
            <FilterGrid>
              <SearchContainer>
                <SearchIcon $theme={theme}>
                  <Search size={20} />
                </SearchIcon>
                <SearchInput
                  $theme={theme}
                  placeholder={`Search ${activeTab} by ID, user, or description...`}
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
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="processing">Processing</option>
                {activeTab === 'payments' && <option value="refunded">Refunded</option>}
              </FilterSelect>

              {activeTab === 'payments' && (
                <FilterSelect
                  $theme={theme}
                  value={filters.paymentMethod}
                  onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="admin_adjustment">Admin Adjustment</option>
                </FilterSelect>
              )}

              <FilterSelect
                $theme={theme}
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="status">Sort by Status</option>
              </FilterSelect>

              <ActionButton $variant="secondary" $theme={theme}>
                <Filter size={16} />
              </ActionButton>
            </FilterGrid>
          </FilterSection>
        )}

        {(activeTab === 'payments' || activeTab === 'invoices') && renderDataTable()}

        {activeTab === 'reports' && (
          <LoadingSpinner $theme={theme}>
            Revenue reports coming soon...
          </LoadingSpinner>
        )}
      </FinanceContainer>
    </AdminLayout>
  );
}

// Wrap with protection requiring finance read permission
export default function ProtectedAdminFinance() {
  return (
    <AdminProtectedRoute requiredPermissions={[{ resource: 'finance', action: 'read' }]}>
      <AdminFinance />
    </AdminProtectedRoute>
  );
}