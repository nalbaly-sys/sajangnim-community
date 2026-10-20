/* 12단계 2차: 관리자 공지/이벤트 CRUD */
(function(){
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function date(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}
  function isoFromLocal(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString();}
  function localValue(v){if(!v)return '';const d=new Date(v);if(Number.isNaN(d.getTime()))return '';const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16);}

  function ensureStyles(){
    if(document.getElementById('adminOperatingStyles'))return;
    const s=document.createElement('style');s.id='adminOperatingStyles';s.textContent=`
      .admin-operating-page{display:grid;gap:14px;width:100%}.admin-operating-form,.admin-operating-list{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px}.admin-operating-form h3,.admin-operating-list h3{margin:0 0 12px}.admin-operating-form label{display:grid;gap:6px;margin:10px 0;font-weight:700;font-size:13px}.admin-operating-form input,.admin-operating-form textarea,.admin-operating-form select{width:100%;padding:10px 11px;border:1px solid #d1d5db;border-radius:9px;background:#fff;font:inherit}.admin-operating-form textarea{min-height:130px;resize:vertical}.admin-operating-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.admin-operating-check{display:flex!important;grid-template-columns:none!important;align-items:center;gap:8px!important}.admin-operating-check input{width:auto}.admin-operating-actions,.admin-operating-item-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.admin-operating-actions button,.admin-operating-item-actions button{padding:8px 11px;border:1px solid #d1d5db;border-radius:8px;background:#fff;font-weight:800}.admin-operating-actions .primary{background:#111827;color:#fff;border-color:#111827}.admin-operating-item{padding:13px 0;border-bottom:1px solid #f3f4f6}.admin-operating-item:last-child{border-bottom:0}.admin-operating-item-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.admin-operating-item p{color:#4b5563;line-height:1.55}.admin-operating-status{display:inline-flex;padding:3px 8px;border-radius:999px;background:#f3f4f6;font-size:11px;font-weight:800}.admin-operating-status.published{background:#dcfce7;color:#166534}.admin-operating-status.ended,.admin-operating-status.archived{background:#e5e7eb;color:#4b5563}.admin-operating-status.draft{background:#fef3c7;color:#92400e}.admin-operating-error{color:#b91c1c;font-size:13px;margin-top:8px}@media(max-width:700px){.admin-operating-row{grid-template-columns:1fr}}
    `;document.head.appendChild(s);
  }

  function ensureTabs(){
    const nav=document.querySelector('#adminPanelSection .admin-tabs');
    if(!nav)return;
    if(!nav.querySelector('[data-admin-tab="notices"]')){
      const b=document.createElement('button');b.type='button';b.dataset.adminTab='notices';b.textContent='📢 공지 관리';b.onclick=()=>window.adminOperatingOpen('notices');nav.appendChild(b);
    }
    if(!nav.querySelector('[data-admin-tab="events"]')){
      const b=document.createElement('button');b.type='button';b.dataset.adminTab='events';b.textContent='🎉 이벤트 관리';b.onclick=()=>window.adminOperatingOpen('events');nav.appendChild(b);
    }
  }

  function setActive(tab){document.querySelectorAll('.admin-tabs [data-admin-tab]').forEach(btn=>{const active=btn.dataset.adminTab===tab;btn.classList.toggle('active',active);btn.setAttribute('aria-current',active?'page':'false');});}

  window.adminOperatingOpen=function(type){
    if(typeof isAdminUser==='function'&&!isAdminUser())return;
    ensureStyles();ensureTabs();setActive(type);
    const detail=document.getElementById('adminMemberDetail');if(detail)detail.style.display='none';
    const box=document.getElementById('adminPanelContent');if(box)box.style.display='grid';
    if(type==='notices')window.loadAdminNotices();else window.loadAdminEvents();
  };

  function noticeForm(row){return `<div class="admin-operating-form"><h3>${row?'공지 수정':'새 공지 작성'}</h3><input type="hidden" id="noticeEditId" value="${row?esc(row.id):''}"><label>제목<input id="noticeTitle" maxlength="150" value="${row?esc(row.title):''}" placeholder="공지 제목"></label><label>내용<textarea id="noticeContent" maxlength="10000" placeholder="공지 내용">${row?esc(row.content):''}</textarea></label><div class="admin-operating-row"><label>상태<select id="noticeStatus"><option value="DRAFT" ${row?.status==='DRAFT'?'selected':''}>임시저장</option><option value="PUBLISHED" ${!row||row?.status==='PUBLISHED'?'selected':''}>공개</option><option value="ARCHIVED" ${row?.status==='ARCHIVED'?'selected':''}>보관</option></select></label><label class="admin-operating-check"><input id="noticePinned" type="checkbox" ${row?.is_pinned?'checked':''}>상단 고정</label></div><div class="admin-operating-actions"><button class="primary" type="button" onclick="saveAdminNotice()">${row?'수정 저장':'공지 등록'}</button>${row?'<button type="button" onclick="loadAdminNotices()">취소</button>':''}</div><div id="noticeFormError" class="admin-operating-error"></div></div>`;}

  function eventForm(row){return `<div class="admin-operating-form"><h3>${row?'이벤트 수정':'새 이벤트 작성'}</h3><input type="hidden" id="eventEditId" value="${row?esc(row.id):''}"><label>제목<input id="eventTitle" maxlength="150" value="${row?esc(row.title):''}" placeholder="이벤트 제목"></label><label>내용<textarea id="eventContent" maxlength="10000" placeholder="이벤트 내용">${row?esc(row.content):''}</textarea></label><div class="admin-operating-row"><label>시작일<input id="eventStartsAt" type="datetime-local" value="${row?localValue(row.starts_at):''}"></label><label>종료일<input id="eventEndsAt" type="datetime-local" value="${row?localValue(row.ends_at):''}"></label></div><label>상태<select id="eventStatus"><option value="DRAFT" ${row?.status==='DRAFT'?'selected':''}>임시저장</option><option value="PUBLISHED" ${!row||row?.status==='PUBLISHED'?'selected':''}>공개</option><option value="ENDED" ${row?.status==='ENDED'?'selected':''}>종료</option><option value="ARCHIVED" ${row?.status==='ARCHIVED'?'selected':''}>보관</option></select></label><div class="admin-operating-actions"><button class="primary" type="button" onclick="saveAdminEvent()">${row?'수정 저장':'이벤트 등록'}</button>${row?'<button type="button" onclick="loadAdminEvents()">취소</button>':''}</div><div id="eventFormError" class="admin-operating-error"></div></div>`;}

  function statusLabel(v){return v==='PUBLISHED'?'공개':v==='DRAFT'?'임시저장':v==='ENDED'?'종료':'보관';}

  async function fetchNotices(){const {data,error}=await supabaseClient.from('notices').select('*').order('is_pinned',{ascending:false}).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function fetchEvents(){const {data,error}=await supabaseClient.from('events').select('*').order('created_at',{ascending:false});if(error)throw error;return data||[];}

  window.loadAdminNotices=async function(){
    ensureTabs();const box=document.getElementById('adminPanelContent');if(!box)return;if(typeof adminMessage==='function')adminMessage('공지 목록을 불러오는 중입니다.');
    try{const rows=await fetchNotices();box.innerHTML=`<div class="admin-operating-page">${noticeForm(null)}<div class="admin-operating-list"><h3>공지 목록 · ${rows.length}건</h3>${rows.length?rows.map(r=>`<article class="admin-operating-item"><div class="admin-operating-item-head"><strong>${r.is_pinned?'📌 ':''}${esc(r.title)}</strong><span class="admin-operating-status ${String(r.status).toLowerCase()}">${statusLabel(r.status)}</span></div><small>${date(r.updated_at||r.created_at)}</small><p>${esc(r.content)}</p><div class="admin-operating-item-actions"><button onclick="editAdminNotice(${Number(r.id)})">수정</button><button onclick="toggleAdminNoticePinned(${Number(r.id)},${r.is_pinned?'false':'true'})">${r.is_pinned?'고정 해제':'상단 고정'}</button><button onclick="deleteAdminNotice(${Number(r.id)})">삭제</button></div></article>`).join(''):'<p>등록된 공지가 없습니다.</p>'}</div></div>`;if(typeof adminMessage==='function')adminMessage('공개/임시저장/보관과 상단 고정을 관리할 수 있습니다.');}
    catch(e){console.error('공지 관리자 조회 오류:',e);box.innerHTML='<p class="admin-empty">공지 DB를 불러오지 못했습니다. supabase-step12-operating-content.sql 실행 여부를 확인해주세요.</p>';if(typeof adminMessage==='function')adminMessage(e.message||'공지 조회 실패');}
  };

  window.loadAdminEvents=async function(){
    ensureTabs();const box=document.getElementById('adminPanelContent');if(!box)return;if(typeof adminMessage==='function')adminMessage('이벤트 목록을 불러오는 중입니다.');
    try{const rows=await fetchEvents();box.innerHTML=`<div class="admin-operating-page">${eventForm(null)}<div class="admin-operating-list"><h3>이벤트 목록 · ${rows.length}건</h3>${rows.length?rows.map(r=>`<article class="admin-operating-item"><div class="admin-operating-item-head"><strong>${esc(r.title)}</strong><span class="admin-operating-status ${String(r.status).toLowerCase()}">${statusLabel(r.status)}</span></div><small>${r.starts_at?date(r.starts_at):'시작일 미정'}${r.ends_at?' ~ '+date(r.ends_at):''}</small><p>${esc(r.content)}</p><div class="admin-operating-item-actions"><button onclick="editAdminEvent(${Number(r.id)})">수정</button>${r.status==='PUBLISHED'?`<button onclick="endAdminEvent(${Number(r.id)})">종료 처리</button>`:''}<button onclick="deleteAdminEvent(${Number(r.id)})">삭제</button></div></article>`).join(''):'<p>등록된 이벤트가 없습니다.</p>'}</div></div>`;if(typeof adminMessage==='function')adminMessage('이벤트 공개/종료/보관 상태와 기간을 관리할 수 있습니다.');}
    catch(e){console.error('이벤트 관리자 조회 오류:',e);box.innerHTML='<p class="admin-empty">이벤트 DB를 불러오지 못했습니다. supabase-step12-operating-content.sql 실행 여부를 확인해주세요.</p>';if(typeof adminMessage==='function')adminMessage(e.message||'이벤트 조회 실패');}
  };

  window.saveAdminNotice=async function(){
    const id=(document.getElementById('noticeEditId')?.value||'').trim();const title=(document.getElementById('noticeTitle')?.value||'').trim();const content=(document.getElementById('noticeContent')?.value||'').trim();const status=document.getElementById('noticeStatus')?.value||'DRAFT';const is_pinned=!!document.getElementById('noticePinned')?.checked;const err=document.getElementById('noticeFormError');if(title.length<2||content.length<2){if(err)err.textContent='제목과 내용을 입력해주세요.';return;}
    try{const payload={title,content,status,is_pinned,updated_at:new Date().toISOString()};if(status==='PUBLISHED')payload.published_at=new Date().toISOString();let q;if(id){q=supabaseClient.from('notices').update(payload).eq('id',Number(id));}else{payload.created_by=currentUser.id;q=supabaseClient.from('notices').insert(payload);}const {error}=await q;if(error)throw error;await window.loadAdminNotices();if(typeof refreshPublicOperatingContent==='function')await refreshPublicOperatingContent();}
    catch(e){console.error('공지 저장 오류:',e);if(err)err.textContent=e.message||'공지 저장에 실패했습니다.';}
  };

  window.editAdminNotice=async function(id){try{const {data,error}=await supabaseClient.from('notices').select('*').eq('id',id).maybeSingle();if(error)throw error;const box=document.getElementById('adminPanelContent');if(box)box.innerHTML=`<div class="admin-operating-page">${noticeForm(data)}</div>`;}catch(e){alert('공지 정보를 불러오지 못했습니다.');}};
  window.toggleAdminNoticePinned=async function(id,value){const {error}=await supabaseClient.from('notices').update({is_pinned:!!value,updated_at:new Date().toISOString()}).eq('id',id);if(error){alert('상단 고정 변경에 실패했습니다.');return;}await window.loadAdminNotices();if(typeof refreshPublicOperatingContent==='function')await refreshPublicOperatingContent();};
  window.deleteAdminNotice=async function(id){if(!confirm('이 공지를 삭제할까요?'))return;const {error}=await supabaseClient.from('notices').delete().eq('id',id);if(error){alert('공지 삭제에 실패했습니다.');return;}await window.loadAdminNotices();if(typeof refreshPublicOperatingContent==='function')await refreshPublicOperatingContent();};

  window.saveAdminEvent=async function(){
    const id=(document.getElementById('eventEditId')?.value||'').trim();const title=(document.getElementById('eventTitle')?.value||'').trim();const content=(document.getElementById('eventContent')?.value||'').trim();const status=document.getElementById('eventStatus')?.value||'DRAFT';const starts_at=isoFromLocal(document.getElementById('eventStartsAt')?.value||'');const ends_at=isoFromLocal(document.getElementById('eventEndsAt')?.value||'');const err=document.getElementById('eventFormError');if(title.length<2||content.length<2){if(err)err.textContent='제목과 내용을 입력해주세요.';return;}if(starts_at&&ends_at&&new Date(ends_at)<new Date(starts_at)){if(err)err.textContent='종료일은 시작일보다 빠를 수 없습니다.';return;}
    try{const payload={title,content,status,starts_at,ends_at,updated_at:new Date().toISOString()};if(status==='PUBLISHED')payload.published_at=new Date().toISOString();let q;if(id){q=supabaseClient.from('events').update(payload).eq('id',Number(id));}else{payload.created_by=currentUser.id;q=supabaseClient.from('events').insert(payload);}const {error}=await q;if(error)throw error;await window.loadAdminEvents();if(typeof refreshPublicOperatingContent==='function')await refreshPublicOperatingContent();}
    catch(e){console.error('이벤트 저장 오류:',e);if(err)err.textContent=e.message||'이벤트 저장에 실패했습니다.';}
  };

  window.editAdminEvent=async function(id){try{const {data,error}=await supabaseClient.from('events').select('*').eq('id',id).maybeSingle();if(error)throw error;const box=document.getElementById('adminPanelContent');if(box)box.innerHTML=`<div class="admin-operating-page">${eventForm(data)}</div>`;}catch(e){alert('이벤트 정보를 불러오지 못했습니다.');}};
  window.endAdminEvent=async function(id){const {error}=await supabaseClient.from('events').update({status:'ENDED',updated_at:new Date().toISOString()}).eq('id',id);if(error){alert('이벤트 종료 처리에 실패했습니다.');return;}await window.loadAdminEvents();if(typeof refreshPublicOperatingContent==='function')await refreshPublicOperatingContent();};
  window.deleteAdminEvent=async function(id){if(!confirm('이 이벤트를 삭제할까요?'))return;const {error}=await supabaseClient.from('events').delete().eq('id',id);if(error){alert('이벤트 삭제에 실패했습니다.');return;}await window.loadAdminEvents();if(typeof refreshPublicOperatingContent==='function')await refreshPublicOperatingContent();};

  const observer=new MutationObserver(()=>ensureTabs());observer.observe(document.body,{childList:true,subtree:true});
  ensureStyles();ensureTabs();
})();
