/* ==================================================
   STEP 14: 제목 + 본문 이모지 피커
   - emoji-picker-element 1.29.1
   - 제목은 평문 + 이모지
   - 본문은 Quill 편집기에 이모지 삽입
================================================== */
(function(){
  const EMOJI_MODULE='https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js';
  let modulePromise=null;
  let activeTarget=null;
  let pickerHost=null;

  function ensureStyles(){
    if(document.getElementById('emojiPickerEnhancerStyles'))return;
    const s=document.createElement('style');
    s.id='emojiPickerEnhancerStyles';
    s.textContent=`
      .emoji-title-row{display:flex;align-items:center;gap:8px;width:100%}.emoji-title-row>input{flex:1;min-width:0}.emoji-open-button{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:42px;padding:0 10px;border:1px solid #d1d5db;border-radius:10px;background:#fff;font-size:20px;cursor:pointer}.emoji-open-button:hover{background:#f8fafc}.emoji-open-button:focus{outline:2px solid #2563eb;outline-offset:2px}
      .emoji-body-button{display:inline-flex;align-items:center;justify-content:center;width:32px;height:28px;border:0;background:transparent;font-size:18px;cursor:pointer;border-radius:4px}.emoji-body-button:hover{background:#e5e7eb}
      .emoji-picker-popover{position:fixed!important;z-index:2147483646!important;width:min(360px,calc(100vw - 24px));max-height:min(520px,calc(100vh - 100px));background:#fff;border:1px solid #d1d5db;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.28);padding:8px;display:none;pointer-events:auto!important;isolation:isolate;transform:translateZ(0)}.emoji-picker-popover.open{display:block!important}.emoji-picker-popover emoji-picker{display:block;width:100%;height:460px;max-height:calc(100vh - 130px);pointer-events:auto!important}
      .emoji-picker-arrow-note{font-size:11px;color:#6b7280;padding:2px 4px 7px;text-align:center}
      @media(max-width:600px){.emoji-title-row{gap:6px}.emoji-open-button{min-width:40px;height:40px;padding:0 8px}.emoji-picker-popover{left:12px!important;right:12px!important;top:72px!important;width:auto!important}.emoji-picker-popover emoji-picker{height:62vh;max-height:62vh}}
    `;
    document.head.appendChild(s);
  }

  function loadModule(){
    if(window.customElements&&customElements.get('emoji-picker'))return Promise.resolve();
    if(modulePromise)return modulePromise;
    modulePromise=import(EMOJI_MODULE).then(()=>undefined).catch(error=>{console.error('이모지 피커 로드 오류:',error);modulePromise=null;throw error;});
    return modulePromise;
  }

  function ensurePicker(){
    ensureStyles();
    if(pickerHost)return pickerHost;
    pickerHost=document.createElement('div');
    pickerHost.id='globalEmojiPicker';
    pickerHost.className='emoji-picker-popover';
    pickerHost.innerHTML='<div class="emoji-picker-arrow-note">이모지를 검색하거나 카테고리에서 선택하세요</div><emoji-picker locale="ko"></emoji-picker>';
    document.body.appendChild(pickerHost);
    pickerHost.style.zIndex='2147483646';
    pickerHost.style.pointerEvents='auto';
    pickerHost.querySelector('emoji-picker').addEventListener('emoji-click',function(event){
      const emoji=event?.detail?.unicode||'';
      if(!emoji||!activeTarget)return;
      insertEmoji(activeTarget,emoji);
    });
    document.addEventListener('mousedown',function(event){
      if(!pickerHost?.classList.contains('open'))return;
      if(pickerHost.contains(event.target))return;
      if(event.target.closest?.('[data-emoji-trigger]'))return;
      closePicker();
    });
    window.addEventListener('resize',()=>{if(pickerHost?.classList.contains('open'))positionPicker(activeTarget?.button);});
    window.addEventListener('scroll',()=>{if(pickerHost?.classList.contains('open'))positionPicker(activeTarget?.button);},{passive:true});
    return pickerHost;
  }

  function closePicker(){
    pickerHost?.classList.remove('open');
  }

  function positionPicker(button){
    if(!pickerHost||!button)return;
    if(window.innerWidth<=600){pickerHost.style.left='12px';pickerHost.style.right='12px';pickerHost.style.top='72px';return;}
    const rect=button.getBoundingClientRect();
    const width=Math.min(360,window.innerWidth-24);
    const left=Math.min(Math.max(12,rect.left),window.innerWidth-width-12);
    let top=rect.bottom+8;
    const estimatedHeight=Math.min(520,window.innerHeight-100);
    if(top+estimatedHeight>window.innerHeight-12)top=Math.max(12,rect.top-estimatedHeight-8);
    pickerHost.style.left=left+'px';pickerHost.style.right='auto';pickerHost.style.top=top+'px';
  }

  async function openPicker(target,button){
    try{
      await loadModule();
      const host=ensurePicker();
      activeTarget={...target,button};
      positionPicker(button);
      host.style.zIndex='2147483646';
      host.classList.add('open');
      setTimeout(()=>host.querySelector('emoji-picker')?.shadowRoot?.querySelector('input')?.focus?.(),30);
    }catch(_){alert('이모지 목록을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');}
  }

  function insertIntoInput(input,emoji){
    if(!input)return;
    const start=Number.isInteger(input.selectionStart)?input.selectionStart:input.value.length;
    const end=Number.isInteger(input.selectionEnd)?input.selectionEnd:start;
    const next=input.value.slice(0,start)+emoji+input.value.slice(end);
    if(next.length>Number(input.maxLength||100)){return;}
    input.value=next;
    const caret=start+emoji.length;
    input.focus();
    try{input.setSelectionRange(caret,caret);}catch(_){ }
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function findQuillFromEditor(editor){
    if(!editor||!window.Quill)return null;
    try{
      const container=editor.closest('.ql-container');
      if(container&&typeof window.Quill.find==='function'){
        const found=window.Quill.find(container);
        if(found&&typeof found.insertText==='function')return found;
      }
    }catch(_){ }
    return null;
  }

  function insertIntoQuill(editor,emoji){
    if(!editor)return;
    const quill=findQuillFromEditor(editor);
    if(quill){
      const range=quill.getSelection(true)||{index:Math.max(0,quill.getLength()-1),length:0};
      quill.insertText(range.index,emoji,'user');
      quill.setSelection(range.index+emoji.length,0,'silent');
      quill.focus();
      return;
    }
    editor.focus();
    document.execCommand?.('insertText',false,emoji);
    editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:emoji}));
  }

  function insertEmoji(target,emoji){
    if(target.type==='title')insertIntoInput(target.element,emoji);
    if(target.type==='body')insertIntoQuill(target.element,emoji);
  }

  function enhanceTitleInput(input){
    if(!input||input.dataset.emojiEnhanced==='1')return;
    input.dataset.emojiEnhanced='1';
    const row=document.createElement('div');row.className='emoji-title-row';
    input.parentNode.insertBefore(row,input);row.appendChild(input);
    const button=document.createElement('button');button.type='button';button.className='emoji-open-button';button.dataset.emojiTrigger='1';button.textContent='😀';button.title='제목에 이모지 넣기';button.setAttribute('aria-label','제목에 이모지 넣기');
    button.onclick=function(event){event.preventDefault();event.stopPropagation();openPicker({type:'title',element:input},button);};
    row.appendChild(button);
  }

  function enhanceToolbar(toolbar,editor){
    if(!toolbar||toolbar.dataset.emojiEnhanced==='1')return;
    toolbar.dataset.emojiEnhanced='1';
    let group=toolbar.querySelector('.ql-formats:last-child');
    if(!group){group=document.createElement('span');group.className='ql-formats';toolbar.appendChild(group);}
    const button=document.createElement('button');button.type='button';button.className='emoji-body-button';button.dataset.emojiTrigger='1';button.textContent='😀';button.title='본문에 이모지 넣기';button.setAttribute('aria-label','본문에 이모지 넣기');
    button.onclick=function(event){event.preventDefault();event.stopPropagation();openPicker({type:'body',element:editor},button);};
    group.appendChild(button);
  }

  function scan(){
    ensureStyles();
    enhanceTitleInput(document.getElementById('postTitle'));
    enhanceTitleInput(document.getElementById('inlinePostTitle'));
    document.querySelectorAll('.ql-toolbar').forEach(toolbar=>{
      const container=toolbar.nextElementSibling;
      const editor=container?.querySelector?.('.ql-editor');
      if(editor)enhanceToolbar(toolbar,editor);
    });
  }

  const observer=new MutationObserver(()=>scan());
  function start(){
    scan();
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
