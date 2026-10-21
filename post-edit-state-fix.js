/* ==================================================
   STEP 14 보완: 게시글 수정 상태 / 이모지 중복 정리
   - 다른 게시글 열기 전 기존 수정 상태 종료
   - 상세창 닫기 전 수정 상태 종료
   - 제목 이모지 래퍼/버튼 고아 DOM 제거
================================================== */
(function(){
  function hasActivePostEdit(){
    return !!(
      document.getElementById('inlinePostTitle') ||
      document.getElementById('inlinePostRichWrap') ||
      document.getElementById('inlinePostRichEditor')
    );
  }

  function cleanupOrphanEmojiRows(){
    document.querySelectorAll('.emoji-title-row').forEach(row=>{
      const input=row.querySelector('input');
      if(!input){
        row.remove();
        return;
      }

      // 제목 입력 하나당 이모지 버튼은 정확히 하나만 유지
      const buttons=[...row.querySelectorAll('.emoji-open-button')];
      buttons.slice(1).forEach(button=>button.remove());
    });

    // Quill 툴바에도 이모지 버튼 하나만 유지
    document.querySelectorAll('.ql-toolbar').forEach(toolbar=>{
      const buttons=[...toolbar.querySelectorAll('.emoji-body-button')];
      buttons.slice(1).forEach(button=>button.remove());
    });
  }

  function finishCurrentEdit(){
    if(hasActivePostEdit() && typeof window.cancelRichPostEdit==='function'){
      // 저장하지 않은 수정 내용은 버리고, 수정 중 새로 올린 이미지는 기존 정리 로직으로 삭제
      window.cancelRichPostEdit();
    }
    cleanupOrphanEmojiRows();
  }

  const previousOpenPostDetail=window.openPostDetail;
  if(typeof previousOpenPostDetail==='function'){
    window.openPostDetail=async function(postId){
      finishCurrentEdit();
      return await previousOpenPostDetail(postId);
    };
  }

  const previousClosePostDetail=window.closePostDetail;
  if(typeof previousClosePostDetail==='function'){
    window.closePostDetail=function(){
      finishCurrentEdit();
      return previousClosePostDetail();
    };
  }

  // 저장/취소 직후 동적 DOM 정리까지 한 번 더 보장
  const previousCancelRichPostEdit=window.cancelRichPostEdit;
  if(typeof previousCancelRichPostEdit==='function'){
    window.cancelRichPostEdit=function(skipCleanup){
      const titleInput=document.getElementById('inlinePostTitle');
      const titleRow=titleInput?.closest('.emoji-title-row')||null;
      const result=previousCancelRichPostEdit(skipCleanup);
      if(titleRow&&titleRow.isConnected)titleRow.remove();
      cleanupOrphanEmojiRows();
      return result;
    };
  }

  const observer=new MutationObserver(()=>cleanupOrphanEmojiRows());
  function start(){
    cleanupOrphanEmojiRows();
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
