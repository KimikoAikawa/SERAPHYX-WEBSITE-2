insert into public.site_settings (key, value, is_public)
values
  ('site_tagline', to_jsonb('An evolving survival realm, shaped by its community.'::text), true),
  ('homepage_eyebrow', to_jsonb('Welcome to the realm'::text), true),
  ('server_page_intro', to_jsonb('The main SMP and SERAPHYX Events use separate server addresses.'::text), true),
  ('features_page_intro', to_jsonb('Explore the features configured for SERAPHYX SMP.'::text), true),
  ('news_page_intro', to_jsonb('Published server updates and community announcements.'::text), true),
  ('staff_page_intro', to_jsonb('Meet the people helping shape SERAPHYX SMP.'::text), true),
  ('downloads_page_intro', to_jsonb('Published server files and community resources, delivered from secure cloud storage.'::text), true),
  ('seasons_page_intro', to_jsonb('Explore the current SERAPHYX season and archived worlds.'::text), true),
  ('leaderboard_page_intro', to_jsonb('Rankings are shown only when a verified statistics source is connected.'::text), true),
  ('support_page_intro', to_jsonb('Find the right place for assistance. External support links appear here when the team configures them.'::text), true)
on conflict (key) do nothing;
