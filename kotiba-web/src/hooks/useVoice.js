import { useState, useRef, useCallback } from 'react'
import { voiceApi } from '../services/api'

export function useVoice() {
  const [isRecording,  setIsRecording]  = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking,   setIsSpeaking]   = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])

  // ─── Yozishni boshlash ───────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(100) // har 100ms da chunk
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      console.error('[VOICE] Mikrofon xatosi:', err)
      alert('Mikrofonga ruxsat berilmagan!')
    }
  }

  // ─── Yozishni to'xtatish va backend ga yuborish ──────
  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return null

    setIsRecording(false)
    setIsProcessing(true)

    try {
      // MediaRecorder to'xtashini kutish
      const blob = await new Promise((resolve) => {
        recorder.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          resolve(audioBlob)
        }
        recorder.stop()
        recorder.stream.getTracks().forEach(t => t.stop())
      })

      mediaRecorderRef.current = null
      chunksRef.current = []

      if (blob.size < 100) {
        setIsProcessing(false)
        return null
      }

      // Backend ga yuborish
      const file = new File([blob], 'recording.webm', { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', file)

      const res = await voiceApi.processAudio(formData)
      setIsProcessing(false)
      return res.data
    } catch (err) {
      console.error('[VOICE] Yuborish xatosi:', err)
      setIsProcessing(false)
      return null
    }
  }

  // ─── OGG Audio buffer ni o'ynash ─────────────────────
  const playAudioBuffer = async (buffer) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const ctx = new AudioCtx()
      const decoded = await ctx.decodeAudioData(buffer.slice(0))
      const source = ctx.createBufferSource()
      source.buffer = decoded
      source.connect(ctx.destination)
      return new Promise((resolve) => {
        source.onended = () => { ctx.close(); resolve() }
        source.start(0)
        setTimeout(() => { try { ctx.close() } catch {} resolve() }, 30000)
      })
    } catch {
      // Fallback: Blob URL orqali o'ynash
      try {
        const blob = new Blob([buffer], { type: 'audio/ogg; codecs=opus' })
        const url  = URL.createObjectURL(blob)
        const audio = new Audio(url)
        return new Promise((resolve) => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve() }
          audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
          audio.play().catch(() => { URL.revokeObjectURL(url); resolve() })
          setTimeout(() => { URL.revokeObjectURL(url); resolve() }, 30000)
        })
      } catch {
        // Har ikki usul ham ishlamasa — o'tkazib yuborish
      }
    }
  }

  // ─── TTS: matnni ovozga aylantirish ──────────────────
  const speak = useCallback(async (text) => {
    if (!text) return
    setIsSpeaking(true)
    try {
      const res = await voiceApi.tts(text)
      if (res.status === 200 && res.data && res.data.byteLength > 100) {
        await playAudioBuffer(res.data)
      }
    } catch (err) {
      console.warn('[TTS] Xato:', err.message)
    } finally {
      setIsSpeaking(false)
    }
  }, [])

  return {
    isRecording,
    isProcessing,
    isSpeaking,
    startRecording,
    stopRecording,
    speak,
  }
}
