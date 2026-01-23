import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const baseInputStyles = 'w-full rounded-lg border bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0';

  const stateStyles = error
    ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500'
    : 'border-neutral-200 dark:border-neutral-700 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-transparent';

  const paddingStyles = leftIcon
    ? 'pl-10 pr-3 py-2'
    : rightIcon
      ? 'pl-3 pr-10 py-2'
      : 'px-3 py-2';

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseInputStyles} ${stateStyles} ${paddingStyles} text-sm ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {hint && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
