-- Progres onboarding tur per pengguna: lanjutkan dari langkah terakhir.
-- RLS: tiap pengguna hanya baca/tulis baris milik sendiri (auth.uid()).

create table if not exists tour_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  tour_id text not null,
  status text not null default 'in_progress',
  current_step_id text,
  furthest_step_id text,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, tour_id)
);

alter table tour_progress enable row level security;

drop policy if exists tour_progress_owner on tour_progress;
create policy tour_progress_owner on tour_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
