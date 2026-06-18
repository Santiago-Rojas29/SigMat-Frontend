import { useState, useEffect, useRef, useCallback, useReducer } from 'react'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'

const TIPO_CONFIG = {
  solicitud_estado:  { color: '#2563eb', bg: '#eff6ff', icon: '📋' },
  nueva_solicitud:   { color: '#0891b2', bg: '#ecfeff', icon: '🔔' },
  nueva_devolucion:  { color: '#059669', bg: '#ecfdf5', icon: '↩️' },
  prestamo_proximo:  { color: '#d97706', bg: '#fffbeb', icon: '⏰' },
  prestamo_vencido:  { color: '#dc2626', bg: '#fef2f2', icon: '⚠️' },
  lote_vencimiento:  { color: '#7c3aed', bg: '#f5f3ff', icon: '📦' },
  stock_bajo:        { color: '#c2410c', bg: '#fff7ed', icon: '📉' },
}

function parseServerAge(dateStr) {
  if (!dateStr) return 0
  let str = String(dateStr).replace(' ', 'T')
  if (!/Z|[+-]\d{2}:\d{2}$/.test(str)) str += 'Z'
  const ms = new Date(str).getTime()
  const now = Date.now()
  if (isNaN(ms) || ms > now) return 0
  return now - ms
}

function fmtSecs(secs) {
  if (secs < 60)    return 'hace 1 min'
  if (secs < 3600)  return `hace ${Math.floor(secs / 60)} min`
  if (secs < 86400) return `hace ${Math.floor(secs / 3600)} h`
  return `hace ${Math.floor(secs / 86400)} d`
}

function annotate(n) {
  return { ...n, _startAge: parseServerAge(n.fecha_creacion), _startTime: Date.now() }
}

function timeAgo(n) {
  if (!n._startTime) return ''
  const elapsed = n._startAge + (Date.now() - n._startTime)
  return fmtSecs(Math.floor(elapsed / 1000))
}

function BellIcon({ hasUnread }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      {hasUnread && (
        <circle cx="18" cy="5" r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
      )}
    </svg>
  )
}

export function NotificacionBell() {
  const socket = useSocket()
  const [notifs, setNotifs]   = useState([])
  const [open, setOpen]       = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const panelRef = useRef(null)
  const btnRef   = useRef(null)
  const [, tick] = useReducer(n => n + 1, 0)

  // Re-render every minute so timeAgo labels stay current
  useEffect(() => {
    const id = setInterval(() => tick(), 15_000)
    return () => clearInterval(id)
  }, [])

  const unread = notifs.filter(n => !n.leida).length

  const fetchNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notificaciones')
      setNotifs(data.map(annotate))
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // Real-time: receive new notification via WebSocket
  useEffect(() => {
    if (!socket) return
    const handler = (notif) => {
      setNotifs(prev => [annotate(notif), ...prev].slice(0, 50))
    }
    socket.on('notificacion', handler)
    return () => socket.off('notificacion', handler)
  }, [socket])

  // Close on outside click
  useEffect(() => {
    if (!open && !isClosing) return
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) closePanel()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, isClosing])

  const closePanel = () => {
    setIsClosing(true)
    setTimeout(() => { setOpen(false); setIsClosing(false) }, 160)
  }

  const togglePanel = () => {
    if (open || isClosing) closePanel()
    else setOpen(true)
  }

  const marcarLeida = async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`)
      setNotifs(prev => prev.map(n => n.id_notificacion === id ? { ...n, leida: true } : n))
    } catch { /* silent */ }
  }

  const marcarTodas = async () => {
    try {
      await api.patch('/notificaciones/leer-todas')
      setNotifs(prev => prev.map(n => ({ ...n, leida: true })))
    } catch { /* silent */ }
  }

  const showPanel = open || isClosing

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={togglePanel}
        title="Notificaciones"
        style={{
          position: 'relative',
          background: open ? '#f0f8e8' : 'none',
          border: open ? '1px solid #c3e6a0' : '1px solid transparent',
          borderRadius: 8,
          padding: '7px',
          cursor: 'pointer',
          color: open ? '#39A900' : '#71717a',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = '#f4f4f5'; e.currentTarget.style.color = '#18181b' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#71717a' } }}
      >
        <BellIcon hasUnread={unread > 0} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: '#ef4444', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
            border: '1.5px solid #fff',
            pointerEvents: 'none',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {showPanel && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute', top: 'calc(100% + 10px)', right: 0,
            width: 340, maxHeight: 440,
            background: '#fff', border: '1px solid #e4e4e7',
            borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.11)',
            zIndex: 300, display: 'flex', flexDirection: 'column',
            animation: `${isClosing ? 'menuOut' : 'menuIn'} 0.16s ease forwards`,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px',
            borderBottom: '1px solid #f3f4f6',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              Notificaciones
              {unread > 0 && (
                <span style={{
                  marginLeft: 6, background: '#ef4444', color: '#fff',
                  borderRadius: 10, fontSize: 10, fontWeight: 700,
                  padding: '1px 6px',
                }}>
                  {unread}
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                onClick={marcarTodas}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: '#39A900', fontWeight: 600,
                  padding: '2px 6px', borderRadius: 4,
                }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{
                padding: '28px 16px', textAlign: 'center',
                fontSize: 13, color: '#9ca3af',
              }}>
                Sin notificaciones
              </div>
            ) : notifs.map(n => {
              const cfg = TIPO_CONFIG[n.tipo] ?? { color: '#6b7280', bg: '#f9fafb', icon: '🔔' }
              return (
                <div
                  key={n.id_notificacion}
                  onClick={() => !n.leida && marcarLeida(n.id_notificacion)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 14px',
                    background: n.leida ? 'transparent' : 'rgba(57,169,0,0.04)',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: n.leida ? 'default' : 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!n.leida) e.currentTarget.style.background = 'rgba(57,169,0,0.08)' }}
                  onMouseLeave={e => { if (!n.leida) e.currentTarget.style.background = 'rgba(57,169,0,0.04)' }}
                >
                  <span style={{
                    flexShrink: 0, width: 28, height: 28,
                    borderRadius: '50%', background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, marginTop: 1,
                  }}>
                    {cfg.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, fontWeight: n.leida ? 500 : 700,
                      color: n.leida ? '#6b7280' : '#111827',
                      marginBottom: 2,
                    }}>
                      {n.titulo}
                    </div>
                    <div style={{
                      fontSize: 11, color: '#6b7280', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {n.mensaje}
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>
                      {timeAgo(n)}
                    </div>
                  </div>
                  {!n.leida && (
                    <span style={{
                      flexShrink: 0, width: 7, height: 7,
                      borderRadius: '50%', background: '#39A900',
                      marginTop: 6,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
