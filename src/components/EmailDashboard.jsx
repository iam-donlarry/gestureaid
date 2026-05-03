import React, { useState, useEffect, useRef } from 'react'
import { Send, User, Mail, AtSign, Type, Terminal, ShieldCheck } from 'lucide-react'
import { io } from 'socket.io-client'
import Swal from 'sweetalert2'

function EmailDashboard({ currentGesture, transcription, onTranscriptionChange }) {
  const [subject, setSubject] = useState('')
  const [toEmail, setToEmail] = useState('adekunleolanrewaju51@gmail.com')
  const [senderName, setSenderName] = useState(localStorage.getItem('gesture_sender_name') || '')
  const [senderEmail, setSenderEmail] = useState(localStorage.getItem('gesture_sender_email') || '')
  const [isSending, setIsSending] = useState(false)
  const socketRef = useRef(null)
  const lastGestureTime = useRef(0)

  // 1. Socket Setup
  useEffect(() => {
    socketRef.current = io('http://localhost:5001')
    
    socketRef.current.on('email_status', (data) => {
      setIsSending(false)
      if (data.status === 'success') {
        Swal.fire({
          title: 'TRANSMISSION COMPLETE',
          text: 'Your email has been successfully relayed.',
          icon: 'success',
          background: '#17171e',
          color: '#fff',
          confirmButtonColor: '#6366f1'
        })
        setSubject('')
      } else {
        Swal.fire({
          title: 'RELAY ERROR',
          text: data.message,
          icon: 'error',
          background: '#17171e',
          color: '#fff',
          confirmButtonColor: '#6366f1'
        })
      }
    })

    return () => socketRef.current.disconnect()
  }, [])

  // 2. Handle Instant Send Gesture
  useEffect(() => {
    if (!currentGesture || isSending) return

    if (currentGesture === 'SEND') {
      // Throttle sends to once every 3 seconds to avoid double-triggering
      const now = Date.now()
      if (now - lastGestureTime.current > 3000) {
        lastGestureTime.current = now
        handleSend()
      }
    }
  }, [currentGesture])

  const handleSend = () => {
    if (!toEmail || !transcription || transcription.trim() === "") {
      Swal.fire({
        title: 'VALIDATION FAILED',
        text: 'Missing recipient or message content. Please sign or type before sending.',
        icon: 'warning',
        background: '#17171e',
        color: '#fff',
        confirmButtonColor: '#6366f1'
      })
      return
    }

    setIsSending(true)
    
    // Persistent profile
    localStorage.setItem('gesture_sender_name', senderName)
    localStorage.setItem('gesture_sender_email', senderEmail)

    socketRef.current.emit('send_real_email', {
      to: toEmail,
      subject: subject || 'GestureConnect Message',
      body: transcription,
      sender_name: senderName,
      sender_email: senderEmail
    })
  }

  return (
    <div className="glass-panel" style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Drafting Board
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ color: 'var(--accent-success)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> ENCRYPTED
          </div>
          <div style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} /> RELAY ACTIVE
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="input-group">
          <label className="input-label"><User size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Your Name</label>
          <input 
            className="premium-input"
            placeholder="e.g. Don Larry" 
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label"><AtSign size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Reply-To Email</label>
          <input 
            className="premium-input"
            placeholder="your@email.com" 
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="input-group">
          <label className="input-label"><Mail size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Recipient</label>
          <input 
            className="premium-input"
            placeholder="to@example.com" 
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label className="input-label"><Type size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Subject</label>
          <input 
            className="premium-input"
            placeholder="Message Title..." 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </div>

      <div className="input-group">
        <label className="input-label"><Terminal size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Message Content</label>
        <div className="drafting-area">
          {transcription || <span style={{ color: 'rgba(255,255,255,0.2)' }}>Transcribing gesture input...</span>}
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {isSending ? (
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>UPLOADING TO RELAY...</span>
          ) : (
            <span>Ready for transmission. Use 'SEND' gesture to execute.</span>
          )}
        </div>
        <button 
          className="action-button" 
          onClick={handleSend} 
          disabled={isSending}
          style={{ minWidth: '180px' }}
        >
          <Send size={18} /> {isSending ? 'SENDING...' : 'SEND NOW'}
        </button>
      </div>
    </div>
  )
}

export default EmailDashboard
