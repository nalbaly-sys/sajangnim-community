/* ==================================================
   🌙 사장님도 퇴근합니다
   AUTH : 이메일 + Google
================================================== */

let currentUser=null;
let adminReportedTargetType=null;
let adminReportedTargetId=null;
let authSubscription=null;
let currentPostId=null;

/* ==================================================
   DOM
================================================== */

function $(id){return document.getElementById(id);}

/* ==================================================
   HOME
================================================== */

function showHome(){document.body.classList.remove("mypage-active");const page=$("myPageSection");if(page)page.style.display="none";window.scrollTo({top:0,behavior:"smooth"});}

/* ==================================================
   MODAL
================================================== */

function openLoginModal(){
  closeModal("signupModal");
  const modal=$("loginModal");
  if(modal)modal.style.display="flex";
  if($("loginMessage"))$("loginMessage").textContent="";
}

function openSignupModal(){
  closeModal("loginModal");
  const modal=$("signupModal");
  if(modal)modal.style.display="flex";
  if($("signupMessage"))$("signupMessage").textContent="";
}

function closeModal(id){
  const modal=$(id);
  if(modal)modal.style.display="none";
}

function closeModalOutside(event,id){
  if(event.target.id===id)closeModal(id);
}

function switchToLogin(){
  closeModal("signupModal");
  openLoginModal();
}

function switchToSignup(){
  closeModal("loginModal");
  openSignupModal();
}

/* ==================================================
   MESSAGE
================================================== */

function showMessage(message,id){
  const element=$(id);
  if(element)element.textContent=message;
}

/* ==================================================
   PROFILE 조회
================================================== */

async function getProfile(user){
  if(!user)return null;
  try{
    const {data,error}=await supabaseClient
      .from("profiles")
      .select("id,nickname,business_type,introduction,role,status")
      .eq("id",user.id)
      .maybeSingle();

    if(error){
      console.warn("profiles 조회 오류:",error);
      return null;
    }

    return data||null;
  }catch(error){
    console.warn("profiles 조회 예외:",error);
    return null;
  }
}

/* ==================================================
   SESSION USER 적용
================================================== */

async function applySessionUser(user){
  if(!user){
    currentUser=null;
    localStorage.removeItem("sajangnim_user");
    updateUserUI();
    return;
  }

  const profile=await getProfile(user);

  currentUser={
    id:user.id,
    email:user.email||"",
    nickname:profile?.nickname||user.user_metadata?.nickname||"사장님",
    business_type:profile?.business_type||user.user_metadata?.business_type||"업종 미등록",
    introduction:profile?.introduction||"",
    role:profile?.role||"USER",
    status:profile?.status||"ACTIVE"
  };

  localStorage.setItem("sajangnim_user",JSON.stringify(currentUser));
  updateUserUI();
}



/* 검색창 누락 시 자동 복구 */
function ensurePostSearchUI(){
  const section=$("postSection");
  const list=$("postList");
  if(!section||!list||section.querySelector(".post-search"))return;

  const box=document.createElement("div");
  box.className="post-search";
  box.innerHTML=`
    <input id="postSearchInput" type="search" placeholder="🔍 제목이나 내용으로 검색" onkeydown="if(event.key==='Enter')searchPosts()">
    <select id="postSearchCategory" onchange="searchPosts()">
      <option value="">전체 카테고리</option>
      <option value="오늘의 고충">🔥 오늘의 고충</option>
      <option value="웃픈 장사썰">😂 웃픈 장사썰</option>
      <option value="사장님 하소연">😭 사장님 하소연</option>
      <option value="장사 노하우">💡 장사 노하우</option>
      <option value="사장님 위로">❤️ 사장님 위로</option>
      <option value="자유게시판">🗣️ 자유게시판</option>
    </select>
    <select id="postSearchBusinessType" onchange="searchPosts()">
      <option value="">전체 업종</option>
      <option value="꽃집">🌸 꽃집</option>
      <option value="식당">🍚 식당</option>
      <option value="카페">☕ 카페</option>
      <option value="의류">👕 의류</option>
      <option value="미용">💇 미용</option>
      <option value="소매">🛍️ 소매</option>
      <option value="온라인">💻 온라인</option>
      <option value="서비스">🛠️ 서비스</option>
      <option value="기타">📦 기타</option>
    </select>
    <button type="button" onclick="searchPosts()">검색</button>
    <button type="button" onclick="resetPostSearch()">초기화</button>
  `;
  section.insertBefore(box,list);
}

/* 카테고리 버튼 클릭 기능 자동 복구 */
function ensureCategoryButtons(){
  const categories = [
    "오늘의 고충",
    "웃픈 장사썰",
    "사장님 하소연",
    "장사 노하우",
    "사장님 위로",
    "자유게시판"
  ];

  document.querySelectorAll(".category-grid button").forEach((btn, i) => {
    if(i >= categories.length) return;
    btn.type = "button";
    btn.onclick = function(){
      filterByCategory(categories[i]);
    };
  });
}

/* ==================================================
   USER UI
================================================== */

function updateUserUI(){
  ensurePostSearchUI();
  ensureCategoryButtons();
  ensureAdminEntry();
  ensureAdminPanel();

  // 구버전 HTML이 로그인/로그아웃 사이에 남아 있어도 이전 사용자 정보 카드를 제거
  const legacyUserInfo=$("userInfo");
  if(legacyUserInfo)legacyUserInfo.remove();
  document.querySelectorAll(".hero-buttons").forEach(el=>el.remove());

  // 기존 updateUserUI() 내용은 그대로 유지

  // 게시글 목록은 로그인하지 않아도 표시
  if(postSection){
    postSection.style.display="block";
  }

  const loggedIn=!!currentUser;
  const adminButton=$("adminPanelButton");
  if(adminButton)adminButton.style.display=isAdminUser()?"inline-flex":"none";

  if(!loggedIn){
    document.body.classList.remove("mypage-active");
    if($("myPageSection"))$("myPageSection").style.display="none";
  }

  if($("loginButton")){
    $("loginButton").style.display=loggedIn?"none":"inline-block";
  }

  if($("signupButton")){
    $("signupButton").style.display=loggedIn?"none":"inline-block";
  }

  if($("logoutButton")){
    $("logoutButton").style.display=loggedIn?"inline-block":"none";
  }

  if($("headerUserInfo")){
    $("headerUserInfo").style.display=loggedIn?"flex":"none";
  }

  if($("headerMyPageButton")){
    $("headerMyPageButton").style.display=loggedIn?"inline-flex":"none";
  }

  if(loggedIn){
    if($("headerUserNickname")){
      $("headerUserNickname").textContent=currentUser.nickname||"사장님";
    }

    if($("headerUserBusinessType")){
      $("headerUserBusinessType").textContent=currentUser.business_type||"기타";
    }
  }

  // 로그인 여부와 관계없이 게시글 목록 조회
  loadPosts();
}

/* ==================================================
   이메일 회원가입
================================================== */

async function signup(){
  const email=$("signupEmail")?.value.trim()||"";
  const password=$("signupPassword")?.value||"";
  const nickname=$("signupNickname")?.value.trim()||"";
  const businessType=$("signupBusinessType")?.value||"";

  if(!email||!password||!nickname||!businessType){
    showMessage("모든 항목을 입력해주세요.","signupMessage");
    return;
  }

  if(password.length<6){
    showMessage("비밀번호는 6자 이상 입력해주세요.","signupMessage");
    return;
  }

  showMessage("회원가입 처리 중입니다...","signupMessage");

  try{
    const {data,error}=await supabaseClient.auth.signUp({
      email:email,
      password:password,
      options:{
        data:{
          nickname:nickname,
          business_type:businessType
        }
      }
    });

    if(error){
      console.error("회원가입 오류:",error);

      let message=error.message||"회원가입에 실패했습니다.";
      const lower=message.toLowerCase();

      if(lower.includes("already registered")||lower.includes("already exists")){
        message="이미 가입된 이메일입니다.";
      }

      showMessage(message,"signupMessage");
      return;
    }

    if(!data||!data.user){
      showMessage("회원가입은 처리되었지만 사용자 정보를 확인할 수 없습니다.","signupMessage");
      return;
    }

    if(data.session){
      await applySessionUser(data.user);
      closeModal("signupModal");
      alert("회원가입이 완료되었습니다.");
    }else{
      showMessage(
        "회원가입이 완료되었습니다. 이메일 인증이 필요한 경우 이메일을 확인해주세요.",
        "signupMessage"
      );
    }
  }catch(error){
    console.error("회원가입 예외:",error);
    showMessage("회원가입 중 오류가 발생했습니다.","signupMessage");
  }
}

/* ==================================================
   이메일 로그인
================================================== */

async function login(){
  const email=$("loginEmail")?.value.trim()||"";
  const password=$("loginPassword")?.value||"";

  if(!email||!password){
    showMessage("이메일과 비밀번호를 입력해주세요.","loginMessage");
    return;
  }

  showMessage("로그인 처리 중입니다...","loginMessage");

  try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({
      email:email,
      password:password
    });

    if(error){
      console.error("로그인 오류:",error);

      let message=error.message||"로그인에 실패했습니다.";
      const lower=message.toLowerCase();

      if(lower.includes("invalid login credentials")){
        message="이메일 또는 비밀번호가 올바르지 않습니다.";
      }

      if(lower.includes("email not confirmed")){
        message="이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.";
      }

      showMessage(message,"loginMessage");
      return;
    }

    if(!data||!data.user){
      showMessage("로그인 사용자 정보를 확인할 수 없습니다.","loginMessage");
      return;
    }

    await applySessionUser(data.user);
    closeModal("loginModal");
  }catch(error){
    console.error("로그인 예외:",error);
    showMessage("로그인 중 오류가 발생했습니다.","loginMessage");
  }
}

/* ==================================================
   GOOGLE OAuth
================================================== */

async function loginWithGoogle(){
  try{
    showMessage("Google 로그인으로 이동합니다...","loginMessage");

    const {error}=await supabaseClient.auth.signInWithOAuth({
      provider:"google",
      options:{
        redirectTo:window.location.origin+window.location.pathname
      }
    });

    if(error){
      console.error("Google 로그인 오류:",error);
      showMessage("Google 로그인 오류: "+error.message,"loginMessage");
    }
  }catch(error){
    console.error("Google 로그인 예외:",error);
    showMessage("Google 로그인 중 오류가 발생했습니다.","loginMessage");
  }
}

