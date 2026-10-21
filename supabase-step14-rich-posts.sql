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
