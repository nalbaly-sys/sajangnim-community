/* 12단계 2차: 공개 공지/이벤트 DB 연동 */
(function(){
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function date(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'});}

  function getCards(){
    const section=document.getElementById('operationsSection');
    if(!section)return null;
    const cards=section.querySelectorAll('.ops-grid .ops-card');
    if(cards.length<2)return null;
    return {notice:cards[0],event:cards[1]};
  }

  async function loadPublicOperatingContent(){
    const cards=getCards();
    if(!cards)return;
    try{
      const [nr,er]=await Promise.all([
        supabaseClient.from('notices').select('id,title,content,is_pinned,published_at,created_at').order('is_pinned',{ascending:false}).order('published_at',{ascending:false}).limit(5),
        supabaseClient.from('events').select('id,title,content,starts_at,ends_at,published_at,created_at').order('starts_at',{ascending:false}).order('published_at',{ascending:false}).limit(5)
      ]);
      if(nr.error||er.error){
        console.warn('운영 DB가 아직 준비되지 않아 기본 안내를 유지합니다.',nr.error||er.error);
        return;
      }

      const notices=nr.data||[];
      cards.notice.innerHTML='<h3>공지사항</h3>'+(notices.length?notices.map(n=>`<div class="ops-notice-item"><div class="ops-notice-title"><span class="ops-badge ${n.is_pinned?'':'info'}">${n.is_pinned?'필독':'안내'}</span><strong>${esc(n.title)}</strong></div><small>${esc(date(n.published_at||n.created_at))}</small><p>${esc(n.content)}</p></div>`).join(''):'<div class="ops-event-empty">등록된 공지가 없습니다.</div>');

      const events=er.data||[];
      cards.event.innerHTML='<h3>이벤트</h3>'+(events.length?events.map(e=>{const period=e.starts_at||e.ends_at?`<small>${e.starts_at?esc(date(e.starts_at)):''}${e.starts_at&&e.ends_at?' ~ ':''}${e.ends_at?esc(date(e.ends_at)):''}</small>`:'';return `<div class="ops-notice-item"><div class="ops-notice-title"><span class="ops-badge info">EVENT</span><strong>${esc(e.title)}</strong></div>${period}<p>${esc(e.content)}</p></div>`;}).join(''):'<div class="ops-event-empty"><strong>현재 진행 중인 이벤트가 없습니다.</strong><p>새로운 이벤트가 시작되면 이곳에서 안내하겠습니다.</p></div>');
    }catch(e){console.warn('공개 운영 콘텐츠 조회 실패:',e);}
  }

  window.refreshPublicOperatingContent=loadPublicOperatingContent;
  setTimeout(loadPublicOperatingContent,0);
})();
