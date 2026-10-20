/* 관리자 회원 상세 최근 게시글/댓글 5개 독립 페이지네이션 */
(function(){
  const PAGE_SIZE=5;
  const state={userId:null,posts:1,comments:1};

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function date(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});}
  function statusKo(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'공개':v==='HIDDEN'?'숨김':v==='DELETED'?'삭제':v||'미확인';}

  function ensureStyles(){
    if(document.getElementById('adminMemberActivityPagingStyles'))return;
    const s=document.createElement('style');
    s.id='adminMemberActivityPagingStyles';
    s.textContent=`
      .admin-member-activity-pager{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap;margin:12px 0 18px;}
      .admin-member-activity-pager button{padding:7px 11px;border:1px solid #d1d5db;background:#fff;border-radius:8px;font-weight:800;cursor:pointer;}
      .admin-member-activity-pager button:disabled{opacity:.4;cursor:not-allowed;}
      .admin-member-activity-pageinfo{font-size:13px;color:#6b7280;font-weight:700;}
    `;
    document.head.appendChild(s);
  }

  function pager(type,total){
    const pages=Math.max(1,Math.ceil(Number(total||0)/PAGE_SIZE));
    if(state[type]>pages)state[type]=pages;
    return `<div class="admin-member-activity-pager"><button type="button" ${state[type]<=1?'disabled':''} onclick="adminMemberActivityPage('${type}',-1)">← 이전</button><span class="admin-member-activity-pageinfo">${state[type]} / ${pages} 페이지 · 전체 ${Number(total||0).toLocaleString()}개</span><button type="button" ${state[type]>=pages?'disabled':''} onclick="adminMemberActivityPage('${type}',1)">다음 →</button></div>`;
  }

  function getBoxes(){
    const detail=document.getElementById('adminMemberDetail');
    if(!detail)return {posts:null,comments:null};
    const boxes=detail.querySelectorAll('.admin-member-posts');
    return {posts:boxes[0]||null,comments:boxes[1]||null};
  }

  async function loadType(type){
    if(!state.userId)return;
    const boxes=getBoxes(),box=boxes[type];
    if(!box)return;
    box.innerHTML='<p>불러오는 중...</p>';
    const page=state[type],from=(page-1)*PAGE_SIZE,to=from+PAGE_SIZE-1;
    if(type==='posts'){
      const {data,error,count}=await supabaseClient.from('posts').select('id,title,status,created_at',{count:'exact'}).eq('user_id',state.userId).order('created_at',{ascending:false}).range(from,to);
      if(error){box.innerHTML='<p>최근 게시글을 불러오지 못했습니다.</p>';return;}
      const total=Number(count||0),pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
      if(state.posts>pages){state.posts=pages;return loadType('posts');}
      const rows=data||[];
      box.innerHTML=(rows.length?rows.map(p=>`<div><span>#${esc(p.id)} · ${esc(p.title||'제목 없음')} · ${esc(statusKo(p.status))} · ${esc(date(p.created_at))}</span><button type="button" onclick="adminViewPost('${esc(p.id)}')">보기</button></div>`).join(''):'<p>게시글이 없습니다.</p>')+pager('posts',total);
      return;
    }

    const {data,error,count}=await supabaseClient.from('comments').select('id,post_id,content,status,created_at',{count:'exact'}).eq('user_id',state.userId).order('created_at',{ascending:false}).range(from,to);
    if(error){box.innerHTML='<p>최근 댓글을 불러오지 못했습니다.</p>';return;}
    const total=Number(count||0),pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    if(state.comments>pages){state.comments=pages;return loadType('comments');}
    const rows=data||[];
    box.innerHTML=(rows.length?rows.map(c=>`<div><span>#${esc(c.id)} · 게시글 #${esc(c.post_id)} · ${esc(c.content||'')} · ${esc(statusKo(c.status))} · ${esc(date(c.created_at))}</span><button type="button" onclick="adminViewPost('${esc(c.post_id)}')">원본 보기</button></div>`).join(''):'<p>댓글이 없습니다.</p>')+pager('comments',total);
  }

  window.adminMemberActivityPage=function(type,delta){
    if(type!=='posts'&&type!=='comments')return;
    state[type]=Math.max(1,state[type]+Number(delta||0));
    loadType(type);
  };

  const previousOpenAdminMemberDetail=window.openAdminMemberDetail;
  if(typeof previousOpenAdminMemberDetail==='function'){
    window.openAdminMemberDetail=async function(userId){
      state.userId=userId;state.posts=1;state.comments=1;
      const result=await previousOpenAdminMemberDetail.apply(this,arguments);
      await Promise.all([loadType('posts'),loadType('comments')]);
      return result;
    };
  }

  ensureStyles();
})();