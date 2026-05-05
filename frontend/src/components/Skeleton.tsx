import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClasses = 'bg-white/5 animate-pulse';
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'h-24 w-full rounded-2xl',
    circle: 'h-12 w-12 rounded-full',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export default Skeleton;
