/* 게시글/댓글 상세 인라인 수정 */
(function(){
  let postEditing=false;

  function ensureStyles(){
    if(document.getElementById('inlineEditStyles'))return;
    const s=document.createElement('style');
    s.id='inlineEditStyles';
    s.textContent=`
      .inline-edit-title{width:100%;padding:11px 12px;border:1px solid #d1d5db;border-radius:10px;font:inherit;font-size:22px;font-weight:800;line-height:1.4;outline:none;}
      .inline-edit-title:focus,.inline-edit-textarea:focus{border-color:#111827;box-shadow:0 0 0 2px rgba(17,24,39,.06);}
      .inline-edit-textarea{width:100%;min-height:220px;resize:vertical;padding:14px;border:1px solid #d1d5db;border-radius:10px;font:inherit;font-size:15px;line-height:1.7;outline:none;background:#fff;}
      .inline-edit-error{margin-top:8px;color:#dc2626;font-size:12px;text-align:right;}
      .comment-inline-editor{width:100%;min-height:92px;resize:vertical;padding:10px 11px;border:1px solid #d1d5db;border-radius:8px;font:inherit;font-size:14px;line-height:1.6;outline:none;}
      @media(max-width:600px){.inline-edit-title{font-size:19px}.inline-edit-textarea{min-height:180px}}
    `;
    document.head.appendChild(s);
  }

  function escTextarea(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  window.editCurrentPostFromDetail=async function(){
    if(postEditing||!currentUser||!currentPostId)return;
    const titleEl=document.getElementById('detailTitle');
    const contentEl=document.getElementById('detailContent');
    const actions=document.getElementById('ownerPostActions');
    if(!titleEl||!contentEl||!actions)return;

    postEditing=true;
    const oldTitle=titleEl.textContent||'';
    const oldContent=contentEl.textContent||'';
    titleEl.style.display='none';
    contentEl.style.display='none';

    const titleInput=document.createElement('input');
    titleInput.id='inlinePostTitle';
    titleInput.className='inline-edit-title';
    titleInput.type='text';
    titleInput.maxLength=100;
    titleInput.value=oldTitle;
    titleEl.insertAdjacentElement('afterend',titleInput);

    const contentInput=document.createElement('textarea');
    contentInput.id='inlinePostContent';
    contentInput.className='inline-edit-textarea';
    contentInput.maxLength=10000;
    contentInput.value=oldContent;
    contentEl.insertAdjacentElement('afterend',contentInput);

    actions.dataset.originalHtml=actions.innerHTML;
    actions.innerHTML='<button type="button" class="comment-edit-button" onclick="saveInlinePostEdit()">💾 저장</button><button type="button" class="comment-delete-button" onclick="cancelInlinePostEdit()">취소</button>';
    titleInput.focus();
    titleInput.select();
  };

  window.cancelInlinePostEdit=function(){
    const titleEl=document.getElementById('detailTitle');
    const contentEl=document.getElementById('detailContent');
    const actions=document.getElementById('ownerPostActions');
    document.getElementById('inlinePostTitle')?.remove();
    document.getElementById('inlinePostContent')?.remove();
    document.getElementById('inlinePostEditError')?.remove();
    if(titleEl)titleEl.style.display='';
    if(contentEl)contentEl.style.display='';
    if(actions&&actions.dataset.originalHtml){actions.innerHTML=actions.dataset.originalHtml;delete actions.dataset.originalHtml;}
    postEditing=false;
  };

  window.saveInlinePostEdit=async function(){
    if(!currentUser||!currentPostId)return;
    const title=(document.getElementById('inlinePostTitle')?.value||'').trim();
    const content=(document.getElementById('inlinePostContent')?.value||'').trim();
    const actions=document.getElementById('ownerPostActions');
    if(title.length<2||title.length>100){showPostError('제목은 2~100자로 입력해주세요.');return;}
    if(content.length<5){showPostError('내용은 5자 이상 입력해주세요.');return;}
    try{
      if(actions)actions.querySelectorAll('button').forEach(b=>b.disabled=true);
      const {data,error}=await supabaseClient.from('posts').update({title,content,updated_at:new Date().toISOString()}).eq('id',currentPostId).eq('user_id',currentUser.id).eq('status','ACTIVE').select('id,title,content').maybeSingle();
      if(error)throw error;
      if(!data)throw new Error('수정 권한을 확인할 수 없습니다.');
      const titleEl=document.getElementById('detailTitle'),contentEl=document.getElementById('detailContent');
      if(titleEl)titleEl.textContent=data.title||title;
      if(contentEl)contentEl.textContent=data.content||content;
      window.cancelInlinePostEdit();
      if(typeof loadPosts==='function')await loadPosts();
      if(document.body.classList.contains('mypage-active')&&typeof loadMyPage==='function')await loadMyPage();
    }catch(e){console.error('게시글 인라인 수정 오류:',e);showPostError('게시글 수정에 실패했습니다. 다시 시도해주세요.');if(actions)actions.querySelectorAll('button').forEach(b=>b.disabled=false);}
  };

  function showPostError(message){
    let el=document.getElementById('inlinePostEditError');
    if(!el){el=document.createElement('div');el.id='inlinePostEditError';el.className='inline-edit-error';document.getElementById('ownerPostActions')?.appendChild(el);}
    el.textContent=message;
  }

  window.editMyComment=async function(commentId){
    if(!currentUser)return;
    const item=document.getElementById('admin-reported-comment-'+commentId);
    if(!item)return;
    const contentEl=item.querySelector('.comment-content');
    const actions=item.querySelector('.comment-actions');
    if(!contentEl||!actions||item.dataset.editing==='1')return;
    item.dataset.editing='1';
    const original=contentEl.textContent||'';
    contentEl.dataset.originalText=original;
    contentEl.innerHTML='<textarea class="comment-inline-editor" maxlength="1000">'+escTextarea(original)+'</textarea><div class="inline-edit-error" style="display:none"></div>';
    actions.dataset.originalHtml=actions.innerHTML;
    actions.innerHTML='<button type="button" class="comment-edit-button" onclick="saveInlineCommentEdit('+Number(commentId)+')">💾 저장</button><button type="button" class="comment-delete-button" onclick="cancelInlineCommentEdit('+Number(commentId)+')">취소</button>';
    const input=contentEl.querySelector('textarea');if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length);}
  };

  window.cancelInlineCommentEdit=function(commentId){
    const item=document.getElementById('admin-reported-comment-'+commentId);if(!item)return;
    const contentEl=item.querySelector('.comment-content'),actions=item.querySelector('.comment-actions');
    if(contentEl)contentEl.textContent=contentEl.dataset.originalText||'';
    if(actions&&actions.dataset.originalHtml){actions.innerHTML=actions.dataset.originalHtml;delete actions.dataset.originalHtml;}
    delete item.dataset.editing;
  };

  window.saveInlineCommentEdit=async function(commentId){
    const item=document.getElementById('admin-reported-comment-'+commentId);if(!item||!currentUser)return;
    const contentEl=item.querySelector('.comment-content'),actions=item.querySelector('.comment-actions'),input=contentEl?.querySelector('textarea');
    const content=(input?.value||'').trim();
    const errorEl=contentEl?.querySelector('.inline-edit-error');
    if(content.length<2||content.length>1000){if(errorEl){errorEl.style.display='block';errorEl.textContent='댓글은 2~1000자로 입력해주세요.';}return;}
    try{
      if(actions)actions.querySelectorAll('button').forEach(b=>b.disabled=true);
      const {data,error}=await supabaseClient.from('comments').update({content}).eq('id',commentId).eq('user_id',currentUser.id).eq('status','ACTIVE').select('id,content').maybeSingle();
      if(error)throw error;if(!data)throw new Error('수정 권한을 확인할 수 없습니다.');
      if(contentEl){contentEl.dataset.originalText=data.content||content;contentEl.textContent=data.content||content;}
      if(actions&&actions.dataset.originalHtml){actions.innerHTML=actions.dataset.originalHtml;delete actions.dataset.originalHtml;}
      delete item.dataset.editing;
      if(document.body.classList.contains('mypage-active')&&typeof loadMyPage==='function')await loadMyPage();
    }catch(e){console.error('댓글 인라인 수정 오류:',e);if(errorEl){errorEl.style.display='block';errorEl.textContent='댓글 수정에 실패했습니다. 다시 시도해주세요.';}if(actions)actions.querySelectorAll('button').forEach(b=>b.disabled=false);}
  };

  ensureStyles();
  const detailEditButton=document.getElementById('ownerPostEditButton');
  if(detailEditButton)detailEditButton.onclick=window.editCurrentPostFromDetail;
})();
