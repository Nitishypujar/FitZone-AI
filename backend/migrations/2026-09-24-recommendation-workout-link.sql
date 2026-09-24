-- FitZone AI exact recommendation -> workout identity
-- Run once in Supabase SQL editor. workouts.id is intentionally unchanged.

alter table public.recommendation_events
  add column if not exists workout_id bigint;

create index if not exists recommendation_events_workout_id_idx
  on public.recommendation_events (workout_id);

comment on column public.recommendation_events.workout_id is
  'Exact workouts.id generated for this recommendation. Preserves the authoritative workout identity for outcome learning.';
