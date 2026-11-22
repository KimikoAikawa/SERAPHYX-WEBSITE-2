import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type AuditEntry = { id: string; actor_id: string | null; action: string; entity_type: string; entity_id: string | null; created_at: string };

export default function AdminAudit({ client }: { client: SupabaseClient }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void client.from("audit_logs").select("id,actor_id,action,entity_type,entity_id,created_at")
      .order("created_at", { ascending: false }).limit(100)
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(`Could not load audit log: ${queryError.message}`);
        else setEntries((data ?? []) as AuditEntry[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, [client]);

  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><span className="eyebrow">Administrative history</span><h2>Audit log</h2><p>Most recent 100 database-record changes. Sensitive row contents are not copied into the log.</p></div>
    {error && <p className="dashboard-message error" role="alert">{error}</p>}
    {loading ? <p className="muted">Loading audit history…</p> : entries.length ? <div className="leaderboard-table-wrap"><table className="leaderboard-table"><thead><tr><th>Time</th><th>Action</th><th>Section</th><th>Record</th><th>Actor</th></tr></thead><tbody>
      {entries.map((entry) => <tr key={entry.id}><td>{new Date(entry.created_at).toLocaleString()}</td><td>{entry.action}</td><td>{entry.entity_type}</td><td>{entry.entity_id ?? "—"}</td><td>{entry.actor_id ?? "System"}</td></tr>)}
    </tbody></table></div> : <p className="muted">No administrative changes have been recorded.</p>}
  </section>;
}
