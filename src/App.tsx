import { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useServerConfig } from "./useServerConfig";
import { usePublicSetting } from "./usePublicData";
import StorePage from "./Store";
import AdminDashboard from "./AdminDashboard";
import {
  DownloadsPage as DynamicDownloadsPage,
  FeaturesPage as DynamicFeaturesPage,
  HomeContentSections,
  LeaderboardPage as DynamicLeaderboardPage,
  NewsPage as DynamicNewsPage,
  RulesPage as DynamicRulesPage,
  SeasonsPage as DynamicSeasonsPage,
  StaffPage as DynamicStaffPage,
  SupportPage as DynamicSupportPage,
  TermsPage as DynamicTermsPage,
  TitlesPage as DynamicTitlesPage,
} from "./PublicContent";

type Status = {
  online: boolean | null;
  players: number | null;
  maxPlayers: number | null;
  updatedAt: string | null;
  error?: string;
};

function useServerStatus(javaAddress: string) {
  const [status, setStatus] = useState<Status>({
    online: null,
    players: null,
    maxPlayers: null,
    updatedAt: null,
  });

  useEffect(() => {
    if (!javaAddress) {
      setStatus({ online: null, players: null, maxPlayers: null, updatedAt: null, error: "Server address not configured" });
      return;
    }
    let active = true;
    const updateStatus = async () => {
      try {
        const response = await fetch("/api/status");
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Status endpoint unavailable");
        }
        const value = await response.json() as Status;
        if (active) setStatus(value);
      } catch {
        if (active) {
          setStatus((current) => ({ ...current, online: null, error: "Live status is unavailable in this preview or the status provider is not configured." }));
        }
      }
    };
    void updateStatus();
    const interval = window.setInterval(() => void updateStatus(), 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [javaAddress]);

  return status;
}

function LoadingScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const finishLoading = () => window.setTimeout(() => setVisible(false), 420);
    if (document.readyState === "complete") finishLoading();
    else window.addEventListener("load", finishLoading, { once: true });
    return () => window.removeEventListener("load", finishLoading);
  }, []);

  if (!visible) return null;
  return (
    <div className="loading-screen" role="status" aria-label="Loading SERAPHYX SMP">
      <div className="loading-mark"><span>S</span></div>
      <strong>SERAPHYX SMP</strong>
      <div className="loading-bar"><i /></div>
    </div>
  );
}

