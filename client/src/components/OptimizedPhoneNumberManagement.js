import React, { useState, useEffect, memo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Phone, Plus, DollarSign, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { createLazyWidget } from '../utils/lazyLoading';
import { useStableCallback, withPerformanceProfiler } from '../utils/memoization';

// 懒加载子组件
const PhoneNumberCard = createLazyWidget(() => import('./PhoneNumbers/PhoneNumberCard'));
const NumberPurchaseModal = createLazyWidget(() => import('./PhoneNumbers/NumberPurchaseModal'));
const NumberSettingsModal = createLazyWidget(() => import('./PhoneNumbers/NumberSettingsModal'));

const Container = styled.div`
  min-height: 100vh;
  background: #FAFAFA;
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
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

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  color: #0a0f2f;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e6b400;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    padding: 0.6rem 1.25rem;
    font-size: 0.8rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
`;

const NumbersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
`;

const EmptyTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 1rem;
`;

const EmptyDescription = styled.p`
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #666;
  font-size: 1rem;
`;

const OptimizedPhoneNumberManagement = memo(() => {
  // 状态管理
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    monthlySpend: 0
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  // 获取电话号码列表
  const fetchPhoneNumbers = useStableCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone-numbers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneNumbers(data.phoneNumbers || []);
        
        // 计算统计信息
        const numbers = data.phoneNumbers || [];
        setStats({
          total: numbers.length,
          active: numbers.filter(n => n.status === 'active').length,
          monthlySpend: numbers.reduce((sum, n) => sum + (n.monthlyCost || 0), 0)
        });
      } else {
        throw new Error('Failed to fetch phone numbers');
      }
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast.error('Failed to load phone numbers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  // 购买新号码
  const handlePurchaseNumber = useStableCallback(async (numberData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone-numbers/purchase', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(numberData)
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneNumbers(prev => [data.phoneNumber, ...prev]);
        setShowPurchaseModal(false);
        toast.success('Phone number purchased successfully');
        fetchPhoneNumbers(); // 刷新列表
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to purchase number');
      }
    } catch (error) {
      console.error('Error purchasing number:', error);
      toast.error(error.message);
    }
  }, [fetchPhoneNumbers]);

  // 更新号码设置
  const handleUpdateSettings = useStableCallback(async (numberId, settings) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phone-numbers/${numberId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneNumbers(prev => prev.map(n => 
          n.id === numberId ? data.phoneNumber : n
        ));
        setShowSettingsModal(false);
        setSelectedNumber(null);
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  }, []);

  // 释放号码
  const handleReleaseNumber = useStableCallback(async (numberId) => {
    if (!window.confirm('Are you sure you want to release this number? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/phone-numbers/${numberId}/release`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPhoneNumbers(prev => prev.filter(n => n.id !== numberId));
        toast.success('Phone number released successfully');
        fetchPhoneNumbers(); // 刷新统计
      } else {
        throw new Error('Failed to release number');
      }
    } catch (error) {
      console.error('Error releasing number:', error);
      toast.error('Failed to release number');
    }
  }, [fetchPhoneNumbers]);

  // 打开设置模态框
  const handleOpenSettings = useStableCallback((number) => {
    setSelectedNumber(number);
    setShowSettingsModal(true);
  }, []);

  if (!user) {
    return (
      <Container>
        <EmptyState>
          <EmptyTitle>Please log in</EmptyTitle>
          <EmptyDescription>
            You need to be logged in to manage phone numbers.
          </EmptyDescription>
          <ActionButton onClick={() => navigate('/login')}>
            Log In
          </ActionButton>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Phone size={32} />
          Phone Numbers
        </Title>
        
        <HeaderActions>
          <ActionButton onClick={() => setShowPurchaseModal(true)}>
            <Plus size={16} />
            Buy Number
          </ActionButton>
          
          <ActionButton onClick={fetchPhoneNumbers} disabled={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </ActionButton>
        </HeaderActions>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Total Numbers</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{stats.active}</StatValue>
          <StatLabel>Active Numbers</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>${stats.monthlySpend.toFixed(2)}</StatValue>
          <StatLabel>Monthly Cost</StatLabel>
        </StatCard>
      </StatsGrid>

      {isLoading ? (
        <LoadingPlaceholder>Loading phone numbers...</LoadingPlaceholder>
      ) : phoneNumbers.length === 0 ? (
        <EmptyState>
          <EmptyTitle>No Phone Numbers</EmptyTitle>
          <EmptyDescription>
            You don't have any phone numbers yet. Purchase your first number to get started with making and receiving calls.
          </EmptyDescription>
          <ActionButton onClick={() => setShowPurchaseModal(true)}>
            <Plus size={16} />
            Buy Your First Number
          </ActionButton>
        </EmptyState>
      ) : (
        <NumbersGrid>
          {phoneNumbers.map(number => (
            <React.Suspense key={number.id} fallback={<div>Loading...</div>}>
              <PhoneNumberCard
                number={number}
                onSettings={handleOpenSettings}
                onRelease={handleReleaseNumber}
              />
            </React.Suspense>
          ))}
        </NumbersGrid>
      )}

      {/* 购买号码模态框 */}
      <React.Suspense fallback={null}>
        <NumberPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchaseNumber}
        />
      </React.Suspense>

      {/* 设置模态框 */}
      <React.Suspense fallback={null}>
        <NumberSettingsModal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedNumber(null);
          }}
          number={selectedNumber}
          onSave={handleUpdateSettings}
        />
      </React.Suspense>
    </Container>
  );
});

OptimizedPhoneNumberManagement.displayName = 'OptimizedPhoneNumberManagement';

export default withPerformanceProfiler(OptimizedPhoneNumberManagement, 'OptimizedPhoneNumberManagement');
