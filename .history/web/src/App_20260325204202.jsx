import { Button } from "@/components/ui/button"
import { MenuIcon, MicIcon, MoonIcon, PauseIcon, SunIcon, XIcon } from "lucide-react"
import React from "react"
export default function App() {
  const barCount = 24;
  const [tasks,setTasks] = React.useState(JSON.parse(localStorage.getItem("tasks")));
  const [username,setUsername] = React.useState(localStorage.getItem("username"));
  const [isLight,setIsLight] = React.useState(localStorage.getItem("theme")=="light");
  const [isRecording, setIsRecording] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [audioLevels, setAudioLevels] = React.useState(Array.from({ length: barCount }, () => 10));
  const mediaRecorderRef = React.useRef(null);
  const streamRef = React.useRef(null);
  const chunksRef = React.useRef([]);
  const audioContextRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);

  const stopVisualizer = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevels(Array.from({ length: barCount }, () => 10));
  }, [barCount]);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = React.useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioContext = new window.AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);

    chunksRef.current = [];
    streamRef.current = stream;
    mediaRecorderRef.current = mediaRecorder;
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(dataArray.length / barCount));
      const nextLevels = Array.from({ length: barCount }, (_, index) => {
        const value = dataArray[index * step] ?? 0;
        return Math.max(10, Math.round((value / 255) * 64));
      });

      setAudioLevels(nextLevels);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      stopVisualizer();
      stopStream();
    };

    mediaRecorder.start();
    updateLevels();
    setIsRecording(true);
    setIsPaused(false);
  }, [barCount, stopStream, stopVisualizer]);

  const stopRecording = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      return;
    }

    setIsRecording(false);
    setIsPaused(false);
    stopVisualizer();
    stopStream();
  }, [stopStream, stopVisualizer]);

  const togglePause = React.useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
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
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        const updateLevels = () => {
          if (!analyserRef.current) return;

          analyserRef.current.getByteFrequencyData(dataArray);
          const step = Math.max(1, Math.floor(dataArray.length / barCount));
          const nextLevels = Array.from({ length: barCount }, (_, index) => {
            const value = dataArray[index * step] ?? 0;
            return Math.max(10, Math.round((value / 255) * 64));
          });

          setAudioLevels(nextLevels);
          animationFrameRef.current = requestAnimationFrame(updateLevels);
        };

        updateLevels();
      }
      setIsPaused(false);
    }
  }, [barCount]);

  React.useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      stopVisualizer();
      stopStream();
    };
  }, [stopStream, stopVisualizer]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
    <div className="px-3 py-3 max-w-[1280px] w-full border-b border-b-[#eee] flex justify-between">
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
    <div className="px-3 max-w-[1280px] w-full flex justify-center mt-auto flex w-full max-w-md flex-col items-center gap-4 border border-[#eee] bg-background/90 px-4 py-4 shadow-sm backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center gap-4 border border-[#eee] bg-background/90 px-4 py-4 shadow-sm backdrop-blur-sm">
        {isRecording&&<div className="flex h-20 w-full items-end justify-center gap-1">
          {audioLevels.map((level, index) => (
            <div
              key={index}
              className={`w-2 rounded-full bg-primary/80 transition-all duration-75 ${isPaused ? "opacity-40" : ""}`}
              style={{ height: `${level}px` }}
            />
          ))}
        </div>}
      <div className="flex items-center gap-3">
        {isRecording&&<Button variant="outline" size="icon" aria-label="Cancel" onClick={stopRecording}>
          <XIcon className="size-5" />
        </Button>}
        <Button size="icon" className="size-14 rounded-full" aria-label="Mic" onClick={isRecording?stopRecording:startRecording}>
          <MicIcon className="size-6" />
        </Button>
        {isRecording&&<Button variant="secondary" size="icon" aria-label="Pause" onClick={togglePause}>
          <PauseIcon className={`size-5 fill-current ${isPaused ? "opacity-60" : ""}`} />
        </Button>}
      </div>
      </div>
    </div>
    </div>
  )
}
