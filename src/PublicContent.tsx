import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useServerConfig } from "./useServerConfig";
import { usePublicRows, usePublicSetting } from "./usePublicData";

type Feature = { id: string; title: string; description: string; category: string; image_url: string | null; video_url: string | null; featured: boolean; season_id: string | null };
type RuleCategory = { id: string; name: string; display_order: number };
type Rule = { id: string; category: string; content: string; display_order: number; updated_at: string };
type Punishment = { id: string; name: string; display_order: number };
type TermsSection = { title: string; items: string[] };
type Title = { id: number; name: string; description: string; requirements: string; category: string; rarity: string; reward: string; special_conditions: string; image_url: string | null; featured: boolean; discord_only: boolean };
type Announcement = { id: string; title: string; description: string; featured_image: string | null; author_name: string; category: string; pinned: boolean; publish_at: string | null; created_at: string; season_id?: string | null };
type Staff = { id: string; minecraft_name: string; discord_name: string | null; position: string; biography: string; profile_image: string | null; featured?: boolean };
type Product = { id: string; name: string; description: string; category: string; price_cents: number; currency: string; image_url: string | null; season_id: string | null; featured: boolean };
type Download = { id: string; title: string; description: string; category: string; version: string; storage_path: string; file_name: string; size_bytes: number; created_at: string; season_id: string | null };
type Season = { id: string; slug: string; name: string; description: string; banner_url: string | null; starts_at: string | null; ends_at: string | null; status: string };
type LeaderboardEntry = { id: string; player_name: string; wins: number; playtime_minutes: number; kills: number; updated_at: string };

const TITLE_RARITY_ORDER = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Exclusive", "Discord Exclusive", "Coming Soon"];

