import React, { memo, Suspense } from 'react';
import styled from 'styled-components';
import { createLazyWidget } from '../../utils/lazyLoading';

// 懒加载拨号器组件
const PhoneStyleDialer = createLazyWidget(() => import('../PhoneStyleDialer'));
const RateCalculator = createLazyWidget(() => import('../RateCalculator'));

const DialerContainer = styled.section`
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  }
`;

const DialerContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: white;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 4rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const DialerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

const DialerCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-5px);
  }
`;

const CardTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const LoadingPlaceholder = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
`;

const FeatureHighlight = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
`;

const HighlightCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-3px);
  }
`;

const HighlightIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
`;

const HighlightTitle = styled.h4`
  color: white;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const HighlightDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.4;
`;

const highlights = [
  {
    icon: '🎯',
    title: 'Instant Dialing',
    description: 'Start calling immediately with our intuitive dialer interface'
  },
  {
    icon: '💰',
    title: 'Real-time Rates',
    description: 'See exact costs before you dial with live rate calculations'
  },
  {
    icon: '🌐',
    title: 'Global Reach',
    description: 'Connect to any number worldwide with competitive rates'
  },
  {
    icon: '📱',
    title: 'Mobile Optimized',
    description: 'Perfect experience on any device, anywhere you go'
  }
];

const DialerSection = memo(() => {
  return (
    <DialerContainer>
      <DialerContent>
        <SectionTitle>Try Our Dialer</SectionTitle>
        <SectionSubtitle>
          Experience the power of our advanced dialing system and see real-time rates 
          for any destination worldwide
        </SectionSubtitle>

        <DialerGrid>
          <DialerCard>
            <CardTitle>📞 Smart Dialer</CardTitle>
            <CardDescription>
              Our intelligent dialer automatically formats numbers and provides 
              instant feedback on call costs and connection quality.
            </CardDescription>
            <Suspense fallback={
              <LoadingPlaceholder>
                Loading dialer...
              </LoadingPlaceholder>
            }>
              <PhoneStyleDialer />
            </Suspense>
          </DialerCard>

          <DialerCard>
            <CardTitle>💎 Rate Calculator</CardTitle>
            <CardDescription>
              Calculate exact calling costs to any destination with our real-time 
              rate calculator. No surprises, just transparent pricing.
            </CardDescription>
            <Suspense fallback={
              <LoadingPlaceholder>
                Loading calculator...
              </LoadingPlaceholder>
            }>
              <RateCalculator />
            </Suspense>
          </DialerCard>
        </DialerGrid>

        <FeatureHighlight>
          {highlights.map((highlight, index) => (
            <HighlightCard key={index}>
              <HighlightIcon>{highlight.icon}</HighlightIcon>
              <HighlightTitle>{highlight.title}</HighlightTitle>
              <HighlightDescription>{highlight.description}</HighlightDescription>
            </HighlightCard>
          ))}
        </FeatureHighlight>
      </DialerContent>
    </DialerContainer>
  );
});

DialerSection.displayName = 'DialerSection';

export default DialerSection;
