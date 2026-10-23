/* ==================================================
   COMMENT ANONYMOUS REPLY FIX
   - 내 익명 댓글에 답글을 달 때 익명 옵션 자동 체크
   - 다른 사람 댓글에는 기존처럼 사용자가 직접 선택
================================================== */
(function(){
  function install(){
    if(window.__commentAnonymousReplyFixInstalled)return;
    if(typeof window.openCommentReply!=='function')return;

    const originalOpen=window.openCommentReply;
    window.__commentAnonymousReplyFixInstalled=true;

    window.openCommentReply=function(commentId){
      const result=originalOpen.apply(this,arguments);

      try{
        const item=document.getElementById('admin-reported-comment-'+commentId);
        const authorText=item?.querySelector('.comment-author')?.textContent?.trim()||'';
        const isMine=!!item?.querySelector('.comment-edit-button, .comment-delete-button');
        const isAnonymousParent=authorText==='익명 사장님';
        const checkbox=document.getElementById('commentReplyAnonymous-'+commentId);

        if(checkbox&&isMine&&isAnonymousParent){
          checkbox.checked=true;
          checkbox.closest('label')?.setAttribute('title','내 익명 댓글에 답글을 달아 익명으로 자동 설정되었습니다.');
        }
      }catch(error){
        console.warn('대댓글 익명 자동설정 실패:',error);
      }

      return result;
    };
  }

  install();
  setTimeout(install,100);
  setTimeout(install,500);
})();
