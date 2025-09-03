import React, { memo } from 'react';
import styled from 'styled-components';

const FeaturesContainer = styled.section`
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
`;

const FeaturesContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 4rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 3rem;
  margin-bottom: 4rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FeatureCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: white;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2c3e50;
`;

const FeatureDescription = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureListItem = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: #555;

  &::before {
    content: '✓';
    color: #27ae60;
    font-weight: bold;
    margin-right: 0.5rem;
    font-size: 1.1rem;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-weight: 500;
`;

const features = [
  {
    icon: '🌍',
    title: 'Global Coverage',
    description: 'Connect to over 200 countries and territories worldwide with our extensive network coverage.',
    items: [
      'Premium voice quality',
      'Low latency connections',
      'Redundant network paths',
      '99.9% uptime guarantee'
    ]
  },
  {
    icon: '💎',
    title: 'Premium Quality',
    description: 'Experience crystal-clear HD voice calls with our advanced audio processing technology.',
    items: [
      'HD voice codec support',
      'Noise cancellation',
      'Echo suppression',
      'Adaptive bitrate'
    ]
  },
  {
    icon: '🔐',
    title: 'Enterprise Security',
    description: 'Your communications are protected with bank-grade encryption and security protocols.',
    items: [
      'End-to-end encryption',
      'GDPR compliant',
      'SOC 2 certified',
      'Regular security audits'
    ]
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Connect instantly with our optimized global infrastructure and smart routing.',
    items: [
      'Sub-second connection',
      'Smart call routing',
      'Edge server network',
      'Real-time optimization'
    ]
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    description: 'Get detailed insights into your calling patterns and optimize your communication costs.',
    items: [
      'Call quality metrics',
      'Cost analysis reports',
      'Usage patterns',
      'Custom dashboards'
    ]
  },
  {
    icon: '🎯',
    title: 'Smart Features',
    description: 'Leverage AI-powered features to enhance your calling experience and productivity.',
    items: [
      'Smart call routing',
      'Predictive dialing',
      'Voice transcription',
      'Call sentiment analysis'
    ]
  }
];

const stats = [
  { number: '200+', label: 'Countries' },
  { number: '99.9%', label: 'Uptime' },
  { number: '<100ms', label: 'Latency' },
  { number: '24/7', label: 'Support' }
];

const FeaturesSection = memo(() => {
  return (
    <FeaturesContainer>
      <FeaturesContent>
        <SectionTitle>Why Choose Ubophone?</SectionTitle>
        <SectionSubtitle>
          Discover the features that make us the preferred choice for global communication
        </SectionSubtitle>

        <FeaturesGrid>
          {features.map((feature, index) => (
            <FeatureCard key={index}>
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <FeatureList>
                {feature.items.map((item, itemIndex) => (
                  <FeatureListItem key={itemIndex}>{item}</FeatureListItem>
                ))}
              </FeatureList>
            </FeatureCard>
          ))}
        </FeaturesGrid>

        <StatsContainer>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <StatNumber>{stat.number}</StatNumber>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsContainer>
      </FeaturesContent>
    </FeaturesContainer>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
