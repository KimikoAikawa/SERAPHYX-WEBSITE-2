import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import AdminAudit from "./AdminAudit";
import AdminContentManager, { contentManagers } from "./AdminContentManager";
import AdminMedia from "./AdminMedia";
import AdminOverview from "./AdminOverview";
import AdminOrders from "./AdminOrders";
import AdminSettings from "./AdminSettings";
import AdminUsers from "./AdminUsers";

type Props = {
  client: SupabaseClient;
  session: Session;
  role: string;
  onSignOut: () => void;
};

type ServerForm = {
  javaAddress: string;
  bedrockAddress: string;
  bedrockPort: string;
  eventsAddress: string;
  eventsPort: string;
  javaVersion: string;
  bedrockVersion: string;
  crossplay: "enabled" | "disabled" | "not-configured";
  description: string;
  gameplayType: string;
  discordInvite: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  published: boolean;
  available: boolean;
  featured: boolean;
  display_order: number;
  image_url: string | null;
  season_id: string | null;
};

type SeasonOption = { id: string; name: string; status: string };

type ProductForm = {
  slug: string;
  name: string;
  description: string;
  price: string;
  category: string;
  displayOrder: string;
  published: boolean;
  available: boolean;
  featured: boolean;
  imageUrl: string;
  seasonId: string;
};

const initialServerForm: ServerForm = {
  javaAddress: "play.seraphyx.fun",
  bedrockAddress: "play.seraphyx.fun",
  bedrockPort: "19293",
  eventsAddress: "seraphyxgames.atbp.fun",
  eventsPort: "19506",
  javaVersion: "",
  bedrockVersion: "",
  crossplay: "not-configured",
  description: "",
  gameplayType: "",
  discordInvite: "",
};

const emptyProduct: ProductForm = {
  slug: "",
  name: "",
  description: "",
  price: "",
  category: "Tokens",
  displayOrder: "0",
  published: false,
  available: true,
  featured: false,
  imageUrl: "",
  seasonId: "",
};

const formFromProduct = (product: ProductRow): ProductForm => ({
  slug: product.slug,
  name: product.name,
  description: product.description,
  price: (product.price_cents / 100).toFixed(2),
  category: product.category,
  displayOrder: String(product.display_order),
  published: product.published,
  available: product.available,
  featured: product.featured,
  imageUrl: product.image_url ?? "",
  seasonId: product.season_id ?? "",
});

function validPort(value: string) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

