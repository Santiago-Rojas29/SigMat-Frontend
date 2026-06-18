import { useState, useRef, useEffect, useCallback } from 'react'

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''
const SESSION_ID = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)

const N8N_DEFAULT_RESPONSES = ['workflow was started', 'workflow started', 'webhook received']

function BotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function Message({ role, text }) {
  const isBot = role === 'bot'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: 10,
      animation: 'chatFadeIn 0.25s ease',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: isBot ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
        background: isBot ? '#f0f0f0' : '#39A900',
        color: isBot ? '#1a1a1a' : '#ffffff',
        fontSize: 13,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {text}
      </div>
    </div>
  )
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: '¡Hola! Soy el asistente virtual de SIGMAT. ¿En qué puedo ayudarte?' },
  ])
  const [input, setInput] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const closePanel = () => {
    setIsClosing(true)
    setTimeout(() => { setOpen(false); setIsClosing(false) }, 180)
  }

  const parseResponse = (raw) => {
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (N8N_DEFAULT_RESPONSES.includes(trimmed.toLowerCase())) return null
      return trimmed
    }
    if (raw && typeof raw === 'object') {
      return raw.response || raw.reply || raw.text || raw.message || raw.output || JSON.stringify(raw)
    }
    return String(raw)
  }

  const getAnswerFromN8n = useCallback(async (userMessage) => {
    if (!N8N_URL) return null
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          message: userMessage,
          history: messages.map(m => ({ role: m.role, text: m.text })),
        }),
      })
      if (!res.ok) return null

      const text = await res.text()
      if (!text) return null

      try {
        const data = JSON.parse(text)
        return parseResponse(data)
      } catch {
        return parseResponse(text)
      }
    } catch {
      return null
    }
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    let answer = null
    if (N8N_URL) {
      answer = await getAnswerFromN8n(text)
    }

    if (!answer) {
      answer = '⚠️ No se pudo conectar con el asistente. Verificá que el flujo de n8n esté activo y configurado correctamente.'
    }

    setMessages(prev => [...prev, { role: 'bot', text: answer }])
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showPanel = open || isClosing

  return (
    <>
      <button
        onClick={() => (open || isClosing) ? closePanel() : setOpen(true)}
        title="Asistente virtual"
        style={{
          position: 'fixed',
          bottom: 92,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: open ? '#007832' : '#39A900',
          boxShadow: open
            ? '0 6px 24px rgba(57, 169, 0, 0.45)'
            : '0 4px 16px rgba(57, 169, 0, 0.3)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          transform: open ? 'scale(0.95)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.08)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.transform = 'scale(1)' }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <BotIcon />
        )}
      </button>

      {showPanel && (
        <div style={{
          position: 'fixed',
          bottom: 156,
          right: 24,
          width: 360,
          height: 480,
          maxHeight: 'calc(100vh - 200px)',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: `${isClosing ? 'panelOut' : 'panelIn'} 0.2s ease forwards`,
          border: '1px solid #e4e4e7',
        }}>
          <div style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg, #39A900, #007832)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Asistente SIGMAT</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>En línea</div>
            </div>
            <button
              onClick={closePanel}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff', cursor: 'pointer',
                borderRadius: 8, padding: '4px 8px',
                fontSize: 12, fontWeight: 600,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
              ✕
            </button>
          </div>

          <div
            ref={listRef}
            style={{
              flex: 1, overflowY: 'auto',
              padding: '14px 14px 6px',
              background: '#fafafa',
            }}
          >
            {messages.map((msg, i) => (
              <Message key={i} role={msg.role} text={msg.text} />
            ))}
            {loading && (
              <div style={{
                display: 'flex', justifyContent: 'flex-start', marginBottom: 10,
                animation: 'chatFadeIn 0.25s ease',
              }}>
                <div style={{
                  background: '#f0f0f0', borderRadius: '4px 16px 16px 16px',
                  padding: '10px 16px', fontSize: 13,
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  <span style={{ animation: 'dotPulse 1.2s infinite', animationDelay: '0s' }}>.</span>
                  <span style={{ animation: 'dotPulse 1.2s infinite', animationDelay: '0.2s' }}>.</span>
                  <span style={{ animation: 'dotPulse 1.2s infinite', animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
          </div>

          <div style={{
            padding: '10px 14px 14px',
            borderTop: '1px solid #f0f0f0',
            background: '#fff',
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                rows={1}
                style={{
                  flex: 1,
                  border: '1px solid #e4e4e7',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  minHeight: 36,
                  maxHeight: 80,
                  lineHeight: 1.4,
                }}
                onInput={e => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  background: input.trim() && !loading ? '#39A900' : '#e4e4e7',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: input.trim() && !loading ? '#fff' : '#a1a1aa',
                  cursor: input.trim() && !loading ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  height: 36,
                }}
                onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.background = '#007832' }}
                onMouseLeave={e => { if (input.trim() && !loading) e.currentTarget.style.background = '#39A900' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
