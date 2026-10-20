/* 관리자 신고 댓글 확인 및 관리자 콘텐츠 상태 변경 보완 */
(function(){
  function esc(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
  function formatDate(value){if(!value)return "";const d=new Date(value);if(Number.isNaN(d.getTime()))return "";return d.toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"});}
  function reportStatusKo(status){const v=String(status||"").toUpperCase();if(v==="REJECTED")return "기각";if(v==="RESOLVED")return "처리완료";if(v==="PENDING")return "접수중";return v||"미확인";}
  function targetStatusKo(status){const v=String(status||"").toUpperCase();if(v==="ACTIVE")return "공개";if(v==="HIDDEN")return "숨김";if(v==="DELETED")return "삭제";return v||"미확인";}
  function reportOutcome(reportStatus,targetStatus){const target=String(targetStatus||"").toUpperCase();const report=String(reportStatus||"").toUpperCase();if(target==="HIDDEN")return "숨김";if(target==="DELETED")return "삭제";if(report==="REJECTED")return "기각";if(report==="RESOLVED")return "처리완료";if(report==="PENDING")return "접수중";return reportStatusKo(report);}
  function getAdminStatusLabel(status,isReported,reportStatus){const value=String(status||"").toUpperCase();if(isReported)return `<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글 (${esc(reportOutcome(reportStatus,value))})</strong>`;if(value==="DELETED")return '<strong data-admin-status-label="1" style="display:block;color:#6b7280;margin-bottom:8px">🗑️ 삭제된 댓글</strong>';if(value==="HIDDEN")return '<strong data-admin-status-label="1" style="display:block;color:#b91c1c;margin-bottom:8px">🚨 관리자에 의해 숨김 처리된 댓글</strong>';return '';}
  function applyStatusStyle(card,status,isReported){if(isReported)card.style.cssText="border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="DELETED")card.style.cssText="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="HIDDEN")card.style.cssText="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else card.style.cssText="border-radius:12px;padding:12px;margin:10px 0;";}
  function renderAdminCommentCard(c){const status=String(c.status||"").toUpperCase();return `<article class="admin-item"><div class="admin-item-head"><strong>댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</strong><span class="admin-status">${esc(targetStatusKo(status))}</span></div><p>${esc(c.content)}</p><small>작성자 ID: ${esc(c.user_id||"")} · ${esc(formatDate(c.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${esc(c.post_id)}')">원본 게시글 보기</button>${status==="ACTIVE"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','HIDDEN')">숨김</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="HIDDEN"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">다시 공개</button><button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','DELETED')">삭제 처리</button>`:status==="DELETED"?`<button type="button" onclick="setAdminContentStatus('comments','${esc(c.id)}','ACTIVE')">복구</button>`:""}</div></article>`;}

  function ensureAdminEnhancementStyles(){
    if(document.getElementById("adminEnhancementStyles"))return;
    const style=document.createElement("style");style.id="adminEnhancementStyles";
    style.textContent=`
      .admin-status[data-outcome="기각"],.admin-report-badge[data-state="REJECTED"]{background:#f3f4f6;color:#4b5563;border:1px solid #9ca3af;}
      .admin-status[data-outcome="숨김"],.admin-report-badge[data-state="HIDDEN"]{background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;}
      .admin-status[data-outcome="처리완료"],.admin-report-badge[data-state="RESOLVED"]{background:#dcfce7;color:#166534;border:1px solid #86efac;}
      .admin-status[data-outcome="접수중"],.admin-report-badge[data-state="PENDING"]{background:#fef3c7;color:#92400e;border:1px solid #fcd34d;}
      .admin-status[data-outcome="삭제"]{background:#e5e7eb;color:#374151;border:1px solid #9ca3af;}
      .admin-status,.admin-report-badge{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;line-height:1.2;}
      .admin-search-page{display:grid;gap:14px;width:100%;}
      .admin-search-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:14px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;}
      .admin-search-toolbar input{flex:1;min-width:240px;padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:15px;}
      .admin-search-toolbar button{padding:11px 16px;border:0;border-radius:10px;cursor:pointer;font-weight:800;}
      .admin-search-summary{font-size:13px;color:#6b7280;}
      .admin-search-group{border:1px solid #e5e7eb;border-radius:14px;background:#fff;overflow:hidden;}
      .admin-search-group>h3{margin:0;padding:12px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-size:15px;}
      .admin-search-result{padding:12px 14px;border-bottom:1px solid #f3f4f6;}
      .admin-search-result:last-child{border-bottom:0;}
      .admin-search-result-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;}
      .admin-search-result-title{font-weight:800;}
      .admin-search-snippet{margin:7px 0;color:#4b5563;line-height:1.6;word-break:break-word;}
      .admin-search-hit{color:#dc2626;font-weight:900;background:#fee2e2;border-radius:3px;padding:0 2px;}
      .admin-search-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;}
      .admin-search-actions button{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:7px 10px;cursor:pointer;font-weight:700;}
      .admin-search-empty{padding:18px;color:#6b7280;text-align:center;}
    `;
    document.head.appendChild(style);
  }

  function colorizeReportCard(card,rawReport,rawTarget){
    const statusEl=card.querySelector(".admin-status");if(statusEl){const outcome=reportOutcome(rawReport,rawTarget);statusEl.textContent=outcome;statusEl.dataset.outcome=outcome;}
    const head=card.querySelector(".admin-item-head");
    let badge=card.querySelector("[data-report-result-badge]");
    if(!badge&&head){badge=document.createElement("span");badge.setAttribute("data-report-result-badge","1");badge.className="admin-report-badge";head.appendChild(badge);}
    if(badge){badge.textContent="처리 상태: "+reportStatusKo(rawReport);badge.dataset.state=rawReport;}
  }

  /* 신고관리: 신고 처리상태와 실제 대상 조치상태를 분리해 표시 */
  const originalLoadAdminReports=window.loadAdminReports;
  window.loadAdminReports=async function(){
    ensureAdminEnhancementStyles();await originalLoadAdminReports();
    const box=document.getElementById("adminPanelContent");if(!box)return;
    box.querySelectorAll(".admin-item").forEach(card=>{
      const statusEl=card.querySelector(".admin-status");if(!statusEl)return;
      const rawReport=String(statusEl.dataset.rawStatus||statusEl.textContent||"").trim().toUpperCase();statusEl.dataset.rawStatus=rawReport;
      let rawTarget="";
      card.querySelectorAll("p").forEach(p=>{const text=p.textContent||"";const m=text.match(/대상 상태:\s*(ACTIVE|HIDDEN|DELETED|공개|숨김|삭제)/i);if(m){const v=String(m[1]).toUpperCase();rawTarget=v==="공개"?"ACTIVE":v==="숨김"?"HIDDEN":v==="삭제"?"DELETED":v;p.innerHTML=p.innerHTML.replace(/대상 상태:<\/b>\s*(ACTIVE|HIDDEN|DELETED)/i,(all,s)=>`대상 상태:</b> ${targetStatusKo(s)}`);}});
      colorizeReportCard(card,rawReport,rawTarget);
      card.querySelectorAll("button").forEach(btn=>{const code=btn.getAttribute("onclick")||"";let m=code.match(/adminViewReportedPost\('([^']+)'(?:,'[^']*')?\)/);if(m){btn.setAttribute("onclick",`adminViewReportedPost('${m[1]}','${rawReport}')`);return;}m=code.match(/adminViewComment\('([^']+)'(?:,'[^']*')?\)/);if(m){btn.setAttribute("onclick",`adminViewComment('${m[1]}','${rawReport}')`);}});
    });
  };

  const originalLoadComments=window.loadComments;
  window.loadComments=async function(postId){
    if(typeof isAdminUser!=="function"||!isAdminUser())return originalLoadComments(postId);
    const commentList=document.getElementById("commentList");if(!commentList)return;commentList.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
    try{const {data,error}=await supabaseClient.rpc("admin_list_post_comments",{p_post_id:Number(postId)});if(error)throw error;const rows=Array.isArray(data)?data:[];if(!rows.length){commentList.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';return;}
      commentList.innerHTML=rows.map(comment=>{const status=String(comment.status||"").toUpperCase();const isReported=adminReportedTargetType==="COMMENT"&&String(adminReportedTargetId)===String(comment.id);const author=comment.is_anonymous?"익명 사장님":"사장님";const reportStatus=isReported?(window.adminActiveReportStatus||""):"";const label=getAdminStatusLabel(status,isReported,reportStatus);let style="border-radius:12px;padding:12px;margin:10px 0;";if(isReported)style="border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="DELETED")style="border:2px dashed #6b7280;background:#f9fafb;border-radius:12px;padding:12px;margin:10px 0;";else if(status==="HIDDEN")style="border:2px dashed #b91c1c;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;";return `<div id="admin-reported-comment-${esc(comment.id)}" class="comment-item${isReported?" admin-reported-target":""}" style="${style}">${label}<div class="comment-header"><span class="comment-author">${esc(author)}</span><span class="comment-date">${esc(formatDate(comment.created_at))}</span></div><div class="comment-content">${esc(comment.content||"")}</div></div>`;}).join("");
    }catch(e){console.error("관리자 게시글 댓글 조회 오류:",e);return originalLoadComments(postId);}
  };

  window.adminViewComment=async function(id,reportStatus){if(typeof isAdminUser==="function"&&!isAdminUser())return;try{const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"COMMENT",p_target_id:Number(id)});if(error)throw error;if(!data)throw new Error("댓글을 찾을 수 없습니다.");window.adminActiveReportStatus=String(reportStatus||"").toUpperCase();adminReportedTargetType="COMMENT";adminReportedTargetId=String(id);const status=String(data.status||"").toUpperCase();if(typeof adminMessage==="function")adminMessage("신고 댓글 #"+id+" · "+reportOutcome(window.adminActiveReportStatus,status));if(data.post_id)await openPostDetail(data.post_id);const target=document.getElementById("admin-reported-comment-"+id);if(target){const old=target.querySelector("[data-admin-status-label]");if(old)old.remove();target.insertAdjacentHTML("afterbegin",getAdminStatusLabel(status,true,window.adminActiveReportStatus));applyStatusStyle(target,status,true);setTimeout(()=>target.scrollIntoView({behavior:"smooth",block:"center"}),100);}}catch(e){console.error("신고 댓글 확인 실패:",e);if(typeof adminMessage==="function")adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));}};

  window.adminViewReportedPost=async function(id,reportStatus){if(typeof isAdminUser==="function"&&!isAdminUser())return;try{const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:"POST",p_target_id:Number(id)});if(error)throw error;window.adminActiveReportStatus=String(reportStatus||"").toUpperCase();adminReportedTargetType="POST";adminReportedTargetId=String(id);await openPostDetail(id);const title=document.getElementById("detailTitle");if(title){const base=String(title.textContent||"").replace(/^🚨 신고 대상 게시글(?:\s*\([^)]*\))?\s*·\s*/,"");title.textContent=`🚨 신고 대상 게시글 (${reportOutcome(window.adminActiveReportStatus,data?.status)}) · ${base}`;}}catch(e){console.error("신고 게시글 확인 실패:",e);if(typeof adminMessage==="function")adminMessage("게시글 확인 실패: "+(e.message||"조회 오류"));}};

  window.loadAdminComments=async function(){if(typeof isAdminUser==="function"&&!isAdminUser())return;if(typeof adminMessage==="function")adminMessage("댓글을 불러오는 중입니다.");const box=document.getElementById("adminPanelContent");if(!box)return;try{const {data,error}=await supabaseClient.rpc("admin_list_comments");if(error)throw error;const rows=Array.isArray(data)?data:[];box.innerHTML=rows.length?rows.map(renderAdminCommentCard).join(""):'<p class="admin-empty">댓글이 없습니다.</p>';if(typeof adminMessage==="function")adminMessage("최근 댓글 최대 100건을 표시합니다. 숨김·삭제 댓글도 관리자에게 표시됩니다.");}catch(e){console.error("관리자 댓글 조회 오류:",e);box.innerHTML='<p class="admin-empty">댓글 조회에 실패했습니다.</p>';if(typeof adminMessage==="function")adminMessage(e.message||"조회 실패");}};

  window.setAdminContentStatus=async function(table,id,status){if(typeof isAdminUser==="function"&&!isAdminUser())return;if(!["ACTIVE","HIDDEN","DELETED"].includes(status)||!["posts","comments"].includes(table))return;const label=table==="posts"?"게시글":"댓글";if(!confirm(label+" 상태를 "+status+"로 변경할까요?"))return;try{const {data,error}=await supabaseClient.rpc("admin_set_report_target_status",{p_target_type:table==="posts"?"POST":"COMMENT",p_target_id:Number(id),p_status:status});if(error)throw error;if(data===null||data===undefined)throw new Error("수정된 행이 없습니다.");if(typeof adminMessage==="function")adminMessage("상태가 변경되었습니다.");if(table==="comments"){await window.loadAdminComments();}else{if(typeof loadAdminPosts==="function")await loadAdminPosts();if(typeof loadPosts==="function")await loadPosts();}if(typeof loadAdminDashboard==="function")await loadAdminDashboard();}catch(e){console.error("관리자 콘텐츠 상태 변경 실패:",e);if(typeof adminMessage==="function")adminMessage("상태 변경 실패: "+(e.message||"권한을 확인해주세요."));}};

  function highlightSnippet(text,query){
    const source=String(text||"");const q=String(query||"").trim();if(!q)return esc(source.slice(0,110));
    const lower=source.toLowerCase(),needle=q.toLowerCase(),idx=lower.indexOf(needle);if(idx<0)return esc(source.slice(0,110));
    const start=Math.max(0,idx-36),end=Math.min(source.length,idx+q.length+48);const before=source.slice(start,idx),hit=source.slice(idx,idx+q.length),after=source.slice(idx+q.length,end);
    return `${start>0?"…":""}${esc(before)}<span class="admin-search-hit">${esc(hit)}</span>${esc(after)}${end<source.length?"…":""}`;
  }
  function textMatches(value,query){return String(value||"").toLowerCase().includes(String(query||"").toLowerCase());}
  function mergeText(){return Array.from(arguments).filter(Boolean).join(" ");}

  function ensureAdminSearchTab(){
    ensureAdminEnhancementStyles();const nav=document.querySelector("#adminPanelSection .admin-tabs");if(!nav||nav.querySelector('[data-admin-tab="search"]'))return;
    const btn=document.createElement("button");btn.type="button";btn.dataset.adminTab="search";btn.textContent="🔎 통합 검색";btn.onclick=()=>window.switchAdminTab("search");nav.insertBefore(btn,nav.firstChild);
  }

  const originalOpenAdminPanel=window.openAdminPanel;
  window.openAdminPanel=function(){const result=originalOpenAdminPanel.apply(this,arguments);ensureAdminSearchTab();return result;};
  const originalEnsureAdminPanel=window.ensureAdminPanel;
  window.ensureAdminPanel=function(){const result=originalEnsureAdminPanel.apply(this,arguments);ensureAdminSearchTab();return result;};
  const originalSwitchAdminTab=window.switchAdminTab;
  window.switchAdminTab=function(tab){
    if(tab!=="search")return originalSwitchAdminTab(tab);
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    adminCurrentTab="search";document.querySelectorAll(".admin-tabs [data-admin-tab]").forEach(btn=>{const active=btn.dataset.adminTab==="search";btn.classList.toggle("active",active);btn.setAttribute("aria-current",active?"page":"false");});
    const detail=document.getElementById("adminMemberDetail");if(detail)detail.style.display="none";const box=document.getElementById("adminPanelContent");if(box)box.style.display="grid";window.loadAdminUnifiedSearch();
  };

  window.loadAdminUnifiedSearch=function(){
    ensureAdminSearchTab();const box=document.getElementById("adminPanelContent");if(!box)return;
    box.innerHTML=`<div class="admin-search-page"><div class="admin-search-toolbar"><input id="adminUnifiedSearchInput" type="search" placeholder="욕설, 비방 문구, 제목, 댓글, 닉네임, 업종 등을 검색"><button type="button" onclick="runAdminUnifiedSearch()">통합 검색</button><button type="button" onclick="clearAdminUnifiedSearch()">초기화</button></div><div id="adminUnifiedSearchSummary" class="admin-search-summary">검색어를 입력하면 신고·게시글·댓글·화원 목록을 함께 검색합니다.</div><div id="adminUnifiedSearchResults"></div></div>`;
    const input=document.getElementById("adminUnifiedSearchInput");if(input)input.addEventListener("keydown",e=>{if(e.key==="Enter")window.runAdminUnifiedSearch();});
    if(typeof adminMessage==="function")adminMessage("관리자 통합검색: 문제 문구를 입력하고 원문으로 바로 이동할 수 있습니다.");
  };

  window.clearAdminUnifiedSearch=function(){const input=document.getElementById("adminUnifiedSearchInput"),results=document.getElementById("adminUnifiedSearchResults"),summary=document.getElementById("adminUnifiedSearchSummary");if(input)input.value="";if(results)results.innerHTML="";if(summary)summary.textContent="검색어를 입력하면 신고·게시글·댓글·화원 목록을 함께 검색합니다.";};

  window.adminOpenSearchComment=async function(commentId,postId){adminReportedTargetType=null;adminReportedTargetId=null;await adminViewPost(postId);setTimeout(()=>{const el=document.getElementById("admin-reported-comment-"+commentId);if(el){el.style.outline="3px solid #dc2626";el.style.outlineOffset="2px";el.scrollIntoView({behavior:"smooth",block:"center"});}},120);};

  window.runAdminUnifiedSearch=async function(){
    if(typeof isAdminUser==="function"&&!isAdminUser())return;
    const input=document.getElementById("adminUnifiedSearchInput"),results=document.getElementById("adminUnifiedSearchResults"),summary=document.getElementById("adminUnifiedSearchSummary");if(!input||!results)return;
    const q=input.value.trim();if(q.length<1){results.innerHTML='<div class="admin-search-empty">검색어를 입력해주세요.</div>';return;}
    results.innerHTML='<div class="admin-search-empty">검색 중...</div>';if(summary)summary.textContent='"'+q+'" 검색 중...';
    try{
      const [reportsRes,postsRes,commentsRes,profilesRes]=await Promise.all([
        supabaseClient.from("reports").select("id,target_type,target_id,reporter_id,reason,detail,status,created_at").order("created_at",{ascending:false}).limit(500),
        supabaseClient.from("posts").select("id,user_id,title,content,category,business_type,status,created_at").order("created_at",{ascending:false}).limit(500),
        supabaseClient.rpc("admin_list_comments"),
        supabaseClient.from("profiles").select("id,nickname,business_type,introduction,role,status").order("nickname",{ascending:true}).limit(500)
      ]);
      if(reportsRes.error)throw reportsRes.error;if(postsRes.error)console.warn("통합검색 게시글 일부 조회 제한:",postsRes.error);if(commentsRes.error)throw commentsRes.error;if(profilesRes.error)throw profilesRes.error;
      const reports=reportsRes.data||[],posts=postsRes.data||[],comments=commentsRes.data||[],profiles=profilesRes.data||[];
      const reportTargetMap={};
      const uniqueTargets=[...new Map(reports.filter(r=>["POST","COMMENT"].includes(r.target_type)).map(r=>[r.target_type+":"+r.target_id,r])).values()];
      await Promise.all(uniqueTargets.map(async r=>{const {data,error}=await supabaseClient.rpc("admin_get_report_target",{p_target_type:r.target_type,p_target_id:Number(r.target_id)});if(!error&&data)reportTargetMap[r.target_type+":"+r.target_id]=data;}));
      const postMap=new Map(posts.map(p=>[String(p.id),p]));
      Object.entries(reportTargetMap).forEach(([key,data])=>{if(key.startsWith("POST:")&&!postMap.has(String(data.id)))postMap.set(String(data.id),data);});
      const allPosts=[...postMap.values()];
      const reportMatches=reports.filter(r=>{const t=reportTargetMap[r.target_type+":"+r.target_id]||{};return [r.reason,r.detail,r.target_id,t.title,t.content].some(v=>textMatches(v,q));});
      const postMatches=allPosts.filter(p=>[p.title,p.content,p.category,p.business_type,p.id].some(v=>textMatches(v,q)));
      const commentMatches=comments.filter(c=>[c.content,c.id,c.post_id].some(v=>textMatches(v,q)));
      const profileMatches=profiles.filter(p=>[p.nickname,p.business_type,p.introduction,p.id].some(v=>textMatches(v,q)));
      const section=(title,rows,renderer)=>`<section class="admin-search-group"><h3>${title} · ${rows.length}건</h3>${rows.length?rows.map(renderer).join(""):'<div class="admin-search-empty">검색 결과 없음</div>'}</section>`;
      const reportHtml=section("🚨 신고관리",reportMatches,r=>{const target=reportTargetMap[r.target_type+":"+r.target_id]||{};const hay=mergeText(r.reason,r.detail,target.title,target.content);const action=r.target_type==="COMMENT"?`adminViewComment('${esc(r.target_id)}','${esc(r.status)}')`:`adminViewReportedPost('${esc(r.target_id)}','${esc(r.status)}')`;return `<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">신고 #${esc(r.id)} · ${r.target_type==="COMMENT"?"댓글":"게시글"} · ${reportStatusKo(r.status)}</span></div><div class="admin-search-snippet">${highlightSnippet(hay,q)}</div><div class="admin-search-actions"><button type="button" onclick="${action}">원문으로 이동</button></div></article>`;});
      const postHtml=section("📝 게시글관리",postMatches,p=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">게시글 #${esc(p.id)} · ${esc(p.title||"제목 없음")}</span><span>${esc(targetStatusKo(p.status))}</span></div><div class="admin-search-snippet">${highlightSnippet(mergeText(p.title,p.content),q)}</div><div class="admin-search-actions"><button type="button" onclick="adminViewPost('${esc(p.id)}')">게시글 열기</button></div></article>`);
      const commentHtml=section("💬 댓글관리",commentMatches,c=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">댓글 #${esc(c.id)} · 게시글 #${esc(c.post_id)}</span><span>${esc(targetStatusKo(c.status))}</span></div><div class="admin-search-snippet">${highlightSnippet(c.content,q)}</div><div class="admin-search-actions"><button type="button" onclick="adminOpenSearchComment('${esc(c.id)}','${esc(c.post_id)}')">댓글 위치로 이동</button></div></article>`);
      const profileHtml=section("🌸 화원목록",profileMatches,p=>`<article class="admin-search-result"><div class="admin-search-result-head"><span class="admin-search-result-title">${esc(p.nickname||"닉네임 미설정")} · ${esc(p.business_type||"업종 미설정")}</span><span>${esc(p.status||"")}</span></div><div class="admin-search-snippet">${highlightSnippet(mergeText(p.nickname,p.business_type,p.introduction,p.id),q)}</div><div class="admin-search-actions"><button type="button" onclick="openAdminMemberDetail('${esc(p.id)}')">화원 정보 보기</button></div></article>`);
      results.innerHTML=reportHtml+postHtml+commentHtml+profileHtml;const total=reportMatches.length+postMatches.length+commentMatches.length+profileMatches.length;if(summary)summary.textContent='"'+q+'" 통합검색 결과 '+total+'건';
    }catch(e){console.error("관리자 통합검색 오류:",e);results.innerHTML='<div class="admin-search-empty">통합검색 중 오류가 발생했습니다: '+esc(e.message||"조회 실패")+'</div>';if(summary)summary.textContent="통합검색 실패";}
  };

  ensureAdminEnhancementStyles();
})();
