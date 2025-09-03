import React from 'react';
import styled from 'styled-components';
import { Phone, PhoneIncoming, Globe, CreditCard, MessageSquare, Package, DollarSign, Download } from 'lucide-react';
import { useBillingHistory } from '../hooks/useApi';
import { toast } from 'react-toastify';

const HistoryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const HistoryHeader = styled.div`
  background: #000;
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
`;

const HistoryTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  
  @media (max-width: 768px) {
    font-size: 1.125rem;
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #FFC900;
  color: #000;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

// Desktop Table
const DesktopTable = styled.div`
  display: block;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: #f5f5f5;
  border-bottom: 2px solid #000;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e5e5;
  
  &:hover {
    background: #fafafa;
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  color: #0a0f2f;
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #666;
`;

// Mobile Cards
const MobileCards = styled.div`
  display: none;
  padding: 1rem;

  @media (max-width: 768px) {
    display: block;
  }
`;

const TransactionCard = styled.div`
  border: 2px solid #000;
  border-radius: 0;
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const CardHeader = styled.div`
  background: ${props => props.bg || '#f5f5f5'};
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #000;
`;

const CardType = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 0.875rem;
`;

const CardAmount = styled.div`
  font-size: 1.125rem;
  font-weight: 800;
  color: ${props => props.positive ? '#22C55E' : '#EF4444'};
`;

const CardBody = styled.div`
  padding: 1rem;
  background: white;
`;

const CardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.875rem;
  
  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const CardLabel = styled.span`
  color: #666;
  font-weight: 500;
`;

const CardValue = styled.span`
  font-weight: 700;
  color: #0a0f2f;
`;

// Empty State
const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #f5f5f5;
  border: 3px solid #000;
  border-radius: 0;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 0.5rem;
`;

const EmptyText = styled.p`
  color: #666;
  font-size: 0.875rem;
`;

// Loading State
const LoadingState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  color: #666;
  font-weight: 600;
`;

const BillingHistory = ({ filter, dateRange }) => {
  const { data: response, isLoading: loading } = useBillingHistory(filter, dateRange);

  // Transaction type configurations
  const typeConfig = {
    outgoing_call: { 
      icon: Phone, 
      label: 'Outgoing Call', 
      bg: '#DBEAFE', 
      color: '#3B82F6' 
    },
    incoming_call: { 
      icon: PhoneIncoming, 
      label: 'Incoming Call', 
      bg: '#D1FAE5', 
      color: '#10B981' 
    },
    sms: { 
      icon: MessageSquare, 
      label: 'SMS', 
      bg: '#EDE9FE', 
      color: '#8B5CF6' 
    },
    phone_number: { 
      icon: Globe, 
      label: 'Phone Number', 
      bg: '#FEF3C7', 
      color: '#F59E0B' 
    },
    subscription: { 
      icon: Package, 
      label: 'Subscription', 
      bg: '#FCE7F3', 
      color: '#EC4899' 
    },
    credit_purchase: { 
      icon: CreditCard, 
      label: 'Credit Purchase', 
      bg: '#BBF7D0', 
      color: '#22C55E' 
    }
  };

  const data = response?.transactions || [];

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export
    toast.info('Exporting billing history...');
  };

  if (loading) {
    return (
      <HistoryContainer>
        <HistoryHeader>
          <HistoryTitle>Transaction History</HistoryTitle>
        </HistoryHeader>
        <LoadingState>Loading transactions...</LoadingState>
      </HistoryContainer>
    );
  }

  return (
    <HistoryContainer>
      <HistoryHeader>
        <HistoryTitle>Transaction History</HistoryTitle>
        <ExportButton onClick={exportToCSV}>
          <Download size={16} />
          Export CSV
        </ExportButton>
      </HistoryHeader>

      {data.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <DollarSign size={40} />
          </EmptyIcon>
          <EmptyTitle>No Transactions Yet</EmptyTitle>
          <EmptyText>Your transaction history will appear here</EmptyText>
        </EmptyState>
      ) : (
        <>
          {/* Desktop Table */}
          <DesktopTable>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Date</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Description</TableHeaderCell>
                  <TableHeaderCell>Duration</TableHeaderCell>
                  <TableHeaderCell>Amount</TableHeaderCell>
                  <TableHeaderCell>Balance</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {data.map((transaction) => {
                  const config = typeConfig[transaction.type] || {};
                  const Icon = config.icon || DollarSign;
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}<br/>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>
                          {new Date(transaction.date).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Icon size={16} style={{ color: config.color }} />
                          {config.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.description}<br/>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>
                          {transaction.details}
                        </span>
                      </TableCell>
                      <TableCell>{formatDuration(transaction.duration)}</TableCell>
                      <TableCell style={{ 
                        fontWeight: 700,
                        color: transaction.amount < 0 ? '#EF4444' : '#22C55E'
                      }}>
                        {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700 }}>
                        ${transaction.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </DesktopTable>

          {/* Mobile Cards */}
          <MobileCards>
            {data.map((transaction) => {
              const config = typeConfig[transaction.type] || {};
              const Icon = config.icon || DollarSign;
              
              return (
                <TransactionCard key={transaction.id}>
                  <CardHeader bg={config.bg}>
                    <CardType>
                      <Icon size={18} style={{ color: config.color }} />
                      {config.label}
                    </CardType>
                    <CardAmount positive={transaction.amount > 0}>
                      {transaction.amount < 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                    </CardAmount>
                  </CardHeader>
                  <CardBody>
                    <CardRow>
                      <CardLabel>Date</CardLabel>
                      <CardValue>{new Date(transaction.date).toLocaleDateString()}</CardValue>
                    </CardRow>
                    <CardRow>
                      <CardLabel>Time</CardLabel>
                      <CardValue>{new Date(transaction.date).toLocaleTimeString()}</CardValue>
                    </CardRow>
                    <CardRow>
                      <CardLabel>Description</CardLabel>
                      <CardValue>{transaction.description}</CardValue>
                    </CardRow>
                    {transaction.details && (
                      <CardRow>
                        <CardLabel>Details</CardLabel>
                        <CardValue>{transaction.details}</CardValue>
                      </CardRow>
                    )}
                    {transaction.duration && (
                      <CardRow>
                        <CardLabel>Duration</CardLabel>
                        <CardValue>{formatDuration(transaction.duration)}</CardValue>
                      </CardRow>
                    )}
                    <CardRow>
                      <CardLabel>Balance After</CardLabel>
                      <CardValue>${transaction.balance.toFixed(2)}</CardValue>
                    </CardRow>
                  </CardBody>
                </TransactionCard>
              );
            })}
          </MobileCards>
        </>
      )}
    </HistoryContainer>
  );
};

export default BillingHistory;