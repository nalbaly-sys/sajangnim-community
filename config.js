/* ==================================================
   SUPABASE 설정
   ⚠️ 아래 값은 주인님의 Supabase 프로젝트 값으로 교체
================================================== */

const SUPABASE_CONFIG = {
  url:"https://djadqsfdrrihkswplzcn.supabase.co",
  anonKey:"sb_publishable_V1jgdKFkLK735lCgiOYAuw_48iMYs3V"
};


/* ==================================================
   SUPABASE 클라이언트
================================================== */

const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

/* 관리자 신고 댓글 보완 스크립트는 app.js 로드가 끝난 뒤 적용 */
window.addEventListener("load",function(){
  const script=document.createElement("script");
  /* 파일 수정 시 버전을 올려 브라우저가 이전 보완 스크립트를 재사용하지 않도록 합니다. */
  script.src="admin-comment-fix.js?v=20261020-8";
  document.body.appendChild(script);
});
