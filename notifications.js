/* ==================================================
   STEP 13: 알림 UI
   - 내 글 댓글/대댓글/공감 알림
   - 읽음/안읽음, 배지, 목록
   - 클릭 시 관련 게시글/댓글 이동
================================================== */
(function(){
  const POLL_MS=30000;
  let lastUserId=null;
  let pollTimer=null;

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function formatDate(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}
  function ensureStyles(){
    if(document.getElementById('notificationStyles'))return;
    const s=document.createElement('style');s.id='notificationStyles';s.textContent=`
      .notification-wrap{position:relative;display:none}.notification-button{position:relative;display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:38px;padding:0 10px;border:1px solid #d1d5db;border-radius:10px;background:#fff;cursor:pointer;font-size:18px}.notification-badge{position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#dc2626;color:#fff;font-size:11px;font-weight:900;display:none;align-items:center;justify-content:center;border:2px solid #fff}.notification-panel{position:absolute;right:0;top:46px;width:min(390px,calc(100vw - 24px));max-height:520px;overflow:hidden;background:#fff;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.16);z-index:9999;display:none}.notification-panel.open{display:block}.notification-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #e5e7eb}.notification-head strong{font-size:15px}.notification-head button{border:0;background:transparent;color:#2563eb;font-size:12px;font-weight:800;cursor:pointer}.notification-list{max-height:455px;overflow:auto}.notification-item{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #f1f5f9;background:#fff;padding:13px 15px;cursor:pointer}.notification-item:hover{background:#f8fafc}.notification-item.unread{background:#eff6ff}.notification-item-title{display:flex;gap:8px;align-items:flex-start;font-size:13px;font-weight:800;color:#111827}.notification-dot{width:7px;height:7px;border-radius:50%;background:#2563eb;flex:0 0 auto;margin-top:6px}.notification-item.read .notification-dot{background:#d1d5db}.notification-item-post{margin-top:5px;font-size:12px;color:#4b5563;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.notification-item-date{margin-top:5px;font-size:11px;color:#9ca3af}.notification-empty,.notification-loading{padding:28px 16px;text-align:center;color:#6b7280;font-size:13px}.notification-error{padding:18px 16px;text-align:center;color:#b91c1c;font-size:13px}@media(max-width:600px){.notification-panel{position:fixed;right:12px;left:12px;top:68px;width:auto;max-height:70vh}.notification-list{max-height:60vh}}
    `;document.head.appendChild(s);
  }

  function ensureUI(){
    ensureStyles();
    if(document.getElementById('notificationWrap'))return;
    const actions=document.querySelector('.header-actions');
    if(!actions)return;
    const wrap=document.createElement('div');wrap.id='notificationWrap';wrap.className='notification-wrap';
    wrap.innerHTML=`<button id="notificationButton" class="notification-button" type="button" aria-label="알림" onclick="toggleNotificationPanel(event)">🔔<span id="notificationBadge" class="notification-badge">0</span></button><div id="notificationPanel" class="notification-panel"><div class="notification-head"><strong>🔔 알림</strong><button type="button" onclick="markAllNotificationsRead()">모두 읽음</button></div><div id="notificationList" class="notification-list"><div class="notification-loading">알림을 불러오는 중...</div></div></div>`;
    const myPage=document.getElementById('headerMyPageButton');
    if(myPage)actions.insertBefore(wrap,myPage);else actions.appendChild(wrap);
    document.addEventListener('click',function(e){const panel=document.getElementById('notificationPanel'),w=document.getElementById('notificationWrap');if(panel?.classList.contains('open')&&w&&!w.contains(e.target))panel.classList.remove('open');});
  }

  async function fetchNotifications(){
    if(!currentUser)return [];
    const {data,error}=await supabaseClient.from('notifications').select('id,notification_type,post_id,comment_id,reaction_type,is_read,created_at').eq('recipient_id',currentUser.id).order('created_at',{ascending:false}).limit(50);
    if(error)throw error;
    return data||[];
  }

  async function fetchPostTitles(ids){
    const map={};if(!ids.length)return map;
    const {data,error}=await supabaseClient.from('posts').select('id,title').in('id',ids);
    if(!error)(data||[]).forEach(p=>map[p.id]=p.title||'게시글');
    return map;
  }

  function notificationText(n){
    if(n.notification_type==='COMMENT')return '내 게시글에 새 댓글이 달렸습니다.';
    if(n.notification_type==='REPLY')return '내 댓글에 새 답글이 달렸습니다.';
    if(n.notification_type==='REACTION')return `내 게시글에 ${esc(n.reaction_type||'공감')} 반응이 추가되었습니다.`;
    return '새 알림이 있습니다.';
  }

  async function renderNotifications(){
    ensureUI();const wrap=document.getElementById('notificationWrap'),list=document.getElementById('notificationList');
    if(!wrap||!list)return;
    if(!currentUser){wrap.style.display='none';return;}
    wrap.style.display='block';list.innerHTML='<div class="notification-loading">알림을 불러오는 중...</div>';
    try{
      const rows=await fetchNotifications();
      const titles=await fetchPostTitles([...new Set(rows.map(r=>r.post_id).filter(Boolean))]);
      if(!rows.length){list.innerHTML='<div class="notification-empty">아직 알림이 없습니다.</div>';updateBadge(0);return;}
      list.innerHTML=rows.map(n=>`<button type="button" class="notification-item ${n.is_read?'read':'unread'}" onclick="openNotification(${Number(n.id)},${Number(n.post_id)},${n.comment_id==null?'null':Number(n.comment_id)})"><div class="notification-item-title"><span class="notification-dot"></span><span>${notificationText(n)}</span></div><div class="notification-item-post">${esc(titles[n.post_id]||'게시글')}</div><div class="notification-item-date">${esc(formatDate(n.created_at))}</div></button>`).join('');
      updateBadge(rows.filter(n=>!n.is_read).length);
    }catch(e){console.error('알림 조회 오류:',e);list.innerHTML='<div class="notification-error">알림을 불러오지 못했습니다.</div>';}
  }

  async function refreshBadge(){
    ensureUI();const wrap=document.getElementById('notificationWrap');if(!wrap)return;
    if(!currentUser){wrap.style.display='none';updateBadge(0);return;}
    wrap.style.display='block';
    try{const {count,error}=await supabaseClient.from('notifications').select('id',{count:'exact',head:true}).eq('recipient_id',currentUser.id).eq('is_read',false);if(error)throw error;updateBadge(Number(count||0));}catch(e){console.warn('알림 배지 조회 오류:',e);}
  }

  function updateBadge(count){const badge=document.getElementById('notificationBadge');if(!badge)return;const n=Number(count||0);badge.textContent=n>99?'99+':String(n);badge.style.display=n>0?'inline-flex':'none';}

  window.toggleNotificationPanel=function(event){if(event)event.stopPropagation();if(!currentUser){if(typeof openLoginModal==='function')openLoginModal();return;}ensureUI();const panel=document.getElementById('notificationPanel');if(!panel)return;panel.classList.toggle('open');if(panel.classList.contains('open'))renderNotifications();};

  window.markAllNotificationsRead=async function(){if(!currentUser)return;try{const {error}=await supabaseClient.from('notifications').update({is_read:true}).eq('recipient_id',currentUser.id).eq('is_read',false);if(error)throw error;await renderNotifications();}catch(e){console.error('알림 모두 읽음 오류:',e);alert('알림 읽음 처리에 실패했습니다.');}};

  window.openNotification=async function(id,postId,commentId){
    if(!currentUser)return;
    try{await supabaseClient.from('notifications').update({is_read:true}).eq('id',Number(id)).eq('recipient_id',currentUser.id);}catch(e){console.warn('알림 읽음 처리 오류:',e);}
    document.getElementById('notificationPanel')?.classList.remove('open');
    await refreshBadge();
    if(typeof openPostDetail==='function')await openPostDetail(Number(postId));
    if(commentId!=null){setTimeout(()=>{const el=document.getElementById('admin-reported-comment-'+Number(commentId));if(el){el.scrollIntoView({behavior:'smooth',block:'center'});const old=el.style.boxShadow;el.style.boxShadow='0 0 0 3px #2563eb';setTimeout(()=>el.style.boxShadow=old,1800);}},350);}
  };

  async function syncUser(){
    ensureUI();const id=currentUser?.id||null;
    if(id!==lastUserId){lastUserId=id;document.getElementById('notificationPanel')?.classList.remove('open');}
    await refreshBadge();
  }

  function start(){ensureUI();syncUser();if(pollTimer)clearInterval(pollTimer);pollTimer=setInterval(syncUser,POLL_MS);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
