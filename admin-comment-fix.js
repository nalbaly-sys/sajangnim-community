/* 관리자 신고 댓글 확인 및 관리자 콘텐츠 상태 변경 보완 */
(function(){
  function esc(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
  function formatDate(value){if(!value)return "";const d=new Date(value);if(Number.isNaN(d.getTime()))return "";return d.toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"});}
  function getAdminStatusLabel(status){const value=String(status||"").toUpperCase();if(value==="HIDDEN")return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 관리자에 의해 숨김 처리된 댓글</strong>';if(value==="DELETED")return '<strong data-admin-status-label="1" style="display:block;color:#6b7280;margin-bottom:8px">🗑️ 삭제된 댓글</strong>';return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글</strong>';}
  function applyStatusStyle(card,status){if(status==="DELETED")card.style.cssText="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="HIDDEN")card.style.cssText="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else card.style.cssText="border:2px dashed #b45309;background:#fffbeb;border-radius:12px;padding:12px;margin:10px 0;";}
  function renderAdminCommentCard(c){const status=String(c.status||"").toUpperCase();return `<article class="admin-item"><div class="admin-item-head"><strong>댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</strong><span class="admin-status">${esc(status)}</span></div><p>${esc(c.content)}</p><small>작성자 ID: ${esc(c.user_id||"")} · ${esc(formatDate(c.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${esc(c.post_id)}')">원본 게시글 보기</button>${status==="ACTIVE"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','HIDDEN')">숨김</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="HIDDEN"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">다시 공개</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="DELETED"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">복구</button>`:""}</div></article>`;}

  window.adminViewComment=async function(id){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"COMMENT",p_target_id:Number(id)});if(error)throw error;if(!data)throw new Error("댓글을 찾을 수 없습니다.");
      adminReportedTargetType="COMMENT";adminReportedTargetId=String(id);const status=String(data.status||"").toUpperCase();
      if(typeof adminMessage==="function")adminMessage("신고 댓글 #"+id+"을 게시글에서 확인합니다.");if(data.post_id)await openPostDetail(data.post_id);
      const list=document.getElementById("commentList");if(!list)return;
      let target=document.getElementById("admin-reported-comment-"+id);
      if(!target){target=document.createElement("div");target.id="admin-reported-comment-"+id;target.className="comment-item admin-reported-target";const empty=list.querySelector(".post-empty");if(empty)empty.remove();list.appendChild(target);}
      const author=data.is_anonymous===false?"사장님":"익명 사장님";const date=formatDate(data.created_at);
      /* 기존 openPostDetail이 만든 🔒 문구를 포함해 카드 내용을 RPC 실제 상태 기준으로 완전히 교체 */
      target.innerHTML=getAdminStatusLabel(status)+'<div class="comment-header"><span class="comment-author">'+esc(author)+'</span><span class="comment-date">'+esc(date)+'</span></div>'+'<div class="comment-content">'+esc(data.content||"내용 없음")+'</div>';
      applyStatusStyle(target,status);setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),100);
    }catch(e){console.error("신고 댓글 확인 실패:",e);if(typeof adminMessage==="function")adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));}
  };

  /* RLS 때문에 숨김/삭제 댓글이 일반 SELECT에서 사라지므로 관리자 댓글 목록은 RPC로 상태 변경 직후 해당 카드를 유지한다. */
  window.setAdminContentStatus=async function(table,id,status){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;if(!["ACTIVE","HIDDEN","DELETED"].includes(status)||!["posts","comments"].includes(table))return;
    const label=table==="posts"?"게시글":"댓글";if(!confirm(label+" 상태를 "+status+"로 변경할까요?"))return;
    try{
      const {data,error}=await supabaseClient.rpc("admin_set_report_target_status",{p_target_type:table==="posts"?"POST":"COMMENT",p_target_id:Number(id),p_status:status});if(error)throw error;if(data===null||data===undefined)throw new Error("수정된 행이 없습니다.");
      if(typeof adminMessage==="function")adminMessage("상태가 변경되었습니다.");
      if(table==="comments"){
        const box=document.getElementById("adminPanelContent");
        if(status==="ACTIVE"){if(typeof loadAdminComments==="function")await loadAdminComments();}
        else{
          const {data:comment,error:readError}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"COMMENT",p_target_id:Number(id)});if(readError)throw readError;
          const cards=box?Array.from(box.querySelectorAll(".admin-item")):[];const card=cards.find(el=>(el.querySelector("strong")?.textContent||"").startsWith("댓글 #"+id+" "));
          if(card&&comment){const wrap=document.createElement("div");wrap.innerHTML=renderAdminCommentCard(comment);card.replaceWith(wrap.firstElementChild);}
          else if(typeof loadAdminComments==="function")await loadAdminComments();
        }
      }else{if(typeof loadAdminPosts==="function")await loadAdminPosts();if(typeof loadPosts==="function")await loadPosts();}
      if(typeof loadAdminDashboard==="function")await loadAdminDashboard();
    }catch(e){console.error("관리자 콘텐츠 상태 변경 실패:",e);if(typeof adminMessage==="function")adminMessage("상태 변경 실패: "+(e.message||"권한을 확인해주세요."));}
  };
})();
