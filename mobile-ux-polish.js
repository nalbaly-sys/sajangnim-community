/* ==================================================
   MOBILE UX POLISH
   - 모바일 고정 글쓰기/검색 패널 접기·펼치기
   - 카테고리/공지·운영센터 모바일 압축
   - 게시글 상세/글쓰기 모달을 브라우저 뒤로가기로 닫기
   - 검색 초기화 문구를 전체글보기로 변경
================================================== */
(function(){
  const MOBILE_MAX=700;
  let suppressHistoryBack=false;
  let suppressWriteHistoryBack=false;
  let lastFixed=false;

  function isMobile(){return window.matchMedia(`(max-width:${MOBILE_MAX}px)`).matches;}

  function ensureStyles(){
    if(document.getElementById('mobileUxPolishStyles'))return;
    const s=document.createElement('style');
    s.id='mobileUxPolishStyles';
    s.textContent=`
      .mobile-filter-toggle{display:none;border:1px solid #d1d5db;background:#fff;color:#374151;border-radius:9px;padding:8px 10px;font-size:12px;font-weight:800;white-space:nowrap}
      @media(max-width:700px){
        .post-sticky-controls.is-fixed{padding:8px!important;border-radius:12px!important}
        .post-sticky-controls.is-fixed .post-section-header{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto;gap:8px!important;align-items:center!important}
        .post-sticky-controls.is-fixed .post-section-header>div:first-child{min-width:0}
        .post-sticky-controls.is-fixed .post-section-header h2{font-size:16px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .post-sticky-controls.is-fixed .post-section-description{display:none!important}
        .post-sticky-controls.is-fixed .big-button{padding:9px 12px!important;font-size:12px!important;white-space:nowrap}
        .post-sticky-controls.is-fixed .mobile-filter-toggle{display:inline-flex;align-items:center;justify-content:center}
        .post-sticky-controls.is-fixed.mobile-collapsed .post-search{display:none!important}
        .post-sticky-controls.is-fixed:not(.mobile-collapsed) .post-search{display:grid!important;grid-template-columns:1fr;gap:8px;margin-top:8px!important}
        .post-sticky-controls.is-fixed:not(.mobile-collapsed) .post-search input,
        .post-sticky-controls.is-fixed:not(.mobile-collapsed) .post-search select,
        .post-sticky-controls.is-fixed:not(.mobile-collapsed) .post-search button{min-height:42px!important;margin:0!important}
        .category-section{padding:16px!important;border-radius:16px!important}
        .category-section h2{font-size:20px!important;margin-bottom:14px!important}
        .category-grid{grid-template-columns:1fr 1fr!important;gap:8px!important}
        .category-grid button{padding:12px 10px!important;border-radius:11px!important;font-size:13px!important;min-height:48px!important}
        #operationsSection.ops-section{padding:15px!important;margin-top:18px!important;border-radius:16px!important}
        #operationsSection .ops-section-head{margin-bottom:10px!important}
        #operationsSection .ops-section-head h2{font-size:19px!important}
        #operationsSection .ops-section-head p{font-size:12px!important;line-height:1.5!important}
        #operationsSection .ops-grid{gap:9px!important}
        #operationsSection .ops-card{padding:12px!important;border-radius:12px!important}
        #operationsSection .ops-card h3{font-size:15px!important;margin-bottom:6px!important}
        #operationsSection .ops-notice-item{padding:9px 0!important}
        #operationsSection .ops-notice-title{gap:5px!important}
        #operationsSection .ops-notice-title strong{font-size:13px!important;line-height:1.45!important}
        #operationsSection .ops-card p{font-size:12px!important;line-height:1.55!important;margin-top:5px!important}
        #operationsSection .ops-card small{font-size:11px!important}
        #operationsSection .ops-event-empty{padding:10px 6px!important;font-size:12px!important}
        #postDetailModal .post-detail-box{position:relative!important;padding-top:22px!important}
      }
      @media(max-width:420px){.category-grid{grid-template-columns:1fr 1fr!important}.category-grid button{font-size:12px!important;padding:10px 8px!important}}
    `;
    document.head.appendChild(s);
  }

  function ensureFilterToggle(){
    const wrap=document.querySelector('.post-sticky-controls');
    const header=wrap?.querySelector('.post-section-header');
    if(!wrap||!header)return;
    let btn=header.querySelector('.mobile-filter-toggle');
    if(!btn){
      btn=document.createElement('button');btn.type='button';btn.className='mobile-filter-toggle';btn.textContent='필터 ▼';
      btn.addEventListener('click',()=>{const collapsed=wrap.classList.toggle('mobile-collapsed');btn.textContent=collapsed?'필터 ▼':'필터 ▲';});
      header.appendChild(btn);
    }
  }

  function renameResetButton(){
    document.querySelectorAll('.post-search button').forEach(btn=>{if(btn.textContent.trim()==='초기화')btn.textContent='전체글보기';});
  }

  function syncFloatingPanel(){
    const wrap=document.querySelector('.post-sticky-controls');
    if(!wrap)return;
    ensureFilterToggle();renameResetButton();
    const fixed=wrap.classList.contains('is-fixed');
    const btn=wrap.querySelector('.mobile-filter-toggle');
    if(!isMobile()){
      wrap.classList.remove('mobile-collapsed');if(btn)btn.textContent='필터 ▼';lastFixed=fixed;return;
    }
    if(fixed&&!lastFixed){wrap.classList.add('mobile-collapsed');if(btn)btn.textContent='필터 ▼';}
    if(!fixed){wrap.classList.remove('mobile-collapsed');if(btn)btn.textContent='필터 ▼';}
    lastFixed=fixed;
  }

  function bindFloatingPanel(){
    let ticking=false;
    const schedule=()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;syncFloatingPanel();});};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    const observer=new MutationObserver(schedule);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});schedule();
  }

  function isPostModalOpen(){const modal=document.getElementById('postDetailModal');return !!modal&&getComputedStyle(modal).display!=='none';}
  function isWriteModalOpen(){const modal=document.getElementById('postModal');return !!modal&&getComputedStyle(modal).display!=='none';}

  function installPostHistory(){
    const originalOpen=window.openPostDetail;const originalClose=window.closePostDetail;
    if(typeof originalOpen!=='function'||typeof originalClose!=='function'||window.__postHistoryUxInstalled)return;
    window.__postHistoryUxInstalled=true;
    window.openPostDetail=async function(postId){
      const wasOpen=isPostModalOpen();const result=await originalOpen.apply(this,arguments);
      if(!wasOpen&&isPostModalOpen())history.pushState({...(history.state||{}),sajangnimPostDetail:true,postId:Number(postId)||postId},'',window.location.href);
      return result;
    };
    window.closePostDetail=function(){
      if(!suppressHistoryBack&&history.state?.sajangnimPostDetail&&isPostModalOpen()){history.back();return;}
      return originalClose.apply(this,arguments);
    };
    window.addEventListener('popstate',()=>{
      if(!isPostModalOpen())return;
      suppressHistoryBack=true;try{originalClose();}finally{suppressHistoryBack=false;}
    });
  }

  function installWriteHistory(){
    const originalOpen=window.openPostModal;const originalCloseModal=window.closeModal;
    if(typeof originalOpen!=='function'||typeof originalCloseModal!=='function'||window.__postWriteHistoryUxInstalled)return;
    window.__postWriteHistoryUxInstalled=true;
    window.openPostModal=function(){
      const wasOpen=isWriteModalOpen();const result=originalOpen.apply(this,arguments);
      if(!wasOpen&&isWriteModalOpen())history.pushState({...(history.state||{}),sajangnimPostCompose:true},'',window.location.href);
      return result;
    };
    window.closeModal=function(id){
      if(id==='postModal'&&!suppressWriteHistoryBack&&history.state?.sajangnimPostCompose&&isWriteModalOpen()){history.back();return;}
      return originalCloseModal.apply(this,arguments);
    };
    window.addEventListener('popstate',()=>{
      if(!isWriteModalOpen())return;
      suppressWriteHistoryBack=true;try{originalCloseModal('postModal');}finally{suppressWriteHistoryBack=false;}
    });
  }

  ensureStyles();bindFloatingPanel();installPostHistory();installWriteHistory();renameResetButton();
  setTimeout(()=>{ensureFilterToggle();syncFloatingPanel();installPostHistory();installWriteHistory();renameResetButton();},100);
  setTimeout(()=>{ensureFilterToggle();syncFloatingPanel();installPostHistory();installWriteHistory();renameResetButton();},500);
})();