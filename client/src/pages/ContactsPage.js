import React, { Suspense } from 'react';
import styled from 'styled-components';

// 懒加载 Contacts 组件
const Contacts = React.lazy(() => import('../components/Contacts'));

const Container = styled.div`
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background: #FAFAFA;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem calc(80px + env(safe-area-inset-bottom)) 0.5rem;
    min-height: calc(100vh - 60px);
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem calc(80px + env(safe-area-inset-bottom)) 0.25rem;
    min-height: calc(100vh - 60px);
  }
`;



const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #0a0f2f;
  font-size: 1.1rem;
  font-weight: 600;
`;

function ContactsPage() {
  return (
    <Container>
      <Suspense fallback={<LoadingSpinner>Loading contacts...</LoadingSpinner>}>
        <Contacts />
      </Suspense>
    </Container>
  );
}

export default ContactsPage; 