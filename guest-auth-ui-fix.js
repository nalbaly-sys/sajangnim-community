/* ==================================================
   비로그인 참여 UX 보정
   - 댓글/답글 등 참여 시 안내 alert 대신 로그인 모달 바로 표시
   - 게시글 상세 모달 위에 로그인/회원가입 모달이 보이도록 z-index 보정
================================================== */
(function(){
  const LOGIN_Z='2200';

  function raiseAuthModals(){
    const login=document.getElementById('loginModal');
    const signup=document.getElementById('signupModal');
    if(login)login.style.zIndex=LOGIN_Z;
    if(signup)signup.style.zIndex=LOGIN_Z;
  }

  function openLoginAbovePost(){
    raiseAuthModals();
    document.querySelectorAll('.comment-reply-form').forEach(el=>el.remove());
    if(typeof window.openLoginModal==='function')window.openLoginModal();
    raiseAuthModals();
  }

  raiseAuthModals();

  const previousOpenLoginModal=window.openLoginModal;
  if(typeof previousOpenLoginModal==='function'){
    window.openLoginModal=function(){
      raiseAuthModals();
      const result=previousOpenLoginModal.apply(this,arguments);
      raiseAuthModals();
      return result;
    };
  }

  const previousSubmitComment=window.submitComment;
  if(typeof previousSubmitComment==='function'){
    window.submitComment=async function(){
      if(!currentUser){
        openLoginAbovePost();
        return;
      }
      return previousSubmitComment.apply(this,arguments);
    };
  }

  const previousOpenCommentReply=window.openCommentReply;
  if(typeof previousOpenCommentReply==='function'){
    window.openCommentReply=function(commentId){
      if(!currentUser){
        openLoginAbovePost();
        return;
      }
      return previousOpenCommentReply.call(this,commentId);
    };
  }
})();
