/* STEP 12.5: 댓글 답글 + 댓글 공감 */
(function(){
  const TYPES=['공감','웃김','나도 겪음','열받음','힘내세요'];
  const ICON={'공감':'❤️','웃김':'😂','나도 겪음':'😭','열받음':'😡','힘내세요':'💪'};
  let lastRows=[];
  let lastReactions=[];

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function date(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});}

  function ensureStyles(){
    if(document.getElementById('commentThreadReactionStyles'))return;
    const s=document.createElement('style');s.id='commentThreadReactionStyles';s.textContent=`
      .comment-item.is-reply{margin-left:34px!important;border-left:3px solid #e5e7eb!important;background:#fafafa!important}
      .comment-reply-label{font-size:12px;color:#6b7280;font-weight:800;margin:0 0 7px}.comment-reply-form{margin:10px 0 2px;padding:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px}
      .comment-reply-form textarea{width:100%;min-height:78px;resize:vertical;padding:10px;border:1px solid #d1d5db;border-radius:8px;font:inherit;line-height:1.55}.comment-reply-options{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}.comment-reply-options label{font-size:12px;color:#6b7280}.comment-reply-options div{display:flex;gap:6px}.comment-reply-options button{padding:6px 9px;border:1px solid #d1d5db;border-radius:8px;background:#fff;font-size:12px;font-weight:700}.comment-reply-options .save{background:#111827;color:#fff;border-color:#111827}
      .comment-reactions-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.comment-reaction-button{display:inline-flex;align-items:center;gap:3px;border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:5px 8px;font-size:12px;cursor:pointer}.comment-reaction-button.active{background:#fff7ed;border-color:#fdba74}.comment-reaction-button:hover{background:#f9fafb}
      .comment-reply-button{display:inline-flex;align-items:center;justify-content:center;min-height:32px;padding:6px 10px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#374151;font-size:13px;font-weight:700;cursor:pointer}
      @media(max-width:600px){.comment-item.is-reply{margin-left:16px!important}.comment-reaction-button{padding:5px 7px}.comment-actions{gap:5px!important}}
    `;document.head.appendChild(s);
  }

  function reactionData(commentId){
    const rows=lastReactions.filter(r=>Number(r.comment_id)===Number(commentId));
    const counts={};TYPES.forEach(t=>counts[t]=0);rows.forEach(r=>{if(counts[r.reaction_type]!==undefined)counts[r.reaction_type]++;});
    const mine=new Set(rows.filter(r=>currentUser&&r.user_id===currentUser.id).map(r=>r.reaction_type));
    return {counts,mine};
  }

  function reactionButtons(commentId){
    const {counts,mine}=reactionData(commentId);
    return `<div class="comment-reactions-row">${TYPES.map(t=>`<button type="button" class="comment-reaction-button ${mine.has(t)?'active':''}" onclick="toggleCommentReaction(${Number(commentId)},'${t}')" title="${t}">${ICON[t]} <span>${counts[t]||0}</span></button>`).join('')}</div>`;
  }

  function card(c,isReply,parentExists){
    const mine=!!(currentUser&&c.user_id===currentUser.id);
    const author=c.is_anonymous?'익명 사장님':'사장님';
    const owner=mine?`<button type="button" class="comment-edit-button" onclick="editMyComment(${Number(c.id)})">✏️ 수정</button><button type="button" class="comment-delete-button" onclick="deleteMyComment(${Number(c.id)})">🗑️ 삭제</button>`:'';
    const report=currentUser&&!mine?`<button type="button" class="comment-report-button" onclick="reportComment(${Number(c.id)})">🚨 신고</button>`:'';
    const reply=`<button type="button" class="comment-reply-button" onclick="openCommentReply(${Number(c.id)})">↩️ 답글</button>`;
    const label=isReply?`<div class="comment-reply-label">↪ ${parentExists?'댓글에 대한 답글':'이전 댓글에 대한 답글'}</div>`:'';
    return `<div id="admin-reported-comment-${Number(c.id)}" class="comment-item${isReply?' is-reply':''}" data-comment-id="${Number(c.id)}"><div class="comment-header"><span class="comment-author">${esc(author)}</span><span class="comment-date">${esc(date(c.created_at))}</span></div>${label}<div class="comment-content">${esc(c.content||'')}</div>${reactionButtons(c.id)}<div class="comment-actions">${reply}${owner}${report}</div><div class="comment-reply-host"></div></div>`;
  }

  function renderTree(rows){
    const byId=new Map(rows.map(r=>[Number(r.id),r]));
    const children=new Map();
    rows.forEach(r=>{const p=r.parent_comment_id==null?null:Number(r.parent_comment_id);if(!children.has(p))children.set(p,[]);children.get(p).push(r);});
    const seen=new Set();
    function branch(row,isReply){
      const id=Number(row.id);if(seen.has(id))return '';seen.add(id);
      let html=card(row,isReply,row.parent_comment_id==null||byId.has(Number(row.parent_comment_id)));
      const kids=children.get(id)||[];kids.forEach(k=>{html+=branch(k,true);});return html;
    }
    let out='';
    (children.get(null)||[]).forEach(r=>out+=branch(r,false));
    rows.filter(r=>!seen.has(Number(r.id))).forEach(r=>out+=branch(r,true));
    return out;
  }

  async function enhancedLoadComments(postId){
    const list=document.getElementById('commentList');if(!list)return;
    list.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
    try{
      const {data:rows,error}=await supabaseClient.from('comments').select('id,post_id,user_id,content,is_anonymous,created_at,status,parent_comment_id,reply_to_user_id').eq('post_id',postId).eq('status','ACTIVE').order('created_at',{ascending:true});
      if(error)throw error;lastRows=rows||[];
      if(!lastRows.length){lastReactions=[];list.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';return;}
      const ids=lastRows.map(r=>r.id);
      const {data:reactions,error:re}=await supabaseClient.from('comment_reactions').select('id,comment_id,user_id,reaction_type').in('comment_id',ids);
      if(re)throw re;lastReactions=reactions||[];
      list.innerHTML=renderTree(lastRows);
    }catch(e){console.error('댓글 확장 조회 오류:',e);list.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';}
  }

  const previousLoadComments=window.loadComments;
  window.loadComments=async function(postId){
    if(typeof isAdminUser==='function'&&isAdminUser()&&typeof previousLoadComments==='function')return previousLoadComments(postId);
    return enhancedLoadComments(postId);
  };

  window.openCommentReply=function(commentId){
    if(!currentUser){if(typeof openLoginModal==='function')openLoginModal();return;}
    document.querySelectorAll('.comment-reply-form').forEach(el=>el.remove());
    const item=document.getElementById('admin-reported-comment-'+commentId);const host=item?.querySelector('.comment-reply-host');if(!host)return;
    host.innerHTML=`<div class="comment-reply-form"><textarea id="commentReplyInput-${commentId}" maxlength="1000" placeholder="답글을 입력해주세요."></textarea><div class="comment-reply-options"><label><input id="commentReplyAnonymous-${commentId}" type="checkbox"> 익명으로 작성</label><div><button type="button" onclick="cancelCommentReply(${commentId})">취소</button><button type="button" class="save" onclick="saveCommentReply(${commentId})">답글 등록</button></div></div><div id="commentReplyMessage-${commentId}" class="inline-edit-error"></div></div>`;
    const input=document.getElementById('commentReplyInput-'+commentId);if(input)input.focus();
  };

  window.cancelCommentReply=function(commentId){const item=document.getElementById('admin-reported-comment-'+commentId);const host=item?.querySelector('.comment-reply-host');if(host)host.innerHTML='';};

  window.saveCommentReply=async function(parentId){
    if(!currentUser||!currentPostId)return;
    const input=document.getElementById('commentReplyInput-'+parentId),anon=document.getElementById('commentReplyAnonymous-'+parentId),msg=document.getElementById('commentReplyMessage-'+parentId);const content=(input?.value||'').trim();
    if(content.length<2){if(msg)msg.textContent='답글은 2자 이상 입력해주세요.';return;}
    try{
      const {error}=await supabaseClient.from('comments').insert({post_id:Number(currentPostId),user_id:currentUser.id,content,is_anonymous:!!anon?.checked,status:'ACTIVE',parent_comment_id:Number(parentId)});
      if(error)throw error;await window.loadComments(currentPostId);
      if(document.body.classList.contains('mypage-active')&&typeof loadMyPage==='function')await loadMyPage();
    }catch(e){console.error('답글 작성 오류:',e);if(msg)msg.textContent='답글 작성에 실패했습니다. 다시 시도해주세요.';}
  };

  window.toggleCommentReaction=async function(commentId,type){
    if(!currentUser){if(typeof openLoginModal==='function')openLoginModal();return;}
    if(!TYPES.includes(type))return;
    const existing=lastReactions.find(r=>Number(r.comment_id)===Number(commentId)&&r.user_id===currentUser.id&&r.reaction_type===type);
    try{
      if(existing){const {error}=await supabaseClient.from('comment_reactions').delete().eq('id',existing.id).eq('user_id',currentUser.id);if(error)throw error;}
      else{const {error}=await supabaseClient.from('comment_reactions').insert({comment_id:Number(commentId),user_id:currentUser.id,reaction_type:type});if(error)throw error;}
      await window.loadComments(currentPostId);
    }catch(e){console.error('댓글 공감 처리 오류:',e);alert('댓글 공감 처리에 실패했습니다.');}
  };

  ensureStyles();
})();
