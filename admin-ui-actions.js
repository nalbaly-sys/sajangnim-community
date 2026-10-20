/* 관리자 상태 한글화 + 원문 즉시 조치 UI */
(function(){
  function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
  function contentStatusKo(v){v=String(v||"").toUpperCase();return v==="ACTIVE"?"공개":v==="HIDDEN"?"숨김":v==="DELETED"?"삭제":v||"미확인";}
  function memberStatusKo(v){v=String(v||"").toUpperCase();return v==="ACTIVE"?"정상":v==="SUSPENDED"?"정지":v==="BLOCKED"?"차단":v==="INACTIVE"?"비활성":v||"미확인";}
  function roleKo(v){v=String(v||"").toUpperCase();return v==="ADMIN"?"관리자":v==="MODERATOR"?"운영자":v==="USER"?"일반회원":v||"미확인";}
  function statusClass(v){v=String(v||"").toUpperCase();return v==="ACTIVE"?"is-active":v==="HIDDEN"?"is-hidden":v==="DELETED"?"is-deleted":v==="SUSPENDED"||v==="BLOCKED"?"is-blocked":"is-neutral";}

  function ensureStyles(){
    if(document.getElementById("adminUiActionStyles"))return;
    const s=document.createElement("style");s.id="adminUiActionStyles";
    s.textContent=`
      .admin-status.is-active{background:#dcfce7!important;color:#166534!important;border:1px solid #86efac!important;}
      .admin-status.is-hidden{background:#fee2e2!important;color:#b91c1c!important;border:1px solid #fca5a5!important;}
      .admin-status.is-deleted{background:#e5e7eb!important;color:#374151!important;border:1px solid #9ca3af!important;}
      .admin-status.is-blocked{background:#fef3c7!important;color:#92400e!important;border:1px solid #fcd34d!important;}
      .admin-status.is-neutral{background:#f3f4f6!important;color:#4b5563!important;border:1px solid #d1d5db!important;}
      .admin-member-role-status{display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px;font-weight:800;}
      .admin-member-role-status .role{background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;border-radius:999px;padding:4px 8px;}
      .admin-member-role-status .state{border-radius:999px;padding:4px 8px;}
      .admin-member-role-status .state.is-active{background:#dcfce7;color:#166534;border:1px solid #86efac;}
      .admin-member-role-status .state.is-blocked{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;}
      .admin-member-role-status .state.is-neutral{background:#f3f4f6;color:#4b5563;border:1px solid #d1d5db;}
      .admin-inline-actions{margin:12px 0;padding:12px;border:1px solid #fecaca;background:#fff7f7;border-radius:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
      .admin-inline-actions strong{margin-right:4px;color:#991b1b;}
      .admin-inline-actions .admin-inline-state{font-size:12px;font-weight:900;border-radius:999px;padding:5px 9px;}
      .admin-inline-actions button{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:8px 11px;font-weight:800;cursor:pointer;}
      .admin-inline-actions button.danger{border-color:#fca5a5;color:#b91c1c;background:#fff1f2;}
      .admin-inline-actions button.restore{border-color:#86efac;color:#166534;background:#f0fdf4;}
      .admin-comment-manage-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;}
      .admin-comment-manage-actions button{border:1px solid #d1d5db;background:#fff;border-radius:7px;padding:6px 9px;font-size:12px;font-weight:800;cursor:pointer;}
    `;document.head.appendChild(s);
  }

  function paintContentStatus(el,raw){if(!el)return;const v=String(raw||el.dataset.rawStatus||el.textContent||"").trim().toUpperCase();el.dataset.rawStatus=v;el.textContent=contentStatusKo(v);el.classList.remove("is-active","is-hidden","is-deleted","is-blocked","is-neutral");el.classList.add(statusClass(v));}

  const originalLoadAdminPosts=window.loadAdminPosts;
  if(typeof originalLoadAdminPosts==="function")window.loadAdminPosts=async function(){
    const r=await originalLoadAdminPosts.apply(this,arguments);ensureStyles();
    document.querySelectorAll("#adminPanelContent .admin-item .admin-status").forEach(el=>paintContentStatus(el));return r;
  };

  const originalLoadAdminComments=window.loadAdminComments;
  if(typeof originalLoadAdminComments==="function")window.loadAdminComments=async function(){
    const r=await originalLoadAdminComments.apply(this,arguments);ensureStyles();
    document.querySelectorAll("#adminPanelContent .admin-item .admin-status").forEach(el=>{
      const text=String(el.textContent||"").trim();const raw=text==="공개"?"ACTIVE":text==="숨김"?"HIDDEN":text==="삭제"?"DELETED":text;paintContentStatus(el,raw);
    });return r;
  };

  const originalLoadAdminMembers=window.loadAdminMembers;
  if(typeof originalLoadAdminMembers==="function")window.loadAdminMembers=async function(){
    const r=await originalLoadAdminMembers.apply(this,arguments);ensureStyles();
    document.querySelectorAll("#adminMemberList .admin-member-card .admin-status").forEach(el=>{
      const raw=String(el.dataset.rawMember||el.textContent||"").trim();el.dataset.rawMember=raw;
      const parts=raw.split("·").map(x=>x.trim());const role=(parts[0]||"").toUpperCase(),state=(parts[1]||"").toUpperCase();
      el.className="admin-member-role-status";el.innerHTML=`<span class="role">역할: ${esc(roleKo(role))}</span><span class="state ${statusClass(state)}">상태: ${esc(memberStatusKo(state))}</span>`;
    });return r;
  };

  const originalOpenAdminMemberDetail=window.openAdminMemberDetail;
  if(typeof originalOpenAdminMemberDetail==="function")window.openAdminMemberDetail=async function(){
    const r=await originalOpenAdminMemberDetail.apply(this,arguments);const box=document.getElementById("adminMemberDetail");if(!box)return r;
    box.querySelectorAll(".admin-status").forEach(el=>{const t=String(el.textContent||"").trim();if(["ACTIVE","HIDDEN","DELETED"].includes(t.toUpperCase()))paintContentStatus(el,t);});
    box.querySelectorAll("p,small,span,strong").forEach(el=>{if(el.children.length)return;let t=el.textContent||"";t=t.replace(/역할:\s*ADMIN\b/g,"역할: 관리자").replace(/역할:\s*MODERATOR\b/g,"역할: 운영자").replace(/역할:\s*USER\b/g,"역할: 일반회원").replace(/상태:\s*ACTIVE\b/g,"상태: 정상").replace(/상태:\s*SUSPENDED\b/g,"상태: 정지").replace(/상태:\s*BLOCKED\b/g,"상태: 차단");el.textContent=t;});return r;
  };

  async function fetchAdminTarget(type,id){const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:type,p_target_id:Number(id)});if(error)throw error;return data;}

  window.refreshAdminPostActionBar=async function(postId){
    if(typeof isAdminUser!=="function"||!isAdminUser()||!postId)return;
    try{
      const data=await fetchAdminTarget("POST",postId);if(!data)return;const host=document.getElementById("detailTitle")?.parentElement||document.querySelector("#postDetailModal .post-detail-content");if(!host)return;
      let bar=document.getElementById("adminPostInlineActions");if(!bar){bar=document.createElement("div");bar.id="adminPostInlineActions";bar.className="admin-inline-actions";const title=document.getElementById("detailTitle");if(title&&title.parentNode)title.parentNode.insertBefore(bar,title.nextSibling);else host.prepend(bar);}
      const st=String(data.status||"").toUpperCase();
      bar.innerHTML=`<strong>🛡️ 관리자 조치</strong><span class="admin-inline-state admin-status ${statusClass(st)}">${esc(contentStatusKo(st))}</span>${st==="ACTIVE"?`<button type="button" class="danger" onclick="adminInlineSetStatus('posts','${esc(postId)}','HIDDEN')">숨김</button><button type="button" class="danger" onclick="adminInlineSetStatus('posts','${esc(postId)}','DELETED')">삭제 처리</button>`:st==="HIDDEN"?`<button type="button" class="restore" onclick="adminInlineSetStatus('posts','${esc(postId)}','ACTIVE')">다시 공개</button><button type="button" class="danger" onclick="adminInlineSetStatus('posts','${esc(postId)}','DELETED')">삭제 처리</button>`:`<button type="button" class="restore" onclick="adminInlineSetStatus('posts','${esc(postId)}','ACTIVE')">복구</button>`}`;
    }catch(e){console.warn("관리자 게시글 조치바 표시 실패:",e);}
  };

  window.adminInlineSetStatus=async function(table,id,status){
    await window.setAdminContentStatus(table,id,status);
    if(table==="posts")await window.refreshAdminPostActionBar(id);
    if(table==="comments"&&currentPostId)await window.loadComments(currentPostId);
  };

  const originalOpenPostDetail=window.openPostDetail;
  if(typeof originalOpenPostDetail==="function")window.openPostDetail=async function(postId){const r=await originalOpenPostDetail.apply(this,arguments);if(typeof isAdminUser==="function"&&isAdminUser())await window.refreshAdminPostActionBar(postId);return r;};

  const previousLoadComments=window.loadComments;
  if(typeof previousLoadComments==="function")window.loadComments=async function(postId){
    const r=await previousLoadComments.apply(this,arguments);if(typeof isAdminUser!=="function"||!isAdminUser())return r;
    document.querySelectorAll("#commentList .comment-item[id^='admin-reported-comment-']").forEach(card=>{
      const id=card.id.replace("admin-reported-comment-","");if(card.querySelector(".admin-comment-manage-actions"))return;
      let status="ACTIVE";if((card.textContent||"").includes("삭제된 댓글"))status="DELETED";else if((card.textContent||"").includes("숨김"))status="HIDDEN";
      const actions=document.createElement("div");actions.className="admin-comment-manage-actions";
      actions.innerHTML=status==="ACTIVE"?`<button onclick="adminInlineSetStatus('comments','${esc(id)}','HIDDEN')">🛡️ 숨김</button><button onclick="adminInlineSetStatus('comments','${esc(id)}','DELETED')">🗑️ 삭제 처리</button>`:status==="HIDDEN"?`<button onclick="adminInlineSetStatus('comments','${esc(id)}','ACTIVE')">↩️ 다시 공개</button><button onclick="adminInlineSetStatus('comments','${esc(id)}','DELETED')">🗑️ 삭제 처리</button>`:`<button onclick="adminInlineSetStatus('comments','${esc(id)}','ACTIVE')">↩️ 복구</button>`;
      card.appendChild(actions);
    });return r;
  };

  ensureStyles();
})();
