import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FAFAFA;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
  }

  @media (max-width: 480px) {
    padding: 0.75rem 0.25rem;
    padding-top: 1.5rem;
  }
`;

const LoginCard = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

  @media (max-width: 768px) {
    padding: 2.5rem 2rem;
    margin: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
    margin: 0 0.25rem;
  }

  @media (max-width: 360px) {
    padding: 1.5rem 1rem;
    margin: 0.5rem;
  }
`;


const Title = styled.h2`
  text-align: center;
  font-size: 1.8rem;
  font-weight: 800;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #0a0f2f;
  margin-bottom: 2rem;
  opacity: 0.8;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #0a0f2f;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #000;
  border-radius: 0;
  background: white;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 4px 12px rgba(255, 201, 0, 0.2);
  }

  &::placeholder {
    color: #666;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    padding: 1.125rem 1rem 1.125rem 3rem;
    font-size: 16px; /* Prevents zoom on iOS */
  }

  @media (max-width: 480px) {
    padding: 1rem 0.875rem 1rem 2.75rem;
    font-size: 16px;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.3s ease;

  &:hover {
    color: #666;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 1rem;
  border: 3px solid #000;
  border-radius: 0;
  background: #FFC900;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  position: relative;

  &:hover {
    transform: translate(-4px, -4px);
    box-shadow: 4px 4px 0 #000;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const GoogleButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
  padding: 1rem;
  border: 2px solid #000;
  border-radius: 0;
  background: white;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f5f5;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }
`;

const GoogleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ForgotPassword = styled(Link)`
  text-align: right;
  display: block;
  color: #0a0f2f;
  font-size: 0.875rem;
  text-decoration: none;
  margin-top: 0.5rem;
  font-weight: 600;
  transition: color 0.3s ease;

  &:hover {
    color: #666;
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  text-align: center;
  margin: 2rem 0;
  position: relative;
  color: #0a0f2f;
  font-weight: 600;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: #000;
  }

  span {
    background: white;
    padding: 0 1rem;
    position: relative;
  }
`;

const SignupLink = styled.div`
  text-align: center;
  color: #0a0f2f;
  font-weight: 600;

  a {
    color: #0a0f2f;
    text-decoration: none;
    font-weight: 800;
    transition: color 0.3s ease;

    &:hover {
      color: #666;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  text-align: center;
`;

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.email && formData.password) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success('Login successful!');
          navigate('/dashboard');
        } else {
          setError(result.message || 'Login failed, please check your credentials');
        }
      } else {
        setError('Please fill in all fields');
      }
    } catch (error) {
      setError('Login failed, please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>

        <Title>Welcome Back</Title>
        <Subtitle>Sign in to your account to continue using international calling services</Subtitle>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <Mail size={20} />
            </InputIcon>
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>
              <Lock size={20} />
            </InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </PasswordToggle>
          </InputGroup>

          <ForgotPassword to="/forgot-password">Forgot password?</ForgotPassword>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <LoginButton type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </LoginButton>
        </Form>

        <Divider>
          <span>OR</span>
        </Divider>

        <GoogleButton href="/api/auth/google">
          <GoogleIcon>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </GoogleIcon>
          Sign in with Google
        </GoogleButton>

        <Divider>
          <span>Don't have an account?</span>
        </Divider>

        <SignupLink>
          <Link to="/register">Sign Up Now</Link>
        </SignupLink>
      </LoginCard>
    </Container>
  );
}

export default LoginPage; 