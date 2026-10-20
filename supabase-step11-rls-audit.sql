-- ============================================================
-- STEP 11 관리자 보안 2차: RLS / 정책 전용 점검
-- 목적
-- 1) 주요 테이블 RLS 활성 여부 확인
-- 2) 실제 RLS 정책의 cmd / roles / qual / with_check 확인
-- 3) 테이블 직접 권한(grant) 확인
-- 4) 관리자 전용 RPC의 anon 차단 재확인
--
-- Supabase SQL Editor에서 전체 실행 후 결과를 복사해 확인합니다.
-- 이 파일은 정책을 변경하지 않고 '점검만' 합니다.
-- ============================================================

-- ------------------------------------------------------------
-- A. 주요 테이블 RLS 상태
-- rls_enabled는 모두 true인지 확인합니다.
-- force_rls는 false여도 일반 Supabase 클라이언트 보호에는 문제 없지만
-- 테이블 소유자까지 RLS를 강제할 필요가 있는지는 별도 판단합니다.
-- ------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('profiles','posts','comments','reports','reactions')
ORDER BY c.relname;

-- ------------------------------------------------------------
-- B. RLS 정책 전체
-- 특히 profiles UPDATE 정책과 reports SELECT/UPDATE 정책을 집중 확인합니다.
-- ------------------------------------------------------------
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles','posts','comments','reports','reactions')
ORDER BY tablename, cmd, policyname;

-- ------------------------------------------------------------
-- C. public 테이블 권한
-- anon/authenticated에 UPDATE/DELETE가 넓게 열려 있어도 RLS가 방어할 수 있지만,
-- 불필요한 권한은 최소화하는 것이 좋습니다.
-- ------------------------------------------------------------
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('profiles','posts','comments','reports','reactions')
  AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;

-- ------------------------------------------------------------
-- D. profiles의 role/status 보호 트리거 존재 여부
-- enabled가 O 또는 A이면 활성 상태입니다.
-- ------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  pg_get_triggerdef(t.oid, true) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'profiles'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ------------------------------------------------------------
-- E. 관리자 함수 ACL 재확인
-- anon이 없어야 정상입니다.
-- ------------------------------------------------------------
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  p.prosecdef AS security_definer,
  p.proconfig AS config,
  p.proacl AS acl
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_active_admin',
    'protect_profile_security_fields',
    'admin_get_report_target',
    'admin_set_report_target_status',
    'admin_list_comments',
    'admin_list_post_comments',
    'admin_page_reports',
    'admin_page_posts',
    'admin_page_comments',
    'admin_page_members',
    'admin_unified_search'
  )
ORDER BY p.proname;
