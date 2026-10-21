/* ==================================================
   STEP 16: AdSense 승인 준비 - 운영문서/UGC 정책 보완
   - 실제 광고 코드는 AdSense Publisher ID 발급 후 적용
   - ads.txt 역시 실제 Publisher ID 확인 후 생성
================================================== */
(function(){
  const APPENDIX_VERSION='2026-10-21';

  function appendOnce(doc,id,html){
    if(!doc||document.getElementById(id))return;
    const box=document.createElement('div');
    box.id=id;
    box.dataset.adsenseReadiness='1';
    box.innerHTML=html;
    doc.appendChild(box);
  }

  function enhancePrivacy(modal){
    const doc=modal.querySelector('.ops-doc');
    appendOnce(doc,'adsensePrivacyAppendix',`
      <h3>7. 광고 서비스와 쿠키</h3>
      <p>서비스는 운영 과정에서 Google AdSense 등 제3자 광고 서비스를 사용할 수 있습니다. 광고가 적용되는 경우 Google 및 제3자 광고 사업자는 광고 제공, 광고 성과 측정, 부정 이용 방지 등을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.</p>
      <p style="margin-top:8px">Google은 이용자의 이 사이트 또는 다른 사이트 방문 기록을 바탕으로 맞춤 광고를 제공할 수 있습니다. 이용자는 <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer">Google 광고 설정</a>에서 맞춤 광고 설정을 확인하거나 변경할 수 있습니다.</p>
      <h3>8. 광고 관련 제3자 서비스</h3>
      <p>광고 서비스 도입 시 실제 사용 중인 광고 사업자와 처리 목적을 이 방침에 반영합니다. 제3자 광고 사업자가 자체 쿠키를 사용하는 경우 해당 사업자의 개인정보처리방침과 광고 설정 기능이 적용될 수 있습니다.</p>
      <h3>9. 쿠키 선택과 브라우저 설정</h3>
      <p>이용자는 브라우저 설정에서 쿠키 저장을 제한하거나 삭제할 수 있습니다. 다만 일부 쿠키를 차단하면 로그인 유지나 서비스 이용 편의 기능이 정상적으로 동작하지 않을 수 있습니다.</p>
      <div class="ops-doc-note">광고·쿠키 안내 보완 기준일: ${APPENDIX_VERSION} · 실제 AdSense 적용 전 Publisher 정보와 최종 운영 정책을 다시 확인합니다.</div>
    `);
  }

  function enhanceRules(modal){
    const doc=modal.querySelector('.ops-doc');
    appendOnce(doc,'adsenseRulesAppendix',`
      <h3>7. 광고 정책상 부적절한 콘텐츠를 게시하지 마세요.</h3>
      <p>성적으로 노골적인 콘텐츠, 불법 도박, 불법 약물·위험 물품 거래, 무기 판매·위험 행위 조장, 악성코드·피싱, 저작권 침해 자료의 불법 공유, 혐오·괴롭힘, 사기·스팸 등 법령 또는 서비스·광고 정책을 위반할 수 있는 콘텐츠는 제한될 수 있습니다.</p>
      <h3>8. 사용자 게시물은 운영 정책의 적용을 받습니다.</h3>
      <p>게시글, 댓글, 대댓글, 이미지 등 회원이 직접 작성한 콘텐츠도 이용규칙의 적용 대상입니다. 신고된 콘텐츠나 운영상 위험이 확인된 콘텐츠는 광고 노출 여부와 관계없이 숨김·삭제 등 조치가 이루어질 수 있습니다.</p>
    `);
  }

  function enhanceTerms(modal){
    const doc=modal.querySelector('.ops-doc');
    appendOnce(doc,'adsenseTermsAppendix',`
      <h3>제8조 광고의 게재</h3>
      <p>서비스는 운영 비용 충당과 서비스 유지·개선을 위해 광고를 표시할 수 있습니다. 광고의 내용과 광고주가 제공하는 상품·서비스에 관한 책임은 관련 법령 및 해당 광고주와 광고 사업자의 정책에 따릅니다.</p>
      <h3>제9조 광고 관련 데이터 처리</h3>
      <p>광고 서비스 사용 시 쿠키 등 기술이 이용될 수 있으며, 구체적인 처리 내용과 이용자의 선택 방법은 개인정보처리방침에서 안내합니다.</p>
    `);
  }

  function enhanceDocs(){
    document.querySelectorAll('.ops-modal').forEach(modal=>{
      const title=(modal.querySelector('h2')?.textContent||'').trim();
      if(title.includes('개인정보처리방침'))enhancePrivacy(modal);
      if(title.includes('커뮤니티 이용규칙'))enhanceRules(modal);
      if(title.includes('이용약관'))enhanceTerms(modal);
    });
  }

  function addFooterNoticeButton(){
    const links=document.querySelector('.site-footer-links');
    if(!links||links.querySelector('[data-ads-cookie-link="1"]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.dataset.adsCookieLink='1';
    button.textContent='광고·쿠키 안내';
    button.onclick=function(){
      enhanceDocs();
      const modal=[...document.querySelectorAll('.ops-modal')].find(m=>(m.querySelector('h2')?.textContent||'').includes('개인정보처리방침'));
      if(!modal)return;
      modal.classList.add('open');
      document.body.style.overflow='hidden';
      setTimeout(()=>document.getElementById('adsensePrivacyAppendix')?.scrollIntoView({block:'start'}),50);
    };
    links.appendChild(button);
  }

  function scan(){
    enhanceDocs();
    addFooterNoticeButton();
  }

  const observer=new MutationObserver(scan);
  function start(){
    scan();
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
