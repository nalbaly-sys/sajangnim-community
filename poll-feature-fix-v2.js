/* ==================================================
   TIMED POST POLLS FIX V2
   - 샘플 글의 수동 고ID 때문에 최신 글을 id desc로 찾던 버그 수정
   - created_at 기준으로 방금 작성된 게시글을 찾아 투표 연결
   - 기존 poll-feature.js가 이미 정상 연결한 경우 중복 생성 방지
================================================== */
(function(){
  const MIN_OPTIONS=2;
  const MAX_OPTIONS=6;

  function collectPollConfig(){
    const box=document.getElementById('postPollBuilder');
    if(!box?.classList.contains('enabled'))return {enabled:false};
    const question=document.getElementById('pollQuestion')?.value.trim()||'';
    const options=[...document.querySelectorAll('#pollOptions .poll-option-input')]
      .map(x=>x.value.trim()).filter(Boolean);
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

  async function latestOwnPost(){
    if(!currentUser?.id)return null;
    const {data,error}=await supabaseClient
      .from('posts')
      .select('id,created_at')
      .eq('user_id',currentUser.id)
      .order('created_at',{ascending:false})
      .order('id',{ascending:false})
      .limit(1)
      .maybeSingle();
    if(error){console.warn('최신 게시글 확인 실패:',error);return null;}
    return data||null;
  }

  async function attachPollIfMissing(postId,cfg){
    const {data:existing,error:checkError}=await supabaseClient
      .from('post_polls').select('id').eq('post_id',postId).maybeSingle();
    if(checkError)throw checkError;
    if(existing?.id)return false;

    const {data:poll,error:pollError}=await supabaseClient
      .from('post_polls')
      .insert({post_id:postId,question:cfg.question,ends_at:cfg.ends_at})
      .select('id').single();
    if(pollError)throw pollError;

    const rows=cfg.options.map((option_text,i)=>({poll_id:poll.id,option_text,position:i+1}));
    const {error:optionError}=await supabaseClient.from('poll_options').insert(rows);
    if(optionError){
      try{await supabaseClient.from('post_polls').delete().eq('id',poll.id);}catch(_){ }
      throw optionError;
    }
    return true;
  }

  function install(){
    if(window.__pollFeatureFixV2Installed||typeof window.createPost!=='function')return;
    window.__pollFeatureFixV2Installed=true;
    const original=window.createPost;

    window.createPost=async function(){
      const cfg=collectPollConfig();
      if(cfg.error){
        const msg=document.getElementById('postMessage');
        if(msg)msg.textContent=cfg.error;
        return;
      }
      if(!cfg.enabled)return original.apply(this,arguments);

      const before=await latestOwnPost();
      const result=await original.apply(this,arguments);
      const after=await latestOwnPost();

      if(!after?.id||String(after.id)===String(before?.id||''))return result;
      try{
        const attached=await attachPollIfMissing(after.id,cfg);
        if(attached){
          const msg=document.getElementById('postMessage');
          if(msg)msg.textContent='게시글과 투표가 등록되었습니다.';
          if(typeof window.loadPosts==='function')await window.loadPosts();
        }
      }catch(error){
        console.error('투표 연결 보정 실패:',error);
        alert('게시글은 등록되었지만 투표 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
      return result;
    };
  }

  install();
  setTimeout(install,100);
  setTimeout(install,500);
})();
