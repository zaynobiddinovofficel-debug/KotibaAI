import { useState, useRef, useCallback } from 'react'
import { voiceAPI } from '../services/api'

export function useVoice({ onResult, onSilence }) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Determine supported mimeType
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach(t => t.stop())

        if (blob.size < 1000) {
          onSilence?.()
          setProcessing(false)
          return
        }

        setProcessing(true)
        try {
          const formData = new FormData()
          formData.append('audio', blob, 'audio.webm')
          const res = await voiceAPI.processVoice(formData)

          if (res.data.silent || !res.data.transcript) {
            onSilence?.()
          } else {
            onResult?.(res.data)
          }
        } catch {
          onSilence?.()
        } finally {
          setProcessing(false)
        }
      }

      mediaRecorder.start()
      setRecording(true)
    } catch {
      setRecording(false)
    }
  }, [onResult, onSilence])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }, [recording])

  const speak = useCallback(async (text) => {
    try {
      const res = await voiceAPI.speak(text)
      const url = URL.createObjectURL(res.data)
      const audio = new Audio(url)
      await audio.play()
      audio.onended = () => URL.revokeObjectURL(url)
    } catch {
      // TTS failed silently
    }
  }, [])

  return { recording, processing, startRecording, stopRecording, speak }
}
