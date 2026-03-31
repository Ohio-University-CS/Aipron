import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionType = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = { error: string };

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionType) | null {
  if (typeof globalThis === "undefined") return null;
  const g = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionType;
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
  };
  return g.SpeechRecognition || g.webkitSpeechRecognition || null;
}

export function useWebSpeechToText() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recRef = useRef<SpeechRecognitionType | null>(null);

  useEffect(() => {
    setSupported(!!getSpeechRecognitionCtor());
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
      recRef.current = null;
    };
  }, []);

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    recRef.current = null;
    setListening(false);
  }, []);

  const startListening = useCallback(
    (onTranscript: (text: string, isFinal: boolean) => void) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor || recRef.current) return;

      const rec = new Ctor();
      rec.lang = "en-US";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onresult = (event: SpeechRecognitionResultEvent) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          const t = r[0]?.transcript ?? "";
          if (r.isFinal) finalText += t;
          else interim += t;
        }
        if (finalText) onTranscript(finalText.trim(), true);
        else if (interim) onTranscript(interim, false);
      };

      rec.onerror = () => {
        setListening(false);
        recRef.current = null;
      };

      rec.onend = () => {
        setListening(false);
        recRef.current = null;
      };

      recRef.current = rec;
      setListening(true);
      try {
        rec.start();
      } catch {
        setListening(false);
        recRef.current = null;
      }
    },
    []
  );

  return { supported, listening, startListening, stopListening };
}
