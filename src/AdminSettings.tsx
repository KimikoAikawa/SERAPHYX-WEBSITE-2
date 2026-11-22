import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Setting = { key: string; value: unknown; is_public: boolean; updated_at: string };
type ValueMode = "text" | "json";

export default function AdminSettings({ client }: { client: SupabaseClient }) {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [key, setKey] = useState("");
  const [valueText, setValueText] = useState("");
  const [valueMode, setValueMode] = useState<ValueMode>("text");
  const [isPublic, setIsPublic] = useState(true);
  const [editingKey, setEditingKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await client.from("site_settings").select("key,value,is_public,updated_at").order("key");
    if (error) {
      setMessage(`Could not load website settings: ${error.message}`);
      setIsError(true);
    } else {
      setSettings((data ?? []) as Setting[]);
      setIsError(false);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const reset = () => {
    setKey("");
    setValueText("");
    setValueMode("text");
    setIsPublic(true);
    setEditingKey("");
  };

  const edit = (setting: Setting) => {
    setKey(setting.key);
    if (typeof setting.value === "string") {
      setValueMode("text");
      setValueText(setting.value);
    } else {
      setValueMode("json");
      setValueText(JSON.stringify(setting.value, null, 2));
    }
    setIsPublic(setting.is_public);
    setEditingKey(setting.key);
    setMessage("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let value: unknown = valueText;
    if (valueMode === "json") {
      try {
        value = JSON.parse(valueText);
      } catch {
        setMessage("Enter valid JSON for the setting value.");
        setIsError(true);
        return;
      }
    }
    const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!normalizedKey || normalizedKey !== key.trim().toLowerCase()) {
      setMessage("Setting keys may contain only lowercase letters, numbers, and underscores.");
      setIsError(true);
      return;
    }
    setSaving(true);
    const { error } = await client.from("site_settings").upsert({
      key: normalizedKey,
      value,
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
    if (error) {
      setMessage(`Could not save setting: ${error.message}`);
      setIsError(true);
    } else {
      setMessage("Website setting saved.");
      setIsError(false);
      reset();
      await load();
    }
    setSaving(false);
  };

  const remove = async (setting: Setting) => {
    if (!window.confirm(`Delete the "${setting.key}" setting?`)) return;
    setSaving(true);
    const { error } = await client.from("site_settings").delete().eq("key", setting.key);
    if (error) {
      setMessage(`Could not delete setting: ${error.message}`);
      setIsError(true);
    } else {
      setSettings((current) => current.filter((item) => item.key !== setting.key));
      if (editingKey === setting.key) reset();
      setMessage("Setting deleted.");
      setIsError(false);
    }
    setSaving(false);
  };

  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><span className="eyebrow">Content and links</span><h2>Website settings</h2><p>Edit public page introductions and homepage copy as plain text; use JSON for structured items such as support links and FAQs. Never store private keys or credentials here.</p></div>
    {message && <p className={isError ? "dashboard-message error" : "dashboard-message"} role={isError ? "alert" : "status"}>{message}</p>}
    <form className="admin-form-grid product-admin-form" onSubmit={(event) => void save(event)}>
      <label>Setting key<input required pattern="[a-z0-9_]+" value={key} onChange={(event) => setKey(event.target.value)} placeholder="homepage_intro" disabled={Boolean(editingKey)} /></label>
      <label>Value format<select value={valueMode} onChange={(event) => setValueMode(event.target.value === "json" ? "json" : "text")}><option value="text">Plain text</option><option value="json">JSON (objects/arrays)</option></select></label>
      <label className="full-width">{valueMode === "text" ? "Value (plain text)" : "Value (JSON)"}<textarea required rows={valueMode === "text" ? 3 : 7} value={valueText} onChange={(event) => setValueText(event.target.value)} /></label>
      <label className="checkbox-row"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Publicly readable</label>
      <div className="full-width form-actions"><button className="button primary" disabled={saving}>{saving ? "Saving…" : editingKey ? "Save setting" : "Add setting"}</button>{editingKey && <button className="button secondary" type="button" onClick={reset}>Cancel edit</button>}</div>
    </form>
    <div className="product-admin-list">{loading ? <p className="muted">Loading settings…</p> : settings.map((setting) => <article key={setting.key}>
      <div><strong>{setting.key}</strong><small>{setting.is_public ? "Public" : "Private"} · Updated {new Date(setting.updated_at).toLocaleString()}</small><pre className="setting-preview">{JSON.stringify(setting.value)}</pre></div>
      <div className="form-actions"><button type="button" disabled={saving} onClick={() => edit(setting)}>Edit</button><button type="button" className="danger-action" disabled={saving} onClick={() => void remove(setting)}>Delete</button></div>
    </article>)}</div>
  </section>;
}
