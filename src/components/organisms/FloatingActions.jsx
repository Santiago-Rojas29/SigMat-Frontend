import { useState, useRef, useEffect, useCallback } from 'react'

const N8N_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || ''
const N8N_WHATSAPP = import.meta.env.VITE_N8N_WHATSAPP_WEBHOOK_URL || ''
const PHONE = import.meta.env.VITE_WHATSAPP_PHONE || '573001234567'
const WHATSAPP_URL = `https://wa.me/${PHONE}`
const SESSION_ID = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)

const N8N_DEFAULT_RESPONSES = ['workflow was started', 'workflow started', 'webhook received']

/* ---------- Helpers ---------- */

function BotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function WAIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function ChatMessage({ role, text }) {
  const isBot = role === 'bot'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isBot ? 'flex-start' : 'flex-end',
      marginBottom: 8,
      animation: 'chatFadeIn 0.25s ease',
    }}>
      <div style={{
        maxWidth: '88%',
        padding: '8px 12px',
        borderRadius: isBot ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: isBot ? '#f0f0f0' : '#39A900',
        color: isBot ? '#1a1a1a' : '#ffffff',
        fontSize: 13,
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        {text}
      </div>
    </div>
  )
}

/* ---------- Main Component ---------- */

export function FloatingActions() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: '¡Hola! Soy el asistente virtual de SIGMAT. ¿En qué puedo ayudarte?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const chatListRef = useRef(null)
  const chatInputRef = useRef(null)

  /* Auto-scroll chat */
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (chatOpen && chatInputRef.current) chatInputRef.current.focus()
  }, [chatOpen])

  /* Close chat panel */
  const closeChat = () => {
    setIsClosing(true)
    setTimeout(() => { setChatOpen(false); setMessages([
      { role: 'bot', text: '¡Hola! Soy el asistente virtual de SIGMAT. ¿En qué puedo ayudarte?' },
    ]); setIsClosing(false) }, 180)
  }

  /* n8n */
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
    if (N8N_URL) answer = await getAnswerFromN8n(text)
    if (!answer) answer = '⚠️ No se pudo conectar con el asistente. Verificá que el flujo de n8n esté activo.'

    setMessages(prev => [...prev, { role: 'bot', text: answer }])
    setLoading(false)
  }

  /* WhatsApp action */
  const handleWhatsApp = () => {
    if (N8N_WHATSAPP) {
      fetch(N8N_WHATSAPP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: PHONE, source: 'in-app', action: 'whatsapp_click', timestamp: new Date().toISOString() }),
      }).catch(() => {})
    }
    window.open(WHATSAPP_URL, '_blank', 'noopener')
    setMenuOpen(false)
  }

  const showChat = chatOpen || isClosing

  return (
    <>
      {/* Chat panel */}
      {showChat && (
        <div style={{
          position: 'fixed', bottom: 100, right: 100,
          width: 360, height: 460,
          maxHeight: 'calc(100vh - 140px)',
          background: '#ffffff', borderRadius: 16,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: `${isClosing ? 'panelOut' : 'panelIn'} 0.2s ease forwards`,
          border: '1px solid #e4e4e7',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #39A900, #007832)',
            color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Asistente SIGMAT</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>En línea</div>
            </div>
            <button onClick={closeChat} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              cursor: 'pointer', borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: 600,
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >✕</button>
          </div>

          {/* Messages */}
          <div ref={chatListRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px', background: '#fafafa' }}>
            {messages.map((msg, i) => <ChatMessage key={i} role={msg.role} text={msg.text} />)}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8, animation: 'chatFadeIn 0.25s ease' }}>
                <div style={{ background: '#f0f0f0', borderRadius: '4px 14px 14px 14px', padding: '8px 14px', fontSize: 13, display: 'flex', gap: 3, alignItems: 'center' }}>
                  <span style={{ animation: 'dotPulse 1.2s infinite', animationDelay: '0s' }}>.</span>
                  <span style={{ animation: 'dotPulse 1.2s infinite', animationDelay: '0.2s' }}>.</span>
                  <span style={{ animation: 'dotPulse 1.2s infinite', animationDelay: '0.4s' }}>.</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea ref={chatInputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Escribe tu pregunta..." rows={1}
                style={{
                  flex: 1, border: '1px solid #e4e4e7', borderRadius: 10, padding: '8px 12px', fontSize: 13,
                  fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 36, maxHeight: 72, lineHeight: 1.4,
                }}
                onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 72) + 'px' }}
              />
              <button onClick={handleSend} disabled={!input.trim() || loading} style={{
                background: input.trim() && !loading ? '#39A900' : '#e4e4e7', border: 'none', borderRadius: 10,
                padding: '8px 12px', color: input.trim() && !loading ? '#fff' : '#a1a1aa',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, height: 36,
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

      {/* Speed-dial actions */}
      {menuOpen && (
        <>
          <button onClick={handleWhatsApp} title="WhatsApp" style={{
            position: 'fixed', bottom: 156, right: 32, width: 48, height: 48, borderRadius: '50%',
            background: '#25D366', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 9998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37,211,102,0.4)',
            animation: 'fabIn 0.2s ease forwards',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          ><WAIcon /></button>

          <button onClick={() => { setChatOpen(true); setMenuOpen(false) }} title="Asistente virtual" style={{
            position: 'fixed', bottom: 100, right: 32, width: 48, height: 48, borderRadius: '50%',
            background: '#39A900', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 9998,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(57,169,0,0.4)',
            animation: 'fabIn 0.2s ease forwards',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          ><BotIcon /></button>
        </>
      )}

      {/* Main FAB */}
      <button onClick={() => setMenuOpen(o => !o)} style={{
        position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
        background: menuOpen ? '#ef4444' : '#39A900', border: 'none', color: '#fff', cursor: 'pointer',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: menuOpen ? '0 6px 24px rgba(239,68,68,0.45)' : '0 6px 24px rgba(57,169,0,0.4)',
        transition: 'background 0.2s, box-shadow 0.2s',
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.25s ease', transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  )
}
