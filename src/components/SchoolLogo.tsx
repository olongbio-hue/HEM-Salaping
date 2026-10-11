import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'badge' | 'plain';
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'plain'
}) => {
  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28'
  };

  const imageElement = (
    <img
      src="/src/assets/images/smk_salaping_crest_1791732075810.jpg"
      alt="Logo Rasmi SMK Salaping - Ilmuan Gemilang"
      referrerPolicy="no-referrer"
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
