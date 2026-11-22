import { createClient } from "@supabase/supabase-js";

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "cache-control": "no-store",
  },
  body: JSON.stringify(body),
});

export async function handler(event) {
  if (event.httpMethod !== "POST") return response(405, { message: "Use POST to invite a staff member." });

  const projectUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!projectUrl || !anonKey || !serviceRoleKey) {
    console.error("Admin invitation function is missing Supabase server environment variables.");
    return response(503, { message: "Staff invitations are not configured. Ask the site owner to check Netlify environment variables." });
  }

  const authorization = event.headers?.authorization || event.headers?.Authorization || "";
  const tokenMatch = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!tokenMatch) return response(401, { message: "Sign in as a site owner before sending an invitation." });

  let payload;
  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "";
    payload = JSON.parse(body);
  } catch {
    return response(400, { message: "The invitation request is invalid." });
  }

  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const role = payload?.role;
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response(400, { message: "Enter a valid staff email address." });
  }
  if (role !== "administrator" && role !== "editor") {
    return response(400, { message: "Choose an administrator or editor role." });
  }

  const userClient = createClient(projectUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${tokenMatch[1]}` } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(tokenMatch[1]);
  if (authError || !authData.user) return response(401, { message: "Your admin session is invalid or expired. Sign in again." });

  const { data: roleData, error: roleError } = await userClient
    .from("admin_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (roleError) {
    console.error("Could not verify admin invitation permission:", roleError.message);
    return response(503, { message: "Could not verify your owner permissions. Try again or contact the site owner." });
  }
  if (roleData?.role !== "owner") return response(403, { message: "Only a site owner can invite staff accounts." });

  let siteOrigin;
  try {
    const configuredUrl = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;
    if (!configuredUrl) throw new Error("SITE_URL is missing.");
    siteOrigin = new URL(configuredUrl).origin;
  } catch {
    return response(503, { message: "Set the site's production URL in the Netlify SITE_URL environment variable." });
  }

  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteOrigin}/admin`,
  });
  if (inviteError) {
    const message = /already|registered|exists/i.test(inviteError.message)
      ? "That email already has a Supabase account. Find it in the account list and assign its role."
      : inviteError.message;
    return response(400, { message: `Could not send invitation: ${message}` });
  }
  if (!inviteData.user?.id) {
    console.error("Supabase accepted an invitation request without returning the invited user ID.");
    return response(502, { message: "The invitation was sent, but its staff role could not be assigned. Check the user list and assign the role manually." });
  }

  const { error: assignmentError } = await userClient.rpc("manage_admin_role", {
    p_user_id: inviteData.user.id,
    p_role: role,
  });
  if (assignmentError) {
    console.error("Invitation sent, but role assignment failed:", assignmentError.message);
    return response(502, { message: "The invitation email was sent, but role assignment failed. Assign the role from the user list before the invitee signs in." });
  }

  return response(200, { message: `Invitation sent to ${email} with the ${role} role.` });
}
