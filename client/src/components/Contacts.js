import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { Users, Plus, Search, Edit, Trash2, Phone, Clock, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { detectCountryFromPhone } from '../utils/countryOptions';

const ContactsContainer = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

  @media (max-width: 768px) {
    border-radius: 0;
    margin: 0.5rem;
  }
`;

const Header = styled.div`
  background: #FFC900;
  padding: 2rem;
  border-bottom: 3px solid #000;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #000;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 480px) {
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
`;

const TitleSection = styled.div`
  flex: 1;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;

  svg {
    color: #0a0f2f;
    width: 28px;
    height: 28px;
  }

  @media (max-width: 768px) {
    font-size: 1.75rem;
    justify-content: center;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #0a0f2f;
  font-size: 1rem;
  margin: 0;
  font-weight: 600;
  opacity: 0.8;

  @media (max-width: 768px) {
    text-align: center;
    font-size: 0.9rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
  }

  @media (max-width: 360px) {
    gap: 0.5rem;
  }
`;

// 快速搜索建议组件
const SearchSuggestions = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #000;
  border-top: none;
  border-radius: 0;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const SuggestionItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #FFC900;
    color: #0a0f2f;
    font-weight: 600;
  }

  &:last-child {
    border-bottom: none;
  }

  svg {
    width: 14px;
    height: 14px;
    color: #666;
  }

  &:hover svg {
    color: #0a0f2f;
  }
`;


const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: 300px;
  }

  @media (max-width: 480px) {
    width: 100%;
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.875rem 1rem 0.875rem 3rem;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  transition: all 0.3s ease;

  &:focus {
    border-color: #000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &::placeholder {
    color: #666;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    font-size: 16px; /* Prevents zoom on iOS */
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #0a0f2f;
  pointer-events: none;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const AddContactButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0a0f2f;
  border: 2px solid #000;
  border-radius: 0;
  color: white;
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    background: #000;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
  }
`;

const StatsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 0;
  margin-top: 1rem;
  border-top: 2px solid #f0f0f0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 1rem;
    justify-content: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #0a0f2f;
  font-size: 0.875rem;
  font-weight: 600;
  background: white;
  border: 2px solid #000;
  border-radius: 0;
  padding: 0.5rem 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
    background: #FFC900;
  }

  svg {
    color: #FFC900;
    width: 16px;
    height: 16px;
    transition: color 0.3s ease;
  }

  &:hover svg {
    color: #0a0f2f;
  }

  span {
    font-weight: 800;
    color: #0a0f2f;
    margin-right: 0.25rem;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    padding: 0.375rem 0.5rem;
  }
`;

const ContactsGrid = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1rem 0.75rem;
    gap: 0.5rem;
  }

  @media (max-width: 360px) {
    padding: 0.75rem 0.5rem;
  }
`;

const ContactCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.25rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #FFC900 0%, #ffdd4a 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;

    &::before {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    border-width: 2px;
    gap: 0.5rem;
  }
`;



const ContactActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  align-items: center;

  @media (max-width: 768px) {
    gap: 0.375rem;
    width: 100%;
    justify-content: center;
  }

  @media (max-width: 480px) {
    gap: 0.25rem;
  }
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 0;
  background: white;
  border: 2px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a0f2f;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 480px) {
    width: 44px;
    height: 44px;
  }

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  ${props => props.$primary && `
    background: #FFC900;
    color: #0a0f2f;
    
    &:hover {
      background: #FFC900;
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  `}

  ${props => props.$secondary && `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  `}

  ${props => props.$danger && `
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  `}

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ContactName = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #0a0f2f;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;


const ContactDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
  word-break: break-all;
  overflow-wrap: break-word;

  svg {
    color: #FFC900;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    font-size: 0.8rem;
    flex-wrap: wrap;
  }
`;

const ContactMeta = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
`;

