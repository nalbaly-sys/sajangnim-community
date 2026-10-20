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

/* 관리자/마이페이지 보완 스크립트는 app.js 로드가 끝난 뒤 순서대로 적용 */
window.addEventListener("load",function(){
  const script=document.createElement("script");
  script.src="admin-comment-fix.js?v=20261020-8";
  script.onload=function(){
    const ui=document.createElement("script");
    ui.src="admin-ui-actions.js?v=20261020-1";
    ui.onload=function(){
      const member=document.createElement("script");
      member.src="admin-member-detail-fix.js?v=20261020-2";
      member.onload=function(){
        const paging=document.createElement("script");
        paging.src="admin-pagination-search.js?v=20261020-2";
        paging.onload=function(){
          const members=document.createElement("script");
          members.src="admin-members-pagination.js?v=20261020-2";
          members.onload=function(){
            const mypage=document.createElement("script");
            mypage.src="post-mypage-pagination.js?v=20261020-3";
            mypage.onload=function(){
              const editRefresh=document.createElement("script");
              editRefresh.src="post-edit-refresh-fix.js?v=20261020-1";
              editRefresh.onload=function(){
                const memberActivity=document.createElement("script");
                memberActivity.src="admin-member-activity-pagination.js?v=20261020-1";
                memberActivity.onload=function(){
                  const inlineEdit=document.createElement("script");
                  inlineEdit.src="inline-edit.js?v=20261020-2";
                  document.body.appendChild(inlineEdit);
                };
                document.body.appendChild(memberActivity);
              };
              document.body.appendChild(editRefresh);
            };
            document.body.appendChild(mypage);
          };
          document.body.appendChild(members);
        };
        document.body.appendChild(paging);
      };
      document.body.appendChild(member);
    };
    document.body.appendChild(ui);
  };
  document.body.appendChild(script);
});
