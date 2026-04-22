import React, { useState, useEffect, useRef } from "react";
import socket from "../lib/socket";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PresenterModeProps {
  roomId: string;
  onBack: () => void;
}

const SLIDES = [
  { id: 1, title: "Bem-vindo ao PDS - IBCV", content: "Controle sua apresentação com facilidade." },
  { id: 2, title: "Conectividade Wi-Fi", content: "Apenas conecte na mesma rede e comece." },
  { id: 3, title: "Ponteiro Laser Virtual", content: "Aponte para detalhes importantes pelo celular." },
  { id: 4, title: "Cronômetro Integrado", content: "Mantenha o controle do seu tempo." },
  { id: 5, title: "Obrigado!", content: "IBCV - Igreja Batista Central de Vitória" },
];

export function PresenterMode({ roomId, onBack }: PresenterModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.emit("join-room", roomId);

    socket.on("slide-update", (command: string) => {
      if (command === "next") setCurrentSlide((prev) => Math.min(prev + 1, SLIDES.length - 1));
      if (command === "prev") setCurrentSlide((prev) => Math.max(prev - 1, 0));
    });

    socket.on("laser-update", (pos: { x: number; y: number }) => {
      setLaserPos(pos);
    });

    socket.on("timer-update", ({ timeLeft, isRunning }: { timeLeft: number; isRunning: boolean }) => {
      setTimeLeft(timeLeft);
      setIsRunning(isRunning);
    });

    return () => {
      socket.off("slide-update");
      socket.off("laser-update");
      socket.off("timer-update");
    };
  }, [roomId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const remoteUrl = `${window.location.origin}?room=${roomId}&mode=remote`;

  return (
    <div ref={containerRef} className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Header / Controls */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-50">
          <Button variant="ghost" className="text-white hover:bg-white/10" onClick={onBack}>
            <X className="mr-2 h-4 w-4" /> Sair
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-1 pr-4 rounded-xl">
              <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">PDS - IBCV</span>
                <span className="text-blue-400 font-bold font-mono tracking-widest">{roomId}</span>
              </div>
            </div>
            <Button variant="outline" className="border-zinc-800 text-white hover:bg-zinc-900" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Slide Content */}
      <div className="relative w-full h-full flex items-center justify-center p-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full max-w-5xl aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
              <motion.div 
                className="h-full bg-blue-500" 
                initial={{ width: 0 }}
                animate={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
              />
            </div>
            
            <h2 className="text-6xl font-bold mb-8 tracking-tight">{SLIDES[currentSlide].title}</h2>
            <p className="text-2xl text-zinc-400 max-w-2xl">{SLIDES[currentSlide].content}</p>
            
            <div className="absolute bottom-8 right-8 text-zinc-600 font-mono text-sm">
              {currentSlide + 1} / {SLIDES.length}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Laser Pointer */}
        <motion.div
          className="absolute w-4 h-4 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] pointer-events-none z-[100]"
          animate={{
            x: laserPos.x * (containerRef.current?.clientWidth || 0) - (containerRef.current?.clientWidth || 0) / 2,
            y: laserPos.y * (containerRef.current?.clientHeight || 0) - (containerRef.current?.clientHeight || 0) / 2,
            opacity: laserPos.x < 0 ? 0 : 1,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200, mass: 0.5 }}
        />
      </div>

      {/* Connection Info (Only if not fullscreen or at start) */}
      {!isFullscreen && currentSlide === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-12 left-12 bg-zinc-900/90 backdrop-blur-xl p-6 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-6"
        >
          <div className="bg-white p-2 rounded-lg">
            <QRCodeSVG value={remoteUrl} size={100} />
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">Conectar Controle</h3>
            <p className="text-zinc-400 text-sm mb-2">Escaneie o QR Code com seu celular</p>
            <div className="text-xs text-zinc-500 font-mono bg-black/50 p-2 rounded border border-zinc-800">
              {remoteUrl}
            </div>
          </div>
        </motion.div>
      )}

      {/* Timer Display */}
      <div className="absolute bottom-12 right-12 flex flex-col items-end">
        <div className={`text-4xl font-mono font-bold ${isRunning ? 'text-blue-400' : 'text-zinc-600'}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mt-1">
          Tempo de Apresentação
        </div>
      </div>

      {/* Manual Controls (Backup) */}
      {!isFullscreen && (
        <div className="absolute bottom-12 flex gap-4">
          <Button variant="outline" size="icon" className="rounded-full border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => setCurrentSlide(s => Math.max(0, s - 1))}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => setCurrentSlide(s => Math.min(SLIDES.length - 1, s + 1))}>
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
