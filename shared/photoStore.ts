import fs from "fs";
import path from "path";

export interface StoredPhoto {
  id: number;
  url: string;
  title: string;
  quote: string;
  storage_path?: string | null;
  created_at?: string;
}

const STORE_FILE = process.env.PHOTO_STORE_FILE
  ? path.resolve(process.env.PHOTO_STORE_FILE)
  : path.resolve(process.cwd(), ".love-galaxy-photos.json");

function ensureStoreFile() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify([], null, 2));
  }
}

export function readPhotos(): StoredPhoto[] {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePhotos(photos: StoredPhoto[]) {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(photos, null, 2));
  return photos;
}

export function addPhoto(photo: StoredPhoto) {
  const photos = readPhotos();
  const nextPhotos = [...photos, photo];
  return writePhotos(nextPhotos);
}

export function replacePhotos(photos: StoredPhoto[]) {
  return writePhotos(photos);
}
