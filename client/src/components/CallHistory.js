import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Phone, Clock, MapPin, DollarSign } from 'lucide-react';
import { useCallHistory } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';

const HistoryContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin: 1.5rem 0;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    margin: 1rem 0;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: #000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;

  svg {
    color: #FFC900;
  }

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;


const CallList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CallItem = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    padding-top: 3rem;
  }
`;

const CallHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  position: relative;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const CallInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PhoneNumber = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: #000;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #FFC900;
    width: 18px;
    height: 18px;
  }

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const CallStatus = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid;
  text-transform: uppercase;
  
  /* 🟢 成功完成的通话 - 绿色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    return normalizedStatus === 'completed' && `
      background: #10b981;
      color: white;
      border-color: #10b981;
    `;
  }}
  
  /* 🔴 失败或取消的通话 - 红色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    return (normalizedStatus === 'failed' || normalizedStatus === 'canceled') && `
      background: #ef4444;
      color: white;
      border-color: #ef4444;
    `;
  }}
  
  /* 🟡 错过或无应答的通话 - 橙黄色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    return (normalizedStatus === 'missed' || normalizedStatus === 'no-answer') && `
      background: #f59e0b;
      color: white;
      border-color: #f59e0b;
    `;
  }}
  
  /* 🟠 忙线 - 橙色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    return normalizedStatus === 'busy' && `
      background: #f97316;
      color: white;
      border-color: #f97316;
    `;
  }}
  
  /* 🔵 进行中或响铃 - 蓝色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    return (normalizedStatus === 'in-progress' || normalizedStatus === 'ringing') && `
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    `;
  }}
  
  /* ⚫ 排队中 - 灰色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    return normalizedStatus === 'queued' && `
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    `;
  }}
  
  /* ⚪ 未知状态 - 浅灰色 */
  ${props => {
    const normalizedStatus = String(props.status).toLowerCase().trim();
    const knownStatuses = ['completed', 'failed', 'canceled', 'missed', 'no-answer', 'busy', 'in-progress', 'ringing', 'queued'];
    return !knownStatuses.includes(normalizedStatus) && `
      background: #d1d5db;
      color: #374151;
      border-color: #9ca3af;
    `;
  }}
`;

const CallDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;

  svg {
    color: #FFC900;
    width: 16px;
    height: 16px;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const CostBadge = styled.div`
  background: #FFC900;
  color: #000;
  padding: 0.5rem 1rem;
  border-radius: 0;
  border: 3px solid #000;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #666;

  @media (max-width: 480px) {
    padding: 2rem 1rem;
  }
`;

const EmptyIcon = styled.div`
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 32px;
    height: 32px;
    color: #000;
  }
`;

const LoadMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding: 1rem;
`;

const LoadMoreButton = styled.button`
  background: #FFC900;
  color: #000;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.75rem 2rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 0.6rem 1.5rem;
    font-size: 0.9rem;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #000;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;


// 优化的单个通话项目组件
const CallItemComponent = React.memo(({ call, getStatusText }) => {
  // 🔍 调试日志 - 检查每个通话记录的状态
  console.log('🔍 CallItem Debug:', {
    id: call.id,
    phoneNumber: call.phoneNumber,
    status: call.status,
    statusType: typeof call.status,
    duration: call.duration,
    cost: call.cost,
    statusText: getStatusText(call.status)
  });
  
  return (
    <CallItem>
      <CallHeader>
        <CallInfo>
          <PhoneNumber>
            <Phone />
            {call.phoneNumber}
          </PhoneNumber>
          <CallStatus status={call.status}>
            {getStatusText(call.status)}
          </CallStatus>
        </CallInfo>
      
        <CostBadge>
          ${call.cost.toFixed(2)}
        </CostBadge>
      </CallHeader>

      <CallDetails>
        <DetailItem>
          <MapPin />
          {call.country}
        </DetailItem>
        
        <DetailItem>
          <Clock />
          {call.duration}
        </DetailItem>
        
        <DetailItem>
          <DollarSign />
          {call.rate}
        </DetailItem>
        
        <DetailItem>
          <Clock />
          {call.timestamp}
        </DetailItem>
      </CallDetails>
    </CallItem>
  );
});

CallItemComponent.displayName = 'CallItemComponent';

function CallHistory() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useCallHistory();
  
  // Initialize WebSocket for real-time updates
  const { lastMessage } = useWebSocket();
  
  // Log WebSocket activity
  React.useEffect(() => {
    if (lastMessage?.type === 'new_call_record') {
      console.log('📞 CallHistory received new call record via WebSocket:', lastMessage.data);
    }
  }, [lastMessage]);

  // Debug logging
  console.log('📞 CallHistory Debug:', {
    data,
    isLoading,
    error,
    pages: data?.pages,
    pagesCount: data?.pages?.length
  });

  // Format timestamp to local time with specific format
  const formatLocalTimestamp = (isoString) => {
    if (!isoString) return '';
    
    try {
      const date = new Date(isoString);
      
      // Use Intl.DateTimeFormat for consistent formatting
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'numeric',
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      return formatter.format(date);
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return isoString;
    }
  };

  // Flatten all pages of call history data and format timestamps
  const callHistory = useMemo(() => {
    if (!data?.pages) {
      console.log('📞 No pages found in data');
      return [];
    }
    const flattened = data.pages.flatMap(page => page.calls || []);
    
    // Format timestamps for each call
    const formattedCalls = flattened.map(call => ({
      ...call,
      timestamp: formatLocalTimestamp(call.timestamp)
    }));
    
    console.log('📞 Flattened call history with local timestamps:', formattedCalls);
    return formattedCalls;
  }, [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };


  const getStatusText = (status) => {
    // 🔧 确保状态文本完全基于后端返回的 status 字段
    const normalizedStatus = String(status).toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'completed': return 'COMPLETED';
      case 'failed': return 'FAILED';
      case 'missed': return 'MISSED';
      case 'busy': return 'BUSY';
      case 'no-answer': return 'NO ANSWER';
      case 'canceled': return 'CANCELED';
      case 'in-progress': return 'IN PROGRESS';
      case 'ringing': return 'RINGING';
      case 'queued': return 'QUEUED';
      default: 
        console.warn('⚠️ Unknown call status:', status);
        return 'UNKNOWN';
    }
  };

  if (isLoading) {
    return (
      <HistoryContainer>
        <EmptyState>
          <EmptyIcon>
            <Clock />
          </EmptyIcon>
          <p>Loading call history...</p>
        </EmptyState>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <Header>
        <Title>
          <Clock />
          Call History
        </Title>
      </Header>

      {callHistory.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <Phone />
          </EmptyIcon>
          <h3>No calls found</h3>
          <p>Start making calls to see your history here</p>
        </EmptyState>
      ) : (
        <>
          <CallList>
            {callHistory.map((call) => (
              <CallItemComponent
                key={call.id}
                call={call}
                getStatusText={getStatusText}
              />
            ))}
          </CallList>
          
          {(hasNextPage || isFetchingNextPage) && (
            <LoadMoreContainer>
              <LoadMoreButton 
                onClick={handleLoadMore} 
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <LoadingSpinner /> Loading...
                  </>
                ) : (
                  'Load More Calls'
                )}
              </LoadMoreButton>
            </LoadMoreContainer>
          )}
        </>
      )}
    </HistoryContainer>
  );
}

export default CallHistory; 