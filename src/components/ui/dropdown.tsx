'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItemProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function DropdownItem({
  label,
  icon,
  onClick,
  danger = false,
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left rounded-md transition-colors
        disabled:opacity-50 disabled:pointer-events-none
        ${
          danger
            ? 'text-rose-600 hover:bg-rose-50'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }
      `}
    >
      {icon && <span className="w-4 h-4 text-current">{icon}</span>}
      <span className="flex-1">{label}</span>
    </button>
  );
}

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1.5 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg
            animate-in fade-in-0 zoom-in-95 duration-100
            ${align === 'right' ? 'right-0' : 'left-0'}
          `}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}
