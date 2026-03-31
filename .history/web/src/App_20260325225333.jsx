import { Button } from "@/components/ui/button"
import {
  BellIcon,
  BellOffIcon,
  Clock3Icon,
  SlidersHorizontalIcon,
  ListTodoIcon,
  MicIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  SendIcon,
  SunIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import React from "react"
import { toast } from "sonner"
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom"

const barCount = 24
const TASKS_STORAGE_KEY = "kotiba_tasks"
const PROMPT_STORAGE_KEY = "kotiba_prompt_version"

const KOTIBA_PROMPT = `You are KotibaAI, an Uzbek executive assistant.

Always return valid JSON only. No markdown. No code fences.

Schema:
{
  "intent": "chat | reminder | task | mixed",
  "assistant_reply": "short helpful Uzbek reply for the user",
  "tasks": [
    {
      "title": "short task title in Uzbek",
      "note": "optional extra context",
      "action_text": "what should be done when reminder fires",
      "schedule_at": "ISO datetime or null",
      "remind_before_minutes": 0,
      "repeat": {
        "type": "none | hourly | daily | weekly | custom",
        "interval_minutes": null
      },
      "auto_delete_at": "ISO datetime or null",
      "notify_in_site": true,
      "notify_voice": true
    }
  ]
}

Rules:
- If the user only chats, tasks can be [].
- If the user says "eslatib qo'y", create a reminder task.
- If the user mentions time, convert it into schedule_at when possible.
- If repeat is requested, fill repeat.type or repeat.interval_minutes.
- If end/delete time is requested, set auto_delete_at.
- assistant_reply must explain what was understood and what will happen.
- Use Uzbek.`

const createEmptyLevels = () => Array.from({ length: barCount }, () => 10)

const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const formatDateTime = (value) => {
  if (!value) return "Vaqt belgilanmagan"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Vaqt belgilanmagan"
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const buildNextTriggerAt = (task) => {
  if (!task.scheduleAt) return null
  const remindOffset = Number(task.remindBeforeMinutes || 0) * 60 * 1000
  const scheduleMs = new Date(task.scheduleAt).getTime()
  if (Number.isNaN(scheduleMs)) return null
  return new Date(scheduleMs - remindOffset).toISOString()
}

const getRepeatedDate = (task) => {
  if (!task.nextTriggerAt) return null
  const base = new Date(task.nextTriggerAt).getTime()
  if (Number.isNaN(base)) return null

  let stepMinutes = null
  if (task.repeatType === "hourly") stepMinutes = 60
  if (task.repeatType === "daily") stepMinutes = 60 * 24
  if (task.repeatType === "weekly") stepMinutes = 60 * 24 * 7
  if (task.repeatType === "custom") stepMinutes = Number(task.repeatIntervalMinutes || 0)

  if (!stepMinutes) return null
  return new Date(base + stepMinutes * 60 * 1000).toISOString()
}

const normalizeTask = (task) => {
  const scheduleAt = task.schedule_at || task.scheduleAt || null
  const remindBeforeMinutes = Number(task.remind_before_minutes ?? task.remindBeforeMinutes ?? 0) || 0
  const repeat = task.repeat || {}

  return {
    id: crypto.randomUUID(),
    title: task.title || "Yangi vazifa",
    note: task.note || "",
    actionText: task.action_text || task.actionText || "Vazifani bajaring",
    scheduleAt,
    remindBeforeMinutes,
    repeatType: repeat.type || task.repeatType || "none",
    repeatIntervalMinutes:
      Number(repeat.interval_minutes ?? task.repeatIntervalMinutes ?? 0) || null,
    autoDeleteAt: task.auto_delete_at || task.autoDeleteAt || null,
    notifyInSite: task.notify_in_site ?? task.notifyInSite ?? true,
    notifyVoice: task.notify_voice ?? task.notifyVoice ?? true,
    status: "active",
    createdAt: new Date().toISOString(),
    nextTriggerAt:
      task.nextTriggerAt ||
      buildNextTriggerAt({
        scheduleAt,
        remindBeforeMinutes,
      }),
    lastTriggeredAt: null,
  }
}

const extractJsonObject = (text) => {
  const first = text.indexOf("{")
  const last = text.lastIndexOf("}")
  if (first === -1 || last === -1) return null
  try {
    return JSON.parse(text.slice(first, last + 1))
  } catch {
    return null
  }
}

const fallbackKotibaObject = (recognizedText) => ({
  intent: "chat",
  assistant_reply: recognizedText
    ? `Eshitdim: "${recognizedText}". Hozircha vazifa yaratilmadi, lekin matn saqlandi.`
    : "Matn olindi.",
  tasks: [],
})

function App() {
  const [tasks, setTasks] = React.useState(() =>
    safeJsonParse(localStorage.getItem(TASKS_STORAGE_KEY), [])
  )
  const [username, setUsername] = React.useState(() => localStorage.getItem("username") || "")
  const [draftUsername, setDraftUsername] = React.useState(
    () => localStorage.getItem("username") || ""
  )
  const [sttApiKeyInput, setSttApiKeyInput] = React.useState(
    () =>
      localStorage.getItem("uzbekvoice_api_key") ||
      import.meta.env.VITE_UZBEKVOICE_API_KEY ||
      ""
  )
  const [geminiApiKeyInput, setGeminiApiKeyInput] = React.useState(
    () =>
      localStorage.getItem("gemini_api_key") ||
      import.meta.env.VITE_GEMINI_API_KEY ||
      ""
  )
  const [isLight, setIsLight] = React.useState(() => {
    const savedTheme = localStorage.getItem("theme")
    return savedTheme ? savedTheme === "light" : true
  })
  const [isRecording, setIsRecording] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const [audioUrl, setAudioUrl] = React.useState(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [transcript, setTranscript] = React.useState("")
  const [geminiReply, setGeminiReply] = React.useState("")
  const [submitError, setSubmitError] = React.useState("")
  const [showSettings, setShowSettings] = React.useState(false)
  const [audioLevels, setAudioLevels] = React.useState(createEmptyLevels)
  const [notificationPermission, setNotificationPermission] = React.useState(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  )

  const mediaRecorderRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const chunksRef = React.useRef([])
  const recordAudioContextRef = React.useRef(null)
  const recordAnalyserRef = React.useRef(null)
  const previewAudioContextRef = React.useRef(null)
  const previewAnalyserRef = React.useRef(null)
  const animationFrameRef = React.useRef(null)
  const audioPreviewRef = React.useRef(null)
  const previewSourceRef = React.useRef(null)
  const spokenTaskIdsRef = React.useRef(new Set())

  const sttApiKey = sttApiKeyInput.trim()
  const geminiApiKey = geminiApiKeyInput.trim()

  const rebuildAudioUrl = React.useCallback(() => {
    if (chunksRef.current.length === 0) return

    setAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return URL.createObjectURL(new Blob(chunksRef.current, { type: "audio/webm" }))
    })
  }, [])

  const stopVisualizer = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setAudioLevels(createEmptyLevels())
  }, [])

  const startVisualizer = React.useCallback((analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const updateLevels = () => {
      analyser.getByteFrequencyData(dataArray)
      const step = Math.max(1, Math.floor(dataArray.length / barCount))
      const nextLevels = Array.from({ length: barCount }, (_, index) => {
        const value = dataArray[index * step] ?? 0
        return Math.max(10, Math.round((value / 255) * 64))
      })

      setAudioLevels(nextLevels)
      animationFrameRef.current = requestAnimationFrame(updateLevels)
    }

    updateLevels()
  }, [])

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const resetRecorder = React.useCallback(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause()
      audioPreviewRef.current.currentTime = 0
    }

    setIsRecording(false)
    setIsPaused(false)
    setIsPreviewPlaying(false)
    stopVisualizer()

    if (previewAudioContextRef.current) {
      previewAudioContextRef.current.close()
      previewAudioContextRef.current = null
    }
    if (recordAudioContextRef.current) {
      recordAudioContextRef.current.close()
      recordAudioContextRef.current = null
    }

    previewAnalyserRef.current = null
    recordAnalyserRef.current = null
    previewSourceRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []

    setAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return null
    })
    stopStream()
  }, [stopStream, stopVisualizer])

  const requestNotificationPermission = React.useCallback(async () => {
    if (typeof Notification === "undefined") {
      toast.error("Brauzer notificationni qo'llamaydi")
      return
    }
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
    if (permission === "granted") {
      toast.success("Notification yoqildi")
    } else {
      toast.error("Notification ruxsati berilmadi")
    }
  }, [])

  const speakText = React.useCallback((text) => {
    if (!("speechSynthesis" in window) || !text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "uz-UZ"
    utterance.rate = 1
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }, [])

  const persistTasks = React.useCallback((nextTasks) => {
    setTasks(nextTasks)
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(nextTasks))
  }, [])

  const startRecording = React.useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)
    const audioContext = new window.AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)

    chunksRef.current = []
    streamRef.current = stream
    mediaRecorderRef.current = mediaRecorder
    recordAudioContextRef.current = audioContext
    recordAnalyserRef.current = analyser
    setAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl)
      return null
    })
    setIsPreviewPlaying(false)

    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.85
    source.connect(analyser)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
        rebuildAudioUrl()
      }
    }

    mediaRecorder.onstop = () => {
      resetRecorder()
    }

    mediaRecorder.start()
    startVisualizer(recordAnalyserRef.current)
    setIsRecording(true)
    setIsPaused(false)
  }, [rebuildAudioUrl, resetRecorder, startVisualizer])

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
      return
    }
    resetRecorder()
  }, [resetRecorder])

  const togglePause = React.useCallback(() => {
    if (!mediaRecorderRef.current) return

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      mediaRecorderRef.current.requestData()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setAudioLevels(createEmptyLevels())
      setIsPaused(true)
      return
    }

    if (mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      if (recordAnalyserRef.current) startVisualizer(recordAnalyserRef.current)
      setIsPaused(false)
    }
  }, [startVisualizer])

  const togglePreviewPlayback = React.useCallback(() => {
    if (!audioPreviewRef.current || !audioUrl) return

    if (isPreviewPlaying) {
      audioPreviewRef.current.pause()
      audioPreviewRef.current.currentTime = 0
      setIsPreviewPlaying(false)
      stopVisualizer()
      return
    }

    if (!previewAudioContextRef.current) {
      const audioContext = new window.AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaElementSource(audioPreviewRef.current)

      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.85
      source.connect(analyser)
      analyser.connect(audioContext.destination)

      previewAudioContextRef.current = audioContext
      previewAnalyserRef.current = analyser
      previewSourceRef.current = source
    }

    if (previewAudioContextRef.current.state === "suspended") {
      previewAudioContextRef.current.resume()
    }
    if (previewAnalyserRef.current) startVisualizer(previewAnalyserRef.current)
    audioPreviewRef.current.play()
    setIsPreviewPlaying(true)
  }, [audioUrl, isPreviewPlaying, startVisualizer, stopVisualizer])

  const handleTaskAction = React.useCallback(
    (task) => {
      toast.info(task.title, {
        description: task.actionText || "Vazifani bajaring",
      })

      if (task.notifyInSite && notificationPermission === "granted") {
        new Notification(task.title, {
          body: task.actionText || task.note || "Eslatma vaqti keldi",
        })
      }

      if (
        task.notifyVoice &&
        document.visibilityState === "visible" &&
        !spokenTaskIdsRef.current.has(task.id)
      ) {
        speakText(`${task.title}. ${task.actionText || "Vazifani bajaring"}`)
        spokenTaskIdsRef.current.add(task.id)
      }
    },
    [notificationPermission, speakText]
  )

  const syncTaskSchedule = React.useCallback(
    (inputTasks) => {
      const now = Date.now()
      let changed = false

      const nextTasks = inputTasks
        .map((task) => {
          if (task.autoDeleteAt) {
            const deleteAt = new Date(task.autoDeleteAt).getTime()
            if (!Number.isNaN(deleteAt) && deleteAt <= now) {
              changed = true
              return null
            }
          }

          if (task.status !== "active" || !task.nextTriggerAt) return task

          const triggerAt = new Date(task.nextTriggerAt).getTime()
          if (Number.isNaN(triggerAt) || triggerAt > now) return task

          handleTaskAction(task)
          changed = true

          const repeatedDate = getRepeatedDate(task)
          if (repeatedDate) {
            spokenTaskIdsRef.current.delete(task.id)
            return {
              ...task,
              lastTriggeredAt: new Date().toISOString(),
              nextTriggerAt: repeatedDate,
            }
          }

          return {
            ...task,
            status: "done",
            lastTriggeredAt: new Date().toISOString(),
            nextTriggerAt: null,
          }
        })
        .filter(Boolean)

      if (changed) persistTasks(nextTasks)
    },
    [handleTaskAction, persistTasks]
  )

  const parseKotibaObject = React.useCallback((rawText, recognizedText) => {
    const parsed = extractJsonObject(rawText)
    return parsed || fallbackKotibaObject(recognizedText)
  }, [])

  const saveGeneratedTasks = React.useCallback(
    (generatedTasks) => {
      if (!Array.isArray(generatedTasks) || generatedTasks.length === 0) return
      const normalized = generatedTasks.map(normalizeTask)
      persistTasks([...(tasks || []), ...normalized])
      toast.success("Yangi vazifalar qo'shildi", {
        description: `${normalized.length} ta task saqlandi.`,
      })
    },
    [persistTasks, tasks]
  )

  const sendRecording = React.useCallback(async () => {
    if (!sttApiKey) {
      setSubmitError("UzbekVoice API key topilmadi")
      toast.error("STT API key topilmadi", {
        description: "Burger menu ichida UzbekVoice API key kiriting.",
      })
      return
    }

    if (chunksRef.current.length === 0) {
      setSubmitError("Yuborish uchun audio topilmadi")
      toast.error("Audio topilmadi", {
        description: "Avval qisqa yozuv olib keyin yuboring.",
      })
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError("")
      setTranscript("")
      setGeminiReply("")

      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause()
        audioPreviewRef.current.currentTime = 0
      }

      const formData = new FormData()
      const audioFile = new File(
        [new Blob(chunksRef.current, { type: "audio/webm" })],
        "recording.webm",
        { type: "audio/webm" }
      )

      formData.append("file", audioFile)
      formData.append("return_offsets", "false")
      formData.append("run_diarization", "false")
      formData.append("language", "uz")
      formData.append("blocking", "true")

      const response = await fetch("https://uzbekvoice.ai/api/v1/stt", {
        method: "POST",
        headers: { Authorization: sttApiKey },
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || data?.detail || "STT so'rovida xatolik")
      }

      const recognizedText = data?.result?.text || ""
      setTranscript(recognizedText)

      if (!geminiApiKey) {
        const fallback = fallbackKotibaObject(recognizedText)
        setGeminiReply(fallback.assistant_reply)
        resetRecorder()
        return
      }

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: "application/json",
            },
            contents: [
              {
                parts: [
                  {
                    text: `${KOTIBA_PROMPT}\n\nUser name: ${username || "Noma'lum"}\nCurrent time: ${new Date().toISOString()}\nUser speech:\n${recognizedText}`,
                  },
                ],
              },
            ],
          }),
        }
      )

      const geminiData = await geminiResponse.json()

      if (!geminiResponse.ok) {
        const geminiErrorMessage = geminiData?.error?.message || "Gemini so'rovida xatolik"
        if (geminiErrorMessage.toLowerCase().includes("quota")) {
          toast.error("Gemini limiti tugagan", {
            description: "Plan yoki billingni tekshiring, hozircha faqat transcript ko'rsatildi.",
          })
          setGeminiReply(fallbackKotibaObject(recognizedText).assistant_reply)
          resetRecorder()
          return
        }
        throw new Error(geminiErrorMessage)
      }

      const geminiText =
        geminiData?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || ""

      const kotibaObject = parseKotibaObject(geminiText, recognizedText)
      setGeminiReply(kotibaObject.assistant_reply || "")
      saveGeneratedTasks(kotibaObject.tasks || [])
      resetRecorder()
    } catch (error) {
      const message = error.message || "Audio yuborishda xatolik"
      setSubmitError(message)
      toast.error("So'rovda xatolik", {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [
    geminiApiKey,
    parseKotibaObject,
    resetRecorder,
    saveGeneratedTasks,
    sttApiKey,
    username,
  ])

  const saveSettings = React.useCallback(() => {
    const cleanName = draftUsername.trim()
    const cleanSttKey = sttApiKeyInput.trim()
    const cleanGeminiKey = geminiApiKeyInput.trim()

    localStorage.setItem("username", cleanName)
    localStorage.setItem("uzbekvoice_api_key", cleanSttKey)
    localStorage.setItem("gemini_api_key", cleanGeminiKey)

    setUsername(cleanName)
    setSttApiKeyInput(cleanSttKey)
    setGeminiApiKeyInput(cleanGeminiKey)
    toast.success("Sozlamalar saqlandi")
  }, [draftUsername, geminiApiKeyInput, sttApiKeyInput])

  const markTaskDone = React.useCallback(
    (taskId) => {
      persistTasks(
        tasks.map((task) =>
          task.id === taskId
            ? { ...task, status: "done", nextTriggerAt: null, lastTriggeredAt: new Date().toISOString() }
            : task
        )
      )
    },
    [persistTasks, tasks]
  )

  const deleteTask = React.useCallback(
    (taskId) => {
      persistTasks(tasks.filter((task) => task.id !== taskId))
    },
    [persistTasks, tasks]
  )

  const toggleTaskNotifications = React.useCallback(
    (taskId) => {
      persistTasks(
        tasks.map((task) =>
          task.id === taskId
            ? { ...task, notifyVoice: !task.notifyVoice, notifyInSite: !task.notifyInSite }
            : task
        )
      )
    },
    [persistTasks, tasks]
  )

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", !isLight)
    localStorage.setItem("theme", isLight ? "light" : "dark")
  }, [isLight])

  React.useEffect(() => {
    if (localStorage.getItem(PROMPT_STORAGE_KEY) !== KOTIBA_PROMPT) {
      localStorage.setItem(PROMPT_STORAGE_KEY, KOTIBA_PROMPT)
    }
  }, [])

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      syncTaskSchedule(tasks || [])
    }, 30000)
    syncTaskSchedule(tasks || [])
    return () => window.clearInterval(intervalId)
  }, [syncTaskSchedule, tasks])

  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      if (audioPreviewRef.current) audioPreviewRef.current.pause()
      if (previewAudioContextRef.current) previewAudioContextRef.current.close()
      if (recordAudioContextRef.current) recordAudioContextRef.current.close()
      previewAnalyserRef.current = null
      recordAnalyserRef.current = null
      resetRecorder()
    }
  }, [resetRecorder])

  const activeTasks = (tasks || []).filter((task) => task.status === "active")
  const doneTasks = (tasks || []).filter((task) => task.status === "done")

  const tasksList = (
    <div className="px-3 py-3 max-w-[1280px] w-full">
      <div className="rounded-[28px] border border-border/80 bg-background/80 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">Tasklar</span>
          <span className="text-xs text-muted-foreground">{tasks.length} ta</span>
        </div>
        <div className="space-y-1">
          {tasks.length === 0 && (
            <div className="py-4 text-sm text-muted-foreground">Hozircha task yo'q.</div>
          )}
          {tasks.map((task, index) => (
            <div key={task.id}>
              <div className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </div>
                  {task.note && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {task.note}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock3Icon className="size-3.5" />
                      {formatDateTime(task.scheduleAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <RepeatIcon className="size-3.5" />
                      {task.repeatType === "none" ? "Bir marta" : task.repeatType}
                    </span>
                    <span>{task.actionText}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                    {task.status === "active" && (
                      <Button variant="ghost" size="icon" onClick={() => markTaskDone(task.id)}>
                        <span className="text-[11px] font-medium">Done</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => toggleTaskNotifications(task.id)}>
                      {task.notifyVoice ? <BellIcon className="size-4.5" /> : <BellOffIcon className="size-4.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                    <Trash2Icon className="size-4.5" />
                  </Button>
                </div>
              </div>
              {index !== tasks.length - 1 && <div className="mx-3 border-b border-border/90" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="px-3 py-2 max-w-[1280px] w-full border-b border-b-[#0001] flex items-center justify-between rounded-bl-[20px] rounded-br-[20px] bg-background/95 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-[#fff4]">
          <div className="text-base font-medium tracking-[0.01em]">
            Kotiba<b className="font-semibold">AI</b>
          </div>
          <Button
            className="w-[36px] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98]"
            variant="ghost"
            onClick={() => setIsLight((current) => !current)}
          >
            {isLight ? <SunIcon className="size-6.5" /> : <MoonIcon className="size-6.5 rotate-270" />}
          </Button>
        </div>

        {showSettings && (
          <div className="px-3 pt-3 max-w-[1280px] w-full">
            <div className="rounded-3xl border border-[#0001] bg-background/90 p-4 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>Dark mode</span>
                <Button variant="outline" size="sm" onClick={() => setIsLight((current) => !current)}>
                  {isLight ? "Light" : "Dark"}
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span>Notifications</span>
                <Button variant="outline" size="sm" onClick={requestNotificationPermission}>
                  {notificationPermission === "granted" ? "Yoqilgan" : "Yoqish"}
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  <span className="mb-1 block">Ism</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2 outline-none transition-colors focus:border-foreground/30"
                    value={draftUsername}
                    onChange={(event) => setDraftUsername(event.target.value)}
                    placeholder="Ismingizni kiriting"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block">UzbekVoice API key</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2 outline-none transition-colors focus:border-foreground/30"
                    value={sttApiKeyInput}
                    onChange={(event) => setSttApiKeyInput(event.target.value)}
                    placeholder="stt api key"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block">Gemini API key</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-2 outline-none transition-colors focus:border-foreground/30"
                    value={geminiApiKeyInput}
                    onChange={(event) => setGeminiApiKeyInput(event.target.value)}
                    placeholder="gemini api key"
                  />
                </label>
                <Button className="w-full" onClick={saveSettings}>
                  Saqlash
                </Button>
              </div>
            </div>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="px-3 py-3 max-w-[1280px] w-full flex flex-col items-center my-6 text-center gap-2">
                  <span className="text-[22px] leading-none">
                    Assalomu alaykum <b className="font-[550]">{username || "Hojam"}</b>
                  </span>
                  <span className="leading-none">
                    KotibaAI nutqni eshitadi va topshiriqlarni eslatib turadi
                  </span>
                </div>

                {transcript && (
                  <div className="px-3 py-3 max-w-[1280px] w-full">
                    <div className="rounded-[28px] border border-border/80 bg-background/80 p-4 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] animate-in fade-in slide-in-from-bottom-2">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Transcript</div>
                      <div className="text-sm">{transcript}</div>
                    </div>
                  </div>
                )}

                {geminiReply && (
                  <div className="px-3 py-3 max-w-[1280px] w-full">
                    <div className="rounded-[28px] border border-border/80 bg-background/80 p-4 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] animate-in fade-in slide-in-from-bottom-2">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">KotibaAI</div>
                      <div className="text-sm">{geminiReply}</div>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="px-3 py-2 max-w-[1280px] w-full text-sm text-red-600">{submitError}</div>
                )}

                <div className="mx-3 px-3 max-w-[1280px] w-full flex justify-center mt-auto border-t rounded-tl-[40px] rounded-tr-[40px] border-[#eee] bg-background/90 px-4 py-4 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
                  <div className="flex w-full max-w-md flex-col items-center gap-4 ">
                    {isRecording && (
                      <div className="flex h-20 w-full items-end justify-center gap-1">
                        {audioLevels.map((level, index) => (
                          <div
                            key={index}
                            className={`w-2 rounded-full bg-primary/80 transition-[height,opacity,transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${isPaused ? "opacity-40" : "opacity-100"}`}
                            style={{
                              height: `${level}px`,
                              transform: `translateY(${Math.max(0, 64 - level) * 0.04}px)`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {audioUrl && (
                      <audio
                        ref={audioPreviewRef}
                        src={audioUrl}
                        onEnded={() => {
                          setIsPreviewPlaying(false)
                          stopVisualizer()
                          setAudioLevels(createEmptyLevels())
                        }}
                        className="hidden"
                      />
                    )}
                    <div className="flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                      {isRecording && (
                        <Button variant="outline" size="icon" aria-label="Cancel" onClick={stopRecording}>
                          <XIcon className="size-5" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        className="size-14 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03] active:scale-[0.97]"
                        aria-label={isPaused ? "Play chunk" : "Mic"}
                        onClick={isRecording ? (isPaused ? togglePreviewPlayback : stopRecording) : startRecording}
                        disabled={isSubmitting}
                      >
                        {isPaused ? <PlayIcon className="size-6 fill-current" /> : <MicIcon className="size-6" />}
                      </Button>
                      {isRecording && (
                        <Button
                          variant="secondary"
                          size="icon"
                          className="transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.03] active:scale-[0.97]"
                          aria-label={isPaused ? "Send" : "Pause"}
                          onClick={isPaused ? sendRecording : togglePause}
                          disabled={isSubmitting}
                        >
                          {isPaused ? <SendIcon className="size-5" /> : <PauseIcon className="size-5 fill-current" />}
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-center pt-1">
                      <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/95 p-1.5 shadow-sm backdrop-blur-sm">
                        <Button
                          variant={showSettings ? "secondary" : "ghost"}
                          size="icon"
                          className="rounded-full"
                          onClick={() => setShowSettings((current) => !current)}
                        >
                          <SlidersHorizontalIcon className="size-4.5" />
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="rounded-full">
                          <NavLink
                            to="/"
                            className={({ isActive }) =>
                              `flex size-9 items-center justify-center rounded-full transition-all duration-300 ${
                                isActive ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground"
                              }`
                            }
                          >
                            <MicIcon className="size-4.5" />
                          </NavLink>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="rounded-full">
                          <NavLink
                            to="/tasks"
                            className={({ isActive }) =>
                              `flex size-9 items-center justify-center rounded-full transition-all duration-300 ${
                                isActive ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground"
                              }`
                            }
                          >
                            <ListTodoIcon className="size-4.5" />
                          </NavLink>
                        </Button>
                      </div>
                    </div>
                    <div className="w-full text-center text-xs text-muted-foreground">
                      {isSubmitting
                        ? "KotibaAI audio, niyat va tasklarni tahlil qilmoqda..."
                        : "Gapiring, pause qiling va yuboring"}
                    </div>
                  </div>
                </div>
              </>
            }
          />
          <Route
            path="/tasks"
            element={
              <>
                <div className="px-3 py-4 max-w-[1280px] w-full text-center">
                  <div className="text-2xl font-medium">Tasklar ro'yxati</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    KotibaAI yaratgan barcha tasklar shu sahifada boshqariladi
                  </div>
                </div>
                {tasksList}
                <div className="px-3 max-w-[1280px] w-full flex justify-center mt-auto pb-4">
                  <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/90 p-1 shadow-sm backdrop-blur-sm">
                    <Button
                      variant={showSettings ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-full"
                      onClick={() => setShowSettings((current) => !current)}
                    >
                      <SlidersHorizontalIcon className="size-4.5" />
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                      <NavLink
                        to="/"
                        className={({ isActive }) =>
                          `flex size-9 items-center justify-center rounded-full transition-all duration-300 ${
                            isActive ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground"
                          }`
                        }
                      >
                        <MicIcon className="size-4.5" />
                      </NavLink>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                      <NavLink
                        to="/tasks"
                        className={({ isActive }) =>
                          `flex size-9 items-center justify-center rounded-full transition-all duration-300 ${
                            isActive ? "bg-secondary text-foreground shadow-sm" : "text-muted-foreground"
                          }`
                        }
                      >
                        <ListTodoIcon className="size-4.5" />
                      </NavLink>
                    </Button>
                  </div>
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
