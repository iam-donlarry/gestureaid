import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

function SpeechModule({ onTranscription }) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
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
      let currentTranscription = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscription += event.results[i][0].transcript
      }
      onTranscription(currentTranscription)
    }

    recognitionRef.current.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error)
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start() // Auto-restart if we want continuous listening
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscription])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
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
    <div className="glass speech-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Speech Input</h3>
        <div style={{ padding: '4px 8px', borderRadius: '4px', background: isListening ? 'var(--success)' : 'var(--surface)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
          {isListening ? 'Live' : 'Off'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={toggleListening}
          className={`btn ${isListening ? '' : 'btn-secondary'}`}
          style={{ width: '56px', height: '56px', borderRadius: '50%', padding: 0, justifyContent: 'center', background: isListening ? 'var(--error)' : 'var(--primary)' }}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
            {isListening ? 'Listening for voice...' : 'Voice transcription inactive'}
          </div>
          <div style={{ height: '4px', background: 'var(--surface)', borderRadius: '2px', overflow: 'hidden' }}>
            {isListening && (
              <div 
                style={{ 
                  height: '100%', 
                  background: 'var(--success)', 
                  width: '100%', 
                  animation: 'pulse 1.5s infinite ease-in-out' 
                }} 
              />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '8px' }}>
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
