-- STEP 17: 익명 게시글/댓글 작성자 UUID 비공개
-- 적용 대상: Supabase project djadqsfdrrihkswplzcn

create or replace view public.posts_public_safe
with (security_barrier = true)
as
select
  p.id,
  p.category,
  p.business_type,
  p.title,
  p.content,
  p.is_anonymous,
  p.view_count,
  p.created_at,
  p.updated_at,
  p.status,
  p.content_html,
  ((select auth.uid()) is not null and (select auth.uid()) = p.user_id) as is_mine
from public.posts p
where p.status = 'ACTIVE';

revoke all on public.posts_public_safe from public, anon, authenticated;
grant select on public.posts_public_safe to anon, authenticated;

create or replace view public.comments_public_safe
with (security_barrier = true)
as
select
  c.id,
  c.post_id,
  c.content,
  c.is_anonymous,
  c.created_at,
  c.status,
  c.parent_comment_id,
  ((select auth.uid()) is not null and (select auth.uid()) = c.user_id) as is_mine
from public.comments c
join public.posts p on p.id = c.post_id
where c.status = 'ACTIVE'
  and p.status = 'ACTIVE';

revoke all on public.comments_public_safe from public, anon, authenticated;
grant select on public.comments_public_safe to anon, authenticated;

create or replace function public.increment_active_post_view(p_post_id bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.posts
  set view_count = coalesce(view_count,0) + 1
  where id = p_post_id
    and status = 'ACTIVE'
  returning view_count into v_count;

  return v_count;
end;
$$;

revoke all on function public.increment_active_post_view(bigint) from public;
grant execute on function public.increment_active_post_view(bigint) to anon, authenticated;

drop policy if exists posts_select_active on public.posts;
create policy posts_select_active
on public.posts
for select
to anon, authenticated
using (
  status = 'ACTIVE'
  and (
    coalesce(is_anonymous,false) = false
    or ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  )
);

drop policy if exists comments_select_active on public.comments;
create policy comments_select_active
on public.comments
for select
to anon, authenticated
using (
  (
    status = 'ACTIVE'
    and (
      coalesce(is_anonymous,false) = false
      or ((select auth.uid()) is not null and (select auth.uid()) = user_id)
    )
  )
  or (
    (select auth.uid()) is not null
    and (select auth.uid()) = user_id
    and status = 'DELETED'
  )
);
