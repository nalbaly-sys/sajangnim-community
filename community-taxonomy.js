/* ==================================================
   COMMUNITY TAXONOMY v2
   - 업종 확대
   - 게시판 카테고리 재정리
   - 회원가입/마이페이지/글쓰기/검색 UI 공통 적용
   - 초기 구 카테고리 깜빡임 방지
================================================== */
(function(){
  const INDUSTRIES=[
    ['외식업','🍚 외식업'],
    ['배달업','🛵 배달업'],
    ['카페·베이커리·디저트','☕ 카페·베이커리·디저트'],
    ['주점·야간업','🍺 주점·야간업'],
    ['온라인판매·쇼핑몰','🛒 온라인판매·쇼핑몰'],
    ['무인매장','🤖 무인매장'],
    ['소매·편의점','🏪 소매·편의점'],
    ['의류·패션·잡화','👗 의류·패션·잡화'],
    ['꽃·선물·행사','🌸 꽃·선물·행사'],
    ['미용·뷰티','💇 미용·뷰티'],
    ['학원·교육','📚 학원·교육'],
    ['반려동물','🐶 반려동물'],
    ['숙박업','🏨 숙박업'],
    ['레저·오락','🎮 레저·오락'],
    ['운동·레슨','🏋️ 운동·레슨'],
    ['전문서비스·기술업','🔧 전문서비스·기술업'],
    ['제조업','🏭 제조업'],
    ['유통·도매','🚚 유통·도매'],
    ['스타트업·1인사업','🚀 스타트업·1인사업'],
    ['이동장사·푸드트럭','🚐 이동장사·푸드트럭'],
    ['해외사업','🌏 해외사업'],
    ['기타 업종','📦 기타 업종']
  ];

  const CATEGORIES=[
    ['자유게시판','🗣️ 자유게시판'],
    ['장사 노하우','💡 장사 노하우'],
    ['장사 현실','🧾 장사 현실'],
    ['예비 사장님','🙋 예비 사장님'],
    ['손님 이야기','😇 손님 이야기'],
    ['성공과 실패','📈 성공과 실패'],
    ['피해·주의보','🚨 피해·주의보'],
    ['직원·알바·노무','👥 직원·알바·노무'],
    ['지원사업·정책정보','🏛️ 지원사업·정책정보'],
    ['창업 아이디어','🎯 창업 아이디어'],
    ['밸런스 게임','⚖️ 밸런스 게임']
  ];

  const LEGACY_INDUSTRY_MAP={
    '꽃집':'꽃·선물·행사',
    '식당':'외식업',
    '카페':'카페·베이커리·디저트',
    '의류':'의류·패션·잡화',
    '미용':'미용·뷰티',
    '소매':'소매·편의점',
    '온라인':'온라인판매·쇼핑몰',
    '서비스':'전문서비스·기술업',
    '기타':'기타 업종'
  };

  const LEGACY_CATEGORY_MAP={
    '오늘의 고충':'장사 현실',
    '사장님 하소연':'장사 현실',
    '사장님 위로':'장사 현실',
    '웃픈 장사썰':'자유게시판'
  };

  function normalizeValue(value,map){return map[value]||value||'';}

  function setOptions(id,items,placeholder){
    const select=document.getElementById(id);
    if(!select)return;
    const current=normalizeValue(select.value,id.includes('Category')?LEGACY_CATEGORY_MAP:LEGACY_INDUSTRY_MAP);
    const first=placeholder?`<option value="">${placeholder}</option>`:'';
    select.innerHTML=first+items.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    if(current&&items.some(([value])=>value===current))select.value=current;
  }

  function revealCategoryGrid(){
    const prepaint=document.getElementById('taxonomyPrepaintStyle');
    if(prepaint)prepaint.remove();
    const grid=document.querySelector('.category-grid');
    if(grid)grid.style.visibility='visible';
  }

  function renderCategoryButtons(){
    const grid=document.querySelector('.category-grid');
    if(!grid)return;
    if(grid.dataset.taxonomyVersion==='2'){
      revealCategoryGrid();
      return;
    }
    grid.innerHTML='';
    CATEGORIES.forEach(([value,label])=>{
      const button=document.createElement('button');
      button.type='button';
      button.textContent=label;
      button.addEventListener('click',()=>{
        if(typeof window.filterByCategory==='function')window.filterByCategory(value);
      });
      grid.appendChild(button);
    });
    grid.dataset.taxonomyVersion='2';
    revealCategoryGrid();
  }

  function applyTaxonomy(){
    setOptions('signupBusinessType',INDUSTRIES,'업종을 선택하세요');
    setOptions('mypageBusinessType',INDUSTRIES,'업종을 선택하세요');
    setOptions('postBusinessType',INDUSTRIES,'업종을 선택하세요');
    setOptions('postSearchBusinessType',INDUSTRIES,'전체 업종');
    setOptions('postCategory',CATEGORIES,'');
    setOptions('postSearchCategory',CATEGORIES,'전체 카테고리');
    renderCategoryButtons();
  }

  window.COMMUNITY_TAXONOMY={INDUSTRIES,CATEGORIES,LEGACY_INDUSTRY_MAP,LEGACY_CATEGORY_MAP,apply:applyTaxonomy};

  const previousUpdateUserUI=window.updateUserUI;
  if(typeof previousUpdateUserUI==='function'){
    window.updateUserUI=function(){
      const result=previousUpdateUserUI.apply(this,arguments);
      applyTaxonomy();
      return result;
    };
  }

  const previousOpenPostModal=window.openPostModal;
  if(typeof previousOpenPostModal==='function'){
    window.openPostModal=function(){applyTaxonomy();return previousOpenPostModal.apply(this,arguments);};
  }

  const previousOpenMyPage=window.openMyPage;
  if(typeof previousOpenMyPage==='function'){
    window.openMyPage=function(){applyTaxonomy();return previousOpenMyPage.apply(this,arguments);};
  }

  applyTaxonomy();
  setTimeout(applyTaxonomy,100);
  setTimeout(applyTaxonomy,500);
})();
