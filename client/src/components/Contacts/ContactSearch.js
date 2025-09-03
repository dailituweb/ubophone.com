import React, { memo, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Search, X } from 'lucide-react';

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: none;
    width: 100%;
  }
`;

const SearchInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
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

  @media (max-width: 480px) {
    padding: 0.6rem 0.8rem 0.6rem 2.5rem;
    font-size: 0.9rem;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  pointer-events: none;
  z-index: 1;

  @media (max-width: 480px) {
    left: 0.8rem;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f0f0;
    color: #333;
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 3px solid #000;
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  display: ${props => props.$show ? 'block' : 'none'};

  @media (max-width: 768px) {
    max-height: 250px;
  }
`;

const SuggestionItem = styled.div`
  padding: 0.75rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #eee;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }

  &.highlighted {
    background: #FFC900;
    color: #0a0f2f;
  }

  @media (max-width: 480px) {
    padding: 0.6rem 0.8rem;
    gap: 0.5rem;
  }
`;

const SuggestionAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.$bgColor || '#0a0f2f'};
  color: white;
  border: 2px solid #000;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }
`;

const SuggestionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SuggestionName = styled.div`
  font-weight: 600;
  color: #0a0f2f;
  font-size: 0.9rem;
  margin-bottom: 0.125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SuggestionPhone = styled.div`
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoResults = styled.div`
  padding: 1rem;
  text-align: center;
  color: #666;
  font-style: italic;
`;

// 生成头像颜色
const getAvatarColor = (name) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// 生成头像字母
const getAvatarInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const ContactSearch = memo(({ 
  value, 
  onChange, 
  onContactSelect,
  contacts = [],
  placeholder = "Search contacts...",
  showSuggestions = true,
  maxSuggestions = 5
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 过滤联系人建议
  const suggestions = React.useMemo(() => {
    if (!value.trim() || !showSuggestions) return [];
    
    const searchTerm = value.toLowerCase();
    return contacts
      .filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.phone.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchTerm)
      )
      .slice(0, maxSuggestions);
  }, [value, contacts, showSuggestions, maxSuggestions]);

  const showSuggestionsDropdown = isFocused && suggestions.length > 0;

  // 处理键盘导航
  const handleKeyDown = (e) => {
    if (!showSuggestionsDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      
      case 'Escape':
        setIsFocused(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (contact) => {
    onChange(contact.name);
    setIsFocused(false);
    setHighlightedIndex(-1);
    onContactSelect?.(contact);
  };

  // 清除搜索
  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current?.contains(event.target)
      ) {
        setIsFocused(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 重置高亮索引当建议改变时
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  return (
    <SearchContainer>
      <SearchInputContainer>
        <SearchIcon>
          <Search size={18} />
        </SearchIcon>
        
        <SearchInput
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
        />
        
        {value && (
          <ClearButton onClick={handleClear} title="Clear search">
            <X size={16} />
          </ClearButton>
        )}
      </SearchInputContainer>

      <SuggestionsContainer 
        ref={suggestionsRef}
        $show={showSuggestionsDropdown}
      >
        {suggestions.map((contact, index) => (
          <SuggestionItem
            key={contact.id}
            className={index === highlightedIndex ? 'highlighted' : ''}
            onClick={() => handleSuggestionClick(contact)}
          >
            <SuggestionAvatar $bgColor={getAvatarColor(contact.name)}>
              {getAvatarInitials(contact.name)}
            </SuggestionAvatar>
            
            <SuggestionInfo>
              <SuggestionName>{contact.name}</SuggestionName>
              <SuggestionPhone>{contact.phone}</SuggestionPhone>
            </SuggestionInfo>
          </SuggestionItem>
        ))}
        
        {value.trim() && suggestions.length === 0 && (
          <NoResults>
            No contacts found for "{value}"
          </NoResults>
        )}
      </SuggestionsContainer>
    </SearchContainer>
  );
});

ContactSearch.displayName = 'ContactSearch';

export default ContactSearch;
