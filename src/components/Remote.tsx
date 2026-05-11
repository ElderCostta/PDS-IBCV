import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, useAnimation } from "motion/react";
import { ChevronLeft, ChevronRight, Zap, Target, MousePointer2, Smartphone } from "lucide-react";
import { SlideEvent, LaserUpdate } from "../types";
import Logo from "./Logo";

interface RemoteProps {
  presentationId: string;
}

export default function RemoteView({ presentationId }: RemoteProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const padRef = useRef<HTMLDivElement>(null);
  const laserControls = useAnimation();

  useEffect(() => {
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'], // Prioritize websocket for low latency
      reconnection: true,
      reconnectionAttempts: 20,
      timeout: 10000
    });
    setSocket(s);

    s.on("connect", () => {
      console.log("Remote connected to socket server");
      setIsConnected(true);
      s.emit("join-presentation", presentationId);
    });

    s.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setIsConnected(false);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      s.disconnect();
    };
  }, [presentationId]);

  const handleSlideAction = (action: "next" | "prev") => {
    if (!socket) return;
    
    // Feedback
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }

    socket.emit("slide-action", {
      action,
      presentationId
    } as SlideEvent);
  };

  const lastLaserEmit = useRef<number>(0);
  const LASER_THROTTLE_MS = 25; // ~40 FPS for smooth laser

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!socket || !padRef.current) return;

    const now = Date.now();
    if (now - lastLaserEmit.current < LASER_THROTTLE_MS) return;
    lastLaserEmit.current = now;

    const rect = padRef.current.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    socket.emit("laser-move", {
      x,
      y,
      active: true,
      presentationId
    } as LaserUpdate);
  };

  const stopPointer = () => {
    if (!socket) return;
    socket.emit("laser-move", {
      x: 0.5,
      y: 0.5,
      active: false,
      presentationId
    } as LaserUpdate);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen p-6 bg-slate-950 select-none overflow-hidden touch-none">
      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div 
            animate={{ 
              y: [0, -4, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden shrink-0 relative shadow-xl"
          >
            <Logo size={56} />
          </motion.div>
          
          <div className="text-center">
            <motion.h1 
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl font-black text-white tracking-[0.15em]"
            >
              PDS-IBCV
            </motion.h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 animate-pulse'}`} />
              <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                {isConnected ? 'Sincronizado' : 'Conectando...'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Controls Grid */}
      <div className="flex-1 grid grid-rows-2 gap-4">
        {/* Next/Prev Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(255,255,255,0.1)" }}
            onClick={() => handleSlideAction("prev")}
            className="flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-white/5 text-slate-300"
            id="remote-prev"
          >
            <ChevronLeft className="w-12 h-12 mb-2" />
            <span className="text-xs font-semibold uppercase tracking-widest opacity-50">Anterior</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95, backgroundColor: "rgba(255,255,255,0.1)" }}
            onClick={() => handleSlideAction("next")}
            className="flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 text-white"
            id="remote-next"
          >
            <ChevronRight className="w-12 h-12 mb-2" />
            <span className="text-xs font-semibold uppercase tracking-widest">Próximo</span>
          </motion.button>
        </div>

        {/* Laser Touchpad Area */}
        <div className="relative group">
          <div className="absolute -top-6 left-0 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Target className="w-3 h-3" />
            Touchpad Laser
          </div>
          
          <div
            ref={padRef}
            onTouchMove={handlePointerMove}
            onTouchEnd={stopPointer}
            onMouseMove={(e) => e.buttons === 1 && handlePointerMove(e)}
            onMouseUp={stopPointer}
            className="w-full h-full bg-slate-900 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center relative active:border-rose-500/50 transition-colors cursor-crosshair"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none rounded-3xl" />
            
            <MousePointer2 className="w-10 h-10 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500 text-center px-8 uppercase tracking-widest font-bold">
              Arraste para apontar o laser
            </p>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center gap-4 text-slate-600">
          <Zap className="w-4 h-4" />
          <span className="text-[10px] font-mono tracking-tighter">LOW LATENCY SYNC ENABLED</span>
        </div>
      </div>
    </div>
  );
}
