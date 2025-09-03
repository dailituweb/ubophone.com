import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Gift, 
  ArrowLeft, 
  Phone, 
  Copy, 
  Check, 
  Calendar, 
  Tag, 
  Percent,
  DollarSign,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  background: #ffffff;
  padding: 1.5rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
    min-height: calc(100vh - 140px);
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem;
    min-height: calc(100vh - 160px);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  color: #000000;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: #FFC900;
    transform: translateY(-1px);
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const LogoIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 0;
  background: #FFC900;
  border: 3px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a0f2f;
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PageSubtitle = styled.p`
  color: #9ca3af;
  font-size: 1.1rem;
  margin-bottom: 2rem;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 3px solid #000000;
`;

const Tab = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  background: ${props => props.active ? '#FFC900' : 'transparent'};
  color: ${props => props.active ? '#000000' : '#9ca3af'};
  border-bottom: 3px solid ${props => props.active ? '#000000' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;

  &:hover {
    color: #000000;
    background: #FFC900;
  }
`;

const ControlsBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: rgba(255, 255, 255, 0.1);
  border: 3px solid #000000;
  border-radius: 0;
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #000000;
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`;

const CouponsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const CouponCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    border-color: #000000;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    background: #FFC900;
    clip-path: polygon(100% 0%, 0% 100%, 100% 100%);
  }
`;

const CouponHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CouponInfo = styled.div`
  flex: 1;
`;

const CouponName = styled.h3`
  color: #000000;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const CouponCode = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFC900;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #000000;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #FFC900;
  }
`;

const CouponType = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #FFC900;
  color: #0a0f2f;
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  border: 3px solid #000000;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CouponDescription = styled.p`
  color: #9ca3af;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const CouponValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ValueAmount = styled.span`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
`;

const ValueUnit = styled.span`
  color: #9ca3af;
  font-size: 1rem;
`;

const CouponDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #e2e8f0;
  font-size: 0.85rem;
`;

const CouponActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: 3px solid #000000;
  border-radius: 0;
  background: #FFC900;
  color: #000000;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: #FFC900;
    transform: translateY(-1px);
  }

  &.primary {
    background: #FFC900;
    color: #0a0f2f;
    border: 3px solid #000000;
  }

  &.primary:hover {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  }
`;

const UsageHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const UsageItem = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
`;

const UsageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const UsageInfo = styled.div`
  h4 {
    color: #000000;
    margin: 0 0 0.25rem 0;
  }
  
  p {
    color: #9ca3af;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const UsageAmount = styled.div`
  text-align: right;
  
  .discount {
    color: #000000;
    font-size: 1.25rem;
    font-weight: 700;
  }
  
  .original {
    color: #9ca3af;
    text-decoration: line-through;
    font-size: 0.9rem;
  }
`;

const UsageDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  color: #e2e8f0;
  font-size: 0.85rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
  
  h3 {
    color: #000000;
    margin-bottom: 1rem;
  }
`;

