/* 게시글 상세 본인 수정 + 마이페이지 게시글/댓글 5개 페이지네이션 */
(function(){
  const PAGE_SIZE=5;
  const state={posts:1,comments:1};

  function ensureStyles(){
    if(document.getElementById('mypagePaginationStyles'))return;
    const s=document.createElement('style');
    s.id='mypagePaginationStyles';
    s.textContent=`
      .mypage-pagination{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;margin:14px 0 2px;}
      .mypage-pagination button{padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:8px;font-weight:800;cursor:pointer;}
      .mypage-pagination button:disabled{opacity:.4;cursor:not-allowed;}
      .mypage-page-info{font-size:13px;color:#6b7280;font-weight:700;}
      #ownerPostActions{display:flex;justify-content:flex-end;align-items:center;gap:6px;flex-wrap:wrap;}
    `;
    document.head.appendChild(s);
  }

  function normalizeOwnerPostButtons(){
    const actions=document.getElementById('ownerPostActions');
    if(!actions)return;
    let edit=document.getElementById('ownerPostEditButton');
    if(!edit){edit=document.createElement('button');edit.id='ownerPostEditButton';edit.type='button';edit.onclick=window.editCurrentPostFromDetail;actions.insertBefore(edit,actions.firstChild);}
    edit.className='comment-edit-button';edit.textContent='✏️ 수정';
    const del=actions.querySelector('[onclick="deleteMyPost()"]')||actions.querySelector('.post-delete-button');
    if(del){del.className='comment-delete-button';del.textContent='🗑️ 삭제';}
  }

  window.editCurrentPostFromDetail=async function(){if(!currentUser||!currentPostId)return;const id=currentPostId;await editMyPostFromPage(id);};

  function pager(type,total){const pages=Math.max(1,Math.ceil(Number(total||0)/PAGE_SIZE));if(state[type]>pages)state[type]=pages;return `<div class="mypage-pagination"><button type="button" ${state[type]<=1?'disabled':''} onclick="myPageChangePage('${type}',-1)">← 이전</button><span class="mypage-page-info">${state[type]} / ${pages} 페이지 · 전체 ${Number(total||0).toLocaleString()}개</span><button type="button" ${state[type]>=pages?'disabled':''} onclick="myPageChangePage('${type}',1)">다음 →</button></div>`;}

  async function fetchPosts(){let page=state.posts,from=(page-1)*PAGE_SIZE,to=from+PAGE_SIZE-1;let result=await supabaseClient.from('posts').select('id,category,business_type,title,content,view_count,created_at',{count:'exact'}).eq('user_id',currentUser.id).eq('status','ACTIVE').order('created_at',{ascending:false}).range(from,to);if(result.error)throw result.error;const total=Number(result.count||0),pages=Math.max(1,Math.ceil(total/PAGE_SIZE));if(page>pages){state.posts=pages;from=(pages-1)*PAGE_SIZE;to=from+PAGE_SIZE-1;result=await supabaseClient.from('posts').select('id,category,business_type,title,content,view_count,created_at',{count:'exact'}).eq('user_id',currentUser.id).eq('status','ACTIVE').order('created_at',{ascending:false}).range(from,to);if(result.error)throw result.error;}return {rows:result.data||[],total:Number(result.count||0)};}
  async function fetchComments(){let page=state.comments,from=(page-1)*PAGE_SIZE,to=from+PAGE_SIZE-1;let result=await supabaseClient.from('comments').select('id,post_id,content,is_anonymous,created_at',{count:'exact'}).eq('user_id',currentUser.id).eq('status','ACTIVE').order('created_at',{ascending:false}).range(from,to);if(result.error)throw result.error;const total=Number(result.count||0),pages=Math.max(1,Math.ceil(total/PAGE_SIZE));if(page>pages){state.comments=pages;from=(pages-1)*PAGE_SIZE;to=from+PAGE_SIZE-1;result=await supabaseClient.from('comments').select('id,post_id,content,is_anonymous,created_at',{count:'exact'}).eq('user_id',currentUser.id).eq('status','ACTIVE').order('created_at',{ascending:false}).range(from,to);if(result.error)throw result.error;}return {rows:result.data||[],total:Number(result.count||0)};}

  window.myPageChangePage=function(type,delta){if(!Object.prototype.hasOwnProperty.call(state,type))return;state[type]=Math.max(1,state[type]+Number(delta||0));window.loadMyPage();};

  window.loadMyPage=async function(){
    if(!currentUser)return;ensureStyles();
    const postsBox=document.getElementById('mypagePosts'),commentsBox=document.getElementById('mypageComments');
    if(postsBox)postsBox.innerHTML='<p class="mypage-empty">게시글을 불러오는 중...</p>';if(commentsBox)commentsBox.innerHTML='<p class="mypage-empty">댓글을 불러오는 중...</p>';
    try{
      const [pr,cr]=await Promise.all([fetchPosts(),fetchComments()]),posts=pr.rows,comments=cr.rows;
      if(document.getElementById('mypagePostCount'))document.getElementById('mypagePostCount').textContent=String(pr.total);if(document.getElementById('mypageCommentCount'))document.getElementById('mypageCommentCount').textContent=String(cr.total);
      if(postsBox){const items=posts.length?posts.map(p=>'<article class="mypage-item"><div class="mypage-item-meta"><span>'+escapePostText(p.category||'')+'</span><span>'+formatPostDate(p.created_at)+'</span></div><h4>'+escapePostText(p.title||'')+'</h4><p>'+escapePostText((p.content||'').slice(0,180))+((p.content||'').length>180?'…':'')+'</p><div class="mypage-item-actions"><button type="button" onclick="editPostFromMyPageInline('+p.id+')">✏️ 수정</button><button type="button" class="mypage-item-delete" onclick="deleteMyPostFromPage('+p.id+')">🗑️ 삭제</button><button type="button" onclick="openPostDetail('+p.id+')">게시글 보기</button></div></article>').join(''):'<p class="mypage-empty">작성한 게시글이 없습니다.</p>';postsBox.innerHTML=items+pager('posts',pr.total);}
      const ids=[...new Set(comments.map(c=>c.post_id))],titleMap={};if(ids.length){const tr=await supabaseClient.from('posts').select('id,title').in('id',ids);if(!tr.error)(tr.data||[]).forEach(p=>titleMap[p.id]=p.title||'게시글');}
      if(commentsBox){const items=comments.length?comments.map(c=>'<article class="mypage-item"><div class="mypage-item-meta"><span>댓글</span><span>'+formatPostDate(c.created_at)+'</span></div><p>'+escapePostText(c.content||'')+'</p><small>게시글: '+escapePostText(titleMap[c.post_id]||'원본 게시글')+'</small><div class="mypage-item-actions"><button type="button" onclick="editCommentFromMyPageInline('+c.id+','+c.post_id+')">✏️ 수정</button><button type="button" class="mypage-item-delete" onclick="deleteMyCommentFromPage('+c.id+')">🗑️ 삭제</button><button type="button" onclick="openPostDetail('+c.post_id+')">게시글 보기</button></div></article>').join(''):'<p class="mypage-empty">작성한 댓글이 없습니다.</p>';commentsBox.innerHTML=items+pager('comments',cr.total);}
    }catch(error){console.error('마이페이지 페이지네이션 조회 오류:',error);if(postsBox)postsBox.innerHTML='<p class="mypage-empty">내 게시글을 불러오지 못했습니다.</p>';if(commentsBox)commentsBox.innerHTML='<p class="mypage-empty">내 댓글을 불러오지 못했습니다.</p>';}
  };

  const previousOpenMyPage=window.openMyPage;if(typeof previousOpenMyPage==='function'){window.openMyPage=function(){state.posts=1;state.comments=1;return previousOpenMyPage.apply(this,arguments);};}
  const previousOpenPostDetail=window.openPostDetail;if(typeof previousOpenPostDetail==='function'){window.openPostDetail=async function(){const result=await previousOpenPostDetail.apply(this,arguments);normalizeOwnerPostButtons();return result;};}
  ensureStyles();normalizeOwnerPostButtons();
})();
