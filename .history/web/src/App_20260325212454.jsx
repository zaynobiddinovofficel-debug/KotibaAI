import { Button } from "@/components/ui/button"
import { MenuIcon, MicIcon, MoonIcon, PauseIcon, PlayIcon, SendIcon, SunIcon, XIcon } from "lucide-react"
import React from "react"
export default function App() {
  const barCount = 24;
  const sttApiKey = import.meta.env.VITE_UZBEKVOICE_API_KEY;
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const [tasks,setTasks] = React.useState(JSON.parse(localStorage.getItem("tasks")));
  const [username,setUsername] = React.useState(localStorage.getItem("username"));
  const [isLight,setIsLight] = React.useState(localStorage.getItem("theme")=="light");
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [geminiReply, setGeminiReply] = React.useState("");
  const [submitError, setSubmitError] = React.useState("");
  const [audioLevels, setAudioLevels] = React.useState(Array.from({ length: barCount }, () => 10));
  const mediaRecorderRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const recordAudioContextRef = React.useRef(null);
  const recordAnalyserRef = React.useRef(null);
  const previewAudioContextRef = React.useRef(null);
  const previewAnalyserRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const audioPreviewRef = React.useRef(null);
  const previewSourceRef = React.useRef(null);

  const rebuildAudioUrl = React.useCallback(() => {
    if (chunksRef.current.length === 0) return;

    setAudioUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return URL.createObjectURL(new Blob(chunksRef.current, { type: "audio/webm" }));
    });
  }, []);

  const stopVisualizer = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevels(Array.from({ length: barCount }, () => 10));
  }, [barCount]);

  const startVisualizer = React.useCallback((analyser) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(dataArray.length / barCount));
      const nextLevels = Array.from({ length: barCount }, (_, index) => {
        const value = dataArray[index * step] ?? 0;
        return Math.max(10, Math.round((value / 255) * 64));
      });

      setAudioLevels(nextLevels);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();
  }, [barCount]);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetRecorder = React.useCallback(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }

    setIsRecording(false);
    setIsPaused(false);
    setIsPreviewPlaying(false);
    stopVisualizer();

    if (previewAudioContextRef.current) {
      previewAudioContextRef.current.close();
      previewAudioContextRef.current = null;
    }
    if (recordAudioContextRef.current) {
      recordAudioContextRef.current.close();
      recordAudioContextRef.current = null;
    }

    previewAnalyserRef.current = null;
    recordAnalyserRef.current = null;
    previewSourceRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    setAudioUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
    stopStream();
  }, [stopStream, stopVisualizer]);

  const startRecording = React.useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    chunksRef.current = [];
    streamRef.current = stream;
    mediaRecorderRef.current = mediaRecorder;
    recordAudioContextRef.current = audioContext;
    recordAnalyserRef.current = analyser;
    setAudioUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
    setIsPreviewPlaying(false);

    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
        rebuildAudioUrl();
      }
    };

    mediaRecorder.onstop = () => {
      resetRecorder();
    };

    mediaRecorder.start();
    startVisualizer(recordAnalyserRef.current);
    setIsRecording(true);
    setIsPaused(false);
  }, [rebuildAudioUrl, resetRecorder, startVisualizer]);

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      return;
    }

    resetRecorder();
  }, [resetRecorder]);

  const togglePause = React.useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
      mediaRecorderRef.current.requestData();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevels(Array.from({ length: barCount }, () => 10));
      setIsPaused(true);
      return;
    }

    if (mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
      if (recordAnalyserRef.current) {
        startVisualizer(recordAnalyserRef.current);
      }
      setIsPaused(false);
    }
  }, [barCount, startVisualizer]);

  const togglePreviewPlayback = React.useCallback(() => {
    if (!audioPreviewRef.current || !audioUrl) return;

    if (isPreviewPlaying) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
      setIsPreviewPlaying(false);
      stopVisualizer();
      return;
    }

    if (!previewAudioContextRef.current) {
      const audioContext = new window.AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audioPreviewRef.current);

      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      previewAudioContextRef.current = audioContext;
      previewAnalyserRef.current = analyser;
      previewSourceRef.current = source;
    }

    if (previewAudioContextRef.current.state === "suspended") {
      previewAudioContextRef.current.resume();
    }
    if (previewAnalyserRef.current) {
      startVisualizer(previewAnalyserRef.current);
    }
    audioPreviewRef.current.play();
    setIsPreviewPlaying(true);
  }, [audioUrl, isPreviewPlaying, startVisualizer, stopVisualizer]);

  const sendRecording = React.useCallback(async () => {
    if (!sttApiKey) {
      setSubmitError("VITE_UZBEKVOICE_API_KEY envga qo'yilmagan");
      return;
    }

    if (chunksRef.current.length === 0) {
      setSubmitError("Yuborish uchun audio topilmadi");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      setTranscript("");
      setGeminiReply("");

      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }

      const formData = new FormData();
      const audioFile = new File([new Blob(chunksRef.current, { type: "audio/webm" })], "recording.webm", {
        type: "audio/webm",
      });

      formData.append("file", audioFile);
      formData.append("return_offsets", "false");
      formData.append("run_diarization", "false");
      formData.append("language", "uz");
      formData.append("blocking", "true");

      const response = await fetch("https://uzbekvoice.ai/api/v1/stt", {
        method: "POST",
        headers: {
          Authorization: sttApiKey,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || data?.detail || "STT so'rovida xatolik");
      }

      const recognizedText = data?.result?.text || "";
      setTranscript(recognizedText);

      if (!geminiApiKey) {
        throw new Error("VITE_GEMINI_API_KEY envga qo'yilmagan");
      }

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Siz Uzbek tilida ishlaydigan yordamchisiz. Foydalanuvchi nutqidan olingan matnni tahlil qiling, uning niyati va so'rovini qisqa aniqlang, keyin foydalanuvchiga foydali, aniq va qisqa javob yozing. Javobni faqat oddiy matn ko'rinishida qaytaring.\n\nNutq matni:\n${recognizedText}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const geminiData = await geminiResponse.json();

      if (!geminiResponse.ok) {
        throw new Error(
          geminiData?.error?.message || "Gemini so'rovida xatolik"
        );
      }

      const geminiText =
        geminiData?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";

      setGeminiReply(geminiText);
      resetRecorder();
    } catch (error) {
      setSubmitError(error.message || "Audio yuborishda xatolik");
    } finally {
      setIsSubmitting(false);
    }
  }, [resetRecorder, sttApiKey]);

  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      if (previewAudioContextRef.current) {
        previewAudioContextRef.current.close();
        previewAudioContextRef.current = null;
      }
      if (recordAudioContextRef.current) {
        recordAudioContextRef.current.close();
        recordAudioContextRef.current = null;
      }
      previewAnalyserRef.current = null;
      recordAnalyserRef.current = null;
      resetRecorder();
    };
  }, [resetRecorder]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
    <div className="px-3 py-3 max-w-[1280px] w-full border-b border-b-[#eee] flex justify-between rounded-bl-[20px] rounded-br-[20px]">
      <Button className={`w-[36px]`} variant={'ghost'}>
        <MenuIcon className="size-6.5" />
      </Button>
      <Button className={`w-[36px]`} variant={'ghost'}>
        {isLight?<SunIcon className="size-6.5" />:<MoonIcon className="size-6.5 rotate-270" />}
      </Button>
    </div>
    {(tasks==null||tasks.length==0)&&
    <div className="px-3 py-3 max-w-[1280px] w-full flex flex-col items-center my-6 text-center gap-2">
    <span className="text-[22px] leading-none">Assalomu alaykum <b className="font-[550]">
      {username==null?"Hojam":username}
    </b></span>
    <span className="leading-none">Hozircha topshiriqlar mavjud emas</span>  
    </div>}
    {transcript&&<div className="px-3 py-3 max-w-[1280px] w-full">
      <div className="text-sm">{transcript}</div>
    </div>}
    {geminiReply&&<div className="px-3 py-3 max-w-[1280px] w-full">
      <div className="text-sm">{geminiReply}</div>
    </div>}
    {submitError&&<div className="px-3 py-2 max-w-[1280px] w-full text-sm text-red-600">{submitError}</div>}
    <div className="px-3 max-w-[1280px] w-full flex justify-center mt-auto border-t rounded-tl-full rounded-tr-full border-[#eee] bg-background/90 px-4 py-4 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center gap-4 ">
        {isRecording&&<div className="flex h-20 w-full items-end justify-center gap-1">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className={`w-2 rounded-full bg-primary/80 transition-all duration-75 ${isPaused ? "opacity-40" : ""}`}
              style={{ height: `${level}px` }}
            />
          ))}
        </div>}
        {audioUrl&&<audio
          ref={audioPreviewRef}
          src={audioUrl}
          onEnded={() => {
            setIsPreviewPlaying(false);
            stopVisualizer();
            setAudioLevels(Array.from({ length: barCount }, () => 10));
          }}
          className="hidden"
        />}
      <div className="flex items-center gap-3" >
        {isRecording&&<Button variant="outline" size="icon" aria-label="Cancel" onClick={stopRecording}>
          <XIcon className="size-5" />
        </Button>}
        <Button
          size="icon"
          className="size-14 rounded-full"
          aria-label={isPaused ? "Play chunk" : "Mic"}
          onClick={isRecording ? (isPaused ? togglePreviewPlayback : stopRecording) : startRecording}
          disabled={isSubmitting}
        >
          {isPaused ? <PlayIcon className="size-6 fill-current" /> : <MicIcon className="size-6" />}
        </Button>
        {isRecording&&<Button
          variant="secondary"
          size="icon"
          aria-label={isPaused ? "Send" : "Pause"}
          onClick={isPaused ? sendRecording : togglePause}
          disabled={isSubmitting}
        >
          {isPaused ? <SendIcon className="size-5" /> : <PauseIcon className="size-5 fill-current" />}
        </Button>}
      </div>
      </div>
    </div>
    </div>
  )
}
