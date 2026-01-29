'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';

interface ScriptLine {
  host: 'A' | 'B';
  text: string;
}

export default function AudioPlayer({ script }: { script: ScriptLine[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Implement Native Barge-In
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        if (isPlaying) {
          console.log("[Barge-In] User speech detected. Stopping AI...");
          setIsPlaying(false);
          synth?.cancel();
        }
      };
    }
  }, [isPlaying, synth]);

  useEffect(() => {
    if (isPlaying) {
      recognitionRef.current?.start();
      
      // Safety Timeout: Stop recognition after 10 seconds to preserve privacy/battery
      const timer = setTimeout(() => {
        console.log("[Barge-In] Safety timeout reached. Stopping recognition.");
        recognitionRef.current?.stop();
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      recognitionRef.current?.stop();
    }
  }, [isPlaying]);

  const playLine = useCallback((index: number) => {
    if (!synth || index >= script.length) {
      setIsPlaying(false);
      return;
    }

    const line = script[index];
    const utterance = new SpeechSynthesisUtterance(line.text);
    
    // Character Voices
    if (line.host === 'A') {
      utterance.pitch = 1.2;
      utterance.rate = 1.1;
    } else {
      utterance.pitch = 0.8;
      utterance.rate = 0.9;
    }

    utterance.onend = () => {
      if (index + 1 < script.length) {
        setCurrentIndex(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      setProgress((index / script.length) + (charIndex / line.text.length / script.length));
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [script, synth]);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        playLine(currentIndex);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      synth?.cancel();
    }
    return () => synth?.cancel();
  }, [isPlaying, currentIndex, playLine, synth]);

  // Waveform Visualizer
  useEffect(() => {
    if (!isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3b82f6';
      
      for (let i = 0; i < 50; i++) {
        const height = Math.random() * (isPlaying ? 30 : 5) + 2;
        ctx.fillRect(i * 6, 25 - height / 2, 4, height);
      }
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl w-full max-w-md shadow-2xl">
      <div className="flex items-center gap-4 mb-4">
        <canvas ref={canvasRef} width="300" height="50" className="flex-1 opacity-50" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{script[currentIndex]?.host === 'A' ? 'Nexus (Host)' : 'Skeptic (Guest)'}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300" 
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <button 
          onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); }}
          className="text-slate-400 hover:text-white transition"
        >
          <SkipForward className="rotate-180" />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-white text-black p-3 rounded-full hover:scale-110 transition active:scale-95"
        >
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>

        <button 
          onClick={() => { setCurrentIndex(Math.min(script.length - 1, currentIndex + 1)); }}
          className="text-slate-400 hover:text-white transition"
        >
          <SkipForward />
        </button>
      </div>
    </div>
  );
}
