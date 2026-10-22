/* ==================================================
   COMMUNITY DENSITY POLISH
   - 카테고리 / 공지·운영센터: 접속 시 기본 펼침, 사용자가 접을 수 있음
   - 공지/이벤트 목록: 제목 + 날짜만 표시, 클릭 시 상세 보기
   - 게시글 목록: 본문 미리보기 숨김
================================================== */
(function(){
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const fmtDate=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});};

  let noticeCache=[];
  let eventCache=[];

  function ensureStyles(){
    if(document.getElementById('communityDensityPolishStyles'))return;
    const s=document.createElement('style');
    s.id='communityDensityPolishStyles';
    s.textContent=`
      .community-collapse-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .community-collapse-toggle{border:1px solid #d1d5db;background:#fff;color:#374151;border-radius:9px;padding:7px 10px;font-size:12px;font-weight:800;white-space:nowrap}
      .category-section.is-collapsed .category-grid{display:none!important}
      .category-section.is-collapsed{padding-bottom:18px!important}
      #operationsSection.is-collapsed .ops-grid{display:none!important}
      #operationsSection.is-collapsed{padding-bottom:15px!important}
      .ops-list-row{width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;text-align:left;border:0;border-bottom:1px solid #f3f4f6;background:transparent;padding:12px 0;color:#111827;cursor:pointer}
      .ops-list-row:last-child{border-bottom:0}
      .ops-list-row:hover strong{text-decoration:underline}
      .ops-list-row strong{font-size:14px;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ops-list-row small{font-size:11px;color:#9ca3af;white-space:nowrap}
      .ops-detail-modal{display:none;position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);padding:18px;align-items:center;justify-content:center}
      .ops-detail-modal.open{display:flex}
      .ops-detail-box{position:relative;width:100%;max-width:720px;max-height:88vh;overflow:auto;background:#fff;border-radius:18px;padding:26px;box-shadow:0 24px 80px rgba(0,0,0,.28)}
      .ops-detail-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:28px;color:#6b7280}
      .ops-detail-type{font-size:12px;font-weight:800;color:#6b7280;margin-bottom:8px}
      .ops-detail-title{margin:0 42px 8px 0;font-size:22px;line-height:1.45}
      .ops-detail-date{color:#9ca3af;font-size:12px;margin-bottom:18px}
      .ops-detail-content{white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#374151;font-size:14px}
      .post-preview{display:none!important}
      @media(max-width:700px){
        .category-section.is-collapsed{padding:14px 16px!important}
        .category-section.is-collapsed h2{margin:0!important;font-size:18px!important}
        #operationsSection.is-collapsed{padding:12px 15px!important}
        #operationsSection.is-collapsed .ops-section-head{margin:0!important}
        #operationsSection.is-collapsed .ops-section-head p{display:none!important}
        .community-collapse-toggle{padding:6px 9px;font-size:11px}
        .ops-list-row{padding:10px 0;gap:8px}
        .ops-list-row strong{font-size:13px}
        .ops-detail-box{padding:24px 18px}
        .ops-detail-title{font-size:19px}
      }
    `;
    document.head.appendChild(s);
  }

  function installCategoryCollapse(){
    const section=document.querySelector('.category-section');
    if(!section||section.dataset.collapseReady==='1')return;
    const h2=section.querySelector('h2');
    if(!h2)return;
    const head=document.createElement('div');
    head.className='community-collapse-head';
    h2.parentNode.insertBefore(head,h2);
    head.appendChild(h2);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='community-collapse-toggle';
    btn.textContent='접기 ▲';
    btn.addEventListener('click',()=>{
      const collapsed=section.classList.toggle('is-collapsed');
      btn.textContent=collapsed?'펼치기 ▼':'접기 ▲';
    });
    head.appendChild(btn);
    section.dataset.collapseReady='1';
  }

  function installOperatingCollapse(){
    const section=document.getElementById('operationsSection');
    if(!section||section.dataset.collapseReady==='1')return;
    const head=section.querySelector('.ops-section-head');
    if(!head)return;
    head.classList.add('community-collapse-head');
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='community-collapse-toggle';
    btn.textContent='접기 ▲';
    btn.addEventListener('click',()=>{
      const collapsed=section.classList.toggle('is-collapsed');
      btn.textContent=collapsed?'펼치기 ▼':'접기 ▲';
    });
    head.appendChild(btn);
    section.dataset.collapseReady='1';
  }

  function ensureDetailModal(){
    let modal=document.getElementById('opsContentDetailModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='opsContentDetailModal';
    modal.className='ops-detail-modal';
    modal.innerHTML='<div class="ops-detail-box"><button type="button" class="ops-detail-close" aria-label="닫기">×</button><div id="opsDetailType" class="ops-detail-type"></div><h2 id="opsDetailTitle" class="ops-detail-title"></h2><div id="opsDetailDate" class="ops-detail-date"></div><div id="opsDetailContent" class="ops-detail-content"></div></div>';
    modal.querySelector('.ops-detail-close').addEventListener('click',closeOpsContentDetail);
    modal.addEventListener('click',e=>{if(e.target===modal)closeOpsContentDetail();});
    document.body.appendChild(modal);
    return modal;
  }

  function openOpsContentDetail(type,id){
    const source=type==='notice'?noticeCache:eventCache;
    const item=source.find(x=>Number(x.id)===Number(id));
    if(!item)return;
    const modal=ensureDetailModal();
    document.getElementById('opsDetailType').textContent=type==='notice'?'📢 공지사항':'🎉 이벤트';
    document.getElementById('opsDetailTitle').textContent=item.title||'';
    document.getElementById('opsDetailDate').textContent=fmtDate(item.published_at||item.starts_at||item.created_at);
    document.getElementById('opsDetailContent').textContent=item.content||'';
    modal.classList.add('open');
    document.body.style.overflow='hidden';
  }

  function closeOpsContentDetail(){
    document.getElementById('opsContentDetailModal')?.classList.remove('open');
    document.body.style.overflow='';
  }

  window.openOpsContentDetail=openOpsContentDetail;
  window.closeOpsContentDetail=closeOpsContentDetail;

  function getCards(){
    const section=document.getElementById('operationsSection');
    if(!section)return null;
    const cards=section.querySelectorAll('.ops-grid .ops-card');
    if(cards.length<2)return null;
    return {notice:cards[0],event:cards[1]};
  }

  async function loadCompactOperatingContent(){
    const cards=getCards();
    if(!cards||!window.supabaseClient)return;
    try{
      const [nr,er]=await Promise.all([
        supabaseClient.from('notices').select('id,title,content,is_pinned,published_at,created_at').order('is_pinned',{ascending:false}).order('published_at',{ascending:false}).limit(10),
        supabaseClient.from('events').select('id,title,content,starts_at,ends_at,published_at,created_at').order('starts_at',{ascending:false}).order('published_at',{ascending:false}).limit(10)
      ]);
      if(nr.error||er.error)throw nr.error||er.error;
      noticeCache=nr.data||[];
      eventCache=er.data||[];
      cards.notice.innerHTML='<h3>공지사항</h3>'+(noticeCache.length?noticeCache.map(n=>`<button type="button" class="ops-list-row" onclick="openOpsContentDetail(\'notice\',${Number(n.id)})"><strong>${esc(n.title)}</strong><small>${esc(fmtDate(n.published_at||n.created_at))}</small></button>`).join(''):'<div class="ops-event-empty">등록된 공지가 없습니다.</div>');
      cards.event.innerHTML='<h3>이벤트</h3>'+(eventCache.length?eventCache.map(e=>`<button type="button" class="ops-list-row" onclick="openOpsContentDetail(\'event\',${Number(e.id)})"><strong>${esc(e.title)}</strong><small>${esc(fmtDate(e.starts_at||e.published_at||e.created_at))}</small></button>`).join(''):'<div class="ops-event-empty"><strong>현재 진행 중인 이벤트가 없습니다.</strong></div>');
    }catch(e){console.warn('간결한 공지/이벤트 조회 실패:',e);}
  }

  const previousRefresh=window.refreshPublicOperatingContent;
  window.refreshPublicOperatingContent=async function(){
    if(typeof previousRefresh==='function'){
      try{await previousRefresh();}catch(_){ }
    }
    return loadCompactOperatingContent();
  };

  function start(){
    ensureStyles();
    installCategoryCollapse();
    installOperatingCollapse();
    ensureDetailModal();
    loadCompactOperatingContent();
    setTimeout(()=>{installCategoryCollapse();installOperatingCollapse();loadCompactOperatingContent();},150);
    setTimeout(()=>{installCategoryCollapse();installOperatingCollapse();loadCompactOperatingContent();},700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
