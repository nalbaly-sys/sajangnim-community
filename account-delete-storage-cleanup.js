/* ==================================================
   STEP 17: 회원 탈퇴 시 Storage 이미지 정리
   - post-images/<user uuid>/ 파일을 먼저 삭제
   - 이미지 삭제 실패 시 계정 삭제를 중단하여 잔존 공개 이미지 방지
================================================== */
(function(){
  const BUCKET='post-images';

  async function removeOwnPostImages(userId){
    if(!userId)return;

    for(let round=0;round<100;round++){
      const {data,error}=await supabaseClient.storage
        .from(BUCKET)
        .list(userId,{limit:100,offset:0,sortBy:{column:'name',order:'asc'}});

      if(error)throw error;

      const rows=data||[];
      const files=rows.filter(item=>item&&item.name&&item.id).map(item=>userId+'/'+item.name);

      if(files.length){
        const {error:removeError}=await supabaseClient.storage.from(BUCKET).remove(files);
        if(removeError)throw removeError;
      }

      if(rows.length<100||files.length===0)break;
    }

    const {data:remaining,error:remainingError}=await supabaseClient.storage
      .from(BUCKET)
      .list(userId,{limit:1,offset:0});

    if(remainingError)throw remainingError;
    const remainingFiles=(remaining||[]).filter(item=>item&&item.name&&item.id);
    if(remainingFiles.length)throw new Error('게시글 이미지 일부가 아직 남아 있습니다.');
  }

  window.deleteMyAccount=async function(){
    if(!currentUser){if(typeof openLoginModal==='function')openLoginModal();return;}

    const phrase=prompt("회원 탈퇴를 진행하려면 '탈퇴'를 입력해주세요. 탈퇴 시 계정과 작성한 게시글·댓글·공감·신고 및 업로드한 게시글 이미지가 삭제되며 되돌릴 수 없습니다.");
    if(phrase!=='탈퇴')return;
    if(!confirm('정말 탈퇴하시겠습니까? 계정 및 관련 데이터 삭제를 진행합니다.'))return;

    const userId=currentUser.id;

    try{
      await removeOwnPostImages(userId);

      const {error}=await supabaseClient.rpc('delete_my_account');
      if(error)throw error;

      await supabaseClient.auth.signOut();
      currentUser=null;
      localStorage.removeItem('sajangnim_user');
      if(typeof closeMyPage==='function')closeMyPage();
      if(typeof updateUserUI==='function')updateUserUI();
      alert('회원 탈퇴가 완료되었습니다. 계정 및 관련 데이터와 업로드한 게시글 이미지가 삭제되었습니다.');
    }catch(error){
      console.error('회원 탈퇴/Storage 정리 오류:',error);
      alert('회원 탈퇴 처리 중 오류가 발생했습니다. 데이터가 남지 않도록 탈퇴를 중단했습니다. 잠시 후 다시 시도해주세요.');
    }
  };
})();
