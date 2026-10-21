/* ==================================================
   STEP 15: 기본 SEO / 공유 메타
   STEP 16: AdSense 사이트 확인 메타
   - 기본 title / description / robots
   - Open Graph / Twitter(X) 카드
   - Vercel 운영 주소 canonical 고정
   - 게시글 상세 열기 시 문서 제목/설명 갱신
   - Google AdSense publisher meta 주입
================================================== */
(function(){
  const SITE_NAME='사장님도 퇴근합니다';
  const SITE_URL='https://sajangnim-community.vercel.app/';
  const ADSENSE_PUBLISHER_ID='ca-pub-4440430005819024';
  const DEFAULT_TITLE='사장님도 퇴근합니다 | 자영업 사장님 커뮤니티';
  const DEFAULT_DESCRIPTION='오늘도 장사하느라 고생하셨습니다. 자영업 사장님들의 현실 장사 이야기, 고민, 노하우와 웃픈 경험을 나누는 커뮤니티입니다.';

  function cleanText(value,max=160){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    if(text.length<=max)return text;
    return text.slice(0,Math.max(0,max-1)).trim()+'…';
  }

  function ensureMeta(selector,attrs){
    let el=document.head.querySelector(selector);
    if(!el){
      el=document.createElement('meta');
      Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
      document.head.appendChild(el);
    }
    return el;
  }

  function setMetaName(name,content){
    const el=ensureMeta(`meta[name="${name}"]`,{name});
    el.setAttribute('content',content);
  }

  function setMetaProperty(property,content){
    const el=ensureMeta(`meta[property="${property}"]`,{property});
    el.setAttribute('content',content);
  }

  function setCanonical(url){
    let link=document.head.querySelector('link[rel="canonical"]');
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);}
    link.href=url;
  }

  function isLocal(){
    return ['localhost','127.0.0.1','0.0.0.0'].includes(window.location.hostname);
  }

  function applySeo({title=DEFAULT_TITLE,description=DEFAULT_DESCRIPTION,type='website'}={}){
    const finalTitle=cleanText(title,70)||DEFAULT_TITLE;
    const finalDescription=cleanText(description,160)||DEFAULT_DESCRIPTION;

    document.title=finalTitle;
    setMetaName('description',finalDescription);
    setMetaName('robots','index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    setMetaName('theme-color','#ffffff');
    setMetaName('google-adsense-account',ADSENSE_PUBLISHER_ID);

    setMetaProperty('og:locale','ko_KR');
    setMetaProperty('og:site_name',SITE_NAME);
    setMetaProperty('og:type',type);
    setMetaProperty('og:title',finalTitle);
    setMetaProperty('og:description',finalDescription);
    setMetaProperty('og:url',SITE_URL);

    setMetaName('twitter:card','summary');
    setMetaName('twitter:title',finalTitle);
    setMetaName('twitter:description',finalDescription);

    // 로컬 개발 중에도 운영 canonical을 유지해 중복 URL 기준을 명확히 한다.
    setCanonical(SITE_URL);

    // 디버깅용: 로컬에서는 운영 주소를 canonical로 쓰되 실제 이동은 하지 않는다.
    if(isLocal())document.documentElement.dataset.seoEnvironment='local';
    else document.documentElement.dataset.seoEnvironment='production';
  }

  function applyHomeSeo(){
    applySeo({title:DEFAULT_TITLE,description:DEFAULT_DESCRIPTION,type:'website'});
  }

  function applyPostSeo(){
    const titleEl=document.getElementById('detailTitle');
    const contentEl=document.getElementById('detailContent');
    const postTitle=cleanText(titleEl?.textContent||'',55);
    if(!postTitle){applyHomeSeo();return;}
    const description=cleanText(contentEl?.textContent||DEFAULT_DESCRIPTION,155);
    applySeo({
      title:`${postTitle} | ${SITE_NAME}`,
      description,
      type:'article'
    });
  }

  applyHomeSeo();

  const previousOpenPostDetail=window.openPostDetail;
  if(typeof previousOpenPostDetail==='function'){
    window.openPostDetail=async function(...args){
      const result=await previousOpenPostDetail.apply(this,args);
      setTimeout(applyPostSeo,0);
      return result;
    };
  }

  const previousShowHome=window.showHome;
  if(typeof previousShowHome==='function'){
    window.showHome=function(...args){
      const result=previousShowHome.apply(this,args);
      applyHomeSeo();
      return result;
    };
  }

  const previousCloseModal=window.closeModal;
  if(typeof previousCloseModal==='function'){
    window.closeModal=function(id,...args){
      const result=previousCloseModal.call(this,id,...args);
      if(id==='postDetailModal')applyHomeSeo();
      return result;
    };
  }

  window.addEventListener('popstate',applyHomeSeo);
})();
