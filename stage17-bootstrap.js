/* ==================================================
   STEP 17+: 독립 부트스트랩
   - DOMPurify 로드 여부와 무관하게 운영문서/회원탈퇴/비로그인 UX/분류체계/피드/모바일 UX/투표 보정을 항상 로드
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
  loadOnce('guestAuthUiFix','guest-auth-ui-fix.js?v=20261022-2');
  loadOnce('communityTaxonomy','community-taxonomy.js?v=20261022-2',function(){
    loadOnce('postFeedImprovements','post-feed-improvements.js?v=20261022-2',function(){
      loadOnce('mobileUxPolish','mobile-ux-polish.js?v=20261022-2',function(){
        loadOnce('communityDensityPolish','community-density-polish.js?v=20261022-2',function(){
          loadOnce('postPollFeature','poll-feature.js?v=20261022-2',function(){
            loadOnce('postPollFeatureFixV2','poll-feature-fix-v2.js?v=20261023-1',function(){
              loadOnce('pollCalendarEnhancer','poll-calendar-enhancer.js?v=20261023-1');
            });
          });
        });
      });
    });
  });
  loadOnce('commentVisualPolish','comment-visual-polish.js?v=20261023-1');
  loadOnce('commentAnonymousReplyFix','comment-anonymous-reply-fix.js?v=20261023-1',function(){
    loadOnce('commentReplyAnonymityV2','comment-reply-anonymity-v2.js?v=20261023-1',function(){
      loadOnce('commentNicknameDisplayFix','comment-nickname-display-fix.js?v=20261023-1');
    });
  });
  loadOnce('operatingCenterCleanup','operating-center-cleanup.js?v=20261022-1');
  loadOnce('orphanImageCleanupOnce','orphan-image-cleanup-once.js?v=20261022-2');
})();
