/* ==================================================
   POLL CALENDAR ENHANCER
   - 투표 마감일 입력에 명확한 달력 버튼 추가
   - 지원 브라우저는 showPicker(), 그 외는 focus/click fallback
================================================== */
(function(){
  function ensureStyles(){
    if(document.getElementById('pollCalendarEnhancerStyles'))return;
    const s=document.createElement('style');
    s.id='pollCalendarEnhancerStyles';
    s.textContent=`
      .poll-deadline-picker{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}
      .poll-calendar-button{min-height:42px;border:1px solid #c7d2fe;background:linear-gradient(145deg,#f8faff,#fff);color:#4338ca;border-radius:10px;padding:0 13px;font-weight:900;font-size:12px;white-space:nowrap;cursor:pointer;box-shadow:0 4px 12px rgba(79,70,229,.06)}
      .poll-calendar-button:hover{background:#eef2ff;border-color:#a5b4fc}
      @media(max-width:600px){.poll-deadline-picker{grid-template-columns:1fr}.poll-calendar-button{width:100%;min-height:44px;font-size:13px}}
    `;
    document.head.appendChild(s);
  }

  function openNativePicker(input){
    if(!input)return;
    try{
      input.focus({preventScroll:true});
      if(typeof input.showPicker==='function'){
        input.showPicker();
        return;
      }
    }catch(_){ }
    try{input.focus();input.click();}catch(_){ }
  }

  function enhance(){
    ensureStyles();
    const input=document.getElementById('pollEndsAt');
    if(!input||input.dataset.calendarEnhanced==='1')return;
    input.dataset.calendarEnhanced='1';

    const wrap=document.createElement('div');
    wrap.className='poll-deadline-picker';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);

    const btn=document.createElement('button');
    btn.type='button';
    btn.className='poll-calendar-button';
    btn.textContent='📅 달력에서 선택';
    btn.addEventListener('click',()=>openNativePicker(input));
    wrap.appendChild(btn);

    input.addEventListener('click',()=>{
      if(window.matchMedia('(max-width:700px)').matches){
        try{if(typeof input.showPicker==='function')input.showPicker();}catch(_){ }
      }
    });
  }

  function start(){
    enhance();
    const observer=new MutationObserver(()=>enhance());
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(enhance,150);
    setTimeout(enhance,700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
