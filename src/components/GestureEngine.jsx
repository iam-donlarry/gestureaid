import React, { useState, useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import { Camera, Settings2, Database, Play, Trash2, Cpu, Zap } from 'lucide-react'
import Swal from 'sweetalert2'
import { io } from 'socket.io-client'

function GestureEngine({ onGesture, currentText, onLandmarks }) {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const mlPredictionRef = useRef('searching')
  const [mlPredictionState, setMlPredictionState] = useState('searching')
  const [trainMode, setTrainMode] = useState(false)
  const [dataSummary, setDataSummary] = useState({})
  const [isCollecting, setIsCollecting] = useState(false)
  const [collectLabel, setCollectLabel] = useState('')
  const [isTraining, setIsTraining] = useState(false)
  const [newLabel, setNewLabel] = useState('')

  useEffect(() => {
    socketRef.current = io('http://localhost:5001')

    // Initialize MediaPipe Hands
    const hands = new window.Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    hands.onResults((results) => {
      // 1. Draw Landmarks on Canvas
      const canvasCtx = canvasRef.current.getContext('2d')
      canvasCtx.save()
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
            color: '#6366f1',
            lineWidth: 4
          })
          window.drawLandmarks(canvasCtx, landmarks, {
            color: '#a855f7',
            lineWidth: 1,
            radius: 3
          })
        }
      }
      canvasCtx.restore()

      // 2. Send to Backend
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0]
        onLandmarks(landmarks)
        socketRef.current.emit('landmarks', { landmarks })
      }
    })

    const videoElement = webcamRef.current.video
    const camera = new window.Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement })
      },
      width: 640,
      height: 480
    })
    camera.start()

    socketRef.current.on('prediction', (data) => {
      mlPredictionRef.current = data.label
      setMlPredictionState(data.label)
      onGesture(data.label)
    })

    socketRef.current.on('data_summary', (data) => {
      setDataSummary(data.data)
    })

    socketRef.current.on('training_complete', (data) => {
      setIsTraining(false)
      Swal.fire({
        title: data.status === 'success' ? 'SYSTEM ONLINE' : 'SYSTEM ERROR',
        text: data.status === 'success' ? 'Neural Engine re-training successful.' : 'Training failed. Please check logs.',
        icon: data.status === 'success' ? 'success' : 'error',
        background: '#17171e',
        color: '#fff',
        confirmButtonColor: '#6366f1'
      })
    })

    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])


  const startCollection = (label) => {
    setCollectLabel(label)
    setIsCollecting(true)
    socketRef.current.emit('start_collecting', { label })
  }

  const stopCollection = () => {
    setIsCollecting(false)
    socketRef.current.emit('stop_collecting')
  }

  const trainModel = () => {
    setIsTraining(true)
    socketRef.current.emit('train_model')
  }

  const deleteLabel = (label) => {
    Swal.fire({
      title: 'ARE YOU SURE?',
      text: `Permanent deletion of label '${label}'. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'DELETE PERMANENTLY',
      background: '#17171e',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        socketRef.current.emit('delete_label', { label })
      }
    })
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
      {/* Visual Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--primary-glow)', borderRadius: '10px' }}>
            <Cpu size={18} color="var(--primary)" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>NEURAL FEED</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setTrainMode(!trainMode)}
            style={{ 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              padding: '6px 12px', 
              borderRadius: '8px', 
              color: trainMode ? 'var(--primary)' : 'white',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {trainMode ? <Zap size={14} /> : <Settings2 size={14} />}
            {trainMode ? 'LIVE VIEW' : 'TRAIN ENGINE'}
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '4/3', border: '1px solid var(--border)' }}>
        <Webcam
          ref={webcamRef}
          mirrored={true}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
          width={640}
          height={480}
        />
        
        {/* Technical HUD Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', border: '20px solid transparent', borderImage: 'linear-gradient(to bottom right, var(--primary), transparent, transparent, var(--secondary)) 1' }}></div>
        
        <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '10px' }}>
          <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6rem', color: 'var(--accent-success)', fontWeight: 800 }}>
            30 FPS
          </div>
          <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 800 }}>
             1024x768
          </div>
        </div>

        {!trainMode ? (
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Active Detection</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: mlPredictionState === 'searching' ? 'var(--text-muted)' : 'var(--primary)' }}>
                  {mlPredictionState === 'searching' ? '...ANALYZING' : mlPredictionState}
                </div>
              </div>
              <Zap size={24} color={mlPredictionState === 'searching' ? 'var(--border)' : 'var(--primary)'} className={mlPredictionState !== 'searching' ? 'animate-pulse' : ''} />
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '24px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Database size={16} color="var(--primary)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>DATASET CONTROL</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                className="premium-input"
                placeholder="New Label (e.g. SPACE)" 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value.toUpperCase())}
                style={{ fontSize: '0.8rem', padding: '10px' }}
              />
              <button 
                onMouseDown={() => startCollection(newLabel)}
                onMouseUp={stopCollection}
                disabled={!newLabel}
                className="action-button"
                style={{ background: isCollecting ? 'var(--accent-error)' : 'var(--primary)', padding: '0 15px', borderRadius: '10px', fontSize: '0.7rem' }}
              >
                {isCollecting ? 'RECORDING' : 'CAPTURE'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px' }}>
              {Object.entries(dataSummary).map(([label, count]) => (
                <React.Fragment key={label}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700 }}>{label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} SAMPLES</span>
                  </div>
                  <button 
                    onMouseDown={() => startCollection(label)}
                    onMouseUp={stopCollection}
                    className="glass"
                    style={{ padding: '0 12px', fontSize: '0.6rem', background: isCollecting && collectLabel === label ? 'var(--accent-error)' : 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                  >
                    ADD
                  </button>
                  <button 
                    onClick={() => deleteLabel(label)}
                    className="glass"
                    style={{ padding: '0 12px', fontSize: '0.6rem', color: 'var(--accent-error)', background: 'rgba(255,0,0,0.05)', borderRadius: '8px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </React.Fragment>
              ))}
            </div>

            <button 
              onClick={trainModel}
              disabled={isTraining || Object.keys(dataSummary).length < 2}
              className="action-button"
              style={{ width: '100%', marginTop: '24px', background: 'var(--accent-success)', fontSize: '0.8rem' }}
            >
              {isTraining ? 'COMPILING MODEL...' : 'RE-TRAIN NEURAL ENGINE'}
            </button>
          </div>
        )}
      </div>

      {/* Technical Cheat Sheet */}
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '4px' }}>GESTURE CMD</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>'SPACE' ➔ ADD SPACE</div>
        </div>
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '4px' }}>EXECUTION</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>'SEND' ➔ INSTANT MAIL</div>
        </div>
      </div>
    </div>
  )
}

export default GestureEngine
