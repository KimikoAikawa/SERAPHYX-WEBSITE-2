import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminUser = { user_id: string; email: string; role: string | null; created_at: string };
const roles = ["owner", "administrator", "editor"] as const;
type InviteRole = "administrator" | "editor";

function responseMessage(payload: unknown) {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) return "";
  return typeof payload.message === "string" ? payload.message : "";
}

export default function AdminUsers({ client }: { client: SupabaseClient }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("editor");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await client.rpc("list_site_admins");
    if (error) {
      setMessage(`Could not load account roles: ${error.message}`);
      setIsError(true);
    } else {
      setUsers((data ?? []) as AdminUser[]);
      setIsError(false);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => { void load(); }, [load]);

  const saveRole = async (user: AdminUser, role: string) => {
    if (user.role === role) return;
    if (!window.confirm(`${role ? `Set ${user.email} to ${role}` : `Remove ${user.email}'s site role`}?`)) return;
    setSavingId(user.user_id);
    setMessage("");
    const { error } = await client.rpc("manage_admin_role", {
      p_user_id: user.user_id,
      p_role: role || null,
    });
    if (error) {
      setMessage(`Could not update role: ${error.message}`);
      setIsError(true);
    } else {
      setMessage("Account role updated.");
      setIsError(false);
      await load();
    }
    setSavingId("");
  };

  const inviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviting(true);
    setMessage("");
    try {
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw new Error(`Could not verify the current session: ${sessionError.message}`);
      if (!data.session?.access_token) throw new Error("Your admin session has expired. Sign in again before sending an invitation.");
      const response = await fetch("/api/admin-invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseMessage(payload) || "The invitation service is unavailable. Check the Netlify function and its environment variables.");
      setMessage(responseMessage(payload) || "Invitation sent.");
      setIsError(false);
      setInviteEmail("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send invitation.");
      setIsError(true);
    } finally {
      setInviting(false);
    }
  };

  return <section className="dashboard-panel">
    <div className="dashboard-panel-heading"><span className="eyebrow">Owner only</span><h2>User and role management</h2><p>Send invitation-only staff accounts. New staff can set their password from the email link. The last owner cannot be removed or demoted.</p></div>
    {message && <p className={isError ? "dashboard-message error" : "dashboard-message"} role={isError ? "alert" : "status"}>{message}</p>}
    <form className="admin-form-grid product-admin-form invite-admin-form" onSubmit={(event) => void inviteUser(event)}>
      <label>Staff email<input type="email" autoComplete="email" required maxLength={254} value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="staff@example.com" /></label>
      <label>Initial role<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value === "administrator" ? "administrator" : "editor")}><option value="editor">Editor</option><option value="administrator">Administrator</option></select></label>
      <div className="full-width form-actions"><button className="button primary" disabled={inviting}>{inviting ? "Sending invitation…" : "Invite staff member"}</button></div>
    </form>
    {loading ? <p className="muted">Loading Supabase accounts…</p> : users.length ? <div className="product-admin-list">
      {users.map((user) => <article key={user.user_id}>
        <div><strong>{user.email}</strong><small>{user.user_id} · Joined {new Date(user.created_at).toLocaleDateString()}</small></div>
        <div className="form-actions"><label className="role-select-label" htmlFor={`role-${user.user_id}`}>Role</label>
          <select id={`role-${user.user_id}`} value={user.role ?? ""} disabled={savingId === user.user_id} onChange={(event) => void saveRole(user, event.target.value)}>
            <option value="">No site role</option>
            {user.role && !roles.some((role) => role === user.role) && <option value={user.role} disabled>{user.role} (unsupported)</option>}
            {roles.map((role) => <option value={role} key={role}>{role}</option>)}
          </select>
        </div>
      </article>)}
    </div> : <p className="muted">No Supabase accounts were returned.</p>}
  </section>;
}
