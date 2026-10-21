/* ==================================================
   STEP 17: 운영문서 최종 UI v4
   - operating-pages.js의 단일 공용 모달 구조에 맞춰 openOperatingDoc 자체를 교체
   - privacy/terms는 항상 최종본 사용
   - 광고·쿠키 안내는 privacy 최종본을 직접 오픈
================================================== */
(function(){
  const OPERATOR='사장님도 퇴근합니다';
  const CONTACT_EMAIL='nalbaly@gmail.com';
  const EFFECTIVE_DATE='2026-10-22';

  const privacy={
    title:'🔐 개인정보처리방침',
    subtitle:'서비스의 실제 운영 구조와 개인정보 처리 기준을 안내합니다.',
    body:`
      <h3>1. 운영자 및 문의처</h3>
      <p>서비스명 및 운영자 표시명은 <b>${OPERATOR}</b>입니다. 개인정보 보호 및 서비스 이용 관련 문의는 <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>로 접수할 수 있습니다.</p>

      <h3>2. 처리하는 정보</h3>
      <p>회원가입 및 서비스 이용 과정에서 이메일 주소, 닉네임, 업종, 소개글, 로그인 제공자 정보, 작성한 게시글·댓글·대댓글·반응·신고 기록, 알림 기록, 업로드한 게시글 이미지와 서비스 제공에 필요한 접속·기술 정보가 처리될 수 있습니다.</p>
      <p style="margin-top:8px">Google 또는 Kakao 간편 로그인을 선택한 경우 해당 로그인 제공자가 인증 과정에서 제공하는 식별 정보가 처리될 수 있습니다.</p>

      <h3>3. 이용 목적</h3>
      <p>회원 식별 및 로그인, 커뮤니티 기능 제공, 본인 작성 콘텐츠 관리, 알림 제공, 신고 및 운영 조치, 부정 이용·도배 방지, 서비스 보안과 안정성 확보를 위해 필요한 범위에서 정보를 이용합니다.</p>

      <h3>4. 보유기간 및 회원 탈퇴 시 처리</h3>
      <p>회원 정보와 서비스 이용 데이터는 회원 자격 유지 및 서비스 제공에 필요한 기간 동안 보관합니다. 회원이 마이페이지에서 탈퇴를 완료하면 계정, 프로필, 작성 게시글·댓글, 게시글/댓글 반응, 신고 기록, 알림 등 해당 계정과 직접 연결된 커뮤니티 데이터는 삭제됩니다.</p>
      <p style="margin-top:8px">회원이 업로드한 게시글 이미지는 계정 삭제 전에 본인 Storage 폴더에서 삭제하도록 처리합니다. 법령에 따라 일정 기간 보존해야 하는 정보가 있는 경우에는 해당 법령에서 정한 기간 동안 별도로 보관한 뒤 삭제할 수 있습니다.</p>

      <h3>5. 외부 서비스 및 인프라</h3>
      <p>서비스 제공을 위해 Supabase(인증·데이터베이스·Storage), Vercel(웹 배포), Google/Kakao(간편 로그인), Google AdSense(광고 제공·성과 측정·부정 이용 방지)를 사용할 수 있습니다. 현재 Supabase 프로젝트 데이터베이스는 서울 리전(ap-northeast-2)을 사용합니다.</p>
      <p style="margin-top:8px">각 외부 서비스가 자체적으로 처리하는 정보에는 해당 사업자의 개인정보처리방침과 실제 서비스 설정이 적용됩니다.</p>

      <h3>6. 광고, 쿠키 및 유사 기술</h3>
      <p>서비스는 운영 비용 충당과 서비스 유지·개선을 위해 Google AdSense 등 제3자 광고 서비스를 사용할 수 있습니다. Google 및 제3자 광고 사업자는 광고 제공, 성과 측정, 맞춤 광고 제공 및 부정 이용 방지 등을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.</p>
      <p style="margin-top:8px">이용자는 <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 맞춤 광고 설정을 확인하거나 변경할 수 있으며, 브라우저 설정을 통해 쿠키 저장을 제한하거나 삭제할 수 있습니다.</p>

      <h3>7. 이용자의 권리</h3>
      <p>이용자는 마이페이지에서 자신의 프로필 정보를 확인·수정하고, 본인이 작성한 게시글과 댓글을 수정·삭제할 수 있습니다. 또한 회원 탈퇴 기능을 통해 계정 삭제를 요청할 수 있습니다. 추가적인 개인정보 관련 문의는 ${CONTACT_EMAIL}로 접수할 수 있습니다.</p>

      <h3>8. 개인정보 및 콘텐츠 보호</h3>
      <p>서비스는 데이터베이스 Row Level Security(RLS), 관리자 권한 검증, 작성자별 Storage 접근 제한, 익명 작성자 식별자 비공개 조회 구조, HTML 정화 및 링크·이미지 제한, 작성 빈도 제한 등의 기술적 조치를 적용하고 있습니다.</p>
      <p style="margin-top:8px">회원은 신분증, 계좌번호, 전화번호, 상세 주소, 고객 정보 등 불필요한 개인정보가 포함된 게시글이나 이미지를 업로드하지 않아야 합니다.</p>

      <h3>9. 방침의 변경</h3>
      <p>서비스 기능, 외부 서비스 또는 관련 운영 정책이 변경되는 경우 이 개인정보처리방침을 수정할 수 있으며, 중요한 변경사항은 공지사항 등을 통해 안내합니다.</p>

      <div class="ops-doc-note">시행일: ${EFFECTIVE_DATE} · 운영자: ${OPERATOR} · 개인정보/서비스 문의: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></div>
    `
  };

  const terms={
    title:'📄 이용약관',
    subtitle:'사장님도 퇴근합니다 서비스 이용에 적용되는 운영 약관입니다.',
    body:`
      <h3>제1조 목적</h3>
      <p>이 약관은 <b>사장님도 퇴근합니다</b> 커뮤니티(이하 “서비스”)의 이용 조건과 회원 및 운영자 사이의 기본적인 권리와 의무를 정하는 것을 목적으로 합니다.</p>
      <h3>제2조 서비스 내용</h3>
      <p>서비스는 자영업자와 사업 운영자가 경험과 고민을 나눌 수 있도록 회원 기능, 게시글, 댓글·대댓글, 반응, 신고, 알림, 이미지 업로드 및 관련 커뮤니티 기능을 제공합니다.</p>
      <h3>제3조 회원의 의무</h3>
      <p>회원은 타인의 개인정보 또는 권리를 침해하거나 서비스 운영을 방해해서는 안 되며, 커뮤니티 이용규칙과 관련 법령을 준수해야 합니다. 불법 콘텐츠, 악성코드·피싱, 반복 스팸·도배, 사기성 게시물, 저작권 침해 자료 등은 제한될 수 있습니다.</p>
      <h3>제4조 게시물과 이용자 콘텐츠</h3>
      <p>회원이 작성하거나 업로드한 게시글, 댓글, 이미지 등 콘텐츠의 책임은 원칙적으로 작성자에게 있습니다. 운영자는 신고 접수 또는 서비스 안전·운영상 필요한 경우 콘텐츠를 숨김, 삭제하거나 이용을 제한할 수 있습니다.</p>
      <h3>제5조 익명 기능</h3>
      <p>서비스의 익명 기능은 다른 일반 이용자 화면과 공개 조회 경로에서 작성자의 계정 식별자를 노출하지 않도록 운영됩니다. 다만 신고 처리, 법적 의무 이행, 보안 및 서비스 운영을 위해 필요한 범위에서는 권한이 있는 운영자가 관련 기록을 확인할 수 있습니다.</p>
      <h3>제6조 서비스 변경 및 중단</h3>
      <p>점검, 장애, 보안 문제, 시스템 변경 또는 기타 운영상 필요한 사유가 있는 경우 서비스의 일부 또는 전부가 변경되거나 일시적으로 중단될 수 있습니다.</p>
      <h3>제7조 회원 탈퇴</h3>
      <p>회원은 마이페이지에서 탈퇴할 수 있습니다. 탈퇴가 완료되면 계정과 해당 계정에 직접 연결된 프로필, 게시글·댓글, 반응, 신고, 알림 등의 커뮤니티 데이터와 본인이 업로드한 게시글 이미지가 삭제됩니다. 법령상 보존 의무가 있는 정보는 예외적으로 필요한 기간 동안 보관할 수 있습니다.</p>
      <h3>제8조 광고의 게재</h3>
      <p>서비스는 운영 비용 충당과 서비스 유지·개선을 위해 광고를 표시할 수 있습니다. 광고의 내용과 광고주가 제공하는 상품·서비스에 관한 사항은 관련 법령과 해당 광고주 또는 광고 사업자의 정책이 적용될 수 있습니다.</p>
      <h3>제9조 광고·쿠키 관련 데이터</h3>
      <p>광고 서비스 사용 시 쿠키 또는 유사 기술이 사용될 수 있으며, 구체적인 처리 내용과 이용자의 선택 방법은 개인정보처리방침에서 안내합니다.</p>
      <h3>제10조 이용 제한 및 운영 조치</h3>
      <p>이용규칙 위반, 반복적인 스팸·도배, 신고 악용, 보안 위협 또는 다른 이용자의 권리를 침해하는 행위가 확인될 경우 운영자는 콘텐츠 조치 또는 서비스 이용 제한 등 필요한 조치를 할 수 있습니다.</p>
      <h3>제11조 약관 변경</h3>
      <p>서비스 운영 방식이나 관련 정책의 변경에 따라 약관을 수정할 수 있으며, 중요한 변경사항과 적용 시점은 공지사항 등을 통해 안내합니다.</p>
      <h3>제12조 운영자 및 문의</h3>
      <p>운영자 표시명: <b>${OPERATOR}</b><br>서비스 및 개인정보 문의: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
      <div class="ops-doc-note">시행일: ${EFFECTIVE_DATE} · 운영자: ${OPERATOR}</div>
    `
  };

  const originalOpen=window.openOperatingDoc;

  function ensureModal(){
    let modal=document.getElementById('operatingDocModal');
    if(!modal&&typeof originalOpen==='function'){
      originalOpen('rules');
      if(typeof window.closeOperatingDoc==='function')window.closeOperatingDoc();
      modal=document.getElementById('operatingDocModal');
    }
    return modal;
  }

  function openFinal(doc){
    const modal=ensureModal();
    if(!modal)return;
    const title=document.getElementById('opsDocTitle');
    const subtitle=document.getElementById('opsDocSubtitle');
    const body=document.getElementById('opsDocBody');
    if(title)title.textContent=doc.title;
    if(subtitle)subtitle.textContent=doc.subtitle;
    if(body){body.innerHTML=doc.body;body.dataset.finalLegal='1';}
    modal.classList.add('open');
    document.body.style.overflow='hidden';
  }

  window.openOperatingDoc=function(type){
    if(type==='privacy')return openFinal(privacy);
    if(type==='terms')return openFinal(terms);
    if(typeof originalOpen==='function')return originalOpen(type);
  };

  function wireAdsCookieButton(){
    const buttons=[...document.querySelectorAll('button')].filter(b=>{
      const text=(b.textContent||'').trim();
      return b.dataset.adsCookieLink==='1'||text==='광고·쿠키 안내';
    });
    buttons.forEach(button=>{
      button.onclick=function(e){
        e?.preventDefault?.();
        e?.stopPropagation?.();
        window.openOperatingDoc('privacy');
        setTimeout(()=>document.getElementById('opsDocBody')?.querySelector('h3:nth-of-type(6)')?.scrollIntoView({block:'start'}),30);
      };
    });
  }

  function addFooterContact(){
    const inner=document.querySelector('.site-footer-inner');
    if(!inner||document.getElementById('finalOperatorContact'))return;
    const contact=document.createElement('div');
    contact.id='finalOperatorContact';
    contact.style.fontSize='12px';
    contact.style.lineHeight='1.6';
    contact.innerHTML=`운영자 ${OPERATOR} · 문의 <a href="mailto:${CONTACT_EMAIL}" style="color:inherit;text-decoration:underline">${CONTACT_EMAIL}</a>`;
    inner.appendChild(contact);
  }

  function install(){
    addFooterContact();
    wireAdsCookieButton();
  }

  install();
  setTimeout(install,100);
  setTimeout(install,500);
  setTimeout(install,1500);
})();