/* ==================================================
   KAKAO OAuth
================================================== */

async function loginWithKakao(){
  const messageId=$("loginMessage")?"loginMessage":"signupMessage";
  try{
    showMessage("카카오 로그인으로 이동합니다...",messageId);
    const {error}=await supabaseClient.auth.signInWithOAuth({
      provider:"kakao",
      options:{
        redirectTo:window.location.origin+window.location.pathname
      }
    });
    if(error){
      console.error("카카오 로그인 오류:",error);
      showMessage("카카오 로그인 오류: "+error.message,messageId);
    }
  }catch(error){
    console.error("카카오 로그인 예외:",error);
    showMessage("카카오 로그인 중 오류가 발생했습니다.",messageId);
  }
}

/* ==================================================
   회원가입 화면
   Google 버튼 자동 생성
================================================== */

function createSocialSignupButtons(){
  const signupModal=$("signupModal");

  if(!signupModal||$("socialSignupBox"))return;

  const modalBox=signupModal.querySelector(".modal-box");
  if(!modalBox)return;

  const signupButton=modalBox.querySelector(".modal-submit");
  if(!signupButton)return;

  const box=document.createElement("div");
  box.id="socialSignupBox";
  box.style.marginTop="14px";
  box.style.display="flex";
  box.style.flexDirection="column";
  box.style.gap="8px";

  const divider=document.createElement("div");
  divider.textContent="또는";
  divider.style.textAlign="center";
  divider.style.margin="8px 0";
  divider.style.opacity="0.6";
  divider.style.fontSize="13px";
  box.appendChild(divider);

  const googleButton=document.createElement("button");
  googleButton.type="button";
  googleButton.textContent="🔵 Google로 회원가입";
  googleButton.className="modal-submit";
  googleButton.style.background="#ffffff";
  googleButton.style.color="#222";
  googleButton.style.border="1px solid #ddd";
  googleButton.onclick=loginWithGoogle;

  box.appendChild(googleButton);

  const kakaoButton=document.createElement("button");
  kakaoButton.type="button";
  kakaoButton.textContent="🟡 카카오로 회원가입";
  kakaoButton.className="modal-submit";
  kakaoButton.style.background="#FEE500";
  kakaoButton.style.color="#191919";
  kakaoButton.style.border="1px solid #E5CF00";
  kakaoButton.onclick=loginWithKakao;
  box.appendChild(kakaoButton);

  signupButton.insertAdjacentElement("afterend",box);
}

/* ==================================================
   로그인 화면
   Google 버튼 자동 생성
================================================== */

function createSocialLoginButtons(){
  const loginModal=$("loginModal");

  if(!loginModal||$("socialLoginBox"))return;

  const modalBox=loginModal.querySelector(".modal-box");
  if(!modalBox)return;

  const loginButton=modalBox.querySelector(".modal-submit");
  if(!loginButton)return;

  const box=document.createElement("div");
  box.id="socialLoginBox";
  box.style.marginTop="14px";
  box.style.display="flex";
  box.style.flexDirection="column";
  box.style.gap="8px";

  const divider=document.createElement("div");
  divider.textContent="또는";
  divider.style.textAlign="center";
  divider.style.margin="8px 0";
  divider.style.opacity="0.6";
  divider.style.fontSize="13px";
  box.appendChild(divider);

  const googleButton=document.createElement("button");
  googleButton.type="button";
  googleButton.textContent="🔵 Google로 로그인";
  googleButton.className="modal-submit";
  googleButton.style.background="#ffffff";
  googleButton.style.color="#222";
  googleButton.style.border="1px solid #ddd";
  googleButton.onclick=loginWithGoogle;

  box.appendChild(googleButton);

  const kakaoButton=document.createElement("button");
  kakaoButton.type="button";
  kakaoButton.textContent="🟡 카카오로 로그인";
  kakaoButton.className="modal-submit";
  kakaoButton.style.background="#FEE500";
  kakaoButton.style.color="#191919";
  kakaoButton.style.border="1px solid #E5CF00";
  kakaoButton.onclick=loginWithKakao;
  box.appendChild(kakaoButton);

  loginButton.insertAdjacentElement("afterend",box);
}

/* ==================================================
   로그아웃
================================================== */

async function logout(){
  try{
    const {error}=await supabaseClient.auth.signOut();

    if(error){
      console.error("로그아웃 오류:",error);
      return;
    }
  }catch(error){
    console.error("로그아웃 예외:",error);
  }finally{
    currentUser=null;
    localStorage.removeItem("sajangnim_user");
    updateUserUI();
  }
}

/* ==================================================
   AUTH 상태 감시
================================================== */

function setupAuthListener(){
  if(authSubscription)return;

  const result=supabaseClient.auth.onAuthStateChange(function(event,session){
    console.log("AUTH EVENT:",event);

    if(session&&session.user){
      setTimeout(function(){
        applySessionUser(session.user);
      },0);
    }else{
      currentUser=null;
      localStorage.removeItem("sajangnim_user");
      updateUserUI();
    }
  });

  if(result&&result.data&&result.data.subscription){
    authSubscription=result.data.subscription;
  }
}

/* ==================================================
   현재 세션 복구
================================================== */

async function restoreSession(){
  try{
    const {data,error}=await supabaseClient.auth.getSession();

    if(error){
      console.error("세션 확인 오류:",error);
      return;
    }

    if(data&&data.session&&data.session.user){
      await applySessionUser(data.session.user);
    }else{
      currentUser=null;
      localStorage.removeItem("sajangnim_user");
      updateUserUI();
    }
  }catch(error){
    console.error("세션 복구 오류:",error);
  }
}

/* ==================================================
   페이지 시작
================================================== */

document.addEventListener("DOMContentLoaded",async function(){
  setupAuthListener();
  updateUserUI();
  createSocialLoginButtons();
  createSocialSignupButtons();
  await restoreSession();
});

