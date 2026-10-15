import React, { useState, useEffect } from 'react';
import defaultLogoImg from '../assets/images/smk_salaping_crest_1791732075810.jpg';

interface SchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'badge' | 'plain';
  src?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'plain',
  src
}) => {
  const getInitialSrc = () => {
    if (src && !src.startsWith('/src/assets/images/')) return src;
    return defaultLogoImg || '/logo.png';
  };

  const [imgSrc, setImgSrc] = useState<string>(getInitialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src && !src.startsWith('/src/assets/images/')) {
      setImgSrc(src);
      setHasError(false);
    } else {
      setImgSrc(defaultLogoImg || '/logo.png');
      setHasError(false);
    }
  }, [src]);

  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28'
  };

  const handleError = () => {
    if (imgSrc !== defaultLogoImg && defaultLogoImg) {
      setImgSrc(defaultLogoImg);
    } else if (imgSrc !== '/logo.png') {
      setImgSrc('/logo.png');
    } else {
      setHasError(true);
    }
  };

  const imageElement = hasError ? (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white font-black flex flex-col items-center justify-center border-2 border-amber-400 shadow-md ${className}`}
      title="SMK Salaping - Ilmuan Gemilang"
    >
      <span className="text-[10px] leading-none text-amber-300 font-bold">SMK</span>
      <span className="text-[11px] leading-tight font-extrabold text-white tracking-wider">SALAPING</span>
    </div>
  ) : (
    <img
      src={imgSrc}
      alt="Logo Rasmi SMK Salaping - Ilmuan Gemilang"
      onError={handleError}
      className={`${sizeClasses[size] || sizeClasses.md} object-contain transition-transform duration-200 ${className}`}
      loading="eager"
    />
  );

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center justify-center p-1 rounded-xl bg-white/95 shadow-xs border border-slate-200/80">
        {imageElement}
      </div>
    );
  }

  return imageElement;
};
