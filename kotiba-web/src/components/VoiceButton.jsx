import { Mic, MicOff, Loader, Volume2 } from 'lucide-react'
import { useVoice } from '../hooks/useVoice'

// Katta mikrofon tugmasi — ovoz yozish va TTS
export function VoiceButton({ onResult }) {
  const { isRecording, isProcessing, isSpeaking, startRecording, stopRecording, speak } = useVoice()

  const handleClick = async () => {
    if (isProcessing || isSpeaking) return

    if (isRecording) {
      // Yozishni to'xtatish va yuborish
      const result = await stopRecording()
      if (result) {
        // AI javobini ovozda aytish
        if (result.ai_result?.response_text) {
          speak(result.ai_result.response_text)
        }
        // Natijani asosiy sahifaga uzatish
        if (onResult) onResult(result)
      }
    } else {
      startRecording()
    }
  }

  // Holat asosida icon va matn
  const getState = () => {
    if (isProcessing) return { icon: <Loader size={32} className="spin" />, label: 'Tahlil qilinmoqda...', cls: 'processing' }
    if (isSpeaking)   return { icon: <Volume2 size={32} />,                 label: 'Javob aytilmoqda...', cls: 'speaking'   }
    if (isRecording)  return { icon: <MicOff size={32} />,                  label: 'To\'xtatish',         cls: 'recording'  }
    return             { icon: <Mic size={32} />,                            label: 'Gapiring',            cls: ''           }
  }

  const { icon, label, cls } = getState()

  return (
    <div className="voice-btn-wrapper">
      <button
        className={`voice-btn ${cls}`}
        onClick={handleClick}
        disabled={isProcessing || isSpeaking}
        title={label}
      >
        {icon}
      </button>
      <span className="voice-btn-label">{label}</span>
    </div>
  )
}
