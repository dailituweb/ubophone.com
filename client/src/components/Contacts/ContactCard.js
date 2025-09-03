import React, { memo } from 'react';
import styled from 'styled-components';
import { Phone, Edit, Trash2, Clock } from 'lucide-react';
import { detectCountryFromPhone } from '../../utils/countryOptions';

const CardContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  cursor: pointer;

  &:hover {
    transform: translate(-3px, -3px);
    box-shadow: 3px 3px 0 #000;
  }

  ${props => props.$isSelected && `
    background: #FFC900;
    border-color: #0a0f2f;
  `}

  @media (max-width: 768px) {
    padding: 1.25rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const ContactHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ContactAvatar = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.$bgColor || '#0a0f2f'};
  color: white;
  border: 3px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  word-break: break-word;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const ContactDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  color: #666;
  word-break: break-all;

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const ContactMeta = styled.div`
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #999;
`;

const LastCalled = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #999;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const ContactActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
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

  &.call {
    background: #FFC900;
    color: #0a0f2f;
    
    &:hover {
      background: #e6b400;
    }
  }

  &.edit {
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

const SelectCheckbox = styled.input`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

// 生成头像颜色
const getAvatarColor = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// 生成头像字母
const getAvatarInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// 格式化最后通话时间
const formatLastCalled = (lastCalled) => {
  if (!lastCalled) return null;
  
  const date = new Date(lastCalled);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const ContactCard = memo(({ 
  contact, 
  onCall, 
  onEdit, 
  onDelete, 
  onSelect, 
  isSelected = false,
  showCheckbox = false 
}) => {
  const avatarInitials = getAvatarInitials(contact.name);
  const avatarColor = getAvatarColor(contact.name);
  const countryInfo = detectCountryFromPhone(contact.phone);
  const lastCalledText = formatLastCalled(contact.lastCalled);

  const handleCall = (e) => {
    e.stopPropagation();
    onCall?.(contact);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(contact);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(contact);
  };

  const handleSelect = (e) => {
    onSelect?.(contact, e.target.checked);
  };

  const handleCardClick = () => {
    if (showCheckbox) {
      onSelect?.(contact, !isSelected);
    }
  };

  return (
    <CardContainer 
      $isSelected={isSelected}
      onClick={handleCardClick}
    >
      {showCheckbox && (
        <SelectCheckbox
          type="checkbox"
          checked={isSelected}
          onChange={handleSelect}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <ContactHeader>
        <ContactAvatar $bgColor={avatarColor}>
          {avatarInitials}
        </ContactAvatar>
        
        <ContactInfo>
          <ContactName>{contact.name}</ContactName>
          
          <ContactDetail>
            <Phone size={14} />
            {contact.phone}
            {countryInfo && (
              <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                {countryInfo.flag} {countryInfo.name}
              </span>
            )}
          </ContactDetail>
          
          {contact.email && (
            <ContactDetail>
              📧 {contact.email}
            </ContactDetail>
          )}
          
          <ContactMeta>
            Added {new Date(contact.createdAt).toLocaleDateString()}
            {lastCalledText && (
              <LastCalled>
                <Clock size={12} />
                Last called {lastCalledText}
              </LastCalled>
            )}
          </ContactMeta>
        </ContactInfo>
      </ContactHeader>

      <ContactActions>
        <ActionButton 
          className="call" 
          onClick={handleCall}
          title="Call contact"
        >
          <Phone size={16} />
        </ActionButton>
        
        <ActionButton 
          className="edit" 
          onClick={handleEdit}
          title="Edit contact"
        >
          <Edit size={16} />
        </ActionButton>
        
        <ActionButton 
          className="delete" 
          onClick={handleDelete}
          title="Delete contact"
        >
          <Trash2 size={16} />
        </ActionButton>
      </ContactActions>
    </CardContainer>
  );
});

ContactCard.displayName = 'ContactCard';

export default ContactCard;
