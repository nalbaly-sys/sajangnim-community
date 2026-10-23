-- 익명 게시글/댓글에서도 일반 회원 상호작용이 가능하도록 RLS 보정
-- 작성자 user_id를 공개하지 않고 ACTIVE 여부만 SECURITY DEFINER helper로 판정

create or replace function public.is_active_post_for_interaction(p_post_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.posts p
    where p.id = p_post_id and p.status = 'ACTIVE'
  );
$$;

create or replace function public.is_active_comment_for_interaction(p_comment_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.comments c
    join public.posts p on p.id = c.post_id
    where c.id = p_comment_id
      and c.status = 'ACTIVE'
      and p.status = 'ACTIVE'
  );
$$;

revoke all on function public.is_active_post_for_interaction(bigint) from public;
revoke all on function public.is_active_comment_for_interaction(bigint) from public;
grant execute on function public.is_active_post_for_interaction(bigint) to authenticated;
grant execute on function public.is_active_comment_for_interaction(bigint) to authenticated, anon;

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'ACTIVE'
  and public.is_active_post_for_interaction(post_id)
);

drop policy if exists reactions_insert_own on public.reactions;
create policy reactions_insert_own on public.reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_active_post_for_interaction(post_id)
);

drop policy if exists comment_reactions_insert_own on public.comment_reactions;
create policy comment_reactions_insert_own on public.comment_reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and public.is_active_comment_for_interaction(comment_id)
);

drop policy if exists comment_reactions_public_select on public.comment_reactions;
create policy comment_reactions_public_select on public.comment_reactions
for select to anon, authenticated
using (public.is_active_comment_for_interaction(comment_id));
