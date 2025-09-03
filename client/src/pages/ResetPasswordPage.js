import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
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

const Card = styled.div`
  background: #ffffff;
  border: 3px solid #000000;
  border-radius: 0;
  padding: 3rem;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    padding: 2.5rem 2rem;
    margin: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
    border-radius: 1rem;
    margin: 0 0.25rem;
  }

  @media (max-width: 360px) {
    padding: 1.5rem 1rem;
    margin: 0.5rem;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const LogoIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 0;
  background: #FFC900;
  border: 3px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0a0f2f;
`;

const LogoText = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #000000;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 1.8rem;
  font-weight: 600;
  color: #000000;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #9ca3af;
  margin-bottom: 2rem;
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
  color: #9ca3af;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 3px solid #000000;
  border-radius: 0;
  background: #ffffff;
  color: #000000;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  &::placeholder {
    color: #6b7280;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.3s ease;

  &:hover {
    color: #000000;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  border: 3px solid #000000;
  border-radius: 0;
  background: #FFC900;
  color: #0a0f2f;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const BackToLogin = styled(Link)`
  display: block;
  text-align: center;
  color: #000000;
  margin-top: 2rem;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;

  &:hover {
    color: #000000;
    text-decoration: underline;
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 0;
  margin-top: 1.5rem;
  text-align: center;
  
  &.success {
    background: #FFC900;
    border: 3px solid #000000;
    color: #000000;
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 3px solid #ef4444;
    color: #ef4444;
  }
`;

function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  
  const { resetPassword } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setMessage('Invalid or missing reset token');
      setMessageType('error');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate passwords
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword(token, formData.password);
      if (result.success) {
        setMessage(result.message);
        setMessageType('success');
        toast.success('Password reset successful!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <LogoLink to="/">
          <LogoIcon>
            <Phone size={24} />
          </LogoIcon>
          <LogoText>Ubophone</LogoText>
        </LogoLink>

        <Title>Reset Password</Title>
        <Subtitle>Enter your new password</Subtitle>

        {!tokenValid ? (
          <>
            <Message className="error">
              Invalid or expired password reset link. Please request a new one.
            </Message>
            <BackToLogin to="/forgot-password">Request New Reset Link</BackToLogin>
          </>
        ) : (
          <Form onSubmit={handleSubmit}>
            <InputGroup>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="New Password"
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
                placeholder="Confirm New Password"
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

            {message && (
              <Message className={messageType}>
                {message}
              </Message>
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Form>
        )}

        <BackToLogin to="/login">Back to Login</BackToLogin>
      </Card>
    </Container>
  );
}

export default ResetPasswordPage; 