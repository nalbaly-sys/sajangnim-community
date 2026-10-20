/* 관리자 신고 댓글 확인 보완 */
(function(){
  function esc(value){
    return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function formatDate(value){
    if(!value)return "";
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return "";
    return d.toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"});
  }

  window.adminViewComment=async function(id){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_get_report_target",{
        p_target_type:"COMMENT",
        p_target_id:Number(id)
      });
      if(error)throw error;
      if(!data)throw new Error("댓글을 찾을 수 없습니다.");

      adminReportedTargetType="COMMENT";
      adminReportedTargetId=String(id);

      if(typeof adminMessage==="function")adminMessage("신고 댓글 #"+id+"을 게시글에서 확인합니다.");
      if(data.post_id)await openPostDetail(data.post_id);

      const list=document.getElementById("commentList");
      if(!list)return;

      let target=document.getElementById("admin-reported-comment-"+id);
      if(!target){
        const card=document.createElement("div");
        card.id="admin-reported-comment-"+id;
        card.className="comment-item admin-reported-target";
        card.style.cssText="border:2px dashed #b45309;background:#fffbeb;border-radius:12px;padding:12px;margin:10px 0;";
        const hidden=String(data.status||"")!=="ACTIVE";
        const author=data.is_anonymous===false?"사장님":"익명 사장님";
        const date=formatDate(data.created_at);
        card.innerHTML=(hidden?'<strong style="display:block;color:#92400e;margin-bottom:8px">🔒 관리자 확인용 댓글 (숨김 처리됨)</strong>':'<strong style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글</strong>')+
          '<div class="comment-header"><span class="comment-author">'+esc(author)+'</span><span class="comment-date">'+esc(date)+'</span></div>'+
          '<div class="comment-content">'+esc(data.content||"내용 없음")+'</div>';
        const empty=list.querySelector(".post-empty");
        if(empty)empty.remove();
        list.appendChild(card);
        target=card;
      }

      setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),100);
    }catch(e){
      console.error("신고 댓글 확인 실패:",e);
      if(typeof adminMessage==="function")adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));
    }
  };
})();
