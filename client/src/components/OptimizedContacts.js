import React, { useState, useEffect, useMemo, memo } from 'react';
import styled from 'styled-components';
import { Users, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { createLazyWidget } from '../utils/lazyLoading';
import { useStableCallback, withPerformanceProfiler } from '../utils/memoization';

// 懒加载子组件
const ContactCard = createLazyWidget(() => import('./Contacts/ContactCard'));
const ContactSearch = createLazyWidget(() => import('./Contacts/ContactSearch'));
const ContactForm = createLazyWidget(() => import('./Contacts/ContactForm'));

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

  @media (max-width: 768px) {
    font-size: 1.75rem;
    justify-content: center;
  }
`;

const Subtitle = styled.p`
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const AddContactButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0a0f2f;
  color: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #1a1f3f;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 480px) {
    padding: 0.6rem 1.25rem;
    font-size: 0.8rem;
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: center;
    gap: 1.5rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: #0a0f2f;
  text-transform: uppercase;
`;

const BulkActionsBar = styled.div`
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: #f8f9fa;
  border-bottom: 2px solid #000;

  @media (max-width: 768px) {
    padding: 1rem;
    flex-wrap: wrap;
  }
`;

const BulkActionButton = styled.button`
  background: white;
  color: #dc3545;
  border: 2px solid #dc3545;
  border-radius: 0;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #dc3545;
    color: white;
  }
`;

const ContactsGrid = styled.div`
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    padding: 1.5rem;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #666;
  font-size: 1rem;
`;

const OptimizedContacts = memo(() => {
  // 状态管理
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const navigate = useNavigate();

  // 过滤联系人
  const filteredContacts = useMemo(() => {
    if (!searchTerm.trim()) return contacts;
    
    const term = searchTerm.toLowerCase();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(term) ||
      contact.phone.includes(term) ||
      contact.email?.toLowerCase().includes(term)
    );
  }, [contacts, searchTerm]);

  // 统计信息
  const stats = useMemo(() => ({
    total: contacts.length,
    recentlyAdded: contacts.filter(c => 
      new Date() - new Date(c.createdAt) < 7 * 24 * 60 * 60 * 1000
    ).length,
    recentlyCalled: contacts.filter(c => c.lastCalled).length
  }), [contacts]);

  // 获取联系人列表
  const fetchContacts = useStableCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      } else {
        throw new Error('Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // 保存联系人
  const handleSaveContact = useStableCallback(async (contactData) => {
    try {
      setIsFormLoading(true);
      const token = localStorage.getItem('token');
      const url = editingContact 
        ? `/api/contacts/${editingContact.id}`
        : '/api/contacts';
      
      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (editingContact) {
          setContacts(prev => prev.map(c => 
            c.id === editingContact.id ? data.contact : c
          ));
          toast.success('Contact updated successfully');
        } else {
          setContacts(prev => [data.contact, ...prev]);
          toast.success('Contact added successfully');
        }

        setShowForm(false);
        setEditingContact(null);
      } else {
        throw new Error('Failed to save contact');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    } finally {
      setIsFormLoading(false);
    }
  }, [editingContact]);

  // 删除联系人
  const handleDeleteContact = useStableCallback(async (contact) => {
    if (!window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== contact.id));
        toast.success('Contact deleted successfully');
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  }, []);

  // 拨打电话
  const handleCallContact = useStableCallback((contact) => {
    navigate(`/phone?number=${encodeURIComponent(contact.phone)}`);
  }, [navigate]);

  // 编辑联系人
  const handleEditContact = useStableCallback((contact) => {
    setEditingContact(contact);
    setShowForm(true);
  }, []);

  // 选择联系人
  const handleSelectContact = useStableCallback((contact, isSelected) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(contact.id);
      } else {
        newSet.delete(contact.id);
      }
      return newSet;
    });
  }, []);

  // 批量删除
  const handleBulkDelete = useStableCallback(async () => {
    if (selectedContacts.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedContacts.size} selected contacts?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedContacts).map(id =>
        fetch(`/api/contacts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );

      await Promise.all(promises);
      
      setContacts(prev => prev.filter(c => !selectedContacts.has(c.id)));
      setSelectedContacts(new Set());
      toast.success(`${selectedContacts.size} contacts deleted`);
    } catch (error) {
      console.error('Error deleting contacts:', error);
      toast.error('Failed to delete contacts');
    }
  }, [selectedContacts]);

  return (
    <ContactsContainer>
      <Header>
        <HeaderTop>
          <TitleSection>
            <Title>
              <Users size={28} />
              Contacts
            </Title>
            <Subtitle>Manage your contact directory</Subtitle>
          </TitleSection>

          <HeaderActions>
            <React.Suspense fallback={<div>Loading...</div>}>
              <ContactSearch
                value={searchTerm}
                onChange={setSearchTerm}
                contacts={contacts}
                onContactSelect={handleCallContact}
              />
            </React.Suspense>

            <AddContactButton onClick={() => setShowForm(true)}>
              <Plus size={16} />
              Add Contact
            </AddContactButton>
          </HeaderActions>
        </HeaderTop>

        <StatsBar>
          <StatItem>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Contacts</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.recentlyAdded}</StatNumber>
            <StatLabel>Added This Week</StatLabel>
          </StatItem>
          <StatItem>
            <StatNumber>{stats.recentlyCalled}</StatNumber>
            <StatLabel>Recently Called</StatLabel>
          </StatItem>
        </StatsBar>
      </Header>

      <BulkActionsBar $show={selectedContacts.size > 0}>
        <span>{selectedContacts.size} contacts selected</span>
        <BulkActionButton onClick={handleBulkDelete}>
          <Trash2 size={14} />
          Delete Selected
        </BulkActionButton>
      </BulkActionsBar>

      {isLoading ? (
        <LoadingPlaceholder>Loading contacts...</LoadingPlaceholder>
      ) : filteredContacts.length === 0 ? (
        <EmptyState>
          <h3>No contacts found</h3>
          <p>Start building your contact directory by adding your first contact.</p>
        </EmptyState>
      ) : (
        <ContactsGrid>
          {filteredContacts.map(contact => (
            <React.Suspense key={contact.id} fallback={<div>Loading...</div>}>
              <ContactCard
                contact={contact}
                onCall={handleCallContact}
                onEdit={handleEditContact}
                onDelete={handleDeleteContact}
                onSelect={handleSelectContact}
                isSelected={selectedContacts.has(contact.id)}
                showCheckbox={selectedContacts.size > 0}
              />
            </React.Suspense>
          ))}
        </ContactsGrid>
      )}

      <React.Suspense fallback={null}>
        <ContactForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingContact(null);
          }}
          onSave={handleSaveContact}
          contact={editingContact}
          isLoading={isFormLoading}
        />
      </React.Suspense>
    </ContactsContainer>
  );
});

OptimizedContacts.displayName = 'OptimizedContacts';

export default withPerformanceProfiler(OptimizedContacts, 'OptimizedContacts');
