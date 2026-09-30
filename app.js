/* ==================================================
   🌙 사장님도 퇴근합니다
   AUTH : 이메일 + Google
================================================== */

let currentUser=null;
let authSubscription=null;


/* ==================================================
   DOM
================================================== */

function $(id){
  return document.getElementById(id);
}


/* ==================================================
   HOME
================================================== */

function showHome(){
  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}


/* ==================================================
   MODAL
================================================== */

function openLoginModal(){

  closeModal("signupModal");

  const modal=$("loginModal");

  if(modal){
    modal.style.display="flex";
  }

  if($("loginMessage")){
    $("loginMessage").textContent="";
  }
}


function openSignupModal(){

  closeModal("loginModal");

  const modal=$("signupModal");

  if(modal){
    modal.style.display="flex";
  }

  if($("signupMessage")){
    $("signupMessage").textContent="";
  }
}


function closeModal(id){

  const modal=$(id);

  if(modal){
    modal.style.display="none";
  }
}


function closeModalOutside(event,id){

  if(event.target.id===id){
    closeModal(id);
  }
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

  if(element){
    element.textContent=message;
  }
}


/* ==================================================
   PROFILE 조회
================================================== */

async function getProfile(user){

  if(!user){
    return null;
  }

  try{

    const {data,error}=await supabaseClient
      .from("profiles")
      .select(
        "id,nickname,business_type,role,status"
      )
      .eq("id",user.id)
      .maybeSingle();

    if(error){

      console.warn(
        "profiles 조회 오류:",
        error
      );

      return null;
    }

    return data||null;

  }catch(error){

    console.warn(
      "profiles 조회 예외:",
      error
    );

    return null;
  }
}


/* ==================================================
   SESSION USER 적용
================================================== */

async function applySessionUser(user){

  if(!user){

    currentUser=null;

    localStorage.removeItem(
      "sajangnim_user"
    );

    updateUserUI();

    return;
  }

  const profile=
    await getProfile(user);

  currentUser={

    id:user.id,

    email:user.email||"",

    nickname:
      profile?.nickname||
      user.user_metadata?.nickname||
      "사장님",

    business_type:
      profile?.business_type||
      user.user_metadata?.business_type||
      "업종 미등록",

    role:
      profile?.role||
      "USER",

    status:
      profile?.status||
      "ACTIVE"
  };

  localStorage.setItem(
    "sajangnim_user",
    JSON.stringify(currentUser)
  );

  updateUserUI();
}


/* ==================================================
   USER UI
================================================== */

function updateUserUI(){

  const loggedIn=!!currentUser;


  if($("loginButton")){

    $("loginButton").style.display=
      loggedIn
        ?"none"
        :"inline-block";
  }


  if($("signupButton")){

    $("signupButton").style.display=
      loggedIn
        ?"none"
        :"inline-block";
  }


  if($("logoutButton")){

    $("logoutButton").style.display=
      loggedIn
        ?"inline-block"
        :"none";
  }


  if($("userInfo")){

    $("userInfo").style.display=
      loggedIn
        ?"block"
        :"none";
  }


  if(loggedIn){

    if($("userNickname")){

      $("userNickname").textContent=
        currentUser.nickname||
        "사장님";
    }


    if($("userBusinessType")){

      $("userBusinessType").textContent=
        currentUser.business_type||
        "업종 미등록";
    }
  }
}


/* ==================================================
   이메일 회원가입
================================================== */