const LastCalled = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  svg {
    width: 12px;
    height: 12px;
    color: #FFC900;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;

  @media (max-width: 480px) {
    padding: 2rem 1rem;
  }
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a0f2f;

  svg {
    width: 40px;
    height: 40px;
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 60px;

    svg {
      width: 30px;
      height: 30px;
    }
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const EmptyDescription = styled.p`
  margin-bottom: 2rem;
  line-height: 1.6;
  font-weight: 500;

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

// 模态框样式
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  @media (max-width: 480px) {
    padding: 1.5rem;
    border-radius: 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const ModalTitle = styled.h2`
  color: #0a0f2f;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0;
  transition: all 0.3s ease;

  &:hover {
    color: #0a0f2f;
    background: #f5f5f5;
  }
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  color: #0a0f2f;
  font-size: 0.9rem;
  font-weight: 600;
`;

const FormInput = styled.input`
  padding: 0.75rem;
  border: 2px solid #000;
  border-radius: 0;
  background: white;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }

  &::placeholder {
    color: #666;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 2px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;

  ${props => props.$primary ? `
    background: #FFC900;
    color: #0a0f2f;
    
    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  ` : `
    background: white;
    color: #0a0f2f;
    
    &:hover {
      background: #f5f5f5;
      transform: translate(-2px, -2px);
      box-shadow: 2px 2px 0 #000;
    }
  `}

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

// 添加联系人头像组件
const ContactAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFC900 0%, #ffdd4a 100%);
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a0f2f;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(255, 201, 0, 0.3);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  @media (max-width: 480px) {
    width: 45px;
    height: 45px;
    font-size: 1.1rem;
  }
`;

// 独立的联系人卡片组件，使用 React.memo 优化重新渲染
const ContactCardComponent = React.memo(({ contact, onCall, onEdit, onDelete }) => {
  // 生成联系人头像字母
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2);
  };

  return (
    <ContactCard>
      <ContactAvatar>
        {getInitials(contact.name)}
      </ContactAvatar>
      
      <ContactInfo>
        <ContactName>{contact.name}</ContactName>
        <ContactDetail>
          <Phone />
          {contact.phone}
        </ContactDetail>
        
        {contact.lastCalled && (
          <ContactMeta>
            <LastCalled>
              <Clock />
              Last called: {new Date(contact.lastCalled).toLocaleDateString()}
            </LastCalled>
          </ContactMeta>
        )}
      </ContactInfo>

      <ContactActions>
        <ActionButton $primary onClick={() => onCall(contact)} title="Call">
          <Phone />
        </ActionButton>
        <ActionButton $secondary onClick={() => onEdit(contact)} title="Edit">
          <Edit />
        </ActionButton>
        <ActionButton $danger onClick={() => onDelete(contact.id)} title="Delete">
          <Trash2 />
        </ActionButton>
      </ContactActions>
    </ContactCard>
  );
});

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  // 搜索建议功能
  const generateSearchSuggestions = useCallback((query) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // 基于现有联系人生成建议
    contacts.forEach(contact => {
      if (contact.name.toLowerCase().includes(queryLower) && 
          !suggestions.some(s => s.text === contact.name)) {
        suggestions.push({
          type: 'contact',
          text: contact.name,
          icon: <Users size={14} />
        });
      }
      if (contact.phone.includes(query) && 
          !suggestions.some(s => s.text === contact.phone)) {
        suggestions.push({
          type: 'phone',
          text: contact.phone,
          icon: <Phone size={14} />
        });
      }
    });

    setSearchSuggestions(suggestions.slice(0, 5));
    setShowSuggestions(suggestions.length > 0);
  }, [contacts]);


  // 处理搜索建议选择
  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
  }, []);

  // 处理搜索输入变化
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    generateSearchSuggestions(value);
  }, [generateSearchSuggestions]);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [contacts, searchTerm]);


  // 获取联系人数据
  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContacts(data.contacts || []);
        } else {
          console.error('Failed to fetch contacts:', data.message);
          toast.error('Failed to load contacts');
          setContacts([]);
        }
      } else if (response.status === 401) {
        console.error('Unauthorized access to contacts');
        toast.error('Please log in to view contacts');
        setContacts([]);
      } else {
        console.error('Failed to fetch contacts, status:', response.status);
        toast.error('Failed to load contacts');
        setContacts([]);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateLastCalled = useCallback(async (contactId) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/last-called`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          lastCalled: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContacts(prev => prev.map(contact =>
            contact.id === contactId
              ? { ...contact, lastCalled: new Date().toISOString() }
              : contact
          ));
        }
      }
      // 如果API调用失败，仍然更新本地状态以提供即时反馈
      else {
        setContacts(prev => prev.map(contact =>
          contact.id === contactId
            ? { ...contact, lastCalled: new Date().toISOString() }
            : contact
        ));
      }
    } catch (error) {
      console.error('Error updating last called time:', error);
      // 即使出错也更新本地状态
      setContacts(prev => prev.map(contact =>
        contact.id === contactId
          ? { ...contact, lastCalled: new Date().toISOString() }
          : contact
      ));
    }
  }, []);

  const handleCall = useCallback((contact) => {
    // 更新最后通话时间
    updateLastCalled(contact.id);
    
    // 跳转到PhonePage并预填充电话号码和国家代码
    let phoneNumber = contact.phone;
    let detectedCountryCode = '';
    
    // 使用共享的国家代码检测函数
    const detectionResult = detectCountryFromPhone(phoneNumber);
    
    if (detectionResult) {
      detectedCountryCode = detectionResult.countryCode;
      phoneNumber = detectionResult.cleanNumber;
      console.log('🌍 Auto-detected country from contact:', detectionResult.country.name, detectedCountryCode);
    } else {
      // 如果没有检测到国家代码，清理号码只保留数字
      phoneNumber = phoneNumber.replace(/[^\d]/g, '');
    }
    
    // 导航到PhonePage并通过URL参数传递电话号码、国家代码和联系人名称
    const params = new URLSearchParams({
      number: phoneNumber,
      contact: contact.name
    });
    
    // 如果检测到国家代码，也传递它
    if (detectedCountryCode) {
      params.append('countryCode', detectedCountryCode);
      console.log('📞 Passing country code to phone page:', detectedCountryCode);
    }
    
    navigate(`/phone?${params.toString()}`);
  }, [updateLastCalled, navigate]);

  const editContact = useCallback(async (contactId, contactData) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContacts(prev => prev.map(contact => 
            contact.id === contactId ? data.contact : contact
          ));
          toast.success('Contact updated successfully');
        } else {
          toast.error(data.message || 'Failed to update contact');
        }
      } else {
        toast.error('Failed to update contact');
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    }
  }, []);

  const handleEdit = useCallback((contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '',
      phone: contact.phone || ''
    });
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback(async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setContacts(prev => prev.filter(contact => contact.id !== contactId));
            toast.success('Contact deleted successfully');
          } else {
            toast.error(data.message || 'Failed to delete contact');
          }
        } else {
          toast.error('Failed to delete contact');
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        toast.error('Failed to delete contact');
      }
    }
  }, []);

  const addContact = useCallback(async (contactData) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setContacts(prev => [...prev, data.contact]);
          toast.success('Contact added successfully');
        } else {
          toast.error(data.message || 'Failed to add contact');
        }
      } else {
        toast.error('Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  }, []);

  const openAddModal = useCallback(() => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: ''
    });
    setIsModalOpen(true);
  }, []);

  const handleAddContact = openAddModal;

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingContact(null);
    setFormData({
      name: '',
      phone: ''
    });
  }, []);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // 如果是电话号码字段，自动过滤只保留数字和+号
    if (name === 'phone') {
      processedValue = value.replace(/[^\d+]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }, []);

  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    try {
      if (editingContact) {
        // 编辑现有联系人
        await editContact(editingContact.id, formData);
      } else {
        // 添加新联系人
        await addContact(formData);
      }
      closeModal();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  }, [formData, editingContact, editContact, addContact, closeModal]);


  const totalContacts = contacts.length;
  const recentlyCalledCount = contacts.filter(c => c.lastCalled).length;

  if (loading) {
    return (
      <ContactsContainer>
        <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
          Loading contacts...
        </div>
      </ContactsContainer>
    );
  }

  return (
    <ContactsContainer>
      <Header>
        <HeaderTop>
          <TitleSection>
            <Title>
              <Users />
              Contacts
            </Title>
            <Subtitle>
              Manage your calling contacts and stay connected
            </Subtitle>
          </TitleSection>
          
          <HeaderActions>
            <SearchContainer>
              <SearchIcon>
                <Search />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => generateSearchSuggestions(searchTerm)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <SearchSuggestions>
                  {searchSuggestions.map((suggestion, index) => (
                    <SuggestionItem
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion.icon}
                      {suggestion.text}
                    </SuggestionItem>
                  ))}
                </SearchSuggestions>
              )}
            </SearchContainer>
            
            <AddContactButton onClick={handleAddContact}>
              <Plus />
              Add Contact
            </AddContactButton>
          </HeaderActions>
        </HeaderTop>

        <StatsBar>
          <StatItem>
            <Users />
            <span>{totalContacts}</span> Total Contacts
          </StatItem>
          <StatItem>
            <Phone />
            <span>{recentlyCalledCount}</span> Recently Called
          </StatItem>
          {searchTerm && (
            <StatItem>
              <Search />
              <span>{filteredContacts.length}</span> Search Results
            </StatItem>
          )}
        </StatsBar>
      </Header>


      {filteredContacts.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            {searchTerm ? <Search /> : <Users />}
          </EmptyIcon>
          <EmptyTitle>
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </EmptyTitle>
          <EmptyDescription>
            {searchTerm 
              ? `No contacts match "${searchTerm}". Try a different search term.`
              : 'Start building your contact list to make calling easier.'
            }
          </EmptyDescription>
          {!searchTerm && (
            <AddContactButton onClick={handleAddContact}>
              <Plus />
              Add Your First Contact
            </AddContactButton>
          )}
        </EmptyState>
      ) : (
        <ContactsGrid>
          {filteredContacts.map(contact => (
            <ContactCardComponent
              key={contact.id}
              contact={contact}
              onCall={handleCall}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </ContactsGrid>
      )}

      {/* 添加/编辑联系人模态框 */}
      {isModalOpen && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </ModalTitle>
              <CloseButton onClick={closeModal}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>

            <ModalForm onSubmit={handleFormSubmit}>
              <FormGroup>
                <FormLabel htmlFor="name">Name *</FormLabel>
                <FormInput
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel htmlFor="phone">Phone Number *</FormLabel>
                <FormInput
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g., +1234567890"
                  value={formData.phone}
                  onChange={handleFormChange}
                  onPaste={(e) => {
                    // 处理粘贴事件，自动过滤符号
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    const filtered = pastedText.replace(/[^\d+]/g, '');
                    setFormData(prev => ({
                      ...prev,
                      phone: prev.phone + filtered
                    }));
                  }}
                  required
                />
              </FormGroup>


              <FormActions>
                <ModalButton type="button" onClick={closeModal}>
                  Cancel
                </ModalButton>
                <ModalButton type="submit" $primary>
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </ModalButton>
              </FormActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}
    </ContactsContainer>
  );
}

export default Contacts;