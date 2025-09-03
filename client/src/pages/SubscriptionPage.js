import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Phone, 
  ArrowLeft, 
  Check, 
  Zap, 
  Shield, 
  BarChart3,
  Star,
  Gift,
  Clock,
  Users,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';


const Container = styled.div`
  height: 100vh;
  background: #ffffff;
  padding: 1.5rem;
  padding-bottom: 3rem;
  overflow-y: auto;
  
  /* 确保完全覆盖 */
  position: relative;
  width: 100%;
  
  /* 修复可能的底部空白 */
  &::after {
    content: '';
    position: absolute;
    bottom: -50px;
    left: 0;
    right: 0;
    height: 50px;
    background: #ffffff;
    z-index: -1;
  }

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
    padding-bottom: 140px; /* Account for bottom navigation */
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem;
    padding-bottom: 160px;
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

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h2`
  font-size: 3rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #9ca3af;
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const BillingToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
`;

const BillingOption = styled.button`
  padding: 0.75rem 1.5rem;
  border: 3px solid ${props => props.active ? '#000000' : '#000000'};
  border-radius: 0;
  background: ${props => props.active ? '#FFC900' : 'transparent'};
  color: ${props => props.active ? '#000000' : '#9ca3af'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #000000;
    color: #000000;
  }
`;

const SavingsBadge = styled.span`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const PlanCard = styled.div`
  background: #ffffff;
  border: ${props => props.popular ? '3px solid #000000' : '3px solid #000000'};
  border-radius: 0;
  padding: 2rem;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  }
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #FFC900;
  color: #0a0f2f;
  padding: 0.5rem 1.5rem;
  border-radius: 0;
  border: 3px solid #000000;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
`;

const PlanDescription = styled.p`
  color: #9ca3af;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const PlanPrice = styled.div`
  margin-bottom: 2rem;
`;

const Price = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const PriceAmount = styled.span`
  font-size: 3rem;
  font-weight: 700;
  color: #000000;
`;

const PriceSymbol = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
`;

const PricePeriod = styled.span`
  color: #9ca3af;
  font-size: 1rem;
`;

const OriginalPrice = styled.span`
  color: #9ca3af;
  text-decoration: line-through;
  font-size: 1rem;
  margin-right: 0.5rem;
`;

const SavingsText = styled.div`
  color: #000000;
  font-size: 0.875rem;
  font-weight: 600;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  color: #e2e8f0;
  font-size: 0.9rem;
`;

const FeatureIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 0;
  background: #FFC900;
  border: 2px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SelectButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: 3px solid #000000;
  border-radius: 0;
  background: ${props => props.popular ? 
    '#FFC900' : 
    '#FFC900'
  };
  color: ${props => props.popular ? '#0a0f2f' : '#000000'};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const CurrentPlanBadge = styled.div`
  width: 100%;
  padding: 1rem;
  background: #FFC900;
  border: 3px solid #000000;
  border-radius: 0;
  color: #000000;
  font-weight: 600;
  text-align: center;
`;

const CouponSection = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1.5rem;
  margin-bottom: 3rem;
`;

const CouponInput = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CouponCode = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 3px solid #000000;
  border-radius: 0;
  background: #ffffff;
  color: #000000;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #000000;
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const ApplyButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #FFC900;
  border: 3px solid #000000;
  border-radius: 0;
  color: #000000;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #FFC900;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CouponMessage = styled.div`
  padding: 0.75rem;
  border-radius: 0;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.success {
    background: #FFC900;
    color: #000000;
    border: 3px solid #000000;
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 3px solid #ef4444;
  }
`;

const ComparisonSection = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ComparisonTitle = styled.h3`
  color: #000000;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.5rem;
