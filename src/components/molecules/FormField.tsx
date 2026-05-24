import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  children: ReactNode
  required?: boolean
}

export function FormField({ label, htmlFor, children, required }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#374151',
          letterSpacing: '0.1px',
        }}
      >
        {label}
        {required && <span style={{ color: '#39A900', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}
