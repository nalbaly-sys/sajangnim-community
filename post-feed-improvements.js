/* ==================================================
   POST FEED IMPROVEMENTS
   - 공개 게시글 20개 단위 페이지네이션
   - 게시글 상단 제목/글쓰기/검색필터 스크롤 고정
================================================== */
(function(){
  const PAGE_SIZE=20;
  let currentPage=1;
  let totalCount=0;
  let stickyBound=false;

  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const fallbackDate=v=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});};

  function ensureStyles(){
    if(document.getElementById('postFeedImprovementStyles'))return;
    const s=document.createElement('style');
    s.id='postFeedImprovementStyles';
    s.textContent=`
      .post-sticky-controls{position:relative;z-index:85;background:rgba(255,255,255,.98);backdrop-filter:blur(10px);border:1px solid #e5e7eb;border-radius:14px;padding:14px;margin:-2px 0 18px;box-shadow:0 8px 24px rgba(15,23,42,.08)}
      .post-sticky-controls.is-fixed{position:fixed!important;z-index:900!important;margin:0!important;box-shadow:0 12px 30px rgba(15,23,42,.16)}
      .post-sticky-spacer{display:none}
      .post-sticky-spacer.active{display:block}
      .post-sticky-controls .post-section-header{margin:0}
      .post-sticky-controls .post-search{margin-top:14px;margin-bottom:0}
      .post-pagination{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:24px 0 4px}
      .post-pagination button{min-width:38px;height:38px;padding:0 10px;border:1px solid #d1d5db;border-radius:9px;background:#fff;color:#374151;font-weight:700;cursor:pointer}
      .post-pagination button:hover:not(:disabled){background:#f3f4f6}
      .post-pagination button.active{background:#111827;color:#fff;border-color:#111827}
      .post-pagination button:disabled{opacity:.38;cursor:default}
      .post-pagination-info{width:100%;text-align:center;color:#9ca3af;font-size:12px;margin-top:4px}
      @media(max-width:700px){
        .post-sticky-controls{padding:10px;border-radius:12px}
        .post-sticky-controls .post-section-description{display:none}
        .post-sticky-controls .post-section-header{align-items:center}
        .post-sticky-controls .post-search{margin-top:10px}
      }
    `;
    document.head.appendChild(s);
  }

  function ensureStickyControls(){
    const section=document.getElementById('postSection');
    if(!section)return null;
    let wrap=section.querySelector('.post-sticky-controls');
    if(!wrap){
      const header=section.querySelector('.post-section-header');
      const search=section.querySelector('.post-search');
      const list=document.getElementById('postList');
      if(!header||!search||!list)return null;
      wrap=document.createElement('div');
      wrap.className='post-sticky-controls';
      section.insertBefore(wrap,list);
      wrap.appendChild(header);
      wrap.appendChild(search);
      const spacer=document.createElement('div');
      spacer.className='post-sticky-spacer';
      wrap.insertAdjacentElement('afterend',spacer);
    }
    bindScrollFollow();
    return wrap;
  }

  function getHeaderOffset(){
    const header=document.querySelector('.site-header');
    return Math.max(0,Math.ceil(header?.getBoundingClientRect().height||0));
  }

  function updateFixedControls(){
    const section=document.getElementById('postSection');
    const wrap=section?.querySelector('.post-sticky-controls');
    const spacer=section?.querySelector('.post-sticky-spacer');
    if(!section||!wrap||!spacer)return;

    if(!wrap.classList.contains('is-fixed')){
      wrap.dataset.originTop=String(wrap.getBoundingClientRect().top+window.scrollY);
    }

    const originTop=Number(wrap.dataset.originTop||0);
    const headerOffset=getHeaderOffset()+8;
    const shouldFix=window.scrollY+headerOffset>originTop;

    if(!shouldFix){
      wrap.classList.remove('is-fixed');
      wrap.style.removeProperty('top');
      wrap.style.removeProperty('left');
      wrap.style.removeProperty('width');
      spacer.classList.remove('active');
      spacer.style.height='0px';
      return;
    }

    const sectionRect=section.getBoundingClientRect();
    const wrapHeight=wrap.offsetHeight;
    const sectionBottom=sectionRect.bottom;
    if(sectionBottom<=headerOffset+wrapHeight+12){
      wrap.classList.remove('is-fixed');
      wrap.style.removeProperty('top');
      wrap.style.removeProperty('left');
      wrap.style.removeProperty('width');
      spacer.classList.remove('active');
      spacer.style.height='0px';
      return;
    }

    const horizontalPadding=parseFloat(getComputedStyle(section).paddingLeft||'0');
    wrap.classList.add('is-fixed');
    wrap.style.setProperty('top',headerOffset+'px','important');
    wrap.style.setProperty('left',(sectionRect.left+horizontalPadding)+'px','important');
    wrap.style.setProperty('width',Math.max(0,sectionRect.width-horizontalPadding*2)+'px','important');
    spacer.classList.add('active');
    spacer.style.height=wrapHeight+18+'px';
  }

  function bindScrollFollow(){
    if(stickyBound)return;
    stickyBound=true;
    let ticking=false;
    const schedule=()=>{
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(()=>{ticking=false;updateFixedControls();});
    };
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    schedule();
  }

  function ensurePagination(){
    const list=document.getElementById('postList');
    if(!list)return null;
    let host=document.getElementById('postPagination');
    if(!host){host=document.createElement('div');host.id='postPagination';host.className='post-pagination';list.insertAdjacentElement('afterend',host);}
    return host;
  }

  function renderPosts(rows){
    const postList=document.getElementById('postList');if(!postList)return;
    if(!rows.length){postList.innerHTML='<div class="post-empty">조건에 맞는 게시글이 없습니다.</div>';return;}
    postList.innerHTML=rows.map(post=>`<article class="post-card" onclick="openPostDetail(${Number(post.id)})"><div class="post-card-top"><span class="post-category">${esc(post.category||'')}</span><span class="post-business-type">${esc(post.business_type||'')}</span></div><h3 class="post-title">${esc(post.title||'')}</h3><p class="post-preview">${esc(post.content||'')}</p><div class="post-card-bottom"><span>${post.is_anonymous?'익명 사장님':'사장님'}</span><span>👁️ ${Number(post.view_count||0)}</span><span>${esc(typeof window.formatPostDate==='function'?window.formatPostDate(post.created_at):fallbackDate(post.created_at))}</span></div></article>`).join('');
  }

  function renderPagination(){
    const host=ensurePagination();if(!host)return;
    const totalPages=Math.max(1,Math.ceil(totalCount/PAGE_SIZE));
    if(totalCount<=PAGE_SIZE){host.innerHTML=totalCount?`<div class="post-pagination-info">총 ${totalCount}개의 이야기</div>`:'';return;}
    if(currentPage>totalPages)currentPage=totalPages;
    const start=Math.max(1,currentPage-2),end=Math.min(totalPages,start+4),adjustedStart=Math.max(1,end-4);
    let html=`<button type="button" onclick="goPostPage(${currentPage-1})" ${currentPage<=1?'disabled':''}>이전</button>`;
    for(let p=adjustedStart;p<=end;p++)html+=`<button type="button" class="${p===currentPage?'active':''}" onclick="goPostPage(${p})">${p}</button>`;
    html+=`<button type="button" onclick="goPostPage(${currentPage+1})" ${currentPage>=totalPages?'disabled':''}>다음</button>`;
    html+=`<div class="post-pagination-info">총 ${totalCount}개 · ${currentPage}/${totalPages} 페이지</div>`;
    host.innerHTML=html;
  }

  async function fetchPage(){
    const postList=document.getElementById('postList');if(!postList)return;
    const keyword=document.getElementById('postSearchInput')?.value.trim()||'';
    const category=document.getElementById('postSearchCategory')?.value||'';
    const businessType=document.getElementById('postSearchBusinessType')?.value||'';
    postList.innerHTML='<div class="post-loading">게시글을 불러오는 중입니다...</div>';
    const host=ensurePagination();if(host)host.innerHTML='';
    try{
      const from=(currentPage-1)*PAGE_SIZE,to=from+PAGE_SIZE-1;
      let q=supabaseClient.from('posts_public_safe').select('id,category,business_type,title,content,is_anonymous,view_count,created_at',{count:'exact'}).order('created_at',{ascending:false}).range(from,to);
      if(category)q=q.eq('category',category);
      if(businessType)q=q.eq('business_type',businessType);
      if(keyword){const k=keyword.replace(/[,%()]/g,' ').trim();if(k)q=q.or(`title.ilike.%${k}%,content.ilike.%${k}%`);}
      const {data,error,count}=await q;if(error)throw error;
      totalCount=Number(count||0);renderPosts(data||[]);renderPagination();
    }catch(e){console.error('게시글 페이지 조회 오류:',e);postList.innerHTML='<div class="post-empty">게시글을 불러오지 못했습니다.</div>';}
  }

  window.searchPosts=async function(){currentPage=1;return fetchPage();};
  window.loadPosts=async function(){currentPage=1;return fetchPage();};
  window.goPostPage=async function(page){
    const totalPages=Math.max(1,Math.ceil(totalCount/PAGE_SIZE));
    const next=Math.min(totalPages,Math.max(1,Number(page)||1));if(next===currentPage)return;
    currentPage=next;await fetchPage();
    const controls=document.querySelector('.post-sticky-controls');if(controls)controls.scrollIntoView({behavior:'smooth',block:'start'});
  };

  ensureStyles();
  ensureStickyControls();
  setTimeout(()=>{ensureStickyControls();updateFixedControls();},100);
  setTimeout(()=>{ensureStickyControls();updateFixedControls();},500);
  window.searchPosts();
})();
