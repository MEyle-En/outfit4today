-- =====================================================================
-- Outfit4Today – Social-Schema (Crews, Posts, Reaktionen, Likes, Bundles, Chat)
-- Im Supabase SQL Editor komplett einfügen und ausführen. Mehrfaches Ausführen ist unkritisch (idempotent).
-- wardrobe_items und der Bucket "wardrobe-images" bleiben unverändert (nur eine zusätzliche Lese-Policy).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PROFILES (öffentliche Basisdaten, damit Namen/Avatare anderer angezeigt werden können)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------
-- 2) CREWS + MITGLIEDER
-- ---------------------------------------------------------------------
create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  invite_code text not null unique
    default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);
create index if not exists crew_members_user_idx on public.crew_members(user_id);

-- Hilfsfunktionen (security definer: umgehen RLS gezielt, verhindern Rekursion in Policies)
create or replace function public.is_crew_member(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crew_members where crew_id = c and user_id = auth.uid());
$$;

create or replace function public.shares_crew_with(u uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.crew_members a
    join public.crew_members b on a.crew_id = b.crew_id
    where a.user_id = auth.uid() and b.user_id = u
  );
$$;

-- Der Ersteller wird automatisch Mitglied seiner Crew
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.crew_members (crew_id, user_id) values (new.id, new.owner_id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists crews_add_owner on public.crews;
create trigger crews_add_owner after insert on public.crews
  for each row execute function public.add_owner_as_member();

-- Beitritt per Einladungscode (einziger Weg, Mitglied einer fremden Crew zu werden)
create or replace function public.join_crew(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_crew uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select id into v_crew from public.crews where invite_code = upper(trim(p_code));
  if v_crew is null then
    raise exception 'invalid invite code' using errcode = 'P0002';
  end if;
  insert into public.crew_members (crew_id, user_id) values (v_crew, auth.uid()) on conflict do nothing;
  return v_crew;
end;
$$;
revoke all on function public.join_crew(text) from public, anon;
grant execute on function public.join_crew(text) to authenticated;

alter table public.crews enable row level security;
alter table public.crew_members enable row level security;

drop policy if exists "crews_select_member" on public.crews;
create policy "crews_select_member" on public.crews
  for select to authenticated using (owner_id = auth.uid() or public.is_crew_member(id));
drop policy if exists "crews_insert_own" on public.crews;
create policy "crews_insert_own" on public.crews
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "crews_update_owner" on public.crews;
create policy "crews_update_owner" on public.crews
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "crews_delete_owner" on public.crews;
create policy "crews_delete_owner" on public.crews
  for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "crew_members_select_member" on public.crew_members;
create policy "crew_members_select_member" on public.crew_members
  for select to authenticated using (public.is_crew_member(crew_id));
-- Kein INSERT-Policy: Beitritt nur über join_crew() bzw. den Owner-Trigger
drop policy if exists "crew_members_delete_self_or_owner" on public.crew_members;
create policy "crew_members_delete_self_or_owner" on public.crew_members
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.crews c where c.id = crew_id and c.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 3) FIT-POSTS, KOMMENTARE, REAKTIONEN, LIKES
-- ---------------------------------------------------------------------
create table if not exists public.fit_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  crew_id uuid references public.crews(id) on delete cascade,
  caption text not null default '' check (char_length(caption) <= 500),
  is_public boolean not null default false,
  -- layers: Array von Momentaufnahmen je Teil, damit der Post auch nach Löschen des Items darstellbar bleibt:
  --   { "item_id": uuid, "name": text, "category": text,
  --     "image_url": text,                       -- Foto zum Zeitpunkt des Postens (Storage-URL)
  --     "has_transparent_background": bool,
  --     "x": num, "y": num, "size": num, "rotation": num }
  layers jsonb not null default '[]'::jsonb check (jsonb_typeof(layers) = 'array'),
  created_at timestamptz not null default now(),
  -- ohne Crew ist ein Fit immer öffentlich (Public Inspo)
  constraint fit_posts_crew_or_public check (crew_id is not null or is_public)
);
create index if not exists fit_posts_crew_idx on public.fit_posts(crew_id, created_at desc);
create index if not exists fit_posts_public_idx on public.fit_posts(created_at desc) where is_public;
create index if not exists fit_posts_author_idx on public.fit_posts(author_id, created_at desc);

