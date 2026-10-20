/* 관리자 신고 댓글 확인 및 관리자 콘텐츠 상태 변경 보완 */
(function(){
  function esc(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
  function formatDate(value){if(!value)return "";const d=new Date(value);if(Number.isNaN(d.getTime()))return "";return d.toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"});}
  function getAdminStatusLabel(status,isReported){const value=String(status||"").toUpperCase();if(value==="DELETED")return '<strong data-admin-status-label="1" style="display:block;color:#6b7280;margin-bottom:8px">🗑️ 삭제된 댓글</strong>';if(value==="HIDDEN")return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 관리자에 의해 숨김 처리된 댓글</strong>';if(isReported)return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글</strong>';return '';}
  function applyStatusStyle(card,status,isReported){if(status==="DELETED")card.style.cssText="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="HIDDEN")card.style.cssText="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else if(isReported)card.style.cssText="border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else card.style.cssText="border-radius:12px;padding:12px;margin:10px 0;";}
  function renderAdminCommentCard(c){const status=String(c.status||"").toUpperCase();return `<article class="admin-item"><div class="admin-item-head"><strong>댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</strong><span class="admin-status">${esc(status)}</span></div><p>${esc(c.content)}</p><small>작성자 ID: ${esc(c.user_id||"")} · ${esc(formatDate(c.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${esc(c.post_id)}')">원본 게시글 보기</button>${status==="ACTIVE"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','HIDDEN')">숨김</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="HIDDEN"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">다시 공개</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="DELETED"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">복구</button>`:""}</div></article>`;}

  /* 일반회원용 기존 댓글 조회는 그대로 보존하고, 관리자일 때만 전용 RPC로 HIDDEN/DELETED까지 조회 */
  const originalLoadComments=window.loadComments;
  window.loadComments=async function(postId){
    if(typeof isAdminUser!=="function"||!isAdminUser())return originalLoadComments(postId);
    const commentList=document.getElementById("commentList");if(!commentList)return;
    commentList.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
    try{
      const {data,error}=await supabaseClient.rpc("admin_list_post_comments",{p_post_id:Number(postId)});if(error)throw error;
      const rows=Array.isArray(data)?data:[];
      if(!rows.length){commentList.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';return;}
      commentList.innerHTML=rows.map(comment=>{
        const status=String(comment.status||"").toUpperCase();
        const isReported=adminReportedTargetType==="COMMENT"&&String(adminReportedTargetId)===String(comment.id);
        const author=comment.is_anonymous?"익명 사장님":"사장님";
        const label=getAdminStatusLabel(status,isReported);
        let style="border-radius:12px;padding:12px;margin:10px 0;";
        if(status==="DELETED")style="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";
        else if(status==="HIDDEN")style="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";
        else if(isReported)style="border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";
        return `<div id="admin-reported-comment-${esc(comment.id)}" class="comment-item${isReported?" admin-reported-target":""}" style="${style}">${label}<div class="comment-header"><span class="comment-author">${esc(author)}</span><span class="comment-date">${esc(formatDate(comment.created_at))}</span></div><div class="comment-content">${esc(comment.content||"")}</div></div>`;
      }).join("");
    }catch(e){
      console.error("관리자 게시글 댓글 조회 오류:",e);
      /* RPC가 아직 없거나 실패하면 사이트 전체가 깨지지 않도록 기존 조회로 복귀 */
      return originalLoadComments(postId);
    }
  };

  /* 관리자 댓글관리는 SECURITY DEFINER RPC를 사용해 HIDDEN/DELETED도 새로고침 후 유지 */
  window.loadAdminComments=async function(){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    if(typeof adminMessage==="function")adminMessage("댓글을 불러오는 중입니다.");
    const box=document.getElementById("adminPanelContent");if(!box)return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_list_comments");if(error)throw error;
      const rows=Array.isArray(data)?data:[];
      box.innerHTML=rows.length?rows.map(renderAdminCommentCard).join(""):'<p class="admin-empty">댓글이 없습니다.</p>';
      if(typeof adminMessage==="function")adminMessage("최근 댓글 최대 100건을 표시합니다. 숨김·삭제 댓글도 관리자에게 표시됩니다.");
    }catch(e){console.error("관리자 댓글 조회 오류:",e);box.innerHTML='<p class="admin-empty">댓글 조회에 실패했습니다.</p>';if(typeof adminMessage==="function")adminMessage(e.message||"조회 실패");}
  };

  window.adminViewComment=async function(id){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"COMMENT",p_target_id:Number(id)});if(error)throw error;if(!data)throw new Error("댓글을 찾을 수 없습니다.");
      adminReportedTargetType="COMMENT";adminReportedTargetId=String(id);const status=String(data.status||"").toUpperCase();
      if(typeof adminMessage==="function")adminMessage("신고 댓글 #"+id+"을 게시글에서 확인합니다.");if(data.post_id)await openPostDetail(data.post_id);
      const target=document.getElementById("admin-reported-comment-"+id);if(target){applyStatusStyle(target,status,true);setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),100);}
    }catch(e){console.error("신고 댓글 확인 실패:",e);if(typeof adminMessage==="function")adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));}
  };

  window.setAdminContentStatus=async function(table,id,status){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;if(!["ACTIVE","HIDDEN","DELETED"].includes(status)||!["posts","comments"].includes(table))return;
    const label=table==="posts"?"게시글":"댓글";if(!confirm(label+" 상태를 "+status+"로 변경할까요?"))return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_set_report_target_status",{p_target_type:table==="posts"?"POST":"COMMENT",p_target_id:Number(id),p_status:status});if(error)throw error;if(data===null||data===undefined)throw new Error("수정된 행이 없습니다.");
      if(typeof adminMessage==="function")adminMessage("상태가 변경되었습니다.");
      if(table==="comments"){await window.loadAdminComments();}else{if(typeof loadAdminPosts==="function")await loadAdminPosts();if(typeof loadPosts==="function")await loadPosts();}
      if(typeof loadAdminDashboard==="function")await loadAdminDashboard();
    }catch(e){console.error("관리자 콘텐츠 상태 변경 실패:",e);if(typeof adminMessage==="function")adminMessage("상태 변경 실패: "+(e.message||"권한을 확인해주세요."));}
  };
})();
