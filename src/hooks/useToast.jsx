import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const VARIANTS = {
  error:   { bg: '#DC2626', shadow: 'rgba(220,38,38,0.35)',  icon: '✕', title: '¡Ocurrió un error!'  },
  success: { bg: '#39A900', shadow: 'rgba(57,169,0,0.35)',   icon: '✓', title: '¡Éxito!'              },
  warning: { bg: '#D97706', shadow: 'rgba(217,119,6,0.35)',  icon: '!', title: '¡Atención!'           },
  info:    { bg: '#1D4ED8', shadow: 'rgba(29,78,216,0.35)',  icon: 'i', title: 'Información'          },
}

export function useToast(duration = 5000) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  function showToast(variant, message, title) {
    setToast({ variant, message, title })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), duration)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const v = toast ? VARIANTS[toast.variant] : null

  const toastPortal = toast
    ? createPortal(
        <>
          <style>{`
            @keyframes slideDownBanner {
              from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
              to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
          <div style={{
            position: 'fixed', top: 20, left: '50%',
            transform: 'translateX(-50%)', zIndex: 9999,
            background: v.bg, color: '#fff',
            borderRadius: 14, padding: '18px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: `0 8px 32px ${v.shadow}`,
            width: '90%', maxWidth: 580,
            animation: 'slideDownBanner 0.35s ease',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 17, fontWeight: 700,
            }}>{v.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                {toast.title || v.title}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1.5px solid rgba(255,255,255,0.55)',
                color: '#fff', borderRadius: 7,
                padding: '5px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', flexShrink: 0,
              }}
            >Aceptar</button>
          </div>
        </>,
        document.body
      )
    : null

  return { showToast, toastPortal }
}
