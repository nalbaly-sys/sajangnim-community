/* STEP 17: 최종 운영문서에 이전 AdSense 준비용 부록이 다시 붙는 것을 방지 */
(function(){
  ['adsensePrivacyAppendix','adsenseTermsAppendix'].forEach(id=>{
    if(document.getElementById(id))return;
    const marker=document.createElement('span');
    marker.id=id;
    marker.hidden=true;
    marker.dataset.finalLegalGuard='1';
    document.body.appendChild(marker);
  });
})();
