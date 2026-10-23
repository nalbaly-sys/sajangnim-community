/* ==================================================
   COMMENT VISUAL POLISH
   - 작성자 / 날짜 / 본문 시각적 구분 강화
   - 익명 작성자 포인트 컬러
   - 댓글/대댓글 공통 적용
================================================== */
(function(){
  function ensureStyles(){
    if(document.getElementById('commentVisualPolishStyles'))return;
    const s=document.createElement('style');
    s.id='commentVisualPolishStyles';
    s.textContent=`
      .comment-item .comment-header{
        display:flex!important;
        align-items:center!important;
        gap:8px!important;
        flex-wrap:wrap!important;
        margin-bottom:8px!important;
      }
      .comment-item .comment-author{
        display:inline-flex!important;
        align-items:center!important;
        width:max-content!important;
        padding:4px 9px!important;
        border-radius:999px!important;
        background:linear-gradient(135deg,#eef2ff,#f5f3ff)!important;
        border:1px solid #dfe3ff!important;
        color:#4f46e5!important;
        font-size:12px!important;
        font-weight:900!important;
        line-height:1.2!important;
        letter-spacing:-.01em!important;
      }
      .comment-item .comment-date{
        color:#9ca3af!important;
        font-size:10.5px!important;
        font-weight:600!important;
        line-height:1.2!important;
        white-space:nowrap!important;
      }
      .comment-item .comment-content{
        display:block!important;
        margin:0 0 4px!important;
        padding:2px 2px 4px!important;
        color:#2f3746!important;
        font-size:14px!important;
        line-height:1.75!important;
        word-break:break-word!important;
        white-space:pre-wrap!important;
      }
      .comment-item.is-reply .comment-author{
        background:linear-gradient(135deg,#ecfdf5,#f0fdfa)!important;
        border-color:#ccefe2!important;
        color:#047857!important;
      }
      .comment-item.is-reply .comment-content{
        color:#374151!important;
      }
      @media(max-width:600px){
        .comment-item .comment-header{gap:6px!important;margin-bottom:7px!important}
        .comment-item .comment-author{padding:4px 8px!important;font-size:11.5px!important}
        .comment-item .comment-date{font-size:10px!important}
        .comment-item .comment-content{font-size:13.5px!important;line-height:1.7!important}
      }
    `;
    document.head.appendChild(s);
  }

  ensureStyles();
})();
