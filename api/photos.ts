import { addPhoto, readPhotos, replacePhotos, type StoredPhoto } from "../shared/photoStore";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return res.status(200).json(readPhotos());
  }

  if (req.method === "POST") {
    const photo = req.body as Partial<StoredPhoto>;
    if (!photo?.url || !photo?.title || !photo?.quote) {
      return res.status(400).json({ error: "invalid_photo" });
    }

    const storedPhoto: StoredPhoto = {
      id: photo.id ?? Date.now(),
      url: photo.url,
      title: photo.title,
      quote: photo.quote,
      storage_path: photo.storage_path ?? null,
      created_at: new Date().toISOString(),
    };

    addPhoto(storedPhoto);
    return res.status(201).json(storedPhoto);
  }

  if (req.method === "PUT") {
    const photos = req.body as StoredPhoto[];
    replacePhotos(photos);
    return res.status(200).json(readPhotos());
  }

  return res.status(405).json({ error: "method_not_allowed" });
}