function CouponsPage() {
  const [activeTab, setActiveTab] = useState('available');
  const [coupons, setCoupons] = useState([]);
  const [usageHistory, setUsageHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  
  useAuth();

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableCoupons();
    } else {
      fetchUsageHistory();
    }
  }, [activeTab]);

  const fetchAvailableCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coupons/promotions');
      const data = await response.json();
      
      if (data.success) {
        setCoupons(data.coupons);
      } else {
        // Demo data
        setCoupons([
          {
            id: '1',
            code: 'WELCOME25',
            name: 'Welcome Bonus',
            description: 'Get 25% off your first subscription',
            type: 'percentage',
            value: 25,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            minimumAmount: 10
          },
          {
            id: '2',
            code: 'SAVE10',
            name: 'Save $10',
            description: 'Fixed $10 discount on any purchase',
            type: 'fixed_amount',
            value: 10,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            minimumAmount: 25
          },
          {
            id: '3',
            code: 'FREECREDITS',
            name: 'Free Credits',
            description: 'Get $5 in free call credits',
            type: 'free_credits',
            value: 5,
            validUntil: null,
            minimumAmount: 0
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coupons/usage-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUsageHistory(data.usages);
      } else {
        // Demo data
        setUsageHistory([
          {
            id: '1',
            coupon: {
              code: 'WELCOME25',
              name: 'Welcome Bonus',
              type: 'percentage'
            },
            discountAmount: 5.00,
            originalAmount: 20.00,
            finalAmount: 15.00,
            context: 'subscription',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching usage history:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const applyCoupon = async (coupon) => {
    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: coupon.code,
          context: coupon.type === 'free_credits' ? 'credits' : 'subscription',
          amount: 0
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        if (data.newBalance) {
          // Update user balance if needed
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to apply coupon');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No expiry';
    return new Date(date).toLocaleDateString();
  };

  const getCouponTypeIcon = (type) => {
    switch (type) {
      case 'percentage':
        return <Percent size={12} />;
      case 'fixed_amount':
        return <DollarSign size={12} />;
      case 'free_credits':
        return <Gift size={12} />;
      default:
        return <Tag size={12} />;
    }
  };

  const getCouponTypeLabel = (type) => {
    switch (type) {
      case 'percentage':
        return 'Percentage';
      case 'fixed_amount':
        return 'Fixed Amount';
      case 'free_credits':
        return 'Free Credits';
      default:
        return 'Coupon';
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container>
      <Header>
        <BackButton to="/dashboard">
          <ArrowLeft size={20} />
          Back to Dashboard
        </BackButton>
        
        <LogoLink to="/">
          <LogoIcon>
            <Phone size={20} />
          </LogoIcon>
          <LogoText>Ubophone</LogoText>
        </LogoLink>
      </Header>

      <MainContent>
        <PageTitle>
          <Gift size={40} />
          Coupons & Promotions
        </PageTitle>
        <PageSubtitle>
          Discover exclusive offers and save on your calls and subscriptions
        </PageSubtitle>

        <TabContainer>
          <Tab 
            active={activeTab === 'available'} 
            onClick={() => setActiveTab('available')}
          >
            Available Coupons
          </Tab>
          <Tab 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          >
            Usage History
          </Tab>
        </TabContainer>

        {activeTab === 'available' && (
          <>
            <ControlsBar>
              <SearchBox>
                <SearchIconWrapper>
                  <Search size={20} />
                </SearchIconWrapper>
                <SearchInput
                  type="text"
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchBox>
            </ControlsBar>

            {loading ? (
              <EmptyState>
                <h3>Loading coupons...</h3>
              </EmptyState>
            ) : filteredCoupons.length === 0 ? (
              <EmptyState>
                <h3>No coupons available</h3>
                <p>Check back later for new promotions and special offers!</p>
              </EmptyState>
            ) : (
              <CouponsGrid>
                {filteredCoupons.map((coupon) => (
                  <CouponCard key={coupon.id}>
                    <CouponType>
                      {getCouponTypeIcon(coupon.type)}
                      {getCouponTypeLabel(coupon.type)}
                    </CouponType>
                    
                    <CouponHeader>
                      <CouponInfo>
                        <CouponName>{coupon.name}</CouponName>
                      </CouponInfo>
                    </CouponHeader>

                    <CouponCode onClick={() => copyToClipboard(coupon.code)}>
                      <Tag size={14} />
                      {coupon.code}
                      {copiedCode === coupon.code ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </CouponCode>

                    <CouponDescription>
                      {coupon.description}
                    </CouponDescription>

                    <CouponValue>
                      <ValueAmount>
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                      </ValueAmount>
                      <ValueUnit>
                        {coupon.type === 'percentage' ? 'off' : 
                         coupon.type === 'fixed_amount' ? 'discount' : 'credits'}
                      </ValueUnit>
                    </CouponValue>

                    <CouponDetails>
                      <DetailItem>
                        <Calendar size={14} />
                        Expires: {formatDate(coupon.validUntil)}
                      </DetailItem>
                      {coupon.minimumAmount > 0 && (
                        <DetailItem>
                          <DollarSign size={14} />
                          Min: ${coupon.minimumAmount}
                        </DetailItem>
                      )}
                    </CouponDetails>

                    <CouponActions>
                      <ActionButton onClick={() => copyToClipboard(coupon.code)}>
                        <Copy size={14} />
                        Copy Code
                      </ActionButton>
                      {coupon.type === 'free_credits' && (
                        <ActionButton 
                          className="primary"
                          onClick={() => applyCoupon(coupon)}
                        >
                          <Gift size={14} />
                          Claim Now
                        </ActionButton>
                      )}
                    </CouponActions>
                  </CouponCard>
                ))}
              </CouponsGrid>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {loading ? (
              <EmptyState>
                <h3>Loading usage history...</h3>
              </EmptyState>
            ) : usageHistory.length === 0 ? (
              <EmptyState>
                <h3>No coupon usage history</h3>
                <p>You haven't used any coupons yet. Browse available coupons to start saving!</p>
              </EmptyState>
            ) : (
              <UsageHistoryList>
                {usageHistory.map((usage) => (
                  <UsageItem key={usage.id}>
                    <UsageHeader>
                      <UsageInfo>
                        <h4>{usage.coupon.name}</h4>
                        <p>
                          Code: {usage.coupon.code} • Used on {formatDate(usage.createdAt)}
                        </p>
                      </UsageInfo>
                      <UsageAmount>
                        <div className="discount">-${usage.discountAmount.toFixed(2)}</div>
                        <div className="original">${usage.originalAmount.toFixed(2)}</div>
                      </UsageAmount>
                    </UsageHeader>
                    
                    <UsageDetails>
                      <div>
                        <strong>Original Amount:</strong> ${usage.originalAmount.toFixed(2)}
                      </div>
                      <div>
                        <strong>Discount:</strong> -${usage.discountAmount.toFixed(2)}
                      </div>
                      <div>
                        <strong>Final Amount:</strong> ${usage.finalAmount.toFixed(2)}
                      </div>
                      <div>
                        <strong>Context:</strong> {usage.context}
                      </div>
                    </UsageDetails>
                  </UsageItem>
                ))}
              </UsageHistoryList>
            )}
          </>
        )}
      </MainContent>
    </Container>
  );
}

export default CouponsPage; 