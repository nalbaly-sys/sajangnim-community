/* ==================================================
   COMMENT REPLY ANONYMITY V2
   - 대댓글 익명 체크값을 저장 시 직접 반영
   - 내 익명 댓글에 답글 작성 시 익명 자동 체크
================================================== */
(function(){
  function install(){
    if(window.__commentReplyAnonymityV2Installed)return true;
    if(typeof window.openCommentReply!=='function' || typeof window.saveCommentReply!=='function')return false;

    const originalOpen=window.openCommentReply;
    window.__commentReplyAnonymityV2Installed=true;

    window.openCommentReply=function(commentId){
      const result=originalOpen.apply(this,arguments);
      try{
        const item=document.getElementById('admin-reported-comment-'+commentId);
        const checkbox=document.getElementById('commentReplyAnonymous-'+commentId);
        if(!checkbox)return result;

        const isMine=!!item?.querySelector('.comment-edit-button, .comment-delete-button');
        const authorText=(item?.querySelector('.comment-author')?.textContent||'').trim();
        if(isMine && authorText==='익명 사장님'){
          checkbox.checked=true;
          checkbox.closest('label')?.setAttribute('title','내 익명 댓글에 대한 답글이라 익명으로 자동 설정되었습니다.');
        }
      }catch(e){console.warn('대댓글 익명 기본값 적용 실패:',e);}
      return result;
    };

    window.saveCommentReply=async function(parentId){
      if(!window.currentUser && typeof currentUser==='undefined')return;
      const user=(typeof currentUser!=='undefined'?currentUser:window.currentUser);
      const postId=(typeof currentPostId!=='undefined'?currentPostId:window.currentPostId);
      if(!user||!postId)return;

      const input=document.getElementById('commentReplyInput-'+parentId);
      const anon=document.getElementById('commentReplyAnonymous-'+parentId);
      const msg=document.getElementById('commentReplyMessage-'+parentId);
      const content=(input?.value||'').trim();
      if(content.length<2){if(msg)msg.textContent='답글은 2자 이상 입력해주세요.';return;}

      const isAnonymous=anon?.checked===true;
      try{
        const {error}=await supabaseClient.from('comments').insert({
          post_id:Number(postId),
          user_id:user.id,
          content,
          is_anonymous:isAnonymous,
          status:'ACTIVE',
          parent_comment_id:Number(parentId)
        });
        if(error)throw error;
        if(typeof window.loadComments==='function')await window.loadComments(postId);
        if(document.body.classList.contains('mypage-active')&&typeof window.loadMyPage==='function')await window.loadMyPage();
      }catch(e){
        console.error('답글 작성 오류:',e);
        if(msg)msg.textContent='답글 작성에 실패했습니다. 다시 시도해주세요.';
      }
    };

    return true;
  }

  if(!install()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(install()||tries>=30)clearInterval(timer);
    },100);
  }
})();