function titleRarityClass(rarity: string) {
  return `rarity-${rarity.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function titleRarityRank(rarity: string) {
  const index = TITLE_RARITY_ORDER.indexOf(rarity);
  return index < 0 ? TITLE_RARITY_ORDER.length : index;
}

function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <section className="page-hero"><div className="page-hero-sky" aria-hidden="true"><i /><i /><i /><b /><b /></div><div className="page-hero-content"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div></section>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="crystal-small" /><h3>{title}</h3><p>{text}</p></div>;
}

function dateLabel(value: string | null) {
  if (!value) return "Date not specified";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatPrice(cents: number, currency: string) {
  return currency === "PHP" ? `₱${(cents / 100).toLocaleString("en-PH", { maximumFractionDigits: 2 })}` : `${currency} ${(cents / 100).toFixed(2)}`;
}

export function FeaturesPage() {
  const { value: introduction } = usePublicSetting("features_page_intro", "Explore the features configured for SERAPHYX SMP.");
  const { rows, loading, error } = usePublicRows<Feature>("features", "id,title,description,category,image_url,video_url,featured,season_id", "display_order", [["published", true]]);
  const [selected, setSelected] = useState<Feature | null>(null);
  return <>
    <PageHero eyebrow="Gameplay" title="Server features" text={introduction} />
    <section className="section">
      {loading ? <EmptyState title="Loading features" text="Fetching published server details…" /> : error ? <EmptyState title="Features unavailable" text={error} /> : rows.length === 0 ? <EmptyState title="Features not yet configured" text="No confirmed server features have been published. The team can add verified details in the admin dashboard." /> : (
        <div className="content-grid">
          {rows.map((feature) => <article className="content-card" key={feature.id}>
            {feature.image_url && <img loading="lazy" src={feature.image_url} alt="" />}
            <span className="card-kicker">{feature.category}{feature.featured ? " · Featured" : ""}</span>
            <h2>{feature.title}</h2><p>{feature.description}</p>
            <button type="button" className="text-link" onClick={() => setSelected(feature)}>View details →</button>
          </article>)}
        </div>
      )}
    </section>
    {selected && <div className="content-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="content-modal" role="dialog" aria-modal="true" aria-labelledby="feature-modal-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" type="button" aria-label="Close details" onClick={() => setSelected(null)}>×</button>
      {selected.image_url && <img src={selected.image_url} alt="" />}
      <span className="card-kicker">{selected.category}</span><h2 id="feature-modal-title">{selected.title}</h2><p>{selected.description}</p>
      {selected.video_url && <a className="button secondary" href={selected.video_url} target="_blank" rel="noreferrer">Watch feature video</a>}
    </section></div>}
  </>;
}

export function RulesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const { value: introduction } = usePublicSetting(
    "rules_introduction",
    "Welcome to SERAPHYX SMP! Our goal is to maintain a safe, fair, and enjoyable environment for everyone. Please read and follow all community guidelines to ensure a positive experience for every member.",
  );
  const { value: signoff } = usePublicSetting(
    "rules_signoff",
    "SERAPHYX SMP • Respect Everyone • Stay Safe • Have Fun 💜",
  );
  const categories = usePublicRows<RuleCategory>("rule_categories", "id,name,display_order", "display_order");
  const rules = usePublicRows<Rule>("rules", "id,category,content,display_order,updated_at", "display_order", [["published", true]]);
  const punishments = usePublicRows<Punishment>("punishment_steps", "id,name,display_order", "display_order", [["published", true]]);
  const filtered = useMemo(() => rules.rows.filter((rule) =>
    (category === "All" || rule.category === category) && rule.content.toLowerCase().includes(query.toLowerCase())
  ), [rules.rows, category, query]);
  const groups = categories.rows.map((item) => ({ ...item, rules: filtered.filter((rule) => rule.category === item.name) }))
    .filter((item) => category === "All" || item.name === category);
  const lastUpdated = rules.rows.reduce<string | null>((latest, rule) => !latest || rule.updated_at > latest ? rule.updated_at : latest, null);
  return <>
    <PageHero eyebrow="Community standards" title="SERAPHYX SMP • COMMUNITY RULES" text={introduction} />
    <section className="section">
      <div className="toolbar"><input aria-label="Search rules" placeholder="Search rules…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)}><option>All</option>{categories.rows.map((item) => <option key={item.id}>{item.name}</option>)}</select></div>
      {categories.error || rules.error ? <EmptyState title="Rules unavailable" text={categories.error || rules.error} /> : (
        <div className="rules-layout">
          {groups.map((item) => <details className="rule-card" key={item.id}>
            <summary><span className="rule-glyph" /><h2>{item.name}</h2><b>{item.rules.length}</b></summary>
            {item.rules.length ? <ul>{item.rules.map((rule) => <li key={rule.id}>{rule.content}</li>)}</ul> : <p className="muted rule-empty">No official rules have been published in this category.</p>}
          </details>)}
          {!rules.loading && filtered.length === 0 && query && <EmptyState title="No matching rules" text="Try another search or category." />}
        </div>
      )}
      {!categories.loading && categories.rows.length === 0 && <EmptyState title="Rule categories are not configured" text="Add categories in the admin dashboard." />}
      <div className="punishment-path">{punishments.rows.map((step, index) => <div key={step.id}><span>{index + 1}</span><strong>{step.name}</strong></div>)}</div>
      <p className="rules-signoff">{signoff}</p>
      {lastUpdated && <p className="muted content-updated">Rules last updated {dateLabel(lastUpdated)}.</p>}
      {punishments.error && <p className="muted">{punishments.error}</p>}
    </section>
  </>;
}

export function TermsPage() {
  const introduction = usePublicSetting(
    "terms_introduction",
    "By joining, accessing, purchasing from, or participating in SERAPHYX SMP and its associated Discord server, you confirm that you have read, understood, and agreed to the terms and policies outlined below.",
  );
  const sections = usePublicSetting<TermsSection[]>("terms_sections", []);
  const signoff = usePublicSetting(
    "terms_signoff",
    "SERAPHYX SMP • Safe Community • Protected Environment • Fair Gameplay",
  );
  const loading = introduction.loading || sections.loading || signoff.loading;
  const error = introduction.error || sections.error || signoff.error;
  return <>
    <PageHero eyebrow="Community policies" title="SERAPHYX SMP • TERMS OF SERVICE & LEGAL POLICY" text={introduction.value} />
    <section className="section">
      {loading ? <EmptyState title="Loading terms" text="Fetching the published Terms of Service…" /> : error ? <EmptyState title="Terms unavailable" text={error} /> : sections.value.length ? (
        <div className="legal-document">
          {sections.value.map((section) => <article className="legal-section" key={section.title}>
            <h2>{section.title}</h2>
            <ul>{section.items.map((item, index) => <li key={`${section.title}-${index}`}>{item}</li>)}</ul>
          </article>)}
          <p className="rules-signoff">{signoff.value}</p>
        </div>
      ) : <EmptyState title="Terms not configured" text="The Terms of Service have not been published yet." />}
    </section>
  </>;
}

export function TitlesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [rarity, setRarity] = useState("All");
  const [sort, setSort] = useState("Display order");
  const { rows, loading, error } = usePublicRows<Title>("titles", "id,name,description,requirements,category,rarity,reward,special_conditions,image_url,featured,discord_only", "display_order", [["published", true]]);
  const { value: introduction } = usePublicSetting(
    "titles_introduction",
    "Earn your achievements, prove your abilities, and establish your legacy. Each title represents a milestone, accomplishment, or exclusive achievement within SERAPHYX SMP.",
  );
  const categories = useMemo(() => ["All", ...new Set(rows.map((title) => title.category || title.rarity).filter(Boolean))], [rows]);
  const rarities = useMemo(() => [...new Set(rows.map((title) => title.rarity).filter(Boolean))]
    .sort((a, b) => titleRarityRank(a) - titleRarityRank(b) || a.localeCompare(b)), [rows]);
  const filtered = useMemo(() => rows.filter((title) =>
    (category === "All" || (title.category || title.rarity) === category) &&
    (rarity === "All" || title.rarity === rarity) &&
    `${title.name} ${title.category} ${title.rarity} ${title.description} ${title.requirements} ${title.special_conditions}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => sort === "Name" ? a.name.localeCompare(b.name) : sort === "Category" ? a.category.localeCompare(b.category) || a.id - b.id : sort === "Rarity" ? titleRarityRank(a.rarity) - titleRarityRank(b.rarity) || a.id - b.id : a.id - b.id), [rows, category, rarity, query, sort]);
  return <>
    <PageHero eyebrow="Achievements" title="IN-GAME TITLES & SPECIAL RECOGNITION" text={introduction} />
    <section className="section">
      <div className="title-rarity-legend" aria-label="Filter titles by rarity">
        {rarities.map((level) => <button className={`rarity-chip ${titleRarityClass(level)}`} key={level} type="button" aria-pressed={rarity === level} onClick={() => setRarity(rarity === level ? "All" : level)}>{level}</button>)}
      </div>
      <div className="toolbar"><input aria-label="Search titles" placeholder="Search titles…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Filter titles" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filter by rarity" value={rarity} onChange={(event) => setRarity(event.target.value)}><option>All</option>{rarities.map((level) => <option key={level}>{level}</option>)}</select>
        <select aria-label="Sort titles" value={sort} onChange={(event) => setSort(event.target.value)}><option>Display order</option><option>Name</option><option>Category</option><option>Rarity</option></select></div>
      {loading ? <EmptyState title="Loading titles" text="Fetching published titles…" /> : error ? <EmptyState title="Titles unavailable" text={error} /> : filtered.length ? <div className="title-grid">
        {filtered.map((title) => <article className={`title-card ${title.discord_only ? "special" : ""} ${titleRarityClass(title.rarity)}`} key={title.id}>
          {title.image_url ? <img className="title-image" loading="lazy" src={title.image_url} alt="" /> : <div className="title-gem" />}
          <div className="title-meta"><span className="title-category">{title.category || title.rarity}{title.featured ? " · Featured" : ""}</span><span className="title-rarity">{title.rarity}</span></div><h2>{title.name}</h2>
          {title.description && <p>{title.description}</p>}
          {title.requirements && <p className="title-requirements">{title.requirements}</p>}
          {title.reward && <small>Reward: {title.reward}</small>}
          {title.special_conditions && <small>{title.special_conditions}</small>}
          {title.discord_only && <strong>Discord-only recognition · Not purchasable</strong>}
        </article>)}
      </div> : <EmptyState title="No published titles" text="The known special recognition is managed by the server team. The remaining title names and details have not been supplied yet." />}
    </section>
  </>;
}

