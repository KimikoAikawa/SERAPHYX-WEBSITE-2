import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Props = { client: SupabaseClient; onNavigate: (section: string) => void };
type Metric = { key: string; label: string; value: number | null };
const initialMetrics: Metric[] = [
  { key: "features", label: "Published features", value: null },
  { key: "announcements", label: "Published announcements", value: null },
  { key: "products", label: "Available products", value: null },
  { key: "staff", label: "Published staff profiles", value: null },
  { key: "downloads", label: "Published downloads", value: null },
  { key: "seasons", label: "Active seasons", value: null },
  { key: "orders", label: "Orders awaiting payment", value: null },
];

export default function AdminOverview({ client, onNavigate }: Props) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const results = await Promise.all(initialMetrics.map(async (metric) => {
        let query = client.from(metric.key).select("id", { count: "exact", head: true });
        if (metric.key === "features" || metric.key === "staff" || metric.key === "downloads") query = query.eq("published", true);
        if (metric.key === "announcements") query = query.eq("status", "published");
        if (metric.key === "products") query = query.eq("published", true).eq("available", true);
        if (metric.key === "seasons") query = query.eq("status", "active");
        if (metric.key === "orders") query = query.eq("payment_status", "pending");
        const { count, error: queryError } = await query;
        return { ...metric, value: queryError ? null : count ?? 0, error: queryError?.message ?? "" };
      }));
      if (!active) return;
      const failed = results.find((result) => result.error);
      if (failed) setError(`Some dashboard counts could not be loaded: ${failed.error}`);
      setMetrics(results);
      setLoading(false);
    };
    void load().catch(() => {
      if (active) {
        setError("Dashboard counts could not be loaded.");
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [client]);

  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><span className="eyebrow">SERAPHYX SMP</span><h2>Admin overview</h2><p>Live totals from the connected content database. Empty or unavailable integrations are not replaced with sample values.</p></div>
    {error && <p className="dashboard-message error" role="status">{error}</p>}
    <div className="admin-metric-grid">{metrics.map((metric) => <article key={metric.key}><span>{metric.label}</span><strong>{loading ? "…" : metric.value ?? "Unavailable"}</strong></article>)}</div>
    <div className="admin-overview-links">
      {[["server", "Edit server settings"], ["homepage", "Edit homepage & site copy"], ["features", "Manage features"], ["rule_categories", "Manage rule categories"], ["rules", "Manage rules"], ["punishments", "Manage punishments"], ["titles", "Manage titles"], ["store", "Manage store"], ["orders", "Review orders"], ["downloads", "Manage downloads"], ["seasons", "Manage seasons"], ["announcements", "Publish news"], ["staff", "Manage staff"], ["leaderboard_entries", "Manage leaderboard"], ["media", "Manage media"], ["support", "Manage support & FAQs"], ["audit", "View audit log"]].map(([section, label]) => <button key={section} type="button" onClick={() => onNavigate(section)}>{label} →</button>)}
    </div>
  </section>;
}
