/* ==================================================
   ADMIN AUTHOR IDENTITY POLISH
   - 관리자에게 익명 작성자를 "익명 사장님(닉네임)"으로 표시
   - 비익명 작성자는 실제 닉네임 표시
   - 게시글/댓글/대댓글 목록 및 상세 공통 적용
   - 일반 사용자 화면에는 영향 없음
================================================== */
(function(){
  function esc(v){
    return String(v??'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function isAdmin(){
    return typeof isAdminUser==='function'&&isAdminUser();
  }

  function displayName(meta,nickname){
    const nick=String(nickname||'사장님').trim()||'사장님';
    return meta?.is_anonymous?`익명 사장님(${nick})`:nick;
  }

  async function getProfileMap(userIds){
    const ids=[...new Set((userIds||[]).filter(Boolean).map(String))];
    if(!ids.length)return new Map();
    const {data,error}=await supabaseClient
      .from('profiles')
      .select('id,nickname')
      .in('id',ids);
    if(error)throw error;
    return new Map((data||[]).map(p=>[String(p.id),p.nickname||'사장님']));
  }

  async function getPostMeta(ids){
    const clean=[...new Set((ids||[]).map(Number).filter(Boolean))];
    if(!clean.length)return {rows:new Map(),profiles:new Map()};
    const {data,error}=await supabaseClient
      .from('posts')
      .select('id,user_id,is_anonymous')
      .in('id',clean);
    if(error)throw error;
    const rows=data||[];
    const profiles=await getProfileMap(rows.map(r=>r.user_id));
    return {rows:new Map(rows.map(r=>[Number(r.id),r])),profiles};
  }

  async function getCommentMeta(ids){
    const clean=[...new Set((ids||[]).map(Number).filter(Boolean))];
    if(!clean.length)return {rows:new Map(),profiles:new Map()};
    const {data,error}=await supabaseClient
      .from('comments')
      .select('id,user_id,is_anonymous,parent_comment_id')
      .in('id',clean);
    if(error)throw error;
    const rows=data||[];
    const profiles=await getProfileMap(rows.map(r=>r.user_id));
    return {rows:new Map(rows.map(r=>[Number(r.id),r])),profiles};
  }

  function ensureStyles(){
    if(document.getElementById('adminAuthorIdentityPolishStyles'))return;
    const s=document.createElement('style');
    s.id='adminAuthorIdentityPolishStyles';
    s.textContent=`
      .admin-author-identity{font-weight:800;color:#374151}
      .admin-author-identity.is-anonymous{color:#7c3aed}
      #postDetailModal.admin-viewing-post #detailAuthor{font-weight:850;color:#374151}
      #postDetailModal.admin-viewing-post #detailAuthor.is-admin-anonymous-author{color:#7c3aed}
    `;
    document.head.appendChild(s);
  }

  async function polishAdminPostList(){
    if(!isAdmin())return;
    const cards=[...document.querySelectorAll('#adminPanelContent .admin-item')];
    const pairs=[];
    cards.forEach(card=>{
      const strong=card.querySelector('.admin-item-head strong');
      const m=String(strong?.textContent||'').match(/^#(\d+)\s*·/);
      if(m)pairs.push({card,id:Number(m[1])});
    });
    if(!pairs.length)return;

    try{
      const {rows,profiles}=await getPostMeta(pairs.map(x=>x.id));
      pairs.forEach(({card,id})=>{
        const meta=rows.get(id);if(!meta)return;
        const name=displayName(meta,profiles.get(String(meta.user_id)));
        let info=card.querySelector('[data-admin-post-author-identity]');
        if(!info){
          info=card.querySelector('small');
          if(!info){info=document.createElement('small');card.appendChild(info);}
          info.setAttribute('data-admin-post-author-identity','1');
        }
        info.classList.add('admin-author-identity');
        info.classList.toggle('is-anonymous',!!meta.is_anonymous);
        info.textContent=`작성자: ${name} · 회원 ID: ${meta.user_id||'-'}`;
      });
    }catch(e){
      console.warn('관리자 게시글 작성자 표시 보완 실패:',e);
    }
  }

  async function polishAdminCommentList(){
    if(!isAdmin())return;
    const cards=[...document.querySelectorAll('#adminPanelContent .admin-item')];
    const pairs=[];
    cards.forEach(card=>{
      const strong=card.querySelector('.admin-item-head strong');
      const m=String(strong?.textContent||'').match(/댓글\s*#(\d+)/);
      if(m)pairs.push({card,id:Number(m[1])});
    });
    if(!pairs.length)return;

    try{
      const {rows,profiles}=await getCommentMeta(pairs.map(x=>x.id));
      pairs.forEach(({card,id})=>{
        const meta=rows.get(id);if(!meta)return;
        const name=displayName(meta,profiles.get(String(meta.user_id)));
        let info=card.querySelector('[data-admin-comment-author-info]');
        if(!info){
          info=card.querySelector('small');
          if(!info){info=document.createElement('small');card.appendChild(info);}
          info.setAttribute('data-admin-comment-author-info','1');
        }
        info.classList.add('admin-author-identity');
        info.classList.toggle('is-anonymous',!!meta.is_anonymous);
        info.textContent=`작성자: ${name} · 회원 ID: ${meta.user_id||'-'}`;
      });
    }catch(e){
      console.warn('관리자 댓글 목록 작성자 표시 보완 실패:',e);
    }
  }

  async function polishAdminPostDetail(postId){
    if(!isAdmin()||!postId)return;
    try{
      const {rows,profiles}=await getPostMeta([postId]);
      const meta=rows.get(Number(postId));if(!meta)return;
      const author=document.getElementById('detailAuthor');
      const modal=document.getElementById('postDetailModal');
      if(!author)return;
      const name=displayName(meta,profiles.get(String(meta.user_id)));
      author.textContent=name;
      author.classList.toggle('is-admin-anonymous-author',!!meta.is_anonymous);
      if(modal)modal.classList.add('admin-viewing-post');
    }catch(e){
      console.warn('관리자 게시글 상세 작성자 표시 보완 실패:',e);
    }
  }

  async function polishAdminCommentDetail(){
    if(!isAdmin())return;
    const cards=[...document.querySelectorAll('#commentList [data-comment-id], #commentList .comment-item[id^="admin-reported-comment-"]')];
    const pairs=[];
    cards.forEach(card=>{
      const id=Number(card.dataset.commentId||String(card.id||'').replace('admin-reported-comment-',''));
      if(id)pairs.push({card,id});
    });
    if(!pairs.length)return;

    try{
      const {rows,profiles}=await getCommentMeta(pairs.map(x=>x.id));
      pairs.forEach(({card,id})=>{
        const meta=rows.get(id);if(!meta)return;
        const author=card.querySelector('.comment-author');if(!author)return;
        const kind=author.querySelector('.admin-comment-kind');
        const name=displayName(meta,profiles.get(String(meta.user_id)));
        author.innerHTML='';
        if(kind)author.appendChild(kind.cloneNode(true));
        const span=document.createElement('span');
        span.className='admin-comment-author-name admin-author-identity'+(meta.is_anonymous?' is-anonymous':'');
        span.textContent=(kind?' ':'')+name;
        author.appendChild(span);
      });
    }catch(e){
      console.warn('관리자 댓글/대댓글 상세 작성자 표시 보완 실패:',e);
    }
  }

  function install(){
    if(window.__adminAuthorIdentityPolishInstalled)return;
    window.__adminAuthorIdentityPolishInstalled=true;
    ensureStyles();

    const prevPosts=window.loadAdminPosts;
    if(typeof prevPosts==='function'){
      window.loadAdminPosts=async function(){
        const result=await prevPosts.apply(this,arguments);
        await polishAdminPostList();
        return result;
      };
    }

    const prevComments=window.loadAdminComments;
    if(typeof prevComments==='function'){
      window.loadAdminComments=async function(){
        const result=await prevComments.apply(this,arguments);
        await polishAdminCommentList();
        return result;
      };
    }

    const prevOpen=window.openPostDetail;
    if(typeof prevOpen==='function'){
      window.openPostDetail=async function(postId){
        const result=await prevOpen.apply(this,arguments);
        if(isAdmin()){
          await polishAdminPostDetail(postId);
          await polishAdminCommentDetail();
        }
        return result;
      };
    }

    const prevLoadComments=window.loadComments;
    if(typeof prevLoadComments==='function'){
      window.loadComments=async function(postId){
        const result=await prevLoadComments.apply(this,arguments);
        if(isAdmin())await polishAdminCommentDetail();
        return result;
      };
    }
  }

  install();
})();
