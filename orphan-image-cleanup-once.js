/* ==================================================
   2026-10-22 알려진 고아 게시글 이미지 1회 정리
   - 관리자 본인 폴더의 기존 미사용 PNG 3개만 삭제
   - 성공 후 localStorage 플래그로 재실행 방지
================================================== */
(function(){
  const OWNER_ID='79e20328-966e-4401-9361-ec78a1f7b521';
  const FLAG='orphan_images_cleanup_20261022_done';
  const PATHS=[
    '79e20328-966e-4401-9361-ec78a1f7b521/1792554785175-7f3822a8-204f-4a9d-9eaf-d06afbfee8c9.png',
    '79e20328-966e-4401-9361-ec78a1f7b521/1792554798965-8202a29e-7fbd-4f87-b342-256b276289f0.png',
    '79e20328-966e-4401-9361-ec78a1f7b521/1792566572901-004df4da-f048-4559-bdf4-5d9fa6f4cd7f.png'
  ];
  let running=false;

  async function cleanup(){
    if(running||localStorage.getItem(FLAG)==='1')return;
    if(!window.currentUser||currentUser.id!==OWNER_ID)return;
    if(!window.supabaseClient?.storage)return;
    running=true;
    try{
      const {error}=await supabaseClient.storage.from('post-images').remove(PATHS);
      if(error)throw error;
      localStorage.setItem(FLAG,'1');
      console.info('기존 고아 게시글 이미지 정리 완료');
    }catch(e){
      console.warn('기존 고아 게시글 이미지 정리 실패:',e);
    }finally{
      running=false;
    }
  }

  const prevUpdate=window.updateUserUI;
  if(typeof prevUpdate==='function'){
    window.updateUserUI=function(){
      const result=prevUpdate.apply(this,arguments);
      Promise.resolve().then(cleanup);
      return result;
    };
  }

  setTimeout(cleanup,0);
  setTimeout(cleanup,800);
})();
