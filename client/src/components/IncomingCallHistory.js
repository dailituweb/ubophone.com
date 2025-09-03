import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  PhoneIncoming, 
  Filter, 
  Search,
  Calendar,
  Clock,
  Phone,
  User,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Play,
  Download,
  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  background: #FAFAFA;
  padding: 2rem 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
  }
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 #000;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
    margin: 0 0.5rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    border-width: 2px;
    box-shadow: 4px 4px 0 #000;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.5rem;
    gap: 0.5rem;
  }
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.125rem;
  line-height: 1.6;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    width: 100%;
    
    /* Hide non-search filter groups on mobile - they'll be shown in MobileFilterRow */
    &:not(:first-child) {
      display: none;
    }
  }
`;

const MobileFilterRow = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  
  /* Only show this layout on mobile */
  @media (min-width: 769px) {
    display: none;
  }
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  color: #0a0f2f;
  font-size: 0.875rem;
  min-width: 200px;
  font-weight: 600;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }
  
  @media (max-width: 480px) {
    min-width: auto;
    width: 100%;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  color: #0a0f2f;
  font-size: 0.875rem;
  min-width: 150px;
  font-weight: 600;

  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }

  option {
    background: white;
    color: #0a0f2f;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: ${props => props.primary ? '#FFC900' : 'transparent'};
  color: ${props => props.primary ? '#0a0f2f' : '#0a0f2f'};
  border: ${props => props.primary ? '3px solid #000' : '2px solid #000'};
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: ${props => props.primary ? '800' : '600'};
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: ${props => props.primary ? 'uppercase' : 'none'};
  letter-spacing: ${props => props.primary ? '0.5px' : '0'};

  &:hover {
    background: ${props => props.primary ? '#FFC900' : '#FFC900'};
    color: #0a0f2f;
    transform: ${props => props.primary ? 'translate(-2px, -2px)' : 'none'};
    box-shadow: ${props => props.primary ? '2px 2px 0 #000' : 'none'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    /* Hide the original button on mobile - it'll be shown in MobileFilterRow */
    display: none;
  }
`;

const MobileButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;

  &:hover {
    background: #FFB800;
    transform: translate(-1px, -1px);
    box-shadow: 1px 1px 0 #000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Only show on mobile */
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const CallsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CallCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 4px 4px 0 #000;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 #000;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
    border-width: 2px;
    box-shadow: 2px 2px 0 #000;
    
    &:hover {
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 #000;
    }
  }
`;

const CallHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const CallInfo = styled.div`
  flex: 1;
  
  @media (max-width: 768px) {
    flex: none;
    width: 100%;
  }
`;

const CallerNumber = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    justify-content: space-between;
    width: 100%;
  }
  
  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const CallMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: #666;
  flex-wrap: wrap;
  font-weight: 600;
  
  span {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    
    svg {
      flex-shrink: 0;
    }
  }
  
  @media (max-width: 768px) {
    gap: 0.75rem;
    font-size: 0.8rem;
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    
    span {
      font-size: 0.75rem;
    }
  }
`;

const StatusBadge = styled.div`
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  border: 2px solid #000;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'answered': return '#10b981';
      case 'missed': return '#f59e0b';
      case 'no-answer': return '#ef4444';
      case 'voicemail': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'answered': return 'white';
      case 'missed': return '#000';
      case 'no-answer': return 'white';
      case 'voicemail': return 'white';
      default: return 'white';
    }
  }};
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    /* Hide the original status badge on mobile - we'll show it inside CallerNumber */
    display: none;
  }
`;

const MobileStatusBadge = styled.div`
  padding: 0.2rem 0.5rem;
  border-radius: 0;
  border: 2px solid #000;
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'answered': return '#10b981';
      case 'missed': return '#f59e0b';
      case 'no-answer': return '#ef4444';
      case 'voicemail': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'answered': return 'white';
      case 'missed': return '#000';
      case 'no-answer': return 'white';
      case 'voicemail': return 'white';
      default: return 'white';
    }
  }};
  flex-shrink: 0;
  
  /* Only show on mobile */
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const CallDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  
  @media (max-width: 480px) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  font-weight: 600;
`;

