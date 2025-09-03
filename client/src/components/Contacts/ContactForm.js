import React, { memo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Save, User, Phone, Mail } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border: 3px solid #000;
  border-radius: 0;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    max-width: 90vw;
    margin: 1rem;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #FFC900;
  border-bottom: 3px solid #000;
`;

const ModalTitle = styled.h2`
  color: #0a0f2f;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #0a0f2f;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(10, 15, 47, 0.1);
    transform: scale(1.1);
  }
`;

const FormContainer = styled.form`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 480px) {
    padding: 1.5rem;
    gap: 1.25rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  color: #0a0f2f;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FormInput = styled.input`
  padding: 0.75rem;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #0a0f2f;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &::placeholder {
    color: #999;
    font-weight: 500;
  }

  &:invalid {
    border-color: #dc3545;
  }

  @media (max-width: 480px) {
    padding: 0.6rem;
    font-size: 0.9rem;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const FormButton = styled.button`
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: 3px solid #000;
  border-radius: 0;
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 2px 2px 0 #000;
  }

  &:active:not(:disabled) {
    transform: translate(0, 0);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: #FFC900;
    color: #0a0f2f;

    &:hover:not(:disabled) {
      background: #e6b400;
    }
  }

  &.secondary {
    background: white;
    color: #0a0f2f;

    &:hover:not(:disabled) {
      background: #f8f9fa;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 480px) {
    padding: 0.6rem 1.25rem;
    font-size: 0.9rem;
  }
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.25rem;
`;

const ContactForm = memo(({ 
  isOpen, 
  onClose, 
  onSave, 
  contact = null,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  // 初始化表单数据
  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: ''
      });
    }
    setErrors({});
  }, [contact, isOpen]);

  // 处理输入变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    // 验证姓名
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // 验证电话
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // 验证邮箱（可选）
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      });
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose} onKeyDown={handleKeyDown}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </ModalTitle>
          <CloseButton onClick={onClose} title="Close">
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <FormContainer onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel htmlFor="name">
              <User size={16} />
              Name *
            </FormLabel>
            <FormInput
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter contact name"
              autoFocus
              required
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="phone">
              <Phone size={16} />
              Phone Number *
            </FormLabel>
            <FormInput
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="Enter phone number"
              required
            />
            {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="email">
              <Mail size={16} />
              Email (Optional)
            </FormLabel>
            <FormInput
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address"
            />
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </FormGroup>

          <FormActions>
            <FormButton
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              <X size={16} />
              Cancel
            </FormButton>
            
            <FormButton
              type="submit"
              className="primary"
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? 'Saving...' : 'Save Contact'}
            </FormButton>
          </FormActions>
        </FormContainer>
      </ModalContent>
    </ModalOverlay>
  );
});

ContactForm.displayName = 'ContactForm';

export default ContactForm;
