import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Crown, Calendar, TrendingUp, Gift } from 'lucide-react';

const WidgetCard = styled.div`
  background: #0a0f2f;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #FFC900;
    box-shadow: 0 10px 30px rgba(255, 201, 0, 0.2);
  }
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const WidgetTitle = styled.h3`
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 0;
  border: 3px solid #000;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch(props.status) {
      case 'active': return '#FFC900';
      case 'trialing': return '#3b82f6';
      case 'canceled': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: black;
`;

const PlanInfo = styled.div`
  margin-bottom: 1rem;
`;

const PlanName = styled.h4`
  color: #FFC900;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const PlanPrice = styled.div`
  color: #e2e8f0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UsageSection = styled.div`
  margin-bottom: 1rem;
`;

const UsageItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
`;

const UsageLabel = styled.span`
  color: #9ca3af;
`;

const UsageValue = styled.span`
  color: #e2e8f0;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 201, 0, 0.2);
  border-radius: 0;
  border: 1px solid #000;
  overflow: hidden;
  margin-bottom: 0.75rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #FFC900;
  border-radius: 0;
  transition: width 0.3s ease;
  width: ${props => Math.min(props.percentage, 100)}%;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const ActionButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 3px solid #000;
  border-radius: 0;
  background: ${props => props.$primary ?
    '#FFC900'
    : 'rgba(255, 201, 0, 0.1)'
  };
  color: ${props => props.$primary ? '#000' : '#FFC900'};
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(255, 201, 0, 0.3);
  }
`;

const NoSubscriptionCard = styled.div`
  text-align: center;
  padding: 2rem 1rem;
`;

const NoSubIcon = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 201, 0, 0.1);
  border-radius: 0;
  border: 3px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
`;

const NoSubTitle = styled.h4`
  color: #ffffff;
  margin-bottom: 0.5rem;
`;

const NoSubText = styled.p`
  color: #9ca3af;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.4;
`;

const PromoBanner = styled.div`
  background: rgba(255, 201, 0, 0.2);
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const PromoText = styled.p`
  color: #FFC900;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const PromoCode = styled.div`
  background: #0a0f2f;
  border: 3px solid #000;
  border-radius: 0;
  padding: 0.5rem;
  font-family: monospace;
  color: #FFC900;
  font-weight: 700;
  font-size: 0.9rem;
`;

function SubscriptionWidget() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success && data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'active': return 'Active';
      case 'trialing': return 'Free Trial';
      case 'canceled': return 'Canceled';
      case 'past_due': return 'Past Due';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <WidgetCard>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          Loading subscription...
        </div>
      </WidgetCard>
    );
  }

  if (!subscription) {
    return (
      <WidgetCard>
        <WidgetHeader>
          <WidgetTitle>
            <Crown size={20} />
            Subscription
          </WidgetTitle>
        </WidgetHeader>

        <PromoBanner>
          <PromoText>🎉 Special Offer: Get 25% off your first subscription!</PromoText>
          <PromoCode>WELCOME25</PromoCode>
        </PromoBanner>

        <NoSubscriptionCard>
          <NoSubIcon>
            <Crown size={24} color="#FFC900" />
          </NoSubIcon>
          <NoSubTitle>No Active Subscription</NoSubTitle>
          <NoSubText>
            Upgrade to a subscription plan to get monthly credits, discounted rates, and premium features.
          </NoSubText>
          
          <ActionButtons style={{ gridTemplateColumns: '1fr' }}>
            <ActionButton to="/subscriptions" $primary>
              <Crown size={16} />
              View Plans
            </ActionButton>
          </ActionButtons>
        </NoSubscriptionCard>
      </WidgetCard>
    );
  }

  // Mock usage data for demo
  const mockUsage = {
    creditsUsed: 15,
    creditsTotal: subscription.plan?.features?.monthlyCredits || 75,
    minutesUsed: 120,
    minutesTotal: subscription.plan?.features?.freeMinutes || 500
  };

  const creditsPercentage = (mockUsage.creditsUsed / mockUsage.creditsTotal) * 100;
  const minutesPercentage = (mockUsage.minutesUsed / mockUsage.minutesTotal) * 100;

  return (
    <WidgetCard>
      <WidgetHeader>
        <WidgetTitle>
          <Crown size={20} />
          Subscription
        </WidgetTitle>
        <StatusBadge status={subscription.status}>
          {getStatusLabel(subscription.status)}
        </StatusBadge>
      </WidgetHeader>

      <PlanInfo>
        <PlanName>{subscription.plan?.name || 'Premium Plan'}</PlanName>
        <PlanPrice>
          <TrendingUp size={14} />
          ${subscription.plan?.price || 19.99}/month
          {subscription.status === 'trialing' && (
            <span style={{ color: '#3b82f6' }}>
              • Trial until {formatDate(subscription.trialEndDate)}
            </span>
          )}
        </PlanPrice>
      </PlanInfo>

      <UsageSection>
        <UsageItem>
          <UsageLabel>Monthly Credits</UsageLabel>
          <UsageValue>${mockUsage.creditsUsed} / ${mockUsage.creditsTotal}</UsageValue>
        </UsageItem>
        <ProgressBar>
          <ProgressFill percentage={creditsPercentage} />
        </ProgressBar>

        <UsageItem>
          <UsageLabel>Free Minutes</UsageLabel>
          <UsageValue>{mockUsage.minutesUsed} / {mockUsage.minutesTotal}</UsageValue>
        </UsageItem>
        <ProgressBar>
          <ProgressFill percentage={minutesPercentage} />
        </ProgressBar>

        <UsageItem style={{ marginTop: '0.75rem' }}>
          <UsageLabel>Next Billing</UsageLabel>
          <UsageValue>
            <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
            {formatDate(subscription.nextBillingDate)}
          </UsageValue>
        </UsageItem>
      </UsageSection>

      <ActionButtons>
        <ActionButton to="/subscriptions" $primary>
          Get Premium
        </ActionButton>
        <ActionButton to="/coupons">
          <Gift size={14} />
          Offers
        </ActionButton>
      </ActionButtons>
    </WidgetCard>
  );
}

export default SubscriptionWidget; 