/* ==================================================
   마이페이지 기능
================================================== */
function openMyPage(){
  if(!currentUser){openLoginModal();return;}
  const section=$("myPageSection");
  document.body.classList.add("mypage-active");
  if(section)section.style.display="block";
  if($("mypageNickname"))$("mypageNickname").value=currentUser.nickname||"";
  if($("mypageBusinessType"))$("mypageBusinessType").value=currentUser.business_type||"";
  if($("mypageIntroduction"))$("mypageIntroduction").value=currentUser.introduction||"";
  loadMyPage();
  window.scrollTo({top:0,behavior:"smooth"});
}
function closeMyPage(){const section=$("myPageSection");if(section)section.style.display="none";document.body.classList.remove("mypage-active");window.scrollTo({top:0,behavior:"smooth"});}
async function loadMyPage(){
  if(!currentUser)return;
  const postsBox=$("mypagePosts"),commentsBox=$("mypageComments");
  if(postsBox)postsBox.innerHTML='<p class="mypage-empty">게시글을 불러오는 중...</p>';
  if(commentsBox)commentsBox.innerHTML='<p class="mypage-empty">댓글을 불러오는 중...</p>';
  try{
    const [pr,cr]=await Promise.all([
      supabaseClient.from("posts").select("id,category,business_type,title,content,view_count,created_at").eq("user_id",currentUser.id).eq("status","ACTIVE").order("created_at",{ascending:false}).limit(200),
      supabaseClient.from("comments").select("id,post_id,content,is_anonymous,created_at").eq("user_id",currentUser.id).eq("status","ACTIVE").order("created_at",{ascending:false}).limit(500)
    ]);
    if(pr.error)throw pr.error;if(cr.error)throw cr.error;
    const posts=pr.data||[],comments=cr.data||[];
    if($("mypagePostCount"))$("mypagePostCount").textContent=String(posts.length);
    if($("mypageCommentCount"))$("mypageCommentCount").textContent=String(comments.length);
    if(postsBox)postsBox.innerHTML=posts.length?posts.map(p=>'<article class="mypage-item"><div class="mypage-item-meta"><span>'+escapePostText(p.category||"")+'</span><span>'+formatPostDate(p.created_at)+'</span></div><h4>'+escapePostText(p.title||"")+'</h4><p>'+escapePostText((p.content||"").slice(0,180))+((p.content||"").length>180?"…":"")+'</p><div class="mypage-item-actions"><button type="button" onclick="editMyPostFromPage('+p.id+')">✏️ 수정</button><button type="button" class="mypage-item-delete" onclick="deleteMyPostFromPage('+p.id+')">🗑️ 삭제</button><button type="button" onclick="openPostDetail('+p.id+')">게시글 보기</button></div></article>').join(""):'<p class="mypage-empty">작성한 게시글이 없습니다.</p>';
    if(comments.length){
      const ids=[...new Set(comments.map(c=>c.post_id))],titleMap={};
      if(ids.length){const tr=await supabaseClient.from("posts").select("id,title").in("id",ids);if(!tr.error)(tr.data||[]).forEach(p=>titleMap[p.id]=p.title||"게시글");}
      if(commentsBox)commentsBox.innerHTML=comments.map(c=>'<article class="mypage-item"><div class="mypage-item-meta"><span>댓글</span><span>'+formatPostDate(c.created_at)+'</span></div><p>'+escapePostText(c.content||"")+'</p><small>게시글: '+escapePostText(titleMap[c.post_id]||"원본 게시글")+'</small><div class="mypage-item-actions"><button type="button" onclick="editMyCommentFromPage('+c.id+')">✏️ 수정</button><button type="button" class="mypage-item-delete" onclick="deleteMyCommentFromPage('+c.id+')">🗑️ 삭제</button><button type="button" onclick="openPostDetail('+c.post_id+')">게시글 보기</button></div></article>').join("");
    }else if(commentsBox)commentsBox.innerHTML='<p class="mypage-empty">작성한 댓글이 없습니다.</p>';
  }catch(error){console.error("마이페이지 조회 오류:",error);if(postsBox)postsBox.innerHTML='<p class="mypage-empty">내 게시글을 불러오지 못했습니다. 콘솔과 Supabase 권한을 확인해주세요.</p>';if(commentsBox)commentsBox.innerHTML='<p class="mypage-empty">내 댓글을 불러오지 못했습니다. 콘솔과 Supabase 권한을 확인해주세요.</p>';}
}
async function saveMyProfile(){
  if(!currentUser){openLoginModal();return;}
  const nickname=$("mypageNickname")?.value.trim()||"",businessType=$("mypageBusinessType")?.value||"",introduction=$("mypageIntroduction")?.value.trim()||"",message=$("mypageProfileMessage");
  if(!nickname){if(message)message.textContent="닉네임을 입력해주세요.";return;}
  if(nickname.length>20){if(message)message.textContent="닉네임은 20자 이하로 입력해주세요.";return;}
  if(introduction.length>300){if(message)message.textContent="소개글은 300자 이하로 입력해주세요.";return;}
  if(message)message.textContent="저장 중...";
  try{
    const {data,error}=await supabaseClient.from("profiles").update({nickname,business_type:businessType||null,introduction}).eq("id",currentUser.id).select("id,nickname,business_type,introduction").maybeSingle();
    if(error)throw error;if(!data)throw new Error("프로필을 수정할 수 없습니다. 본인 프로필 RLS 정책을 확인해주세요.");
    currentUser={...currentUser,nickname:data.nickname,business_type:data.business_type||"",introduction:data.introduction||""};localStorage.setItem("sajangnim_user",JSON.stringify(currentUser));updateUserUI();if(message)message.textContent="프로필이 저장되었습니다.";
  }catch(error){console.error("프로필 저장 오류:",error);if(message)message.textContent=error.message?.includes("introduction")?"소개글 열 설정이 필요합니다. 안내된 Supabase SQL을 먼저 실행해주세요.":"프로필 저장에 실패했습니다. Supabase 권한과 SQL 설정을 확인해주세요.";}
}
async function editMyPostFromPage(postId){
  if(!currentUser)return;
  try{
    const {data:p,error:fe}=await supabaseClient.from("posts").select("id,title,content").eq("id",postId).eq("user_id",currentUser.id).eq("status","ACTIVE").maybeSingle();
    if(fe)throw fe;if(!p){alert("본인이 작성한 게시글을 찾을 수 없습니다.");return;}
    const title=prompt("수정할 제목을 입력하세요.",p.title||"");if(title===null)return;
    const content=prompt("수정할 내용을 입력하세요.",p.content||"");if(content===null)return;
    if(title.trim().length<2||title.trim().length>100){alert("제목은 2~100자로 입력해주세요.");return;}
    if(content.trim().length<5){alert("내용은 5자 이상 입력해주세요.");return;}
    const {data,error}=await supabaseClient.from("posts").update({title:title.trim(),content:content.trim(),updated_at:new Date().toISOString()}).eq("id",postId).eq("user_id",currentUser.id).eq("status","ACTIVE").select("id").maybeSingle();
    if(error)throw error;if(!data){alert("게시글을 수정할 수 없습니다. 권한을 확인해주세요.");return;}alert("게시글이 수정되었습니다.");await Promise.all([loadMyPage(),loadPosts()]);
  }catch(error){console.error("내 게시글 수정 오류:",error);alert("게시글 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");}
}
async function deleteMyPostFromPage(postId){
  if(!currentUser)return;if(!confirm("이 게시글을 삭제할까요? 일반 목록에서 숨겨집니다."))return;
  try{const {data,error}=await supabaseClient.from("posts").update({status:"DELETED"}).eq("id",postId).eq("user_id",currentUser.id).eq("status","ACTIVE").select("id").maybeSingle();if(error)throw error;if(!data){alert("게시글을 삭제할 수 없습니다. 본인 게시글인지 확인해주세요.");return;}if(Number(currentPostId)===Number(postId))closePostDetail();alert("게시글이 삭제되었습니다.");await Promise.all([loadMyPage(),loadPosts()]);}
  catch(error){console.error("내 게시글 삭제 오류:",error);alert("게시글 삭제에 실패했습니다. Supabase 권한을 확인해주세요.");}
}
async function editMyCommentFromPage(commentId){
  if(!currentUser)return;
  try{
    const {data:c,error:fe}=await supabaseClient.from("comments").select("id,content").eq("id",commentId).eq("user_id",currentUser.id).eq("status","ACTIVE").maybeSingle();
    if(fe)throw fe;if(!c){alert("본인이 작성한 댓글을 찾을 수 없습니다.");return;}
    const answer=prompt("수정할 댓글 내용을 입력해주세요.",c.content||"");if(answer===null)return;const content=answer.trim();
    if(content.length<2||content.length>1000){alert("댓글은 2~1000자로 입력해주세요.");return;}
    const {data,error}=await supabaseClient.from("comments").update({content}).eq("id",commentId).eq("user_id",currentUser.id).eq("status","ACTIVE").select("id").maybeSingle();
    if(error)throw error;if(!data){alert("댓글을 수정할 수 없습니다. 권한을 확인해주세요.");return;}alert("댓글이 수정되었습니다.");await Promise.all([loadMyPage(),currentPostId?loadComments(currentPostId):Promise.resolve()]);
  }catch(error){console.error("내 댓글 수정 오류:",error);alert("댓글 수정에 실패했습니다. Supabase 권한을 확인해주세요.");}
}
async function deleteMyCommentFromPage(commentId){
  if(!currentUser)return;if(!confirm("이 댓글을 삭제할까요?"))return;
  try{const {data,error}=await supabaseClient.from("comments").update({status:"DELETED"}).eq("id",commentId).eq("user_id",currentUser.id).eq("status","ACTIVE").select("id").maybeSingle();if(error)throw error;if(!data){alert("댓글을 삭제할 수 없습니다. 본인 댓글인지 확인해주세요.");return;}alert("댓글이 삭제되었습니다.");await Promise.all([loadMyPage(),currentPostId?loadComments(currentPostId):Promise.resolve()]);}
  catch(error){console.error("내 댓글 삭제 오류:",error);alert("댓글 삭제에 실패했습니다. Supabase 권한을 확인해주세요.");}
}
async function changeMyPassword(){
  if(!currentUser){openLoginModal();return;}
  const password=$("mypageNewPassword")?.value||"",confirmPassword=$("mypageConfirmPassword")?.value||"",message=$("mypagePasswordMessage");
  if(password.length<6){if(message)message.textContent="새 비밀번호는 6자 이상이어야 합니다.";return;}
  if(password!==confirmPassword){if(message)message.textContent="두 비밀번호가 일치하지 않습니다.";return;}
  if(message)message.textContent="비밀번호 변경 중...";
  try{const {error}=await supabaseClient.auth.updateUser({password});if(error)throw error;$("mypageNewPassword").value="";$("mypageConfirmPassword").value="";if(message)message.textContent="비밀번호가 변경되었습니다.";}
  catch(error){console.error("비밀번호 변경 오류:",error);if(message)message.textContent="비밀번호 변경에 실패했습니다. 다시 로그인한 뒤 시도해주세요.";}
}
async function deleteMyAccount(){
  if(!currentUser){openLoginModal();return;}
  const phrase=prompt("회원 탈퇴를 진행하려면 '탈퇴'를 입력해주세요. 탈퇴 후에는 되돌릴 수 없습니다.");if(phrase!=="탈퇴")return;
  if(!confirm("정말 탈퇴하시겠습니까? 계정 삭제 요청을 진행합니다."))return;
  try{const {error}=await supabaseClient.rpc("delete_my_account");if(error)throw error;await supabaseClient.auth.signOut();currentUser=null;localStorage.removeItem("sajangnim_user");closeMyPage();updateUserUI();alert("회원 탈퇴가 완료되었습니다.");}
  catch(error){console.error("회원 탈퇴 오류:",error);alert("회원 탈퇴 설정이 완료되지 않았거나 처리에 실패했습니다. 안내된 Supabase SQL을 먼저 실행하고 다시 시도해주세요.");}
}

/* ==================================================
   POST : 게시글 작성 모달
================================================== */

function openPostModal(){
  if(!currentUser){
    openLoginModal();
    return;
  }

  const businessType=currentUser.business_type||"";
  const businessSelect=$("postBusinessType");
  const category=$("postCategory");
  const title=$("postTitle");
  const content=$("postContent");
  const anonymous=$("postAnonymous");
  const message=$("postMessage");

  if(businessSelect)businessSelect.value=businessType;
  if(category)category.value="오늘의 고충";
  if(title)title.value="";
  if(content)content.value="";
  if(anonymous)anonymous.checked=true;
  if(message)message.textContent="";

  const postModal=$("postModal");
  if(postModal)postModal.style.display="flex";
}

/* ==================================================
   POST : 게시글 등록
================================================== */

async function createPost(){
  if(!currentUser){
    openLoginModal();
    return;
  }

  const category=$("postCategory")?.value.trim();
  const businessType=$("postBusinessType")?.value.trim();
  const title=$("postTitle")?.value.trim();
  const content=$("postContent")?.value.trim();
  const isAnonymous=$("postAnonymous")?.checked===true;
  const message=$("postMessage");

  if(!category){
    if(message)message.textContent="카테고리를 선택해주세요.";
    return;
  }

  if(!businessType){
    if(message)message.textContent="업종을 선택해주세요.";
    return;
  }

  if(!title){
    if(message)message.textContent="제목을 입력해주세요.";
    return;
  }

  if(title.length<2){
    if(message)message.textContent="제목은 2자 이상 입력해주세요.";
    return;
  }

  if(!content){
    if(message)message.textContent="내용을 입력해주세요.";
    return;
  }

  if(content.length<5){
    if(message)message.textContent="내용은 5자 이상 입력해주세요.";
    return;
  }

  const submitButton=document.querySelector("#postModal .modal-submit");

  if(submitButton){
    submitButton.disabled=true;
    submitButton.textContent="등록 중...";
  }

  try{
    const {data,error}=await supabaseClient
      .from("posts")
      .insert({
        user_id:currentUser.id,
        category:category,
        business_type:businessType,
        title:title,
        content:content,
        is_anonymous:isAnonymous,
        view_count:0,
        status:"ACTIVE"
      })
      .select()
      .single();

    if(error){
      console.error("게시글 등록 오류:",error);

      if(message){
        message.textContent="게시글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.";
      }

      return;
    }

    console.log("게시글 등록 완료:",data);

    if(message){
      message.textContent="게시글이 등록되었습니다.";
    }

    await loadPosts();

    setTimeout(()=>{
      closeModal("postModal");
    },700);
  }catch(error){
    console.error("게시글 등록 예외:",error);

    if(message){
      message.textContent="오류가 발생했습니다.";
    }
  }finally{
    if(submitButton){
      submitButton.disabled=false;
      submitButton.textContent="게시글 등록하기";
    }
  }
}


