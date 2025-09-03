import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Loader2 } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #FAFAFA;
  padding: 2rem;
  text-align: center;
`;

const LoadingIcon = styled.div`
  margin-bottom: 2rem;
  color: #FFC900;
  animation: spin 2s linear infinite;
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 600;
  color: #0a0f2f;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: #0a0f2f;
  max-width: 400px;
`;

function SocialCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleSocialLogin = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      if (token) {
        localStorage.setItem('token', token);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // If no token, redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    };

    handleSocialLogin();
  }, [navigate]);

  return (
    <Container>
      <LoadingIcon>
        <Loader2 size={48} />
      </LoadingIcon>
      <Title>Processing Login</Title>
      <Subtitle>
        Please wait while we complete your authentication. 
        You will be redirected automatically...
      </Subtitle>
    </Container>
  );
}

export default SocialCallbackPage; 