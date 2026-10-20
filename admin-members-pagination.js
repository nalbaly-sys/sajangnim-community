/* 관리자 회원목록 20명 페이지네이션 + 역할/상태/업종/검색 */
(function(){
  const PAGE_SIZE=20;
  const state={page:1,role:'ALL',status:'ALL',business:'ALL',query:''};
  const originalLoadAdminMembers=window.loadAdminMembers;

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function roleKo(v){v=String(v||'').toUpperCase();return v==='ADMIN'?'관리자':v==='MODERATOR'?'운영자':v==='USER'?'일반회원':v||'미확인';}
  function statusKo(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'정상':v==='SUSPENDED'?'정지':v==='BLOCKED'?'차단':v==='INACTIVE'?'비활성':v||'미확인';}
  function statusClass(v){v=String(v||'').toUpperCase();return v==='ACTIVE'?'is-active':v==='SUSPENDED'||v==='BLOCKED'?'is-blocked':'is-neutral';}

  function ensureStyles(){
    if(document.getElementById('adminMembersPaginationStyles'))return;
    const s=document.createElement('style');s.id='adminMembersPaginationStyles';s.textContent=`
      .admin-member-filterbar{display:grid;grid-template-columns:minmax(220px,1fr) repeat(3,minmax(140px,auto));gap:8px;margin:0 0 12px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;}
      .admin-member-filterbar input,.admin-member-filterbar select{width:100%;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;background:#fff;}
      .admin-member-filterbar .wide{grid-column:1 / -1;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
      .admin-member-filterbar .wide input{flex:1;min-width:220px;}
      .admin-member-filterbar button{padding:9px 12px;border:1px solid #d1d5db;background:#fff;border-radius:8px;font-weight:800;cursor:pointer;}
      .admin-member-pager{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:14px 0 4px;}
      .admin-member-pager button{padding:8px 12px;border:1px solid #d1d5db;background:#fff;border-radius:8px;font-weight:800;cursor:pointer;}
      .admin-member-pager button:disabled{opacity:.4;cursor:not-allowed;}
      .admin-member-pageinfo{font-size:13px;color:#6b7280;font-weight:700;}
      @media (max-width:720px){.admin-member-filterbar{grid-template-columns:1fr;}.admin-member-filterbar .wide{grid-column:1;}}
    `;document.head.appendChild(s);
  }

  function memberCard(p){
    const role=String(p.role||'USER').toUpperCase(),status=String(p.status||'').toUpperCase();
    return `<button type="button" class="admin-member-card" data-member-id="${esc(p.id)}" data-member-nickname="${esc(p.nickname||'')}" onclick="openAdminMemberDetail('${esc(p.id)}')"><span><strong>${esc(p.nickname||'닉네임 미설정')}</strong><small>${esc(p.id)}</small><small>${esc(p.business_type||'업종 미설정')}</small></span><span class="admin-member-role-status"><span class="role">역할: ${esc(roleKo(role))}</span><span class="state ${statusClass(status)}">상태: ${esc(statusKo(status))}</span></span></button>`;
  }

  function toolbar(total){
    const businesses=['ALL','꽃집','식당','카페','의류','미용','소매','온라인','서비스','기타'];
    return `<div class="admin-member-filterbar"><div class="wide"><input id="adminMemberServerSearch" type="search" value="${esc(state.query)}" placeholder="닉네임 또는 회원 ID 검색"><button type="button" onclick="adminMemberApplySearch()">검색</button><button type="button" onclick="adminMemberResetFilters()">초기화</button><span><strong>전체 ${Number(total||0).toLocaleString()}명 · 20명씩 보기</strong></span></div><label>역할<select onchange="adminMemberFilter('role',this.value)"><option value="ALL" ${state.role==='ALL'?'selected':''}>전체</option><option value="USER" ${state.role==='USER'?'selected':''}>일반회원</option><option value="MODERATOR" ${state.role==='MODERATOR'?'selected':''}>운영자</option><option value="ADMIN" ${state.role==='ADMIN'?'selected':''}>관리자</option></select></label><label>상태<select onchange="adminMemberFilter('status',this.value)"><option value="ALL" ${state.status==='ALL'?'selected':''}>전체</option><option value="ACTIVE" ${state.status==='ACTIVE'?'selected':''}>정상</option><option value="SUSPENDED" ${state.status==='SUSPENDED'?'selected':''}>정지</option><option value="BLOCKED" ${state.status==='BLOCKED'?'selected':''}>차단</option><option value="INACTIVE" ${state.status==='INACTIVE'?'selected':''}>비활성</option></select></label><label>업종<select onchange="adminMemberFilter('business',this.value)">${businesses.map(v=>`<option value="${esc(v)}" ${state.business===v?'selected':''}>${v==='ALL'?'전체 업종':esc(v)}</option>`).join('')}</select></label></div>`;
  }

  function pager(total){const pages=Math.max(1,Math.ceil(Number(total||0)/PAGE_SIZE));if(state.page>pages)state.page=pages;return `<div class="admin-member-pager"><button type="button" ${state.page<=1?'disabled':''} onclick="adminMemberPage(-1)">← 이전 20명</button><span class="admin-member-pageinfo">${state.page} / ${pages} 페이지 · 전체 ${Number(total||0).toLocaleString()}명</span><button type="button" ${state.page>=pages?'disabled':''} onclick="adminMemberPage(1)">다음 20명 →</button></div>`;}

  window.adminMemberPage=function(delta){state.page=Math.max(1,state.page+Number(delta||0));window.loadAdminMembers();};
  window.adminMemberFilter=function(type,value){if(type==='role')state.role=value||'ALL';if(type==='status')state.status=value||'ALL';if(type==='business')state.business=value||'ALL';state.page=1;window.loadAdminMembers();};
  window.adminMemberApplySearch=function(){const input=document.getElementById('adminMemberServerSearch');state.query=(input?.value||'').trim();state.page=1;window.loadAdminMembers();};
  window.adminMemberResetFilters=function(){state.page=1;state.role='ALL';state.status='ALL';state.business='ALL';state.query='';window.loadAdminMembers();};

  window.loadAdminMembers=async function(){
    ensureStyles();if(typeof isAdminUser==='function'&&!isAdminUser())return;const box=document.getElementById('adminPanelContent');if(!box)return;if(typeof adminMessage==='function')adminMessage('회원 목록을 불러오는 중입니다.');
    try{
      const {data,error}=await supabaseClient.rpc('admin_page_members',{p_page:state.page,p_page_size:PAGE_SIZE,p_role:state.role,p_status:state.status,p_business_type:state.business,p_query:state.query});if(error)throw error;
      const rows=data?.rows||[],total=Number(data?.total||0);
      box.innerHTML=toolbar(total)+`<div id="adminMemberList" class="admin-member-list">${rows.length?rows.map(memberCard).join(''):'<p class="admin-empty">해당 조건의 회원이 없습니다.</p>'}</div>`+pager(total);
      const input=document.getElementById('adminMemberServerSearch');if(input)input.addEventListener('keydown',e=>{if(e.key==='Enter')window.adminMemberApplySearch();});
      if(typeof adminMessage==='function')adminMessage('회원 전체 기록을 20명씩 표시합니다. 역할·상태·업종 필터와 닉네임/ID 검색을 사용할 수 있습니다.');
    }catch(e){console.warn('회원 페이지 RPC 실패, 기존 목록으로 복귀:',e);if(originalLoadAdminMembers)return originalLoadAdminMembers();}
  };

  ensureStyles();
})();
