import React from 'react';
import { UserRole } from '../types';
import { ROLE_LABELS } from '../constants';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const info = ROLE_LABELS[role] || {
    title: role,
    short: role,
    color: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs ${info.color} ${sizeClasses}`}
      title={info.title}
    >
      {info.title}
    </span>
  );
};