const CallActions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: ${props => {
    if (props.danger) return 'white';
    if (props.secondary) return 'white';
    return '#FFC900';
  }};
  color: ${props => {
    if (props.danger) return '#ef4444';
    if (props.secondary) return '#0a0f2f';
    return '#0a0f2f';
  }};
  border: 2px solid ${props => {
    if (props.danger) return '#ef4444';
    if (props.secondary) return '#000';
    return '#000';
  }};
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 ${props => {
      if (props.danger) return '#ef4444';
      if (props.secondary) return '#000';
      return '#000';
    }};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    font-size: 0.8rem;
    padding: 0.6rem 1rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #666;
  font-weight: 600;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #666;
  font-weight: 600;
`;

const NotesModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 8px 8px 0 #000;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-transform: uppercase;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  color: #0a0f2f;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  font-weight: 600;
  box-sizing: border-box;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PageInfo = styled.div`
  color: #666;
  font-size: 0.875rem;
  font-weight: 600;
`;

function IncomingCallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    phoneNumberId: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchCalls = React.useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.phoneNumberId && { phoneNumberId: filters.phoneNumberId })
      });

      const response = await fetch(`/api/incoming-calls/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${user?.token || ''}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        }));
      } else {
        toast.error('Failed to fetch call history');
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast.error('Error loading call history');
      setCalls([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 0
      }));
    } finally {
      setLoading(false);
    }
  }, [user?.token, pagination.page, pagination.limit, filters.status, filters.phoneNumberId]);

  useEffect(() => {
    if (user) {
      fetchCalls();
    }
  }, [user, fetchCalls]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleNotesEdit = (call) => {
    setSelectedCall(call);
    setNotes(call.userNotes || '');
    setShowNotesModal(true);
  };

  const saveNotes = async () => {
    if (!selectedCall) return;

    setSavingNotes(true);
    try {
      const response = await fetch(`/api/incoming-calls/${selectedCall.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`
        },
        body: JSON.stringify({
          notes: notes.trim(),
          isSpam: selectedCall.isSpam || false,
          isBlocked: selectedCall.isBlocked || false
        })
      });

      if (response.ok) {
        toast.success('Notes saved successfully');
        setShowNotesModal(false);
        fetchCalls(); // Refresh the list
      } else {
        toast.error('Failed to save notes');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Error saving notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (!user) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Please login to view call history</h2>
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <RefreshCw className="animate-spin" size={24} />
          <span style={{ marginLeft: '0.5rem' }}>Loading call history...</span>
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Content>
        <Header>
          <Title>
            <PhoneIncoming size={40} />
            Incoming Call History
          </Title>
          <Subtitle>Review and manage your incoming call records</Subtitle>
        </Header>

      <FilterBar>
        <FilterGroup>
          <Search size={20} />
          <Input
            type="text"
            placeholder="Search by caller number..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </FilterGroup>
        <FilterGroup>
          <Filter size={20} />
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="answered">Answered</option>
            <option value="missed">Missed</option>
            <option value="no-answer">No Answer</option>
            <option value="voicemail">Voicemail</option>
          </Select>
        </FilterGroup>
        <Button onClick={fetchCalls}>
          <RefreshCw size={16} />
          Refresh
        </Button>
        
        {/* Mobile-only second row with dropdown and refresh button */}
        <MobileFilterRow>
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="">All Status</option>
            <option value="answered">Answered</option>
            <option value="missed">Missed</option>
            <option value="no-answer">No Answer</option>
            <option value="voicemail">Voicemail</option>
          </Select>
          <MobileButton onClick={fetchCalls}>
            <RefreshCw size={16} />
            Refresh
          </MobileButton>
        </MobileFilterRow>
      </FilterBar>

      {calls.length === 0 ? (
        <EmptyState>
          <PhoneIncoming size={64} color="#FFC900" />
          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#0a0f2f' }}>No Incoming Calls</h3>
          <p>You haven't received any incoming calls yet.</p>
        </EmptyState>
      ) : (
        <>
          <CallsList>
            {calls.map((call) => (
              <CallCard key={call.id}>
                <CallHeader>
                  <CallInfo>
                    <CallerNumber>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Phone size={20} />
                        {call.fromNumber}
                      </div>
                      <MobileStatusBadge status={call.status}>
                        {call.status}
                      </MobileStatusBadge>
                    </CallerNumber>
                    <CallMeta>
                      <span><Calendar size={14} /> {formatDate(call.startTime)}</span>
                      {call.duration > 0 && (
                        <span><Clock size={14} /> {formatDuration(call.duration)}</span>
                      )}
                      <span><User size={14} /> To: {call.toNumber}</span>
                      {call.handledBy && (
                        <span>Handled by: {call.handledBy}</span>
                      )}
                    </CallMeta>
                  </CallInfo>
                  <StatusBadge status={call.status}>
                    {call.status}
                  </StatusBadge>
                </CallHeader>

                <CallDetails>
                  {call.callerLocation && typeof call.callerLocation === 'object' && 
                   (call.callerLocation.city || call.callerLocation.region || call.callerLocation.country) && (
                    <DetailItem>
                      <User size={16} />
                      Location: {`${call.callerLocation.city || ''}, ${call.callerLocation.region || ''}, ${call.callerLocation.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')}
                    </DetailItem>
                  )}
                  {call.hasRecording && (
                    <DetailItem>
                      <Play size={16} />
                      Recording available
                    </DetailItem>
                  )}
                  {call.hasVoicemail && (
                    <DetailItem>
                      <MessageSquare size={16} />
                      Voicemail message
                    </DetailItem>
                  )}
                  {call.isSpam && (
                    <DetailItem>
                      <AlertTriangle size={16} color="#ef4444" />
                      Marked as spam
                    </DetailItem>
                  )}
                </CallDetails>

                {call.userNotes && (
                  <div style={{ 
                    background: '#FFC900', 
                    padding: '0.75rem', 
                    border: '2px solid #000',
                    borderRadius: '0', 
                    margin: '1rem 0',
                    fontSize: '0.875rem',
                    color: '#0a0f2f',
                    fontWeight: '600'
                  }}>
                    <strong>Notes:</strong> {call.userNotes}
                  </div>
                )}

                <CallActions>
                  <ActionButton onClick={() => handleNotesEdit(call)}>
                    <Edit3 size={16} />
                    {call.userNotes ? 'Edit Notes' : 'Add Notes'}
                  </ActionButton>
                  {call.hasRecording && (
                    <ActionButton secondary>
                      <Play size={16} />
                      Play Recording
                    </ActionButton>
                  )}
                  {call.hasVoicemail && (
                    <ActionButton secondary>
                      <Download size={16} />
                      Download Voicemail
                    </ActionButton>
                  )}
                </CallActions>
              </CallCard>
            ))}
          </CallsList>

          {pagination.totalPages > 1 && (
            <Pagination>
              <Button 
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <PageInfo>
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.total} total calls)
              </PageInfo>
              <Button 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </Pagination>
          )}
        </>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <NotesModal onClick={() => setShowNotesModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Edit3 size={20} />
                Call Notes
              </ModalTitle>
              <button 
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold' }}
                onClick={() => setShowNotesModal(false)}
              >
                ×
              </button>
            </ModalHeader>
            
            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666', fontWeight: '600' }}>
              Call from {selectedCall?.fromNumber} on {selectedCall && formatDate(selectedCall.startTime)}
            </div>
            
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this call..."
              rows="4"
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button onClick={() => setShowNotesModal(false)}>
                Cancel
              </Button>
              <Button primary onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </ModalContent>
        </NotesModal>
      )}
      </Content>
    </Container>
  );
}

export default IncomingCallHistory;