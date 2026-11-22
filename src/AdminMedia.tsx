import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Media = { id: string; file_name: string; file_url: string; storage_path: string | null; content_type: string; size_bytes: number; created_at: string };

export default function AdminMedia({ client }: { client: SupabaseClient }) {
  const [files, setFiles] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await client.from("media").select("id,file_name,file_url,storage_path,content_type,size_bytes,created_at").order("created_at", { ascending: false });
    if (error) {
      setMessage(`Could not load media library: ${error.message}`);
      setIsError(true);
    } else {
      setFiles((data ?? []) as Media[]);
      setIsError(false);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setMessage("Choose a supported image no larger than 10 MB.");
      setIsError(true);
      return;
    }
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      setMessage("Your administrator session could not be verified. Sign in again and retry.");
      setIsError(true);
      return;
    }
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "img";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    setUploading(true);
    setMessage("");
    const { error: uploadError } = await client.storage.from("site-media").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setMessage(`Image upload failed: ${uploadError.message}`);
      setIsError(true);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = client.storage.from("site-media").getPublicUrl(path);
    const { error: insertError } = await client.from("media").insert({
      file_name: file.name,
      file_url: publicUrl,
      storage_path: path,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    });
    if (insertError) {
      const { error: cleanupError } = await client.storage.from("site-media").remove([path]);
      setMessage(cleanupError
        ? `Media record failed (${insertError.message}); the uploaded object also could not be removed (${cleanupError.message}).`
        : `Media record failed; uploaded image was removed. ${insertError.message}`);
      setIsError(true);
    } else {
      setMessage("Image uploaded to persistent cloud storage.");
      setIsError(false);
      await load();
    }
    setUploading(false);
  };

  const remove = async (item: Media) => {
    if (!window.confirm(`Permanently delete "${item.file_name}" from cloud storage? Pages using this image may show a broken image.`)) return;
    setUploading(true);
    const { error: deleteRowError } = await client.from("media").delete().eq("id", item.id);
    if (deleteRowError) {
      setMessage(`Could not remove media record: ${deleteRowError.message}`);
      setIsError(true);
      setUploading(false);
      return;
    }
    if (item.storage_path) {
      const { error: storageError } = await client.storage.from("site-media").remove([item.storage_path]);
      if (storageError) {
        setMessage(`Media record was removed, but the file could not be deleted: ${storageError.message}`);
        setIsError(true);
      } else {
        setMessage("Image removed from storage.");
        setIsError(false);
      }
    }
    await load();
    setUploading(false);
  };

  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><span className="eyebrow">Supabase Storage</span><h2>Media library</h2><p>Images are stored in the persistent site-media bucket. Large uploads and non-image files are rejected.</p></div>
    {message && <p className={isError ? "dashboard-message error" : "dashboard-message"} role={isError ? "alert" : "status"}>{message}</p>}
    <label className="media-upload">Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={(event) => void upload(event)} /></label>
    {uploading && <p className="muted" role="status">Saving to cloud storage…</p>}
    {loading ? <p className="muted">Loading media…</p> : files.length ? <div className="media-library-grid">
      {files.map((item) => <article className="media-library-item" key={item.id}>
        <img loading="lazy" src={item.file_url} alt={item.file_name} />
        <strong>{item.file_name}</strong><small>{(item.size_bytes / 1024 / 1024).toFixed(2)} MB · {new Date(item.created_at).toLocaleDateString()}</small>
        <div className="form-actions"><button type="button" onClick={() => void navigator.clipboard.writeText(item.file_url).then(() => setMessage("Public image URL copied."), () => { setMessage("Could not access clipboard."); setIsError(true); })}>Copy URL</button><button type="button" className="danger-action" disabled={uploading} onClick={() => void remove(item)}>Delete</button></div>
      </article>)}
    </div> : <p className="muted">No images uploaded yet.</p>}
  </section>;
}