async function signup(){

  const email=
    $("signupEmail")
      ?$("signupEmail").value.trim()
      :"";

  const password=
    $("signupPassword")
      ?$("signupPassword").value
      :"";

  const nickname=
    $("signupNickname")
      ?$("signupNickname").value.trim()
      :"";

  const businessType=
    $("signupBusinessType")
      ?$("signupBusinessType").value
      :"";


  if(
    !email||
    !password||
    !nickname||
    !businessType
  ){

    showMessage(
      "모든 항목을 입력해주세요.",
      "signupMessage"
    );

    return;
  }


  if(password.length<6){

    showMessage(
      "비밀번호는 6자 이상 입력해주세요.",
      "signupMessage"
    );

    return;
  }


  showMessage(
    "회원가입 처리 중입니다...",
    "signupMessage"
  );


  try{

    const {data,error}=
      await supabaseClient.auth.signUp({

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

      console.error(
        "회원가입 오류:",
        error
      );

      let message=
        error.message||
        "회원가입에 실패했습니다.";


      const lower=
        message.toLowerCase();


      if(
        lower.includes("already registered")||
        lower.includes("already exists")
      ){

        message=
          "이미 가입된 이메일입니다.";
      }


      showMessage(
        message,
        "signupMessage"
      );

      return;
    }


    if(
      !data||
      !data.user
    ){

      showMessage(
        "회원가입은 처리되었지만 사용자 정보를 확인할 수 없습니다.",
        "signupMessage"
      );

      return;
    }


    if(data.session){

      await applySessionUser(
        data.user
      );

      closeModal(
        "signupModal"
      );

      alert(
        "회원가입이 완료되었습니다."
      );

    }else{

      showMessage(
        "회원가입이 완료되었습니다. 이메일 인증이 필요한 경우 이메일을 확인해주세요.",
        "signupMessage"
      );
    }


  }catch(error){

    console.error(
      "회원가입 예외:",
      error
    );

    showMessage(
      "회원가입 중 오류가 발생했습니다.",
      "signupMessage"
    );
  }
}


/* ==================================================
   이메일 로그인
================================================== */

async function login(){

  const email=
    $("loginEmail")
      ?$("loginEmail").value.trim()
      :"";

  const password=
    $("loginPassword")
      ?$("loginPassword").value
      :"";


  if(
    !email||
    !password
  ){

    showMessage(
      "이메일과 비밀번호를 입력해주세요.",
      "loginMessage"
    );

    return;
  }


  showMessage(
    "로그인 처리 중입니다...",
    "loginMessage"
  );


  try{

    const {data,error}=
      await supabaseClient.auth.signInWithPassword({

        email:email,

        password:password
      });


    if(error){

      console.error(
        "로그인 오류:",
        error
      );

      let message=
        error.message||
        "로그인에 실패했습니다.";


      const lower=
        message.toLowerCase();


      if(
        lower.includes(
          "invalid login credentials"
        )
      ){

        message=
          "이메일 또는 비밀번호가 올바르지 않습니다.";
      }


      if(
        lower.includes(
          "email not confirmed"
        )
      ){

        message=
          "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.";
      }


      showMessage(
        message,
        "loginMessage"
      );

      return;
    }


    if(
      !data||
      !data.user
    ){

      showMessage(
        "로그인 사용자 정보를 확인할 수 없습니다.",
        "loginMessage"
      );

      return;
    }


    await applySessionUser(
      data.user
    );

    closeModal(
      "loginModal"
    );


  }catch(error){

    console.error(
      "로그인 예외:",
      error
    );

    showMessage(
      "로그인 중 오류가 발생했습니다.",
      "loginMessage"
    );
  }
}


/* ==================================================
   GOOGLE OAuth
================================================== */

async function loginWithGoogle(){

  try{

    showMessage(
      "Google 로그인으로 이동합니다...",
      "loginMessage"
    );


    const {error}=
      await supabaseClient.auth.signInWithOAuth({

        provider:"google",

        options:{

          redirectTo:
            window.location.origin+
            window.location.pathname
        }
      });


    if(error){

      console.error(
        "Google 로그인 오류:",
        error
      );

      showMessage(
        "Google 로그인 오류: "+
        error.message,
        "loginMessage"
      );
    }


  }catch(error){

    console.error(
      "Google 로그인 예외:",
      error
    );

    showMessage(
      "Google 로그인 중 오류가 발생했습니다.",
      "loginMessage"
    );
  }
}

/* ==================================================
   회원가입 화면
   Google / Kakao 버튼 자동 생성
================================================== */

function createSocialSignupButtons(){

  const signupModal=
    $("signupModal");

  if(!signupModal){
    return;
  }


  if($("socialSignupBox")){
    return;
  }


  const modalBox=
    signupModal.querySelector(
      ".modal-box"
    );

  if(!modalBox){
    return;
  }


  const signupButton=
    modalBox.querySelector(
      ".modal-submit"
    );

  if(!signupButton){
    return;
  }


  const box=
    document.createElement(
      "div"
    );

  box.id=
    "socialSignupBox";


  box.style.marginTop=
    "14px";

  box.style.display=
    "flex";

  box.style.flexDirection=
    "column";

  box.style.gap=
    "8px";


  const divider=
    document.createElement(
      "div"
    );

  divider.textContent=
    "또는";

  divider.style.textAlign=
    "center";

  divider.style.margin=
    "8px 0";

  divider.style.opacity=
    "0.6";

  divider.style.fontSize=
    "13px";


  box.appendChild(
    divider
  );


  /* Google 회원가입 */

  const googleButton=
    document.createElement(
      "button"
    );

  googleButton.type=
    "button";

  googleButton.textContent=
    "🔵 Google로 회원가입";

  googleButton.className=
    "modal-submit";

  googleButton.style.background=
    "#ffffff";

  googleButton.style.color=
    "#222";

  googleButton.style.border=
    "1px solid #ddd";

  googleButton.onclick=
    loginWithGoogle;


  box.appendChild(
    googleButton
  );

  signupButton.insertAdjacentElement(
    "afterend",
    box
  );
}


/* ==================================================
   로그인 화면
   Google / Kakao 버튼 자동 생성
================================================== */

function createSocialLoginButtons(){

  const loginModal=
    $("loginModal");

  if(!loginModal){
    return;
  }


  if($("socialLoginBox")){
    return;
  }


  const modalBox=
    loginModal.querySelector(
      ".modal-box"
    );

  if(!modalBox){
    return;
  }


  const loginButton=
    modalBox.querySelector(
      ".modal-submit"
    );

  if(!loginButton){
    return;
  }


  const box=
    document.createElement(
      "div"
    );

  box.id=
    "socialLoginBox";


  box.style.marginTop=
    "14px";

  box.style.display=
    "flex";

  box.style.flexDirection=
    "column";

  box.style.gap=
    "8px";


  const divider=
    document.createElement(
      "div"
    );

  divider.textContent=
    "또는";

  divider.style.textAlign=
    "center";

  divider.style.margin=
    "8px 0";

  divider.style.opacity=
    "0.6";

  divider.style.fontSize=
    "13px";


  box.appendChild(
    divider
  );


  /* Google 로그인 */

  const googleButton=
    document.createElement(
      "button"
    );

  googleButton.type=
    "button";

  googleButton.textContent=
    "🔵 Google로 로그인";

  googleButton.className=
    "modal-submit";

  googleButton.style.background=
    "#ffffff";

  googleButton.style.color=
    "#222";

  googleButton.style.border=
    "1px solid #ddd";

  googleButton.onclick=
    loginWithGoogle;


  box.appendChild(
    googleButton
  );


  loginButton.insertAdjacentElement(
    "afterend",
    box
  );
}


/* ==================================================
   로그아웃
================================================== */

async function logout(){

  try{

    const {error}=
      await supabaseClient.auth.signOut();


    if(error){

      console.error(
        "로그아웃 오류:",
        error
      );

      return;
    }


  }catch(error){

    console.error(
      "로그아웃 예외:",
      error
    );


  }finally{

    currentUser=null;

    localStorage.removeItem(
      "sajangnim_user"
    );

    updateUserUI();
  }
}


/* ==================================================
   AUTH 상태 감시
================================================== */

function setupAuthListener(){

  if(authSubscription){
    return;
  }


  const result=
    supabaseClient.auth.onAuthStateChange(

      function(event,session){

        console.log(
          "AUTH EVENT:",
          event
        );


        if(
          session&&
          session.user
        ){

          setTimeout(

            function(){

              applySessionUser(
                session.user
              );

            },

            0
          );


        }else{

          currentUser=null;

          localStorage.removeItem(
            "sajangnim_user"
          );

          updateUserUI();
        }
      }
    );


  if(
    result&&
    result.data&&
    result.data.subscription
  ){

    authSubscription=
      result.data.subscription;
  }
}


/* ==================================================
   현재 세션 복구
================================================== */

async function restoreSession(){

  try{

    const {data,error}=
      await supabaseClient.auth.getSession();


    if(error){

      console.error(
        "세션 확인 오류:",
        error
      );

      return;
    }


    if(
      data&&
      data.session&&
      data.session.user
    ){

      await applySessionUser(
        data.session.user
      );


    }else{

      currentUser=null;

      localStorage.removeItem(
        "sajangnim_user"
      );

      updateUserUI();
    }


  }catch(error){

    console.error(
      "세션 복구 오류:",
      error
    );
  }
}


/* ==================================================
   페이지 시작
================================================== */

document.addEventListener(

  "DOMContentLoaded",

  async function(){

    setupAuthListener();

    updateUserUI();

    createSocialLoginButtons();

    createSocialSignupButtons();

    await restoreSession();
  }
);