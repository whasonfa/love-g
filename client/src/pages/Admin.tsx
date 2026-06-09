import React, { useCallback, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Link2, Trash2, Upload, X, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon, Database, Clock } from "lucide-react";
import { usePhotos } from "@/hooks/usePhotos";
import type { Photo } from "@/lib/types";

// ─── PIN de acceso (cámbialo por el tuyo) ────────────────────────
const ADMIN_PIN = "16-06-26";
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_TIME_MS = 5 * 60 * 1000; // 5 minutos
// ─────────────────────────────────────────────────────────────────

type Tab = "upload" | "url" | "list";

export default function Admin() {
  const [pinInput,    setPinInput]    = useState("");
  const [authed,      setAuthed]      = useState(false);
  const [pinError,    setPinError]    = useState(false);
  const [activeTab,   setActiveTab]   = useState<Tab>("upload");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const { photos, loading, uploading, uploadFile, addByUrl, deletePhoto, resetToDefaults, usingSupabase } = usePhotos();

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockedUntil) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setRemainingTime(0);
      } else {
        setRemainingTime(Math.ceil((lockedUntil - now) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handlePin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (lockedUntil && Date.now() < lockedUntil) {
      setPinError(true);
      return;
    }
    
    if (pinInput === ADMIN_PIN) {
      setAuthed(true);
      setPinError(false);
      setFailedAttempts(0);
      setLockedUntil(null);
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPinError(true);
      setPinInput("");
      
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_TIME_MS;
        setLockedUntil(lockoutTime);
        setRemainingTime(LOCKOUT_TIME_MS / 1000);
      }
    }
  };

  const fileInputRef          = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadQuote, setUploadQuote] = useState("");

  const [urlInput,  setUrlInput]  = useState("");
  const [urlTitle,  setUrlTitle]  = useState("");
  const [urlQuote,  setUrlQuote]  = useState("");

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    await uploadFile(file, uploadTitle, uploadQuote);
    setFile(null); setPreview(null); setUploadTitle(""); setUploadQuote("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addByUrl(urlInput, urlTitle, urlQuote);
    setUrlInput(""); setUrlTitle(""); setUrlQuote("");
  };

  const confirmDelete = (photo: Photo) => {
    if (window.confirm(`¿Eliminar "${photo.title}" de la galaxia?`)) {
      deletePhoto(photo);
    }
  };

  const confirmReset = () => {
    if (window.confirm("¿Restaurar todas las fotos por defecto? Esto eliminará las personalizadas.")) {
      resetToDefaults();
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#030308] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-gradient-to-b from-[#1b1035] to-[#0b071e] border border-pink-500/30 rounded-3xl p-8 shadow-[0_0_40px_rgba(236,72,153,0.2)]"
        >
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-2xl font-serif font-bold text-pink-300">Panel de Administración</h1>
            <p className="text-white/50 text-sm mt-2">Ingresa el PIN para gestionar la galaxia</p>
          </div>
          <form onSubmit={handlePin} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9\-]*"
              placeholder="PIN"
              value={pinInput}
              onChange={e => { setPinInput(e.target.value); setPinError(false); }}
              disabled={lockedUntil ? Date.now() < lockedUntil : false}
              className="w-full text-center text-2xl tracking-[0.5em] bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={10}
              autoFocus
            />
            <AnimatePresence>
              {lockedUntil && Date.now() < lockedUntil ? (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="text-red-400 text-sm text-center flex items-center justify-center gap-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <Clock className="w-4 h-4" /> Bloqueado {remainingTime}s
                </motion.div>
              ) : pinError ? (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="text-red-400 text-sm text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" /> PIN incorrecto ({failedAttempts}/{MAX_FAILED_ATTEMPTS})
                </motion.div>
              ) : null}
            </AnimatePresence>
            <button type="submit"
              disabled={lockedUntil ? Date.now() < lockedUntil : false}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold hover:from-pink-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              Entrar
            </button>
          </form>
          <p className="text-center mt-6">
            <a href="/" className="text-pink-400/60 text-xs hover:text-pink-400 transition-colors">← Volver a la galaxia</a>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030308] text-white">
      <header className="sticky top-0 z-10 bg-[#030308]/90 backdrop-blur-md border-b border-white/10 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌌</span>
          <div>
            <h1 className="font-serif font-bold text-pink-300 text-lg leading-none">Panel Admin</h1>
            <p className="text-white/40 text-xs mt-0.5">Nuestra Galaxia de Amor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
            usingSupabase
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
          }`}>
            <Database className="w-3 h-3" />
            {usingSupabase ? "Supabase" : "Local"}
          </span>
          <a href="/" className="text-white/40 hover:text-white text-xs border border-white/10 rounded-full px-3 py-1.5 transition-colors">
            Ver galaxia
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl mb-6 border border-white/10">
          {([
            { id: "upload" as Tab, label: "📸 Subir foto",   icon: Camera   },
            { id: "url"    as Tab, label: "🔗 Por URL",      icon: Link2    },
            { id: "list"   as Tab, label: `🌟 Fotos (${photos.length})`, icon: ImageIcon },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-pink-500/80 to-red-500/80 text-white shadow"
                  : "text-white/50 hover:text-white/80"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "upload" && (
            <motion.div key="upload" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer rounded-2xl border-2 border-dashed border-pink-500/30 hover:border-pink-500/60 bg-white/5 transition-all overflow-hidden"
                  style={{ minHeight: 220 }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFilePick}
                    className="sr-only"
                  />
                  {preview ? (
                    <div className="relative w-full h-56">
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      <button type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-pink-400" />
                      </div>
                      <p className="text-white font-medium mb-1">Toca para elegir fotos o sacar una</p>
                      <p className="text-white/40 text-sm">Galería del celular o cámara · JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>

                <input type="text" placeholder="Título del momento (ej. Nuestro primer viaje)"
                  value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500 focus:outline-none text-white placeholder:text-white/30" />

                <textarea placeholder="Frase o poema para este momento..."
                  value={uploadQuote} onChange={e => setUploadQuote(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500 focus:outline-none text-white placeholder:text-white/30 resize-none h-24" />

                <button type="submit" disabled={!file || uploading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-red-600 transition-all flex items-center justify-center gap-2">
                  {uploading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Subiendo...</>
                    : <><Upload className="w-4 h-4" /> Agregar a la galaxia ✨</>
                  }
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === "url" && (
            <motion.div key="url" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <input type="url" placeholder="URL de la imagen (Unsplash, Imgur, Google Photos...)"
                  value={urlInput} onChange={e => setUrlInput(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500 focus:outline-none text-white placeholder:text-white/30" />

                {urlInput && (
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                    <img src={urlInput} alt="preview" className="w-full h-40 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}

                <input type="text" placeholder="Título del momento"
                  value={urlTitle} onChange={e => setUrlTitle(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500 focus:outline-none text-white placeholder:text-white/30" />

                <textarea placeholder="Frase o poema para este momento..."
                  value={urlQuote} onChange={e => setUrlQuote(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500 focus:outline-none text-white placeholder:text-white/30 resize-none h-24" />

                <button type="submit" disabled={uploading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {uploading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Link2 className="w-4 h-4" /> Agregar a la galaxia ✨</>
                  }
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === "list" && (
            <motion.div key="list" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-white/50">{photos.length} foto{photos.length !== 1 ? "s" : ""} en la galaxia</p>
                <button onClick={confirmReset}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-full px-3 py-1.5 transition-colors flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Restaurar por defecto
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20 text-white/40">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Cargando...
                </div>
              ) : (
                <div className="space-y-3">
                  {photos.map(photo => (
                    <motion.div key={photo.id} layout
                      initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                      exit={{ opacity:0, scale:0.95 }}
                      className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-all">
                      <img src={photo.url} alt={photo.title}
                        className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-white truncate">{photo.title}</p>
                        <p className="text-xs text-white/40 truncate italic mt-0.5">"{photo.quote}"</p>
                        {photo.storage_path && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-green-400/70">
                            <CheckCircle2 className="w-2.5 h-2.5" /> En Supabase
                          </span>
                        )}
                      </div>
                      <button onClick={() => confirmDelete(photo)}
                        className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
