import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new Error(`Invalid file type. Allowed: JPG, PNG, WEBP, GIF`));
    } else {
      cb(null, true);
    }
  },
});

export function registerStorageProxy(app: Express) {
  app.post("/api/upload", (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: "File too large. Maximum size is 10MB." });
        return;
      }
      if (err) {
        res.status(400).json({ error: err.message || "Upload error" });
        return;
      }
      next();
    });
  }, async (req, res) => {
    if (!req.file) { res.status(400).json({ error: "No file provided" }); return; }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      res.status(500).json({ error: "Supabase storage not configured. Check VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env" });
      return;
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const BUCKET = "narcissus-products";

      // Auto-create bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === BUCKET);
      if (!bucketExists) {
        const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
        if (createErr) throw new Error(`Failed to create storage bucket: ${createErr.message}`);
      }

      const ext = req.file.originalname.split(".").pop()?.toLowerCase() ?? "jpg";
      const key = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(key);

      console.log(`[Storage] Uploaded: ${key} → ${publicUrl}`);
      res.json({ url: publicUrl, key });
    } catch (err: any) {
      console.error("[Storage] Upload error:", err);
      res.status(500).json({ error: err.message || "Upload failed" });
    }
  });
}