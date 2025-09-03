import React, { memo } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const DialerContainer = memo(({ children, className, ...props }) => {
  return (
    <Container className={className} {...props}>
      {children}
    </Container>
  );
});

DialerContainer.displayName = 'DialerContainer';

export default DialerContainer;
