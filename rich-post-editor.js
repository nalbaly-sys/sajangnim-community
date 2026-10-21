/* ==================================================
   STEP 14: 게시글 리치 텍스트 + 이미지 업로드
   - Quill 2.0.3
   - DOMPurify 3.4.16
   - Supabase Storage post-images
================================================== */
(function(){
  const BUCKET='post-images';
  const MAX_FILE_SIZE=5*1024*1024;
  const MIME_EXT={
    'image/jpeg':'jpg',
    'image/png':'png',
    'image/webp':'webp',
    'image/gif':'gif'
  };
  const QUILL_JS='https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js';
  const QUILL_CSS='https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css';
  const PURIFY_JS='https://cdn.jsdelivr.net/npm/dompurify@3.4.16/dist/purify.min.js';
  const PUBLIC_PREFIX=(window.SUPABASE_CONFIG?.url||'https://djadqsfdrrihkswplzcn.supabase.co')+'/storage/v1/object/public/'+BUCKET+'/';
  const TOOLBAR=[
    [{header:[2,3,false]}],
    ['bold','italic','underline','strike'],
    ['blockquote'],
    [{list:'ordered'},{list:'bullet'}],
    ['link','image'],
    ['clean']
  ];
  const FORMATS=['header','bold','italic','underline','strike','blockquote','list','link','image'];

  let createQuill=null;
  let editQuill=null;
  let draftUploadedPaths=[];
  let editUploadedPaths=[];
  let editOriginalPaths=[];
  let editActive=false;
  let depsReady=false;

  function loadStyle(href,id){
    if(document.getElementById(id))return;
    const link=document.createElement('link');link.id=id;link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
  function loadScript(src,id){
    return new Promise((resolve,reject)=>{
      if(document.getElementById(id)){const s=document.getElementById(id);if(s.dataset.ready==='1'||(id==='step14QuillJs'&&window.Quill)||(id==='step14PurifyJs'&&window.DOMPurify))return resolve();s.addEventListener('load',resolve,{once:true});s.addEventListener('error',reject,{once:true});return;}
      const s=document.createElement('script');s.id=id;s.src=src;s.onload=()=>{s.dataset.ready='1';resolve();};s.onerror=reject;document.head.appendChild(s);
    });
  }
  function ensureStyles(){
    if(document.getElementById('richPostEditorStyles'))return;
    const s=document.createElement('style');s.id='richPostEditorStyles';s.textContent=`
      .rich-post-editor-wrap{margin:4px 0 14px}.rich-post-editor-wrap .ql-toolbar{border-radius:10px 10px 0 0;background:#f8fafc}.rich-post-editor-wrap .ql-container{border-radius:0 0 10px 10px;background:#fff;font-family:inherit;font-size:15px}.rich-post-editor-wrap .ql-editor{min-height:220px;line-height:1.75}.rich-post-editor-wrap .ql-editor img{max-width:100%;height:auto;border-radius:10px;display:block;margin:12px auto}.rich-post-upload-note{margin:-6px 0 12px;font-size:12px;color:#6b7280}.rich-post-content{line-height:1.8;overflow-wrap:anywhere}.rich-post-content p{margin:0 0 12px}.rich-post-content h2,.rich-post-content h3{margin:18px 0 10px;line-height:1.45}.rich-post-content blockquote{margin:14px 0;padding:10px 14px;border-left:4px solid #d1d5db;background:#f8fafc;color:#4b5563}.rich-post-content ul,.rich-post-content ol{padding-left:24px;margin:10px 0}.rich-post-content a{color:#2563eb;text-decoration:underline}.rich-post-content img{display:block;max-width:100%;height:auto;margin:16px auto;border-radius:12px}.inline-rich-post-wrap{width:100%;margin:10px 0 12px}.inline-rich-post-wrap .ql-editor{min-height:220px;line-height:1.75}.inline-rich-post-wrap .ql-editor img{max-width:100%;height:auto;border-radius:10px}.step14-uploading{font-size:12px;color:#2563eb;margin-top:6px}@media(max-width:600px){.rich-post-editor-wrap .ql-editor,.inline-rich-post-wrap .ql-editor{min-height:180px}.ql-toolbar.ql-snow{padding:6px}}
    `;document.head.appendChild(s);
  }

  async function ensureDependencies(){
    if(depsReady&&window.Quill&&window.DOMPurify)return true;
    try{
      loadStyle(QUILL_CSS,'step14QuillCss');
      await loadScript(PURIFY_JS,'step14PurifyJs');
      await loadScript(QUILL_JS,'step14QuillJs');
      depsReady=!!(window.Quill&&window.DOMPurify);
      return depsReady;
    }catch(error){console.error('리치 편집기 라이브러리 로드 오류:',error);return false;}
  }

  function sanitizeRichHtml(html){
    if(!window.DOMPurify)return '';
    const clean=window.DOMPurify.sanitize(String(html||''),{
      ALLOWED_TAGS:['p','br','strong','em','u','s','h2','h3','blockquote','ol','ul','li','a','img'],
      ALLOWED_ATTR:['href','target','rel','src','alt','title']
    });
    const doc=new DOMParser().parseFromString('<div id="root">'+clean+'</div>','text/html');
    const root=doc.getElementById('root');
    if(!root)return '';
    root.querySelectorAll('img').forEach(img=>{
      const src=String(img.getAttribute('src')||'');
      if(!src.startsWith(PUBLIC_PREFIX)){img.remove();return;}
      img.removeAttribute('width');img.removeAttribute('height');
      img.setAttribute('loading','lazy');
    });
    root.querySelectorAll('a').forEach(a=>{
      const href=String(a.getAttribute('href')||'').trim();
      if(!/^(https?:\/\/|mailto:)/i.test(href)){a.replaceWith(...a.childNodes);return;}
      a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer nofollow');
    });
    return root.innerHTML;
  }

  function plainFromQuill(quill){return String(quill?.getText()||'').replace(/\n+$/,'').trim();}
  function htmlFromQuill(quill){
    if(!quill)return '';
    const raw=typeof quill.getSemanticHTML==='function'?quill.getSemanticHTML():quill.root.innerHTML;
    return sanitizeRichHtml(raw);
  }
  function plainToHtml(text){
    const div=document.createElement('div');
    String(text||'').split(/\n/).forEach(line=>{const p=document.createElement('p');p.textContent=line||' ';div.appendChild(p);});
    return div.innerHTML;
  }
  function extractOwnedPaths(html){
    const doc=new DOMParser().parseFromString(String(html||''),'text/html');
    const prefix=PUBLIC_PREFIX;
    return [...new Set([...doc.querySelectorAll('img')].map(img=>{
      const src=String(img.getAttribute('src')||'');
      if(!src.startsWith(prefix))return null;
      try{return decodeURIComponent(src.slice(prefix.length).split('?')[0]);}catch(_){return src.slice(prefix.length).split('?')[0];}
    }).filter(path=>path&&currentUser&&path.startsWith(currentUser.id+'/')) )];
  }
  async function removePaths(paths){
    const unique=[...new Set((paths||[]).filter(Boolean))];if(!unique.length)return;
    try{const {error}=await supabaseClient.storage.from(BUCKET).remove(unique);if(error)throw error;}
    catch(error){console.warn('사용하지 않는 게시글 이미지 삭제 실패:',error);}
  }

  function setMessage(id,text){const el=document.getElementById(id);if(el)el.textContent=text||'';}
  async function uploadImage(quill,pathList,messageId){
    if(!currentUser){if(typeof openLoginModal==='function')openLoginModal();return;}
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp,image/gif';
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;
      if(!MIME_EXT[file.type]){setMessage(messageId,'JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.');return;}
      if(file.size>MAX_FILE_SIZE){setMessage(messageId,'이미지는 한 장당 5MB 이하만 업로드할 수 있습니다.');return;}
      const ext=MIME_EXT[file.type];
      const uid=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
      const path=currentUser.id+'/'+Date.now()+'-'+uid+'.'+ext;
      setMessage(messageId,'이미지 업로드 중...');
      try{
        const {error}=await supabaseClient.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});
        if(error)throw error;
        const {data}=supabaseClient.storage.from(BUCKET).getPublicUrl(path);
        const url=data?.publicUrl;if(!url)throw new Error('공개 이미지 주소를 만들 수 없습니다.');
        const range=quill.getSelection(true)||{index:quill.getLength(),length:0};
        quill.insertEmbed(range.index,'image',url,'user');quill.setSelection(range.index+1,0,'silent');
        pathList.push(path);setMessage(messageId,'');
      }catch(error){console.error('게시글 이미지 업로드 오류:',error);setMessage(messageId,'이미지 업로드에 실패했습니다. 다시 시도해주세요.');}
    };
    input.click();
  }

  function makeQuill(container,initialHtml,pathList,messageId){
    const q=new window.Quill(container,{theme:'snow',placeholder:'사장님들의 이야기를 들려주세요.',formats:FORMATS,modules:{toolbar:TOOLBAR}});
    q.getModule('toolbar').addHandler('image',()=>uploadImage(q,pathList,messageId));
    if(initialHtml){q.clipboard.dangerouslyPasteHTML(sanitizeRichHtml(initialHtml));}
    return q;
  }

  async function ensureCreateEditor(){
    const ok=await ensureDependencies();if(!ok)return;
    ensureStyles();
    const textarea=document.getElementById('postContent');if(!textarea)return;
    let wrap=document.getElementById('postRichEditorWrap');
    if(!wrap){
      textarea.style.display='none';
      wrap=document.createElement('div');wrap.id='postRichEditorWrap';wrap.className='rich-post-editor-wrap';wrap.innerHTML='<div id="postRichEditor"></div>';
      textarea.insertAdjacentElement('afterend',wrap);
      const note=document.createElement('div');note.className='rich-post-upload-note';note.textContent='📷 이미지: JPG · PNG · WEBP · GIF / 장당 최대 5MB';wrap.insertAdjacentElement('afterend',note);
    }
    if(!createQuill){createQuill=makeQuill(document.getElementById('postRichEditor'),'',draftUploadedPaths,'postMessage');createQuill.on('text-change',()=>{textarea.value=plainFromQuill(createQuill);});}
  }

  const previousOpenPostModal=window.openPostModal;
  window.openPostModal=async function(){
    if(typeof previousOpenPostModal==='function')previousOpenPostModal();
    await ensureCreateEditor();
    if(createQuill){createQuill.setContents([]);createQuill.focus();}
    draftUploadedPaths=[];
  };

  const previousCloseModal=window.closeModal;
  window.closeModal=function(id){
    if(id==='postModal'&&draftUploadedPaths.length){const paths=[...draftUploadedPaths];draftUploadedPaths=[];removePaths(paths);}
    if(typeof previousCloseModal==='function')return previousCloseModal(id);
  };

  window.createPost=async function(){
    if(!currentUser){if(typeof openLoginModal==='function')openLoginModal();return;}
    await ensureCreateEditor();
    const category=document.getElementById('postCategory')?.value.trim()||'';
    const businessType=document.getElementById('postBusinessType')?.value.trim()||'';
    const title=document.getElementById('postTitle')?.value.trim()||'';
    const content=plainFromQuill(createQuill);
    const contentHtml=htmlFromQuill(createQuill);
    const isAnonymous=document.getElementById('postAnonymous')?.checked===true;
    const message=document.getElementById('postMessage');
    if(!category){if(message)message.textContent='카테고리를 선택해주세요.';return;}
    if(!businessType){if(message)message.textContent='업종을 선택해주세요.';return;}
    if(title.length<2||title.length>100){if(message)message.textContent='제목은 2~100자로 입력해주세요.';return;}
    if(content.length<5){if(message)message.textContent='내용은 5자 이상 입력해주세요.';return;}
    if(content.length>5000){if(message)message.textContent='내용은 5000자 이하로 입력해주세요.';return;}
    const submitButton=document.querySelector('#postModal .modal-submit');
    if(submitButton){submitButton.disabled=true;submitButton.textContent='등록 중...';}
    try{
      const {data,error}=await supabaseClient.from('posts').insert({user_id:currentUser.id,category,business_type:businessType,title,content,content_html:contentHtml||null,is_anonymous:isAnonymous,view_count:0,status:'ACTIVE'}).select().single();
      if(error)throw error;
      console.log('리치 게시글 등록 완료:',data);
      draftUploadedPaths=[];
      if(message)message.textContent='게시글이 등록되었습니다.';
      if(typeof loadPosts==='function')await loadPosts();
      setTimeout(()=>window.closeModal('postModal'),500);
    }catch(error){console.error('리치 게시글 등록 오류:',error);if(message)message.textContent='게시글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.';}
    finally{if(submitButton){submitButton.disabled=false;submitButton.textContent='게시글 등록하기';}}
  };

  const previousOpenPostDetail=window.openPostDetail;
  window.openPostDetail=async function(postId){
    if(typeof previousOpenPostDetail==='function')await previousOpenPostDetail(postId);
    const contentEl=document.getElementById('detailContent');if(!contentEl)return;
    try{
      const {data,error}=await supabaseClient.from('posts').select('id,content,content_html').eq('id',Number(postId)).maybeSingle();
      if(error||!data)return;
      const safeHtml=data.content_html?sanitizeRichHtml(data.content_html):'';
      if(safeHtml){contentEl.classList.add('rich-post-content');contentEl.innerHTML=safeHtml;}
      else{contentEl.classList.remove('rich-post-content');contentEl.textContent=data.content||'';}
    }catch(error){console.warn('리치 게시글 상세 렌더링 오류:',error);}
    bindEditButton();
  };

  function bindEditButton(){const b=document.getElementById('ownerPostEditButton');if(b)b.onclick=window.editCurrentPostFromDetail;}
  function showEditError(message){let el=document.getElementById('inlinePostEditError');if(!el){el=document.createElement('div');el.id='inlinePostEditError';el.className='inline-edit-error';document.getElementById('ownerPostActions')?.appendChild(el);}el.textContent=message;}

  window.editCurrentPostFromDetail=async function(){
    if(editActive||!currentUser||!currentPostId)return;
    const titleEl=document.getElementById('detailTitle'),contentEl=document.getElementById('detailContent'),actions=document.getElementById('ownerPostActions');if(!titleEl||!contentEl||!actions)return;
    const ok=await ensureDependencies();if(!ok){showEditError('편집기를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');return;}
    try{
      const {data,error}=await supabaseClient.from('posts').select('id,user_id,title,content,content_html,status').eq('id',Number(currentPostId)).eq('user_id',currentUser.id).eq('status','ACTIVE').maybeSingle();
      if(error)throw error;if(!data)throw new Error('수정할 게시글을 찾을 수 없습니다.');
      editActive=true;editUploadedPaths=[];editOriginalPaths=extractOwnedPaths(data.content_html||'');
      titleEl.style.display='none';contentEl.style.display='none';
      const titleInput=document.createElement('input');titleInput.id='inlinePostTitle';titleInput.className='inline-edit-title';titleInput.type='text';titleInput.maxLength=100;titleInput.value=data.title||'';titleEl.insertAdjacentElement('afterend',titleInput);
      const wrap=document.createElement('div');wrap.id='inlinePostRichWrap';wrap.className='inline-rich-post-wrap';wrap.innerHTML='<div id="inlinePostRichEditor"></div><div id="inlinePostImageMessage" class="step14-uploading"></div>';contentEl.insertAdjacentElement('afterend',wrap);
      editQuill=makeQuill(document.getElementById('inlinePostRichEditor'),data.content_html||'',editUploadedPaths,'inlinePostImageMessage');
      if(!data.content_html&&data.content){editQuill.setText(data.content);}
      actions.dataset.originalHtml=actions.innerHTML;actions.innerHTML='<button type="button" class="comment-edit-button" onclick="saveRichPostEdit()">💾 저장</button><button type="button" class="comment-delete-button" onclick="cancelRichPostEdit()">취소</button>';
      titleInput.focus();titleInput.select();
    }catch(error){console.error('리치 게시글 수정 시작 오류:',error);showEditError('게시글 수정 화면을 열지 못했습니다.');editActive=false;}
  };

  window.cancelRichPostEdit=function(skipCleanup){
    const titleEl=document.getElementById('detailTitle'),contentEl=document.getElementById('detailContent'),actions=document.getElementById('ownerPostActions');
    if(!skipCleanup&&editUploadedPaths.length){const paths=[...editUploadedPaths];editUploadedPaths=[];removePaths(paths);}
    document.getElementById('inlinePostTitle')?.remove();document.getElementById('inlinePostRichWrap')?.remove();document.getElementById('inlinePostEditError')?.remove();
    if(titleEl)titleEl.style.display='';if(contentEl)contentEl.style.display='';
    if(actions&&actions.dataset.originalHtml){actions.innerHTML=actions.dataset.originalHtml;delete actions.dataset.originalHtml;}
    editQuill=null;editOriginalPaths=[];editActive=false;bindEditButton();
  };

  window.saveRichPostEdit=async function(){
    if(!editActive||!editQuill||!currentUser||!currentPostId)return;
    const title=(document.getElementById('inlinePostTitle')?.value||'').trim();
    const content=plainFromQuill(editQuill),contentHtml=htmlFromQuill(editQuill),actions=document.getElementById('ownerPostActions');
    if(title.length<2||title.length>100){showEditError('제목은 2~100자로 입력해주세요.');return;}
    if(content.length<5||content.length>5000){showEditError('내용은 5~5000자로 입력해주세요.');return;}
    try{
      if(actions)actions.querySelectorAll('button').forEach(b=>b.disabled=true);
      const {data,error}=await supabaseClient.from('posts').update({title,content,content_html:contentHtml||null,updated_at:new Date().toISOString()}).eq('id',Number(currentPostId)).eq('user_id',currentUser.id).eq('status','ACTIVE').select('id,title,content,content_html').maybeSingle();
      if(error)throw error;if(!data)throw new Error('수정 권한을 확인할 수 없습니다.');
      const newPaths=extractOwnedPaths(data.content_html||'');
      const removed=editOriginalPaths.filter(path=>!newPaths.includes(path));
      editUploadedPaths=[];
      const titleEl=document.getElementById('detailTitle'),contentEl=document.getElementById('detailContent');
      if(titleEl)titleEl.textContent=data.title||title;
      if(contentEl){const safe=data.content_html?sanitizeRichHtml(data.content_html):'';if(safe){contentEl.classList.add('rich-post-content');contentEl.innerHTML=safe;}else{contentEl.classList.remove('rich-post-content');contentEl.textContent=data.content||content;}}
      window.cancelRichPostEdit(true);
      if(removed.length)removePaths(removed);
      if(typeof loadPosts==='function')await loadPosts();
      if(document.body.classList.contains('mypage-active')&&typeof loadMyPage==='function')await loadMyPage();
    }catch(error){console.error('리치 게시글 수정 저장 오류:',error);showEditError('게시글 수정에 실패했습니다. 다시 시도해주세요.');if(actions)actions.querySelectorAll('button').forEach(b=>b.disabled=false);}
  };

  async function start(){ensureStyles();await ensureDependencies();await ensureCreateEditor();bindEditButton();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
