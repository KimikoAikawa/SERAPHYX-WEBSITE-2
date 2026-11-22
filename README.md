# SERAPHYX SMP Website

Production-oriented React, TypeScript, and Vite website for SERAPHYX SMP.

## Local development

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.

The Vite preview does not run the Netlify `/api/status` function, so live server status is available after Netlify deployment and `JAVA_SERVER_ADDRESS` is configured. The local site will still show its connection details and clearly indicate when live status is unavailable.

## Build

```sh
npm run build
npm run preview
```

## Netlify deployment

1. Create a Netlify project and connect this repository.
2. Use the existing `netlify.toml` build settings.
3. Configure `JAVA_SERVER_ADDRESS`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` in Netlify environment variables.
4. To enable owner-only staff invitations, also set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SITE_URL` for Netlify Functions. The service-role key is server-only; never prefix it with `VITE_`.
5. Deploy. The SPA, `/api/status`, and `/api/admin-invites` routes are preconfigured.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Run the SQL files in `supabase/migrations` in filename order. The official store catalog and server connection defaults are inserted by the first migration; the platform migration adds content tables, role-protected admin operations, audit records, and Storage buckets/policies.
4. In Supabase Auth, create or invite the initial owner account. Further staff accounts can be invited from Admin → Users & roles after deployment.
5. Assign that existing account an admin role using the SQL editor:

   ```sql
   insert into public.admin_roles (user_id, role)
   select id, 'owner' from auth.users where email = 'YOUR_ADMIN_EMAIL'
   on conflict (user_id) do update set role = excluded.role;
   ```

6. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a local `.env.local` file for development and to Netlify's environment variables for deployment. These are the project's public URL and anon/publishable key; never put the `service_role` key in the frontend.
7. Restart the Vite dev server after changing environment variables.
8. In Authentication → URL Configuration, set the Site URL to the app origin you are testing. Local redirect URLs currently allowed for this project are `http://localhost:5173/**`, `http://127.0.0.1:5173/**`, `http://localhost:4173/**`, and `http://127.0.0.1:4173/**`. Before deployment, set the Site URL to the production domain and add its redirect URL.

Do not create or distribute a default administrator password.

The `/admin` sign-in uses Supabase Auth password authentication and checks `admin_roles` before granting access. Authenticated users without an assigned role are signed out and denied. Staff accounts are invitation-only; public self-sign-up is not enabled by this website. Owners can send an invite from Admin → Users & roles; invitees set their password through the email link. Existing staff can use “Forgot or need to set your password?” on `/admin` to request a reset. If project variables are missing, sign-in stays disabled and the page explains what to configure.

The invitation function requires the production URL in Supabase Auth's redirect allowlist. It verifies the caller's owner role, permits only editor or administrator invitations, and keeps the Supabase service-role key on the server. Vite's local preview does not run Netlify functions; use Supabase Auth for local/initial account setup.

Supabase's built-in email service is limited to 2 emails per hour per project. If password recovery is rate-limited, check for an already-sent invite or reset email and wait for the limit to reset; configure custom SMTP to increase email throughput.

## Environment variables

- `JAVA_SERVER_ADDRESS`: Java Edition address for server status queries.
- `VITE_SUPABASE_URL`: Public Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Public Supabase anonymous key.
- `SUPABASE_URL`: Supabase project URL for the invitation function.
- `SUPABASE_ANON_KEY`: Supabase anon key for verifying the signed-in owner.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only Netlify function secret for owner-verified staff invitations. Never expose it to Vite/client code.
- `SITE_URL`: Production site origin used as the invitation redirect URL.
- Payment provider variables must be added only after a provider is selected and configured.

## Admin and public content

The `/admin` dashboard can manage server settings, homepage and page-introduction copy, features, rules, title records, news, staff, seasons, downloads, media, support links/FAQs, and the store catalog. Website settings accept plain text or JSON for structured content. Owners can invite staff accounts, assign roles to existing Supabase Auth accounts, and review the audit log.

The migrations publish the supplied SERAPHYX SMP community rules, Terms of Service, and title catalog. Title rarity tiers are visual site classifications based on the supplied requirements and availability; they are not represented as official in-game rarity settings. The site does not invent features, staff profiles, or season history; add confirmed details through the admin dashboard before publishing them. Leaderboard entries remain hidden until an administrator explicitly marks a statistics source as configured; this project does not include an automatic Minecraft statistics provider.

Checkout is intentionally disabled: no payment processor, trusted webhook, or automatic in-game delivery integration is configured. The order dashboard is for protected review/fulfillment records only and does not create payments. Do not collect or store payment-card details in this app.

## Missing information

The project intentionally uses setup placeholders until supplied:

- Supported Minecraft versions
- Crossplay status
- Gameplay type and descriptions
- Discord invitation
- Title images and officially assigned rarity labels
- Feature details and images
- Staff profiles
- News content
- Payment provider credentials
- Leaderboard and server statistics provider
- Production domain and deployment access

The official connection addresses, store catalog, rules, Terms of Service, and supplied title names and requirements are configured in the database migrations; supported versions, crossplay, title images and official in-game rarity labels, staff profiles, and gameplay features remain unconfirmed:

No server address, player count, Discord link, staff member, rank, price, or gameplay feature is invented.
