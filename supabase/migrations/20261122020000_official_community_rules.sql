insert into public.rule_categories (name, display_order) values
  ('General Rules', 1),
  ('Gameplay Rules', 2),
  ('Anti-Lag Rules', 3),
  ('Discord Rules', 4),
  ('Safety Rules', 5),
  ('Ticket Rules', 6),
  ('Language Policy', 7),
  ('Punishments', 8),
  ('Important Notice', 9)
on conflict (name) do update
set display_order = excluded.display_order,
    updated_at = now();

insert into public.rules (category, content, display_order, published)
select seed.category, seed.content, seed.display_order, true
from (values
  ('General Rules', 'Treat all players and staff with respect.', 1),
  ('General Rules', 'Harassment, bullying, racism, discrimination, and excessive toxicity are prohibited.', 2),
  ('General Rules', 'Griefing, stealing, and trapping other players are not allowed.', 3),
  ('General Rules', 'Impersonation and making false accusations are prohibited.', 4),
  ('General Rules', 'Use common sense and respect the community.', 5),

  ('Gameplay Rules', 'Hacks, X-ray, duplication glitches, exploits, and unfair modifications are prohibited.', 1),
  ('Gameplay Rules', 'Do not abuse bugs, glitches, or unintended game mechanics.', 2),
  ('Gameplay Rules', 'Alt-account abuse and economy manipulation are not allowed.', 3),
  ('Gameplay Rules', 'Excessive PvP harassment and spawn trapping are prohibited.', 4),

  ('Anti-Lag Rules', 'Lag machines and excessive redstone mechanisms are prohibited.', 1),
  ('Anti-Lag Rules', 'Avoid creating excessive mobs, entities, or unnecessary farms.', 2),
  ('Anti-Lag Rules', 'TNT dupers and explosive spam are not allowed.', 3),
  ('Anti-Lag Rules', 'Staff reserve the right to remove builds, farms, or mechanisms that negatively affect server performance.', 4),

  ('Discord Rules', 'No spamming, message flooding, or excessive pinging.', 1),
  ('Discord Rules', 'NSFW, gore, and disturbing content are strictly prohibited.', 2),
  ('Discord Rules', 'Advertising or promoting other communities without permission is not allowed.', 3),
  ('Discord Rules', 'Maintain respectful behavior in text channels and voice channels.', 4),

  ('Safety Rules', 'Remember that our community includes minors. Keep interactions appropriate for all age groups.', 1),
  ('Safety Rules', 'Grooming, predatory behavior, and inappropriate conversations are strictly prohibited.', 2),
  ('Safety Rules', 'Never share another person''s private or personal information without permission.', 3),
  ('Safety Rules', 'Respect everyone''s privacy, personal boundaries, and comfort.', 4),

  ('Ticket Rules', 'Open tickets only for legitimate support requests or concerns.', 1),
  ('Ticket Rules', 'Do not create troll, duplicate, or spam tickets.', 2),
  ('Ticket Rules', 'Respect staff members and do not harass or pressure them for responses.', 3),
  ('Ticket Rules', 'False reports, fabricated evidence, and misleading information are prohibited.', 4),

  ('Language Policy', 'SERAPHYX SMP primarily uses English and Filipino (Tagalog) as its main community languages.', 1),
  ('Language Policy', 'Please avoid using other languages in public channels. This allows our staff team to properly understand conversations, address concerns, and ensure that everyone can participate comfortably.', 2),
  ('Language Policy', 'We appreciate your understanding and cooperation.', 3),

  ('Punishments', 'Violations of community rules may result in the following disciplinary actions:', 1),
  ('Punishments', 'The severity of the punishment will depend on the nature and circumstances of the violation. Serious offenses may result in more immediate disciplinary action.', 2),

  ('Important Notice', 'All punishments listed in these rules are general guidelines and may vary depending on the severity, frequency, context, and circumstances of each violation and use common sense.', 1),
  ('Important Notice', 'Staff members reserve the right to adjust, escalate, or determine appropriate disciplinary actions when necessary to protect the community, maintain fairness, and preserve the integrity of SERAPHYX SMP.', 2)
) as seed(category, content, display_order)
where not exists (
  select 1
  from public.rules existing
  where existing.category = seed.category
    and existing.content = seed.content
);

insert into public.site_settings (key, value, is_public) values
  ('rules_introduction', to_jsonb('Welcome to SERAPHYX SMP! Our goal is to maintain a safe, fair, and enjoyable environment for everyone. Please read and follow all community guidelines to ensure a positive experience for every member.'::text), true),
  ('rules_signoff', to_jsonb(U&'SERAPHYX SMP \2022 Respect Everyone \2022 Stay Safe \2022 Have Fun \+01F49C'::text), true)
on conflict (key) do nothing;
