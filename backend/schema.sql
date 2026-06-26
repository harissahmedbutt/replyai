-- Run this in your Supabase SQL editor

create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  name text,
  personal_wa_number text,
  stripe_customer_id text,
  plan text default 'free',
  created_at timestamptz default now()
);

create table wa_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  agent_number text unique not null,
  control_number text unique not null,
  twilio_sid_agent text,
  twilio_sid_control text,
  status text default 'active',
  created_at timestamptz default now()
);

-- contacts == leads. Qualification fields are filled by the AI as it talks to the lead.
create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  wa_id text not null,
  display_name text,
  notes text,
  profile_summary text,
  key_facts jsonb default '{}',
  last_message_at timestamptz,
  -- Real-estate lead qualification
  intent text,                       -- buy | rent | sell | unknown
  budget_min numeric,                -- AED
  budget_max numeric,                -- AED
  areas jsonb default '[]',          -- ["Dubai Marina","JLT"]
  bedrooms text,                     -- studio | 1 | 2 | 3 | 4+
  timeline text,                     -- asap | 1-3m | 3-6m | browsing | unknown
  purpose text,                      -- investment | end-use | unknown
  stage text default 'new',          -- new|qualifying|qualified|viewing|negotiating|won|lost
  score text default 'cold',         -- hot | warm | cold
  source text,                       -- portal/ad tag (e.g. Bayut)
  created_at timestamptz default now(),
  unique(user_id, wa_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  wa_message_id text,
  timestamp timestamptz default now()
);

create table drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  draft_text text not null,
  status text default 'pending' check (status in ('pending','sent','edited','dismissed','expired')),
  created_at timestamptz default now(),
  actioned_at timestamptz
);

create table personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  persona_doc text not null,
  last_built_at timestamptz default now()
);

-- Agent's business profile — drives the AI's qualification + voice
create table agency_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  agent_name text,
  agency_name text,
  areas_served jsonb default '[]',
  specialties text,
  working_hours text,
  tone text,
  greeting text,
  about text,
  currency text default 'AED',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  auto_reply boolean default false,
  reply_groups boolean default false,
  reply_unknown boolean default true,
  active boolean default true,
  draft_expiry_mins integer default 30
);

-- Auto-create user row on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into users (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- RLS: users can only see their own data
alter table users enable row level security;
alter table wa_numbers enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;
alter table drafts enable row level security;
alter table personas enable row level security;
alter table agency_profile enable row level security;
alter table settings enable row level security;

create policy "own data" on users for all using (auth.uid() = id);
create policy "own data" on wa_numbers for all using (auth.uid() = user_id);
create policy "own data" on contacts for all using (auth.uid() = user_id);
create policy "own data" on messages for all using (auth.uid() = user_id);
create policy "own data" on drafts for all using (auth.uid() = user_id);
create policy "own data" on personas for all using (auth.uid() = user_id);
create policy "own data" on agency_profile for all using (auth.uid() = user_id);
create policy "own data" on settings for all using (auth.uid() = user_id);

-- Service role bypasses RLS (for webhook processing)
-- The backend uses SUPABASE_SERVICE_KEY which bypasses RLS automatically

-- Indexes for performance
create index on messages(contact_id, timestamp desc);
create index on messages(user_id, timestamp desc);
create index on drafts(user_id, status, created_at desc);
create index on contacts(user_id, last_message_at desc);
create index on contacts(user_id, stage, score);
create index on contacts(user_id, score);
