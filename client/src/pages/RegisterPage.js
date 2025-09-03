import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
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

const RegisterCard = styled.div`
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

const RegisterButton = styled.button`
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

const LoginLink = styled.div`
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


function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
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

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      if (formData.name && formData.email && formData.password) {
        const result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
          toast.success('Registration successful! Welcome to Ubophone!');
          navigate('/dashboard');
        } else {
          setError(result.message || 'Registration failed, please try again later');
        }
      } else {
        setError('Please fill in all fields');
      }
    } catch (error) {
      setError('Registration failed, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <RegisterCard>

        <Title>Create Account</Title>
        <Subtitle>Join us and enjoy low-cost international calling services</Subtitle>


        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <InputIcon>
              <User size={20} />
            </InputIcon>
            <Input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </InputGroup>

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
              placeholder="Password (at least 6 characters)"
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

          <InputGroup>
            <InputIcon>
              <Lock size={20} />
            </InputIcon>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </PasswordToggle>
          </InputGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <RegisterButton type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </RegisterButton>
        </Form>

        <Divider>
          <span>Already have an account?</span>
        </Divider>

        <LoginLink>
          <Link to="/login">Sign In Now</Link>
        </LoginLink>
      </RegisterCard>
    </Container>
  );
}

export default RegisterPage; 