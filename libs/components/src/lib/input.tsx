import React from 'react';
import { forwardRef, InputHTMLAttributes } from 'react';
import classNames from 'classnames';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={classNames(
      'block w-full h-10 px-3 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
      className
    )}
  />
));
