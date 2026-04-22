import React, { useState, useEffect, useRef } from "react";
import socket from "../lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, MousePointer2, Timer, X } from "lucide-react";
import { motion } from "motion/react";

interface RemoteModeProps {
  onBack: () => void;
}

export function RemoteMode({ onBack }: RemoteModeProps) {
  const [roomId, setRoomId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const touchpadRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check URL for room ID
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get("room");
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
      handleConnect(roomFromUrl);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleConnect = (id: string = roomId) => {
    if (!id) return;
    socket.emit("join-room", id);
    setIsConnected(true);
  };

  const sendCommand = (command: string) => {
    socket.emit("slide-command", { roomId, command });
  };

  const handleTouchpad = (e: React.TouchEvent | React.MouseEvent) => {
    if (!touchpadRef.current) return;
    const rect = touchpadRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    socket.emit("laser-move", { roomId, position: { x, y } });
  };

  const stopLaser = () => {
    socket.emit("laser-move", { roomId, position: { x: -100, y: -100 } });
  };

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    setIsRunning(newIsRunning);
    socket.emit("timer-sync", { roomId, timeLeft, isRunning: newIsRunning });
  };

  const resetTimer = () => {
    setTimeLeft(0);
    setIsRunning(false);
    socket.emit("timer-sync", { roomId, timeLeft: 0, isRunning: false });
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const next = prev + 1;
          socket.emit("timer-sync", { roomId, timeLeft: next, isRunning: true });
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, roomId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0a]">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <X className="w-5 h-5 text-zinc-500 cursor-pointer" onClick={onBack} />
              Conectar ao Slide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-zinc-400 text-sm">Insira o código exibido na tela do computador para começar o controle.</p>
            <Input
              placeholder="CÓDIGO (Ex: AB12CD)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="bg-black border-zinc-800 text-white text-center text-2xl font-mono tracking-widest h-16 uppercase"
            />
            <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg font-bold" onClick={() => handleConnect()}>
              Conectar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col p-4 select-none touch-none">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" size="icon" className="text-zinc-500" onClick={onBack}>
          <X className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest leading-none">Controle Ativo</span>
            <span className="text-blue-400 font-mono font-bold leading-tight">{roomId}</span>
          </div>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Timer Section */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isRunning ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
              <Timer className="w-5 h-5" />
            </div>
            <span className={`text-3xl font-mono font-bold ${isRunning ? 'text-white' : 'text-zinc-500'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full border-zinc-800 bg-zinc-800 text-white" onClick={resetTimer}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button 
              className={`rounded-full w-12 h-12 ${isRunning ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} 
              onClick={toggleTimer}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6 flex-1 max-h-[200px]">
        <Button 
          variant="outline" 
          className="h-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white flex flex-col gap-2 active:scale-95 transition-transform"
          onClick={() => sendCommand("prev")}
        >
          <ChevronLeft className="w-8 h-8" />
          <span className="text-xs uppercase font-bold tracking-widest opacity-50">Anterior</span>
        </Button>
        <Button 
          className="h-full bg-blue-600 hover:bg-blue-700 text-white flex flex-col gap-2 active:scale-95 transition-transform"
          onClick={() => sendCommand("next")}
        >
          <ChevronRight className="w-8 h-8" />
          <span className="text-xs uppercase font-bold tracking-widest opacity-80">Próximo</span>
        </Button>
      </div>

      {/* Laser Touchpad */}
      <div className="flex-1 flex flex-col min-h-[250px]">
        <div className="flex items-center gap-2 mb-2 px-2">
          <MousePointer2 className="w-4 h-4 text-red-500" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Ponteiro Laser Virtual</span>
        </div>
        <div 
          ref={touchpadRef}
          className="flex-1 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-3xl relative overflow-hidden active:border-red-500/50 transition-colors"
          onTouchMove={handleTouchpad}
          onTouchStart={handleTouchpad}
          onTouchEnd={stopLaser}
          onMouseMove={(e) => e.buttons === 1 && handleTouchpad(e)}
          onMouseDown={handleTouchpad}
          onMouseUp={stopLaser}
          onMouseLeave={stopLaser}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-full h-px bg-white" />
            <div className="h-full w-px bg-white absolute" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs font-bold uppercase tracking-[0.3em] pointer-events-none">
            Touchpad Laser
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">
        PDS - IBCV v1.0
      </p>
    </div>
  );
}
