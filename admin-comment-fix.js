/* 관리자 신고 댓글 확인 및 관리자 콘텐츠 상태 변경 보완 */
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

  function getAdminStatusLabel(status){
    const value=String(status||"").toUpperCase();
    if(value==="HIDDEN")return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 관리자에 의해 숨김 처리된 댓글</strong>';
    if(value==="DELETED")return '<strong data-admin-status-label="1" style="display:block;color:#6b7280;margin-bottom:8px">🗑️ 삭제된 댓글</strong>';
    return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글</strong>';
  }

  function applyStatusStyle(card,status){
    if(status==="DELETED")card.style.cssText="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";
    else if(status==="HIDDEN")card.style.cssText="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";
    else card.style.cssText="border:2px dashed #b45309;background:#fffbeb;border-radius:12px;padding:12px;margin:10px 0;";
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
      const status=String(data.status||"").toUpperCase();

      if(typeof adminMessage==="function")adminMessage("신고 댓글 #"+id+"을 게시글에서 확인합니다.");
      if(data.post_id)await openPostDetail(data.post_id);

      const list=document.getElementById("commentList");
      if(!list)return;

      let target=document.getElementById("admin-reported-comment-"+id);
      if(!target){
        target=document.createElement("div");
        target.id="admin-reported-comment-"+id;
        target.className="comment-item admin-reported-target";
        const author=data.is_anonymous===false?"사장님":"익명 사장님";
        const date=formatDate(data.created_at);
        target.innerHTML=getAdminStatusLabel(status)+
          '<div class="comment-header"><span class="comment-author">'+esc(author)+'</span><span class="comment-date">'+esc(date)+'</span></div>'+
          '<div class="comment-content">'+esc(data.content||"내용 없음")+'</div>';
        const empty=list.querySelector(".post-empty");
        if(empty)empty.remove();
        list.appendChild(target);
      }else{
        /* loadComments가 먼저 만든 DELETED/HIDDEN 카드도 RPC의 실제 상태로 다시 표시 */
        const oldLabels=target.querySelectorAll("strong");
        oldLabels.forEach(el=>{
          const text=el.textContent||"";
          if(text.includes("관리자 확인용 댓글")||text.includes("신고 대상 댓글")||text.includes("숨김 처리된 댓글")||text.includes("삭제된 댓글"))el.remove();
        });
        target.insertAdjacentHTML("afterbegin",getAdminStatusLabel(status));
      }
      applyStatusStyle(target,status);

      setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),100);
    }catch(e){
      console.error("신고 댓글 확인 실패:",e);
      if(typeof adminMessage==="function")adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));
    }
  };

  /* 기존 직접 PATCH는 comments/posts RLS에 막힐 수 있으므로 관리자 SECURITY DEFINER RPC 사용 */
  window.setAdminContentStatus=async function(table,id,status){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    if(!["ACTIVE","HIDDEN","DELETED"].includes(status)||!["posts","comments"].includes(table))return;
    const label=table==="posts"?"게시글":"댓글";
    if(!confirm(label+" 상태를 "+status+"로 변경할까요?"))return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_set_report_target_status",{
        p_target_type:table==="posts"?"POST":"COMMENT",
        p_target_id:Number(id),
        p_status:status
      });
      if(error)throw error;
      if(data===null||data===undefined)throw new Error("수정된 행이 없습니다.");
      if(typeof adminMessage==="function")adminMessage("상태가 변경되었습니다.");
      if(table==="posts"&&typeof loadAdminPosts==="function")await loadAdminPosts();
      if(table==="comments"&&typeof loadAdminComments==="function")await loadAdminComments();
      if(typeof loadAdminDashboard==="function")await loadAdminDashboard();
      if(table==="posts"&&typeof loadPosts==="function")await loadPosts();
    }catch(e){
      console.error("관리자 콘텐츠 상태 변경 실패:",e);
      if(typeof adminMessage==="function")adminMessage("상태 변경 실패: "+(e.message||"권한을 확인해주세요."));
    }
  };
})();
