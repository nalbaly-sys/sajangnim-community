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

/* 관리자/마이페이지/운영 보완 스크립트는 app.js 로드가 끝난 뒤 순서대로 적용 */
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
                  inlineEdit.onload=function(){
                    const operating=document.createElement("script");
                    operating.src="operating-pages.js?v=20261020-1";
                    operating.onload=function(){
                      const operatingDb=document.createElement("script");
                      operatingDb.src="operating-db-sync.js?v=20261020-1";
                      operatingDb.onload=function(){
                        const adminOperating=document.createElement("script");
                        adminOperating.src="admin-operating-content.js?v=20261020-1";
                        adminOperating.onload=function(){
                          const commentThread=document.createElement("script");
                          commentThread.src="comment-thread-reactions.js?v=20261020-1";
                          commentThread.onload=function(){
                            const adminCommentThread=document.createElement("script");
                            adminCommentThread.src="admin-comment-thread-tools.js?v=20261021-1";
                            adminCommentThread.onload=function(){
                              const adminReplyAnonymous=document.createElement("script");
                              adminReplyAnonymous.src="admin-reply-anonymous.js?v=20261021-1";
                              adminReplyAnonymous.onload=function(){
                                const adminCommentDisplay=document.createElement("script");
                                adminCommentDisplay.src="admin-comment-display-polish.js?v=20261021-1";
                                adminCommentDisplay.onload=function(){
                                  const notifications=document.createElement("script");
                                  notifications.src="notifications.js?v=20261021-1";
                                  notifications.onload=function(){
                                    const richPostEditor=document.createElement("script");
                                    richPostEditor.src="rich-post-editor.js?v=20261021-2";
                                    richPostEditor.onload=function(){
                                      const emojiPicker=document.createElement("script");
                                      emojiPicker.src="emoji-picker-enhancer.js?v=20261021-2";
                                      emojiPicker.onload=function(){
                                        const postEditStateFix=document.createElement("script");
                                        postEditStateFix.src="post-edit-state-fix.js?v=20261021-1";
                                        document.body.appendChild(postEditStateFix);
                                      };
                                      document.body.appendChild(emojiPicker);
                                    };
                                    document.body.appendChild(richPostEditor);
                                  };
                                  document.body.appendChild(notifications);
                                };
                                document.body.appendChild(adminCommentDisplay);
                              };
                              document.body.appendChild(adminReplyAnonymous);
                            };
                            document.body.appendChild(adminCommentThread);
                          };
                          document.body.appendChild(commentThread);
                        };
                        document.body.appendChild(adminOperating);
                      };
                      document.body.appendChild(operatingDb);
                    };
                    document.body.appendChild(operating);
                  };
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