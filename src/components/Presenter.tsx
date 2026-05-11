import { useEffect, useState, useRef, ChangeEvent } from "react";
import { io, Socket } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Monitor, Smartphone, Info, FileUp, Loader2 } from "lucide-react";
import { SlideEvent, LaserUpdate } from "../types";
import Logo from "./Logo";
import * as pdfjsLib from "pdfjs-dist";

// Basic PDF.js worker setup - using a CDN for the worker to avoid complex build setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface PresenterProps {
  presentationId: string;
}

interface SlideData {
  id: number | string;
  title?: string;
  content?: string;
  color?: string;
  image?: string; // For PDF pages
}

const DEFAULT_SLIDES: SlideData[] = [
  {
    id: 1,
    title: "Bem-vindo à Apresentação",
    content: "Este é o seu passador de slides inteligente.",
    color: "bg-blue-600"
  },
  {
    id: 2,
    title: "Como Funciona?",
    content: "Escaneie o QR Code com seu celular para começar a controlar.",
    color: "bg-purple-600"
  },
  {
    id: 3,
    title: "Tecnologia",
    content: "Desenvolvido com React, Express, Vite e Socket.io para baixa latência.",
    color: "bg-emerald-600"
  },
  {
    id: 4,
    title: "Recurso Laser",
    content: "Use o laser virtual arrastando o dedo na tela do seu celular.",
    color: "bg-rose-600"
  }
];

export default function PresenterView({ presentationId }: PresenterProps) {
  const [slides, setSlides] = useState<SlideData[]>(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [laserPos, setLaserPos] = useState<LaserUpdate | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Configura o socket para usar apenas websockets, o que é mais estável em proxies
    const s = io({
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });
    setSocket(s);

    s.on("connect", () => {
      console.log("Presenter connected to socket server");
      s.emit("join-presentation", presentationId);
    });

    s.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
    });

    s.on("slide-action", (data: SlideEvent) => {
      if (data.action === "next") {
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
      } else if (data.action === "prev") {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    });

    s.on("laser-move", (data: LaserUpdate) => {
      setLaserPos(data);
    });

    return () => {
      s.disconnect();
    };
  }, [presentationId, slides.length]); // Re-bind if slides length changes

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    setIsProcessing(true);
    setSlides([]);
    setCurrentSlide(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const newSlides: SlideData[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // High quality
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          newSlides.push({
            id: `pdf-${i}`,
            image: canvas.toDataURL("image/jpeg", 0.8)
          });
        }
      }

      setSlides(newSlides);
      setShowConfig(false);
    } catch (err) {
      console.error("Error processing PDF:", err);
      alert("Erro ao processar o PDF. Tente um arquivo menor ou mais simples.");
      setSlides(DEFAULT_SLIDES);
    } finally {
      setIsProcessing(false);
    }
  };

  const remoteUrl = `${window.location.origin}?role=remote&id=${presentationId}`;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900" ref={containerRef}>
      {/* Slide Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-white"
            >
              <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
              <p className="text-lg font-medium">Processando seu PDF...</p>
            </motion.div>
          ) : (
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`w-full h-full flex flex-col items-center justify-center text-center text-white ${!slides[currentSlide]?.image ? slides[currentSlide]?.color : 'bg-black'}`}
            >
              {slides[currentSlide]?.image ? (
                <img 
                  src={slides[currentSlide].image} 
                  alt={`Slide ${currentSlide + 1}`} 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="p-12">
                  <h1 className="text-6xl font-bold mb-8 tracking-tight">{slides[currentSlide]?.title}</h1>
                  <p className="text-2xl opacity-90 max-w-2xl leading-relaxed">{slides[currentSlide]?.content}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Laser Pointer */}
      {laserPos?.active && containerRef.current && (
        <div
          className="absolute w-8 h-8 pointer-events-none z-50 transition-all duration-75"
          style={{
            left: `${laserPos.x * 100}%`,
            top: `${laserPos.y * 100}%`,
            transform: "translate(-50%, -50%)"
          }}
        >
          <div className="w-full h-full rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-red-400 scale-150 opacity-20 blur-sm" />
        </div>
      )}

      {/* Header / Brand */}
      <div className="absolute top-8 left-0 right-0 flex flex-col items-center justify-center z-40 pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-3"
        >
          <motion.div 
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8] 
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 overflow-hidden shadow-2xl backdrop-blur-sm"
          >
            <Logo size={48} />
          </motion.div>
          
          <div className="text-center">
            <motion.h1 
              animate={{ 
                letterSpacing: ["0.1em", "0.2em", "0.1em"],
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="text-white font-black tracking-[0.2em] text-2xl drop-shadow-lg"
            >
              PDS-IBCV
            </motion.h1>
            <div className="flex items-center justify-center gap-2 mt-1 text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              LIVE SESSION: {presentationId}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Connection Info Overlay */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 right-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl z-40 max-w-xs"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Controle Remoto
              </h2>
              <button 
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-white transition-colors"
                id="close-config"
              >
                ×
              </button>
            </div>
            <div className="bg-white p-3 rounded-lg flex items-center justify-center mb-4">
              <QRCodeSVG value={remoteUrl} size={150} />
            </div>
            <p className="text-xs text-slate-300 text-center mb-4">
              Escaneie o código para transformar seu celular em um passador de slides.
            </p>
            <div className="w-full h-px bg-white/10 mb-4" />
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest text-center">Ou apresente seu próprio PDF</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                id="upload-pdf-btn"
              >
                <FileUp className="w-4 h-4" />
                UPLOAD PDF
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="application/pdf" 
                className="hidden" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          disabled={currentSlide === 0}
          id="prev-slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-sm font-medium min-w-[3rem] text-center">
          {currentSlide + 1} / {slides.length}
        </span>
        <button
          onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          disabled={currentSlide === slides.length - 1}
          id="next-slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <div className="w-px h-6 bg-white/20" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Upload PDF"
          id="bar-upload"
        >
          <FileUp className="w-5 h-5 text-rose-400" />
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-2 rounded-full transition-colors ${showConfig ? 'bg-white/20' : 'hover:bg-white/10'}`}
          id="toggle-config"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
