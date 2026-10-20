/* 12단계 1차: 공지·운영 페이지 / 푸터 / 운영문서 */
(function(){
  const docs={
    rules:{
      title:'📘 커뮤니티 이용규칙',
      subtitle:'사장님들이 편하게 이야기할 수 있는 공간을 위한 기본 규칙입니다.',
      body:`
        <h3>1. 서로를 존중해주세요.</h3>
        <p>업종, 지역, 매장 규모와 관계없이 서로의 경험과 고민을 존중해주세요. 욕설, 비하, 조롱, 혐오 표현이나 반복적인 공격은 제한될 수 있습니다.</p>
        <h3>2. 실제 사람이나 업체를 특정하는 폭로는 주의해주세요.</h3>
        <p>상호명, 실명, 전화번호, 주소, 주문번호 등 개인이나 업체를 직접 특정할 수 있는 정보는 가능한 한 가려주세요. 분쟁 당사자를 공개적으로 공격하는 용도로 게시판을 이용하지 마세요.</p>
        <h3>3. 개인정보를 올리지 마세요.</h3>
        <p>본인 또는 타인의 연락처, 계좌정보, 주소, 신분증, 고객정보 등 불필요한 개인정보를 게시하지 마세요.</p>
        <h3>4. 광고·도배·홍보성 게시물을 제한합니다.</h3>
        <p>커뮤니티 이용을 방해하는 반복 홍보, 무관한 링크, 스팸성 게시물은 숨김 또는 삭제될 수 있습니다.</p>
        <h3>5. 불법·위험 콘텐츠는 제한합니다.</h3>
        <p>불법행위를 조장하거나 타인의 안전을 위협하는 내용, 악성 프로그램 배포 등 서비스 운영에 위험을 주는 콘텐츠는 제한될 수 있습니다.</p>
        <h3>6. 신고와 운영 조치</h3>
        <p>회원은 게시글과 댓글을 신고할 수 있습니다. 운영자는 신고 사유와 원문을 확인한 뒤 기각, 숨김, 삭제 등 필요한 조치를 할 수 있습니다.</p>
        <div class="ops-doc-note">이 규칙은 커뮤니티 운영 상황에 따라 보완될 수 있으며, 중요한 변경은 공지사항을 통해 안내할 예정입니다.</div>
      `
    },
    privacy:{
      title:'🔐 개인정보처리방침',
      subtitle:'현재 서비스 구조를 기준으로 작성한 운영 초안입니다.',
      body:`
        <div class="ops-doc-warning"><b>초안 안내</b><br>정식 공개 전 운영자 정보, 문의 연락처, 보유기간, 국외 이전 및 위탁 사항을 실제 서비스 설정과 대조해 최종 확정해야 합니다.</div>
        <h3>1. 처리하는 정보</h3>
        <p>회원가입 및 서비스 이용 과정에서 이메일 주소, 닉네임, 업종, 소개글, 인증 제공자 정보, 작성한 게시글·댓글·반응·신고 기록과 서비스 이용에 필요한 기술 정보가 처리될 수 있습니다.</p>
        <h3>2. 이용 목적</h3>
        <p>회원 식별 및 로그인, 커뮤니티 기능 제공, 게시물 관리, 신고 처리, 부정 이용 방지, 서비스 안정성 확보를 위해 필요한 범위에서 정보를 이용합니다.</p>
        <h3>3. 보관과 삭제</h3>
        <p>회원 탈퇴 기능과 게시물 보존 정책은 서버 측 계정 삭제 기능과 함께 최종 확정할 예정입니다. 법령상 보존 의무가 있는 경우 해당 기간 동안 별도 보관될 수 있습니다.</p>
        <h3>4. 외부 서비스</h3>
        <p>현재 서비스는 Supabase 기반 인증·데이터베이스를 사용하며 Google 및 Kakao 로그인을 지원합니다. 각 서비스에서 처리되는 정보는 해당 제공자의 정책 및 실제 연동 설정에 따라 달라질 수 있습니다.</p>
        <h3>5. 이용자의 권리</h3>
        <p>이용자는 마이페이지에서 자신의 프로필 정보를 확인·수정할 수 있으며, 게시글과 댓글의 수정·삭제 기능을 이용할 수 있습니다. 계정 탈퇴 및 추가 권리 행사 절차는 관련 기능 완성 시 함께 안내할 예정입니다.</p>
        <h3>6. 안전성 확보</h3>
        <p>관리자 권한은 데이터베이스 RLS와 관리자 전용 함수 검증으로 제한하고 있으며, 브라우저에는 Supabase service role 비밀키를 저장하지 않습니다.</p>
        <div class="ops-doc-note">초안 기준일: 2026-10-20 · 17단계 최종 보안·개인정보 점검에서 법률·실제 운영정보를 다시 검토합니다.</div>
      `
    },
    terms:{
      title:'📄 이용약관',
      subtitle:'서비스 이용에 필요한 기본 원칙을 정리한 초안입니다.',
      body:`
        <div class="ops-doc-warning"><b>초안 안내</b><br>정식 서비스 공개 전 운영자 정보와 실제 회원탈퇴·콘텐츠 보존 정책에 맞춰 최종 검토가 필요합니다.</div>
        <h3>제1조 목적</h3>
        <p>이 약관은 “사장님도 퇴근합니다” 커뮤니티의 이용 조건과 이용자 및 운영자 사이의 기본적인 권리·의무를 정하는 것을 목적으로 합니다.</p>
        <h3>제2조 서비스 내용</h3>
        <p>서비스는 자영업자와 사업 운영자들이 경험과 고민을 나눌 수 있도록 게시글, 댓글, 반응, 신고 및 관련 커뮤니티 기능을 제공합니다.</p>
        <h3>제3조 회원의 의무</h3>
        <p>회원은 타인의 권리를 침해하거나 서비스 운영을 방해해서는 안 되며, 이용규칙과 관련 법령을 준수해야 합니다.</p>
        <h3>제4조 게시물</h3>
        <p>회원이 작성한 게시물의 책임은 원칙적으로 작성자에게 있습니다. 운영자는 신고 또는 운영상 필요에 따라 게시물을 숨김·삭제하는 등 필요한 조치를 할 수 있습니다.</p>
        <h3>제5조 서비스 변경 및 중단</h3>
        <p>점검, 장애, 시스템 변경 또는 기타 운영상 필요한 경우 서비스의 일부 또는 전부가 변경되거나 일시 중단될 수 있습니다.</p>
        <h3>제6조 회원 탈퇴</h3>
        <p>회원 탈퇴 시 계정과 작성 콘텐츠의 처리 방식은 별도로 정한 탈퇴 정책에 따릅니다. 해당 정책은 서버 측 탈퇴 기능 구현 시 최종 확정하여 안내합니다.</p>
        <h3>제7조 약관 변경</h3>
        <p>약관이 변경되는 경우 중요한 변경사항과 적용 시점을 공지사항을 통해 안내합니다.</p>
        <div class="ops-doc-note">초안 기준일: 2026-10-20</div>
      `
    }
  };

  const notices=[
    {badge:'필독',title:'사장님도 퇴근합니다 커뮤니티 운영 안내',date:'2026.10.20',content:'서로의 장사 경험과 고민을 편하게 나누되, 실제 고객이나 업체를 특정할 수 있는 개인정보는 가려주세요. 신고된 게시물은 운영자가 확인 후 필요한 조치를 진행합니다.'},
    {badge:'안내',title:'서비스 기능을 단계적으로 개선하고 있습니다',date:'2026.10.20',content:'현재 회원·게시글·댓글·반응·신고·관리자 보안 기능까지 구축되었습니다. 공지·운영 페이지 이후 알림과 이미지 업로드 기능을 순차적으로 추가할 예정입니다.'}
  ];

  const events=[
    {title:'현재 진행 중인 이벤트가 없습니다.',content:'새로운 이벤트가 시작되면 이곳에서 안내하겠습니다.'}
  ];

  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

  function ensureStyles(){
    if(document.getElementById('operatingPagesStyles'))return;
    const s=document.createElement('style');
    s.id='operatingPagesStyles';
    s.textContent=`
      .ops-section{margin-top:28px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:24px;box-shadow:0 4px 15px rgba(0,0,0,.04)}
      .ops-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px}.ops-section-head h2{margin:0;font-size:21px}.ops-section-head p{margin:5px 0 0;color:#6b7280;font-size:14px}
      .ops-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:14px}.ops-card{border:1px solid #e5e7eb;border-radius:14px;padding:16px;background:#fff}.ops-card h3{margin:0 0 10px;font-size:16px}.ops-card p{margin:8px 0 0;color:#4b5563;line-height:1.65;font-size:14px}.ops-card small{color:#9ca3af}
      .ops-notice-item{padding:12px 0;border-bottom:1px solid #f3f4f6}.ops-notice-item:last-child{border-bottom:0}.ops-notice-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.ops-badge{display:inline-flex;padding:3px 7px;border-radius:999px;background:#111827;color:#fff;font-size:11px;font-weight:800}.ops-badge.info{background:#eef2ff;color:#4338ca}.ops-event-empty{padding:18px 10px;text-align:center;color:#6b7280}
      .ops-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}.ops-links button,.site-footer button{border:1px solid #d1d5db;background:#fff;border-radius:8px;padding:8px 11px;font-weight:700;color:#374151}.ops-links button:hover,.site-footer button:hover{background:#f9fafb}
      .site-footer{max-width:1100px;margin:28px auto 0;padding:24px 20px 36px;color:#6b7280;font-size:13px}.site-footer-inner{border-top:1px solid #e5e7eb;padding-top:18px;display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap}.site-footer-links{display:flex;gap:6px;flex-wrap:wrap}.site-footer button{border:0;background:transparent;padding:6px 8px;font-size:12px}.site-footer-brand{font-weight:800;color:#374151}
      .ops-modal{display:none;position:fixed;inset:0;z-index:1600;background:rgba(0,0,0,.55);padding:18px;align-items:center;justify-content:center}.ops-modal.open{display:flex}.ops-modal-box{position:relative;width:100%;max-width:760px;max-height:90vh;overflow:auto;background:#fff;border-radius:18px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.25)}.ops-modal-close{position:absolute;right:14px;top:10px;border:0;background:transparent;font-size:28px;color:#6b7280}.ops-modal-box h2{margin:0 36px 4px 0}.ops-modal-sub{margin:0 0 22px;color:#6b7280}.ops-doc h3{margin:24px 0 8px;font-size:16px}.ops-doc p{margin:0;color:#374151;line-height:1.75;font-size:14px}.ops-doc-warning{padding:14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412;line-height:1.6;font-size:13px}.ops-doc-note{margin-top:24px;padding:13px;background:#f9fafb;border-radius:10px;color:#6b7280;font-size:12px;line-height:1.6}
      @media(max-width:700px){.ops-grid{grid-template-columns:1fr}.ops-section{padding:18px}.ops-modal-box{padding:24px 18px}.site-footer-inner{align-items:flex-start;flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function renderHub(){
    const category=document.querySelector('.category-section');
    if(!category||document.getElementById('operationsSection'))return;
    const section=document.createElement('section');
    section.id='operationsSection';
    section.className='ops-section';
    section.innerHTML=`
      <div class="ops-section-head"><div><h2>📢 공지 · 운영센터</h2><p>서비스 소식과 꼭 알아야 할 운영 안내입니다.</p></div></div>
      <div class="ops-grid">
        <article class="ops-card"><h3>공지사항</h3>${notices.map((n,i)=>`<div class="ops-notice-item"><div class="ops-notice-title"><span class="ops-badge ${i?'info':''}">${esc(n.badge)}</span><strong>${esc(n.title)}</strong></div><small>${esc(n.date)}</small><p>${esc(n.content)}</p></div>`).join('')}</article>
        <article class="ops-card"><h3>🎉 이벤트</h3>${events.map(e=>`<div class="ops-event-empty"><strong>${esc(e.title)}</strong><p>${esc(e.content)}</p></div>`).join('')}</article>
      </div>
      <div class="ops-links"><button type="button" onclick="openOperatingDoc('rules')">이용규칙</button><button type="button" onclick="openOperatingDoc('privacy')">개인정보처리방침</button><button type="button" onclick="openOperatingDoc('terms')">이용약관</button></div>
    `;
    category.insertAdjacentElement('afterend',section);
  }

  function renderFooter(){
    if(document.getElementById('siteFooter'))return;
    const footer=document.createElement('footer');
    footer.id='siteFooter';
    footer.className='site-footer';
    footer.innerHTML=`<div class="site-footer-inner"><div><div class="site-footer-brand">🌙 사장님도 퇴근합니다</div><div>자영업 사장님들의 현실적인 이야기를 나누는 커뮤니티</div></div><div class="site-footer-links"><button type="button" onclick="openOperatingDoc('rules')">이용규칙</button><button type="button" onclick="openOperatingDoc('privacy')">개인정보처리방침</button><button type="button" onclick="openOperatingDoc('terms')">이용약관</button></div></div>`;
    document.body.appendChild(footer);
  }

  function renderModal(){
    if(document.getElementById('operatingDocModal'))return;
    const modal=document.createElement('div');
    modal.id='operatingDocModal';
    modal.className='ops-modal';
    modal.addEventListener('click',e=>{if(e.target===modal)window.closeOperatingDoc();});
    modal.innerHTML=`<div class="ops-modal-box"><button type="button" class="ops-modal-close" onclick="closeOperatingDoc()">×</button><h2 id="opsDocTitle"></h2><p id="opsDocSubtitle" class="ops-modal-sub"></p><div id="opsDocBody" class="ops-doc"></div></div>`;
    document.body.appendChild(modal);
  }

  window.openOperatingDoc=function(type){
    const doc=docs[type];if(!doc)return;
    renderModal();
    document.getElementById('opsDocTitle').textContent=doc.title;
    document.getElementById('opsDocSubtitle').textContent=doc.subtitle;
    document.getElementById('opsDocBody').innerHTML=doc.body;
    document.getElementById('operatingDocModal').classList.add('open');
    document.body.style.overflow='hidden';
  };

  window.closeOperatingDoc=function(){
    document.getElementById('operatingDocModal')?.classList.remove('open');
    document.body.style.overflow='';
  };

  ensureStyles();
  renderHub();
  renderFooter();
  renderModal();
})();
