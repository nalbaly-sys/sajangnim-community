/* 관리자 신고 댓글 확인 및 관리자 콘텐츠 상태 변경 보완 */
(function(){
  function esc(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
  function formatDate(value){if(!value)return "";const d=new Date(value);if(Number.isNaN(d.getTime()))return "";return d.toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"});}
  function reportStatusKo(status){const v=String(status||"").toUpperCase();if(v==="REJECTED")return "기각";if(v==="RESOLVED")return "처리완료";if(v==="PENDING")return "접수중";return v||"미확인";}
  function targetStatusKo(status){const v=String(status||"").toUpperCase();if(v==="ACTIVE")return "공개";if(v==="HIDDEN")return "숨김";if(v==="DELETED")return "삭제";return v||"미확인";}
  function reportOutcome(reportStatus,targetStatus){const target=String(targetStatus||"").toUpperCase();const report=String(reportStatus||"").toUpperCase();if(target==="HIDDEN")return "숨김";if(report==="REJECTED")return "기각";if(report==="RESOLVED")return "처리완료";if(report==="PENDING")return "접수중";if(target==="DELETED")return "삭제";return reportStatusKo(report);}
  function getAdminStatusLabel(status,isReported,reportStatus){const value=String(status||"").toUpperCase();if(isReported)return `<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글 (${esc(reportOutcome(reportStatus,value))})</strong>`;if(value==="DELETED")return '<strong data-admin-status-label="1" style="display:block;color:#6b7280;margin-bottom:8px">🗑️ 삭제된 댓글</strong>';if(value==="HIDDEN")return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 관리자에 의해 숨김 처리된 댓글</strong>';return '';}
  function applyStatusStyle(card,status,isReported){if(isReported)card.style.cssText="border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="DELETED")card.style.cssText="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="HIDDEN")card.style.cssText="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else card.style.cssText="border-radius:12px;padding:12px;margin:10px 0;";}
  function renderAdminCommentCard(c){const status=String(c.status||"").toUpperCase();return `<article class="admin-item"><div class="admin-item-head"><strong>댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</strong><span class="admin-status">${esc(targetStatusKo(status))}</span></div><p>${esc(c.content)}</p><small>작성자 ID: ${esc(c.user_id||"")} · ${esc(formatDate(c.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${esc(c.post_id)}')">원본 게시글 보기</button>${status==="ACTIVE"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','HIDDEN')">숨김</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="HIDDEN"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">다시 공개</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="DELETED"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">복구</button>`:""}</div></article>`;}

  /* 신고관리: PENDING/REJECTED/RESOLVED를 한글로 표시하고, 어떤 신고 카드에서 상세를 열었는지 상태를 함께 전달 */
  const originalLoadAdminReports=window.loadAdminReports;
  window.loadAdminReports=async function(){
    await originalLoadAdminReports();
    const box=document.getElementById("adminPanelContent");if(!box)return;
    box.querySelectorAll(".admin-item").forEach(card=>{
      const statusEl=card.querySelector(".admin-status");if(!statusEl)return;
      const raw=String(statusEl.dataset.rawStatus||statusEl.textContent||"").trim().toUpperCase();
      statusEl.dataset.rawStatus=raw;statusEl.textContent=reportStatusKo(raw);
      const head=card.querySelector(".admin-item-head");
      if(head&&!card.querySelector("[data-report-result-badge]")){const badge=document.createElement("span");badge.setAttribute("data-report-result-badge","1");badge.style.cssText="display:inline-block;margin-left:8px;font-size:12px;font-weight:700;color:#374151;";badge.textContent="처리 상태: "+reportStatusKo(raw);head.appendChild(badge);}
      card.querySelectorAll("button").forEach(btn=>{
        const code=btn.getAttribute("onclick")||"";
        let m=code.match(/adminViewReportedPost\('([^']+)'\)/);if(m){btn.setAttribute("onclick",`adminViewReportedPost('${m[1]}','${raw}')`);return;}
        m=code.match(/adminViewComment\('([^']+)'\)/);if(m){btn.setAttribute("onclick",`adminViewComment('${m[1]}','${raw}')`);}
      });
      card.querySelectorAll("p").forEach(p=>{if((p.textContent||"").includes("대상 상태:")){p.innerHTML=p.innerHTML.replace(/대상 상태:<\/b>\s*(ACTIVE|HIDDEN|DELETED)/i,(all,s)=>`대상 상태:</b> ${targetStatusKo(s)}`);}});
    });
  };

  /* 일반회원용 기존 댓글 조회는 그대로 보존하고, 관리자일 때만 전용 RPC로 HIDDEN/DELETED까지 조회 */
  const originalLoadComments=window.loadComments;
  window.loadComments=async function(postId){
    if(typeof isAdminUser!=="function"||!isAdminUser())return originalLoadComments(postId);
    const commentList=document.getElementById("commentList");if(!commentList)return;
    commentList.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
    try{
      const {data,error}=await supabaseClient.rpc("admin_list_post_comments",{p_post_id:Number(postId)});if(error)throw error;
      const rows=Array.isArray(data)?data:[];if(!rows.length){commentList.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';return;}
      commentList.innerHTML=rows.map(comment=>{
        const status=String(comment.status||"").toUpperCase();const isReported=adminReportedTargetType==="COMMENT"&&String(adminReportedTargetId)===String(comment.id);const author=comment.is_anonymous?"익명 사장님":"사장님";
        const reportStatus=isReported?(window.adminActiveReportStatus||""):"";const label=getAdminStatusLabel(status,isReported,reportStatus);let style="border-radius:12px;padding:12px;margin:10px 0;";
        if(isReported)style="border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="DELETED")style="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="HIDDEN")style="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";
        return `<div id="admin-reported-comment-${esc(comment.id)}" class="comment-item${isReported?" admin-reported-target":""}" style="${style}">${label}<div class="comment-header"><span class="comment-author">${esc(author)}</span><span class="comment-date">${esc(formatDate(comment.created_at))}</span></div><div class="comment-content">${esc(comment.content||"")}</div></div>`;
      }).join("");
    }catch(e){console.error("관리자 게시글 댓글 조회 오류:",e);return originalLoadComments(postId);}
  };

  window.adminViewComment=async function(id,reportStatus){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"COMMENT",p_target_id:Number(id)});if(error)throw error;if(!data)throw new Error("댓글을 찾을 수 없습니다.");
      window.adminActiveReportStatus=String(reportStatus||"").toUpperCase();adminReportedTargetType="COMMENT";adminReportedTargetId=String(id);const status=String(data.status||"").toUpperCase();
      if(typeof adminMessage==="function")adminMessage("신고 댓글 #"+id+" · "+reportOutcome(window.adminActiveReportStatus,status));if(data.post_id)await openPostDetail(data.post_id);
      const target=document.getElementById("admin-reported-comment-"+id);if(target){const old=target.querySelector("[data-admin-status-label]");if(old)old.remove();target.insertAdjacentHTML("afterbegin",getAdminStatusLabel(status,true,window.adminActiveReportStatus));applyStatusStyle(target,status,true);setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),100);}
    }catch(e){console.error("신고 댓글 확인 실패:",e);if(typeof adminMessage==="function")adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));}
  };

  window.adminViewReportedPost=async function(id,reportStatus){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"POST",p_target_id:Number(id)});if(error)throw error;
      window.adminActiveReportStatus=String(reportStatus||"").toUpperCase();adminReportedTargetType="POST";adminReportedTargetId=String(id);await openPostDetail(id);
      const title=document.getElementById("detailTitle");if(title){const base=String(title.textContent||"").replace(/^🚨 신고 대상 게시글(?:\s*\([^)]*\))?\s*·\s*/,"");title.textContent=`🚨 신고 대상 게시글 (${reportOutcome(window.adminActiveReportStatus,data?.status)}) · ${base}`;}
    }catch(e){console.error("신고 게시글 확인 실패:",e);if(typeof adminMessage==="function")adminMessage("게시글 확인 실패: "+(e.message||"조회 오류"));}
  };

  /* 관리자 댓글관리는 SECURITY DEFINER RPC를 사용해 HIDDEN/DELETED도 새로고침 후 유지 */
  window.loadAdminComments=async function(){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;if(typeof adminMessage==="function")adminMessage("댓글을 불러오는 중입니다.");const box=document.getElementById("adminPanelContent");if(!box)return;
    try{const {data,error}=await supabaseClient.rpc("admin_list_comments");if(error)throw error;const rows=Array.isArray(data)?data:[];box.innerHTML=rows.length?rows.map(renderAdminCommentCard).join(""):'<p class="admin-empty">댓글이 없습니다.</p>';if(typeof adminMessage==="function")adminMessage("최근 댓글 최대 100건을 표시합니다. 숨김·삭제 댓글도 관리자에게 표시됩니다.");}
    catch(e){console.error("관리자 댓글 조회 오류:",e);box.innerHTML='<p class="admin-empty">댓글 조회에 실패했습니다.</p>';if(typeof adminMessage==="function")adminMessage(e.message||"조회 실패");}
  };

  window.setAdminContentStatus=async function(table,id,status){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;if(!["ACTIVE","HIDDEN","DELETED"].includes(status)||!["posts","comments"].includes(table))return;const label=table==="posts"?"게시글":"댓글";if(!confirm(label+" 상태를 "+status+"로 변경할까요?"))return;
    try{const {data,error}=await supabaseClient.rpc("admin_set_report_target_status",{p_target_type:table==="posts"?"POST":"COMMENT",p_target_id:Number(id),p_status:status});if(error)throw error;if(data===null||data===undefined)throw new Error("수정된 행이 없습니다.");if(typeof adminMessage==="function")adminMessage("상태가 변경되었습니다.");if(table==="comments"){await window.loadAdminComments();}else{if(typeof loadAdminPosts==="function")await loadAdminPosts();if(typeof loadPosts==="function")await loadPosts();}if(typeof loadAdminDashboard==="function")await loadAdminDashboard();}
    catch(e){console.error("관리자 콘텐츠 상태 변경 실패:",e);if(typeof adminMessage==="function")adminMessage("상태 변경 실패: "+(e.message||"권한을 확인해주세요."));}
  };
})();
