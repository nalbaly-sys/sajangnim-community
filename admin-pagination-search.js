/* 관리자 목록 100건 페이지네이션 + 서버 전체검색 */
(function(){
  const PAGE_SIZE=100;
  const state={reports:{page:1,status:'ALL'},posts:{page:1,status:'ALL'},comments:{page:1,status:'ALL'}};
  const old={
    reports:window.loadAdminReports,
    posts:window.loadAdminPosts,
    comments:window.loadAdminComments,
    search:window.runAdminUnifiedSearch
  };

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function date(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});}
  function contentKo(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'공개':v==='HIDDEN'?'숨김':v==='DELETED'?'삭제':v||'미확인';}
  function reportKo(v){v=String(v||'').toUpperCase();return v==='PENDING'?'접수중':v==='RESOLVED'?'처리완료':v==='REJECTED'?'기각':v||'미확인';}
  function roleKo(v){v=String(v||'').toUpperCase();return v==='ADMIN'?'관리자':v==='MODERATOR'?'운영자':v==='USER'?'일반회원':v||'미확인';}
  function memberKo(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'정상':v==='SUSPENDED'?'정지':v==='BLOCKED'?'차단':v==='INACTIVE'?'비활성':v||'미확인';}
  function statusClass(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'is-active':v==='HIDDEN'?'is-hidden':v==='DELETED'?'is-deleted':v==='PENDING'?'is-pending':v==='RESOLVED'?'is-resolved':v==='REJECTED'?'is-rejected':'is-neutral';}

  function ensureStyles(){
    if(document.getElementById('adminPaginationSearchStyles'))return;
    const s=document.createElement('style');s.id='adminPaginationSearchStyles';s.textContent=`
      .admin-list-toolbar{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 12px;padding:10px 12px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;}
      .admin-list-toolbar select{padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;background:#fff;}
      .admin-pagination{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:14px 0 4px;}
      .admin-pagination button{padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:8px;font-weight:800;cursor:pointer;}
      .admin-pagination button:disabled{opacity:.4;cursor:not-allowed;}
      .admin-page-info{font-size:13px;color:#6b7280;font-weight:700;}
      .admin-status.is-active{background:#dcfce7!important;color:#166534!important;border:1px solid #86efac!important;}
      .admin-status.is-hidden{background:#fee2e2!important;color:#b91c1c!important;border:1px solid #fca5a5!important;}
      .admin-status.is-deleted{background:#e5e7eb!important;color:#374151!important;border:1px solid #9ca3af!important;}
      .admin-status.is-pending{background:#fef3c7!important;color:#92400e!important;border:1px solid #fcd34d!important;}
      .admin-status.is-resolved{background:#dcfce7!important;color:#166534!important;border:1px solid #86efac!important;}
      .admin-status.is-rejected{background:#f3f4f6!important;color:#4b5563!important;border:1px solid #9ca3af!important;}
    `;document.head.appendChild(s);
  }

  function pager(type,total){
    const st=state[type],pages=Math.max(1,Math.ceil(Number(total||0)/PAGE_SIZE));
    if(st.page>pages)st.page=pages;
    return `<div class="admin-pagination"><button type="button" ${st.page<=1?'disabled':''} onclick="adminListPage('${type}',-1)">← 이전 100건</button><span class="admin-page-info">${st.page} / ${pages} 페이지 · 전체 ${Number(total||0).toLocaleString()}건</span><button type="button" ${st.page>=pages?'disabled':''} onclick="adminListPage('${type}',1)">다음 100건 →</button></div>`;
  }

  function toolbar(type,total){
    const st=state[type];
    const opts=type==='reports'?[['ALL','전체'],['PENDING','접수중'],['RESOLVED','처리완료'],['REJECTED','기각']]:[['ALL','전체'],['ACTIVE','공개'],['HIDDEN','숨김'],['DELETED','삭제']];
    return `<div class="admin-list-toolbar"><strong>전체 ${Number(total||0).toLocaleString()}건 · 100건씩 보기</strong><label>상태 <select onchange="adminListFilter('${type}',this.value)">${opts.map(([v,t])=>`<option value="${v}" ${st.status===v?'selected':''}>${t}</option>`).join('')}</select></label></div>`;
  }

  window.adminListPage=function(type,delta){if(!state[type])return;state[type].page=Math.max(1,state[type].page+Number(delta||0));load(type);};
  window.adminListFilter=function(type,value){if(!state[type])return;state[type].status=value||'ALL';state[type].page=1;load(type);};
  function load(type){if(type==='reports')return window.loadAdminReports();if(type==='posts')return window.loadAdminPosts();if(type==='comments')return window.loadAdminComments();}

  function reportCard(r){
    const targetType=r.target_type==='COMMENT'?'댓글':'게시글',targetState=contentKo(r.target_status),reportState=reportKo(r.status);
    const title=r.target_type==='POST'?(r.target_title||'게시글 정보를 불러올 수 없음'):`댓글 내용: ${r.target_content||'내용 없음'}`;
    const parent=r.target_type==='COMMENT'?`<p><b>원본 게시글:</b> ${esc(r.parent_post_title||'제목 조회 불가')} · 게시글 ID: ${esc(r.parent_post_id||'')}</p>`:'';
    const open=r.target_type==='COMMENT'?`adminViewComment('${esc(r.target_id)}','${esc(r.status)}')`:`adminViewReportedPost('${esc(r.target_id)}','${esc(r.status)}')`;
    const restore=['HIDDEN','DELETED'].includes(String(r.target_status||'').toUpperCase())?`<button type="button" onclick="restoreReportedTarget('${esc(r.target_type)}','${esc(r.target_id)}')">다시 공개</button>`:'';
    return `<article class="admin-item"><div class="admin-item-head"><strong>신고 #${esc(r.id)} · ${targetType} 신고</strong><span class="admin-status ${statusClass(r.status)}">${reportState}</span></div><p><b>신고 대상:</b> ${esc(title)}</p>${parent}<p><b>대상 상태:</b> ${esc(targetState)} · <b>대상 ID:</b> ${esc(r.target_id)}</p><p><b>신고 사유:</b> ${esc(r.reason)}</p><p><b>추가 설명:</b> ${esc(r.detail||'없음')}</p><small>신고자 ID: ${esc(r.reporter_id)} · ${esc(date(r.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="setReportStatus('${esc(r.id)}','REJECTED')">신고 기각</button><button type="button" onclick="hideReportedTargetAndResolve('${esc(r.target_type)}','${esc(r.target_id)}','${esc(r.id)}')">대상 숨김 + 처리 완료</button><button type="button" onclick="setReportStatus('${esc(r.id)}','RESOLVED')">처리 완료만</button><button type="button" onclick="${open}">${targetType} 확인</button>${restore}</div></article>`;
  }

  window.loadAdminReports=async function(){
    ensureStyles();if(typeof isAdminUser==='function'&&!isAdminUser())return;const box=document.getElementById('adminPanelContent');if(!box)return;adminMessage('신고 목록을 불러오는 중입니다.');
    const st=state.reports;
    try{const {data,error}=await supabaseClient.rpc('admin_page_reports',{p_page:st.page,p_page_size:PAGE_SIZE,p_status:st.status});if(error)throw error;const rows=data?.rows||[],total=Number(data?.total||0);box.innerHTML=toolbar('reports',total)+(rows.length?rows.map(reportCard).join(''):'<p class="admin-empty">해당 조건의 신고가 없습니다.</p>')+pager('reports',total);adminMessage('신고 전체 기록을 100건씩 페이지로 표시합니다. 처리된 신고도 기록에서 사라지지 않습니다.');if(typeof loadAdminDashboard==='function')await loadAdminDashboard();}
    catch(e){console.warn('신고 페이지 RPC 실패, 기존 목록으로 복귀:',e);if(old.reports)return old.reports();}
  };

  function postCard(p){const st=String(p.status||'').toUpperCase();return `<article class="admin-item"><div class="admin-item-head"><strong>#${esc(p.id)} · ${esc(p.title||'제목 없음')}</strong><span class="admin-status ${statusClass(st)}">${esc(contentKo(st))}</span></div><p>${esc(p.category||'')} · ${esc(p.business_type||'')} · ${esc(date(p.created_at))}</p><small>작성자 ID: ${esc(p.user_id||'')}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${esc(p.id)}')">게시글 보기</button>${st==='ACTIVE'?`<button onclick="setAdminContentStatus('posts','${esc(p.id)}','HIDDEN')">숨김</button><button onclick="setAdminContentStatus('posts','${esc(p.id)}','DELETED')">삭제 처리</button>`:st==='HIDDEN'?`<button onclick="setAdminContentStatus('posts','${esc(p.id)}','ACTIVE')">다시 공개</button><button onclick="setAdminContentStatus('posts','${esc(p.id)}','DELETED')">삭제 처리</button>`:`<button onclick="setAdminContentStatus('posts','${esc(p.id)}','ACTIVE')">복구</button>`}</div></article>`;}
  window.loadAdminPosts=async function(){
    ensureStyles();if(typeof isAdminUser==='function'&&!isAdminUser())return;const box=document.getElementById('adminPanelContent');if(!box)return;adminMessage('게시글을 불러오는 중입니다.');const st=state.posts;
    try{const {data,error}=await supabaseClient.rpc('admin_page_posts',{p_page:st.page,p_page_size:PAGE_SIZE,p_status:st.status});if(error)throw error;const rows=data?.rows||[],total=Number(data?.total||0);box.innerHTML=toolbar('posts',total)+(rows.length?rows.map(postCard).join(''):'<p class="admin-empty">해당 조건의 게시글이 없습니다.</p>')+pager('posts',total);adminMessage('게시글 전체 기록을 100건씩 페이지로 표시합니다.');}
    catch(e){console.warn('게시글 페이지 RPC 실패, 기존 목록으로 복귀:',e);if(old.posts)return old.posts();}
  };

  function commentCard(c){const st=String(c.status||'').toUpperCase();return `<article class="admin-item"><div class="admin-item-head"><strong>댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</strong><span class="admin-status ${statusClass(st)}">${esc(contentKo(st))}</span></div><p>${esc(c.content||'')}</p><small>작성자 ID: ${esc(c.user_id||'')} · ${esc(date(c.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${esc(c.post_id)}')">원본 게시글 보기</button>${st==='ACTIVE'?`<button onclick="setAdminContentStatus('comments','${esc(c.id)}','HIDDEN')">숨김</button><button onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:st==='HIDDEN'?`<button onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">다시 공개</button><button onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:`<button onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">복구</button>`}</div></article>`;}
  window.loadAdminComments=async function(){
    ensureStyles();if(typeof isAdminUser==='function'&&!isAdminUser())return;const box=document.getElementById('adminPanelContent');if(!box)return;adminMessage('댓글을 불러오는 중입니다.');const st=state.comments;
    try{const {data,error}=await supabaseClient.rpc('admin_page_comments',{p_page:st.page,p_page_size:PAGE_SIZE,p_status:st.status});if(error)throw error;const rows=data?.rows||[],total=Number(data?.total||0);box.innerHTML=toolbar('comments',total)+(rows.length?rows.map(commentCard).join(''):'<p class="admin-empty">해당 조건의 댓글이 없습니다.</p>')+pager('comments',total);adminMessage('댓글 전체 기록을 100건씩 페이지로 표시합니다. 숨김·삭제 댓글도 포함됩니다.');}
    catch(e){console.warn('댓글 페이지 RPC 실패, 기존 목록으로 복귀:',e);if(old.comments)return old.comments();}
  };

  function snippet(text,q){const s=String(text||''),needle=String(q||'');const i=s.toLowerCase().indexOf(needle.toLowerCase());if(i<0)return esc(s.slice(0,120));const a=Math.max(0,i-40),b=Math.min(s.length,i+needle.length+50);return `${a?'…':''}${esc(s.slice(a,i))}<span class="admin-search-hit">${esc(s.slice(i,i+needle.length))}</span>${esc(s.slice(i+needle.length,b))}${b<s.length?'…':''}`;}
  function section(title,rows,render){return `<section class="admin-search-group"><h3>${title} · ${rows.length}건</h3>${rows.length?rows.map(render).join(''):'<div class="admin-search-empty">검색 결과 없음</div>'}</section>`;}

  window.runAdminUnifiedSearch=async function(){
    if(typeof isAdminUser==='function'&&!isAdminUser())return;const input=document.getElementById('adminUnifiedSearchInput'),results=document.getElementById('adminUnifiedSearchResults'),summary=document.getElementById('adminUnifiedSearchSummary');if(!input||!results)return;const q=input.value.trim();if(!q){results.innerHTML='<div class="admin-search-empty">검색어를 입력해주세요.</div>';return;}results.innerHTML='<div class="admin-search-empty">전체 데이터에서 검색 중...</div>';if(summary)summary.textContent='"'+q+'" 전체 검색 중...';
    try{const {data,error}=await supabaseClient.rpc('admin_unified_search',{p_query:q,p_limit_each:100});if(error)throw error;const reports=data?.reports||[],posts=data?.posts||[],comments=data?.comments||[],profiles=data?.profiles||[];
      const rh=section('🚨 신고관리',reports,r=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">신고 #${esc(r.id)} · ${r.target_type==='COMMENT'?'댓글':'게시글'} · ${reportKo(r.status)}</span></div><div class="admin-search-snippet">${snippet([r.reason,r.detail,r.target_title,r.target_content].filter(Boolean).join(' '),q)}</div><div class="admin-search-actions"><button onclick="${r.target_type==='COMMENT'?`adminViewComment('${esc(r.target_id)}','${esc(r.status)}')`:`adminViewReportedPost('${esc(r.target_id)}','${esc(r.status)}')`}">원문으로 이동</button></div></article>`);
      const ph=section('📝 게시글관리',posts,p=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">게시글 #${esc(p.id)} · ${esc(p.title||'제목 없음')}</span><span>${contentKo(p.status)}</span></div><div class="admin-search-snippet">${snippet((p.title||'')+' '+(p.content||''),q)}</div><div class="admin-search-actions"><button onclick="adminViewPost('${esc(p.id)}')">게시글 열기</button></div></article>`);
      const ch=section('💬 댓글관리',comments,c=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</span><span>${contentKo(c.status)}</span></div><div class="admin-search-snippet">${snippet(c.content,q)}</div><div class="admin-search-actions"><button onclick="adminOpenSearchComment('${esc(c.id)}','${esc(c.post_id)}')">댓글 위치로 이동</button></div></article>`);
      const mh=section('🌸 화원목록',profiles,p=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">${esc(p.nickname||'닉네임 미설정')} · ${esc(p.business_type||'업종 미설정')}</span><span>${esc(roleKo(p.role))} · ${esc(memberKo(p.status))}</span></div><div class="admin-search-snippet">${snippet([p.nickname,p.business_type,p.introduction,p.id].filter(Boolean).join(' '),q)}</div><div class="admin-search-actions"><button onclick="openAdminMemberDetail('${esc(p.id)}')">화원 정보 보기</button></div></article>`);
      results.innerHTML=rh+ph+ch+mh;const total=reports.length+posts.length+comments.length+profiles.length;if(summary)summary.textContent='"'+q+'" 전체 DB 검색 결과 '+total+'건 (분류별 최대 100건 표시)';
    }catch(e){console.warn('서버 통합검색 RPC 실패, 기존 검색으로 복귀:',e);if(old.search)return old.search();results.innerHTML='<div class="admin-search-empty">검색 RPC를 사용할 수 없습니다.</div>';}
  };

  ensureStyles();
})();
