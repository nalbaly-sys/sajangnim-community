/* ==================================================
   STEP 17: 리치 콘텐츠 렌더링 보안 강화
   - DOMPurify 기본 호출에도 게시글 전용 allowlist 적용
   - post-images 외부 이미지 제거
   - 링크 프로토콜 제한 + noopener/noreferrer/nofollow
   - 공개 이미지 민감정보 업로드 경고
================================================== */
(function(){
  /*
   * 중요: 최종 운영문서/회원탈퇴 Storage 정리는 DOMPurify와 무관한 기능이다.
   * 따라서 DOMPurify 존재 여부를 확인하기 전에 독립 부트스트랩을 먼저 로드한다.
   */
  if(!document.getElementById('stage17Bootstrap')){
    const bootstrap=document.createElement('script');
    bootstrap.id='stage17Bootstrap';
    bootstrap.src='stage17-bootstrap.js?v=20261022-4';
    document.body.appendChild(bootstrap);
  }

  const purify=window.DOMPurify;
  if(!purify||purify.__sajangnimStrictRender)return;

  const originalSanitize=purify.sanitize.bind(purify);
  const PUBLIC_PREFIX='https://djadqsfdrrihkswplzcn.supabase.co/storage/v1/object/public/post-images/';
  const ALLOWED_TAGS=['p','br','span','strong','em','u','s','h2','h3','blockquote','ol','ul','li','a','img'];
  const ALLOWED_ATTR=['href','target','rel','src','alt','title','class','style','loading','referrerpolicy'];
  const SAFE_CLASSES=new Set(['ql-size-small','ql-size-large','ql-size-huge','ql-align-center','ql-align-right','ql-align-justify']);

  function safeCssColor(value){
    const v=String(value||'').trim().toLowerCase();
    return /^#[0-9a-f]{3,8}$/.test(v)||/^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/.test(v);
  }

  function postProcess(html){
    const doc=new DOMParser().parseFromString('<div id="sajangnim-safe-root">'+String(html||'')+'</div>','text/html');
    const root=doc.getElementById('sajangnim-safe-root');
    if(!root)return '';

    root.querySelectorAll('*').forEach(el=>{
      const classes=String(el.getAttribute('class')||'').split(/\s+/).filter(c=>SAFE_CLASSES.has(c));
      if(classes.length)el.setAttribute('class',classes.join(' '));else el.removeAttribute('class');

      const sourceStyle=el.getAttribute('style')||'';
      el.removeAttribute('style');
      if(sourceStyle){
        const probe=document.createElement('span');
        probe.setAttribute('style',sourceStyle);
        const safe=[];
        if(probe.style.color&&safeCssColor(probe.style.color))safe.push('color:'+probe.style.color);
        if(probe.style.backgroundColor&&safeCssColor(probe.style.backgroundColor))safe.push('background-color:'+probe.style.backgroundColor);
        if(['left','center','right','justify'].includes(probe.style.textAlign))safe.push('text-align:'+probe.style.textAlign);
        if(['0.75em','1.5em','2.5em'].includes(probe.style.fontSize))safe.push('font-size:'+probe.style.fontSize);
        if(safe.length)el.setAttribute('style',safe.join(';'));
      }
    });

    root.querySelectorAll('img').forEach(img=>{
      const src=String(img.getAttribute('src')||'').trim();
      if(!src.startsWith(PUBLIC_PREFIX)){img.remove();return;}
      img.removeAttribute('width');
      img.removeAttribute('height');
      img.setAttribute('loading','lazy');
      img.setAttribute('referrerpolicy','no-referrer');
    });

    root.querySelectorAll('a').forEach(a=>{
      const href=String(a.getAttribute('href')||'').trim();
      if(!/^(https?:\/\/|mailto:)/i.test(href)){
        a.replaceWith(...a.childNodes);
        return;
      }
      a.setAttribute('target','_blank');
      a.setAttribute('rel','noopener noreferrer nofollow');
    });

    return root.innerHTML;
  }

  purify.sanitize=function(dirty,config){
    if(config)return originalSanitize(dirty,config);
    const clean=originalSanitize(String(dirty||''),{ALLOWED_TAGS,ALLOWED_ATTR});
    return postProcess(clean);
  };

  window.sanitizePostRichHtml=function(dirty){
    const clean=originalSanitize(String(dirty||''),{ALLOWED_TAGS,ALLOWED_ATTR});
    return postProcess(clean);
  };

  function applyImagePrivacyNotice(){
    document.querySelectorAll('.rich-post-upload-note').forEach(note=>{
      if(note.dataset.stage17Privacy==='1')return;
      note.dataset.stage17Privacy='1';
      note.textContent='📷 이미지: JPG · PNG · WEBP · GIF / 장당 최대 5MB · ⚠️ 공개 게시글 이미지는 공개 URL로 표시됩니다. 신분증·계좌번호·전화번호·주소·고객정보 등 민감정보가 포함된 이미지는 업로드하지 마세요.';
      note.style.lineHeight='1.6';
    });
  }

  applyImagePrivacyNotice();
  const observer=new MutationObserver(applyImagePrivacyNotice);
  observer.observe(document.body,{childList:true,subtree:true});

  purify.__sajangnimStrictRender=true;
})();
