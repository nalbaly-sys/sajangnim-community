-- STEP 14: 게시글 리치 본문 + 이미지 Storage

alter table public.posts add column if not exists content_html text;

grant select (content_html) on public.posts to anon, authenticated;
grant insert (content_html) on public.posts to authenticated;
grant update (content_html) on public.posts to authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "post_images_insert_own_folder" on storage.objects;
create policy "post_images_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id='post-images'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','gif')
);

drop policy if exists "post_images_select_own_folder" on storage.objects;
create policy "post_images_select_own_folder"
on storage.objects
for select
to authenticated
using (
  bucket_id='post-images'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);

drop policy if exists "post_images_delete_own_folder" on storage.objects;
create policy "post_images_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id='post-images'
  and (storage.foldername(name))[1]=(select auth.uid()::text)
);

-- 기존 게시글 UPDATE 보호 트리거가 content_html 변경도 정상적인 본인 수정으로 인정하도록 확장
create or replace function public.protect_post_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if session_user = 'postgres' or (select auth.role()) = 'service_role' then
    return new;
  end if;

  if v_uid is not null and public.is_active_admin() then
    return new;
  end if;

  if old.status = 'ACTIVE'
     and new.status = old.status
     and coalesce(new.view_count, 0) = coalesce(old.view_count, 0) + 1
     and (to_jsonb(new) - array['view_count']) = (to_jsonb(old) - array['view_count']) then
    return new;
  end if;

  if v_uid is not null
     and old.user_id = v_uid
     and new.user_id = old.user_id
     and old.status = 'ACTIVE'
     and new.status in ('ACTIVE','DELETED')
     and (to_jsonb(new) - array['title','content','content_html','updated_at','status'])
         = (to_jsonb(old) - array['title','content','content_html','updated_at','status']) then
    return new;
  end if;

  raise exception '게시글을 수정할 권한이 없습니다.' using errcode = '42501';
end;
$function$;
