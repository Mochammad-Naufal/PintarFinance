"use client";

import { useEffect, useRef, useState } from "react";

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  lang = "id-ID",
  onResult,
  onError,
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
      setTranscript("");
      setInterimTranscript("");
    };

    recognition.onresult = (event: any) => {
      let finalTxt = "";
      let interimTxt = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTxt += item[0].transcript;
        } else {
          interimTxt += item[0].transcript;
        }
      }

      if (finalTxt) {
        setTranscript(finalTxt);
        setInterimTranscript("");
        onResult?.(finalTxt, true);
      } else if (interimTxt) {
        setInterimTranscript(interimTxt);
        onResult?.(interimTxt, false);
      }
    };

    recognition.onerror = (event: any) => {
      let err = "Terjadi kesalahan pada mikrofon.";
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        err = "Izin akses mikrofon ditolak oleh browser.";
      } else if (event.error === "no-speech") {
        err = "Tidak ada suara yang terdeteksi. Silakan coba lagi.";
      } else if (event.error === "network") {
        err = "Membutuhkan koneksi internet untuk Speech Recognition.";
      }

      setErrorMessage(err);
      setIsListening(false);
      onError?.(err);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, [lang, onResult, onError]);

  const startListening = () => {
    if (!isSupported) {
      const msg = "Browser Anda belum mendukung Web Speech Recognition.";
      setErrorMessage(msg);
      onError?.(msg);
      return;
    }

    setErrorMessage(null);
    setTranscript("");
    setInterimTranscript("");

    try {
      recognitionRef.current?.start();
    } catch {
      try {
        recognitionRef.current?.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      } catch {
        // ignore
      }
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
  };
}
