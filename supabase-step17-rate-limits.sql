-- Stage 17: 커뮤니티 스팸/도배 방지
-- 게시글: 최소 10초 간격 / 10분 최대 10개
-- 댓글·대댓글: 최소 2초 간격 / 10분 최대 40개
-- 신고: 최소 3초 간격 / 1시간 최대 20개

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rate_limit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  action text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists rate_limit_events_user_action_time_idx
  on private.rate_limit_events (user_id, action, occurred_at desc);

revoke all on table private.rate_limit_events from public, anon, authenticated;

create or replace function private.enforce_rate_limit(
  p_user_id uuid,
  p_action text,
  p_min_interval interval,
  p_window interval,
  p_max_count integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_last_at timestamptz;
  v_recent_count integer;
begin
  if p_user_id is null then
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(p_user_id::text || ':' || p_action)
  );

  select max(e.occurred_at),
         count(*) filter (where e.occurred_at >= now() - p_window)
    into v_last_at, v_recent_count
  from private.rate_limit_events e
  where e.user_id = p_user_id
    and e.action = p_action
    and e.occurred_at >= now() - greatest(p_window, p_min_interval);

  if v_last_at is not null and v_last_at > now() - p_min_interval then
    raise exception using
      errcode = 'P0001',
      message = '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.';
  end if;

  if coalesce(v_recent_count, 0) >= p_max_count then
    raise exception using
      errcode = 'P0001',
      message = '짧은 시간에 너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
  end if;

  insert into private.rate_limit_events(user_id, action, occurred_at)
  values (p_user_id, p_action, now());

  delete from private.rate_limit_events
  where user_id = p_user_id
    and action = p_action
    and occurred_at < now() - interval '2 days';
end;
$$;

revoke all on function private.enforce_rate_limit(uuid,text,interval,interval,integer)
from public, anon, authenticated;

create or replace function public.enforce_community_insert_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'posts' then
    perform private.enforce_rate_limit(new.user_id, 'POST', interval '10 seconds', interval '10 minutes', 10);
  elsif tg_table_name = 'comments' then
    perform private.enforce_rate_limit(new.user_id, 'COMMENT', interval '2 seconds', interval '10 minutes', 40);
  elsif tg_table_name = 'reports' then
    perform private.enforce_rate_limit(new.reporter_id, 'REPORT', interval '3 seconds', interval '1 hour', 20);
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_community_insert_rate_limit()
from public, anon, authenticated;

drop trigger if exists trg_rate_limit_posts on public.posts;
create trigger trg_rate_limit_posts
before insert on public.posts
for each row execute function public.enforce_community_insert_rate_limit();

drop trigger if exists trg_rate_limit_comments on public.comments;
create trigger trg_rate_limit_comments
before insert on public.comments
for each row execute function public.enforce_community_insert_rate_limit();

drop trigger if exists trg_rate_limit_reports on public.reports;
create trigger trg_rate_limit_reports
before insert on public.reports
for each row execute function public.enforce_community_insert_rate_limit();
