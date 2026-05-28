import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Stars, Eye, Volume2, VolumeX, Sparkles, BookOpen, MessageCircleHeart, X, Sparkle } from "lucide-react";
import Tunnel from "@/components/Tunnel";
import Galaxy3D from "@/components/Galaxy3D";
import YouTubePlayer from "@/components/YouTubePlayer";

// URL de la imagen generada de los ositos abrazándose
const BEARS_IMAGE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663700756201/S7UdDm4XC5gXnJabKjPvPN/cute-bears-hug-LZcmMgnKVMR92hqmLNkVdJ.webp";

// Frases de amor estilo Mario Benedetti
const BENEDETTI_QUOTES = [
  "Te quiero como para escuchar tu risa toda la noche y desarmar el mundo para que no te duela.",
  "Mi táctica es mirarte, aprender cómo sos, quererte como sos. Mi estrategia es que un día cualquiera no sé cómo ni sé con qué pretexto por fin me necesites.",
  "Si el corazón se aburre de querer para qué sirve.",
  "Cinco minutos bastan para vivir una vida entera, así de relativo es el tiempo.",
  "De dos cosas estoy seguro: de que tu amor es mi vida, y de que mi vida eres tú.",
  "Me gusta la gente capaz de entender que el mayor error del ser humano, es intentar sacarse de la cabeza aquello que no sale del corazón.",
  "Te amo por tu mirada que mira y siembra futuro.",
  "No sé tu nombre, sólo sé la mirada con que me lo dices."
];

const getPublicAssetUrl = (path: string) => {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
};

