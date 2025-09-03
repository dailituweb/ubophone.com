import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  CreditCard, Shield, 
  CheckCircle, Star, HelpCircle, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: calc(100vh - 80px);
  background: #FAFAFA;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem calc(80px + env(safe-area-inset-bottom)) 0.25rem;
    min-height: calc(100vh - 60px);
  }
`;





const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
`;

const HeroTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 1rem;
  text-transform: uppercase;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;


const PaymentSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (max-width: 768px) {
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
`;

const PaymentCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const CurrentBalanceSection = styled.div`
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;

  @media (max-width: 480px) {
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }
`;

const BalanceLabel = styled.div`
  color: #000;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const BalanceAmount = styled.div`
  color: #000;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

const BalanceNote = styled.div`
  color: #000;
  font-size: 0.8rem;
  font-weight: 600;
`;

const AmountSection = styled.div`
  margin-bottom: 2rem;
`;

const AmountGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const AmountButton = styled.button`
  position: relative;
  padding: 1.5rem 1rem;
  border: 3px solid #000;
  border-radius: 0;
  background: ${props => props.selected ? '#FFC900' : 'white'};
  color: #000;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 700;

  &:hover {
    background: #FFC900;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 480px) {
    padding: 1.25rem 0.75rem;
  }

  ${props => props.bonus && `
    &::after {
      content: '${props.bonus}% FREE';
      position: absolute;
      top: -8px;
      right: -8px;
      background: #000;
      color: #FFC900;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.25rem 0.5rem;
      border-radius: 0;
      border: 2px solid #FFC900;
      transform: rotate(10deg);
    }
  `}
`;

const AmountValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 0.25rem;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const AmountLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
`;

const CustomAmountInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 3px solid #000;
  border-radius: 0;
  background: white;
  color: #000;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    background: #FFC900;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &::placeholder {
    color: #666;
    font-weight: 500;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    padding: 0.875rem;
  }
`;

const MobileCallTimeEstimate = styled.div`
  display: none;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  text-align: center;
  margin-top: 1rem;

  @media (max-width: 968px) {
    display: block;
  }
`;

const MobileEstimateTitle = styled.div`
  color: #000;
  font-weight: 800;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const MobileEstimateTime = styled.div`
  color: #000;
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
`;

const MobileEstimateSubtext = styled.div`
  color: #000;
  font-size: 1rem;
  font-weight: 600;
`;

const MobileEstimateNote = styled.div`
  color: #000;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  font-weight: 500;
`;

const SecurityNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  color: #000;
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
`;

const PurchaseButton = styled.button`
  width: 100%;
  padding: 1.25rem;
  border: 3px solid #000;
  border-radius: 0;
  background: #000;
  color: #FFC900;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;

  &:hover:not(:disabled) {
    background: #FFC900;
    color: #000;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    font-size: 1rem;
  }
`;

const SummaryCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2rem;
  height: fit-content;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 968px) {
    display: none;
  }
`;


const CallTimeEstimate = styled.div`
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const EstimateTitle = styled.div`
  color: #000;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
`;

const EstimateTime = styled.div`
  color: #000;
  font-size: 1.5rem;
  font-weight: 800;
`;

const EstimateNote = styled.div`
  color: #000;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-weight: 500;
`;

const GuaranteeSection = styled.div`
  background: #FFC900;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const GuaranteeText = styled.div`
  color: #000;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const FeatureSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border: 3px solid #000;
  border-radius: 0;

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const FeatureCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  padding: 1.25rem;
  border-radius: 0;
  background: #FAFAFA;
  border: 2px solid #000;
  transition: all 0.3s ease;
  
  &:hover {
    background: #FFC900;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 480px) {
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const CustomCheckbox = styled.div`
  position: relative;
  width: 24px;
  height: 24px;
  border-radius: 0;
  background: ${props => props.checked ? '#000' : 'white'};
  border: 3px solid #000;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.checked ? '#000' : '#FFC900'};
  }
`;

const CheckboxInput = styled.input`
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
`;

const FeatureLabel = styled.label`
  color: #000;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  flex: 1;
`;

const FeatureDescription = styled.span`
  color: #000;
  font-size: 0.85rem;
  font-weight: 600;
  background: #FFC900;
  padding: 0.25rem 0.5rem;
  border-radius: 0;
  border: 2px solid #000;
  margin-left: auto;

  @media (max-width: 480px) {
    margin-left: 0;
    align-self: flex-start;
  }
`;

const FeatureInputs = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  padding-left: 2.5rem;

  @media (max-width: 480px) {
    padding-left: 0;
    grid-template-columns: 1fr;
  }
`;

const FeatureInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FeatureInputLabel = styled.label`
  color: #000;
  font-size: 0.9rem;
  font-weight: 700;
`;

const FeatureInput = styled.input`
  padding: 0.75rem;
  border: 3px solid #000;
  border-radius: 0;
  background: white;
  color: #000;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    background: #FFC900;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &::placeholder {
    color: #666;
    font-weight: 500;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoSection = styled.div`
  margin-top: 3rem;

  @media (max-width: 768px) {
    margin-top: 2rem;
  }
`;

const FullWidthInfoCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  width: 100%;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const InfoCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 480px) {
    padding: 1.25rem;
  }