create or replace function public.can_see_post(p uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.fit_posts fp
    where fp.id = p
      and (fp.is_public or fp.author_id = auth.uid() or (fp.crew_id is not null and public.is_crew_member(fp.crew_id)))
  );
$$;

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.fit_posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'comment' check (kind in ('comment', 'swap')),
  text text not null check (char_length(text) between 1 and 1000),
  -- swap: { offered_item_id, offered_name, target_item_id, target_name }
  swap jsonb,
  created_at timestamptz not null default now(),
  constraint post_comments_swap_data check (kind = 'comment' or swap is not null)
);
create index if not exists post_comments_post_idx on public.post_comments(post_id, created_at);

create table if not exists public.reactions (
  post_id uuid not null references public.fit_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type text not null check (type in ('fire', 'idea', 'want')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, type)
);

create table if not exists public.likes (
  target_type text not null check (target_type in ('post', 'listing')),
  target_id uuid not null,  -- post: fit_posts.id | listing: wardrobe_items.id oder bundles.id
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (target_type, target_id, user_id)
);
create index if not exists likes_target_idx on public.likes(target_type, target_id);

create or replace view public.like_counts with (security_invoker = on) as
  select target_type, target_id, count(*)::int as likes from public.likes group by target_type, target_id;
grant select on public.like_counts to authenticated;

alter table public.fit_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.reactions enable row level security;
alter table public.likes enable row level security;

drop policy if exists "fit_posts_select_visible" on public.fit_posts;
create policy "fit_posts_select_visible" on public.fit_posts
  for select to authenticated using (
    is_public or author_id = auth.uid() or (crew_id is not null and public.is_crew_member(crew_id))
  );
drop policy if exists "fit_posts_insert_own" on public.fit_posts;
create policy "fit_posts_insert_own" on public.fit_posts
  for insert to authenticated with check (
    author_id = auth.uid() and (crew_id is null or public.is_crew_member(crew_id))
  );
drop policy if exists "fit_posts_update_own" on public.fit_posts;
create policy "fit_posts_update_own" on public.fit_posts
  for update to authenticated using (author_id = auth.uid())
  with check (author_id = auth.uid() and (crew_id is null or public.is_crew_member(crew_id)));
drop policy if exists "fit_posts_delete_own" on public.fit_posts;
create policy "fit_posts_delete_own" on public.fit_posts
  for delete to authenticated using (author_id = auth.uid());

drop policy if exists "post_comments_select_visible" on public.post_comments;
create policy "post_comments_select_visible" on public.post_comments
  for select to authenticated using (public.can_see_post(post_id));
drop policy if exists "post_comments_insert_own" on public.post_comments;
create policy "post_comments_insert_own" on public.post_comments
  for insert to authenticated with check (author_id = auth.uid() and public.can_see_post(post_id));
drop policy if exists "post_comments_delete_own_or_post_owner" on public.post_comments;
create policy "post_comments_delete_own_or_post_owner" on public.post_comments
  for delete to authenticated using (
    author_id = auth.uid()
    or exists (select 1 from public.fit_posts fp where fp.id = post_id and fp.author_id = auth.uid())
  );

drop policy if exists "reactions_select_visible" on public.reactions;
create policy "reactions_select_visible" on public.reactions
  for select to authenticated using (public.can_see_post(post_id));
drop policy if exists "reactions_insert_own" on public.reactions;
create policy "reactions_insert_own" on public.reactions
  for insert to authenticated with check (user_id = auth.uid() and public.can_see_post(post_id));
drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own" on public.reactions
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "likes_select_authenticated" on public.likes;
create policy "likes_select_authenticated" on public.likes
  for select to authenticated using (true);
drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 4) BUNDLES (Outfit-Sets im Marktplatz)
-- ---------------------------------------------------------------------
create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_ids uuid[] not null check (array_length(item_ids, 1) between 1 and 12),
  price numeric(10, 2) not null check (price >= 0),
  description text not null default '' check (char_length(description) <= 500),
  only_together boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists bundles_owner_idx on public.bundles(owner_id, created_at desc);
