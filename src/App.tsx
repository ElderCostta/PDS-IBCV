import React, { useState, useEffect } from "react";
import { PresenterMode } from "./components/PresenterMode";
import { RemoteMode } from "./components/RemoteMode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Presentation, Smartphone, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type View = "home" | "presenter" | "remote";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [roomId, setRoomId] = useState("");

  // Auto-generate a room ID if none exists
  useEffect(() => {
    if (!roomId) {
      const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomId(newId);
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      <AnimatePresence mode="wait">
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen p-6"
          >
            <div className="mb-12 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-indigo-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 overflow-hidden group">
                {/* Logo - Usando logo.jpg conforme anexado */}
                <img 
                  src="/logo.jpg" 
                  alt="Logo IBCV" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback se a imagem não existir
                    e.currentTarget.src = "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/tree-palm.svg";
                    e.currentTarget.classList.add("invert", "p-6");
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <h1 className="text-5xl font-bold tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                PDS - IBCV
              </h1>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Controle suas apresentações de forma remota e profissional.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group overflow-hidden relative" onClick={() => setView("presenter")}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Presentation className="text-blue-400 w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl text-white">Modo Apresentador</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Abra no computador que exibirá os slides.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none">
                    Iniciar Apresentação
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer group overflow-hidden relative" onClick={() => setView("remote")}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Smartphone className="text-indigo-400 w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl text-white">Modo Controle</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Abra no celular para controlar os slides.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-white">
                    Conectar Celular
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 flex items-center gap-2 text-zinc-500 text-sm">
              <Wifi className="w-4 h-4" />
              <span>Certifique-se de estar na mesma rede Wi-Fi</span>
            </div>
          </motion.div>
        )}

        {view === "presenter" && (
          <PresenterMode roomId={roomId} onBack={() => setView("home")} />
        )}

        {view === "remote" && (
          <RemoteMode onBack={() => setView("home")} />
        )}
      </AnimatePresence>
    </div>
  );
}