export function NewsPage() {
  const { value: introduction } = usePublicSetting("news_page_intro", "Published server updates and community announcements.");
  const { rows, loading, error } = usePublicRows<Announcement>("announcements", "id,title,description,featured_image,author_name,category,pinned,publish_at,created_at", "publish_at", [["status", "published"]], false);
  return <>
    <PageHero eyebrow="Updates" title="News & announcements" text={introduction} />
    <section className="section">
      {loading ? <EmptyState title="Loading announcements" text="Fetching published news…" /> : error ? <EmptyState title="News unavailable" text={error} /> : rows.length ? <div className="content-grid">
        {rows.map((item) => <article className="content-card news-card" key={item.id}>
          {item.featured_image && <img loading="lazy" src={item.featured_image} alt="" />}
          <span className="card-kicker">{item.category}{item.pinned ? " · Featured" : ""}</span>
          <h2>{item.title}</h2><p className="muted">{item.author_name || "SERAPHYX SMP"} · {dateLabel(item.publish_at || item.created_at)}</p><p>{item.description}</p>
        </article>)}
      </div> : <EmptyState title="No published announcements" text="New articles will appear here after an administrator publishes them." />}
    </section>
  </>;
}

export function StaffPage() {
  const { value: introduction } = usePublicSetting("staff_page_intro", "Meet the people helping shape SERAPHYX SMP.");
  const { rows, loading, error } = usePublicRows<Staff>("staff", "id,minecraft_name,discord_name,position,biography,profile_image,featured", "display_order", [["published", true]]);
  return <>
    <PageHero eyebrow="The team" title="Staff directory" text={introduction} />
    <section className="section">
      {loading ? <EmptyState title="Loading staff" text="Fetching published profiles…" /> : error ? <EmptyState title="Staff directory unavailable" text={error} /> : rows.length ? <div className="content-grid staff-grid">
        {rows.map((person) => <article className="content-card staff-card" key={person.id}>
          {person.profile_image ? <img loading="lazy" src={person.profile_image} alt={`${person.minecraft_name} profile`} /> : <div className="staff-avatar" aria-hidden="true">{person.minecraft_name.slice(0, 1).toUpperCase()}</div>}
          <span className="card-kicker">{person.position}</span><h2>{person.minecraft_name}</h2>
          {person.discord_name && /^https?:\/\//i.test(person.discord_name) ? <a href={person.discord_name} target="_blank" rel="noreferrer">Public Discord profile</a> : person.discord_name && <p className="muted">{person.discord_name}</p>}
          <p>{person.biography}</p>
        </article>)}
      </div> : <EmptyState title="Staff directory not configured" text="No staff profiles have been published. Staff details are never invented." />}
    </section>
  </>;
}

export function DownloadsPage() {
  const { value: introduction } = usePublicSetting("downloads_page_intro", "Published server files and community resources, delivered from secure cloud storage.");
  const { rows, loading, error } = usePublicRows<Download>("downloads", "id,title,description,category,version,storage_path,file_name,size_bytes,created_at,season_id", "created_at", [["published", true]], false);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const downloadFile = async (item: Download) => {
    setDownloading(item.id);
    setDownloadError("");
    try {
      const { supabase } = await import("./supabase");
      if (!supabase) throw new Error("Download storage is not configured.");
      const { data, error: signedError } = await supabase.storage.from("download-files").createSignedUrl(item.storage_path, 120, { download: item.file_name });
      if (signedError) throw signedError;
      window.location.assign(data.signedUrl);
    } catch {
      setDownloadError("This file is not available right now. Please contact the server team.");
    } finally {
      setDownloading("");
    }
  };
  return <>
    <PageHero eyebrow="Community resources" title="Downloads" text={introduction} />
    <section className="section">
      {downloadError && <p className="dashboard-message error" role="alert">{downloadError}</p>}
      {loading ? <EmptyState title="Loading downloads" text="Fetching published files…" /> : error ? <EmptyState title="Downloads unavailable" text={error} /> : rows.length ? <div className="content-grid">
        {rows.map((item) => <article className="content-card download-card" key={item.id}>
          <div className="download-icon" aria-hidden="true">⬇</div><span className="card-kicker">{item.category}{item.version ? ` · ${item.version}` : ""}</span>
          <h2>{item.title}</h2><p>{item.description}</p><small>{item.file_name} · {(item.size_bytes / 1024 / 1024).toFixed(item.size_bytes < 1024 * 1024 ? 2 : 1)} MB · {dateLabel(item.created_at)}</small>
          <button className="button secondary" type="button" disabled={downloading === item.id} onClick={() => void downloadFile(item)}>{downloading === item.id ? "Preparing download…" : "Download securely"}</button>
        </article>)}
      </div> : <EmptyState title="No published downloads" text="Files will appear here after an administrator securely uploads and publishes them." />}
    </section>
  </>;
}

export function SeasonsPage() {
  const { value: introduction } = usePublicSetting("seasons_page_intro", "Explore the current SERAPHYX season and archived worlds.");
  const seasons = usePublicRows<Season>("seasons", "id,slug,name,description,banner_url,starts_at,ends_at,status", "starts_at", [], false);
  const products = usePublicRows<Product>("products", "id,name,description,category,price_cents,currency,image_url,season_id,featured", "display_order", [["published", true], ["available", true]]);
  const downloads = usePublicRows<Download>("downloads", "id,title,description,category,version,storage_path,file_name,size_bytes,created_at,season_id", "created_at", [["published", true]], false);
  const announcements = usePublicRows<Announcement>("announcements", "id,title,description,featured_image,author_name,category,pinned,publish_at,created_at,season_id", "publish_at", [["status", "published"]], false);
  const features = usePublicRows<Feature>("features", "id,title,description,category,image_url,video_url,featured,season_id", "display_order", [["published", true]]);
  const orderedSeasons = useMemo(() => [...seasons.rows].sort((a, b) => Number(b.status === "active") - Number(a.status === "active") || String(b.starts_at ?? "").localeCompare(String(a.starts_at ?? ""))), [seasons.rows]);
  return <>
    <PageHero eyebrow="A living world" title="Seasons" text={introduction} />
    <section className="section">
      {seasons.loading ? <EmptyState title="Loading seasons" text="Fetching published season records…" /> : seasons.error ? <EmptyState title="Seasons unavailable" text={seasons.error} /> : orderedSeasons.length ? <div className="season-list">
        {orderedSeasons.map((season) => <article className={`season-card ${season.status === "active" ? "active" : ""}`} key={season.id}>
          {season.banner_url && <img loading="lazy" src={season.banner_url} alt="" />}
          <span className="card-kicker">{season.status === "active" ? "Current season" : "Archived season"}</span><h2>{season.name}</h2><p>{season.description}</p>
          <p className="muted">{dateLabel(season.starts_at)} — {dateLabel(season.ends_at)}</p>
          {products.rows.some((item) => item.season_id === season.id) && <div className="season-related"><h3>Season products</h3>{products.rows.filter((item) => item.season_id === season.id).map((item) => <span key={item.id}>{item.name} · {formatPrice(item.price_cents, item.currency)}</span>)}</div>}
          {downloads.rows.some((item) => item.season_id === season.id) && <div className="season-related"><h3>Downloads</h3>{downloads.rows.filter((item) => item.season_id === season.id).map((item) => <Link key={item.id} to="/downloads">{item.title}</Link>)}</div>}
          {announcements.rows.some((item) => item.season_id === season.id) && <div className="season-related"><h3>Announcements</h3>{announcements.rows.filter((item) => item.season_id === season.id).map((item) => <Link key={item.id} to="/news">{item.title}</Link>)}</div>}
          {features.rows.some((item) => item.season_id === season.id) && <div className="season-related"><h3>Features</h3>{features.rows.filter((item) => item.season_id === season.id).map((item) => <Link key={item.id} to="/features">{item.title}</Link>)}</div>}
        </article>)}
      </div> : <EmptyState title="No seasons have been published" text="A season will appear when administrators create and publish it. Archived season records are retained." />}
    </section>
  </>;
}

export function LeaderboardPage() {
  const [query, setQuery] = useState("");
  const [stat, setStat] = useState<"playtime_minutes" | "wins" | "kills">("playtime_minutes");
  const { value: introduction } = usePublicSetting("leaderboard_page_intro", "Rankings are shown only when a verified statistics source is connected.");
  const { value: connected, loading: settingLoading } = usePublicSetting<boolean>("leaderboard_source_configured", false);
  const { value: source } = usePublicSetting<string>("leaderboard_source_label", "");
  const { rows, loading, error } = usePublicRows<LeaderboardEntry>("leaderboard_entries", "id,player_name,wins,playtime_minutes,kills,updated_at", "updated_at", [], false);
  const entries = useMemo(() => [...rows].filter((row) => row.player_name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b[stat] - a[stat]), [rows, query, stat]);
  return <>
    <PageHero eyebrow="Community rankings" title="Leaderboard" text={introduction} />
    <section className="section">
      <div className="toolbar"><input aria-label="Search players" placeholder="Search players…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select aria-label="Sort leaderboard" value={stat} onChange={(event) => setStat(event.target.value as typeof stat)}><option value="playtime_minutes">Playtime</option><option value="wins">Wins</option><option value="kills">Kills</option></select></div>
      {settingLoading || loading ? <EmptyState title="Loading leaderboard" text="Checking the configured statistics source…" /> : error ? <EmptyState title="Leaderboard unavailable" text={error} /> : !connected ? <EmptyState title="Leaderboard integration pending" text="No verified Minecraft statistics provider is configured. Rankings and player counts will not be fabricated." /> : entries.length ? <div className="leaderboard-table-wrap"><table className="leaderboard-table"><thead><tr><th>Rank</th><th>Player</th><th>Wins</th><th>Playtime</th><th>Kills</th></tr></thead><tbody>
        {entries.map((entry, index) => <tr key={entry.id}><td>{index + 1}</td><td>{entry.player_name}</td><td>{entry.wins}</td><td>{Math.floor(entry.playtime_minutes / 60)}h {entry.playtime_minutes % 60}m</td><td>{entry.kills}</td></tr>)}
      </tbody></table><p className="muted">{source ? `Source: ${source}` : "Verified source configured"} · Updated {dateLabel(entries[0].updated_at)}</p></div> : <EmptyState title="No verified rankings available" text="The configured data source has not published any entries." />}
    </section>
  </>;
}

type SupportLink = { general?: string; bug_report?: string; player_report?: string; staff_report?: string; appeal?: string; gameplay?: string; store_purchase?: string };
type Faq = { question: string; answer: string };
const supportOptions: Array<[keyof SupportLink, string]> = [
  ["general", "General assistance"], ["player_report", "Player reports"], ["staff_report", "Staff reports"],
  ["appeal", "Appeals"], ["bug_report", "Bug reports"], ["gameplay", "Gameplay assistance"], ["store_purchase", "Store purchase assistance"],
];

export function SupportPage() {
  const { value: introduction } = usePublicSetting("support_page_intro", "Find the right place for assistance. External support links appear here when the team configures them.");
  const { value: links, error: linksError } = usePublicSetting<SupportLink>("support_links", {});
  const { value: faqs, error: faqError } = usePublicSetting<Faq[]>("support_faqs", []);
  const { config } = useServerConfig();
  const resolvedLinks = { ...links, general: links.general || config.discordInvite };
  const availableLinks = supportOptions.filter(([key]) => {
    const url = resolvedLinks[key];
    return typeof url === "string" && /^https?:\/\//i.test(url);
  });
  return <>
    <PageHero eyebrow="Help center" title="Support" text={introduction} />
    <section className="section support-layout">
      <div className="support-links">{availableLinks.length ? availableLinks.map(([key, label]) => <a className="support-link" href={resolvedLinks[key]} target="_blank" rel="noreferrer" key={key}><span>{label}</span><b>↗</b></a>) : <EmptyState title="Support links not configured" text={linksError || "The team has not connected official support channels yet. No ticket system is claimed to be integrated."} />}</div>
      <div className="faq-card"><h2>Frequently asked questions</h2>{faqError ? <p className="muted">{faqError}</p> : faqs.length ? faqs.map((faq, index) => <details key={`${faq.question}-${index}`}><summary>{faq.question}</summary><p>{faq.answer}</p></details>) : <p className="muted">FAQs have not yet been published.</p>}</div>
    </section>
  </>;
}

export function HomeContentSections() {
  const features = usePublicRows<Feature>("features", "id,title,description,category,image_url,video_url,featured,season_id", "display_order", [["published", true], ["featured", true]]);
  const announcements = usePublicRows<Announcement>("announcements", "id,title,description,featured_image,author_name,category,pinned,publish_at,created_at,season_id", "publish_at", [["status", "published"]], false);
  const products = usePublicRows<Product>("products", "id,name,description,category,price_cents,currency,image_url,season_id,featured", "display_order", [["published", true], ["available", true]]);
  const titles = usePublicRows<Title>("titles", "id,name,description,requirements,category,rarity,reward,special_conditions,image_url,featured,discord_only", "display_order", [["published", true], ["featured", true]]);
  const staff = usePublicRows<Staff>("staff", "id,minecraft_name,discord_name,position,biography,profile_image,featured", "display_order", [["published", true]]);
  const activeSeason = usePublicRows<Season>("seasons", "id,slug,name,description,banner_url,starts_at,ends_at,status", "starts_at", [["status", "active"]]);
  const { value: intro } = usePublicSetting<string>("homepage_intro", "");
  const activeSeasonId = activeSeason.rows[0]?.id ?? "";
  const featuredFeatures = features.rows.filter((feature) => !feature.season_id || feature.season_id === activeSeasonId);
  const currentAnnouncements = announcements.rows.filter((item) => !item.season_id || item.season_id === activeSeasonId);
  const currentProducts = products.rows.filter((item) => !item.season_id || item.season_id === activeSeasonId);
  return <>
    <section className="section home-intro">
      <div><span className="eyebrow">The SERAPHYX realm</span><h2>Find your place in the world</h2></div>
      <p>{intro || "Join SERAPHYX SMP and discover a community-shaped Minecraft world. Server details and confirmed features are published by the team."}</p>
      <Link className="button secondary" to="/server">Connection guide</Link>
    </section>
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">Discover the realm</span><h2>Featured features</h2></div><Link className="text-link" to="/features">All features →</Link></div>
      {featuredFeatures.length ? <div className="content-grid">{featuredFeatures.slice(0, 3).map((feature) => <article className="content-card" key={feature.id}>{feature.image_url && <img loading="lazy" src={feature.image_url} alt="" />}<span className="card-kicker">{feature.category}</span><h3>{feature.title}</h3><p>{feature.description}</p></article>)}</div> : <EmptyState title="Features coming soon" text={features.error || "Only confirmed gameplay features will be shown here."} />}
    </section>
    <section className="section split-section">
      <div><span className="eyebrow">Latest from SERAPHYX</span><h2>News & announcements</h2><Link className="text-link" to="/news">All news →</Link></div>
      {currentAnnouncements.length ? <div className="home-news-list">{currentAnnouncements.slice(0, 3).map((item) => <article key={item.id}><span>{item.category}</span><h3>{item.title}</h3><p>{item.description}</p><small>{dateLabel(item.publish_at || item.created_at)}</small></article>)}</div> : <EmptyState title="No published announcements" text={announcements.error || "Announcements will appear after an administrator publishes them."} />}
    </section>
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">Official catalog</span><h2>Featured store products</h2></div><Link className="text-link" to="/store">Visit store →</Link></div>
      {currentProducts.filter((item) => item.featured).length ? <div className="content-grid">{currentProducts.filter((item) => item.featured).slice(0, 4).map((item) => <article className="content-card" key={item.id}>{item.image_url && <img loading="lazy" src={item.image_url} alt="" />}<span className="card-kicker">{item.category}</span><h3>{item.name}</h3><strong>{formatPrice(item.price_cents, item.currency)}</strong></article>)}</div> : <EmptyState title="No featured products" text={products.error || "Featured products will appear here when selected in the official catalog."} />}
    </section>
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">Earned recognition</span><h2>Featured titles</h2></div><Link className="text-link" to="/titles">All titles →</Link></div>
      {titles.rows.length ? <div className="title-grid">{titles.rows.slice(0, 3).map((title) => <article className={`title-card ${title.discord_only ? "special" : ""} ${titleRarityClass(title.rarity)}`} key={title.id}><div className="title-gem" /><div className="title-meta"><span className="title-category">{title.category || title.rarity}</span><span className="title-rarity">{title.rarity}</span></div><h3>{title.name}</h3><p>{title.description || title.requirements}</p></article>)}</div> : <EmptyState title="Title details pending" text={titles.error || "The team will publish official title names and details when available."} />}
    </section>
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">The team</span><h2>Meet the staff</h2></div><Link className="text-link" to="/staff">Staff directory →</Link></div>
      {staff.rows.filter((person) => person.featured).length ? <div className="content-grid staff-grid">{staff.rows.filter((person) => person.featured).slice(0, 4).map((person) => <article className="content-card staff-card" key={person.id}>{person.profile_image && <img loading="lazy" src={person.profile_image} alt="" />}<span className="card-kicker">{person.position}</span><h3>{person.minecraft_name}</h3></article>)}</div> : <EmptyState title="Featured staff pending" text={staff.error || "No staff members have been selected for the homepage."} />}
    </section>
    <section className="section community-support"><span className="eyebrow">Be part of the realm</span><h2>Help SERAPHYX grow</h2><p>Explore the server, meet the team, or browse optional support packages.</p><div className="hero-actions"><Link className="button primary" to="/server">Join SERAPHYX</Link><Link className="button secondary" to="/support">Get support</Link><Link className="button secondary" to="/store">Visit store</Link></div></section>
  </>;
}