alter table public.bundles enable row level security;

drop policy if exists "bundles_select_authenticated" on public.bundles;
create policy "bundles_select_authenticated" on public.bundles
  for select to authenticated using (true);
drop policy if exists "bundles_insert_own" on public.bundles;
create policy "bundles_insert_own" on public.bundles
  for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "bundles_update_own" on public.bundles;
create policy "bundles_update_own" on public.bundles
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "bundles_delete_own" on public.bundles;
create policy "bundles_delete_own" on public.bundles
  for delete to authenticated using (owner_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5) CHAT (Marktplatz-Anfragen) mit Realtime
-- ---------------------------------------------------------------------
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,            -- wardrobe_items.id oder bundles.id
  listing_title text not null,
  listing_image text,
  buyer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chat_threads_distinct_parties check (buyer_id <> seller_id),
  constraint chat_threads_unique unique (listing_id, buyer_id)
);
create index if not exists chat_threads_buyer_idx on public.chat_threads(buyer_id);
create index if not exists chat_threads_seller_idx on public.chat_threads(seller_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages(thread_id, created_at);

create or replace function public.is_thread_participant(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_threads
    where id = t and (buyer_id = auth.uid() or seller_id = auth.uid())
  );
$$;

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "chat_threads_select_participant" on public.chat_threads;
create policy "chat_threads_select_participant" on public.chat_threads
  for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());
drop policy if exists "chat_threads_insert_as_buyer" on public.chat_threads;
create policy "chat_threads_insert_as_buyer" on public.chat_threads
  for insert to authenticated with check (buyer_id = auth.uid());

drop policy if exists "chat_messages_select_participant" on public.chat_messages;
create policy "chat_messages_select_participant" on public.chat_messages
  for select to authenticated using (public.is_thread_participant(thread_id));
drop policy if exists "chat_messages_insert_participant" on public.chat_messages;
create policy "chat_messages_insert_participant" on public.chat_messages
  for insert to authenticated with check (sender_id = auth.uid() and public.is_thread_participant(thread_id));

-- Realtime für neue Nachrichten
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------
-- 6) wardrobe_items: zusätzliche LESE-Policy für geteilte Teile (bestehende "nur eigene"-Policies bleiben)
--    Sichtbar für andere nur, wenn nicht privat UND (auf dem Marktplatz ODER mit Crew geteilt + gemeinsame Crew).
--    Erwartet die Spalte "visibility" (jsonb) mit den Schlüsseln isPrivate / sharedWithCrew / onMarketplace.
-- ---------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'wardrobe_items' and column_name = 'visibility'
  ) then
    execute 'drop policy if exists "wardrobe_items_select_shared" on public.wardrobe_items';
    execute $p$
      create policy "wardrobe_items_select_shared" on public.wardrobe_items
        for select to authenticated using (
          user_id <> auth.uid()
          and coalesce((visibility::jsonb ->> 'isPrivate')::boolean, false) = false
          and (
            coalesce((visibility::jsonb ->> 'onMarketplace')::boolean, false)
            or (coalesce((visibility::jsonb ->> 'sharedWithCrew')::boolean, false) and public.shares_crew_with(user_id))
          )
        )
    $p$;
  else
    raise notice 'wardrobe_items.visibility nicht gefunden – Policy wardrobe_items_select_shared wurde NICHT angelegt';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 7) ERFOLGSMELDUNG
-- ---------------------------------------------------------------------
do $$
begin
  raise notice 'OK: Tabellen erstellt/geprüft: profiles, crews, crew_members, fit_posts, post_comments, reactions, likes, bundles, chat_threads, chat_messages';
  raise notice 'OK: Funktionen: join_crew(code), is_crew_member, shares_crew_with, can_see_post, is_thread_participant';
  raise notice 'OK: Row Level Security ist auf allen neuen Tabellen aktiv';
end $$;

-- Ergebnis-Tabelle (im Editor sichtbar): Tabelle, RLS aktiv?, Anzahl Policies
select
  c.relname as tabelle,
  c.relrowsecurity as rls_aktiv,
  (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('profiles','crews','crew_members','fit_posts','post_comments','reactions','likes','bundles','chat_threads','chat_messages','wardrobe_items')
order by c.relname;
