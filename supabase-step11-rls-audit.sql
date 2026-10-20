-- ============================================================
-- STEP 11 관리자 보안 2차: RLS / 정책 통합 점검
-- 목적
-- Supabase SQL Editor가 여러 SELECT 중 마지막 결과만 보여주는 문제를 피하기 위해
-- RLS 상태, 정책, 테이블 권한, profiles 보호 트리거, 관리자 함수 ACL을
-- 하나의 JSON 결과로 통합해서 반환합니다.
--
-- 이 파일은 정책을 변경하지 않고 '점검만' 합니다.
-- ============================================================

WITH
rls AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'schema_name', n.nspname,
    'table_name', c.relname,
    'rls_enabled', c.relrowsecurity,
    'force_rls', c.relforcerowsecurity
  ) ORDER BY c.relname), '[]'::jsonb) AS data
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname IN ('profiles','posts','comments','reports','reactions')
),
policies AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'schemaname', schemaname,
    'tablename', tablename,
    'policyname', policyname,
    'permissive', permissive,
    'roles', roles,
    'cmd', cmd,
    'qual', qual,
    'with_check', with_check
  ) ORDER BY tablename, cmd, policyname), '[]'::jsonb) AS data
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles','posts','comments','reports','reactions')
),
grants AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'table_schema', table_schema,
    'table_name', table_name,
    'grantee', grantee,
    'privilege_type', privilege_type
  ) ORDER BY table_name, grantee, privilege_type), '[]'::jsonb) AS data
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('profiles','posts','comments','reports','reactions')
    AND grantee IN ('anon','authenticated')
),
triggers AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'schema_name', n.nspname,
    'table_name', c.relname,
    'trigger_name', t.tgname,
    'enabled', t.tgenabled,
    'trigger_definition', pg_get_triggerdef(t.oid, true)
  ) ORDER BY t.tgname), '[]'::jsonb) AS data
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
    AND NOT t.tgisinternal
),
functions AS (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'schema_name', n.nspname,
    'function_name', p.proname,
    'arguments', pg_get_function_identity_arguments(p.oid),
    'security_definer', p.prosecdef,
    'config', p.proconfig,
    'acl', p.proacl
  ) ORDER BY p.proname), '[]'::jsonb) AS data
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
)
SELECT jsonb_pretty(jsonb_build_object(
  'rls', (SELECT data FROM rls),
  'policies', (SELECT data FROM policies),
  'table_grants', (SELECT data FROM grants),
  'profile_triggers', (SELECT data FROM triggers),
  'admin_functions', (SELECT data FROM functions)
)) AS security_audit;
