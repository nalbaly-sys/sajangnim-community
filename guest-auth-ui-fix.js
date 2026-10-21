/* ==================================================
   비로그인 참여 UX 보정
   - 댓글/답글 등 참여 시 안내 alert 대신 로그인 모달 바로 표시
   - 게시글 상세 모달 위에 로그인/회원가입 모달을 강제로 최상단 표시
================================================== */
(function(){
  const TOP_Z='2147483647';

  function forceTop(modal){
    if(!modal)return;
    if(modal.parentElement!==document.body || document.body.lastElementChild!==modal){
      document.body.appendChild(modal);
    }
    modal.style.setProperty('position','fixed','important');
    modal.style.setProperty('inset','0','important');
    modal.style.setProperty('z-index',TOP_Z,'important');
  }

  function raiseAuthModals(){
    forceTop(document.getElementById('loginModal'));
    const signup=document.getElementById('signupModal');
    if(signup){
      signup.style.setProperty('position','fixed','important');
      signup.style.setProperty('inset','0','important');
      signup.style.setProperty('z-index',TOP_Z,'important');
    }
  }

  function openLoginAbovePost(){
    document.querySelectorAll('.comment-reply-form').forEach(el=>el.remove());
    const login=document.getElementById('loginModal');
    forceTop(login);
    if(typeof window.openLoginModal==='function')window.openLoginModal();
    forceTop(document.getElementById('loginModal'));
  }

  raiseAuthModals();

  const previousOpenLoginModal=window.openLoginModal;
  if(typeof previousOpenLoginModal==='function' && !previousOpenLoginModal.__guestTopWrapped){
    const wrapped=function(){
      const login=document.getElementById('loginModal');
      forceTop(login);
      const result=previousOpenLoginModal.apply(this,arguments);
      forceTop(document.getElementById('loginModal'));
      return result;
    };
    wrapped.__guestTopWrapped=true;
    window.openLoginModal=wrapped;
  }

  const previousSubmitComment=window.submitComment;
  if(typeof previousSubmitComment==='function' && !previousSubmitComment.__guestLoginWrapped){
    const wrappedSubmit=async function(){
      if(!currentUser){
        openLoginAbovePost();
        return;
      }
      return previousSubmitComment.apply(this,arguments);
    };
    wrappedSubmit.__guestLoginWrapped=true;
    window.submitComment=wrappedSubmit;
  }

  const previousOpenCommentReply=window.openCommentReply;
  if(typeof previousOpenCommentReply==='function' && !previousOpenCommentReply.__guestLoginWrapped){
    const wrappedReply=function(commentId){
      if(!currentUser){
        openLoginAbovePost();
        return;
      }
      return previousOpenCommentReply.call(this,commentId);
    };
    wrappedReply.__guestLoginWrapped=true;
    window.openCommentReply=wrappedReply;
  }
})();
