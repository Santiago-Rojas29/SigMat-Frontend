import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'

const WA_NUMBER = '573114620119'
const WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_URL ?? 'https://n8n.srv1431570.hstgr.cloud/webhook/whatsapp'

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function ChatIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  )
}

function CloseIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function SendIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
  )
}

export function ChatWidget() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openWhatsApp = () => {
    const text = `Hola, soy ${user?.nombres ?? ''} ${user?.apellidos ?? ''}. Necesito ayuda con SIGMAT.`
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank')
    setMenuOpen(false)
  }

  const openChat = () => {
    setChatOpen(true)
    setMenuOpen(false)
    if (messages.length === 0) {
      setMessages([{
        from: 'bot',
        text: `¡Hola ${user?.nombres ?? ''}! Soy el asistente de SIGMAT. ¿En qué puedo ayudarte?`,
        time: new Date(),
      }])
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return

    const userMsg = { from: 'user', text, time: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          telefono: user?.telefono ?? '',
          nombre: `${user?.nombres ?? ''} ${user?.apellidos ?? ''}`.trim(),
          correo: user?.correo ?? '',
          source: 'web_chat',
        }),
      })
      const data = await res.json().catch(() => null)
      const botText = data?.response ?? data?.message ?? data?.output ?? 'Mensaje recibido. Te responderé pronto.'
      setMessages(prev => [...prev, { from: 'bot', text: botText, time: new Date() }])
    } catch {
      setMessages(prev => [...prev, { from: 'bot', text: 'No pude conectarme al asistente. Intenta más tarde.', time: new Date() }])
    } finally {
      setSending(false)
    }
  }

  const fmtTime = (d) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const widget = (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>

      {/* Menú flotante */}
      {menuOpen && !chatOpen && (
        <div style={{
          position: 'absolute', bottom: 68, right: 0,
          display: 'flex', flexDirection: 'column', gap: 10,
          animation: 'fadeInUp 0.2s ease',
        }}>
          <button onClick={openChat} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#39A900', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ChatIcon size={17} />
            </span>
            Chat con asistente
          </button>
          <button onClick={openWhatsApp} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap',
          }}>
            <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <WhatsAppIcon size={18} />
            </span>
            Abrir WhatsApp
          </button>
        </div>
      )}

      {/* Panel de chat */}
      {chatOpen && (
        <div style={{
          position: 'absolute', bottom: 68, right: 0,
          width: 380, height: 520, borderRadius: 16,
          background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'fadeInUp 0.25s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', background: '#39A900',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <ChatIcon size={18} />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Asistente SIGMAT</div>
                <div style={{ color: '#d1fae5', fontSize: 11 }}>En línea</div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              borderRadius: 8, padding: 6, color: '#fff', display: 'flex',
            }}>
              <CloseIcon size={16} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', background: '#f0fdf4' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: 14,
                  fontSize: 13, lineHeight: 1.5,
                  ...(msg.from === 'user'
                    ? { background: '#39A900', color: '#fff', borderBottomRightRadius: 4 }
                    : { background: '#fff', color: '#111827', border: '1px solid #e5e7eb', borderBottomLeftRadius: 4 }),
                }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  <div style={{
                    fontSize: 10, marginTop: 4, textAlign: 'right',
                    color: msg.from === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                  }}>
                    {fmtTime(msg.time)}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#39A900',
                    opacity: 0.4, animation: `bounce 1.4s infinite ${i * 0.2}s`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '12px 14px', borderTop: '1px solid #e5e7eb',
            display: 'flex', gap: 8, background: '#fff',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Escribe un mensaje…"
              disabled={sending}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#39A900'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              style={{
                width: 42, height: 42, borderRadius: 10, border: 'none',
                background: input.trim() ? '#39A900' : '#e5e7eb',
                color: '#fff', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => chatOpen ? setChatOpen(false) : setMenuOpen(p => !p)}
        style={{
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: chatOpen || menuOpen ? '#111827' : '#39A900',
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {chatOpen || menuOpen ? <CloseIcon size={22} /> : <ChatIcon size={24} />}
      </button>

      {/* Animations */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  )

  return createPortal(widget, document.body)
}
