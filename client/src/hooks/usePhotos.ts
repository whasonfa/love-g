import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, BUCKET, getPublicUrl } from "@/lib/supabase";
import type { Photo } from "@/lib/types";
import { PHOTOS_TABLE } from "@/lib/types";
import { toast } from "sonner";

async function getSharedPhotos(): Promise<Photo[] | null> {
  try {
    const res = await fetch("/api/photos");
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function saveSharedPhoto(photo: Photo): Promise<boolean> {
  try {
    const res = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(photo),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const LS_KEY = "love_galaxy_photos";

// ─── Fotos por defecto (se usan si Supabase no está configurado) ──
const getDefaultPhotos = (): Photo[] => {
  const base = import.meta.env.BASE_URL;
  const url = (p: string) => `${base}${p.replace(/^\/+/, "")}`;
  return [
    { id: 1, url: url("fotos/foto1.jpeg"), title: "Manos entrelazadas",   quote: "Aprender cómo sos, quererte como sos." },
    { id: 2, url: url("fotos/foto2.jpeg"), title: "Miradas que hablan",   quote: "Te quiero como para escuchar tu risa toda la noche." },
    { id: 3, url: url("fotos/foto3.jpeg"), title: "Tu sonrisa",           quote: "Mi estrategia es que por fin me necesites." },
    { id: 4, url: url("fotos/foto4.jpeg"), title: "Bajo las estrellas",   quote: "Cinco minutos bastan para vivir una vida entera." },
    { id: 5, url: url("fotos/foto5.jpeg"), title: "Abrazo cálido",        quote: "De dos cosas estoy seguro: tu amor es mi vida." },
    { id: 6, url: url("fotos/foto6.png"),  title: "Caminos juntos",       quote: "Te amo por tu mirada que mira y siembra futuro." },
  ];
};

export interface UsePhotosReturn {
  photos: Photo[];
  loading: boolean;
  uploading: boolean;
  /** Sube un archivo (File) desde el dispositivo */
  uploadFile: (file: File, title: string, quote: string) => Promise<void>;
  /** Agrega por URL externa */
  addByUrl: (url: string, title: string, quote: string) => Promise<void>;
  deletePhoto: (photo: Photo) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refetch: () => Promise<void>;
  usingSupabase: boolean;
}

export function usePhotos(): UsePhotosReturn {
  const configured  = isSupabaseConfigured();
  const [photos,    setPhotos]    = useState<Photo[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);

  // ── Carga inicial ──────────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      if (configured) {
        // ── Supabase ──
        const { data, error } = await supabase
          .from(PHOTOS_TABLE)
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setPhotos(data as Photo[]);
      } else {
        const shared = await getSharedPhotos();
        if (shared && shared.length > 0) {
          setPhotos(shared);
          localStorage.setItem(LS_KEY, JSON.stringify(shared));
        } else {
          const saved = localStorage.getItem(LS_KEY);
          setPhotos(saved ? JSON.parse(saved) : getDefaultPhotos());
        }
      }
    } catch (err) {
      console.error("[usePhotos] fetchPhotos:", err);
      const saved = localStorage.getItem(LS_KEY);
      setPhotos(saved ? JSON.parse(saved) : getDefaultPhotos());
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  useEffect(() => {
    if (!configured && !loading) {
      localStorage.setItem(LS_KEY, JSON.stringify(photos));
    }
  }, [photos, configured, loading]);

  const uploadFile = useCallback(async (file: File, title: string, quote: string) => {
    if (!title.trim() || !quote.trim()) {
      toast.error("El título y la frase no pueden estar vacíos.");
      return;
    }

    setUploading(true);
    try {
      if (configured) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const storagePath = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, {
            cacheControl : "3600",
            upsert       : false,
            contentType  : file.type,
          });
        if (uploadError) throw uploadError;

        const publicUrl = getPublicUrl(storagePath);

        const { error: insertError } = await supabase
          .from(PHOTOS_TABLE)
          .insert({ url: publicUrl, title, quote, storage_path: storagePath });
        if (insertError) throw insertError;

        await fetchPhotos();
        toast.success("¡Foto agregada a la galaxia! ✨");
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          const newPhoto: Photo = { id: Date.now(), url: base64, title, quote };
          const saved = await saveSharedPhoto(newPhoto);
          if (saved) {
            await fetchPhotos();
            toast.success("¡Foto sincronizada para todos los dispositivos! ✨");
          } else {
            setPhotos(prev => [...prev, newPhoto]);
            toast.success("Foto guardada localmente ✨ (configura Supabase para subir a la nube)");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error("[usePhotos] uploadFile:", err);
      toast.error(`Error al subir la foto: ${err?.message ?? "desconocido"}`);
    } finally {
      setUploading(false);
    }
  }, [configured, fetchPhotos]);

  const addByUrl = useCallback(async (url: string, title: string, quote: string) => {
    if (!url.trim() || !title.trim() || !quote.trim()) {
      toast.error("Todos los campos son requeridos.");
      return;
    }
    setUploading(true);
    try {
      if (configured) {
        const { error } = await supabase
          .from(PHOTOS_TABLE)
          .insert({ url, title, quote, storage_path: null });
        if (error) throw error;
        await fetchPhotos();
      } else {
        const newPhoto: Photo = { id: Date.now(), url, title, quote };
        const saved = await saveSharedPhoto(newPhoto);
        if (saved) {
          await fetchPhotos();
        } else {
          setPhotos(prev => [...prev, newPhoto]);
        }
      }
      toast.success("¡Foto agregada! ✨");
    } catch (err: any) {
      toast.error(`Error: ${err?.message ?? "desconocido"}`);
    } finally {
      setUploading(false);
    }
  }, [configured, fetchPhotos]);

  const deletePhoto = useCallback(async (photo: Photo) => {
    if (photos.length <= 3) {
      toast.error("Mantén al menos 3 fotos para que la galaxia se vea hermosa 🌟");
      return;
    }
    try {
      if (configured) {
        if (photo.storage_path) {
          await supabase.storage.from(BUCKET).remove([photo.storage_path]);
        }
        const { error } = await supabase.from(PHOTOS_TABLE).delete().eq("id", photo.id);
        if (error) throw error;
        await fetchPhotos();
      } else {
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
      }
      toast.success("Foto eliminada.");
    } catch (err: any) {
      toast.error(`Error al eliminar: ${err?.message ?? "desconocido"}`);
    }
  }, [photos.length, configured, fetchPhotos]);

  const resetToDefaults = useCallback(async () => {
    try {
      if (configured) {
        await supabase.from(PHOTOS_TABLE).delete().neq("id", 0);
        const defaults = getDefaultPhotos().map(({ id: _id, ...rest }) => rest);
        await supabase.from(PHOTOS_TABLE).insert(defaults);
        await fetchPhotos();
      } else {
        setPhotos(getDefaultPhotos());
      }
      toast.success("Fotos restauradas a los valores por defecto.");
    } catch (err: any) {
      toast.error(`Error: ${err?.message ?? "desconocido"}`);
    }
  }, [configured, fetchPhotos]);

  return {
    photos,
    loading,
    uploading,
    uploadFile,
    addByUrl,
    deletePhoto,
    resetToDefaults,
    refetch: fetchPhotos,
    usingSupabase: configured,
  };
}
