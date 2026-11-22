insert into public.site_settings (key, value, is_public) values
  (
    'terms_introduction',
    to_jsonb('By joining, accessing, purchasing from, or participating in SERAPHYX SMP and its associated Discord server, you confirm that you have read, understood, and agreed to the terms and policies outlined below.'::text),
    true
  ),
  (
    'terms_sections',
    $$[
      {"title":"Acceptance of Terms","items":[
        "By accessing SERAPHYX SMP or its Discord server, you agree to follow these Terms of Service.",
        "Management reserves the right to revise policies, rules, features, and server systems whenever necessary.",
        "Remaining a member or continuing to use our services after policy changes means you accept the updated terms."
      ]},
      {"title":"Purchases & Refund Policy","items":[
        "All purchases are considered final and are strictly non-refundable.",
        "Virtual items, ranks, currencies, and server benefits have no real-world cash value.",
        "Fraudulent transactions, unauthorized chargebacks, or payment disputes may result in an immediate permanent ban.",
        "Items lost due to verified server crashes or confirmed technical issues may be recovered at management's discretion."
      ]},
      {"title":"Limitation of Liability","items":[
        "SERAPHYX SMP, including its owners, developers, staff, and affiliates, shall not be held responsible for losses, damages, emotional distress, personal disputes, harassment, bullying, compromised accounts, or service interruptions arising from the use of our server or Discord community.",
        "Every user is responsible for their own online behavior, interactions, and account security.",
        "All services are provided on an \"as-is\" basis, without any guarantee of uninterrupted access, permanent data preservation, or continuous availability."
      ]},
      {"title":"Account & User Responsibilities","items":[
        "Members are responsible for their accounts, devices, credentials, and activities.",
        "Sharing account access with others is done entirely at the account owner's own risk.",
        "Users should take appropriate measures to block, report, or distance themselves from harmful interactions whenever possible.",
        "Disciplinary actions remain applicable to the account involved, even in cases of shared or compromised access, unless management determines otherwise."
      ]},
      {"title":"Community Conduct Policy","items":[
        "Harassment, bullying, threats, discrimination, hate speech, stalking, impersonation, intimidation, and targeted toxicity are strictly prohibited.",
        "Management reserves the authority to remove individuals whose behavior threatens the safety, integrity, or overall experience of the community.",
        "Disagreements, conflicts, and personal disputes between members may be reviewed and addressed by staff when necessary."
      ]},
      {"title":"Child Safety & Protection Policy","items":[
        "SERAPHYX SMP is a community that includes members under the age of 18.",
        "Grooming, predatory conduct, sexual harassment, inappropriate interactions involving minors, and requests for private or personal content are strictly forbidden.",
        "Serious incidents or credible threats involving child safety may be escalated to Discord Trust & Safety or the appropriate authorities when necessary."
      ]},
      {"title":"Support & Ticket Policy","items":[
        "Support tickets must only be submitted for genuine concerns, inquiries, or assistance.",
        "False reports, manipulated evidence, ticket abuse, unnecessary spam, and harassment toward staff members are prohibited.",
        "Management reserves the right to review, archive, or close tickets when required for security, moderation, or operational purposes."
      ]},
      {"title":"Server Rights & Intellectual Property","items":[
        "All original server assets, branding, configurations, systems, and custom-developed content belong to SERAPHYX SMP or their respective owners.",
        "Unauthorized duplication, distribution, disclosure, or commercial resale of protected server materials is prohibited.",
        "Permission must be obtained before using or redistributing materials owned by the server."
      ]},
      {"title":"Enforcement & Management Rights","items":[
        "Management reserves the right to issue warnings, mutes, kicks, data wipes, suspensions, blacklists, or permanent bans when appropriate.",
        "Serious violations may result in immediate disciplinary action without prior warnings.",
        "Ban evasion, restriction circumvention, or attempts to bypass moderation measures may lead to additional or extended penalties."
      ]}
    ]$$::jsonb,
    true
  ),
  (
    'terms_signoff',
    to_jsonb(U&'SERAPHYX SMP \2022 Safe Community \2022 Protected Environment \2022 Fair Gameplay'::text),
    true
  )
on conflict (key) do update
set value = excluded.value,
    is_public = excluded.is_public,
    updated_at = now();
