/* ==================================================
   TIMED POST POLLS
   - 게시글 작성 시 선택적으로 기간제 투표 추가
   - 2~6개 선택지, 로그인 사용자 1인 1표
   - 투표 진행 중 결과 비공개, 마감 후 득표수/비율 공개
================================================== */
(function(){
  const MAX_OPTIONS=6;
  const MIN_OPTIONS=2;
  let decorating=false;

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
  function fmtDate(v){if(!v)return '';const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}
  function pad(n){return String(n).padStart(2,'0');}
  function localInputValue(date){return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;}

  function ensureStyles(){
    if(document.getElementById('postPollFeatureStyles'))return;
    const s=document.createElement('style');
    s.id='postPollFeatureStyles';
    s.textContent=`
      .poll-builder{margin:16px 0;padding:15px;border:1px solid #e2e8f0;border-radius:14px;background:linear-gradient(145deg,#f8fbff,#fffdf8);box-shadow:0 6px 18px rgba(15,23,42,.04)}
      .poll-toggle{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;border:0;background:transparent;padding:0;color:#1f2937;font-weight:900;text-align:left}
      .poll-toggle span:last-child{font-size:12px;color:#6366f1}
      .poll-builder-fields{display:none;margin-top:13px}.poll-builder.enabled .poll-builder-fields{display:block}
      .poll-builder label{display:block;margin:10px 0 6px;font-size:13px;font-weight:800;color:#374151}
      .poll-builder input{width:100%;border:1px solid #d7dce5;border-radius:10px;padding:11px 12px;background:#fff;outline:none}
      .poll-builder input:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,.09)}
      .poll-options{display:flex;flex-direction:column;gap:7px}.poll-option-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center}.poll-remove-option{border:1px solid #e5e7eb;background:#fff;border-radius:9px;width:38px;height:38px;color:#9ca3af;font-weight:900}
      .poll-add-option{margin-top:8px;border:1px dashed #c7d2fe;background:#f8faff;color:#4f46e5;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:900}
      .poll-builder-note{margin-top:8px;color:#7c8494;font-size:11px;line-height:1.55}
      .post-poll-tag{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:#fff1f2;color:#be123c;border:1px solid #ffe4e6;font-size:11px;font-weight:900}
      .post-poll-card{margin:22px 0;padding:18px;border:1px solid #e0e7ff;border-radius:16px;background:linear-gradient(145deg,#f8faff,#fffaf5);box-shadow:0 8px 24px rgba(79,70,229,.07)}
      .post-poll-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.post-poll-question{margin:0;color:#172033;font-size:17px;line-height:1.5}.post-poll-state{flex:0 0 auto;padding:5px 8px;border-radius:999px;background:#eef2ff;color:#4f46e5;font-size:10px;font-weight:900}.post-poll-state.closed{background:#f3f4f6;color:#6b7280}
      .post-poll-deadline{color:#7c8494;font-size:11px;margin-top:5px}.post-poll-options{display:flex;flex-direction:column;gap:8px}.post-poll-vote{width:100%;border:1px solid #dbe1ea;background:#fff;border-radius:11px;padding:11px 13px;text-align:left;font-weight:800;color:#374151;transition:.16s}.post-poll-vote:hover:not(:disabled){border-color:#a5b4fc;background:#f8faff;transform:translateY(-1px)}.post-poll-vote:disabled{cursor:default;opacity:.78}.post-poll-vote.mine{border-color:#818cf8;background:#eef2ff;color:#4338ca}
      .post-poll-message{margin-top:10px;color:#6b7280;font-size:12px;line-height:1.5}.post-poll-result{position:relative;overflow:hidden;border:1px solid #e5e7eb;border-radius:11px;background:#fff;padding:11px 12px}.post-poll-result-fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(129,140,248,.18),rgba(251,191,36,.12));pointer-events:none}.post-poll-result-main{position:relative;display:flex;justify-content:space-between;gap:10px;align-items:center}.post-poll-result-main strong{font-size:13px}.post-poll-result-main span{font-size:12px;color:#6b7280;white-space:nowrap}.post-poll-total{margin-top:11px;text-align:right;color:#7c8494;font-size:11px}
      @media(max-width:600px){.poll-builder{padding:13px}.post-poll-card{padding:15px}.post-poll-head{display:block}.post-poll-state{display:inline-flex;margin-top:8px}.post-poll-question{font-size:16px}}
    `;
    document.head.appendChild(s);
  }

  function ensureBuilder(){
    const modal=document.getElementById('postModal');
    if(!modal)return null;
    let box=document.getElementById('postPollBuilder');
    if(box)return box;
    const submit=modal.querySelector('.modal-submit');
    if(!submit)return null;
    box=document.createElement('div');
    box.id='postPollBuilder';
    box.className='poll-builder';
    box.innerHTML=`
      <button type="button" id="pollBuilderToggle" class="poll-toggle"><span>📊 투표 추가</span><span>선택사항 +</span></button>
      <div class="poll-builder-fields">
        <label for="pollQuestion">투표 질문</label>
        <input id="pollQuestion" type="text" maxlength="200" placeholder="예: 이번 주말 하루 쉰다면 토요일 vs 일요일?">
        <label>선택지</label>
        <div id="pollOptions" class="poll-options"></div>
        <button type="button" id="pollAddOption" class="poll-add-option">+ 선택지 추가</button>
        <label for="pollEndsAt">투표 마감일시</label>
        <input id="pollEndsAt" type="datetime-local">
        <div class="poll-builder-note">진행 중에는 결과를 공개하지 않고, 마감 후 득표수와 비율을 자동 공개합니다. 투표는 로그인 회원당 1회입니다.</div>
      </div>`;
    submit.parentNode.insertBefore(box,submit);
    box.querySelector('#pollBuilderToggle').addEventListener('click',()=>{
      const enabled=box.classList.toggle('enabled');
      box.querySelector('#pollBuilderToggle span:last-child').textContent=enabled?'사용 중 −':'선택사항 +';
      if(enabled&&box.querySelectorAll('.poll-option-row').length<MIN_OPTIONS){resetBuilder(true);}
    });
    box.querySelector('#pollAddOption').addEventListener('click',()=>addOption(''));
    resetBuilder(false);
    return box;
  }

  function addOption(value){
    const host=document.getElementById('pollOptions');if(!host)return;
    if(host.children.length>=MAX_OPTIONS)return;
    const row=document.createElement('div');row.className='poll-option-row';
    row.innerHTML=`<input type="text" maxlength="100" class="poll-option-input" placeholder="선택지 ${host.children.length+1}" value="${esc(value)}"><button type="button" class="poll-remove-option" title="선택지 삭제">×</button>`;
    row.querySelector('.poll-remove-option').addEventListener('click',()=>{
      if(host.children.length<=MIN_OPTIONS)return;
      row.remove();renumberOptions();
    });
    host.appendChild(row);renumberOptions();
  }

  function renumberOptions(){document.querySelectorAll('#pollOptions .poll-option-input').forEach((input,i)=>input.placeholder=`선택지 ${i+1}`);}

  function resetBuilder(keepEnabled){
    const box=ensureBuilder();if(!box)return;
    if(!keepEnabled)box.classList.remove('enabled');
    const q=document.getElementById('pollQuestion');if(q)q.value='';
    const host=document.getElementById('pollOptions');if(host){host.innerHTML='';addOption('');addOption('');}
    const end=document.getElementById('pollEndsAt');if(end){const d=new Date(Date.now()+24*60*60*1000);end.value=localInputValue(d);end.min=localInputValue(new Date(Date.now()+10*60*1000));}
    const label=box.querySelector('#pollBuilderToggle span:last-child');if(label)label.textContent=box.classList.contains('enabled')?'사용 중 −':'선택사항 +';
  }

  function collectPollConfig(){
    const box=document.getElementById('postPollBuilder');
    if(!box?.classList.contains('enabled'))return {enabled:false};
    const question=document.getElementById('pollQuestion')?.value.trim()||'';
    const options=[...document.querySelectorAll('#pollOptions .poll-option-input')].map(x=>x.value.trim()).filter(Boolean);
    const rawEnd=document.getElementById('pollEndsAt')?.value||'';
    const endDate=rawEnd?new Date(rawEnd):null;
    if(question.length<2)return {error:'투표 질문은 2자 이상 입력해주세요.'};
    if(options.length<MIN_OPTIONS)return {error:'투표 선택지는 최소 2개 입력해주세요.'};
    if(options.length>MAX_OPTIONS)return {error:'투표 선택지는 최대 6개까지 가능합니다.'};
    if(new Set(options.map(v=>v.toLowerCase())).size!==options.length)return {error:'같은 선택지를 중복해서 입력할 수 없습니다.'};
    if(!endDate||Number.isNaN(endDate.getTime()))return {error:'투표 마감일시를 선택해주세요.'};
    if(endDate.getTime()<Date.now()+5*60*1000)return {error:'투표 마감은 현재보다 최소 5분 이후로 설정해주세요.'};
    return {enabled:true,question,options,ends_at:endDate.toISOString()};
  }

  async function latestOwnPostId(){
    if(!currentUser?.id)return null;
    const {data,error}=await supabaseClient.from('posts').select('id').eq('user_id',currentUser.id).order('id',{ascending:false}).limit(1).maybeSingle();
    if(error){console.warn('최근 내 게시글 확인 실패:',error);return null;}
    return data?.id??null;
  }

  async function attachPoll(postId,cfg){
    const {data:poll,error:pollError}=await supabaseClient.from('post_polls').insert({post_id:postId,question:cfg.question,ends_at:cfg.ends_at}).select('id').single();
    if(pollError)throw pollError;
    const rows=cfg.options.map((option_text,i)=>({poll_id:poll.id,option_text,position:i+1}));
    const {error:optionsError}=await supabaseClient.from('poll_options').insert(rows);
    if(optionsError){
      try{await supabaseClient.from('post_polls').delete().eq('id',poll.id);}catch(_){ }
      throw optionsError;
    }
  }

  function installCreateHook(){
    if(window.__timedPollCreateInstalled||typeof window.createPost!=='function')return;
    const original=window.createPost;
    window.__timedPollCreateInstalled=true;
    window.createPost=async function(){
      const cfg=collectPollConfig();
      if(cfg.error){const msg=document.getElementById('postMessage');if(msg)msg.textContent=cfg.error;return;}
      if(!cfg.enabled)return original.apply(this,arguments);
      const beforeId=await latestOwnPostId();
      const result=await original.apply(this,arguments);
      const afterId=await latestOwnPostId();
      if(!afterId||String(afterId)===String(beforeId))return result;
      try{
        await attachPoll(afterId,cfg);
        const msg=document.getElementById('postMessage');if(msg)msg.textContent='게시글과 투표가 등록되었습니다.';
        setTimeout(()=>decorateVisibleCards(),80);
      }catch(error){
        console.error('투표 연결 실패:',error);
        alert('게시글은 등록되었지만 투표 저장에 실패했습니다. 게시글은 정상 등록되어 있습니다.');
      }
      return result;
    };
  }

  function installOpenReset(){
    if(window.__timedPollOpenInstalled||typeof window.openPostModal!=='function')return;
    const original=window.openPostModal;
    window.__timedPollOpenInstalled=true;
    window.openPostModal=function(){const result=original.apply(this,arguments);setTimeout(()=>resetBuilder(false),30);return result;};
  }

  async function decorateVisibleCards(){
    if(decorating)return;
    const cards=[...document.querySelectorAll('#postList .post-card')];if(!cards.length)return;
    const pairs=cards.map(card=>{const text=card.getAttribute('onclick')||'';const m=text.match(/openPostDetail\((\d+)\)/);return m?{card,id:Number(m[1])}:null;}).filter(Boolean);
    if(!pairs.length)return;
    decorating=true;
    try{
      const ids=[...new Set(pairs.map(x=>x.id))];
      const {data,error}=await supabaseClient.from('post_polls').select('post_id,ends_at').in('post_id',ids);
      if(error)throw error;
      const map=new Map((data||[]).map(x=>[Number(x.post_id),x]));
      pairs.forEach(({card,id})=>{
        const top=card.querySelector('.post-card-top');if(!top)return;
        top.querySelector('.post-poll-tag')?.remove();
        if(!map.has(id))return;
        const tag=document.createElement('span');tag.className='post-poll-tag';tag.textContent=new Date(map.get(id).ends_at)>new Date()?'📊 투표':'📊 결과';top.appendChild(tag);
      });
    }catch(e){console.warn('투표 게시글 표시 실패:',e);}finally{decorating=false;}
  }

  function ensurePollHost(){
    const modal=document.getElementById('postDetailModal');if(!modal)return null;
    let host=document.getElementById('postPollDetail');if(host)return host;
    host=document.createElement('div');host.id='postPollDetail';
    const reaction=modal.querySelector('.post-reactions');
    const comments=modal.querySelector('.post-comment-section');
    const anchor=reaction||comments;
    if(anchor)anchor.parentNode.insertBefore(host,anchor);else modal.querySelector('.post-detail-box')?.appendChild(host);
    return host;
  }

  async function renderPoll(postId){
    const host=ensurePollHost();if(!host)return;
    host.innerHTML='';
    try{
      const {data:poll,error}=await supabaseClient.from('post_polls').select('id,question,ends_at').eq('post_id',postId).maybeSingle();
      if(error)throw error;
      if(!poll)return;
      const {data:options,error:optionError}=await supabaseClient.from('poll_options').select('id,option_text,position').eq('poll_id',poll.id).order('position');
      if(optionError)throw optionError;
      const ended=new Date(poll.ends_at).getTime()<=Date.now();
      let myVote=null;
      if(currentUser?.id){
        const {data:mine,error:mineError}=await supabaseClient.from('poll_votes').select('option_id').eq('poll_id',poll.id).eq('user_id',currentUser.id).maybeSingle();
        if(!mineError)myVote=mine?.option_id??null;
      }
      host.className='post-poll-card';
      if(!ended){
        host.innerHTML=`<div class="post-poll-head"><div><h3 class="post-poll-question">📊 ${esc(poll.question)}</h3><div class="post-poll-deadline">마감 ${esc(fmtDate(poll.ends_at))}</div></div><span class="post-poll-state">진행 중</span></div><div class="post-poll-options">${(options||[]).map(o=>`<button type="button" class="post-poll-vote ${Number(myVote)===Number(o.id)?'mine':''}" onclick="castPostPollVote(${Number(poll.id)},${Number(o.id)},${Number(postId)})" ${myVote?'disabled':''}>${esc(o.option_text)}${Number(myVote)===Number(o.id)?' · 내 선택':''}</button>`).join('')}</div><div class="post-poll-message">${myVote?'투표 완료 · 결과는 마감 후 공개됩니다.':currentUser?'하나를 선택해 투표해주세요. 결과는 마감 후 공개됩니다.':'투표하려면 로그인이 필요합니다.'}</div>`;
        const ms=new Date(poll.ends_at).getTime()-Date.now();if(ms>0&&ms<2147483647)setTimeout(()=>{if(document.getElementById('postDetailModal')?.style.display!=='none')renderPoll(postId);},ms+500);
        return;
      }
      const {data:results,error:resultError}=await supabaseClient.from('poll_option_results').select('option_id,option_text,position,vote_count').eq('poll_id',poll.id).order('position');
      if(resultError)throw resultError;
      const rows=results||[];const total=rows.reduce((s,r)=>s+Number(r.vote_count||0),0);const max=Math.max(0,...rows.map(r=>Number(r.vote_count||0)));
      host.innerHTML=`<div class="post-poll-head"><div><h3 class="post-poll-question">📊 ${esc(poll.question)}</h3><div class="post-poll-deadline">마감 ${esc(fmtDate(poll.ends_at))}</div></div><span class="post-poll-state closed">마감 · 결과</span></div><div class="post-poll-options">${rows.map(r=>{const votes=Number(r.vote_count||0);const pct=total?Math.round(votes*1000/total)/10:0;return `<div class="post-poll-result"><div class="post-poll-result-fill" style="width:${Math.max(0,Math.min(100,pct))}%"></div><div class="post-poll-result-main"><strong>${esc(r.option_text)}${total&&votes===max?' 🏆':''}${Number(myVote)===Number(r.option_id)?' · 내 선택':''}</strong><span>${votes}표 · ${pct}%</span></div></div>`;}).join('')}</div><div class="post-poll-total">총 ${total}표</div>`;
    }catch(e){console.error('투표 불러오기 실패:',e);host.className='';host.innerHTML='';}
  }

  window.castPostPollVote=async function(pollId,optionId,postId){
    if(!currentUser?.id){if(typeof window.openLoginModal==='function')window.openLoginModal();return;}
    try{
      const {error}=await supabaseClient.from('poll_votes').insert({poll_id:pollId,option_id:optionId,user_id:currentUser.id});
      if(error){if(error.code==='23505')alert('이미 이 투표에 참여했습니다.');else throw error;}
      await renderPoll(postId);
    }catch(e){console.error('투표 실패:',e);alert('투표하지 못했습니다. 마감 여부를 확인하고 다시 시도해주세요.');}
  };

  function installDetailHook(){
    if(window.__timedPollDetailInstalled||typeof window.openPostDetail!=='function')return;
    const original=window.openPostDetail;
    window.__timedPollDetailInstalled=true;
    window.openPostDetail=async function(postId){const result=await original.apply(this,arguments);await renderPoll(postId);return result;};
  }

  function start(){
    ensureStyles();ensureBuilder();installOpenReset();installCreateHook();installDetailHook();decorateVisibleCards();
    const list=document.getElementById('postList');if(list){new MutationObserver(()=>setTimeout(decorateVisibleCards,20)).observe(list,{childList:true,subtree:true});}
    setTimeout(()=>{ensureBuilder();installOpenReset();installCreateHook();installDetailHook();decorateVisibleCards();},150);
    setTimeout(()=>{ensureBuilder();installOpenReset();installCreateHook();installDetailHook();decorateVisibleCards();},700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