`;

const InfoTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 800;
  color: #000;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: uppercase;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
`;

const InfoItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
`;

const FAQItem = styled.div`
  margin-bottom: 1rem;
`;

const FAQQuestion = styled.div`
  font-weight: 800;
  color: #000;
  margin-bottom: 0.5rem;
`;

const FAQAnswer = styled.div`
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.5;
`;

const predefinedAmounts = [
  { amount: 5, bonus: 0, popular: false },
  { amount: 10, bonus: 0, popular: false },
  { amount: 20, bonus: 5, popular: true },
  { amount: 50, bonus: 15, popular: false },
  { amount: 100, bonus: 20, popular: false }
];

function BuyCreditsPage() {
  const [selectedAmount, setSelectedAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoTopupEnabled, setAutoTopupEnabled] = useState(false);
  const [autoTopupThreshold, setAutoTopupThreshold] = useState('2');
  const [autoTopupAmount, setAutoTopupAmount] = useState('20');
  const [taxInvoiceEnabled, setTaxInvoiceEnabled] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [displayBalance, setDisplayBalance] = useState(0);
  
  const { balance } = useAuth();

  // 初始化和更新显示余额
  useEffect(() => {
    const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
    setDisplayBalance(currentBalance);
  }, [balance]);

  // 监听 localStorage 变化以实时更新余额
  useEffect(() => {
    const handleStorageChange = () => {
      const currentBalance = parseFloat(localStorage.getItem('currentBalance') || balance || 0);
      setDisplayBalance(currentBalance);
    };

    // 监听storage事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 创建自定义事件监听（同一标签页）
    const handleBalanceUpdate = (e) => {
      setDisplayBalance(e.detail);
    };
    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
    };
  }, [balance]);

  const getCurrentAmount = () => {
    return customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
  };

  const getBonusAmount = () => {
    const amount = getCurrentAmount();
    if (amount >= 100) return amount * 0.20;  // 20%
    if (amount >= 50) return amount * 0.15;   // 15%
    if (amount >= 20) return amount * 0.05;   // 5%
    return 0;
  };

  const getTotalCredits = () => {
    return getCurrentAmount() + getBonusAmount();
  };

  const getEstimatedCallTime = () => {
    const totalCredits = getTotalCredits();
    // Using rate of $0.02 per minute
    return Math.floor(totalCredits / 0.02);
  };

  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setCustomAmount(value);
      setSelectedAmount(0);
    }
  };

  const handlePurchase = async () => {
    const amount = getCurrentAmount();
    
    if (amount < 5) {
      toast.error('Minimum purchase amount is $5');
      return;
    }

    setLoading(true);

    try {
      // Save user preferences
      const purchaseData = {
        amount: amount,
        totalCredits: getTotalCredits()
      };
      
      // Store in localStorage for later use
      const extendedPurchaseData = {
        ...purchaseData,
        autoTopup: autoTopupEnabled ? {
          enabled: true,
          threshold: parseFloat(autoTopupThreshold) || 0,
          amount: parseFloat(autoTopupAmount) || 0
        } : { enabled: false },
        taxInvoice: taxInvoiceEnabled ? {
          enabled: true,
          taxId: taxId
        } : { enabled: false }
      };
      localStorage.setItem('ubophone_purchase_data', JSON.stringify(extendedPurchaseData));
      
      // Create Stripe checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          totalCredits: getTotalCredits(),
          autoTopup: autoTopupEnabled ? {
            enabled: true,
            threshold: parseFloat(autoTopupThreshold) || 0,
            amount: parseFloat(autoTopupAmount) || 0
          } : { enabled: false },
          taxInvoice: taxInvoiceEnabled ? {
            enabled: true,
            taxId: taxId
          } : { enabled: false }
        })
      });

      const data = await response.json();
      
      if (data.success && data.sessionUrl) {
        // Redirect to Stripe checkout page
        window.location.href = data.sessionUrl;
      } else {
        toast.error(data.message || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>

      <MainContent>
        <HeroSection>
          <HeroTitle>Buy Credits</HeroTitle>
        </HeroSection>

        <PaymentSection>
          <PaymentCard>
            <CurrentBalanceSection>
              <BalanceLabel>Current Balance</BalanceLabel>
              <BalanceAmount>${displayBalance.toFixed(2)}</BalanceAmount>
              <BalanceNote>Available for international calling</BalanceNote>
            </CurrentBalanceSection>

            <AmountSection>
              <SectionTitle>
                <CreditCard size={20} />
                Choose Amount (USD)
              </SectionTitle>
              <AmountGrid>
                {predefinedAmounts.map((item) => (
                  <AmountButton
                    key={item.amount}
                    selected={selectedAmount === item.amount && !customAmount}
                    onClick={() => handleAmountSelect(item.amount)}
                    bonus={item.bonus}
                  >
                    <AmountValue>${item.amount}</AmountValue>
                    <AmountLabel>{item.popular ? 'Most Popular' : 'Credits'}</AmountLabel>
                  </AmountButton>
                ))}
              </AmountGrid>

              <CustomAmountInput
                type="number"
                placeholder="Or enter custom amount (minimum $5)"
                value={customAmount}
                onChange={handleCustomAmountChange}
                min="5"
                step="0.01"
              />

              <MobileCallTimeEstimate>
                <MobileEstimateTitle>Estimated Call Time</MobileEstimateTitle>
                <MobileEstimateTime>Up to {getEstimatedCallTime().toLocaleString()} minutes</MobileEstimateTime>
                <MobileEstimateSubtext>of international calling time</MobileEstimateSubtext>
                <MobileEstimateNote>Based on average rates. Actual time may vary by destination.</MobileEstimateNote>
              </MobileCallTimeEstimate>
            </AmountSection>

            <FeatureSection>
              <FeatureCheckbox onClick={() => setAutoTopupEnabled(!autoTopupEnabled)}>
                <CustomCheckbox checked={autoTopupEnabled}>
                  <CheckboxInput
                    type="checkbox"
                    checked={autoTopupEnabled}
                    onChange={(e) => setAutoTopupEnabled(e.target.checked)}
                  />
                  {autoTopupEnabled && <Check size={14} color="#FFC900" />}
                </CustomCheckbox>
                <FeatureLabel>Enable Auto Top-up</FeatureLabel>
                <FeatureDescription>Avoid interrupting an important call</FeatureDescription>
              </FeatureCheckbox>
              
              {autoTopupEnabled && (
                <FeatureInputs>
                  <FeatureInputGroup>
                    <FeatureInputLabel>Auto Top-up Threshold (recommended at least $2)</FeatureInputLabel>
                    <FeatureInput
                      type="number"
                      value={autoTopupThreshold}
                      onChange={(e) => setAutoTopupThreshold(e.target.value)}
                      placeholder="2"
                      min="1"
                      step="0.01"
                    />
                  </FeatureInputGroup>
                  <FeatureInputGroup>
                    <FeatureInputLabel>Auto Top-up Amount (recommended at least $10)</FeatureInputLabel>
                    <FeatureInput
                      type="number"
                      value={autoTopupAmount}
                      onChange={(e) => setAutoTopupAmount(e.target.value)}
                      placeholder="20"
                      min="5"
                      step="0.01"
                    />
                  </FeatureInputGroup>
                </FeatureInputs>
              )}
            </FeatureSection>

            <FeatureSection>
              <FeatureCheckbox onClick={() => setTaxInvoiceEnabled(!taxInvoiceEnabled)}>
                <CustomCheckbox checked={taxInvoiceEnabled}>
                  <CheckboxInput
                    type="checkbox"
                    checked={taxInvoiceEnabled}
                    onChange={(e) => setTaxInvoiceEnabled(e.target.checked)}
                  />
                  {taxInvoiceEnabled && <Check size={14} color="#FFC900" />}
                </CustomCheckbox>
                <FeatureLabel>Issue tax-deductible invoice (address required)</FeatureLabel>
              </FeatureCheckbox>
              
              {taxInvoiceEnabled && (
                <FeatureInputs>
                  <FeatureInputGroup>
                    <FeatureInputLabel>Tax ID / VAT Number</FeatureInputLabel>
                    <FeatureInput
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="Enter your Tax ID or VAT number"
                    />
                  </FeatureInputGroup>
                </FeatureInputs>
              )}
            </FeatureSection>

            <SecurityNotice>
              <Shield size={16} />
              100% Money Back Guarantee. No Questions Asked.
            </SecurityNotice>
          
            <PurchaseButton onClick={handlePurchase} disabled={loading || getCurrentAmount() < 5}>
              {loading ? 'Processing...' : 'Secure Checkout'}
            </PurchaseButton>
          </PaymentCard>

          <div>
            <SummaryCard>
              <SectionTitle>Order Summary</SectionTitle>
              
              <CallTimeEstimate>
                <EstimateTitle>Estimated Call Time</EstimateTitle>
                <EstimateTime>Up to {getEstimatedCallTime().toLocaleString()} minutes</EstimateTime>
                <EstimateTime>of international calling time</EstimateTime>
                <EstimateNote>Based on average rates. Actual time may vary by destination.</EstimateNote>
              </CallTimeEstimate>


              <GuaranteeSection>
                <CheckCircle size={20} />
                <GuaranteeText>100% Money Back Guarantee</GuaranteeText>
              </GuaranteeSection>
            </SummaryCard>

            <InfoCard style={{ marginTop: '2rem' }}>
              <InfoTitle>
                <Star size={20} />
                Why Choose Ubophone
              </InfoTitle>
              
              <InfoList>
                <InfoItem>
                  <CheckCircle size={16} color="#FFC900" />
                  <span>International calls to any country without restrictions</span>
                </InfoItem>
                <InfoItem>
                  <CheckCircle size={16} color="#FFC900" />
                  <span>Our service works in all countries, no restrictions</span>
                </InfoItem>
                <InfoItem>
                  <CheckCircle size={16} color="#FFC900" />
                  <span>Privacy first. We don't store your payment information</span>
                </InfoItem>
                <InfoItem>
                  <CheckCircle size={16} color="#FFC900" />
                  <span>Credit based, no subscription. Pay only for what you use</span>
                </InfoItem>
                <InfoItem>
                  <CheckCircle size={16} color="#FFC900" />
                  <span>No phone number required. Start calling immediately</span>
                </InfoItem>
              </InfoList>
            </InfoCard>
          </div>
        </PaymentSection>

        <InfoSection>
          <FullWidthInfoCard>
            <InfoTitle>
              <HelpCircle size={20} />
              Frequently Asked Questions
            </InfoTitle>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <FAQItem>
                  <FAQQuestion>How do credits work?</FAQQuestion>
                  <FAQAnswer>Credits are added to your account balance immediately and automatically used when you make calls.</FAQAnswer>
                </FAQItem>
                
                <FAQItem>
                  <FAQQuestion>Can I get a refund?</FAQQuestion>
                  <FAQAnswer>We offer full no-questions-asked refunds and make up credits for the calls that don't work as expected. Please contact our support team if you experience any issues. We aim to provide the best service possible.</FAQAnswer>
                </FAQItem>
              </div>
              
              <div>
                <FAQItem>
                  <FAQQuestion>How are call rates calculated?</FAQQuestion>
                  <FAQAnswer>Rates vary by country. Check our rate calculator for specific pricing.</FAQAnswer>
                </FAQItem>
                
                <FAQItem>
                  <FAQQuestion>Is there a minimum purchase?</FAQQuestion>
                  <FAQAnswer>Yes, the minimum purchase amount is $5 to cover processing fees.</FAQAnswer>
                </FAQItem>
              </div>
            </div>
          </FullWidthInfoCard>
        </InfoSection>
      </MainContent>
    </Container>
  );
}

export default BuyCreditsPage;