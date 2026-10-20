/* STEP 12.5 관리자 댓글 스레드 관리 확장 */
(function(){
  const PAGE_SIZE=20;
  const TYPES=['공감','웃김','나도 겪음','열받음','힘내세요'];
  const ICON={'공감':'❤️','웃김':'😂','나도 겪음':'😭','열받음':'😡','힘내세요':'💪'};
  const state={page:1,status:'ALL'};
  let detailRows=[];
  let detailReactions=[];

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function date(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});}
  function statusKo(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'공개':v==='HIDDEN'?'숨김':v==='DELETED'?'삭제':v||'미확인';}
  function statusClass(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'is-active':v==='HIDDEN'?'is-hidden':v==='DELETED'?'is-deleted':'is-neutral';}
  function isAdmin(){return typeof isAdminUser==='function'&&isAdminUser();}

  function ensureStyles(){
    if(document.getElementById('adminCommentThreadToolsStyles'))return;
    const s=document.createElement('style');s.id='adminCommentThreadToolsStyles';s.textContent=`
      .admin-comment-kind{display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:900;margin-right:6px}.admin-comment-kind.root{background:#eef2ff;color:#4338ca}.admin-comment-kind.reply{background:#ecfdf5;color:#047857}
      .admin-comment-parent{margin:8px 0;padding:8px 10px;border-left:3px solid #d1d5db;background:#f9fafb;color:#6b7280;font-size:12px;line-height:1.5}
      .admin-comment-inline-edit,.admin-comment-reply-box{margin-top:10px;padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb}.admin-comment-inline-edit textarea,.admin-comment-reply-box textarea{width:100%;min-height:90px;resize:vertical;padding:10px;border:1px solid #d1d5db;border-radius:8px;font:inherit;line-height:1.55}
      .admin-comment-inline-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px}.admin-comment-inline-actions button{padding:6px 9px;border:1px solid #d1d5db;border-radius:8px;background:#fff;font-size:12px;font-weight:800}.admin-comment-inline-actions .save{background:#111827;color:#fff;border-color:#111827}
      .admin-comment-reactions{display:flex;gap:5px;flex-wrap:wrap;margin-top:9px}.admin-comment-reaction{display:inline-flex;align-items:center;gap:3px;border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:5px 8px;font-size:12px}.admin-comment-reaction.active{background:#fff7ed;border-color:#fdba74}
      .admin-thread-comment{position:relative}.admin-thread-comment.is-reply{margin-left:32px!important;border-left:3px solid #d1d5db!important}.admin-thread-target{outline:3px solid #2563eb!important;outline-offset:2px}
      @media(max-width:600px){.admin-thread-comment.is-reply{margin-left:14px!important}}
    `;document.head.appendChild(s);
  }

  function pager(total){const pages=Math.max(1,Math.ceil(Number(total||0)/PAGE_SIZE));if(state.page>pages)state.page=pages;return `<div class="admin-pagination"><button type="button" ${state.page<=1?'disabled':''} onclick="adminCommentPage(-1)">← 이전 20건</button><span class="admin-page-info">${state.page} / ${pages} 페이지 · 전체 ${Number(total||0).toLocaleString()}건</span><button type="button" ${state.page>=pages?'disabled':''} onclick="adminCommentPage(1)">다음 20건 →</button></div>`;}
  function toolbar(total){return `<div class="admin-list-toolbar"><strong>전체 ${Number(total||0).toLocaleString()}건 · 20건씩 보기</strong><label>상태 <select onchange="adminCommentFilter(this.value)"><option value="ALL" ${state.status==='ALL'?'selected':''}>전체</option><option value="ACTIVE" ${state.status==='ACTIVE'?'selected':''}>공개</option><option value="HIDDEN" ${state.status==='HIDDEN'?'selected':''}>숨김</option><option value="DELETED" ${state.status==='DELETED'?'selected':''}>삭제</option></select></label></div>`;}

  function listCard(c){
    const st=String(c.status||'').toUpperCase(),isReply=c.parent_comment_id!=null;
    const kind=isReply?'<span class="admin-comment-kind reply">↪ 대댓글</span>':'<span class="admin-comment-kind root">💬 일반 댓글</span>';
    const parent=isReply?`<div class="admin-comment-parent">부모 댓글 #${esc(c.parent_comment_id)}에 대한 답글입니다.</div>`:'';
    const actions=`<button type="button" onclick="openAdminCommentOrigin(${Number(c.id)},${Number(c.post_id)})">원본 위치 보기</button>${st!=='DELETED'?`<button type="button" onclick="openAdminCommentEdit(${Number(c.id)},${Number(c.post_id)})">✏️ 수정</button>`:''}${st==='ACTIVE'?`<button type="button" onclick="openAdminCommentReply(${Number(c.id)},${Number(c.post_id)})">↩️ 답글</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','HIDDEN').then(()=>loadAdminComments())">🛡️ 숨김</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED').then(()=>loadAdminComments())">🗑️ 삭제 처리</button>`:st==='HIDDEN'?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE').then(()=>loadAdminComments())">다시 공개</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED').then(()=>loadAdminComments())">🗑️ 삭제 처리</button>`:`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE').then(()=>loadAdminComments())">복구</button>`}`;
    return `<article class="admin-item" data-admin-comment-list-id="${Number(c.id)}"><div class="admin-item-head"><strong>${kind} 댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</strong><span class="admin-status ${statusClass(st)}">${esc(statusKo(st))}</span></div>${parent}<p>${esc(c.content||'')}</p><small>작성자 ID: ${esc(c.user_id||'')} · ${esc(date(c.created_at))}</small><div class="admin-item-actions">${actions}</div><div id="adminCommentInlineHost-${Number(c.id)}"></div></article>`;
  }

  window.adminCommentPage=function(delta){state.page=Math.max(1,state.page+Number(delta||0));window.loadAdminComments();};
  window.adminCommentFilter=function(v){state.status=v||'ALL';state.page=1;window.loadAdminComments();};

  window.loadAdminComments=async function(){
    ensureStyles();if(!isAdmin())return;
    const box=document.getElementById('adminPanelContent');if(!box)return;
    if(typeof adminMessage==='function')adminMessage('댓글을 불러오는 중입니다.');
    try{
      const {data,error}=await supabaseClient.rpc('admin_page_comments',{p_page:state.page,p_page_size:PAGE_SIZE,p_status:state.status});
      if(error)throw error;const rows=data?.rows||[],total=Number(data?.total||0);
      box.innerHTML=toolbar(total)+(rows.length?rows.map(listCard).join(''):'<p class="admin-empty">해당 조건의 댓글이 없습니다.</p>')+pager(total);
      if(typeof adminMessage==='function')adminMessage('일반 댓글과 대댓글을 구분해 표시합니다. 원본 위치에서 수정·답글·공감도 가능합니다.');
    }catch(e){console.error('관리자 댓글 확장 목록 오류:',e);box.innerHTML='<p class="admin-empty">댓글 조회에 실패했습니다.</p>';if(typeof adminMessage==='function')adminMessage(e.message||'조회 실패');}
  };

  async function fetchDetail(postId){
    const {data,error}=await supabaseClient.rpc('admin_list_post_comments',{p_post_id:Number(postId)});if(error)throw error;detailRows=Array.isArray(data)?data:[];
    const ids=detailRows.map(r=>r.id);detailReactions=[];
    if(ids.length){const rr=await supabaseClient.from('comment_reactions').select('id,comment_id,user_id,reaction_type').in('comment_id',ids);if(rr.error)throw rr.error;detailReactions=rr.data||[];}
  }
  function reactionData(id){const rows=detailReactions.filter(r=>Number(r.comment_id)===Number(id)),counts={};TYPES.forEach(t=>counts[t]=0);rows.forEach(r=>{if(counts[r.reaction_type]!==undefined)counts[r.reaction_type]++;});const mine=new Set(rows.filter(r=>currentUser&&r.user_id===currentUser.id).map(r=>r.reaction_type));return {counts,mine};}
  function reactionsHtml(c){if(String(c.status||'').toUpperCase()!=='ACTIVE')return '';const {counts,mine}=reactionData(c.id);return `<div class="admin-comment-reactions">${TYPES.map(t=>`<button type="button" class="admin-comment-reaction ${mine.has(t)?'active':''}" onclick="adminToggleCommentReaction(${Number(c.id)},'${t}')">${ICON[t]} <span>${counts[t]||0}</span></button>`).join('')}</div>`;}

  function detailCard(c,isReply,parent){
    const st=String(c.status||'').toUpperCase();
    const kind=isReply?'<span class="admin-comment-kind reply">↪ 대댓글</span>':'<span class="admin-comment-kind root">💬 일반 댓글</span>';
    const parentText=isReply?`<div class="admin-comment-parent">${parent?`댓글 #${Number(parent.id)} 「${esc(String(parent.content||'').slice(0,70))}${String(parent.content||'').length>70?'…':''}」에 대한 답글`:`부모 댓글 #${esc(c.parent_comment_id)}에 대한 답글`}</div>`:'';
    const action=st==='ACTIVE'?`<button class="comment-edit-button" onclick="adminStartDetailEdit(${Number(c.id)})">✏️ 수정</button><button class="comment-reply-button" onclick="adminStartDetailReply(${Number(c.id)})">↩️ 답글</button><button class="comment-delete-button" onclick="adminSetDetailStatus(${Number(c.id)},'HIDDEN')">🛡️ 숨김</button><button class="comment-delete-button" onclick="adminSetDetailStatus(${Number(c.id)},'DELETED')">🗑️ 삭제 처리</button>`:st==='HIDDEN'?`<button class="comment-edit-button" onclick="adminStartDetailEdit(${Number(c.id)})">✏️ 수정</button><button class="comment-edit-button" onclick="adminSetDetailStatus(${Number(c.id)},'ACTIVE')">다시 공개</button><button class="comment-delete-button" onclick="adminSetDetailStatus(${Number(c.id)},'DELETED')">🗑️ 삭제 처리</button>`:`<button class="comment-edit-button" onclick="adminSetDetailStatus(${Number(c.id)},'ACTIVE')">복구</button>`;
    return `<div id="admin-reported-comment-${Number(c.id)}" class="comment-item admin-thread-comment${isReply?' is-reply':''}" data-comment-id="${Number(c.id)}"><div class="comment-header"><span class="comment-author">${kind} ${c.is_anonymous?'익명 사장님':'사장님'}</span><span class="comment-date">${esc(date(c.created_at))} · ${esc(statusKo(st))}</span></div>${parentText}<div class="comment-content">${esc(c.content||'')}</div>${reactionsHtml(c)}<div class="comment-actions">${action}</div><div class="comment-reply-host"></div></div>`;
  }
  function renderDetail(){
    const byId=new Map(detailRows.map(r=>[Number(r.id),r])),children=new Map(),seen=new Set();detailRows.forEach(r=>{const p=r.parent_comment_id==null?null:Number(r.parent_comment_id);if(!children.has(p))children.set(p,[]);children.get(p).push(r);});
    function branch(r,isReply){const id=Number(r.id);if(seen.has(id))return '';seen.add(id);let html=detailCard(r,isReply,r.parent_comment_id==null?null:byId.get(Number(r.parent_comment_id)));(children.get(id)||[]).forEach(k=>html+=branch(k,true));return html;}
    let out='';(children.get(null)||[]).forEach(r=>out+=branch(r,false));detailRows.filter(r=>!seen.has(Number(r.id))).forEach(r=>out+=branch(r,true));return out;
  }

  const previousLoadComments=window.loadComments;
  window.loadComments=async function(postId){
    if(!isAdmin())return typeof previousLoadComments==='function'?previousLoadComments(postId):undefined;
    ensureStyles();const list=document.getElementById('commentList');if(!list)return;list.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
    try{await fetchDetail(postId);list.innerHTML=detailRows.length?renderDetail():'<div class="post-empty">댓글이 없습니다.</div>';}
    catch(e){console.error('관리자 댓글 스레드 조회 오류:',e);list.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';}
  };

  window.openAdminCommentOrigin=async function(commentId,postId){
    if(!isAdmin())return;await openPostDetail(Number(postId));await window.loadComments(Number(postId));setTimeout(()=>{const el=document.getElementById('admin-reported-comment-'+commentId);if(!el)return;el.classList.add('admin-thread-target');el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el.classList.remove('admin-thread-target'),2200);},100);
  };
  window.openAdminCommentEdit=async function(commentId,postId){await window.openAdminCommentOrigin(commentId,postId);setTimeout(()=>window.adminStartDetailEdit(commentId),180);};
  window.openAdminCommentReply=async function(commentId,postId){await window.openAdminCommentOrigin(commentId,postId);setTimeout(()=>window.adminStartDetailReply(commentId),180);};

  window.adminStartDetailEdit=function(commentId){
    if(!isAdmin())return;const item=document.getElementById('admin-reported-comment-'+commentId),content=item?.querySelector('.comment-content'),host=item?.querySelector('.comment-reply-host');if(!content||!host)return;document.querySelectorAll('.admin-comment-inline-edit,.admin-comment-reply-box').forEach(x=>x.remove());
    host.innerHTML=`<div class="admin-comment-inline-edit"><textarea id="adminEditComment-${commentId}" maxlength="1000">${esc(content.textContent||'')}</textarea><div class="admin-comment-inline-actions"><button onclick="this.closest('.admin-comment-inline-edit').remove()">취소</button><button class="save" onclick="adminSaveDetailEdit(${commentId})">저장</button></div><div id="adminEditMessage-${commentId}" class="inline-edit-error"></div></div>`;document.getElementById('adminEditComment-'+commentId)?.focus();
  };
  window.adminSaveDetailEdit=async function(commentId){const input=document.getElementById('adminEditComment-'+commentId),msg=document.getElementById('adminEditMessage-'+commentId),content=(input?.value||'').trim();if(content.length<2){if(msg)msg.textContent='댓글은 2자 이상 입력해주세요.';return;}try{const {data,error}=await supabaseClient.from('comments').update({content}).eq('id',Number(commentId)).select('id').maybeSingle();if(error)throw error;if(!data)throw new Error('수정할 댓글을 찾을 수 없습니다.');await window.loadComments(currentPostId);if(typeof window.loadAdminComments==='function'&&document.body.classList.contains('admin-active'))window.loadAdminComments();}catch(e){console.error('관리자 댓글 수정 오류:',e);if(msg)msg.textContent='댓글 수정에 실패했습니다.';}};

  window.adminStartDetailReply=function(commentId){
    if(!isAdmin())return;const item=document.getElementById('admin-reported-comment-'+commentId),host=item?.querySelector('.comment-reply-host');if(!host)return;document.querySelectorAll('.admin-comment-inline-edit,.admin-comment-reply-box').forEach(x=>x.remove());host.innerHTML=`<div class="admin-comment-reply-box"><textarea id="adminReplyComment-${commentId}" maxlength="1000" placeholder="운영자 답글을 입력해주세요."></textarea><div class="admin-comment-inline-actions"><button onclick="this.closest('.admin-comment-reply-box').remove()">취소</button><button class="save" onclick="adminSaveDetailReply(${commentId})">답글 등록</button></div><div id="adminReplyMessage-${commentId}" class="inline-edit-error"></div></div>`;document.getElementById('adminReplyComment-'+commentId)?.focus();
  };
  window.adminSaveDetailReply=async function(parentId){const input=document.getElementById('adminReplyComment-'+parentId),msg=document.getElementById('adminReplyMessage-'+parentId),content=(input?.value||'').trim();if(content.length<2){if(msg)msg.textContent='답글은 2자 이상 입력해주세요.';return;}try{const {error}=await supabaseClient.from('comments').insert({post_id:Number(currentPostId),user_id:currentUser.id,content,is_anonymous:false,status:'ACTIVE',parent_comment_id:Number(parentId)});if(error)throw error;await window.loadComments(currentPostId);if(typeof window.loadAdminComments==='function')window.loadAdminComments();}catch(e){console.error('관리자 답글 작성 오류:',e);if(msg)msg.textContent='답글 작성에 실패했습니다.';}};

  window.adminToggleCommentReaction=async function(commentId,type){if(!isAdmin()||!TYPES.includes(type))return;const existing=detailReactions.find(r=>Number(r.comment_id)===Number(commentId)&&r.user_id===currentUser.id&&r.reaction_type===type);try{if(existing){const {error}=await supabaseClient.from('comment_reactions').delete().eq('id',existing.id).eq('user_id',currentUser.id);if(error)throw error;}else{const {error}=await supabaseClient.from('comment_reactions').insert({comment_id:Number(commentId),user_id:currentUser.id,reaction_type:type});if(error)throw error;}await window.loadComments(currentPostId);}catch(e){console.error('관리자 댓글 공감 오류:',e);alert('댓글 공감 처리에 실패했습니다.');}};
  window.adminSetDetailStatus=async function(commentId,status){if(!isAdmin())return;try{await setAdminContentStatus('comments',String(commentId),status);await window.loadComments(currentPostId);if(typeof window.loadAdminComments==='function')window.loadAdminComments();}catch(e){console.error('관리자 댓글 상태 변경 오류:',e);}};

  ensureStyles();
})();