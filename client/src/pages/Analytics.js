import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background: #1a1a1a;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem calc(80px + env(safe-area-inset-bottom)) 0.25rem;
    min-height: calc(100vh - 60px);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #fbbf24;
  text-align: center;
  margin-bottom: 2rem;
`;

const ComingSoon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  text-align: center;
`;

const ComingSoonText = styled.p`
  font-size: 1.2rem;
  color: #cbd5e0;
  margin-bottom: 1rem;
`;

function Analytics() {
  return (
    <Container>
      <Title>Analytics</Title>
      <ComingSoon>
        <ComingSoonText>
          Advanced analytics and reporting features coming soon!
        </ComingSoonText>
        <ComingSoonText>
          Track your calling patterns, costs, and usage statistics.
        </ComingSoonText>
      </ComingSoon>
    </Container>
  );
}

export default Analytics; 