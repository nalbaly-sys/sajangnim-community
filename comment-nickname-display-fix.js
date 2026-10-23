/* ==================================================
   COMMENT NICKNAME DISPLAY FIX
   - 일반회원 댓글/대댓글에서 공개 작성자는 실제 닉네임 표시
   - 익명 작성자는 계속 '익명 사장님'으로 표시
   - 작성자 user_id는 공개 화면에 노출하지 않음
================================================== */
(function(){
  let installed=false;

  async function decorateCommentAuthors(postId){
    if(!postId || typeof supabaseClient==='undefined')return;
    if(typeof isAdminUser==='function' && isAdminUser())return;

    try{
      const {data,error}=await supabaseClient
        .from('comments_public_safe')
        .select('id,is_anonymous,author_nickname')
        .eq('post_id',Number(postId))
        .eq('status','ACTIVE');

      if(error)throw error;

      (data||[]).forEach(row=>{
        const item=document.querySelector(`.comment-item[data-comment-id="${Number(row.id)}"]`);
        const authorEl=item?.querySelector('.comment-author');
        if(!authorEl)return;

        authorEl.textContent=row.is_anonymous
          ? '익명 사장님'
          : (String(row.author_nickname||'').trim() || '사장님');
      });
    }catch(error){
      console.warn('댓글 작성자 닉네임 표시 보정 실패:',error);
    }
  }

  function install(){
    if(installed)return;
    if(typeof window.loadComments!=='function')return;

    const original=window.loadComments;
    installed=true;

    window.loadComments=async function(postId){
      const result=await original.apply(this,arguments);
      await decorateCommentAuthors(postId);
      return result;
    };

    if(window.currentPostId)decorateCommentAuthors(window.currentPostId);
  }

  install();
  setTimeout(install,100);
  setTimeout(install,500);
  setTimeout(()=>{ if(window.currentPostId)decorateCommentAuthors(window.currentPostId); },800);
})();