const normalizePhotoUrl = (url: string) => {
  if (!url) return "";

  const raw = url.trim();
  if (raw.startsWith("data:")) return raw;

  const cleanedFromAbsolute = (() => {
    if (!/^(https?:)?\/\//i.test(raw)) return null;

    try {
      const parsed = new URL(raw, window.location.origin);
      return parsed.pathname
        .replace(/^\/?love-galaxy(?:-netlify)?\/client\/public\//, "")
        .replace(/^\/?client\/public\//, "")
        .replace(/^\/?fotos\//, "fotos/");
    } catch {
      return null;
    }
  })();

  if (cleanedFromAbsolute) {
    return getPublicAssetUrl(cleanedFromAbsolute);
  }

  if (/^(https?:)?\/\//i.test(raw)) return raw;

  const cleaned = raw
    .replace(/^\/?love-galaxy(?:-netlify)?\/client\/public\//, "")
    .replace(/^\/?client\/public\//, "")
    .replace(/^\/?fotos\//, "fotos/");

  return getPublicAssetUrl(cleaned);
};

const normalizePhoto = (photo: { id: number; url: string; title: string; quote: string }) => ({
  ...photo,
  url: normalizePhotoUrl(photo.url),
});

const normalizeSavedPhotos = (value: unknown) => {
  if (!Array.isArray(value)) return DEFAULT_PHOTOS.map(normalizePhoto);

  return value
    .filter((photo): photo is { id: number; url: string; title: string; quote: string } =>
      typeof photo === "object" && photo !== null &&
      "url" in photo && typeof (photo as any).url === "string"
    )
    .map(normalizePhoto);
};

// Fotos por defecto (cargadas desde la carpeta pública del proyecto)
const DEFAULT_PHOTOS = [
  {
    id: 1,
    url: getPublicAssetUrl("fotos/foto1.jpeg"),
    title: "Manos entrelazadas",
    quote: "Aprender cómo sos, quererte como sos."
  },
  {
    id: 2,
    url: getPublicAssetUrl("fotos/foto2.jpeg"),
    title: "Miradas que hablan",
    quote: "Te quiero como para escuchar tu risa toda la noche."
  },
  {
    id: 3,
    url: getPublicAssetUrl("fotos/foto3.jpeg"),
    title: "Tu sonrisa",
    quote: "Mi estrategia es que por fin me necesites."
  },
  {
    id: 4,
    url: getPublicAssetUrl("fotos/foto4.jpeg"),
    title: "Bajo las estrellas",
    quote: "Cinco minutos bastan para vivir una vida entera."
  },
  {
    id: 5,
    url: getPublicAssetUrl("fotos/foto5.jpeg"),
    title: "Abrazo cálido",
    quote: "De dos cosas estoy seguro: tu amor es mi vida."
  },
  {
    id: 6,
    url: getPublicAssetUrl("fotos/foto6.png"),
    title: "Caminos juntos",
    quote: "Te amo por tu mirada que mira y siembra futuro."
  }
];

export default function Home() {
  // Estados de navegación
  // 'welcome' | 'tunnel' | 'galaxy'
  const [stage, setStage] = useState<"welcome" | "tunnel" | "galaxy">("welcome");
  
  // Fotos de la galaxia (pueden ser personalizadas o por defecto)
  const [photos, setPhotos] = useState(() => {
    try {
      const saved = localStorage.getItem("love_galaxy_photos");
      const parsed = saved ? JSON.parse(saved) : DEFAULT_PHOTOS;
      const normalized = normalizeSavedPhotos(parsed);

      if (saved) {
        const serialized = JSON.stringify(normalized);
        if (serialized !== saved) {
          localStorage.setItem("love_galaxy_photos", serialized);
        }
      }

      return normalized;
    } catch {
      return DEFAULT_PHOTOS.map(normalizePhoto);
    }
  });
  const [selectedPhoto, setSelectedPhoto] = useState<typeof DEFAULT_PHOTOS[0] | null>(null);
  
  // Estado para el panel de personalización de fotos
  const [showConfig, setShowConfig] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoTitle, setNewPhotoTitle] = useState("");
  const [newPhotoQuote, setNewPhotoQuote] = useState("");

  // Guardar fotos en localStorage para persistencia
  useEffect(() => {
    localStorage.setItem("love_galaxy_photos", JSON.stringify(photos.map(normalizePhoto)));
  }, [photos]);

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl || !newPhotoTitle || !newPhotoQuote) return;

    const newPhoto = normalizePhoto({
      id: Date.now(),
      url: newPhotoUrl,
      title: newPhotoTitle,
      quote: newPhotoQuote
    });

    setPhotos([...photos, newPhoto]);
    setNewPhotoUrl("");
    setNewPhotoTitle("");
    setNewPhotoQuote("");
  };

  const handleDeletePhoto = (id: number) => {
    if (photos.length <= 3) {
      alert("¡Mantén al menos 3 fotos para que la galaxia se vea hermosa!");
      return;
    }
    setPhotos(photos.filter((p: any) => p.id !== id));
  };

  const handleResetPhotos = () => {
    if (window.confirm("¿Seguro que deseas restaurar las fotos románticas por defecto?")) {
      setPhotos(DEFAULT_PHOTOS.map(normalizePhoto));
    }
  };
  
  // Estado para controlar el volumen del reproductor de YouTube
  const [muted, setMuted] = useState(false);
  const playerRef = useRef<any>(null);

  const toggleMute = () => {
    if (playerRef.current && playerRef.current.setVolume) {
      if (muted) {
        playerRef.current.setVolume(30);
      } else {
        playerRef.current.setVolume(0);
      }
    }
    setMuted(!muted);
  };

  // Iniciar viaje por el túnel
  const handleStart = () => {
    setStage("tunnel");
    
    // El túnel dura 4 segundos antes de entrar a la galaxia
    setTimeout(() => {
      setStage("galaxy");
    }, 4500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030308] text-white overflow-hidden font-sans select-none">
      {/* Reproductor de YouTube de Fondo (Música Romántica) */}
      <YouTubePlayer videoId="oFP4kuIiUQ4" autoplay={true} loop={true} muted={false} />
      {/* Botón de Control de Volumen */}
      <button 
        onClick={toggleMute}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95"
        title={muted ? "Activar música" : "Silenciar música"}
      >
        {muted ? <VolumeX className="w-5 h-5 text-pink-400" /> : <Volume2 className="w-5 h-5 text-pink-500 animate-pulse" />}
      </button>

      <AnimatePresence mode="wait">
        {/* PANTALLA DE BIENVENIDA */}
        {stage === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-4"
            style={{
              background: "radial-gradient(circle at center, #1a0b2e 0%, #030308 100%)"
            }}
          >
            {/* Estrellas de fondo parpadeantes */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full bg-white animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${Math.random() * 3 + 2}s`
                  }}
                />
              ))}
            </div>

            {/* Contenedor principal */}
            <div className="relative z-10 text-center max-w-2xl flex flex-col items-center">
              {/* Título de Amor */}
              <motion.h1
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                className="text-4xl md:text-6xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-red-400 to-purple-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)] mb-8 font-serif"
              >
                TE AMO MI BEBITA PRECIOSA...
              </motion.h1>

              {/* Ositos Abrazándose Animados */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 1, type: "spring" }}
                className="relative w-72 h-72 md:w-80 md:h-80 mb-10 group"
              >
                {/* Aura de neón detrás de los ositos */}
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                
                {/* Corazones flotantes alrededor */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        y: [-20, -80],
                        x: [0, (i % 2 === 0 ? 30 : -30)],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 0.5]
                      }}
                      transition={{
                        duration: 3 + i,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: "easeOut"
                      }}
                      className="absolute text-red-500"
                      style={{
                        bottom: "30%",
                        left: `${40 + i * 5}%`,
                      }}
                    >
                      <Heart className="fill-current w-6 h-6 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                    </motion.div>
                  ))}
                </div>

                {/* Imagen de los ositos */}
                <motion.img
                  src={BEARS_IMAGE_URL}
                  alt="Ositos abrazándose"
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 1, -1, 0]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>

              {/* Botón de Iniciar */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <Button
                  onClick={handleStart}
                  className="relative px-10 py-7 text-xl font-bold rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-2 border-pink-300/30 text-white shadow-[0_0_25px_rgba(236,72,153,0.5)] hover:shadow-[0_0_40px_rgba(236,72,153,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 group overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Iniciar nuestro viaje <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
                  </span>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* TÚNEL DE AGUJERO DE GUSANO */}
        {stage === "tunnel" && (
          <motion.div
            key="tunnel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Túnel interactivo 3D con Three.js */}
            <Tunnel />

            {/* Mensaje en el túnel */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 4, times: [0, 0.2, 0.8, 1] }}
              className="z-10 text-center max-w-lg px-4 pointer-events-none"
            >
              <h2 className="text-3xl md:text-5xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-pink-500 to-purple-500 animate-pulse drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                Viajando al centro de mi universo...
              </h2>
              <p className="mt-4 text-pink-200/80 text-lg font-light tracking-wide">Donde cada estrella lleva tu nombre</p>
            </motion.div>
          </motion.div>
        )}

        {/* GALAXIA 3D (Se implementará en detalle en la siguiente fase) */}
        {stage === "galaxy" && (
          <motion.div
            key="galaxy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col justify-between"
          >
            {/* Contenedor de la Galaxia 3D Real con Three.js */}
            <div className="absolute inset-0 z-0">
              <Galaxy3D 
                photos={photos} 
                onSelectPhoto={(photo) => setSelectedPhoto(photo)} 
              />
            </div>

            {/* Interfaz de la Galaxia (Encabezado y controles) */}
            <div className="relative z-10 p-6 flex justify-between items-start bg-gradient-to-b from-black/80 via-black/40 to-transparent">
              <div>
                <h2 className="text-xl md:text-3xl font-serif font-bold text-pink-300 flex items-center gap-2 drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                  <MessageCircleHeart className="w-6 h-6 md:w-8 md:h-8 text-pink-500 animate-pulse" />
                  Nuestra Galaxia de Amor
                </h2>
                <p className="text-xs md:text-sm text-pink-100/70 mt-1 max-w-md">
                  Haz clic en las esferas flotantes de la galaxia para ver tus fotos a detalle y leer versos románticos.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowConfig(true)}
                  className="bg-pink-600/20 border border-pink-500/30 hover:bg-pink-600/40 text-pink-200 text-xs md:text-sm px-4 py-2 rounded-full transition-all"
                >
                  Personalizar Fotos 📸
                </Button>
                <Button 
                  onClick={() => setStage("welcome")}
                  variant="outline"
                  className="bg-white/5 border-white/20 hover:bg-white/10 text-white text-xs md:text-sm px-4 py-2 rounded-full"
                >
                  Volver
                </Button>
              </div>
            </div>

            {/* Footer con poema aleatorio de Benedetti que cambia */}
            <div className="relative z-10 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-center">
              <div className="max-w-2xl mx-auto">
                <motion.p 
                  key={selectedPhoto ? selectedPhoto.id : "default"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm md:text-lg italic font-serif text-pink-100 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
                >
                  "{selectedPhoto ? selectedPhoto.quote : BENEDETTI_QUOTES[0]}"
                </motion.p>
                <p className="text-xs text-pink-400 mt-2 font-medium tracking-wider">— Mario Benedetti</p>
              </div>
            </div>

            {/* PANEL DE PERSONALIZACIÓN */}
            <AnimatePresence>
              {showConfig && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#1b1035] to-[#0b071e] border border-pink-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(236,72,153,0.3)]"
                  >
                    <button
                      onClick={() => setShowConfig(false)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h3 className="text-2xl font-serif font-bold text-pink-300 mb-2">
                      Personaliza tu Galaxia de Amor
                    </h3>
                    <p className="text-sm text-white/60 mb-6">
                      Agrega fotos con enlaces directos de internet (o Unsplash) y agrega versos o más frases de Benedetti.
                    </p>

                    {/* Formulario para agregar foto */}
                    <form onSubmit={handleAddPhoto} className="space-y-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <h4 className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Agregar Nueva Estrella Fotográfica</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="url"
                          placeholder="URL de la imagen (ej. de Unsplash, Pinterest, Imgur...)"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(event ? (e.target as HTMLInputElement).value : "")}
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none w-full text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="Título del momento (ej. Nuestro primer viaje)"
                          value={newPhotoTitle}
                          onChange={(e) => setNewPhotoTitle(event ? (e.target as HTMLInputElement).value : "")}
                          className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none w-full text-white"
                          required
                        />
                      </div>
                      <textarea
                        placeholder="Frase de amor o poema para este momento..."
                        value={newPhotoQuote}
                        onChange={(e) => setNewPhotoQuote(event ? (e.target as HTMLTextAreaElement).value : "")}
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none w-full h-20 text-white resize-none"
                        required
                      />
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleResetPhotos}
                          className="text-xs text-red-400 hover:text-red-300 underline transition-colors"
                        >
                          Restaurar valores por defecto
                        </button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold rounded-xl px-6 py-2"
                        >
                          Agregar a la Galaxia ✨
                        </Button>
                      </div>
                    </form>

                    {/* Lista de fotos actuales */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Fotos en tu Galaxia ({photos.length})</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                        {photos.map((p: any) => (
                          <div key={p.id} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                            <img src={p.url} alt={p.title} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate text-white">{p.title}</p>
                              <p className="text-xs text-white/50 truncate italic">"{p.quote}"</p>
                            </div>
                            <button
                              onClick={() => handleDeletePhoto(p.id)}
                              className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Eliminar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODAL DE DETALLE DE LA FOTO SELECCIONADA */}
            <AnimatePresence>
              {selectedPhoto && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#1b1035]/90 to-[#0b071e]/95 border border-pink-500/30 p-6 md:p-8 shadow-[0_0_50px_rgba(236,72,153,0.3)] flex flex-col items-center text-center"
                  >
                    {/* Botón de Cerrar */}
                    <button
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/80 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Foto en Detalle en un marco circular elegante */}
                    <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full overflow-hidden border-4 border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.5)] mb-6">
                      <img
                        src={selectedPhoto.url}
                        alt={selectedPhoto.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>

                    {/* Título y Poema */}
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-1.5 text-xs font-semibold tracking-widest text-pink-400 uppercase mb-2">
                        <Sparkle className="w-3.5 h-3.5 fill-pink-400 animate-spin" />
                        {selectedPhoto.title}
                        <Sparkle className="w-3.5 h-3.5 fill-pink-400 animate-spin" />
                      </span>
                      
                      <p className="text-base md:text-xl italic font-serif text-pink-100 leading-relaxed max-w-md px-2">
                        "{selectedPhoto.quote}"
                      </p>
                      
                      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent my-4" />
                      
                      <p className="text-xs text-white/50 font-serif">
                        Para la bebita más hermosa del universo
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
