import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type FieldKind = "text" | "textarea" | "number" | "checkbox" | "select" | "date" | "image" | "download" | "season";
type Field = {
  key: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  nullable?: boolean;
  options?: string[];
  help?: string;
};
type ManagerConfig = {
  title: string;
  table: string;
  primaryKey: string;
  columns: string[];
  orderBy: string;
  fields: Field[];
  defaults?: Record<string, unknown>;
  canDelete?: boolean;
};

export const contentManagers: Record<string, ManagerConfig> = {
  features: {
    title: "Server features",
    table: "features",
    primaryKey: "id",
    columns: ["id", "title", "description", "category", "image_url", "video_url", "season_id", "featured", "published", "display_order", "updated_at"],
    orderBy: "display_order",
    fields: [
      { key: "title", label: "Name", required: true },
      { key: "description", label: "Description", kind: "textarea", required: true },
      { key: "category", label: "Category", required: true },
      { key: "image_url", label: "Image", kind: "image", nullable: true },
      { key: "video_url", label: "Video URL", nullable: true },
      { key: "season_id", label: "Season", kind: "season" },
      { key: "display_order", label: "Display order", kind: "number", required: true },
      { key: "featured", label: "Featured", kind: "checkbox" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  rule_categories: {
    title: "Rule categories",
    table: "rule_categories",
    primaryKey: "id",
    columns: ["id", "name", "display_order"],
    orderBy: "display_order",
    fields: [
      { key: "name", label: "Category", required: true },
      { key: "display_order", label: "Display order", kind: "number", required: true },
    ],
  },
  rules: {
    title: "Rules",
    table: "rules",
    primaryKey: "id",
    columns: ["id", "category", "content", "display_order", "published", "updated_at"],
    orderBy: "display_order",
    fields: [
      { key: "category", label: "Category", required: true },
      { key: "content", label: "Rule text", kind: "textarea", required: true },
      { key: "display_order", label: "Display order", kind: "number", required: true },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  punishments: {
    title: "Punishment progression",
    table: "punishment_steps",
    primaryKey: "id",
    columns: ["id", "name", "display_order", "published"],
    orderBy: "display_order",
    fields: [
      { key: "name", label: "Action", required: true },
      { key: "display_order", label: "Display order", kind: "number", required: true },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  titles: {
    title: "Titles and achievements",
    table: "titles",
    primaryKey: "id",
    columns: ["id", "name", "description", "requirements", "category", "rarity", "reward", "special_conditions", "image_url", "featured", "published", "display_order", "discord_only"],
    orderBy: "display_order",
    fields: [
      { key: "id", label: "Slot number (1–49)", kind: "number", required: true },
      { key: "name", label: "Title name", required: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "requirements", label: "Requirements", kind: "textarea" },
      { key: "category", label: "Category" },
      { key: "rarity", label: "Rarity" },
      { key: "reward", label: "Reward", kind: "textarea" },
      { key: "special_conditions", label: "Special conditions", kind: "textarea" },
      { key: "image_url", label: "Icon", kind: "image", nullable: true },
      { key: "display_order", label: "Display order", kind: "number", required: true },
      { key: "featured", label: "Featured", kind: "checkbox" },
      { key: "discord_only", label: "Discord-only recognition", kind: "checkbox" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  announcements: {
    title: "News and announcements",
    table: "announcements",
    primaryKey: "id",
    columns: ["id", "title", "description", "featured_image", "author_name", "category", "status", "pinned", "display_order", "publish_at", "scheduled_at", "season_id", "updated_at"],
    orderBy: "display_order",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "description", label: "Article", kind: "textarea", required: true },
      { key: "featured_image", label: "Image", kind: "image", nullable: true },
      { key: "author_name", label: "Author", nullable: true },
      { key: "category", label: "Category" },
      { key: "status", label: "Status", kind: "select", options: ["draft", "published"], required: true },
      { key: "pinned", label: "Featured", kind: "checkbox" },
      { key: "display_order", label: "Display order", kind: "number", required: true },
      { key: "publish_at", label: "Publication date", kind: "date" },
      { key: "scheduled_at", label: "Scheduled date", kind: "date" },
      { key: "season_id", label: "Season", kind: "season" },
    ],
  },
  staff: {
    title: "Staff directory",
    table: "staff",
    primaryKey: "id",
    columns: ["id", "minecraft_name", "discord_name", "position", "biography", "profile_image", "display_order", "featured", "published"],
    orderBy: "display_order",
    fields: [
      { key: "minecraft_name", label: "Minecraft username", required: true },
      { key: "discord_name", label: "Discord name or public profile", nullable: true },
      { key: "position", label: "Position", required: true },
      { key: "biography", label: "Biography", kind: "textarea" },
      { key: "profile_image", label: "Profile image", kind: "image", nullable: true },
      { key: "display_order", label: "Display order", kind: "number", required: true },
      { key: "featured", label: "Featured", kind: "checkbox" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  downloads: {
    title: "Downloads center",
    table: "downloads",
    primaryKey: "id",
    columns: ["id", "title", "description", "category", "version", "storage_path", "file_name", "content_type", "size_bytes", "published", "season_id", "created_at"],
    orderBy: "created_at",
    fields: [
      { key: "title", label: "Download title", required: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "category", label: "Category", required: true },
      { key: "version", label: "Version" },
      { key: "storage_path", label: "File", kind: "download", required: true },
      { key: "season_id", label: "Season", kind: "season" },
      { key: "published", label: "Published", kind: "checkbox" },
    ],
  },
  seasons: {
    title: "Seasons",
    table: "seasons",
    primaryKey: "id",
    columns: ["id", "slug", "name", "description", "banner_url", "starts_at", "ends_at", "status", "created_at"],
    orderBy: "created_at",
    canDelete: false,
    fields: [
      { key: "slug", label: "Season slug", required: true },
      { key: "name", label: "Season name", required: true },
      { key: "description", label: "Description", kind: "textarea" },
      { key: "banner_url", label: "Banner image", kind: "image", nullable: true },
      { key: "starts_at", label: "Start date", kind: "date" },
      { key: "ends_at", label: "End date", kind: "date" },
      { key: "status", label: "Status", kind: "select", options: ["draft", "active", "archived"], required: true, help: "Archiving preserves all season records. Activating a season archives the current active season." },
    ],
  },
  leaderboard_entries: {
    title: "Leaderboard entries",
    table: "leaderboard_entries",
    primaryKey: "id",
    columns: ["id", "player_name", "wins", "playtime_minutes", "kills", "updated_at"],
    orderBy: "updated_at",
    fields: [
      { key: "player_name", label: "Player name", required: true },
      { key: "wins", label: "Wins", kind: "number", required: true },
      { key: "playtime_minutes", label: "Playtime (minutes)", kind: "number", required: true },
      { key: "kills", label: "Kills", kind: "number", required: true },
    ],
  },
};

type ContentRow = Record<string, unknown>;
function isContentRow(value: unknown): value is ContentRow {
  return typeof value === "object" && value !== null;
}

type Props = {
  client: SupabaseClient;
  managerKey: string;
};

function defaultsFor(config: ManagerConfig) {
  const values: Record<string, unknown> = {
    ...(config.defaults ?? {}),
    display_order: 0,
    published: false,
    featured: false,
    pinned: false,
    discord_only: false,
    status: config.table === "announcements" ? "draft" : config.table === "seasons" ? "draft" : undefined,
  };
  for (const field of config.fields) if (values[field.key] === undefined) values[field.key] = field.kind === "checkbox" ? false : "";
  return values;
}

function toInputValue(field: Field, value: unknown) {
  if (field.kind === "checkbox") return Boolean(value);
  if (field.kind === "date" && typeof value === "string" && value) return value.slice(0, 16);
  return value == null ? "" : String(value);
}

function readableValue(row: ContentRow, config: ManagerConfig) {
  const titleField = config.fields.find((field) => field.key === "title" || field.key === "name" || field.key === "minecraft_name" || field.key === "player_name");
  return titleField ? String(row[titleField.key] ?? "Untitled") : String(row[config.primaryKey] ?? "Record");
}

export default function AdminContentManager({ client, managerKey }: Props) {
  const config = contentManagers[managerKey];
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [editingId, setEditingId] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [seasonChoices, setSeasonChoices] = useState<Array<{ id: string; name: string }>>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [publicationFilter, setPublicationFilter] = useState("All");
  const [page, setPage] = useState(0);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await client
      .from(config.table)
      .select(config.columns.join(","))
      .order(config.orderBy, { ascending: true });
    if (queryError) {
      setMessage(`Could not load ${config.title.toLowerCase()}: ${queryError.message}`);
      setError(true);
      setLoading(false);
      return;
    }
    const candidateRows: unknown = data ?? [];
    setRows(Array.isArray(candidateRows) ? candidateRows.filter(isContentRow) : []);
    setLoading(false);
  }, [client, config]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!config.fields.some((field) => field.kind === "season")) return;
    let active = true;
    void client.from("seasons").select("id,name").order("created_at", { ascending: false }).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) {
        setMessage(`Could not load season choices: ${queryError.message}`);
        setError(true);
      } else {
        setSeasonChoices((data ?? []) as Array<{ id: string; name: string }>);
      }
    });
    return () => { active = false; };
  }, [client, config.fields]);

  const reset = () => {
    setValues(defaultsFor(config));
    setEditingId(null);
    setMessage("");
  };

  const edit = (row: ContentRow) => {
    setValues(Object.fromEntries(config.fields.map((field) => [field.key, toInputValue(field, row[field.key])] )));
    setEditingId(row[config.primaryKey]);
    setMessage("");
  };

  const setField = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }));

  const uploadField = async (field: Field, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (field.kind === "image" && (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)) {
      setMessage("Choose an image no larger than 10 MB.");
      setError(true);
      return;
    }
    if (field.kind === "download" && file.size > 100 * 1024 * 1024) {
      setMessage("Download files must be no larger than 100 MB.");
      setError(true);
      return;
    }
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) {
      setMessage("Your administrator session could not be verified. Sign in again and retry.");
      setError(true);
      return;
    }
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const bucket = field.kind === "image" ? "site-media" : "download-files";
    setUploadingField(field.key);
    setMessage("");
    setError(false);
    const { error: uploadError } = await client.storage.from(bucket).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) {
      setMessage(`Upload failed: ${uploadError.message}`);
      setError(true);
      setUploadingField("");
      return;
    }
    if (field.kind === "image") {
      const { data: { publicUrl } } = client.storage.from(bucket).getPublicUrl(path);
      const { error: mediaError } = await client.from("media").insert({
        file_name: file.name,
        file_url: publicUrl,
        content_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
        storage_path: path,
      });
      if (mediaError) {
        const { error: cleanupError } = await client.storage.from(bucket).remove([path]);
        setMessage(cleanupError
          ? `The image record could not be saved (${mediaError.message}), and its uploaded file could not be removed (${cleanupError.message}).`
          : `The image record could not be saved; its uploaded file was removed. ${mediaError.message}`);
        setError(true);
      } else {
        setField(field.key, publicUrl);
        setMessage("Image uploaded. Save this record to publish the change.");
      }
    } else {
      setField(field.key, path);
      setField("file_name", file.name);
      setField("content_type", file.type || "application/octet-stream");
      setField("size_bytes", file.size);
      const { data: { user } } = await client.auth.getUser();
      setField("uploaded_by", user?.id ?? null);
      setMessage("File uploaded securely. Save this download record to publish it.");
    }
    setUploadingField("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const field of config.fields) {
      const value = values[field.key];
      if (field.required && (value === "" || value === null || value === undefined)) {
        setMessage(`${field.label} is required.`);
        setError(true);
        return;
      }
      if (field.key.endsWith("_url") && value && !/^https?:\/\//i.test(String(value))) {
        setMessage(`${field.label} must be an http or https URL.`);
        setError(true);
        return;
      }
      if (field.kind === "number") {
        const number = Number(value);
        if (!Number.isSafeInteger(number) || number < 0) {
          setMessage(`${field.label} must be a non-negative whole number.`);
          setError(true);
          return;
        }
        payload[field.key] = number;
      } else if (field.kind === "date") {
        payload[field.key] = value ? new Date(String(value)).toISOString() : null;
      } else {
        payload[field.key] = value === "" && field.nullable ? null : value;
      }
    }
    if (config.table === "titles" && (Number(payload.id) < 1 || Number(payload.id) > 49)) {
      setMessage("Title slots must be numbered 1 through 49.");
      setError(true);
      return;
    }
    if (config.table === "seasons" && payload.status === "active") payload.status = "draft";
    if (config.table === "announcements") {
      payload.updated_at = new Date().toISOString();
      payload.author_id = (await client.auth.getUser()).data.user?.id ?? null;
    }
    if (config.table === "downloads") {
      payload.file_name = values.file_name;
      payload.content_type = values.content_type;
      payload.size_bytes = values.size_bytes;
      payload.uploaded_by = values.uploaded_by;
    }
    const previousStoragePath = editingId !== null && config.table === "downloads"
      ? String(rows.find((row) => row[config.primaryKey] === editingId)?.storage_path ?? "")
      : "";
    setSaving(true);
    setMessage("");
    setError(false);
    const result = editingId !== null
      ? await client.from(config.table).update(payload).eq(config.primaryKey, editingId)
      : await client.from(config.table).insert(payload);
    if (result.error) {
      setMessage(`Could not save this record: ${result.error.message}`);
      setError(true);
      setSaving(false);
      return;
    }
    if (config.table === "seasons" && values.status === "active") {
      const rowId = editingId ?? (await client.from("seasons").select("id").eq("slug", String(values.slug)).single()).data?.id;
      const { error: activateError } = await client.rpc("activate_season", { p_season_id: rowId });
      if (activateError) {
        setMessage(`The season was saved but could not be activated: ${activateError.message}`);
        setError(true);
        setSaving(false);
        await loadRows();
        return;
      }
    }
    let cleanupMessage = "";
    const newStoragePath = String(payload.storage_path ?? "");
    if (previousStoragePath && newStoragePath && previousStoragePath !== newStoragePath) {
      const { error: cleanupError } = await client.storage.from("download-files").remove([previousStoragePath]);
      if (cleanupError) {
        cleanupMessage = `Download saved, but the replaced file could not be removed: ${cleanupError.message}`;
      }
    }
    setMessage(cleanupMessage || "Changes saved.");
    setError(Boolean(cleanupMessage));
    setValues(defaultsFor(config));
    setEditingId(null);
    await loadRows();
    setSaving(false);
  };

  const remove = async (row: ContentRow) => {
    if (config.canDelete === false) return;
    const label = readableValue(row, config);
    if (!window.confirm(`Permanently delete "${label}"? This cannot be undone.`)) return;
    setSaving(true);
    if (config.table === "downloads" && typeof row.storage_path === "string" && row.storage_path) {
      const { error: storageError } = await client.storage.from("download-files").remove([row.storage_path]);
      if (storageError) {
        setMessage(`Could not delete the cloud file: ${storageError.message}`);
        setError(true);
        setSaving(false);
        return;
      }
    }
    const { error: deleteError } = await client.from(config.table).delete().eq(config.primaryKey, row[config.primaryKey]);
    if (deleteError) {
      setMessage(`Could not delete this record: ${deleteError.message}`);
      setError(true);
    } else {
      setRows((current) => current.filter((item) => item[config.primaryKey] !== row[config.primaryKey]));
      if (editingId === row[config.primaryKey]) reset();
      setMessage("Record deleted.");
      setError(false);
    }
    setSaving(false);
  };

  const fields = useMemo(() => config.fields, [config]);
  const categories = useMemo(() => [...new Set(rows.map((row) => row.category).filter((value): value is string => typeof value === "string"))], [rows]);
  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesSearch = Object.values(row).some((value) => typeof value === "string" && value.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "All" || row.category === categoryFilter;
    const published = row.published === true || row.status === "published";
    const matchesPublication = publicationFilter === "All" || (publicationFilter === "Published" ? published : !published);
    return matchesSearch && matchesCategory && matchesPublication;
  }), [rows, search, categoryFilter, publicationFilter]);
  const pageSize = 20;
  const visibleRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  const pageCount = Math.ceil(filteredRows.length / pageSize);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <span className="eyebrow">Database-managed content</span>
        <h2>{config.title}</h2>
        <p>{rows.length} records · updates are published without rebuilding the site</p>
        {managerKey === "leaderboard_entries" && <p className="admin-message">Only verified imported statistics should be published. The public leaderboard stays hidden until its source is configured.</p>}
      </div>
      {message && <p className={error ? "dashboard-message error" : "dashboard-message"} role={error ? "alert" : "status"}>{message}</p>}
      <div className="toolbar admin-content-toolbar">
        <input aria-label={`Search ${config.title}`} placeholder={`Search ${config.title.toLowerCase()}…`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} />
        {categories.length > 1 && <select aria-label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(0); }}><option>All</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>}
        {fields.some((field) => field.key === "published" || field.key === "status") && <select aria-label="Filter publication status" value={publicationFilter} onChange={(event) => { setPublicationFilter(event.target.value); setPage(0); }}><option>All</option><option>Published</option><option>Draft</option></select>}
      </div>
      <form className="admin-form-grid product-admin-form" onSubmit={(event) => void save(event)}>
        {fields.map((field) => (
          <label key={field.key} className={field.kind === "textarea" ? "full-width" : ""}>
            {field.label}
            {field.kind === "textarea" ? (
              <textarea rows={4} required={field.required} value={String(values[field.key] ?? "")} onChange={(event) => setField(field.key, event.target.value)} />
            ) : field.kind === "checkbox" ? (
              <input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => setField(field.key, event.target.checked)} />
            ) : field.kind === "select" ? (
              <select required={field.required} value={String(values[field.key] ?? "")} onChange={(event) => setField(field.key, event.target.value)}>
                <option value="">Choose…</option>
                {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field.kind === "season" ? (
              <select value={String(values[field.key] ?? "")} onChange={(event) => setField(field.key, event.target.value || null)}>
                <option value="">No season</option>{seasonChoices.map((season) => <option value={season.id} key={season.id}>{season.name}</option>)}
              </select>
            ) : field.kind === "image" || field.kind === "download" ? (
              <>
                <input type="file" accept={field.kind === "image" ? "image/jpeg,image/png,image/webp,image/gif" : undefined} required={field.required && !values[field.key]} onChange={(event) => void uploadField(field, event)} />
                {uploadingField === field.key && <small role="status">Uploading securely…</small>}
                {Boolean(values[field.key]) && <small>{field.kind === "image" ? "Image selected" : String(values.file_name ?? values[field.key])}</small>}
                {field.kind === "image" && typeof values[field.key] === "string" && values[field.key] && <img className="admin-image-preview" src={String(values[field.key])} alt={`${field.label} preview`} />}
              </>
            ) : (
              <input
                type={field.kind === "number" ? "number" : field.kind === "date" ? "datetime-local" : "text"}
                min={field.kind === "number" ? "0" : undefined}
                step={field.kind === "number" ? "1" : undefined}
                required={field.required}
                value={String(values[field.key] ?? "")}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            )}
            {field.help && <small>{field.help}</small>}
          </label>
        ))}
        <div className="full-width form-actions">
          <button className="button primary" type="submit" disabled={saving || Boolean(uploadingField)}>{saving ? "Saving…" : editingId !== null ? "Save changes" : "Create record"}</button>
          {editingId !== null && <button className="button secondary" type="button" onClick={reset}>Cancel edit</button>}
        </div>
      </form>
      <div className="product-admin-list">
        {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? <p className="muted">No records yet. Add the first one above.</p> : visibleRows.length === 0 ? <p className="muted">No records match these filters.</p> : visibleRows.map((row) => (
          <article key={String(row[config.primaryKey])}>
            <div>
              <strong>{readableValue(row, config)}</strong>
              <small>{String(row.category ?? row.status ?? (row.published ? "Published" : "Draft"))} · {String(row.published ? "Published" : row.status ?? "Draft")}</small>
            </div>
            <div className="form-actions">
              <button type="button" disabled={saving} onClick={() => edit(row)}>Edit</button>
              {config.canDelete !== false && <button type="button" className="danger-action" disabled={saving} onClick={() => void remove(row)}>Delete</button>}
            </div>
          </article>
        ))}
      </div>
      {pageCount > 1 && <div className="pagination-controls"><button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page + 1} of {pageCount}</span><button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </div>
  );
}
