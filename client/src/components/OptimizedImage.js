import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

/**
 * 优化的图片组件
 * 支持懒加载、WebP格式、占位符等功能
 */

const ImageContainer = styled.div`
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
  ${props => props.aspectRatio && `
    aspect-ratio: ${props.aspectRatio};
  `}
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: ${props => props.objectFit || 'cover'};
  transition: opacity 0.3s ease;
  opacity: ${props => props.loaded ? 1 : 0};
`;

const Placeholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;

  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const ErrorPlaceholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: #6c757d;
  font-size: 14px;
  text-align: center;
  padding: 1rem;
`;

/**
 * 检测浏览器是否支持WebP格式
 */
const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * 生成不同格式的图片URL
 */
const generateImageUrls = (src, formats = ['webp', 'jpg']) => {
  if (!src) return [];
  
  const urls = [];
  const basePath = src.replace(/\.[^/.]+$/, ''); // 移除扩展名
  
  formats.forEach(format => {
    if (format === 'webp' && supportsWebP()) {
      urls.push(`${basePath}.webp`);
    } else if (format === 'jpg' || format === 'jpeg') {
      urls.push(`${basePath}.jpg`);
    } else if (format === 'png') {
      urls.push(`${basePath}.png`);
    }
  });
  
  // 如果没有生成任何URL，使用原始src
  if (urls.length === 0) {
    urls.push(src);
  }
  
  return urls;
};

const OptimizedImage = ({
  src,
  alt = '',
  aspectRatio,
  objectFit = 'cover',
  lazy = true,
  placeholder,
  formats = ['webp', 'jpg'],
  sizes,
  className,
  style,
  onLoad,
  onError,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // 懒加载逻辑
  useEffect(() => {
    if (!lazy || inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // 提前50px开始加载
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, inView]);

  // 图片加载处理
  const handleLoad = (e) => {
    setLoaded(true);
    setError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setError(true);
    onError?.(e);
  };

  // 生成图片源
  const imageUrls = generateImageUrls(src, formats);
  const currentSrc = imageUrls[0] || src;

  return (
    <ImageContainer
      ref={containerRef}
      aspectRatio={aspectRatio}
      className={className}
      style={style}
    >
      {inView && currentSrc && (
        <Image
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          loaded={loaded}
          objectFit={objectFit}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* 加载占位符 */}
      <Placeholder show={!loaded && !error}>
        {placeholder || (
          <div style={{ color: '#999', fontSize: '12px' }}>
            Loading...
          </div>
        )}
      </Placeholder>
      
      {/* 错误占位符 */}
      {error && (
        <ErrorPlaceholder>
          <div>📷</div>
          <div>Image failed to load</div>
        </ErrorPlaceholder>
      )}
    </ImageContainer>
  );
};

/**
 * 响应式图片组件
 * 根据屏幕尺寸加载不同大小的图片
 */
export const ResponsiveImage = ({
  src,
  srcSet,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}) => {
  // 如果没有提供srcSet，根据src生成
  const generatedSrcSet = srcSet || (() => {
    if (!src) return '';
    
    const basePath = src.replace(/\.[^/.]+$/, '');
    const ext = src.split('.').pop();
    
    return [
      `${basePath}_400w.${ext} 400w`,
      `${basePath}_800w.${ext} 800w`,
      `${basePath}_1200w.${ext} 1200w`,
      `${basePath}_1600w.${ext} 1600w`
    ].join(', ');
  })();

  return (
    <OptimizedImage
      src={src}
      srcSet={generatedSrcSet}
      sizes={sizes}
      {...props}
    />
  );
};

/**
 * 头像组件
 */
export const Avatar = ({
  src,
  size = 40,
  name,
  ...props
}) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  
  return (
    <OptimizedImage
      src={src}
      alt={name || 'Avatar'}
      aspectRatio="1"
      objectFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        ...props.style
      }}
      placeholder={
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#007bff',
          color: 'white',
          fontSize: size * 0.4,
          fontWeight: 'bold'
        }}>
          {initials}
        </div>
      }
      {...props}
    />
  );
};

export default OptimizedImage;
