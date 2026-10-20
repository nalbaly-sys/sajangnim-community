/* ==================================================
   관리자 대댓글 익명 작성 보완
   - 관리자 대댓글 작성창에 '익명으로 작성하기' 추가
   - 체크 상태를 comments.is_anonymous에 저장
================================================== */
(function(){
  function isAdmin(){
    return typeof isAdminUser==='function'&&isAdminUser();
  }

  window.adminStartDetailReply=function(commentId){
    if(!isAdmin())return;

    const item=document.getElementById('admin-reported-comment-'+commentId);
    const host=item?.querySelector('.comment-reply-host');
    if(!host)return;

    document.querySelectorAll('.admin-comment-inline-edit,.admin-comment-reply-box').forEach(x=>x.remove());

    host.innerHTML=`
      <div class="admin-comment-reply-box">
        <textarea id="adminReplyComment-${commentId}" maxlength="1000" placeholder="운영자 답글을 입력해주세요."></textarea>
        <div class="comment-reply-options" style="margin-top:8px;">
          <label style="font-size:12px;color:#6b7280;display:inline-flex;align-items:center;gap:6px;">
            <input id="adminReplyAnonymous-${commentId}" type="checkbox" checked>
            익명으로 작성하기
          </label>
        </div>
        <div class="admin-comment-inline-actions">
          <button type="button" onclick="this.closest('.admin-comment-reply-box').remove()">취소</button>
          <button type="button" class="save" onclick="adminSaveDetailReply(${commentId})">답글 등록</button>
        </div>
        <div id="adminReplyMessage-${commentId}" class="inline-edit-error"></div>
      </div>`;

    document.getElementById('adminReplyComment-'+commentId)?.focus();
  };

  window.adminSaveDetailReply=async function(parentId){
    if(!isAdmin()||!currentUser||!currentPostId)return;

    const input=document.getElementById('adminReplyComment-'+parentId);
    const anonymous=document.getElementById('adminReplyAnonymous-'+parentId);
    const msg=document.getElementById('adminReplyMessage-'+parentId);
    const content=(input?.value||'').trim();

    if(content.length<2){
      if(msg)msg.textContent='답글은 2자 이상 입력해주세요.';
      return;
    }

    try{
      const {error}=await supabaseClient
        .from('comments')
        .insert({
          post_id:Number(currentPostId),
          user_id:currentUser.id,
          content,
          is_anonymous:anonymous?.checked===true,
          status:'ACTIVE',
          parent_comment_id:Number(parentId)
        });

      if(error)throw error;

      await window.loadComments(currentPostId);
      if(typeof window.loadAdminComments==='function')window.loadAdminComments();
    }catch(error){
      console.error('관리자 답글 작성 오류:',error);
      if(msg)msg.textContent='답글 작성에 실패했습니다.';
    }
  };
})();