/* ==================================================
   POST : 게시글 목록 및 검색
================================================== */
async function loadPosts(){
  await searchPosts();
}

async function searchPosts(){
  const postList=$("postList");
  if(!postList)return;

  const keyword=$("postSearchInput")?.value.trim()||"";
  const category=$("postSearchCategory")?.value||"";
  const businessType=$("postSearchBusinessType")?.value||"";

  postList.innerHTML='<div class="post-loading">게시글을 불러오는 중입니다...</div>';

  try{
    let query=supabaseClient
      .from("posts")
      .select("id,category,business_type,title,content,is_anonymous,view_count,created_at")
      .eq("status","ACTIVE");

    if(category)query=query.eq("category",category);
    if(businessType)query=query.eq("business_type",businessType);

    if(keyword){
      // 검색 필터 문법에 영향을 주는 문자는 제거하고 검색
      const safeKeyword=keyword.replace(/[,%()]/g," ").trim();
      if(safeKeyword){
        query=query.or(`title.ilike.%${safeKeyword}%,content.ilike.%${safeKeyword}%`);
      }
    }

    const {data,error}=await query
      .order("created_at",{ascending:false})
      .limit(100);

    if(error){
      console.error("게시글 검색 오류:",error);
      postList.innerHTML='<div class="post-empty">게시글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
      return;
    }

    if(!data||data.length===0){
      postList.innerHTML='<div class="post-empty">검색 결과가 없습니다.</div>';
      return;
    }

    postList.innerHTML=data.map(post=>{
      const safeCategory=escapePostText(post.category||"");
      const safeBusinessType=escapePostText(post.business_type||"");
      const safeTitle=escapePostText(post.title||"");
      const safeContent=escapePostText(post.content||"");
      const date=formatPostDate(post.created_at);
      const author=post.is_anonymous?"익명 사장님":"사장님";

      return `
        <article class="post-card" onclick="openPostDetail(${post.id})">
          <div class="post-card-top">
            <span class="post-category">${safeCategory}</span>
            <span class="post-business-type">${safeBusinessType}</span>
          </div>
          <h3 class="post-title">${safeTitle}</h3>
          <p class="post-preview">${safeContent}</p>
          <div class="post-card-bottom">
            <span>${author}</span>
            <span>👁️ ${post.view_count||0}</span>
            <span>${date}</span>
          </div>
        </article>
      `;
    }).join("");

  }catch(error){
    console.error("게시글 검색 예외:",error);
    postList.innerHTML='<div class="post-empty">검색 중 오류가 발생했습니다.</div>';
  }
}

/* 카테고리 버튼을 누르면 게시글 목록으로 이동해 필터 적용 */
function filterByCategory(category){
  const categoryInput=$("postSearchCategory");
  if(categoryInput)categoryInput.value=category;

  const postSection=$("postSection");
  if(postSection)postSection.scrollIntoView({behavior:"smooth",block:"start"});

  searchPosts();
}

/* 검색 조건 초기화 */
function resetPostSearch(){
  if($("postSearchInput"))$("postSearchInput").value="";
  if($("postSearchCategory"))$("postSearchCategory").value="";
  if($("postSearchBusinessType"))$("postSearchBusinessType").value="";
  searchPosts();
}

/* 기존 목록 새로고침용 함수와 호환 */
function refreshPosts(){
  searchPosts();
}

/* ==================================================
   POST : HTML 안전 처리
================================================== */

