import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

export function CookingTimer() {
  const [time, setTime] = useState(600);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("10");

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning && time > 0) {
      interval = window.setInterval(() => {
        setTime((t) => t - 1);
      }, 1000);
    } else if (time === 0) {
      setIsRunning(false);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [isRunning, time]);

  const resetTimer = () => {
    setIsRunning(false);
    setTime((parseInt(inputMinutes, 10) || 10) * 60);
  };

  const handleMinutesChange = (value: string) => {
    setInputMinutes(value);
    if (!isRunning) {
      setTime((parseInt(value, 10) || 0) * 60);
    }
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const totalSeconds = (parseInt(inputMinutes, 10) || 10) * 60;
  const progress =
    totalSeconds > 0 ? ((totalSeconds - time) / totalSeconds) * 100 : 100;

  return (
    <div className="rounded-xl bg-gradient-to-br from-red-500 to-orange-500 p-4 text-white shadow-xl">
      <div className="mb-3 flex items-center gap-2">
        <Timer className="h-5 w-5" />
        <h3 className="text-base font-bold">Cooking Timer</h3>
      </div>
      <div className="mb-4 text-center">
        <div className="mb-2 text-5xl font-bold tabular-nums">
          {String(minutes).padStart(2, "0")}:
          {String(seconds).padStart(2, "0")}
        </div>
        {!isRunning && (
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              value={inputMinutes}
              onChange={(event) => handleMinutesChange(event.target.value)}
              className="w-14 rounded-lg bg-white/20 px-2 py-1 text-center text-sm text-white outline-none ring-0 focus:ring-2 focus:ring-white/50"
              min={1}
              max={60}
            />
            <span className="text-xs opacity-75">minutes</span>
          </div>
        )}
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-white transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((running) => !running)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/20 py-2 text-sm font-semibold transition-colors hover:bg-white/30"
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="rounded-lg bg-white/20 px-3 py-2 transition-colors hover:bg-white/30"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

