import React, { useState, useRef } from 'react'
import './App.css'
import EmailDashboard from './components/EmailDashboard'
import GestureEngine from './components/GestureEngine'

function App() {
  const [gesture, setGesture] = useState(null)
  const [transcription, setTranscription] = useState("")
  const [latestLandmarks, setLatestLandmarks] = useState(null)

  const lastGestureRef = useRef(null)
  const lastGestureTime = useRef(0)

  // Handle gesture as text input
  const handleGesture = (g) => {
    if (!g || g === 'searching') {
      lastGestureRef.current = null
      return
    }

    // Cooldown logic: Prevent repeated triggers of the same gesture
    const now = Date.now()
    if (g === lastGestureRef.current && (now - lastGestureTime.current < 1500)) {
      return
    }

    lastGestureRef.current = g
    lastGestureTime.current = now
    setGesture(g)

    setTranscription(prev => {
      if (g === 'SPACE') return prev + " "
      if (g === 'BACKSPACE') return prev.length > 0 ? prev.slice(0, -1) : prev
      if (g === 'SEND') return prev 
      
      return prev + g
    })
  }

  return (
    <div className="premium-container">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="badge-glow" style={{ marginBottom: '12px' }}>v2.0 Neural Engine</div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            GestureConnect<span style={{ color: 'var(--primary)' }}>.</span>
          </h1>
        </div>
        <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
          ESTABLISHED 2024 <br /> 
          <span style={{ color: 'var(--accent-success)' }}>● ENGINE ONLINE</span>
        </div>
      </header>

      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Camera & AI Control */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <GestureEngine 
            onGesture={handleGesture} 
            currentText={transcription} 
            onLandmarks={setLatestLandmarks}
          />
        </div>
        
        {/* Right Side: Professional Drafting Board */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <EmailDashboard 
            currentGesture={gesture} 
            transcription={transcription}
            onTranscriptionChange={setTranscription}
          />
        </div>
      </main>

      <footer style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div>© 2024 GESTURECONNECT TERMINAL • ALL RIGHTS RESERVED</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span>LATENCY: 12ms</span>
          <span>STABILITY: 99.9%</span>
          <span>MODE: PRODUCTION</span>
        </div>
      </footer>
    </div>
  )
}

export default App
