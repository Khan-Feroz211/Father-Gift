import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export default function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-navy-700 mb-1 font-sans">{label}</label>
      )}
      <input
        {...props}
        className={`input-base ${error ? 'border-red-400 focus:ring-red-400' : ''} ${className}`}
      />
      {hint && !error && <p className="mt-1 text-xs text-navy-400 font-sans">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600 font-sans">{error}</p>}
    </div>
  )
}
