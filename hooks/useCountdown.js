import { useState, useRef, useCallback, useEffect } from 'react';

export function useCountdown(onComplete) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const start = useCallback((initialSeconds) => {
    // Limpia cualquier temporizador anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSecondsLeft(initialSeconds);
    setIsRunning(true);

    // Inicia el intervalo
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsRunning(false);
          if (typeof onComplete === 'function') {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onComplete]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsRunning(false);
    }
  }, []);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return { secondsLeft, start, stop, isRunning };
}
