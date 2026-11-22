import { useEffect, useMemo, useState } from "react";
import { usePublicSetting } from "./usePublicData";

type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  category: string;
  published: boolean;
  available: boolean;
  display_order: number;
  image_url: string | null;
  featured: boolean;
  season_id: string | null;
};

const defaultIntroduction = [
  "Hello, @everyone!",
  "After careful consideration, we've realized that relying entirely on a grind-focused, fair-to-play system may not be enough to sustain the server in the long run.",
  "To help keep SERAPHYX running and support its continued development, we're introducing optional purchases for certain in-game items.",
  "These purchases are completely optional. You can either support the server by purchasing them or obtain these items through regular gameplay. Nothing is forcing you to spend money to enjoy the server!",
];
const defaultSupportMessage = [
  "Every donation and purchase means a lot to us.",
  "Your support helps cover server expenses, maintain its services, and fund future updates and improvements.",
  "As a small token of appreciation, every supporter will also receive an exclusive Donator Title!",
  "Thank you for being part of SERAPHYX and helping us keep the server alive. Whether you choose to support us by purchasing or simply enjoy grinding for everything in-game, we appreciate you just the same.",
  "Your support keeps SERAPHYX alive!",
];

function priceLabel(priceCents: number, currency: string) {
  if (currency !== "PHP") return `${currency} ${(priceCents / 100).toFixed(2)}`;
  return `₱${(priceCents / 100).toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

export default function StorePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<Record<string, number>>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem("seraphyx-store-cart") ?? "{}");
      if (typeof stored !== "object" || stored === null || Array.isArray(stored)) return {};
      return Object.fromEntries(Object.entries(stored).filter(([, quantity]) => Number.isSafeInteger(quantity) && Number(quantity) > 0)) as Record<string, number>;
    } catch {
      return {};
    }
  });
  const [addedProductId, setAddedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [cartError, setCartError] = useState("");
  const [minecraftUsername, setMinecraftUsername] = useState("");
  const [discordContact, setDiscordContact] = useState("");
  const { value: introduction } = usePublicSetting<string[]>("store_introduction", defaultIntroduction);
  const { value: supportMessage } = usePublicSetting<string[]>("store_support_message", defaultSupportMessage);
  const { value: rankupDisclaimer } = usePublicSetting<string>("rankup_disclaimer", "Purchasing a rankup material does not automatically grant the corresponding in-game rank. You must already have the required previous rank and satisfy all in-game progression conditions. For example, a player purchasing LUCIFER must already have BEHEMOTH.");
  const { value: customTitlePolicy } = usePublicSetting<string>("custom_title_policy", "Naming restrictions, approval, and delivery conditions have not yet been configured.");

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      const { supabase } = await import("./supabase");
      if (!active) return;
      if (!supabase) {
        setLoadError("The store database is not configured.");
        setLoading(false);
        return;
      }

      const [{ data, error }, { data: activeSeason, error: seasonError }] = await Promise.all([
        supabase
        .from("products")
        .select("id,slug,name,description,price_cents,currency,category,published,available,display_order,image_url,featured,season_id")
        .eq("published", true)
        .eq("available", true)
        .order("display_order", { ascending: true }),
        supabase.from("seasons").select("id").eq("status", "active").maybeSingle(),
      ]);
      if (!active) return;
      if (error) {
        setLoadError("The store catalog could not be loaded. Please try again later.");
        setLoading(false);
        return;
      }
      if (seasonError) {
        setLoadError("The active season could not be verified, so seasonal products are hidden.");
        setLoading(false);
        return;
      }
      setProducts(((data ?? []) as StoreProduct[]).filter((product) => !product.season_id || product.season_id === activeSeason?.id));
      setLoading(false);
    };

    void loadProducts().catch(() => {
      if (!active) return;
      setLoadError("The store catalog could not be loaded. Please try again later.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("seraphyx-store-cart", JSON.stringify(cart));
    } catch {
      setCartError("Your cart could not be saved in this browser.");
    }
  }, [cart]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );
  const visibleProducts = selectedCategory === "All"
    ? products
    : products.filter((product) => product.category === selectedCategory);
  const cartItems = products.filter((product) => (cart[product.id] ?? 0) > 0);
  const subtotal = cartItems.reduce((sum, product) => sum + product.price_cents * cart[product.id], 0);
  const hasRankupMaterial = cartItems.some((product) => product.category === "Celestial" || product.category === "Infernal");

  const addToCart = (productId: string) => {
    setCart((current) => ({ ...current, [productId]: Math.min(Number.MAX_SAFE_INTEGER, (current[productId] ?? 0) + 1) }));
    setAddedProductId(productId);
    window.setTimeout(() => setAddedProductId((current) => current === productId ? "" : current), 1600);
  };

  const changeQuantity = (productId: string, change: number) => {
    setCart((current) => {
      const quantity = (current[productId] ?? 0) + change;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  };

  return (
    <>
      <section className="page-hero store-hero">
        <div className="page-hero-sky" aria-hidden="true"><i /><i /><i /><b /><b /></div>
        <div className="page-hero-content">
          <span className="eyebrow">Support the realm</span>
          <h1>SERAPHYX STORE</h1>
          <p>Optional packages to support the server and its continued development.</p>
        </div>
      </section>

      <section className="section store-introduction">
        <span className="eyebrow">A note from the team</span>
        <h2>Every purchase is optional</h2>
        {(Array.isArray(introduction) ? introduction : [String(introduction)]).map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}
      </section>

      <section className="section store-section">
        <div className="section-heading">
          <div><span className="eyebrow">Official catalog</span><h2>Choose your offering</h2></div>
        </div>
        <div className="toolbar store-category-bar">
          <label htmlFor="store-category">Category</label>
          <select id="store-category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>

        {loading && <div className="empty-state"><h3>Loading catalog</h3><p>Connecting to the official store…</p></div>}
        {!loading && loadError && <div className="empty-state"><h3>Catalog unavailable</h3><p>{loadError}</p></div>}
        {!loading && !loadError && products.length === 0 && <div className="empty-state"><h3>No products available</h3><p>The catalog is empty or all products are currently unpublished.</p></div>}

        {!loading && !loadError && visibleProducts.length > 0 && (
          <div className="store-layout">
            <div className="store-grid">
              {visibleProducts.map((product) => {
                const rankup = product.category === "Celestial" || product.category === "Infernal";
                return (
                  <article className={`store-product ${rankup ? `store-${product.category.toLowerCase()}` : ""}`} key={product.id}>
                    {product.image_url ? <img className="store-product-image" loading="lazy" src={product.image_url} alt="" /> : <div className="store-item-icon" aria-hidden="true"><span /></div>}
                    <span className="card-kicker">{product.category}</span>
                    <h3>{product.name}</h3>
                    <p className="store-product-description">{product.description}</p>
                    <strong className="store-price">{priceLabel(product.price_cents, product.currency)}</strong>
                    {product.category === "Custom Title" && <p className="muted">{customTitlePolicy}</p>}
                    {rankup && (
                      <details className="product-disclaimer">
                        <summary>Rankup material conditions</summary>
                        <p>{rankupDisclaimer} {product.name === "LUCIFER" && "You must already have BEHEMOTH before pursuing LUCIFER."}</p>
                      </details>
                    )}
                    <button className="text-link product-details-button" type="button" onClick={() => setSelectedProduct(product)}>Product details →</button>
                    <button className="button secondary store-add-button" type="button" onClick={() => addToCart(product.id)}>
                      {addedProductId === product.id ? "Added to cart" : "Add to cart"}
                    </button>
                  </article>
                );
              })}
            </div>

            <aside className="store-cart" aria-label="Shopping cart">
              <span className="eyebrow">Your selection</span>
              <h2>Cart <small>({cartItems.reduce((sum, product) => sum + cart[product.id], 0)})</small></h2>
              {cartItems.length === 0 ? <p className="muted">Add an item to see your order summary.</p> : (
                <>
                  <label>Minecraft username<input autoComplete="off" maxLength={16} value={minecraftUsername} onChange={(event) => setMinecraftUsername(event.target.value)} placeholder="In-game player name" /></label>
                  <label>Discord username or contact<input autoComplete="off" maxLength={100} value={discordContact} onChange={(event) => setDiscordContact(event.target.value)} placeholder="How the team can contact you" /></label>
                  <ul className="cart-items">
                    {cartItems.map((product) => (
                      <li key={product.id}>
                        <div><strong>{product.name}</strong><small>{priceLabel(product.price_cents, product.currency)} each</small></div>
                        <div className="quantity-controls">
                          <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => changeQuantity(product.id, -1)}>−</button>
                          <span>{cart[product.id]}</span>
                          <button type="button" aria-label={`Add one ${product.name}`} onClick={() => changeQuantity(product.id, 1)}>+</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="cart-subtotal"><span>Subtotal</span><strong>{priceLabel(subtotal, "PHP")}</strong></div>
                </>
              )}
              {hasRankupMaterial && <p className="rankup-warning">{rankupDisclaimer}</p>}
              {cartError && <p className="admin-message" role="status">{cartError}</p>}
              <button className="button primary store-checkout" type="button" disabled>
                Checkout unavailable
              </button>
              <p className="checkout-note">Payments are pending payment-provider configuration. No charge or purchase can be made from this site yet. {(minecraftUsername || discordContact) && "The contact details entered above are not submitted or stored."}</p>
            </aside>
          </div>
        )}
      </section>

      <section className="section store-support">
        <span className="eyebrow">Thank you for being here</span>
        <h2>A LITTLE SUPPORT GOES A LONG WAY</h2>
        {(Array.isArray(supportMessage) ? supportMessage : [String(supportMessage)]).map((paragraph, index) => <p key={`${index}-${paragraph}`}>{paragraph}</p>)}
      </section>
      {selectedProduct && <div className="content-modal-backdrop" role="presentation" onClick={() => setSelectedProduct(null)}><section className="content-modal store-product-modal" role="dialog" aria-modal="true" aria-labelledby="store-product-modal-title" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" type="button" aria-label="Close product details" onClick={() => setSelectedProduct(null)}>×</button>
        {selectedProduct.image_url && <img src={selectedProduct.image_url} alt="" />}
        <span className="card-kicker">{selectedProduct.category}</span><h2 id="store-product-modal-title">{selectedProduct.name}</h2><p>{selectedProduct.description}</p><strong className="store-price">{priceLabel(selectedProduct.price_cents, selectedProduct.currency)}</strong>
        {(selectedProduct.category === "Celestial" || selectedProduct.category === "Infernal") && <p className="rankup-warning">{rankupDisclaimer} {selectedProduct.name === "LUCIFER" && "You must already have BEHEMOTH before pursuing LUCIFER."}</p>}
        {selectedProduct.category === "Custom Title" && <p>{customTitlePolicy}</p>}
        <button className="button primary" type="button" onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}>Add to cart</button>
      </section></div>}
    </>
  );
}
