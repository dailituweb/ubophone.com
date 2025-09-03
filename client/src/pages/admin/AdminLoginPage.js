import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Lock, User, Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0f2f 0%, #1a1f3a 100%);
  padding: 1rem;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: #FFC900;
    z-index: -1;
    border-radius: 0;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #0a0f2f;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #666;
  margin: 0;
  font-weight: 500;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0a0f2f;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input.withConfig({
  shouldForwardProp: (prop) => !['$hasError'].includes(prop),
})`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 3px solid ${props => props.$hasError ? '#ef4444' : '#000'};
  border-radius: 0;
  font-size: 1rem;
  font-weight: 500;
  background: ${props => props.$hasError ? '#fef2f2' : 'white'};
  color: #0a0f2f;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    background: #FFC900;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  color: #666;
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  &:hover {
    color: #0a0f2f;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['$loading'].includes(prop),
})`
  width: 100%;
  padding: 1rem 2rem;
  background: ${props => props.$loading ? '#9ca3af' : '#FFC900'};
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #0a0f2f;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: ${props => props.$loading ? 'none' : 'translate(-2px, -2px)'};
    box-shadow: ${props => props.$loading ? 'none' : '2px 2px 0 #000'};
  }

  &:active {
    transform: ${props => props.$loading ? 'none' : 'translate(0, 0)'};
    box-shadow: ${props => props.$loading ? 'none' : 'none'};
  }
`;

const LoadingSpinner = styled(Loader)`
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SecurityNote = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 0;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
`;

function AdminLoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/admin/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
    setFieldErrors({});
  }, [formData.username, formData.password, clearError, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login({
        username: formData.username.trim(),
        password: formData.password
      });

      toast.success('Login successful! Redirecting...', {
        position: 'top-right',
        autoClose: 2000
      });

      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      });

      // Handle specific error cases
      if (error.response?.status === 423) {
        setFieldErrors({ 
          general: 'Account is temporarily locked. Please try again later.' 
        });
      } else if (error.response?.status === 403) {
        setFieldErrors({ 
          general: 'Account is disabled. Please contact system administrator.' 
        });
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Container>
      <LoginCard>
        <Header>
          <Title>Admin Portal</Title>
          <Subtitle>Sign in to access the administration panel</Subtitle>
        </Header>

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputLabel htmlFor="username">Username or Email</InputLabel>
            <InputWrapper>
              <InputIcon>
                <User size={20} />
              </InputIcon>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username or email"
                $hasError={!!fieldErrors.username}
                autoComplete="username"
                disabled={isLoading}
              />
            </InputWrapper>
            {fieldErrors.username && (
              <ErrorMessage>
                <AlertCircle size={16} />
                {fieldErrors.username}
              </ErrorMessage>
            )}
          </InputGroup>

          <InputGroup>
            <InputLabel htmlFor="password">Password</InputLabel>
            <InputWrapper>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                $hasError={!!fieldErrors.password}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <PasswordToggle
                type="button"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputWrapper>
            {fieldErrors.password && (
              <ErrorMessage>
                <AlertCircle size={16} />
                {fieldErrors.password}
              </ErrorMessage>
            )}
          </InputGroup>

          {(error || fieldErrors.general) && (
            <ErrorMessage>
              <AlertCircle size={16} />
              {fieldErrors.general || error}
            </ErrorMessage>
          )}

          <SubmitButton type="submit" disabled={isLoading} $loading={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size={20} />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </SubmitButton>
        </Form>

        <SecurityNote>
          This is a secure admin portal. All login attempts are monitored and logged.
          If you're having trouble accessing your account, please contact the system administrator.
        </SecurityNote>
      </LoginCard>
    </Container>
  );
}

export default AdminLoginPage;