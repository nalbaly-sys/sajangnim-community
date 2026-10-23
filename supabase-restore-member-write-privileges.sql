-- 일반 회원 커뮤니티 쓰기 권한 복구
-- RLS 정책은 그대로 유지하고, authenticated 역할이 정책까지 도달할 수 있도록
-- 필요한 테이블 권한만 부여한다.

grant insert, update on public.posts to authenticated;
grant insert, update on public.comments to authenticated;
grant insert, delete on public.reactions to authenticated;
grant insert, delete on public.comment_reactions to authenticated;
grant insert, update on public.reports to authenticated;

-- bigint identity/serial 기반 기존 커뮤니티 테이블과 새 투표 테이블 모두를 위해
-- authenticated 역할의 public 시퀀스 사용 권한을 유지한다.
grant usage, select on all sequences in schema public to authenticated;