function AmbientEffects() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;

    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    document.body.appendChild(glow);
    const move = (event: PointerEvent) => {
      glow.style.transform = `translate(${event.clientX - 18}px, ${event.clientY - 18}px)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      glow.remove();
    };
  }, []);

  return (
    <div className="ambient-effects" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => <i key={index} className={`particle particle-${index + 1}`} />)}
      <i className="voxel voxel-a" /><i className="voxel voxel-b" /><i className="voxel voxel-c" />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    ["Home", "/"], ["Server", "/server"], ["Features", "/features"], ["Downloads", "/downloads"], ["Rules", "/rules"],
    ["Titles", "/titles"], ["Leaderboard", "/leaderboard"], ["News", "/news"],
    ["Seasons", "/seasons"], ["Staff", "/staff"], ["Support", "/support"],
  ] as const;

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="SERAPHYX SMP home">
        <span className="brand-mark">S</span>
        <span><strong>SERAPHYX</strong><small>SMP</small></span>
      </Link>
      <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span /><span /><span />
      </button>
      <nav className={open ? "nav open" : "nav"} aria-label="Main navigation">
        {links.map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}
        <Link className="nav-store" to="/store">Store</Link>
      </nav>
      <AdminAccessLink className="header-admin" />
    </header>
  );
}

function AdminAccessLink({ className = "" }: { className?: string }) {
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    const check = async (client: SupabaseClient, session: Session | null) => {
      if (!session) {
        if (active) setAuthorized(false);
        return;
      }
      const { data, error } = await client.from("admin_roles").select("role").eq("user_id", session.user.id).maybeSingle();
      if (active) setAuthorized(!error && Boolean(data));
    };
    void import("./supabase").then(({ supabase }) => {
      if (!active || !supabase) return;
      void supabase.auth.getSession().then(({ data }) => check(supabase, data.session));
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => { if (active) void check(supabase, session); }, 0);
      });
      unsubscribe = () => subscription.unsubscribe();
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  return <NavLink className={className} to="/admin" aria-label={authorized ? "Open admin dashboard" : "Open staff admin sign-in"}>{authorized ? "Admin dashboard" : "Admin"}</NavLink>;
}

function StatusBadge({ status }: { status: Status }) {
  const label = status.online === null ? "Status unavailable" : status.online ? "Server online" : "Server offline";
  return (
    <div className={`status-badge ${status.online ? "online" : ""}`}>
      <span className="status-dot" />
      <span>
        <b>{label}</b>
        <small>{status.online && status.players !== null ? `${status.players}${status.maxPlayers === null ? "" : ` / ${status.maxPlayers}`} players online` : status.updatedAt ? `Updated ${new Date(status.updatedAt).toLocaleTimeString()}` : "Live status could not be loaded"}</small>
        {status.updatedAt && status.online === false && <small>Checked {new Date(status.updatedAt).toLocaleTimeString()}</small>}
      </span>
    </div>
  );
}

function PageHero({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <section className="page-hero">
      <div className="page-hero-sky" aria-hidden="true"><i /><i /><i /><b /><b /></div>
      <div className="page-hero-content">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><span className="crystal-small" /><h3>{title}</h3><p>{text}</p></div>;
}

function Home() {
  const { config, error: configError } = useServerConfig();
  const status = useServerStatus(config.javaAddress);
  const { value: heroEyebrow } = usePublicSetting("homepage_eyebrow", "Welcome to the realm");
  const { value: heroTitle } = usePublicSetting("homepage_hero_title", "ENTER THE WORLD OF");
  const { value: heroSubtitle } = usePublicSetting("homepage_hero_subtitle", "Gather your friends. Explore the realm. Forge a story that lasts.");
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  const copyAddress = async (value: string, key: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setCopyError("");
      window.setTimeout(() => setCopied(""), 2000);
    } catch {
      setCopied("");
      setCopyError("Clipboard access was blocked. Select and copy the address manually.");
    }
  };

  return (
    <>
      <section className="hero">
        <div className="mc-sky" aria-hidden="true">
          <div className="mc-moon" />
          <div className="mc-star star-a" /><div className="mc-star star-b" /><div className="mc-star star-c" />
          <div className="mc-cloud cloud-a" /><div className="mc-cloud cloud-b" />
        </div>
        <div className="mc-landscape" aria-hidden="true">
          <div className="mc-mountain mountain-a"><i /><i /><i /></div>
          <div className="mc-mountain mountain-b"><i /><i /><i /></div>
          <div className="mc-fort">
            <span className="tower tower-left" /><span className="tower tower-right" />
            <span className="keep" /><span className="gate" />
          </div>
          <div className="mc-trees">
            <span /><span /><span /><span /><span /><span />
          </div>
          <div className="mc-ground" />
        </div>
        <div className="hero-content">
          <span className="eyebrow"><i /> {heroEyebrow} <i /></span>
          <h1>{heroTitle}<br /><em>SERAPHYX SMP</em></h1>
          <p>{heroSubtitle}</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={() => void copyAddress(config.javaAddress, "java")} disabled={!config.javaAddress}>
              {copied === "java" ? "Address copied" : "Copy Java address"}
            </button>
            {config.discordInvite
              ? <a className="button secondary" href={config.discordInvite} target="_blank" rel="noreferrer">Join Discord</a>
              : <button className="button secondary" type="button" disabled>Discord not linked</button>}
          </div>
        </div>
        <div className="hero-status"><StatusBadge status={status} /></div>
      </section>

      <section className="section home-connections">
        <div className="section-heading"><div><span className="eyebrow">Find your way in</span><h2>Choose your destination</h2></div><Link className="text-link" to="/server">Connection guide →</Link></div>
        <div className="server-layout">
          <article className="info-card">
            <span className="card-kicker">Main survival server</span><h3>Java Edition</h3>
            <dl><div><dt>Address</dt><dd>{config.javaAddress}<button type="button" onClick={() => void copyAddress(config.javaAddress, "java-home")}>{copied === "java-home" ? "Copied" : "Copy"}</button></dd></div></dl>
            <h3>Bedrock Edition</h3>
            <dl><div><dt>Address</dt><dd>{config.bedrockAddress}<button type="button" onClick={() => void copyAddress(config.bedrockAddress, "bedrock-home")}>{copied === "bedrock-home" ? "Copied" : "Copy"}</button></dd></div>
              <div><dt>Port</dt><dd>{config.bedrockPort}<button type="button" onClick={() => void copyAddress(config.bedrockPort, "port-home")}>{copied === "port-home" ? "Copied" : "Copy"}</button></dd></div></dl>
          </article>
          <article className="info-card accent-card">
            <span className="card-kicker">Separate destination</span><h3>SERAPHYX Events</h3>
            <dl><div><dt>Address</dt><dd>{config.eventsAddress}<button type="button" onClick={() => void copyAddress(config.eventsAddress, "events-home")}>{copied === "events-home" ? "Copied" : "Copy"}</button></dd></div>
              <div><dt>Port</dt><dd>{config.eventsPort}<button type="button" onClick={() => void copyAddress(config.eventsPort, "events-port-home")}>{copied === "events-port-home" ? "Copied" : "Copy"}</button></dd></div></dl>
          </article>
        </div>
        {configError && <p className="muted" role="status">{configError}</p>}
        {copyError && <p className="admin-message" role="status">{copyError}</p>}
      </section>
      <HomeContentSections />
    </>
  );
}

function ServerPage() {
  const { config, error: configError } = useServerConfig();
  const status = useServerStatus(config.javaAddress);
  const { value: introduction } = usePublicSetting("server_page_intro", "The main SMP and SERAPHYX Events use separate server addresses.");
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState("");
  const copy = async (value: string, kind: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setCopyError("");
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopyError("Clipboard access was blocked. Select and copy the address manually.");
    }
  };
  return (
    <>
      <PageHero eyebrow="Connection guide" title="Choose your destination" text={introduction} />
      <section className="section">
        <div className="server-layout">
          <div className="info-card">
            <h2>Main SMP · Java Edition</h2>
            <dl>
              <div><dt>Address</dt><dd>{config.javaAddress}<button type="button" onClick={() => void copy(config.javaAddress, "java")}>{copied === "java" ? "Copied" : "Copy"}</button></dd></div>
            </dl>
            <p className="muted">Add this address in Minecraft Java Edition under Multiplayer → Add Server.</p>
            <div className="edition-divider" />
            <h2>Main SMP · Bedrock Edition</h2>
            <dl>
              <div><dt>Address</dt><dd>{config.bedrockAddress}<button type="button" onClick={() => void copy(config.bedrockAddress, "bedrock")}>{copied === "bedrock" ? "Copied" : "Copy"}</button></dd></div>
              <div><dt>Port</dt><dd>{config.bedrockPort}<button type="button" onClick={() => void copy(config.bedrockPort, "port")}>{copied === "port" ? "Copied" : "Copy"}</button></dd></div>
            </dl>
            <p className="muted">Add the address and port in Minecraft Bedrock Edition under Servers.</p>
          </div>
          <div className="info-card accent-card">
            <span className="card-kicker">Separate destination</span>
            <h2>SERAPHYX Events</h2>
            <dl>
              <div><dt>Address</dt><dd>{config.eventsAddress}<button type="button" onClick={() => void copy(config.eventsAddress, "events")}>{copied === "events" ? "Copied" : "Copy"}</button></dd></div>
              <div><dt>Port</dt><dd>{config.eventsPort}<button type="button" onClick={() => void copy(config.eventsPort, "events-port")}>{copied === "events-port" ? "Copied" : "Copy"}</button></dd></div>
            </dl>
            <p className="muted">Use this address and port to connect to the Events server.</p>
            <div className="edition-divider" />
            <h2>Main SMP status</h2>
            <StatusBadge status={status} />
            {status.players !== null && <p>{status.players} / {status.maxPlayers ?? "—"} players</p>}
            {status.error && <p className="muted">{status.error}</p>}
          </div>
        </div>
        {configError && <p className="admin-message" role="status">{configError}</p>}
        {copyError && <p className="admin-message" role="status">{copyError}</p>}
      </section>
    </>
  );
}

function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authClient, setAuthClient] = useState<SupabaseClient | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const recoveryParams = new URLSearchParams(window.location.hash.slice(1));
    if (["recovery", "invite"].includes(recoveryParams.get("type") ?? "") && recoveryParams.has("access_token")) {
      setRecoveryMode(true);
    }
    const callbackParams = new URLSearchParams(window.location.search);
    const errorCode = recoveryParams.get("error_code") || callbackParams.get("error_code");
    if (errorCode === "otp_expired") {
      setMessage("This password-reset link is invalid or expired. Use the newest reset email, or request another after the email limit resets.");
    }

    void import("./supabase").then(({ supabase: client }) => {
      if (!active) return;
      setAuthClient(client);
      setAuthReady(true);
      if (!client) return;

      const verifySession = async (currentSession: Session | null) => {
        if (!currentSession) {
          setSession(null);
          setRole("");
          setChecking(false);
          return;
        }

        setSession(currentSession);
        setRole("");
        setChecking(true);
        setMessage("");

        try {
          const { data, error } = await client
            .from("admin_roles")
            .select("role")
            .eq("user_id", currentSession.user.id)
            .maybeSingle();

          if (!active) return;
          if (error) {
            setMessage("Could not verify this account's admin role. Check the Supabase schema and access policy.");
            setChecking(false);
            return;
          }
          if (!data) {
            const { error: signOutError } = await client.auth.signOut();
            if (!active) return;
            setSession(null);
            setMessage(signOutError
              ? "This account has no admin role. Sign out from the Supabase session before trying another account."
              : "This account is not authorized for the admin dashboard.");
            setChecking(false);
            return;
          }

          setRole(data.role);
          setChecking(false);
        } catch {
          if (!active) return;
          setMessage("Could not connect to Supabase to verify admin access.");
          setChecking(false);
        }
      };

      const { data: { subscription } } = client.auth.onAuthStateChange((event, currentSession) => {
        if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
        window.setTimeout(() => {
          if (active) void verifySession(currentSession);
        }, 0);
      });
      unsubscribe = () => subscription.unsubscribe();
    }).catch(() => {
      if (!active) return;
      setAuthReady(true);
      setMessage("Could not load the Supabase authentication client.");
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!authClient || submitting) return;
    setSubmitting(true);
    setMessage("");
    void authClient.auth.signInWithPassword({ email: email.trim(), password })
      .then(({ error }) => {
        if (!error) return;
        if (error.code === "email_not_confirmed") {
          setMessage("This email is not confirmed yet. Open the Supabase invitation email and finish account setup before signing in.");
        } else if (error.code === "invalid_credentials") {
          setMessage("Supabase rejected this email and password. If this account was invited, open the invitation link first to set its password.");
        } else if (error.status === 429) {
          setMessage("Too many sign-in attempts. Wait a few minutes, then try again.");
        } else {
          setMessage(`Supabase sign-in failed: ${error.message}`);
        }
      })
      .catch(() => setMessage("Could not connect to Supabase. Check your project URL and network connection."))
      .finally(() => {
        setPassword("");
        setSubmitting(false);
      });
  };

  const requestPasswordReset = async () => {
    if (!authClient || !email.trim()) {
      setMessage("Enter your account email first.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const { error } = await authClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error) {
        const rateLimited = error.code === "over_email_send_rate_limit"
          || error.message.toLowerCase().includes("email rate limit exceeded");
        setMessage(rateLimited
          ? "Supabase's built-in email service is limited to 2 emails per hour for this project. Check your inbox for the invite or password email already sent, or wait for the limit to reset. Higher limits require custom SMTP."
          : `Could not send a password email: ${error.message}`);
        return;
      }
      setResetEmailSent(true);
    } catch {
      setMessage("Could not connect to Supabase to send a password email.");
    } finally {
      setSubmitting(false);
    }
  };

  const updatePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!authClient) return;
    if (newPassword.length < 8) {
      setMessage("Choose a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const { error } = await authClient.auth.updateUser({ password: newPassword });
      if (error) {
        setMessage(`Could not update password: ${error.message}`);
        return;
      }
      setRecoveryMode(false);
      setMessage("Password updated.");
    } catch {
      setMessage("Could not connect to Supabase to update the password.");
    } finally {
      setSubmitting(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const signOut = async () => {
    if (!authClient) return;
    setMessage("");
    const { error } = await authClient.auth.signOut();
    if (error) setMessage("Sign-out failed. Please try again.");
  };

  if (recoveryMode) {
    return (
      <main className="admin-page">
        <form className="login-card" onSubmit={updatePassword}>
          <Link className="brand" to="/"><span className="brand-mark">S</span><span><strong>SERAPHYX</strong><small>SMP</small></span></Link>
          <span className="eyebrow">Account recovery</span>
          <h1>Choose a password</h1>
          <label>New password<input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          <label>Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
          <button className="button primary" type="submit" disabled={!authClient || submitting}>
            {submitting ? "Updating..." : authClient ? "Update password" : "Preparing..."}
          </button>
          {message && <p className="admin-message" role="alert">{message}</p>}
        </form>
      </main>
    );
  }

  if (!authReady || checking) {
    return <main className="admin-page"><section className="login-card"><span className="eyebrow">Administration</span><h1>{checking ? "Verifying access" : "Preparing sign in"}</h1><p className="admin-message">{checking ? "Checking your account permissions…" : "Loading secure authentication…"}</p></section></main>;
  }

  if (session && role && authClient) {
    return <AdminDashboard client={authClient} session={session} role={role} onSignOut={() => void signOut()} />;
  }

  return (
    <main className="admin-page">
      <form className="login-card" onSubmit={submit}>
        <Link className="brand" to="/"><span className="brand-mark">S</span><span><strong>SERAPHYX</strong><small>SMP</small></span></Link>
        <span className="eyebrow">Administration</span>
        <h1>Staff sign in</h1>
        <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label htmlFor="admin-password">Password</label>
        <div className="password-control">
          <input id="admin-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        <button className="button primary" type="submit" disabled={!authClient || submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
        <button className="forgot-password" type="button" disabled={!authClient || submitting || !email.trim()} onClick={() => void requestPasswordReset()}>
          {resetEmailSent ? "Password email sent — check your inbox" : "Forgot or need to set your password?"}
        </button>
        {!authClient && <p className="admin-message">Authentication provider not configured. Add the Supabase project URL and anon key to enable sign-in.</p>}
        {message && <p className="admin-message" role="alert">{message}</p>}
        <aside className="admin-access-note">
          <strong>Staff access is invitation-only</strong>
          <p>Ask a site owner to invite your email from Admin → Users &amp; roles. Open the invitation to create your password. Public sign-up never grants admin access.</p>
        </aside>
      </form>
    </main>
  );
}

function Footer() {
  const { value: tagline } = usePublicSetting("site_tagline", "An evolving survival realm, shaped by its community.");
  return (
    <footer className="footer">
      <div className="footer-brand">
        <Link className="brand" to="/"><span className="brand-mark">S</span><span><strong>SERAPHYX</strong><small>SMP</small></span></Link>
        <p>{tagline}</p>
      </div>
      <div><b>Explore</b><Link to="/server">Server</Link><Link to="/features">Features</Link><Link to="/downloads">Downloads</Link><Link to="/seasons">Seasons</Link><Link to="/titles">Titles</Link></div>
      <div><b>Community</b><Link to="/rules">Rules</Link><Link to="/terms">Terms of Service</Link><Link to="/news">News</Link><Link to="/staff">Staff</Link></div>
      <div><b>Support</b><Link to="/support">Help center</Link><Link to="/store">Store</Link><AdminAccessLink /></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} SERAPHYX SMP</span><span>Built for the community</span></div>
    </footer>
  );
}

export default function App() {
  const location = useLocation();
  useEffect(() => {
    document.body.dataset.page = location.pathname === "/" ? "home" : location.pathname.slice(1);
    const pageTitles: Record<string, string> = {
      "/": "SERAPHYX SMP",
      "/admin": "Admin | SERAPHYX SMP",
      "/server": "Server | SERAPHYX SMP",
      "/features": "Features | SERAPHYX SMP",
      "/downloads": "Downloads | SERAPHYX SMP",
      "/rules": "Rules | SERAPHYX SMP",
      "/terms": "Terms | SERAPHYX SMP",
      "/titles": "Titles | SERAPHYX SMP",
      "/leaderboard": "Leaderboard | SERAPHYX SMP",
      "/news": "News | SERAPHYX SMP",
      "/seasons": "Seasons | SERAPHYX SMP",
      "/staff": "Staff | SERAPHYX SMP",
      "/support": "Support | SERAPHYX SMP",
      "/store": "Store | SERAPHYX SMP",
    };
    document.title = pageTitles[location.pathname] ?? "SERAPHYX SMP";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  if (location.pathname === "/admin") return <><AmbientEffects /><Routes><Route path="/admin" element={<AdminPage />} /></Routes></>;

  return (
    <>
      <LoadingScreen />
      <AmbientEffects />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/server" element={<ServerPage />} />
          <Route path="/features" element={<DynamicFeaturesPage />} />
          <Route path="/downloads" element={<DynamicDownloadsPage />} />
          <Route path="/seasons" element={<DynamicSeasonsPage />} />
          <Route path="/rules" element={<DynamicRulesPage />} />
          <Route path="/terms" element={<DynamicTermsPage />} />
          <Route path="/titles" element={<DynamicTitlesPage />} />
          <Route path="/store" element={<StorePage />} />
          <Route path="/leaderboard" element={<DynamicLeaderboardPage />} />
          <Route path="/news" element={<DynamicNewsPage />} />
          <Route path="/staff" element={<DynamicStaffPage />} />
          <Route path="/support" element={<DynamicSupportPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
