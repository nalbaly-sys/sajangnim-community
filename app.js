/* ==================================================
   🌙 사장님도 퇴근합니다
   AUTH : 이메일 + Google
================================================== */

let currentUser=null;
let authSubscription=null;
let currentPostId=null;

/* ==================================================
   DOM
================================================== */

function $(id){return document.getElementById(id);}

/* ==================================================
   HOME
================================================== */

function showHome(){window.scrollTo({top:0,behavior:"smooth"});}

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
      .select("id,nickname,business_type,role,status")
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
    role:profile?.role||"USER",
    status:profile?.status||"ACTIVE"
  };

  localStorage.setItem("sajangnim_user",JSON.stringify(currentUser));
  updateUserUI();
}

/* ==================================================
   USER UI
================================================== */

function updateUserUI(){
  const postSection=$("postSection");

  if(postSection){
    postSection.style.display=currentUser?"block":"none";
  }

  const loggedIn=!!currentUser;

  if($("loginButton")){
    $("loginButton").style.display=loggedIn?"none":"inline-block";
  }

  if($("signupButton")){
    $("signupButton").style.display=loggedIn?"none":"inline-block";
  }

  if($("logoutButton")){
    $("logoutButton").style.display=loggedIn?"inline-block":"none";
  }

  if($("userInfo")){
    $("userInfo").style.display=loggedIn?"block":"none";
  }

  if(loggedIn){
    loadPosts();

    if($("userNickname")){
      $("userNickname").textContent=currentUser.nickname||"사장님";
    }

    if($("userBusinessType")){
      $("userBusinessType").textContent=currentUser.business_type||"업종 미등록";
    }
  }
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
   POST : 게시글 목록 조회
================================================== */

async function loadPosts(){
  const postList=$("postList");

  if(!postList)return;

  postList.innerHTML='<div class="post-loading">게시글을 불러오는 중입니다...</div>';

  try{
    const {data,error}=await supabaseClient
      .from("posts")
      .select(`
        id,
        category,
        business_type,
        title,
        content,
        is_anonymous,
        view_count,
        created_at
      `)
      .eq("status","ACTIVE")
      .order("created_at",{ascending:false})
      .limit(20);

    if(error){
      console.error("게시글 목록 조회 오류:",error);
      postList.innerHTML='<div class="post-empty">게시글을 불러오지 못했습니다.</div>';
      return;
    }

    if(!data||data.length===0){
      postList.innerHTML='<div class="post-empty">아직 등록된 이야기가 없습니다.</div>';
      return;
    }

    postList.innerHTML=data.map(post=>{
      const category=escapePostText(post.category||"");
      const businessType=escapePostText(post.business_type||"");
      const title=escapePostText(post.title||"");
      const content=escapePostText(post.content||"");
      const date=formatPostDate(post.created_at);
      const author=post.is_anonymous?"익명 사장님":"사장님";

      return `
        <article class="post-card" onclick="openPostDetail(${post.id})">
          <div class="post-card-top">
            <span class="post-category">${category}</span>
            <span class="post-business-type">${businessType}</span>
          </div>
          <h3 class="post-title">${title}</h3>
          <p class="post-preview">${content}</p>
          <div class="post-card-bottom">
            <span>${author}</span>
            <span>👁️ ${post.view_count||0}</span>
            <span>${date}</span>
          </div>
        </article>
      `;
    }).join("");
  }catch(error){
    console.error("게시글 목록 예외:",error);
    postList.innerHTML='<div class="post-empty">게시글을 불러오지 못했습니다.</div>';
  }
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
        category,
        business_type,
        title,
        content,
        is_anonymous,
        view_count,
        created_at
      `)
      .eq("id",postId)
      .eq("status","ACTIVE")
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

    $("detailCategory").textContent=post.category||"";
    $("detailBusinessType").textContent=post.business_type||"";
    $("detailTitle").textContent=post.title||"";
    $("detailAuthor").textContent=post.is_anonymous?"익명 사장님":"사장님";
    $("detailContent").textContent=post.content||"";

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
        created_at
      `)
      .eq("post_id",postId)
      .eq("status","ACTIVE")
      .order("created_at",{ascending:true});

    if(error){
      console.error("댓글 조회 오류:",error);
      commentList.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';
      return;
    }

    if(!data||data.length===0){
      commentList.innerHTML='<div class="post-empty">아직 댓글이 없습니다.</div>';
      return;
    }

    commentList.innerHTML=data.map(comment=>{
      const content=escapePostText(comment.content||"");
      const author=comment.is_anonymous?"익명 사장님":"사장님";
      const date=formatPostDate(comment.created_at);

      return `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${author}</span>
            <span class="comment-date">${date}</span>
          </div>
          <div class="comment-content">${content}</div>
        </div>
      `;
    }).join("");
  }catch(error){
    console.error("댓글 조회 예외:",error);
    commentList.innerHTML='<div class="post-empty">댓글을 불러오지 못했습니다.</div>';
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