function escapePostText(value){
  return String(value)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

/* ==================================================
   POST : 날짜 표시
================================================== */

function formatPostDate(dateString){
  if(!dateString)return "";

  const date=new Date(dateString);

  if(isNaN(date.getTime()))return "";

  return date.toLocaleDateString("ko-KR",{
    year:"numeric",
    month:"2-digit",
    day:"2-digit"
  });
}

/* ==================================================
   POST : 게시글 상세보기
================================================== */

async function openPostDetail(postId){
  if(!postId)return;

  currentPostId=postId;

  const modal=$("postDetailModal");

  if(!modal){
    console.error("postDetailModal을 찾을 수 없습니다.");
    return;
  }

  $("detailCategory").textContent="";
  $("detailBusinessType").textContent="";
  $("detailTitle").textContent="";
  $("detailAuthor").textContent="";
  $("detailContent").textContent="";
  $("detailViewCount").textContent="불러오는 중...";
  const ownerPostActions=$("ownerPostActions");

  if(ownerPostActions){
    ownerPostActions.style.display="none";
  }

  $("reactionLike").textContent="0";
  $("reactionFunny").textContent="0";
  $("reactionSame").textContent="0";
  $("reactionAngry").textContent="0";
  $("reactionCheer").textContent="0";

  $("commentList").innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';
  $("commentContent").value="";
  $("commentMessage").textContent="";

  modal.style.display="flex";

  try{
    const {data:post,error}=await supabaseClient
      .from("posts")
      .select(`
        id,
        user_id,
        category,
        business_type,
        title,
        content,
        is_anonymous,
        view_count,
        created_at,
        status
      `)
      .eq("id",postId)
      .single();

    if(error){
      console.error("게시글 상세 조회 오류:",error);
      $("detailContent").textContent="게시글을 불러오지 못했습니다.";
      return;
    }

    if(!post){
      $("detailContent").textContent="게시글을 찾을 수 없습니다.";
      return;
    }
    if(post.status!=="ACTIVE"&&!isAdminUser()){
      $("detailContent").textContent="게시글을 찾을 수 없습니다.";
      return;
    }
    const detailModalContent=modal.querySelector(".post-detail-content")||modal.querySelector(".post-detail-card")||modal.firstElementChild;
    if(detailModalContent){detailModalContent.style.border=post.status==="HIDDEN"?"3px solid #dc2626":"";detailModalContent.style.background=post.status==="HIDDEN"?"#fff1f2":"";}
    if(adminReportedTargetType==="POST"&&String(adminReportedTargetId)===String(post.id)){
      $("detailTitle").textContent="🚨 신고 대상 게시글 · "+(post.title||"");
      if(detailModalContent){detailModalContent.style.border="4px solid #dc2626";detailModalContent.style.background="#fff1f2";}
    }
    $("detailCategory").textContent=post.category||"";
    $("detailBusinessType").textContent=post.business_type||"";
    $("detailTitle").textContent=post.title||"";
    $("detailAuthor").textContent=post.is_anonymous?"익명 사장님":"사장님";
    $("detailContent").textContent=post.content||"";
    if(
      ownerPostActions &&
      currentUser &&
      post.user_id===currentUser.id
    ){
      ownerPostActions.style.display="block";
    }

    const currentViewCount=Number(post.view_count||0);

    $("detailViewCount").textContent=`👁️ ${currentViewCount}`;

    const newViewCount=currentViewCount+1;

    const {error:viewError}=await supabaseClient
      .from("posts")
      .update({view_count:newViewCount})
      .eq("id",postId);

    if(viewError){
      console.warn("조회수 증가 실패:",viewError);
    }else{
      $("detailViewCount").textContent=`👁️ ${newViewCount}`;
    }

    await loadPostReactions(postId);
    await loadComments(postId);
  }catch(error){
    console.error("게시글 상세 예외:",error);
    $("detailContent").textContent="오류가 발생했습니다.";
  }
}

/* ==================================================
   POST : 상세창 닫기
================================================== */

function closePostDetail(){
  const modal=$("postDetailModal");

  if(modal)modal.style.display="none";

  currentPostId=null;
}

/* ==================================================
   POST : 바깥 영역 클릭 닫기
================================================== */

function closePostDetailOutside(event){
  if(event.target.id==="postDetailModal"){
    closePostDetail();
  }
}

/* ==================================================
   POST : 반응 조회
================================================== */

async function loadPostReactions(postId){
  const reactionMap={
    "공감":"reactionLike",
    "웃김":"reactionFunny",
    "나도 겪음":"reactionSame",
    "열받음":"reactionAngry",
    "힘내세요":"reactionCheer"
  };

  try{
    const {data,error}=await supabaseClient
      .from("reactions")
      .select("reaction_type")
      .eq("post_id",postId);

    if(error){
      console.error("반응 조회 오류:",error);
      return;
    }

    const counts={
      "공감":0,
      "웃김":0,
      "나도 겪음":0,
      "열받음":0,
      "힘내세요":0
    };

    (data||[]).forEach(row=>{
      if(Object.prototype.hasOwnProperty.call(counts,row.reaction_type)){
        counts[row.reaction_type]++;
      }
    });

    Object.keys(reactionMap).forEach(type=>{
      const element=$(reactionMap[type]);

      if(element){
        element.textContent=counts[type];
      }
    });
  }catch(error){
    console.error("반응 조회 예외:",error);
  }
}

/* ==================================================
   POST : 반응 등록
================================================== */

async function reactToPost(reactionType){
  if(!currentUser){
    alert("반응을 남기려면 로그인해주세요.");
    return;
  }

  if(!currentPostId)return;

  try{
    const {data:existing,error:checkError}=await supabaseClient
      .from("reactions")
      .select("id")
      .eq("post_id",currentPostId)
      .eq("user_id",currentUser.id)
      .eq("reaction_type",reactionType)
      .maybeSingle();

    if(checkError){
      console.error("반응 확인 오류:",checkError);
      return;
    }

    if(existing){
      const {error:deleteError}=await supabaseClient
        .from("reactions")
        .delete()
        .eq("id",existing.id);

      if(deleteError){
        console.error("반응 취소 오류:",deleteError);
        return;
      }
    }else{
      const {error:insertError}=await supabaseClient
        .from("reactions")
        .insert({
          post_id:currentPostId,
          user_id:currentUser.id,
          reaction_type:reactionType
        });

      if(insertError){
        console.error("반응 등록 오류:",insertError);
        return;
      }
    }

    await loadPostReactions(currentPostId);
  }catch(error){
    console.error("반응 처리 예외:",error);
  }
}

/* ==================================================
   POST : 댓글 목록 조회
================================================== */

async function loadComments(postId){
  const commentList=$("commentList");

  if(!commentList)return;

  commentList.innerHTML='<div class="post-loading">댓글을 불러오는 중입니다...</div>';

  try{
    const {data,error}=await supabaseClient
      .from("comments")
      .select(`
        id,
        post_id,
        user_id,
        content,
        is_anonymous,
        created_at,
        status
      `)
      .eq("post_id",postId)
      .order("created_at",{ascending:true});
    const visibleComments=isAdminUser()?(data||[]):(data||[]).filter(c=>c.status==="ACTIVE");

    if(error){
      console.error("댓글 조회 오류:",error);
      commentList.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';
      return;
    }

    if(!visibleComments||visibleComments.length===0){
      commentList.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';
      return;
    }

    commentList.innerHTML=visibleComments.map(comment=>{
      const content=escapePostText(comment.content||"");
      const author=comment.is_anonymous?"익명 사장님":"사장님";
      const date=formatPostDate(comment.created_at);

      const isMyComment=(
        currentUser &&
        comment.user_id===currentUser.id
      );

      const ownerButtons=isMyComment
        ?`
          <button
            type="button"
            class="comment-edit-button"
            onclick="editMyComment(${comment.id})"
          >✏️ 수정</button>
          <button
            type="button"
            class="comment-delete-button"
            onclick="deleteMyComment(${comment.id})"
          >🗑️ 삭제</button>
        `
        :"";

      const reportButton=(
        currentUser &&
        !isMyComment
      )
        ?`
          <button
            type="button"
            class="comment-report-button"
            onclick="reportComment(${comment.id})"
          >🚨 신고</button>
        `
        :"";

      const isReportedTarget=adminReportedTargetType==="COMMENT"&&String(adminReportedTargetId)===String(comment.id);
      const hiddenAdminComment=isAdminUser()&&comment.status!=="ACTIVE";
      return `
        <div id="admin-reported-comment-${adminEscape(comment.id)}" class="comment-item${isReportedTarget?" admin-reported-target":""}" style="${isReportedTarget||hiddenAdminComment?"border:3px solid #dc2626;background:#fff1f2;border-radius:12px;padding:12px;margin:10px 0;":""}">
          ${isReportedTarget?'<strong style="display:block;color:#b91c1c;margin-bottom:8px">🚨 신고 대상 댓글</strong>':""}${hiddenAdminComment?'<strong style="display:block;color:#b91c1c;margin-bottom:8px">숨김 댓글 · 관리자에게만 표시</strong>':""}
          <div class="comment-header">
            <span class="comment-author">${author}</span>
            <span class="comment-date">${date}</span>
          </div>
          <div class="comment-content">${content}</div>
          <div class="comment-actions">
            ${ownerButtons}
            ${reportButton}
          </div>
        </div>
      `;
    }).join("");

  }catch(error){
    console.error("댓글 조회 예외:",error);
    commentList.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';
  }
}

/* ==================================================
   POST : 본인 댓글 삭제
================================================== */

async function deleteMyComment(commentId){

  if(!currentUser){
    alert("댓글을 삭제하려면 로그인해주세요.");
    return;
  }

  if(!currentPostId){
    alert("댓글이 작성된 게시글을 찾을 수 없습니다.");
    return;
  }

  const confirmed=confirm(
    "이 댓글을 삭제하시겠습니까?\n\n" +
    "삭제한 댓글은 댓글 목록에서 표시되지 않습니다."
  );

  if(!confirmed)return;

  try{
    const {data,error}=await supabaseClient
      .from("comments")
      .update({
        status:"DELETED"
      })
      .eq("id",commentId)
      .eq("post_id",currentPostId)
      .eq("user_id",currentUser.id)
      .eq("status","ACTIVE")
      .select("id")
      .maybeSingle();

    if(error){
      console.error("댓글 삭제 오류:",error);

      alert(
        "댓글 삭제에 실패했습니다.\n" +
        "잠시 후 다시 시도해주세요."
      );

      return;
    }

    if(!data){
      alert(
        "댓글을 삭제할 수 없습니다.\n" +
        "본인이 작성한 댓글인지 확인해주세요."
      );

      return;
    }

    alert("댓글이 삭제되었습니다.");

    await loadComments(currentPostId);

  }catch(error){
    console.error("댓글 삭제 예외:",error);

    alert(
      "오류가 발생했습니다.\n" +
      "잠시 후 다시 시도해주세요."
    );
  }
}

/* ==================================================
   POST : 본인 댓글 수정
================================================== */

async function editMyComment(commentId){

  if(!currentUser){
    alert("댓글을 수정하려면 로그인해주세요.");
    return;
  }

  if(!currentPostId){
    alert("댓글이 작성된 게시글을 찾을 수 없습니다.");
    return;
  }

  try{
    const {data:comment,error:fetchError}=await supabaseClient
      .from("comments")
      .select("id,content")
      .eq("id",commentId)
      .eq("post_id",currentPostId)
      .eq("user_id",currentUser.id)
      .eq("status","ACTIVE")
      .maybeSingle();

    if(fetchError){
      console.error("댓글 조회 오류:",fetchError);
      alert("댓글을 불러오지 못했습니다.");
      return;
    }

    if(!comment){
      alert("본인이 작성한 댓글을 찾을 수 없습니다.");
      return;
    }

    const editedContent=prompt(
      "수정할 댓글 내용을 입력해주세요.",
      comment.content
    );

    if(editedContent===null)return;

    const content=editedContent.trim();

    if(content.length<2){
      alert("댓글은 2자 이상 입력해주세요.");
      return;
    }

    if(content.length>1000){
      alert("댓글은 1000자 이하로 입력해주세요.");
      return;
    }

    const {data,error}=await supabaseClient
      .from("comments")
      .update({
        content:content
      })
      .eq("id",commentId)
      .eq("post_id",currentPostId)
      .eq("user_id",currentUser.id)
      .eq("status","ACTIVE")
      .select("id")
      .maybeSingle();

    if(error){
      console.error("댓글 수정 오류:",error);
      alert("댓글 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if(!data){
      alert("댓글을 수정할 수 없습니다. 본인 댓글인지 확인해주세요.");
      return;
    }

    alert("댓글이 수정되었습니다.");

    await loadComments(currentPostId);

  }catch(error){
    console.error("댓글 수정 예외:",error);
    alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}


/* ==================================================
   신고 사유 선택 공통 함수
================================================== */
async function requestReportReason(targetLabel){
  const reasons = [
    "욕설·비방",
    "광고·도배",
    "개인정보 노출",
    "불쾌한 내용",
    "기타"
  ];

  const menu = reasons.map((reason, index) =>
    `${index + 1}. ${reason}`
  ).join("\n");

  const selected = prompt(
    `${targetLabel} 신고 사유를 선택해주세요.\n\n${menu}\n\n번호 1~5를 입력해주세요.`
  );

  if(selected === null) return null;

  const choice = selected.trim();
  if(!/^[1-5]$/.test(choice)){
    alert("1부터 5까지의 번호를 입력해주세요.");
    return null;
  }

  const reason = reasons[Number(choice) - 1];

  const detailInput = prompt(
    `선택한 사유: ${reason}\n\n추가 설명이 있다면 입력해주세요.\n없으면 비워두고 확인을 눌러주세요.`
  );

  if(detailInput === null) return null;

  const detail = detailInput.trim();

  if(detail.length > 500){
    alert("추가 설명은 500자 이하로 입력해주세요.");
    return null;
  }

  return { reason, detail: detail || null };
}


/* ==================================================
   POST : 다른 사람의 댓글 신고 및 중복 신고 방지
================================================== */
async function reportComment(commentId){
  if(!currentUser){
    alert("댓글을 신고하려면 로그인해주세요.");
    return;
  }

  if(!currentPostId){
    alert("신고할 댓글이 있는 게시글을 찾을 수 없습니다.");
    return;
  }

  try{
    // 현재 게시글에 있는 활성 댓글인지, 본인 댓글은 아닌지 확인
    const {data:comment,error:commentError}=await supabaseClient
      .from("comments")
      .select("id,user_id")
      .eq("id",commentId)
      .eq("post_id",currentPostId)
      .eq("status","ACTIVE")
      .maybeSingle();

    if(commentError){
      console.error("신고 대상 댓글 조회 오류:",commentError);
      alert("댓글 확인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if(!comment){
      alert("신고할 댓글을 찾을 수 없습니다.");
      return;
    }

    if(comment.user_id===currentUser.id){
      alert("본인이 작성한 댓글은 신고할 수 없습니다.");
      return;
    }

    const report = await requestReportReason("댓글");

    if(!report) return;

    // 댓글 신고 저장
    const {error}=await supabaseClient
      .from("reports")
      .insert({
        target_type:"COMMENT",
        target_id:commentId,
        reporter_id:currentUser.id,
        reason:report.reason,
        detail:report.detail,
        status:"PENDING"
      });

    if(error){
      console.error("댓글 신고 오류:",error);

      // DB의 UNIQUE 제약 조건으로 중복 신고 감지
      if(error.code==="23505"){
        alert(
          "이미 신고한 댓글입니다.\n\n"+
          "같은 댓글은 한 번만 신고할 수 있습니다."
        );
        return;
      }

      alert("신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    alert("신고가 접수되었습니다.\n관리자 확인 후 필요한 조치를 진행합니다.");

  }catch(error){
    console.error("댓글 신고 예외:",error);
    alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
}

/* ==================================================
   POST : 댓글 작성
================================================== */

async function submitComment(){
  if(!currentUser){
    alert("댓글을 작성하려면 로그인해주세요.");
    return;
  }

  if(!currentPostId)return;

  const contentElement=$("commentContent");
  const anonymousElement=$("commentAnonymous");
  const messageElement=$("commentMessage");

  if(!contentElement)return;

  const content=contentElement.value.trim();

  const isAnonymous=anonymousElement
    ?anonymousElement.checked===true
    :true;

  if(!content){
    if(messageElement){
      messageElement.textContent="댓글 내용을 입력해주세요.";
    }
    return;
  }

  if(content.length<2){
    if(messageElement){
      messageElement.textContent="댓글은 2자 이상 입력해주세요.";
    }
    return;
  }

  if(content.length>1000){
    if(messageElement){
      messageElement.textContent="댓글은 1000자 이하로 입력해주세요.";
    }
    return;
  }

  const submitButton=document.querySelector(".comment-write .modal-submit");

  if(submitButton){
    submitButton.disabled=true;
    submitButton.textContent="등록 중...";
  }

  if(messageElement){
    messageElement.textContent="";
  }

  try{
    const {data,error}=await supabaseClient
      .from("comments")
      .insert({
        post_id:currentPostId,
        user_id:currentUser.id,
        content:content,
        is_anonymous:isAnonymous,
        status:"ACTIVE"
      })
      .select()
      .single();

    if(error){
      console.error("댓글 등록 오류:",error);

      if(messageElement){
        messageElement.textContent="댓글 등록에 실패했습니다. 잠시 후 다시 시도해주세요.";
      }

      return;
    }

    console.log("댓글 등록 완료:",data);

    contentElement.value="";

    if(messageElement){
      messageElement.textContent="댓글이 등록되었습니다.";
    }

    await loadComments(currentPostId);
  }catch(error){
    console.error("댓글 등록 예외:",error);

    if(messageElement){
      messageElement.textContent="오류가 발생했습니다.";
    }
  }finally{
    if(submitButton){
      submitButton.disabled=false;
      submitButton.textContent="댓글 등록";
    }
  }
}

//==================================================
// 본인 게시글 삭제
//==================================================
async function deleteMyPost(){

  if(!currentUser){
    alert("게시글을 삭제하려면 로그인해주세요.");
    return;
  }

  if(!currentPostId){
    alert("삭제할 게시글을 찾을 수 없습니다.");
    return;
  }

  const confirmed=confirm(
    "이 게시글을 삭제하시겠습니까?\n\n" +
    "삭제한 게시글은 일반 게시글 목록에서 더 이상 표시되지 않습니다."
  );

  if(!confirmed)return;

  try{

    const {data,error}=await supabaseClient
      .from("posts")
      .update({
        status:"DELETED"
      })
      .eq("id",currentPostId)
      .eq("user_id",currentUser.id)
      .eq("status","ACTIVE")
      .select("id")
      .maybeSingle();

    if(error){

      console.error("게시글 삭제 오류:",error);

      alert(
        "게시글 삭제에 실패했습니다.\n" +
        "잠시 후 다시 시도해주세요."
      );

      return;
    }

    if(!data){

      alert(
        "게시글을 삭제할 수 없습니다.\n\n" +
        "본인이 작성한 게시글인지 확인해주세요."
      );

      return;
    }

    alert("게시글이 삭제되었습니다.");

    closePostDetail();

    await loadPosts();

  }catch(error){

    console.error("게시글 삭제 예외:",error);

    alert(
      "오류가 발생했습니다.\n" +
      "잠시 후 다시 시도해주세요."
    );
  }
}

//==================================================
// 게시글 신고
//==================================================
async function reportCurrentPost(){

  if(!currentUser){
    alert("게시글을 신고하려면 로그인해주세요.");
    return;
  }

  if(!currentPostId){
    alert("신고할 게시글을 찾을 수 없습니다.");
    return;
  }

  const report = await requestReportReason("게시글");

if(!report) return;

  try{

    const {error}=await supabaseClient
      .from("reports")
      .insert({
        target_type:"POST",
        target_id:currentPostId,
        reporter_id:currentUser.id,
        reason:report.reason,
        detail:report.detail,
        status:"PENDING"
      });

    if(error){

      console.error("게시글 신고 오류:",error);

      // 같은 사용자가 같은 게시글을 다시 신고한 경우
      if(error.code==="23505"){
        alert(
          "이미 신고한 게시글입니다.\n\n" +
          "같은 게시글은 한 번만 신고할 수 있습니다."
        );
        return;
      }

      alert(
        "신고 접수에 실패했습니다.\n" +
        "잠시 후 다시 시도해주세요."
      );

      return;
    }

    alert(
      "신고가 접수되었습니다.\n\n" +
      "관리자 확인 후 필요한 조치를 진행합니다."
    );

  }catch(error){

    console.error("게시글 신고 예외:",error);

    alert(
      "오류가 발생했습니다.\n" +
      "잠시 후 다시 시도해주세요."
    );
  }
}



/* ==================================================
   STEP 10: 관리자 시스템
   실제 데이터 권한은 Supabase RLS 정책으로 보호해야 합니다.
================================================== */
let adminCurrentTab="reports";
function isAdminUser(){return !!currentUser&&currentUser.status==="ACTIVE"&&["ADMIN","MODERATOR"].includes(String(currentUser.role||"").toUpperCase());}
function ensureAdminEntry(){
  const actions=document.querySelector(".header-actions")||document.querySelector("header")||document.querySelector(".header");
  if(!actions||$("adminPanelButton"))return;
  const btn=document.createElement("button");btn.id="adminPanelButton";btn.type="button";btn.className="header-button";btn.textContent="🛡️ 관리자";btn.style.display="none";btn.onclick=openAdminPanel;actions.appendChild(btn);
}
function ensureAdminPanel(){
  if($("adminPanelSection"))return;
  const main=document.querySelector("main")||document.body;
  const section=document.createElement("section");section.id="adminPanelSection";section.className="admin-panel-section";section.style.display="none";
  section.innerHTML=`<div class="admin-panel-heading"><div><p class="admin-eyebrow">ADMIN CONTROL</p><h2>🛡️ 관리자 대시보드</h2><p>신고·게시글·댓글·회원 관리</p></div><button type="button" onclick="closeAdminPanel()">사이트로 돌아가기 ✕</button></div><div class="admin-stat-grid"><article><span>대기 신고</span><strong id="adminPendingCount">-</strong></article><article><span>활성 게시글</span><strong id="adminActivePosts">-</strong></article><article><span>활성 댓글</span><strong id="adminActiveComments">-</strong></article><article><span>회원 수</span><strong id="adminMemberCount">-</strong></article></div><nav class="admin-tabs" aria-label="관리자 메뉴"><button type="button" data-admin-tab="reports" onclick="switchAdminTab('reports')">🚨 신고 관리</button><button type="button" data-admin-tab="posts" onclick="switchAdminTab('posts')">📝 게시글 관리</button><button type="button" data-admin-tab="comments" onclick="switchAdminTab('comments')">💬 댓글 관리</button><button type="button" data-admin-tab="members" onclick="switchAdminTab('members')">👥 회원 목록</button></nav><div id="adminPanelMessage" class="admin-message" role="status"></div><div id="adminPanelContent" class="admin-panel-content"></div><div id="adminMemberDetail" class="admin-member-detail" style="display:none"></div>`;
  const mypage=$("myPageSection");if(mypage&&mypage.parentNode===main)main.insertBefore(section,mypage);else main.appendChild(section);
}
function openAdminPanel(){
  if(!currentUser){openLoginModal();return;}if(!isAdminUser()){alert("관리자 권한이 필요합니다.");return;}
  ensureAdminPanel();document.body.classList.remove("mypage-active");const section=$("adminPanelSection");if(section)section.style.display="block";
  const mypage=$("myPageSection");if(mypage)mypage.style.display="none";const posts=$("postSection");if(posts)posts.style.display="none";
  document.body.classList.add("admin-active");loadAdminDashboard();switchAdminTab("reports");window.scrollTo({top:0,behavior:"smooth"});
}
function closeAdminPanel(){const section=$("adminPanelSection");if(section)section.style.display="none";document.body.classList.remove("admin-active");const posts=$("postSection");if(posts)posts.style.display="block";const mypage=$("myPageSection");if(mypage)mypage.style.display="none";window.scrollTo({top:0,behavior:"smooth"});}
function adminMessage(text){const el=$("adminPanelMessage");if(el)el.textContent=text||"";}
function adminEscape(value){return String(value==null?"":value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function switchAdminTab(tab){
  if(!isAdminUser())return;adminCurrentTab=tab;
  document.querySelectorAll(".admin-tabs [data-admin-tab]").forEach(btn=>{const active=btn.dataset.adminTab===tab;btn.classList.toggle("active",active);btn.setAttribute("aria-current",active?"page":"false");});
  const detail=$("adminMemberDetail");if(detail)detail.style.display="none";
  const box=$("adminPanelContent");if(box)box.style.display="grid";
  const loaders={reports:loadAdminReports,posts:loadAdminPosts,comments:loadAdminComments,members:loadAdminMembers};
  if(loaders[tab])loaders[tab]();
}
async function loadAdminDashboard(){
 if(!isAdminUser())return;
 const jobs=[["reports","adminPendingCount","PENDING"],["posts","adminActivePosts","ACTIVE"],["comments","adminActiveComments","ACTIVE"],["profiles","adminMemberCount",null]];
 for(const [table,id,status] of jobs){try{let q=supabaseClient.from(table).select("id",{count:"exact",head:true});if(status)q=q.eq("status",status);const {count,error}=await q;if(error)throw error;const el=$(id);if(el)el.textContent=String(count??0);}catch(e){console.warn("관리자 통계 조회 실패:",table,e);const el=$(id);if(el)el.textContent="확인 불가";}}
}
async function loadAdminReports(){
 if(!isAdminUser())return;adminMessage("신고 목록을 불러오는 중입니다.");const box=$("adminPanelContent");if(!box)return;
 try{
  const {data,error}=await supabaseClient.from("reports").select("id,target_type,target_id,reporter_id,reason,detail,status,created_at").order("created_at",{ascending:false}).limit(100);if(error)throw error;
  const rows=data||[],postIds=[...new Set(rows.filter(r=>r.target_type==="POST").map(r=>String(r.target_id)))],commentIds=[...new Set(rows.filter(r=>r.target_type==="COMMENT").map(r=>String(r.target_id)))];
  let postMap={},commentMap={};
  if(postIds.length){const q=await supabaseClient.from("posts").select("id,title,status").in("id",postIds);if(q.error)console.warn("신고 대상 게시글 제목 조회 실패:",q.error);else postMap=Object.fromEntries((q.data||[]).map(p=>[String(p.id),p]));}
  if(commentIds.length){const q=await supabaseClient.from("comments").select("id,post_id,content,status").in("id",commentIds);if(q.error)console.warn("신고 대상 댓글 내용 조회 실패:",q.error);else commentMap=Object.fromEntries((q.data||[]).map(c=>[String(c.id),c]));}
  const parentIds=[...new Set(Object.values(commentMap).map(c=>String(c.post_id)))],missingParentIds=parentIds.filter(id=>!postMap[id]);
  if(missingParentIds.length){const q=await supabaseClient.from("posts").select("id,title,status").in("id",missingParentIds);if(!q.error)for(const p of q.data||[])postMap[String(p.id)]=p;}
  box.innerHTML=rows.length?rows.map(r=>{
   const targetId=String(r.target_id),comment=r.target_type==="COMMENT"?commentMap[targetId]:null,post=r.target_type==="POST"?postMap[targetId]:(comment?postMap[String(comment.post_id)]:null);
   const targetTitle=r.target_type==="POST"?(post?post.title:"게시글 정보를 불러올 수 없음"):(comment?("댓글 내용: "+comment.content):"댓글 내용을 불러올 수 없음");
   const targetState=r.target_type==="COMMENT"?(comment?comment.status:"대상 확인 불가"):(post?post.status:"대상 확인 불가");
   const parentInfo=r.target_type==="COMMENT"?(comment?"원본 게시글: "+(post?post.title:"제목 조회 불가")+" · 게시글 ID: "+comment.post_id:"댓글 ID: "+targetId):"";
   const supported=["POST","COMMENT"].includes(r.target_type);
   return `<article class="admin-item"><div class="admin-item-head"><strong>신고 #${adminEscape(r.id)} · ${adminEscape(r.target_type==="POST"?"게시글 신고":r.target_type==="COMMENT"?"댓글 신고":r.target_type)}</strong><span class="admin-status">${adminEscape(r.status)}</span></div><p><b>신고 대상:</b> ${adminEscape(targetTitle)}</p>${parentInfo?`<p><b>${adminEscape(parentInfo)}</b></p>`:""}<p><b>대상 상태:</b> ${adminEscape(targetState)} · <b>대상 ID:</b> ${adminEscape(targetId)}</p><p><b>신고 사유:</b> ${adminEscape(r.reason)}</p><p><b>추가 설명:</b> ${adminEscape(r.detail||"없음")}</p><small>신고자 ID: ${adminEscape(r.reporter_id)} · ${adminEscape(formatPostDate(r.created_at))}</small><div class="admin-item-actions">${r.status==="PENDING"?`<button type="button" onclick="setReportStatus('${adminEscape(r.id)}','REJECTED')">신고 기각</button>${supported&&targetState==="ACTIVE"?`<button type="button" onclick="hideReportedTargetAndResolve('${adminEscape(r.target_type)}','${adminEscape(targetId)}','${adminEscape(r.id)}')">대상 숨김 + 처리 완료</button>`:""}<button type="button" onclick="setReportStatus('${adminEscape(r.id)}','RESOLVED')">처리 완료만</button>`:""}${r.target_type==="POST"?`<button type="button" onclick="adminViewReportedPost('${adminEscape(targetId)}')">게시글 확인</button>${targetState==="HIDDEN"?`<button type="button" onclick="restoreReportedPost('${adminEscape(targetId)}')">다시 공개</button>`:""}`:r.target_type==="COMMENT"&&comment?`<button type="button" onclick="adminViewComment('${adminEscape(targetId)}')">댓글 확인</button>`:""}</div></article>`;
  }).join(""):'<p class="admin-empty">접수된 신고가 없습니다.</p>';
  adminMessage("최근 신고 최대 100건을 표시합니다. 댓글 신고는 댓글 내용과 원본 게시글을 함께 표시합니다.");await loadAdminDashboard();
 }catch(e){console.error("관리자 신고 조회 오류:",e);box.innerHTML='<div class="admin-error"><strong>신고 목록 조회 실패</strong><p>Supabase가 reports 테이블 접근을 거부했거나 신고 데이터 조회 중 오류가 발생했습니다.</p><code>'+adminEscape(e.message||"permission denied")+'</code><p>RLS를 끄거나 공개 정책을 추가하지 마세요.</p></div>';adminMessage("신고 조회 오류: "+(e.message||"권한 오류"));}
}
async function hideReportedTargetAndResolve(type,targetId,reportId){
 if(!isAdminUser()||!["POST","COMMENT"].includes(type))return;
 const table=type==="POST"?"posts":"comments",label=type==="POST"?"게시글":"댓글";
 if(!confirm("신고 대상 "+label+"을 숨김 처리하고 신고 상태를 처리 완료로 바꿀까요?\n\n대상은 삭제되지 않으며 관리자 메뉴에서 다시 공개할 수 있습니다."))return;
 try{
  const target=await supabaseClient.from(table).update({status:"HIDDEN"}).eq("id",targetId).select("id").maybeSingle();
  if(target.error)throw target.error;if(!target.data)throw new Error("대상 숨김에 실패했습니다. "+label+" 관리 권한을 확인해주세요.");
  const report=await supabaseClient.from("reports").update({status:"RESOLVED"}).eq("id",reportId).select("id").maybeSingle();
  if(report.error)throw report.error;if(!report.data)throw new Error("대상은 숨겨졌지만 신고 상태 변경은 실패했습니다. 신고 관리에서 상태를 다시 변경해주세요.");
  adminMessage("신고 대상 "+label+"을 숨김 처리하고 신고를 처리 완료했습니다.");await loadAdminReports();await loadAdminDashboard();
 }catch(e){console.error("신고 대상 조치 실패:",e);adminMessage("신고 조치 중 오류: "+(e.message||"권한을 확인해주세요."));await loadAdminReports();}
}
async function restoreReportedPost(postId){
 if(!isAdminUser())return;
 if(!confirm("숨김 처리된 게시글을 다시 공개할까요? 신고 기록과 신고 상태는 그대로 유지됩니다."))return;
 try{const {data,error}=await supabaseClient.from("posts").update({status:"ACTIVE"}).eq("id",postId).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("게시글을 다시 공개하지 못했습니다. RLS 권한을 확인해주세요.");adminMessage("게시글을 다시 공개했습니다. 신고 기록은 유지됩니다.");await loadAdminReports();await loadAdminDashboard();await loadPosts();}
 catch(e){console.error("신고 게시글 재공개 실패:",e);adminMessage("다시 공개 실패: "+(e.message||"권한을 확인해주세요."));}
}
async function setReportStatus(id,status){
 if(!isAdminUser()||!["RESOLVED","REJECTED"].includes(status))return;if(!confirm(status==="RESOLVED"?"이 신고를 처리 완료로 변경할까요?":"이 신고를 기각할까요?"))return;
 try{const {data,error}=await supabaseClient.from("reports").update({status}).eq("id",id).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("수정된 행이 없습니다. RLS 권한을 확인해주세요.");adminMessage("신고 상태가 변경되었습니다.");await loadAdminReports();}
 catch(e){console.error("신고 상태 변경 실패:",e);adminMessage("신고 상태 변경 실패: "+(e.message||"권한을 확인해주세요."));}
}
async function loadAdminPosts(){
 if(!isAdminUser())return;adminMessage("게시글을 불러오는 중입니다.");const box=$("adminPanelContent");if(!box)return;
 try{const {data,error}=await supabaseClient.from("posts").select("id,title,category,business_type,status,created_at,user_id").order("created_at",{ascending:false}).limit(100);if(error)throw error;
 box.innerHTML=(data||[]).length?data.map(p=>`<article class="admin-item"><div class="admin-item-head"><strong>#${adminEscape(p.id)} · ${adminEscape(p.title)}</strong><span class="admin-status">${adminEscape(p.status)}</span></div><p>${adminEscape(p.category)} · ${adminEscape(p.business_type)} · ${adminEscape(formatPostDate(p.created_at))}</p><small>작성자 ID: ${adminEscape(p.user_id)}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${adminEscape(p.id)}')">게시글 보기</button>${p.status==="ACTIVE"?`<button type="button" onclick="setAdminContentStatus('posts','${adminEscape(p.id)}','HIDDEN')">숨김</button><button type="button" onclick="setAdminContentStatus('posts','${adminEscape(p.id)}','DELETED')">삭제 처리</button>`:p.status==="HIDDEN"?`<button type="button" onclick="setAdminContentStatus('posts','${adminEscape(p.id)}','ACTIVE')">다시 공개</button><button type="button" onclick="setAdminContentStatus('posts','${adminEscape(p.id)}','DELETED')">삭제 처리</button>`:p.status==="DELETED"?`<button type="button" onclick="setAdminContentStatus('posts','${adminEscape(p.id)}','ACTIVE')">복구</button>`:""}</div></article>`).join(""):'<p class="admin-empty">게시글이 없습니다.</p>';adminMessage("최근 게시글 최대 100건을 표시합니다.");}
 catch(e){console.error("관리자 게시글 조회 오류:",e);box.innerHTML='<p class="admin-empty">게시글 조회에 실패했습니다.</p>';adminMessage(e.message||"조회 실패");}
}
async function adminViewPost(id){if(!isAdminUser())return;adminReportedTargetType="POST";adminReportedTargetId=String(id);await openPostDetail(id);}
async function loadAdminComments(){
 if(!isAdminUser())return;adminMessage("댓글을 불러오는 중입니다.");const box=$("adminPanelContent");if(!box)return;
 try{const {data,error}=await supabaseClient.from("comments").select("id,post_id,user_id,content,status,created_at").order("created_at",{ascending:false}).limit(100);if(error)throw error;
 box.innerHTML=(data||[]).length?data.map(c=>`<article class="admin-item"><div class="admin-item-head"><strong>댓글 #${adminEscape(c.id)} · 게시글 #${adminEscape(c.post_id)}</strong><span class="admin-status">${adminEscape(c.status)}</span></div><p>${adminEscape(c.content)}</p><small>작성자 ID: ${adminEscape(c.user_id)} · ${adminEscape(formatPostDate(c.created_at))}</small><div class="admin-item-actions"><button type="button" onclick="adminViewPost('${adminEscape(c.post_id)}')">원본 게시글 보기</button>${c.status==="ACTIVE"?`<button type="button" onclick="setAdminContentStatus('comments','${adminEscape(c.id)}','HIDDEN')">숨김</button><button type="button" onclick="setAdminContentStatus('comments','${adminEscape(c.id)}','DELETED')">삭제 처리</button>`:c.status==="HIDDEN"?`<button type="button" onclick="setAdminContentStatus('comments','${adminEscape(c.id)}','ACTIVE')">다시 공개</button><button type="button" onclick="setAdminContentStatus('comments','${adminEscape(c.id)}','DELETED')">삭제 처리</button>`:""}</div></article>`).join(""):'<p class="admin-empty">댓글이 없습니다.</p>';adminMessage("최근 댓글 최대 100건을 표시합니다.");}
 catch(e){console.error("관리자 댓글 조회 오류:",e);box.innerHTML='<p class="admin-empty">댓글 조회에 실패했습니다.</p>';adminMessage(e.message||"조회 실패");}
}
async function setAdminContentStatus(table,id,status){
 if(!isAdminUser()||!["ACTIVE","HIDDEN","DELETED"].includes(status)||!["posts","comments"].includes(table))return;
 if(!confirm(`${table==="posts"?"게시글":"댓글"} 상태를 ${status}로 변경할까요?`))return;
 try{const {data,error}=await supabaseClient.from(table).update({status}).eq("id",id).select("id").maybeSingle();if(error)throw error;if(!data)throw new Error("수정된 행이 없습니다. RLS 권한을 확인해주세요.");adminMessage("상태가 변경되었습니다.");if(table==="posts")await loadAdminPosts();else await loadAdminComments();await loadAdminDashboard();if(table==="posts")await loadPosts();}
 catch(e){console.error("관리자 콘텐츠 상태 변경 실패:",e);adminMessage("상태 변경 실패: "+(e.message||"권한을 확인해주세요."));}
}
async function loadAdminMembers(){
 if(!isAdminUser())return;adminMessage("회원 목록을 불러오는 중입니다.");const box=$("adminPanelContent");if(!box)return;
 try{const {data,error}=await supabaseClient.from("profiles").select("id,nickname,business_type,role,status").order("nickname",{ascending:true}).limit(500);if(error)throw error;
 box.innerHTML='<div class="admin-member-tools"><input id="adminMemberSearch" type="search" placeholder="회원 ID 또는 닉네임 검색" oninput="filterAdminMembers()"><span id="adminMemberResultCount"></span></div><div id="adminMemberList" class="admin-member-list"></div>';
 const list=$("adminMemberList");if(list)list.innerHTML=(data||[]).length?data.map(p=>`<button type="button" class="admin-member-card" data-member-id="${adminEscape(p.id)}" data-member-nickname="${adminEscape(p.nickname||"")}" onclick="openAdminMemberDetail('${adminEscape(p.id)}')"><span><strong>${adminEscape(p.nickname||"닉네임 미설정")}</strong><small>${adminEscape(p.id)}</small></span><span class="admin-status">${adminEscape(p.role||"USER")} · ${adminEscape(p.status||"미확인")}</span></button>`).join(""):'<p class="admin-empty">회원이 없습니다.</p>';
 filterAdminMembers();adminMessage("회원 카드를 선택하면 활동 정보가 열립니다.");
 }catch(e){console.error("관리자 회원 조회 오류:",e);box.innerHTML='<p class="admin-empty">회원 목록을 불러오지 못했습니다.</p>';adminMessage(e.message||"조회 실패");}
}
function filterAdminMembers(){
 const input=$("adminMemberSearch");const query=(input?.value||"").trim().toLowerCase();let count=0;
 document.querySelectorAll("#adminMemberList .admin-member-card").forEach(card=>{const match=(card.dataset.memberId+" "+card.dataset.memberNickname).toLowerCase().includes(query);card.style.display=match?"flex":"none";if(match)count++;});
 const label=$("adminMemberResultCount");if(label)label.textContent=count+"명";
}
async function openAdminMemberDetail(userId){
 if(!isAdminUser())return;const box=$("adminMemberDetail"),list=$("adminPanelContent");if(!box)return;
 box.style.display="block";if(list)list.style.display="none";box.innerHTML='<p>회원 활동 정보를 불러오는 중...</p>';
 try{
  const [pr,po,co,re]=await Promise.all([
   supabaseClient.from("profiles").select("id,nickname,business_type,introduction,role,status").eq("id",userId).maybeSingle(),
   supabaseClient.from("posts").select("id,title,status,created_at").eq("user_id",userId).order("created_at",{ascending:false}),
   supabaseClient.from("comments").select("id,post_id,content,status,created_at").eq("user_id",userId).order("created_at",{ascending:false}),
   supabaseClient.from("reactions").select("id,reaction_type,post_id,created_at").eq("user_id",userId).order("created_at",{ascending:false})
  ]);
  if(pr.error)throw pr.error;if(po.error)throw po.error;if(co.error)throw co.error;if(re.error)throw re.error;
  const profile=pr.data;if(!profile)throw new Error("회원 프로필을 찾을 수 없습니다.");
  const posts=po.data||[],comments=co.data||[],reactions=re.data||[];
  const reactionCounts={"공감":0,"웃김":0,"나도 겪음":0,"열받음":0,"힘내세요":0};
  reactions.forEach(row=>{if(Object.prototype.hasOwnProperty.call(reactionCounts,row.reaction_type))reactionCounts[row.reaction_type]++;});
  let postReportCount="확인 불가",commentReportCount="확인 불가";
  try{
   const postIds=posts.map(p=>p.id),commentIds=comments.map(c=>c.id);
   if(postIds.length){const rr=await supabaseClient.from("reports").select("id").eq("target_type","POST").in("target_id",postIds);if(!rr.error)postReportCount=(rr.data||[]).length;}
   else postReportCount=0;
   if(commentIds.length){const rr=await supabaseClient.from("reports").select("id").eq("target_type","COMMENT").in("target_id",commentIds);if(!rr.error)commentReportCount=(rr.data||[]).length;}
   else commentReportCount=0;
  }catch(e){console.warn("회원 신고 수 조회 권한 확인 필요:",e);}
  box.innerHTML=`<div class="admin-member-detail-head"><button type="button" onclick="backToAdminMembers()">← 회원 목록</button><div><h3>${adminEscape(profile.nickname||"닉네임 미설정")}</h3><p>${adminEscape(profile.id)}</p></div></div>
  <div class="admin-member-detail-grid"><article><span>게시글</span><strong>${posts.length}</strong></article><article><span>댓글</span><strong>${comments.length}</strong></article><article><span>감정/공감 활동</span><strong>${reactions.length}</strong></article><article><span>본인 게시글 신고 수</span><strong>${postReportCount}</strong></article><article><span>댓글 신고 수</span><strong>${commentReportCount}</strong></article></div>
  <div class="admin-member-profile"><p><b>업종:</b> ${adminEscape(profile.business_type||"미등록")}</p><p><b>소개:</b> ${adminEscape(profile.introduction||"없음")}</p><p><b>역할:</b> ${adminEscape(profile.role||"USER")}　<b>상태:</b> ${adminEscape(profile.status||"미확인")}</p></div>
  <h4>감정/공감 활동 합계</h4><div class="admin-reaction-totals"><div>❤️ 공감 <strong>${reactionCounts["공감"]}</strong></div><div>😂 웃김 <strong>${reactionCounts["웃김"]}</strong></div><div>😭 나도 겪음 <strong>${reactionCounts["나도 겪음"]}</strong></div><div>😡 열받음 <strong>${reactionCounts["열받음"]}</strong></div><div>💪 힘내세요 <strong>${reactionCounts["힘내세요"]}</strong></div></div>
  <h4>최근 게시글</h4><div class="admin-member-posts">${posts.slice(0,20).map(p=>`<div><span>#${adminEscape(p.id)} · ${adminEscape(p.title||"제목 없음")} · ${adminEscape(p.status)} · ${adminEscape(formatPostDate(p.created_at))}</span><button type="button" onclick="adminViewPost('${adminEscape(p.id)}')">보기</button></div>`).join("")||"<p>게시글이 없습니다.</p>"}</div>
  <h4>최근 댓글</h4><div class="admin-member-posts">${comments.slice(0,20).map(c=>`<div><span>#${adminEscape(c.id)} · 게시글 #${adminEscape(c.post_id)} · ${adminEscape(c.content)} · ${adminEscape(c.status)} · ${adminEscape(formatPostDate(c.created_at))}</span><button type="button" onclick="adminViewPost('${adminEscape(c.post_id)}')">원본 보기</button></div>`).join("")||"<p>댓글이 없습니다.</p>"}</div>
  <div class="admin-danger-note"><b>강제 탈퇴</b><p>계정의 실제 탈퇴 처리는 Supabase Auth 사용자 삭제와 개인정보 처리까지 포함하므로 브라우저에서 직접 실행하지 않습니다. 보안 단계에서 서버 측 관리자 전용 기능으로 연결해야 합니다.</p></div>`;
  adminMessage("회원 상세 정보를 표시했습니다. 신고 수는 reports 테이블 권한에 따라 확인 불가로 표시될 수 있습니다.");
 }catch(e){console.error("회원 상세 조회 실패:",e);box.innerHTML='<div class="admin-error"><p>회원 활동 정보를 모두 불러오지 못했습니다.</p><code>'+adminEscape(e.message||"조회 실패")+'</code><button type="button" onclick="backToAdminMembers()">회원 목록으로</button></div>';adminMessage("회원 상세 조회 실패: "+(e.message||"권한 확인 필요"));}
}
function backToAdminMembers(){const box=$("adminMemberDetail"),list=$("adminPanelContent");if(box)box.style.display="none";if(list)list.style.display="grid";switchAdminTab("members");}
function adminOpenTarget(type,id){if(!isAdminUser())return;if(type==="POST"){adminViewPost(id);}else if(type==="COMMENT"){adminViewComment(id);}else{adminMessage("지원하지 않는 신고 대상 유형입니다: "+type);}}
async function adminViewComment(id){try{const {data,error}=await supabaseClient.from("comments").select("id,post_id,content,status").eq("id",id).maybeSingle();if(error)throw error;if(!data)throw new Error("댓글을 찾을 수 없습니다.");adminMessage("신고 댓글 #"+id+" · 상태: "+data.status+" · 내용: "+(data.content||"내용 없음"));adminReportedTargetType="COMMENT";adminReportedTargetId=String(id);await openPostDetail(data.post_id);setTimeout(()=>{const target=document.getElementById("admin-reported-comment-"+id);if(target)target.scrollIntoView({behavior:"smooth",block:"center"});},250);}catch(e){adminMessage("댓글 확인 실패: "+(e.message||"조회 오류"));}}
document.addEventListener("DOMContentLoaded",function(){ensureAdminEntry();ensureAdminPanel();});
