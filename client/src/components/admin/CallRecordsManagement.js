import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Download,
  Volume2,
  RefreshCw,
  MoreVertical,
  Eye,
  Headphones
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

const DateInput = styled.input`
  padding: 0.5rem 1rem;
  border: 2px solid #000000;
  border-radius: 0;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FFC900;
  }
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
  vertical-align: middle;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
`;

const CallInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CallIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color || '#FFC900'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000000;
`;

const CallDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const PhoneNumber = styled.div`
  font-weight: 600;
  color: #000000;
`;

const CallDirection = styled.div`
  font-size: 0.8rem;
  color: #666666;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  border: 2px solid;
  
  &.completed {
    background: #d4edda;
    color: #155724;
    border-color: #155724;
  }
  
  &.failed {
    background: #f8d7da;
    color: #721c24;
    border-color: #721c24;
  }
  
  &.busy {
    background: #fff3cd;
    color: #856404;
    border-color: #856404;
  }
  
  &.no-answer {
    background: #e2e3e5;
    color: #383d41;
    border-color: #383d41;
  }
  
  &.in-progress {
    background: #cce7ff;
    color: #004085;
    border-color: #004085;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #FFC900;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #000000;
  font-size: 0.8rem;
`;

const Username = styled.div`
  font-weight: 600;
  color: #000000;
`;

const RecordingButton = styled.button`
  background: ${props => props.available ? '#28a745' : '#6c757d'};
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.available ? 'pointer' : 'not-allowed'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: ${props => props.available ? 'scale(1.1)' : 'none'};
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

function CallRecordsManagement() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    outgoing: 0,
    incoming: 0,
    completed: 0,
    failed: 0,
    totalDuration: 0,
    totalCost: 0
  });
  const [activeDropdown, setActiveDropdown] = useState(null);

  const callsPerPage = 15;

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: callsPerPage,
        type: typeFilter !== 'all' ? typeFilter : '',
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchTerm,
        startDate: startDate || '',
        endDate: endDate || ''
      });
      
      const response = await fetch(`/api/admin/data/calls?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalls(data.data.calls);
        setTotalPages(data.data.pagination.pages);
        setTotalCalls(data.data.pagination.total);
      } else {
        console.error('Failed to fetch calls');
      }
    } catch (error) {
      console.error('Calls fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter, statusFilter, searchTerm, startDate, endDate]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams({
        startDate: startDate || '',
        endDate: endDate || ''
      });
      
      const response = await fetch(`/api/admin/data/calls/stats?${params}`, {
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
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCalls();
    fetchStats();
  }, [currentPage, searchTerm, typeFilter, statusFilter, startDate, endDate, fetchCalls, fetchStats]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDateFilter = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchCalls();
    fetchStats();
  };

  const handleCallAction = async (callId, action) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`/api/admin/data/calls/${callId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        if (action === 'view') {
          const data = await response.json();
          // Show call details modal
          console.log('Call details:', data);
        } else {
          fetchCalls();
        }
      } else {
        console.error(`Failed to ${action} call`);
      }
    } catch (error) {
      console.error(`Call ${action} error:`, error);
    }
    
    setActiveDropdown(null);
  };

  const getCallIcon = (direction) => {
    switch (direction) {
      case 'outbound':
        return <PhoneOutgoing size={20} />;
      case 'inbound':
        return <PhoneIncoming size={20} />;
      default:
        return <Phone size={20} />;
    }
  };

  const getCallIconColor = (direction) => {
    switch (direction) {
      case 'outbound':
        return '#2196F3';
      case 'inbound':
        return '#4CAF50';
      default:
        return '#FFC900';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'failed':
      case 'canceled':
        return 'failed';
      case 'busy':
        return 'busy';
      case 'no-answer':
        return 'no-answer';
      case 'in-progress':
        return 'in-progress';
      default:
        return 'no-answer';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'canceled':
        return 'Canceled';
      case 'busy':
        return 'Busy';
      case 'no-answer':
        return 'No Answer';
      case 'in-progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '0s';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(4)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (username) => {
    return username ? username.slice(0, 2).toUpperCase() : '??';
  };

  return (
    <Container>
      <Header>
        <Title>Call Records Management</Title>
        <HeaderActions>
          <ActionButton onClick={handleRefresh}>
            <RefreshCw size={16} />
            Refresh
          </ActionButton>
          <ActionButton>
            <Download size={16} />
            Export
          </ActionButton>
        </HeaderActions>
      </Header>

      <StatsCards>
        <StatCard color="#4CAF50">
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Calls</StatLabel>
        </StatCard>
        <StatCard color="#2196F3">
          <StatValue>{stats.outgoing}</StatValue>
          <StatLabel>Outgoing</StatLabel>
        </StatCard>
        <StatCard color="#FF9800">
          <StatValue>{stats.incoming}</StatValue>
          <StatLabel>Incoming</StatLabel>
        </StatCard>
        <StatCard color="#9C27B0">
          <StatValue>{stats.completed}</StatValue>
          <StatLabel>Completed</StatLabel>
        </StatCard>
        <StatCard color="#F44336">
          <StatValue>{stats.failed}</StatValue>
          <StatLabel>Failed</StatLabel>
        </StatCard>
        <StatCard color="#607D8B">
          <StatValue>{formatDuration(stats.totalDuration)}</StatValue>
          <StatLabel>Total Duration</StatLabel>
        </StatCard>
        <StatCard color="#795548">
          <StatValue>{formatCurrency(stats.totalCost)}</StatValue>
          <StatLabel>Total Cost</StatLabel>
        </StatCard>
      </StatsCards>

      <FiltersSection>
        <FiltersRow>
          <SearchInput
            type="text"
            placeholder="Search phone numbers..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <FilterSelect value={typeFilter} onChange={handleTypeFilter}>
            <option value="all">All Types</option>
            <option value="outgoing">Outgoing</option>
            <option value="incoming">Incoming</option>
          </FilterSelect>
          <FilterSelect value={statusFilter} onChange={handleStatusFilter}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="busy">Busy</option>
            <option value="no-answer">No Answer</option>
          </FilterSelect>
          <DateInput
            type="date"
            value={startDate}
            onChange={(e) => handleDateFilter('start', e.target.value)}
            placeholder="Start Date"
          />
          <DateInput
            type="date"
            value={endDate}
            onChange={(e) => handleDateFilter('end', e.target.value)}
            placeholder="End Date"
          />
        </FiltersRow>
      </FiltersSection>

      <TableContainer>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Call</TableHeaderCell>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Duration</TableHeaderCell>
              <TableHeaderCell>Cost</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Recording</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="8">
                  <LoadingSpinner>
                    <RefreshCw size={24} />
                  </LoadingSpinner>
                </TableCell>
              </TableRow>
            ) : calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                  No calls found
                </TableCell>
              </TableRow>
            ) : (
              calls.map(call => (
                <TableRow key={call.id}>
                  <TableCell>
                    <CallInfo>
                      <CallIcon color={getCallIconColor(call.direction)}>
                        {getCallIcon(call.direction)}
                      </CallIcon>
                      <CallDetails>
                        <PhoneNumber>
                          {call.direction === 'outbound' ? call.toNumber : call.fromNumber}
                        </PhoneNumber>
                        <CallDirection>
                          {call.direction === 'outbound' ? 'Outbound' : 'Incoming'}
                          {call.country && ` • ${call.country}`}
                        </CallDirection>
                      </CallDetails>
                    </CallInfo>
                  </TableCell>
                  <TableCell>
                    <UserInfo>
                      <UserAvatar>
                        {getUserInitials(call.user?.username)}
                      </UserAvatar>
                      <Username>{call.user?.username || 'Unknown'}</Username>
                    </UserInfo>
                  </TableCell>
                  <TableCell>
                    <StatusBadge className={getStatusBadge(call.status)}>
                      {getStatusText(call.status)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{formatDuration(call.duration)}</TableCell>
                  <TableCell>{formatCurrency(call.cost)}</TableCell>
                  <TableCell>{formatDate(call.createdAt)}</TableCell>
                  <TableCell>
                    <RecordingButton 
                      available={call.hasRecording}
                      onClick={() => call.hasRecording && handleCallAction(call.id, 'play-recording')}
                    >
                      {call.hasRecording ? <Headphones size={14} /> : <Volume2 size={14} />}
                    </RecordingButton>
                  </TableCell>
                  <TableCell>
                    <ActionsMenu>
                      <ActionsButton
                        onClick={() => setActiveDropdown(activeDropdown === call.id ? null : call.id)}
                      >
                        <MoreVertical size={16} />
                      </ActionsButton>
                      <ActionsDropdown show={activeDropdown === call.id}>
                        <ActionItem onClick={() => handleCallAction(call.id, 'view')}>
                          <Eye size={14} />
                          View Details
                        </ActionItem>
                        {call.hasRecording && (
                          <ActionItem onClick={() => handleCallAction(call.id, 'download-recording')}>
                            <Download size={14} />
                            Download Recording
                          </ActionItem>
                        )}
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
            Showing {((currentPage - 1) * callsPerPage) + 1} to {Math.min(currentPage * callsPerPage, totalCalls)} of {totalCalls} calls
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

export default CallRecordsManagement; 