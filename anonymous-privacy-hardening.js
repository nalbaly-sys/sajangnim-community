/* ==================================================
   STEP 17: 익명 작성자 UUID 비공개 읽기 경로
   - posts_public_safe / comments_public_safe 사용
   - 일반 사용자는 익명 작성자의 user_id를 받지 않음
================================================== */
(function(){
  const TYPES=['공감','웃김','나도 겪음','열받음','힘내세요'];
  const ICON={'공감':'❤️','웃김':'😂','나도 겪음':'😭','열받음':'😡','힘내세요':'💪'};
  let lastCommentRows=[];
  let lastCommentReactions=[];

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const date=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});};

  function safeRich(html,plain){
    const el=document.getElementById('detailContent');if(!el)return;
    if(html&&window.DOMPurify){el.classList.add('rich-post-content');el.innerHTML=window.DOMPurify.sanitize(String(html));}
    else{el.classList.remove('rich-post-content');el.textContent=plain||'';}
  }

  function renderPosts(rows){
    const postList=document.getElementById('postList');if(!postList)return;
    if(!rows.length){postList.innerHTML='<div class="post-empty">조건에 맞는 게시글이 없습니다.</div>';return;}
    postList.innerHTML=rows.map(post=>`<article class="post-card" onclick="openPostDetail(${Number(post.id)})"><div class="post-card-top"><span class="post-category">${esc(post.category||'')}</span><span class="post-business-type">${esc(post.business_type||'')}</span></div><h3 class="post-title">${esc(post.title||'')}</h3><p class="post-preview">${esc(post.content||'')}</p><div class="post-card-bottom"><span>${post.is_anonymous?'익명 사장님':'사장님'}</span><span>👁️ ${Number(post.view_count||0)}</span><span>${esc(typeof formatPostDate==='function'?formatPostDate(post.created_at):date(post.created_at))}</span></div></article>`).join('');
  }

  window.searchPosts=async function(){
    const postList=document.getElementById('postList');if(!postList)return;
    const keyword=document.getElementById('postSearchInput')?.value.trim()||'';
    const category=document.getElementById('postSearchCategory')?.value||'';
    const businessType=document.getElementById('postSearchBusinessType')?.value||'';
    postList.innerHTML='<div class="post-loading">게시글을 불러오는 중입니다...</div>';
    try{
      let q=supabaseClient.from('posts_public_safe').select('id,category,business_type,title,content,is_anonymous,view_count,created_at').order('created_at',{ascending:false}).limit(200);
      if(category)q=q.eq('category',category);
      if(businessType)q=q.eq('business_type',businessType);
      if(keyword){const k=keyword.replace(/[,%()]/g,' ').trim();if(k)q=q.or(`title.ilike.%${k}%,content.ilike.%${k}%`);}
      const {data,error}=await q;if(error)throw error;renderPosts(data||[]);
    }catch(e){console.error('익명 보호 게시글 조회 오류:',e);postList.innerHTML='<div class="post-empty">게시글을 불러오지 못했습니다.</div>';}
  };
  window.loadPosts=async function(){return window.searchPosts();};

  function reactionData(commentId){
    const rows=lastCommentReactions.filter(r=>Number(r.comment_id)===Number(commentId));const counts={};TYPES.forEach(t=>counts[t]=0);rows.forEach(r=>{if(counts[r.reaction_type]!==undefined)counts[r.reaction_type]++;});
    const mine=new Set(rows.filter(r=>currentUser&&r.user_id===currentUser.id).map(r=>r.reaction_type));return {counts,mine};
  }
  function reactionButtons(commentId){const {counts,mine}=reactionData(commentId);return `<div class="comment-reactions-row">${TYPES.map(t=>`<button type="button" class="comment-reaction-button ${mine.has(t)?'active':''}" onclick="toggleCommentReaction(${Number(commentId)},'${t}')" title="${t}">${ICON[t]} <span>${counts[t]||0}</span></button>`).join('')}</div>`;}
  function commentCard(c,isReply,parentExists){
    const mine=!!c.is_mine,author=c.is_anonymous?'익명 사장님':'사장님';
    const owner=mine?`<button type="button" class="comment-edit-button" onclick="editMyComment(${Number(c.id)})">✏️ 수정</button><button type="button" class="comment-delete-button" onclick="deleteMyComment(${Number(c.id)})">🗑️ 삭제</button>`:'';
    const report=currentUser&&!mine?`<button type="button" class="comment-report-button" onclick="reportComment(${Number(c.id)})">🚨 신고</button>`:'';
    const reply=`<button type="button" class="comment-reply-button" onclick="openCommentReply(${Number(c.id)})">↩️ 답글</button>`;
    const label=isReply?`<div class="comment-reply-label">↪ ${parentExists?'댓글에 대한 답글':'이전 댓글에 대한 답글'}</div>`:'';
    return `<div id="admin-reported-comment-${Number(c.id)}" class="comment-item${isReply?' is-reply':''}" data-comment-id="${Number(c.id)}"><div class="comment-header"><span class="comment-author">${esc(author)}</span><span class="comment-date">${esc(date(c.created_at))}</span></div>${label}<div class="comment-content">${esc(c.content||'')}</div>${reactionButtons(c.id)}<div class="comment-actions">${reply}${owner}${report}</div><div class="comment-reply-host"></div></div>`;
  }
  function renderCommentTree(rows){
    const byId=new Map(rows.map(r=>[Number(r.id),r])),children=new Map(),seen=new Set();rows.forEach(r=>{const p=r.parent_comment_id==null?null:Number(r.parent_comment_id);if(!children.has(p))children.set(p,[]);children.get(p).push(r);});
    function branch(row,isReply){const id=Number(row.id);if(seen.has(id))return '';seen.add(id);let html=commentCard(row,isReply,row.parent_comment_id==null||byId.has(Number(row.parent_comment_id)));(children.get(id)||[]).forEach(k=>html+=branch(k,true));return html;}
    let out='';(children.get(null)||[]).forEach(r=>out+=branch(r,false));rows.filter(r=>!seen.has(Number(r.id))).forEach(r=>out+=branch(r,true));return out;
  }

  const previousLoadComments=window.loadComments;
  window.loadComments=async function(postId){
    if(typeof isAdminUser==='function'&&isAdminUser()&&typeof previousLoadComments==='function')return previousLoadComments(postId);
    const list=document.getElementById('commentList');if(!list)return;list.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
    try{
      const {data:rows,error}=await supabaseClient.from('comments_public_safe').select('id,post_id,content,is_anonymous,created_at,status,parent_comment_id,is_mine').eq('post_id',Number(postId)).order('created_at',{ascending:true});if(error)throw error;
      lastCommentRows=rows||[];if(!lastCommentRows.length){lastCommentReactions=[];list.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';return;}
      const ids=lastCommentRows.map(r=>r.id);const {data:reactions,error:re}=await supabaseClient.from('comment_reactions').select('id,comment_id,user_id,reaction_type').in('comment_id',ids);if(re)throw re;lastCommentReactions=reactions||[];list.innerHTML=renderCommentTree(lastCommentRows);
    }catch(e){console.error('익명 보호 댓글 조회 오류:',e);list.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';}
  };

  const previousOpenPostDetail=window.openPostDetail;
  window.openPostDetail=async function(postId){
    if(!postId)return;
    try{
      const {data:post,error}=await supabaseClient.from('posts_public_safe').select('id,category,business_type,title,content,content_html,is_anonymous,view_count,created_at,is_mine').eq('id',Number(postId)).maybeSingle();
      if(error)throw error;if(!post){if(typeof previousOpenPostDetail==='function')return previousOpenPostDetail(postId);return;}
      if(!post.is_anonymous||post.is_mine||(typeof isAdminUser==='function'&&isAdminUser())){if(typeof previousOpenPostDetail==='function')return previousOpenPostDetail(postId);}
      const modal=document.getElementById('postDetailModal');if(!modal)return;currentPostId=Number(post.id);
      const actions=document.getElementById('ownerPostActions');if(actions)actions.style.display='none';
      const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
      set('detailCategory',post.category||'');set('detailBusinessType',post.business_type||'');set('detailTitle',post.title||'');set('detailAuthor','익명 사장님');set('detailViewCount',String(Number(post.view_count||0)));safeRich(post.content_html,post.content);
      modal.style.display='flex';document.body.style.overflow='hidden';
      if(typeof loadPostReactions==='function')await loadPostReactions(currentPostId);await window.loadComments(currentPostId);
      const {data:newCount,error:ve}=await supabaseClient.rpc('increment_active_post_view',{p_post_id:currentPostId});if(!ve&&newCount!=null)set('detailViewCount',String(newCount));
      document.title=(post.title||'게시글')+' | 사장님도 퇴근합니다';
    }catch(e){console.error('익명 보호 게시글 상세 오류:',e);if(typeof previousOpenPostDetail==='function')return previousOpenPostDetail(postId);}
  };

  const previousReportComment=window.reportComment;
  window.reportComment=async function(commentId){
    if(!currentUser){alert('댓글을 신고하려면 로그인해주세요.');return;}if(!currentPostId)return;
    try{
      const {data:comment,error}=await supabaseClient.from('comments_public_safe').select('id,is_mine').eq('id',Number(commentId)).eq('post_id',Number(currentPostId)).maybeSingle();if(error)throw error;if(!comment){alert('신고할 댓글을 찾을 수 없습니다.');return;}if(comment.is_mine){alert('본인이 작성한 댓글은 신고할 수 없습니다.');return;}
      if(typeof previousReportComment==='function')return previousReportComment(commentId);
    }catch(e){console.error('익명 보호 신고 대상 확인 오류:',e);alert('댓글 확인에 실패했습니다. 잠시 후 다시 시도해주세요.');}
  };
})();