`;

const ComparisonTable = styled.div`
  display: grid;
  grid-template-columns: 2fr repeat(3, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableHeader = styled.div`
  font-weight: 600;
  color: #000000;
  padding: 1rem;
  text-align: center;
  border-bottom: 3px solid #000000;
`;

const TableCell = styled.div`
  padding: 1rem;
  text-align: center;
  color: #000000;
  border-bottom: 1px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FeatureName = styled.div`
  padding: 1rem;
  color: #000000;
  border-bottom: 1px solid #000000;
  text-align: left;
`;

function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchCurrentSubscription();
    }
    
    // 设置页面背景色
    document.body.style.background = '#ffffff';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.minHeight = '100vh';
    document.documentElement.style.background = '#ffffff';
    document.documentElement.style.backgroundAttachment = 'fixed';
    document.documentElement.style.minHeight = '100vh';
    
    // 清理函数
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.minHeight = '';
      document.documentElement.style.background = '';
      document.documentElement.style.backgroundAttachment = '';
      document.documentElement.style.minHeight = '';
    };
  }, [user]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Demo data for development
      setPlans([
        {
          id: '1',
          name: 'Basic',
          description: 'Perfect for light usage',
          price: 9.99,
          billingCycle: 'monthly',
          features: {
            monthlyCredits: 25,
            callRateDiscount: 0,
            freeMinutes: 100,
            prioritySupport: false,
            recordingStorage: 30,
            qualityAnalytics: false,
            apiAccess: false
          },
          trialDays: 7
        },
        {
          id: '2',
          name: 'Premium',
          description: 'Best value for regular users',
          price: 19.99,
          billingCycle: 'monthly',
          features: {
            monthlyCredits: 75,
            callRateDiscount: 15,
            freeMinutes: 500,
            prioritySupport: true,
            recordingStorage: 90,
            qualityAnalytics: true,
            apiAccess: false
          },
          trialDays: 14,
          popular: true
        },
        {
          id: '3',
          name: 'Enterprise',
          description: 'For businesses and power users',
          price: 49.99,
          billingCycle: 'monthly',
          features: {
            monthlyCredits: 200,
            callRateDiscount: 25,
            freeMinutes: 2000,
            prioritySupport: true,
            recordingStorage: 365,
            qualityAnalytics: true,
            apiAccess: true
          },
          trialDays: 30
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success && data.subscription) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMessage({ type: 'error', text: 'Please enter a coupon code' });
      return;
    }

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: couponCode,
          context: 'subscription',
          amount: selectedPlan ? selectedPlan.price : 0
        })
      });

      const data = await response.json();
      
      if (data.success && data.valid) {
        setAppliedCoupon(data);
        setCouponMessage({ 
          type: 'success', 
          text: `Coupon applied! You save $${data.discount.amount.toFixed(2)}` 
        });
      } else {
        setCouponMessage({ type: 'error', text: data.message });
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponMessage({ type: 'error', text: 'Failed to validate coupon' });
      setAppliedCoupon(null);
    }
  };

  const selectPlan = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSelectedPlan(plan);
    
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId: plan.id,
          couponCode: appliedCoupon?.coupon?.code
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Subscription created successfully!');
        fetchCurrentSubscription();
        
        if (plan.trialDays > 0) {
          toast.info(`Your ${plan.trialDays}-day free trial has started!`);
        }
      } else {
        toast.error(data.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
    } finally {
      setSelectedPlan(null);
    }
  };

  const getDisplayPrice = (plan) => {
    if (billingCycle === 'annually') {
      return plan.price * 12 * 0.8; // 20% discount for annual
    } else if (billingCycle === 'quarterly') {
      return plan.price * 3 * 0.9; // 10% discount for quarterly
    }
    return plan.price;
  };

  const getPricePerMonth = (plan) => {
    const total = getDisplayPrice(plan);
    const months = billingCycle === 'annually' ? 12 : billingCycle === 'quarterly' ? 3 : 1;
    return total / months;
  };

  const getSavings = (plan) => {
    if (billingCycle === 'annually') {
      return plan.price * 12 * 0.2; // 20% savings
    } else if (billingCycle === 'quarterly') {
      return plan.price * 3 * 0.1; // 10% savings
    }
    return 0;
  };

  const isCurrentPlan = (plan) => {
    return currentSubscription?.planId === plan.id;
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          <h3>Loading subscription plans...</h3>
        </div>
      </Container>
    );
  }

  return (
    <>
      <style jsx global>{`
        body, html {
          background: #ffffff !important;
          background-attachment: fixed !important;
          min-height: 100vh !important;
        }
      `}</style>
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
          <HeroSection>
            <Title>Choose Your Plan</Title>
            <Subtitle>
              Unlock powerful features and get the best calling rates with our subscription plans
            </Subtitle>
            
            <BillingToggle>
              <BillingOption 
                active={billingCycle === 'monthly'} 
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </BillingOption>
              <BillingOption 
                active={billingCycle === 'quarterly'} 
                onClick={() => setBillingCycle('quarterly')}
              >
                Quarterly
                <SavingsBadge>Save 10%</SavingsBadge>
              </BillingOption>
              <BillingOption 
                active={billingCycle === 'annually'} 
                onClick={() => setBillingCycle('annually')}
              >
                Annually
                <SavingsBadge>Save 20%</SavingsBadge>
              </BillingOption>
            </BillingToggle>
          </HeroSection>

          <CouponSection>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>
              <Gift size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Have a Coupon Code?
            </h3>
            <CouponInput>
              <CouponCode
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              />
              <ApplyButton onClick={applyCoupon} disabled={!couponCode.trim()}>
                Apply
              </ApplyButton>
            </CouponInput>
            {couponMessage && (
              <CouponMessage className={couponMessage.type}>
                {couponMessage.text}
              </CouponMessage>
            )}
          </CouponSection>

          <PlansGrid>
            {plans.map((plan) => {
              const displayPrice = getDisplayPrice(plan);
              const pricePerMonth = getPricePerMonth(plan);
              const savings = getSavings(plan);
              
              return (
                <PlanCard key={plan.id} popular={plan.popular}>
                  {plan.popular && (
                    <PopularBadge>
                      <Star size={14} />
                      Most Popular
                    </PopularBadge>
                  )}
                  
                  <PlanName>{plan.name}</PlanName>
                  <PlanDescription>{plan.description}</PlanDescription>
                  
                  <PlanPrice>
                    <Price>
                      <PriceSymbol>$</PriceSymbol>
                      <PriceAmount>{pricePerMonth.toFixed(0)}</PriceAmount>
                      <PricePeriod>/month</PricePeriod>
                    </Price>
                    
                    {billingCycle !== 'monthly' && (
                      <>
                        <div>
                          <OriginalPrice>${plan.price}/month</OriginalPrice>
                          <span style={{ color: '#ffffff' }}>
                            ${displayPrice.toFixed(2)} {billingCycle}
                          </span>
                        </div>
                        <SavingsText>
                          Save ${savings.toFixed(2)} per year
                        </SavingsText>
                      </>
                    )}
                    
                    {appliedCoupon && selectedPlan?.id === plan.id && (
                      <SavingsText>
                        Additional ${appliedCoupon.discount.amount.toFixed(2)} off with coupon!
                      </SavingsText>
                    )}
                  </PlanPrice>

                  <FeaturesList>
                    <FeatureItem>
                      <FeatureIcon><Zap size={12} color="#000000" /></FeatureIcon>
                      ${plan.features.monthlyCredits} monthly credits
                    </FeatureItem>
                    <FeatureItem>
                      <FeatureIcon><Clock size={12} color="#000000" /></FeatureIcon>
                      {plan.features.freeMinutes} free minutes
                    </FeatureItem>
                    <FeatureItem>
                      <FeatureIcon><Shield size={12} color="#000000" /></FeatureIcon>
                      {plan.features.callRateDiscount}% discount on calls
                    </FeatureItem>
                    <FeatureItem>
                      <FeatureIcon><Users size={12} color="#000000" /></FeatureIcon>
                      {plan.features.prioritySupport ? 'Priority support' : 'Standard support'}
                    </FeatureItem>
                    <FeatureItem>
                      <FeatureIcon><BarChart3 size={12} color="#000000" /></FeatureIcon>
                      {plan.features.recordingStorage} days recording storage
                    </FeatureItem>
                    {plan.features.qualityAnalytics && (
                      <FeatureItem>
                        <FeatureIcon><BarChart3 size={12} color="#000000" /></FeatureIcon>
                        Advanced quality analytics
                      </FeatureItem>
                    )}
                    {plan.features.apiAccess && (
                      <FeatureItem>
                        <FeatureIcon><Smartphone size={12} color="#000000" /></FeatureIcon>
                        API access
                      </FeatureItem>
                    )}
                  </FeaturesList>

                  {plan.trialDays > 0 && (
                    <div style={{ 
                      background: '#FFC900', 
                      padding: '0.75rem', 
                      border: '3px solid #000000',
                      borderRadius: '0', 
                      marginBottom: '1rem',
                      textAlign: 'center',
                      color: '#000000',
                      fontSize: '0.875rem'
                    }}>
                      🎉 {plan.trialDays}-day free trial included!
                    </div>
                  )}

                  {isCurrentPlan(plan) ? (
                    <CurrentPlanBadge>
                      <Check size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                      Current Plan
                    </CurrentPlanBadge>
                  ) : (
                    <SelectButton 
                      popular={plan.popular}
                      onClick={() => selectPlan(plan)}
                      disabled={selectedPlan?.id === plan.id}
                    >
                      {selectedPlan?.id === plan.id ? 'Processing...' : 'Select Plan'}
                    </SelectButton>
                  )}
                </PlanCard>
              );
            })}
          </PlansGrid>

          <ComparisonSection>
            <ComparisonTitle>Plan Comparison</ComparisonTitle>
            <ComparisonTable>
              <TableHeader>Features</TableHeader>
              <TableHeader>Basic</TableHeader>
              <TableHeader>Premium</TableHeader>
              <TableHeader>Enterprise</TableHeader>
              
              <FeatureName>Monthly Credits</FeatureName>
              <TableCell>$25</TableCell>
              <TableCell>$75</TableCell>
              <TableCell>$200</TableCell>
              
              <FeatureName>Free Minutes</FeatureName>
              <TableCell>100</TableCell>
              <TableCell>500</TableCell>
              <TableCell>2000</TableCell>
              
              <FeatureName>Call Rate Discount</FeatureName>
              <TableCell>0%</TableCell>
              <TableCell>15%</TableCell>
              <TableCell>25%</TableCell>
              
              <FeatureName>Priority Support</FeatureName>
              <TableCell>❌</TableCell>
              <TableCell>✅</TableCell>
              <TableCell>✅</TableCell>
              
              <FeatureName>Recording Storage</FeatureName>
              <TableCell>30 days</TableCell>
              <TableCell>90 days</TableCell>
              <TableCell>365 days</TableCell>
              
              <FeatureName>Quality Analytics</FeatureName>
              <TableCell>❌</TableCell>
              <TableCell>✅</TableCell>
              <TableCell>✅</TableCell>
              
              <FeatureName>API Access</FeatureName>
              <TableCell>❌</TableCell>
              <TableCell>❌</TableCell>
              <TableCell>✅</TableCell>
            </ComparisonTable>
          </ComparisonSection>
        </MainContent>
      </Container>
    </>
  );
}

export default SubscriptionPage; 