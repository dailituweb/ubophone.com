import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus, 
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download
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

const FiltersSection = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 2px solid #000000;
  border-radius: 0;
  font-size: 1rem;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #FFC900;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 2px solid #000000;
  border-radius: 0;
  font-size: 1rem;
  background: #ffffff;
  
  &:focus {
    outline: none;
    border-color: #FFC900;
  }
`;

const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
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
    background: ${props => props.color || '#FFC900'};
  }
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666666;
  font-weight: 600;
  text-transform: uppercase;
`;

const TableContainer = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #000000;
  color: #ffffff;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f8f9fa;
  }
  
  &:hover {
    background: #e9ecef;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.9rem;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #000000;
  font-size: 1.2rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #000000;
`;

const UserEmail = styled.div`
  font-size: 0.8rem;
  color: #666666;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  border: 2px solid;
  
  &.active {
    background: #d4edda;
    color: #155724;
    border-color: #155724;
  }
  
  &.inactive {
    background: #f8d7da;
    color: #721c24;
    border-color: #721c24;
  }
  
  &.suspended {
    background: #fff3cd;
    color: #856404;
    border-color: #856404;
  }
`;

const ActionsMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const ActionsButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  
  &:hover {
    background: #e9ecef;
  }
`;

const ActionsDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 150px;
  
  ${props => !props.show && 'display: none;'}
`;

const ActionItem = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &.danger {
    color: #dc3545;
    
    &:hover {
      background: #f8d7da;
    }
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
`;

const PaginationInfo = styled.div`
  font-size: 0.9rem;
  color: #666666;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? '#FFC900' : '#ffffff'};
  color: ${props => props.active ? '#000000' : '#666666'};
  border: 2px solid #000000;
  border-radius: 0;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? '#FFC900' : '#f8f9fa'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0
  });
  const [activeDropdown, setActiveDropdown] = useState(null);

  const usersPerPage = 10;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: usersPerPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      });
      
      const response = await fetch(`/api/admin/data/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
        setTotalUsers(data.data.pagination.total);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, usersPerPage]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/data/users/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchUsers();
    fetchStats();
  };

  const handleUserAction = async (userId, action) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/data/users/${userId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchUsers();
        fetchStats();
      } else {
        console.error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`User ${action} error:`, error);
    }
    
    setActiveDropdown(null);
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 'active' : 'inactive';
  };

  const getStatusText = (isActive) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getUserInitials = (username) => {
    return username.slice(0, 2).toUpperCase();
  };

  const getUserAvatarColor = (username) => {
    const colors = ['#FFC900', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <HeaderActions>
          <ActionButton onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </ActionButton>
          <ActionButton>
            <Download size={16} />
            Export
          </ActionButton>
          <ActionButton primary>
            <UserPlus size={16} />
            Add User
          </ActionButton>
        </HeaderActions>
      </Header>

      <StatsCards>
        <StatCard color="#4CAF50">
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>
        <StatCard color="#2196F3">
          <StatValue>{stats.active}</StatValue>
          <StatLabel>Active Users</StatLabel>
        </StatCard>
        <StatCard color="#FF9800">
          <StatValue>{stats.inactive}</StatValue>
          <StatLabel>Inactive Users</StatLabel>
        </StatCard>
        <StatCard color="#F44336">
          <StatValue>{stats.suspended}</StatValue>
          <StatLabel>Suspended</StatLabel>
        </StatCard>
      </StatsCards>

      <FiltersSection>
        <FiltersRow>
          <SearchInput
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <FilterSelect value={statusFilter} onChange={handleStatusFilter}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </FilterSelect>
        </FiltersRow>
      </FiltersSection>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Balance</TableHeaderCell>
              <TableHeaderCell>Total Calls</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
              <TableHeaderCell>Last Login</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="7">
                  <LoadingSpinner>
                    <RefreshCw size={24} />
                  </LoadingSpinner>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <UserInfo>
                      <UserAvatar color={getUserAvatarColor(user.username)}>
                        {getUserInitials(user.username)}
                      </UserAvatar>
                      <UserDetails>
                        <UserName>{user.username}</UserName>
                        <UserEmail>{user.email}</UserEmail>
                      </UserDetails>
                    </UserInfo>
                  </TableCell>
                  <TableCell>
                    <StatusBadge className={getStatusBadge(user.isActive)}>
                      {getStatusText(user.isActive)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatCurrency(user.balance)}</TableCell>
                  <TableCell>{user.totalCalls || 0}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </TableCell>
                  <TableCell>
                    <ActionsMenu>
                      <ActionsButton
                        onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                      >
                        <MoreVertical size={16} />
                      </ActionsButton>
                      <ActionsDropdown show={activeDropdown === user.id}>
                        <ActionItem onClick={() => handleUserAction(user.id, 'view')}>
                          <Eye size={14} />
                          View Details
                        </ActionItem>
                        <ActionItem onClick={() => handleUserAction(user.id, 'edit')}>
                          <Edit size={14} />
                          Edit User
                        </ActionItem>
                        <ActionItem onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}>
                          {user.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </ActionItem>
                        <ActionItem onClick={() => handleUserAction(user.id, 'adjust-balance')}>
                          <DollarSign size={14} />
                          Adjust Balance
                        </ActionItem>
                        <ActionItem className="danger" onClick={() => handleUserAction(user.id, 'delete')}>
                          <Trash2 size={14} />
                          Delete User
                        </ActionItem>
                      </ActionsDropdown>
                    </ActionsMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
        
        <Pagination>
          <PaginationInfo>
            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, totalUsers)} of {totalUsers} users
          </PaginationInfo>
          <PaginationControls>
            <PaginationButton
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </PaginationButton>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <PaginationButton
                  key={pageNum}
                  active={pageNum === currentPage}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </PaginationButton>
              );
            })}
            <PaginationButton
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </PaginationButton>
          </PaginationControls>
        </Pagination>
      </TableContainer>
    </Container>
  );
}

export default UserManagement; 