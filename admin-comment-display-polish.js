/* STEP 12.5 관리자 댓글 표시 보완: 닉네임 + 상태 배지 */
(function(){
  function ensureStyles(){
    if(document.getElementById('adminCommentDisplayPolishStyles'))return;
    const s=document.createElement('style');
    s.id='adminCommentDisplayPolishStyles';
    s.textContent=`
      .admin-comment-status-badge{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:900;line-height:1.2;margin-left:4px;vertical-align:middle}
      .admin-comment-status-badge.is-active{background:#dcfce7;color:#166534;border:1px solid #86efac}
      .admin-comment-status-badge.is-hidden{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5}
      .admin-comment-status-badge.is-deleted{background:#e5e7eb;color:#374151;border:1px solid #9ca3af}
      .admin-comment-author-name{font-weight:800}
    `;
    document.head.appendChild(s);
  }

  function statusClass(status){
    const v=String(status||'').toUpperCase();
    if(v==='ACTIVE')return 'is-active';
    if(v==='HIDDEN')return 'is-hidden';
    if(v==='DELETED')return 'is-deleted';
    return '';
  }
  function statusKo(status){
    const v=String(status||'').toUpperCase();
    if(v==='ACTIVE')return '공개';
    if(v==='HIDDEN')return '숨김';
    if(v==='DELETED')return '삭제';
    return v||'미확인';
  }

  async function fetchCommentMeta(ids){
    const clean=[...new Set((ids||[]).map(Number).filter(Boolean))];
    if(!clean.length)return {comments:new Map(),profiles:new Map()};
    const {data:comments,error}=await supabaseClient
      .from('comments')
      .select('id,user_id,is_anonymous,status')
      .in('id',clean);
    if(error)throw error;
    const rows=comments||[];
    const userIds=[...new Set(rows.filter(r=>!r.is_anonymous&&r.user_id).map(r=>r.user_id))];
    let profiles=[];
    if(userIds.length){
      const res=await supabaseClient.from('profiles').select('id,nickname').in('id',userIds);
      if(res.error)throw res.error;
      profiles=res.data||[];
    }
    return {
      comments:new Map(rows.map(r=>[Number(r.id),r])),
      profiles:new Map(profiles.map(p=>[String(p.id),p.nickname||'사장님']))
    };
  }

  function setDetailHeader(card,meta,profiles){
    const author=card.querySelector('.comment-author');
    const dateEl=card.querySelector('.comment-date');
    if(!author||!meta)return;

    const kind=author.querySelector('.admin-comment-kind');
    const name=meta.is_anonymous?'익명 사장님':(profiles.get(String(meta.user_id))||'사장님');
    author.innerHTML='';
    if(kind)author.appendChild(kind.cloneNode(true));
    const nameSpan=document.createElement('span');
    nameSpan.className='admin-comment-author-name';
    nameSpan.textContent=(kind?' ':'')+name;
    author.appendChild(nameSpan);

    if(dateEl){
      const raw=String(dateEl.textContent||'');
      const datePart=raw.split('·')[0].trim();
      dateEl.innerHTML='';
      if(datePart){
        const d=document.createElement('span');
        d.textContent=datePart+' · ';
        dateEl.appendChild(d);
      }
      const badge=document.createElement('span');
      badge.className='admin-comment-status-badge '+statusClass(meta.status);
      badge.textContent=statusKo(meta.status);
      dateEl.appendChild(badge);
    }
  }

  async function polishDetail(){
    ensureStyles();
    const cards=[...document.querySelectorAll('#commentList .admin-thread-comment[data-comment-id]')];
    if(!cards.length)return;
    try{
      const ids=cards.map(c=>Number(c.dataset.commentId));
      const {comments,profiles}=await fetchCommentMeta(ids);
      cards.forEach(card=>setDetailHeader(card,comments.get(Number(card.dataset.commentId)),profiles));
    }catch(e){console.warn('관리자 댓글 상세 표시 보완 실패:',e);}
  }

  async function polishAdminList(){
    ensureStyles();
    const cards=[...document.querySelectorAll('#adminPanelContent [data-admin-comment-list-id]')];
    if(!cards.length)return;
    try{
      const ids=cards.map(c=>Number(c.dataset.adminCommentListId));
      const {comments,profiles}=await fetchCommentMeta(ids);
      cards.forEach(card=>{
        const id=Number(card.dataset.adminCommentListId),meta=comments.get(id);
        if(!meta)return;
        let info=card.querySelector('[data-admin-comment-author-info]');
        if(!info){
          info=document.createElement('div');
          info.setAttribute('data-admin-comment-author-info','1');
          info.style.cssText='margin:7px 0;color:#4b5563;font-size:13px;font-weight:700;';
          const p=card.querySelector('p');
          if(p)p.insertAdjacentElement('beforebegin',info);else card.appendChild(info);
        }
        const name=meta.is_anonymous?'익명 사장님':(profiles.get(String(meta.user_id))||'사장님');
        info.textContent='작성자: '+name;

        const badge=card.querySelector('.admin-status');
        if(badge){
          badge.classList.remove('is-active','is-hidden','is-deleted');
          const cls=statusClass(meta.status);if(cls)badge.classList.add(cls);
          badge.textContent=statusKo(meta.status);
        }
      });
    }catch(e){console.warn('관리자 댓글 목록 표시 보완 실패:',e);}
  }

  const prevLoadAdminComments=window.loadAdminComments;
  if(typeof prevLoadAdminComments==='function'){
    window.loadAdminComments=async function(){
      const result=await prevLoadAdminComments.apply(this,arguments);
      await polishAdminList();
      return result;
    };
  }

  const prevLoadComments=window.loadComments;
  if(typeof prevLoadComments==='function'){
    window.loadComments=async function(postId){
      const result=await prevLoadComments.apply(this,arguments);
      if(typeof isAdminUser==='function'&&isAdminUser())await polishDetail();
      return result;
    };
  }

  ensureStyles();
})();
