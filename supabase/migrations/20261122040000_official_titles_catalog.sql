insert into public.titles (
  id, name, description, requirements, rarity, reward, special_conditions,
  category, featured, published, display_order, discord_only
)
select
  seed.id,
  seed.name,
  '',
  seed.requirements,
  '',
  '',
  coalesce(nullif(btrim(seed.special_conditions), ''), ''),
  seed.category,
  seed.discord_only,
  true,
  seed.id,
  seed.discord_only
from (values
  (1, $$Predator$$, $$COMBAT & KILL TITLES$$, $$Eliminate 10 players.$$ , $$ $$, false),
  (2, $$Carnage$$, $$COMBAT & KILL TITLES$$, $$Eliminate 25 players.$$ , $$ $$, false),
  (3, $$Bloodhound$$, $$COMBAT & KILL TITLES$$, $$Eliminate 50 players.$$ , $$ $$, false),
  (4, U&'Seraphim\2019s Wrath', $$COMBAT & KILL TITLES$$, $$Eliminate 100 players.$$ , $$ $$, false),
  (5, $$Reaper$$, $$COMBAT & KILL TITLES$$, $$Eliminate 250 players.$$ , $$ $$, false),
  (6, $$Dreadlord$$, $$COMBAT & KILL TITLES$$, $$Eliminate 500 players.$$ , $$ $$, false),
  (7, $$Omnicide$$, $$COMBAT & KILL TITLES$$, $$Eliminate 1,000 players.$$ , $$ $$, false),
  (8, $$Berserker$$, $$COMBAT & KILL TITLES$$, $$Achieve a 10-kill streak without dying.$$ , $$ $$, false),
  (9, $$Annihilator$$, $$COMBAT & KILL TITLES$$, $$Achieve a 50-kill streak without dying.$$ , $$ $$, false),
  (10, $$Raging Demon$$, $$COMBAT & KILL TITLES$$, $$Achieve 50 consecutive kills without dying or disconnecting.$$ , $$ $$, false),
  (11, $$Raging Hell$$, $$COMBAT & KILL TITLES$$, $$Achieve 100 consecutive kills without dying or disconnecting.$$ , $$ $$, false),
  (12, $$Godslayer$$, $$COMBAT & KILL TITLES$$, $$Defeat the player currently holding the highest kill count, provided there is no tie.$$ , $$ $$, false),
  (13, U&'God\2019s Punishment', $$COMBAT & KILL TITLES$$, U&'Eliminate 3 players who possess God\2019s Bane.' , $$ $$, false),
  (14, $$CELESTIAL MENACE$$, $$COMBAT & KILL TITLES$$, $$Eliminate 30 players belonging to the Celestial faction.$$ , $$ $$, false),
  (15, $$INFERNAL MENACE$$, $$COMBAT & KILL TITLES$$, $$Eliminate 30 players belonging to the Infernal faction.$$ , $$ $$, false),
  (16, $$EQUILIBRIUM$$, $$COMBAT & KILL TITLES$$, $$Eliminate 25 Celestial players and 25 Infernal players.$$ , $$ $$, false),

  (17, $$Bounty Hunter$$, $$BOUNTY & HUNTING TITLES$$, $$Eliminate 10 players with an active bounty.$$ , $$ $$, false),
  (18, $$MERCENARY$$, $$BOUNTY & HUNTING TITLES$$, $$Eliminate 25 players with an active bounty.$$ , $$ $$, false),
  (19, $$APEX HUNTER$$, $$BOUNTY & HUNTING TITLES$$, $$Eliminate 50 players with an active bounty.$$ , $$ $$, false),

  (20, $$El Diablo$$, $$PROGRESSION & RANK TITLES$$, $$Reach the highest rank of the Infernal Path: Lucifer.$$ , $$ $$, false),
  (21, $$The Omnipotent$$, $$PROGRESSION & RANK TITLES$$, $$Reach the highest rank of the Celestial Path: Empyrean.$$ , $$ $$, false),
  (22, $$Guild Commander$$, $$PROGRESSION & RANK TITLES$$, $$Currently unavailable.$$ , $$Coming Soon.$$ , false),

  (23, $$Insomniac$$, $$PLAYTIME & ACTIVITY TITLES$$, $$Accumulate 72 hours of playtime.$$ , $$ $$, false),
  (24, $$Relentless$$, $$PLAYTIME & ACTIVITY TITLES$$, $$Accumulate 100 hours of playtime.$$ , $$ $$, false),
  (25, $$Sleepless$$, $$PLAYTIME & ACTIVITY TITLES$$, $$Accumulate 150 hours of playtime.$$ , $$ $$, false),
  (26, $$The Timeless$$, $$PLAYTIME & ACTIVITY TITLES$$, $$Accumulate 300 hours of playtime.$$ , $$ $$, false),
  (27, $$AFK Legend$$, $$PLAYTIME & ACTIVITY TITLES$$, $$Accumulate 72 hours of AFK time while remaining in one location without moving your head.$$ , $$ $$, false),
  (28, $$Immortal Demon$$, $$PLAYTIME & ACTIVITY TITLES$$, $$Accumulate 300 hours of playtime without a single death.$$ , $$Requires administrator verification.$$ , false),

  (29, $$Millionaire$$, $$ECONOMY & WEALTH TITLES$$, $$Accumulate a total balance of 1,000,000.$$ , $$ $$, false),
  (30, $$Richest Being$$, $$ECONOMY & WEALTH TITLES$$, $$Accumulate a total balance of 30,000,000.$$ , $$ $$, false),

  (31, $$Wanted$$, $$BOUNTY STATUS TITLES$$, $$Have an active bounty of 500.$$ , $$ $$, false),
  (32, $$Outlaw$$, $$BOUNTY STATUS TITLES$$, $$Have an active bounty of 1,000.$$ , $$ $$, false),
  (33, $$Infamous$$, $$BOUNTY STATUS TITLES$$, $$Have an active bounty of 2,500.$$ , $$ $$, false),
  (34, $$Public Enemy$$, $$BOUNTY STATUS TITLES$$, $$Have an active bounty of 5,000.$$ , $$ $$, false),
  (35, $$Most Wanted$$, $$BOUNTY STATUS TITLES$$, $$Accumulate a bounty of 10,000.$$ , $$ $$, false),
  (36, $$MOST WANTED$$, $$BOUNTY STATUS TITLES$$, $$Accumulate a bounty of 50,000.$$ , $$ $$, false),

  (37, U&'God\2019s Bane', $$SPECIAL COMBAT & BOSS TITLES$$, $$Eliminate an @ADMIN or the server @OWNER to earn this title.$$ , $$This title will only be awarded if the administrator or owner has active OP (Operator) status at the time of their death. Eliminating an administrator or owner without OP status will not qualify.$$ , false),
  (38, $$DRAGON SLAYER$$, $$SPECIAL COMBAT & BOSS TITLES$$, $$Defeat the Ender Dragon 50 times.$$ , $$ $$, false),
  (39, $$PIRATE KING$$, $$SPECIAL COMBAT & BOSS TITLES$$, $$Acquisition requirements are currently undisclosed.$$ , $$Exclusive title.$$ , false),

  (40, $$Primordial$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Exclusively available to players who participated in Season 1 or Tambayan SMP.$$ , $$Requires administrator verification.$$ , false),
  (41, $$Philanthropist$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Granted by staff after an eligible store purchase has been verified.$$ , $$ $$, false),
  (42, $$Crimson Tyrant$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Administrator-awarded title for the player with the greatest influence over the Nether.$$ , $$ $$, false),
  (43, $$Void Emperor$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Administrator-awarded title for the player with the greatest influence over the End.$$ , $$ $$, false),
  (44, $$Verdant Monarch$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Administrator-awarded title for the player with the greatest influence over the Overworld.$$ , $$ $$, false),
  (45, $$TRAILBLAZER$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Exclusive title awarded by an administrator to a player ranked among the Top 3 inviters.$$ , $$ $$, false),
  (46, $$BLESSED ONE$$, $$EXCLUSIVE & SPECIAL ACHIEVEMENT TITLES$$, $$Exclusive title awarded to the winner of a server giveaway.$$ , $$ $$, false),

  (47, $$Combat Master$$, $$COMPETITIVE & ELO TITLES$$, $$Finish within the Top 3 of the ELO leaderboard after its first month.$$ , $$Currently inactive.$$ , false),
  (48, $$Combat Grandmaster$$, $$COMPETITIVE & ELO TITLES$$, $$Secure Rank #1 on the ELO leaderboard after its first month.$$ , $$Currently inactive.$$ , false),
  (49, $$@Elijah's Circle$$, $$DISCORD-EXCLUSIVE RECOGNITION$$, $$An exclusive Discord role reserved for individuals personally recognized by the server owner and their trusted friends.$$ , $$This role is not obtainable through in-game achievements, purchases, applications, or ordinary progression. Recipients are personally selected based on recognition and trust. It is intentionally difficult to earn and is granted only at the discretion of @Eliii and their friends.$$ , true)
) as seed(id, name, category, requirements, special_conditions, discord_only)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    requirements = excluded.requirements,
    reward = excluded.reward,
    special_conditions = excluded.special_conditions,
    category = excluded.category,
    featured = excluded.featured,
    published = excluded.published,
    display_order = excluded.display_order,
    discord_only = excluded.discord_only;

insert into public.site_settings (key, value, is_public)
values (
  'titles_introduction',
  to_jsonb('Earn your achievements, prove your abilities, and establish your legacy. Each title represents a milestone, accomplishment, or exclusive achievement within SERAPHYX SMP.'::text),
  true
)
on conflict (key) do update
set value = excluded.value,
    is_public = excluded.is_public,
    updated_at = now();
