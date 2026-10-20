/* 게시글 상세 수정 후 상세창만 갱신 — 조회수 중복 증가 방지 */
(function(){
  window.editCurrentPostFromDetail=async function(){
    if(!currentUser||!currentPostId)return;
    const id=currentPostId;
    await editMyPostFromPage(id);
    if(!currentPostId||Number(currentPostId)!==Number(id))return;
    try{
      const {data,error}=await supabaseClient.from('posts').select('id,title,content,status').eq('id',id).eq('user_id',currentUser.id).maybeSingle();
      if(error||!data||data.status!=='ACTIVE')return;
      const title=document.getElementById('detailTitle');
      const content=document.getElementById('detailContent');
      if(title)title.textContent=data.title||'';
      if(content)content.textContent=data.content||'';
    }catch(error){
      console.warn('수정 후 상세 화면 갱신 실패:',error);
    }
  };
})();