export default function AdminDashboard({ client, session, role, onSignOut }: Props) {
  const [activeSection, setActiveSection] = useState("overview");
  const [serverForm, setServerForm] = useState<ServerForm>(initialServerForm);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [seasons, setSeasons] = useState<SeasonOption[]>([]);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [editingProductId, setEditingProductId] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadProducts = async (isActive: () => boolean = () => true) => {
    try {
      const { data, error } = await client
        .from("products")
        .select("id,slug,name,description,price_cents,currency,category,published,available,featured,display_order,image_url,season_id")
        .order("display_order", { ascending: true });
      if (!isActive()) return;
      if (error) {
        setMessage(`Could not load products: ${error.message}`);
        setMessageIsError(true);
        setLoadingProducts(false);
        return;
      }
      setProducts((data ?? []) as ProductRow[]);
      setLoadingProducts(false);
    } catch {
      if (!isActive()) return;
      setMessage("Could not load products. Check the Supabase connection.");
      setMessageIsError(true);
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      const { data, error } = await client
        .from("server_config")
        .select("java_address,bedrock_address,bedrock_port,events_address,events_port,java_version,bedrock_version,crossplay,description,gameplay_type,discord_invite")
        .eq("id", 1)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setMessage(`Could not load server settings: ${error.message}`);
        setMessageIsError(true);
        return;
      }
      if (!data) {
        setMessage("The server configuration row is missing. Run the Supabase setup migration.");
        setMessageIsError(true);
        return;
      }
      setServerForm({
        javaAddress: data.java_address,
        bedrockAddress: data.bedrock_address,
        bedrockPort: data.bedrock_port,
        eventsAddress: data.events_address,
        eventsPort: data.events_port,
        javaVersion: data.java_version,
        bedrockVersion: data.bedrock_version,
        crossplay: data.crossplay === "enabled" || data.crossplay === "disabled" ? data.crossplay : "not-configured",
        description: data.description,
        gameplayType: data.gameplay_type,
        discordInvite: data.discord_invite,
      });
    };

    void loadSettings().catch(() => {
      if (active) {
        setMessage("Could not load server settings. Check the Supabase connection.");
        setMessageIsError(true);
      }
    });
    void loadProducts(() => active);
    void client.from("seasons").select("id,name,status").order("created_at", { ascending: false }).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage(`Could not load seasons for product assignment: ${error.message}`);
        setMessageIsError(true);
      } else {
        setSeasons((data ?? []) as SeasonOption[]);
      }
    });
    return () => {
      active = false;
    };
  }, [client]);

  const saveServerSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validPort(serverForm.bedrockPort) || !validPort(serverForm.eventsPort)) {
      setMessage("Bedrock and Events ports must be whole numbers from 1 to 65535.");
      setMessageIsError(true);
      return;
    }
    if (serverForm.discordInvite && !/^https?:\/\//i.test(serverForm.discordInvite)) {
      setMessage("The Discord invitation must be an http or https URL.");
      setMessageIsError(true);
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const { error } = await client.from("server_config").upsert({
        id: 1,
        java_address: serverForm.javaAddress.trim(),
        bedrock_address: serverForm.bedrockAddress.trim(),
        bedrock_port: serverForm.bedrockPort.trim(),
        events_address: serverForm.eventsAddress.trim(),
        events_port: serverForm.eventsPort.trim(),
        java_version: serverForm.javaVersion.trim(),
        bedrock_version: serverForm.bedrockVersion.trim(),
        crossplay: serverForm.crossplay,
        description: serverForm.description.trim(),
        gameplay_type: serverForm.gameplayType.trim(),
        discord_invite: serverForm.discordInvite.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (error) {
        setMessage(`Could not save server settings: ${error.message}`);
        setMessageIsError(true);
        return;
      }
      setMessage("Server settings saved. Public server pages will use the updated values.");
      setMessageIsError(false);
    } catch {
      setMessage("Could not save server settings. Check the Supabase connection.");
      setMessageIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(productForm.price);
    const displayOrder = Number(productForm.displayOrder);
    if (!productForm.slug.trim() || !productForm.name.trim() || !productForm.category.trim()) {
      setMessage("Product slug, name, and category are required.");
      setMessageIsError(true);
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(productForm.slug.trim())) {
      setMessage("Product slug may use letters, numbers, and single hyphens only.");
      setMessageIsError(true);
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(Math.round(price * 100))) {
      setMessage("Enter a valid non-negative product price.");
      setMessageIsError(true);
      return;
    }
    if (!Number.isInteger(displayOrder)) {
      setMessage("Display order must be a whole number.");
      setMessageIsError(true);
      return;
    }
    if (productForm.imageUrl && !/^https?:\/\//i.test(productForm.imageUrl)) {
      setMessage("Product image URL must start with http:// or https://.");
      setMessageIsError(true);
      return;
    }

    setSubmitting(true);
    setMessage("");
    const productData = {
      slug: productForm.slug.trim().toLowerCase(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price_cents: Math.round(price * 100),
      currency: "PHP",
      category: productForm.category.trim(),
      published: productForm.published,
      available: productForm.available,
      featured: productForm.featured,
      display_order: displayOrder,
      image_url: productForm.imageUrl.trim() || null,
      season_id: productForm.seasonId || null,
      updated_at: new Date().toISOString(),
    };
    try {
      const result = editingProductId
        ? await client.from("products").update(productData).eq("id", editingProductId)
        : await client.from("products").insert(productData);
      if (result.error) {
        setMessage(`Could not save product: ${result.error.message}`);
        setMessageIsError(true);
        return;
      }
      setProductForm(emptyProduct);
      setEditingProductId("");
      setMessage("Product saved.");
      setMessageIsError(false);
      await loadProducts();
    } catch {
      setMessage("Could not save product. Check the Supabase connection.");
      setMessageIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (product: ProductRow) => {
    if (!window.confirm(`Delete "${product.name}" from the catalog? Historical order item snapshots are retained.`)) return;
    setSubmitting(true);
    try {
      const { error } = await client.from("products").delete().eq("id", product.id);
      if (error) {
        setMessage(`Could not delete product: ${error.message}`);
        setMessageIsError(true);
        return;
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingProductId === product.id) {
        setEditingProductId("");
        setProductForm(emptyProduct);
      }
      setMessage("Product deleted.");
      setMessageIsError(false);
    } catch {
      setMessage("Could not delete product. Check the Supabase connection.");
      setMessageIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const setServerField = <K extends keyof ServerForm>(field: K, value: ServerForm[K]) => {
    setServerForm((current) => ({ ...current, [field]: value }));
  };
  const setProductField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const uploadProductImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      setMessage("Choose an image no larger than 10 MB.");
      setMessageIsError(true);
      return;
    }
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) {
      setMessage("Your administrator session could not be verified. Sign in again and retry.");
      setMessageIsError(true);
      return;
    }
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "img";
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    setUploadingImage(true);
    setMessage("");
    const { error: uploadError } = await client.storage.from("site-media").upload(path, file, { contentType: file.type });
    if (uploadError) {
      setMessage(`Image upload failed: ${uploadError.message}`);
      setMessageIsError(true);
      setUploadingImage(false);
      return;
    }
    const { data: { publicUrl } } = client.storage.from("site-media").getPublicUrl(path);
    const { error: mediaError } = await client.from("media").insert({
      file_name: file.name,
      file_url: publicUrl,
      storage_path: path,
      content_type: file.type,
      size_bytes: file.size,
      uploaded_by: user.id,
    });
    if (mediaError) {
      const { error: cleanupError } = await client.storage.from("site-media").remove([path]);
      setMessage(cleanupError
        ? `Media record failed (${mediaError.message}); uploaded image could not be removed (${cleanupError.message}).`
        : `Media record failed; uploaded image was removed. ${mediaError.message}`);
      setMessageIsError(true);
    } else {
      setProductField("imageUrl", publicUrl);
      setMessage("Image uploaded. Save the product to apply it.");
      setMessageIsError(false);
    }
    setUploadingImage(false);
  };

  const dashboardSections = [
    ["overview", "Overview"], ["server", "Server info"], ["homepage", "Homepage & settings"], ["features", "Features"],
    ["rule_categories", "Rule categories"], ["rules", "Rules"], ["punishments", "Punishments"],
    ["titles", "Titles"], ["store", "Store"], ["orders", "Orders"], ["downloads", "Downloads"],
    ["seasons", "Seasons"], ["announcements", "News"], ["staff", "Staff"],
    ["leaderboard_entries", "Leaderboard"], ["media", "Media"], ["support", "Support & FAQs"],
    ...(role === "owner" ? [["users", "Users & roles"]] : []), ["audit", "Audit log"],
  ] as const;
  const contentSection = activeSection in contentManagers ? activeSection : "";

  if (!["owner", "administrator", "editor"].includes(role)) {
    return (
      <main className="admin-page">
        <section className="login-card">
          <span className="eyebrow">Administration</span>
          <h1>Limited access</h1>
          <p className="admin-message">This account's role does not have permission to manage website content.</p>
          <button className="button primary" type="button" onClick={onSignOut}>Sign out</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page dashboard-page">
      <section className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Administration</span>
            <h1>Website controls</h1>
            <p>{session.user.email} · {role}</p>
          </div>
          <button className="button secondary" type="button" onClick={onSignOut}>Sign out</button>
        </header>

        <nav className="dashboard-tabs" aria-label="Dashboard sections">
          {dashboardSections.map(([id, label]) => <button className={activeSection === id ? "selected" : ""} key={id} type="button" onClick={() => setActiveSection(id)}>{label}</button>)}
        </nav>

        {message && <p className={messageIsError ? "dashboard-message error" : "dashboard-message"} role={messageIsError ? "alert" : "status"}>{message}</p>}

        {activeSection === "overview" && <AdminOverview client={client} onNavigate={setActiveSection} />}
        {activeSection === "server" && (
          <form className="dashboard-panel admin-form-grid" onSubmit={(event) => void saveServerSettings(event)}>
            <div className="dashboard-panel-heading"><span className="eyebrow">Connection details</span><h2>Server settings</h2></div>
            <label>Java address<input required value={serverForm.javaAddress} onChange={(event) => setServerField("javaAddress", event.target.value)} /></label>
            <label>Bedrock address<input required value={serverForm.bedrockAddress} onChange={(event) => setServerField("bedrockAddress", event.target.value)} /></label>
            <label>Bedrock port<input required inputMode="numeric" value={serverForm.bedrockPort} onChange={(event) => setServerField("bedrockPort", event.target.value)} /></label>
            <label>Events address<input required value={serverForm.eventsAddress} onChange={(event) => setServerField("eventsAddress", event.target.value)} /></label>
            <label>Events port<input required inputMode="numeric" value={serverForm.eventsPort} onChange={(event) => setServerField("eventsPort", event.target.value)} /></label>
            <label>Java version<input placeholder="Not specified" value={serverForm.javaVersion} onChange={(event) => setServerField("javaVersion", event.target.value)} /></label>
            <label>Bedrock version<input placeholder="Not specified" value={serverForm.bedrockVersion} onChange={(event) => setServerField("bedrockVersion", event.target.value)} /></label>
            <label>Crossplay<select value={serverForm.crossplay} onChange={(event) => setServerField("crossplay", event.target.value as ServerForm["crossplay"])}><option value="not-configured">Not configured</option><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
            <label>Gameplay type<input placeholder="Not specified" value={serverForm.gameplayType} onChange={(event) => setServerField("gameplayType", event.target.value)} /></label>
            <label>Discord invitation URL<input type="url" placeholder="Not linked" value={serverForm.discordInvite} onChange={(event) => setServerField("discordInvite", event.target.value)} /></label>
            <label className="full-width">Server description<textarea rows={3} value={serverForm.description} onChange={(event) => setServerField("description", event.target.value)} /></label>
            <div className="full-width"><button className="button primary" type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save server settings"}</button></div>
          </form>
        )}

        {activeSection === "homepage" && <AdminSettings client={client} />}
        {contentSection && contentSection !== "store" && <AdminContentManager key={contentSection} client={client} managerKey={contentSection} />}
        {activeSection === "orders" && <AdminOrders client={client} />}
        {activeSection === "media" && <AdminMedia client={client} />}
        {activeSection === "support" && <AdminSettings client={client} />}
        {activeSection === "users" && role === "owner" && <AdminUsers client={client} />}
        {activeSection === "audit" && <AdminAudit client={client} />}

        {activeSection === "store" && (
          <div className="dashboard-panel">
            <div className="dashboard-panel-heading"><span className="eyebrow">Database-managed</span><h2>Store catalog</h2><p>{products.length} products · prices stored in PHP centavos</p></div>
            <form className="admin-form-grid product-admin-form" onSubmit={(event) => void saveProduct(event)}>
              <label>Product slug<input required value={productForm.slug} onChange={(event) => setProductField("slug", event.target.value)} /></label>
              <label>Name<input required value={productForm.name} onChange={(event) => setProductField("name", event.target.value)} /></label>
              <label>Price (PHP)<input required type="number" min="0" step="0.01" value={productForm.price} onChange={(event) => setProductField("price", event.target.value)} /></label>
              <label>Category<input required value={productForm.category} onChange={(event) => setProductField("category", event.target.value)} /></label>
              <label>Display order<input required type="number" step="1" value={productForm.displayOrder} onChange={(event) => setProductField("displayOrder", event.target.value)} /></label>
              <label>Product image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingImage} onChange={(event) => void uploadProductImage(event)} />
                {uploadingImage && <small>Uploading securely…</small>}{productForm.imageUrl && <img className="admin-image-preview" src={productForm.imageUrl} alt="Product preview" />}
              </label>
              <label>Season<select value={productForm.seasonId} onChange={(event) => setProductField("seasonId", event.target.value)}><option value="">All seasons</option>{seasons.map((season) => <option value={season.id} key={season.id}>{season.name} · {season.status}</option>)}</select></label>
              <label className="full-width">Description<textarea rows={3} value={productForm.description} onChange={(event) => setProductField("description", event.target.value)} /></label>
              <div className="checkbox-row full-width">
                <label><input type="checkbox" checked={productForm.published} onChange={(event) => setProductField("published", event.target.checked)} /> Published</label>
                <label><input type="checkbox" checked={productForm.available} onChange={(event) => setProductField("available", event.target.checked)} /> Available</label>
                <label><input type="checkbox" checked={productForm.featured} onChange={(event) => setProductField("featured", event.target.checked)} /> Featured</label>
              </div>
              <div className="full-width form-actions">
                <button className="button primary" type="submit" disabled={submitting || uploadingImage}>{submitting ? "Saving..." : editingProductId ? "Update product" : "Add product"}</button>
                {editingProductId && <button className="button secondary" type="button" onClick={() => { setEditingProductId(""); setProductForm(emptyProduct); }}>Cancel edit</button>}
              </div>
            </form>

            {loadingProducts ? <p className="muted">Loading products…</p> : (
              <div className="product-admin-list">
                {products.map((product) => (
                  <article key={product.id}>
                    <div><strong>{product.name}</strong><small>{product.category} · ₱{(product.price_cents / 100).toLocaleString("en-PH", { maximumFractionDigits: 2 })} · {product.published ? "Published" : "Draft"}{product.season_id ? ` · ${seasons.find((season) => season.id === product.season_id)?.name ?? "Season"}` : " · All seasons"}</small></div>
                    <div className="form-actions">
                      <button type="button" onClick={() => { setEditingProductId(product.id); setProductForm(formFromProduct(product)); }}>Edit</button>
                      <button type="button" className="danger-action" disabled={submitting} onClick={() => void deleteProduct(product)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
