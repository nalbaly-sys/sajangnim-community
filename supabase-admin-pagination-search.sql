-- 관리자 목록 페이지네이션 + 전체 데이터 통합검색
-- Supabase SQL Editor에서 전체 실행

CREATE OR REPLACE FUNCTION public.admin_page_reports(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page,1),1);
  v_size integer := LEAST(GREATEST(COALESCE(p_page_size,100),1),100);
  v_offset integer;
  v_total bigint;
  v_rows jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.role IN ('ADMIN','MODERATOR')
      AND p.status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION '관리자 권한이 없습니다.' USING ERRCODE='42501';
  END IF;

  v_offset := (v_page - 1) * v_size;

  SELECT count(*) INTO v_total
  FROM public.reports r
  WHERE p_status IS NULL OR upper(p_status)='ALL' OR r.status = upper(p_status);

  SELECT COALESCE(jsonb_agg(x.obj ORDER BY x.created_at DESC), '[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT r.created_at,
      jsonb_build_object(
        'id',r.id,'target_type',r.target_type,'target_id',r.target_id,
        'reporter_id',r.reporter_id,'reason',r.reason,'detail',r.detail,
        'status',r.status,'created_at',r.created_at,
        'target_title',CASE WHEN r.target_type='POST' THEN p.title ELSE NULL END,
        'target_content',CASE WHEN r.target_type='POST' THEN p.content ELSE c.content END,
        'target_status',CASE WHEN r.target_type='POST' THEN p.status ELSE c.status END,
        'parent_post_id',CASE WHEN r.target_type='COMMENT' THEN c.post_id ELSE NULL END,
        'parent_post_title',CASE WHEN r.target_type='COMMENT' THEN pp.title ELSE NULL END
      ) AS obj
    FROM public.reports r
    LEFT JOIN public.posts p ON r.target_type='POST' AND p.id=r.target_id
    LEFT JOIN public.comments c ON r.target_type='COMMENT' AND c.id=r.target_id
    LEFT JOIN public.posts pp ON r.target_type='COMMENT' AND pp.id=c.post_id
    WHERE p_status IS NULL OR upper(p_status)='ALL' OR r.status=upper(p_status)
    ORDER BY r.created_at DESC
    OFFSET v_offset LIMIT v_size
  ) x;

  RETURN jsonb_build_object('page',v_page,'page_size',v_size,'total',v_total,'rows',v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_page_posts(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page,1),1);
  v_size integer := LEAST(GREATEST(COALESCE(p_page_size,100),1),100);
  v_offset integer;
  v_total bigint;
  v_rows jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id=(SELECT auth.uid())
      AND p.role IN ('ADMIN','MODERATOR')
      AND p.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION '관리자 권한이 없습니다.' USING ERRCODE='42501';
  END IF;

  v_offset := (v_page-1)*v_size;
  SELECT count(*) INTO v_total FROM public.posts p
  WHERE p_status IS NULL OR upper(p_status)='ALL' OR p.status=upper(p_status);

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT p.id,p.user_id,p.title,p.category,p.business_type,p.status,p.created_at
    FROM public.posts p
    WHERE p_status IS NULL OR upper(p_status)='ALL' OR p.status=upper(p_status)
    ORDER BY p.created_at DESC
    OFFSET v_offset LIMIT v_size
  ) x;

  RETURN jsonb_build_object('page',v_page,'page_size',v_size,'total',v_total,'rows',v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_page_comments(
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 100,
  p_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_page integer := GREATEST(COALESCE(p_page,1),1);
  v_size integer := LEAST(GREATEST(COALESCE(p_page_size,100),1),100);
  v_offset integer;
  v_total bigint;
  v_rows jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id=(SELECT auth.uid())
      AND p.role IN ('ADMIN','MODERATOR')
      AND p.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION '관리자 권한이 없습니다.' USING ERRCODE='42501';
  END IF;

  v_offset := (v_page-1)*v_size;
  SELECT count(*) INTO v_total FROM public.comments c
  WHERE p_status IS NULL OR upper(p_status)='ALL' OR c.status=upper(p_status);

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb)
  INTO v_rows
  FROM (
    SELECT c.id,c.post_id,c.user_id,c.content,c.status,c.created_at,c.is_anonymous
    FROM public.comments c
    WHERE p_status IS NULL OR upper(p_status)='ALL' OR c.status=upper(p_status)
    ORDER BY c.created_at DESC
    OFFSET v_offset LIMIT v_size
  ) x;

  RETURN jsonb_build_object('page',v_page,'page_size',v_size,'total',v_total,'rows',v_rows);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unified_search(
  p_query text,
  p_limit_each integer DEFAULT 100
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  q text := trim(COALESCE(p_query,''));
  lim integer := LEAST(GREATEST(COALESCE(p_limit_each,100),1),100);
  v_reports jsonb;
  v_posts jsonb;
  v_comments jsonb;
  v_profiles jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id=(SELECT auth.uid())
      AND p.role IN ('ADMIN','MODERATOR')
      AND p.status='ACTIVE'
  ) THEN
    RAISE EXCEPTION '관리자 권한이 없습니다.' USING ERRCODE='42501';
  END IF;

  IF q='' THEN
    RETURN jsonb_build_object('reports','[]'::jsonb,'posts','[]'::jsonb,'comments','[]'::jsonb,'profiles','[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(x.obj ORDER BY x.created_at DESC),'[]'::jsonb) INTO v_reports
  FROM (
    SELECT r.created_at,
      jsonb_build_object(
        'id',r.id,'target_type',r.target_type,'target_id',r.target_id,
        'reason',r.reason,'detail',r.detail,'status',r.status,'created_at',r.created_at,
        'target_title',CASE WHEN r.target_type='POST' THEN p.title ELSE NULL END,
        'target_content',CASE WHEN r.target_type='POST' THEN p.content ELSE c.content END,
        'target_status',CASE WHEN r.target_type='POST' THEN p.status ELSE c.status END,
        'parent_post_id',CASE WHEN r.target_type='COMMENT' THEN c.post_id ELSE NULL END
      ) obj
    FROM public.reports r
    LEFT JOIN public.posts p ON r.target_type='POST' AND p.id=r.target_id
    LEFT JOIN public.comments c ON r.target_type='COMMENT' AND c.id=r.target_id
    WHERE COALESCE(r.reason,'') ILIKE '%'||q||'%'
       OR COALESCE(r.detail,'') ILIKE '%'||q||'%'
       OR COALESCE(p.title,'') ILIKE '%'||q||'%'
       OR COALESCE(p.content,'') ILIKE '%'||q||'%'
       OR COALESCE(c.content,'') ILIKE '%'||q||'%'
       OR r.target_id::text ILIKE '%'||q||'%'
    ORDER BY r.created_at DESC LIMIT lim
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) INTO v_posts
  FROM (
    SELECT p.id,p.user_id,p.title,p.content,p.category,p.business_type,p.status,p.created_at
    FROM public.posts p
    WHERE COALESCE(p.title,'') ILIKE '%'||q||'%'
       OR COALESCE(p.content,'') ILIKE '%'||q||'%'
       OR COALESCE(p.category,'') ILIKE '%'||q||'%'
       OR COALESCE(p.business_type,'') ILIKE '%'||q||'%'
       OR p.id::text ILIKE '%'||q||'%'
    ORDER BY p.created_at DESC LIMIT lim
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC),'[]'::jsonb) INTO v_comments
  FROM (
    SELECT c.id,c.post_id,c.user_id,c.content,c.status,c.created_at,c.is_anonymous
    FROM public.comments c
    WHERE COALESCE(c.content,'') ILIKE '%'||q||'%'
       OR c.id::text ILIKE '%'||q||'%'
       OR c.post_id::text ILIKE '%'||q||'%'
    ORDER BY c.created_at DESC LIMIT lim
  ) x;

  SELECT COALESCE(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO v_profiles
  FROM (
    SELECT p.id,p.nickname,p.business_type,p.introduction,p.role,p.status
    FROM public.profiles p
    WHERE COALESCE(p.nickname,'') ILIKE '%'||q||'%'
       OR COALESCE(p.business_type,'') ILIKE '%'||q||'%'
       OR COALESCE(p.introduction,'') ILIKE '%'||q||'%'
       OR p.id::text ILIKE '%'||q||'%'
    ORDER BY p.nickname NULLS LAST LIMIT lim
  ) x;

  RETURN jsonb_build_object('reports',v_reports,'posts',v_posts,'comments',v_comments,'profiles',v_profiles);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_page_reports(integer,integer,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_page_posts(integer,integer,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_page_comments(integer,integer,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_unified_search(text,integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_page_reports(integer,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_page_posts(integer,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_page_comments(integer,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unified_search(text,integer) TO authenticated;
