/* 관리자 회원 상세 역할/상태 한글화 + 최근 활동 5개 표시 */
(function(){
  function roleKo(value){
    const v=String(value||"").toUpperCase();
    if(v==="ADMIN")return "관리자";
    if(v==="MODERATOR")return "운영자";
    if(v==="USER")return "일반회원";
    return value||"미확인";
  }

  function statusKo(value){
    const v=String(value||"").toUpperCase();
    if(v==="ACTIVE")return "정상";
    if(v==="SUSPENDED")return "정지";
    if(v==="BLOCKED")return "차단";
    if(v==="INACTIVE")return "비활성";
    return value||"미확인";
  }

  function localizeMemberDetail(){
    const box=document.getElementById("adminMemberDetail");
    if(!box)return;

    const profileLine=box.querySelector(".admin-member-profile p:last-child");
    if(profileLine){
      const text=profileLine.textContent||"";
      const roleMatch=text.match(/역할:\s*(ADMIN|MODERATOR|USER)/i);
      const statusMatch=text.match(/상태:\s*(ACTIVE|SUSPENDED|BLOCKED|INACTIVE)/i);
      if(roleMatch||statusMatch){
        const role=roleMatch?roleKo(roleMatch[1]):"미확인";
        const status=statusMatch?statusKo(statusMatch[1]):"미확인";
        profileLine.innerHTML=`<b>역할:</b> ${role}　<b>상태:</b> ${status}`;
      }
    }

    box.querySelectorAll(".admin-member-posts span").forEach(el=>{
      let html=el.innerHTML;
      html=html.replace(/\bACTIVE\b/g,"공개")
               .replace(/\bHIDDEN\b/g,"숨김")
               .replace(/\bDELETED\b/g,"삭제");
      el.innerHTML=html;
    });

    box.querySelectorAll(".admin-member-posts").forEach(list=>{
      const rows=Array.from(list.children).filter(el=>el.tagName==="DIV");
      rows.slice(5).forEach(el=>el.remove());
    });
  }

  const previousOpenAdminMemberDetail=window.openAdminMemberDetail;
  if(typeof previousOpenAdminMemberDetail==="function"){
    window.openAdminMemberDetail=async function(){
      const result=await previousOpenAdminMemberDetail.apply(this,arguments);
      localizeMemberDetail();
      return result;
    };
  }

  window.localizeAdminMemberDetail=localizeMemberDetail;
})();
