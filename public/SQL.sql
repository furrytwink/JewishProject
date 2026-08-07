create table leaderboard (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    coins bigint not null default 0,
    updated_at timestamptz not null default now()
);

alter table leaderboard enable row level security;

create policy "anyone can read the leaderboard"
    on leaderboard for select
    using (true);

create policy "anyone can add their score"
    on leaderboard for insert
    with check (true);

create policy "anyone can update their score"
    on leaderboard for update
    using (true)
    with check (true);