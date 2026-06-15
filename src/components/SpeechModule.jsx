import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

function SpeechModule({ onTranscription }) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError("Web Speech API is not supported in this browser.")
      return
    }

    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onresult = (event) => {
      let finalSpeech = ""
      let interimSpeech = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalSpeech += transcript
        } else {
          interimSpeech += transcript
        }
      }

      if (interimSpeech) {
        setInterimText(interimSpeech)
      }
      
      if (finalSpeech) {
        setInterimText("")
        onTranscription(finalSpeech)
      }
    }

    recognitionRef.current.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error)
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      if (isListening) {
        try {
          recognitionRef.current.start() // Auto-restart if we want continuous listening
        } catch (err) {
          console.error("Auto-restart failed:", err)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscription, isListening])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setInterimText("")
    } else {
      setError(null)
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error("Failed to start speech recognition:", err)
      }
    }
  }

  return (
    <div className="glass-panel speech-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--primary-glow)', borderRadius: '10px' }}>
            <Mic size={18} color="var(--primary)" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>SPEECH INPUT</span>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: '6px', background: isListening ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)', color: isListening ? 'var(--accent-success)' : 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800 }}>
          {isListening ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleListening}
          className="action-button"
          style={{ 
            width: '52px', 
            height: '52px', 
            borderRadius: '50%', 
            padding: 0, 
            background: isListening ? 'var(--accent-error)' : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            boxShadow: isListening ? '0 10px 20px rgba(239, 68, 68, 0.3)' : '0 10px 20px rgba(99, 102, 241, 0.3)'
          }}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: interimText ? 'var(--primary-bright)' : 'var(--text-main)', marginBottom: '6px', minHeight: '18px', fontStyle: interimText ? 'italic' : 'normal' }}>
            {isListening ? (interimText ? `"${interimText}..."` : 'Listening for voice...') : 'Voice transcription inactive'}
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
            {isListening && (
              <div 
                style={{ 
                  height: '100%', 
                  background: 'var(--accent-success)', 
                  width: '100%', 
                  animation: 'pulse 1.5s infinite ease-in-out' 
                }} 
              />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--accent-error)', fontSize: '0.75rem', marginTop: '12px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default SpeechModule
