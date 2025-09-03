import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react';

const Container = styled.div`
  min-height: 100vh;
  background: #0a0f2f;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const LoginCard = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    height: 8px;
    background: #FFC900;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
  margin-bottom: 0.5rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666666;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #000000;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 3px solid #000000;
  border-radius: 0;
  font-size: 1rem;
  background: #ffffff;
  color: #000000;
  
  &:focus {
    outline: none;
    border-color: #FFC900;
    box-shadow: 0 0 0 2px rgba(255, 201, 0, 0.2);
  }
  
  &::placeholder {
    color: #999999;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666666;
  padding: 0;
  
  &:hover {
    color: #000000;
  }
`;

const LoginButton = styled.button`
  background: #FFC900;
  color: #000000;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 0;
  padding: 1rem;
  color: #d32f2f;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 2rem;
  color: #666666;
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    color: #FFC900;
    text-decoration: underline;
  }
`;

function AdminLogin() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminRefreshToken', data.refreshToken);
        navigate('/admin/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Title>
          <Shield size={32} />
          Admin Login
        </Title>
        <Subtitle>
          Access the UboPhone admin dashboard
        </Subtitle>

        {error && (
          <ErrorMessage>
            <AlertCircle size={20} />
            {error}
          </ErrorMessage>
        )}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <InputContainer>
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputContainer>
          </FormGroup>

          <LoginButton type="submit" disabled={loading}>
            {loading ? (
              'Logging in...'
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </LoginButton>
        </Form>

        <BackLink href="/">
          ← Back to main site
        </BackLink>
      </LoginCard>
    </Container>
  );
}

export default AdminLogin; 