import { useState, forwardRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './AppDateInput.css'

function parseDate(str) {
  if (!str) return null
  // Handles "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm"
  return new Date(str.includes('T') ? str : str + 'T00:00:00')
}

function formatDate(date, withTime = false) {
  if (!date) return ''
  const y  = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d  = String(date.getDate()).padStart(2, '0')
  if (!withTime) return `${y}-${mo}-${d}`
  const h  = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${mi}`
}

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, opacity: 0.45 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const DateTrigger = forwardRef(function DateTrigger(
  { value, onClick, open, placeholder, disabled, error, sm },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        background: disabled ? '#f3f4f6' : '#F9FAF7',
        border: `1px solid ${error ? '#EF4444' : open ? '#39A900' : '#d1d5db'}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: value ? '#111827' : '#9ca3af',
        outline: 'none',
        boxShadow: open ? '0 0 0 3px rgba(57,169,0,0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontSize: 14,
        padding: sm ? '7px 10px' : '8px 12px',
        minHeight: 38,
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      <CalendarIcon />
      <span style={{ flex: 1 }}>{value || placeholder}</span>
    </button>
  )
})

export function AppDateInput({
  value,
  onChange,
  min,
  max,
  disabled,
  error,
  size = 'md',
  showTime = false,
  placeholder,
  style,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const sm = size === 'sm'

  const defaultPlaceholder = showTime ? 'dd/mm/aaaa hh:mm' : 'dd/mm/aaaa'
  const resolvedPlaceholder = placeholder ?? defaultPlaceholder

  const selected = parseDate(value)
  const minDate  = parseDate(min) || undefined
  const maxDate  = parseDate(max) || undefined

  function handleChange(date) {
    onChange?.({ target: { value: date ? formatDate(date, showTime) : '' } })
  }

  return (
    <div style={{ width: '100%', ...style }} className={className}>
      <DatePicker
        selected={selected}
        onChange={handleChange}
        dateFormat={showTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy'}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        onCalendarOpen={() => setOpen(true)}
        onCalendarClose={() => setOpen(false)}
        customInput={
          <DateTrigger
            open={open}
            error={error}
            sm={sm}
            placeholder={resolvedPlaceholder}
            disabled={disabled}
          />
        }
        wrapperClassName="dp-full-width"
        popperClassName="sigmat-dp-popper"
        popperPlacement="bottom-start"
        showPopperArrow={false}
        portalId="dp-portal"
        calendarStartDay={1}
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={10}
        showTimeSelect={showTime}
        timeFormat={showTime ? 'HH:mm' : undefined}
        timeIntervals={showTime ? 15 : undefined}
        timeCaption={showTime ? 'Hora' : undefined}
      />
      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{error}</div>
      )}
    </div>
  )
}
