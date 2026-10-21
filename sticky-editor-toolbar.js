/* ==================================================
   STEP 14: 긴 게시글 편집 툴바 고정
   - 신규 글쓰기 / 게시글 수정 모두 적용
   - 모달 내부 스크롤 시 Quill 툴바가 상단에 따라옴
================================================== */
(function(){
  function ensureStyles(){
    if(document.getElementById('stickyEditorToolbarStyles'))return;
    const style=document.createElement('style');
    style.id='stickyEditorToolbarStyles';
    style.textContent=`
      #postModal .modal-box{
        max-height:90vh;
        overflow-y:auto;
        overscroll-behavior:contain;
      }

      .rich-post-editor-wrap .ql-toolbar.ql-snow,
      .inline-rich-post-wrap .ql-toolbar.ql-snow{
        position:sticky;
        top:0;
        z-index:80;
        background:#fff;
        box-shadow:0 2px 8px rgba(15,23,42,.08);
      }

      .post-detail-box .inline-rich-post-wrap .ql-toolbar.ql-snow{
        top:0;
      }

      @media(max-width:600px){
        #postModal .modal-box{
          max-height:92vh;
        }
        .rich-post-editor-wrap .ql-toolbar.ql-snow,
        .inline-rich-post-wrap .ql-toolbar.ql-snow{
          z-index:90;
          background:#fff;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureStyles);
  else ensureStyles();
})();
