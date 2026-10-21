/* ==================================================
   STEP 15: 기본 SEO / 공유 메타
   - 기본 title / description / robots
   - Open Graph / Twitter(X) 카드
   - 운영 도메인에서는 canonical 자동 생성
   - 게시글 상세 열기 시 문서 제목/설명 갱신
================================================== */
(function(){
  const SITE_NAME='사장님도 퇴근합니다';
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

  function productionCanonical(){
    try{
      const {protocol,hostname,origin,pathname}=window.location;
      if(!/^https?:$/.test(protocol))return '';
      if(['localhost','127.0.0.1','0.0.0.0'].includes(hostname))return '';
      return origin+(pathname||'/');
    }catch(_){return '';}
  }

  function setCanonical(url){
    let link=document.head.querySelector('link[rel="canonical"]');
    if(!url){link?.remove();return;}
    if(!link){link=document.createElement('link');link.rel='canonical';document.head.appendChild(link);}
    link.href=url;
  }

  function applySeo({title=DEFAULT_TITLE,description=DEFAULT_DESCRIPTION,type='website'}={}){
    const finalTitle=cleanText(title,70)||DEFAULT_TITLE;
    const finalDescription=cleanText(description,160)||DEFAULT_DESCRIPTION;
    const canonical=productionCanonical();

    document.title=finalTitle;
    setMetaName('description',finalDescription);
    setMetaName('robots','index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1');
    setMetaName('theme-color','#ffffff');

    setMetaProperty('og:locale','ko_KR');
    setMetaProperty('og:site_name',SITE_NAME);
    setMetaProperty('og:type',type);
    setMetaProperty('og:title',finalTitle);
    setMetaProperty('og:description',finalDescription);
    if(canonical)setMetaProperty('og:url',canonical);

    setMetaName('twitter:card','summary');
    setMetaName('twitter:title',finalTitle);
    setMetaName('twitter:description',finalDescription);

    setCanonical(canonical);
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
