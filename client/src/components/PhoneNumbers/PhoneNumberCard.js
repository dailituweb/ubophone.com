import React, { memo } from 'react';
import styled from 'styled-components';
import { Phone, Settings, Trash2, PhoneCall, MessageSquare, DollarSign, Clock } from 'lucide-react';

const CardContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translate(-3px, -3px);
    box-shadow: 3px 3px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const NumberInfo = styled.div`
  flex: 1;
`;

const PhoneNumber = styled.h3`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const NumberType = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const StatusBadge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  
  ${props => {
    switch (props.$status) {
      case 'active':
        return `
          background: #28a745;
          color: white;
        `;
      case 'inactive':
        return `
          background: #ffc107;
          color: #000;
        `;
      case 'suspended':
        return `
          background: #dc3545;
          color: white;
        `;
      default:
        return `
          background: #6c757d;
          color: white;
        `;
    }
  }}
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &.settings {
    background: #007bff;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
  }

  &.delete {
    background: #dc3545;
    color: white;
    
    &:hover {
      background: #c82333;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const CardBody = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border: 2px solid #000;
  border-radius: 0;
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 2px solid #eee;
  font-size: 0.8rem;
  color: #666;
`;

const CostInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 600;
`;

const PurchaseDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// 格式化电话号码显示
const formatPhoneNumber = (number) => {
  if (!number) return '';
  
  // 移除国家代码前缀进行格式化
  const cleaned = number.replace(/^\+1/, '');
  
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return number;
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// 获取号码类型显示文本
const getNumberTypeText = (capabilities) => {
  if (!capabilities) return 'Unknown';
  
  const types = [];
  if (capabilities.voice) types.push('Voice');
  if (capabilities.sms) types.push('SMS');
  if (capabilities.mms) types.push('MMS');
  
  return types.length > 0 ? types.join(' + ') : 'Basic';
};

const PhoneNumberCard = memo(({ 
  number, 
  onSettings, 
  onRelease 
}) => {
  const handleSettings = () => {
    onSettings?.(number);
  };

  const handleRelease = () => {
    onRelease?.(number.id);
  };

  const formattedNumber = formatPhoneNumber(number.phoneNumber);
  const numberType = getNumberTypeText(number.capabilities);
  const purchaseDate = formatDate(number.dateCreated);

  return (
    <CardContainer>
      <CardHeader>
        <NumberInfo>
          <NumberType>{numberType}</NumberType>
          <PhoneNumber>
            <Phone size={20} />
            {formattedNumber}
          </PhoneNumber>
          <StatusBadge $status={number.status}>
            {number.status}
          </StatusBadge>
        </NumberInfo>
        
        <CardActions>
          <ActionButton 
            className="settings" 
            onClick={handleSettings}
            title="Number settings"
          >
            <Settings size={16} />
          </ActionButton>
          
          <ActionButton 
            className="delete" 
            onClick={handleRelease}
            title="Release number"
          >
            <Trash2 size={16} />
          </ActionButton>
        </CardActions>
      </CardHeader>

      <CardBody>
        <StatItem>
          <StatValue>{number.callsThisMonth || 0}</StatValue>
          <StatLabel>
            <PhoneCall size={12} style={{ marginRight: '0.25rem' }} />
            Calls
          </StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{number.smsThisMonth || 0}</StatValue>
          <StatLabel>
            <MessageSquare size={12} style={{ marginRight: '0.25rem' }} />
            Messages
          </StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>${(number.costThisMonth || 0).toFixed(2)}</StatValue>
          <StatLabel>
            <DollarSign size={12} style={{ marginRight: '0.25rem' }} />
            This Month
          </StatLabel>
        </StatItem>
      </CardBody>

      <CardFooter>
        <CostInfo>
          <DollarSign size={12} />
          ${(number.monthlyCost || 1.00).toFixed(2)}/month
        </CostInfo>
        
        <PurchaseDate>
          <Clock size={12} />
          Added {purchaseDate}
        </PurchaseDate>
      </CardFooter>
    </CardContainer>
  );
});

PhoneNumberCard.displayName = 'PhoneNumberCard';

export default PhoneNumberCard;
