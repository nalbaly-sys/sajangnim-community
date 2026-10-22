/* ==================================================
   운영센터 정리
   - 운영센터 내부 이용규칙/개인정보처리방침/이용약관 버튼 제거
   - 문서 자체와 푸터 링크는 유지
================================================== */
(function(){
  function apply(){
    const section=document.getElementById('operationsSection');
    if(!section)return;
    section.querySelector('.ops-links')?.remove();
    const head=section.querySelector('.ops-section-head p');
    if(head)head.textContent='커뮤니티 운영 소식, 주요 변경사항과 이벤트를 안내합니다.';
  }
  apply();
  setTimeout(apply,100);
  setTimeout(apply,500);
})();
