/* ==================================================
   STEP 17: 독립 부트스트랩
   - DOMPurify 로드 여부와 무관하게 최종 운영문서/회원탈퇴/비로그인 UX 보정을 항상 로드
================================================== */
(function(){
  function loadOnce(id,src,onload){
    const existing=document.getElementById(id);
    if(existing){
      if(typeof onload==='function'){
        if(existing.dataset.ready==='1')onload();
        else existing.addEventListener('load',onload,{once:true});
      }
      return;
    }
    const s=document.createElement('script');
    s.id=id;
    s.src=src;
    s.onload=function(){s.dataset.ready='1';if(typeof onload==='function')onload();};
    document.body.appendChild(s);
  }

  loadOnce('stage17AccountDeleteCleanup','account-delete-storage-cleanup.js?v=20261022-4');
  loadOnce('stage17FinalLegalDocsV4','legal-ui-fix-v4.js?v=20261022-4');
  loadOnce('guestAuthUiFix','guest-auth-ui-fix.js?v=20261022-1');
})();
