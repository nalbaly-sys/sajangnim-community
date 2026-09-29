/* ==================================================
   전역 변수
================================================== */

let currentUser = null;


/* ==================================================
   DOM 편의 함수
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
   로그인 / 회원가입 모달
================================================== */

function openLoginModal(){
  closeModal("signupModal");

  const modal = $("loginModal");

  if(modal){
    modal.style.display = "flex";
  }

  if($("loginMessage")){
    $("loginMessage").textContent = "";
  }
}


function openSignupModal(){
  closeModal("loginModal");

  const modal = $("signupModal");

  if(modal){
    modal.style.display = "flex";
  }

  if($("signupMessage")){
    $("signupMessage").textContent = "";
  }
}


function closeModal(id){
  const modal = $(id);

  if(modal){
    modal.style.display = "none";
  }
}


function closeModalOutside(event,id){
  if(event.target.id === id){
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
   메시지 표시
================================================== */

function showMessage(message,id){
  const element = $(id);

  if(element){
    element.textContent = message;
  }
}


/* ==================================================
   로그아웃
================================================== */

function logout(){

  currentUser = null;

  localStorage.removeItem("sajangnim_user");

  updateUserUI();

  showMessage(
    "로그아웃되었습니다.",
    "loginMessage"
  );
}


/* ==================================================
   로그인 상태 화면 처리
================================================== */

function updateUserUI(){

  const loggedIn = !!currentUser;

  if($("loginButton")){
    $("loginButton").style.display =
      loggedIn ? "none" : "inline-block";
  }

  if($("signupButton")){
    $("signupButton").style.display =
      loggedIn ? "none" : "inline-block";
  }

  if($("logoutButton")){
    $("logoutButton").style.display =
      loggedIn ? "inline-block" : "none";
  }

  if($("userInfo")){
    $("userInfo").style.display =
      loggedIn ? "block" : "none";
  }

  if(loggedIn){

    if($("userNickname")){
      $("userNickname").textContent =
        currentUser.nickname || "사장님";
    }

    if($("userBusinessType")){
      $("userBusinessType").textContent =
        currentUser.business_type || "업종 미등록";
    }
  }
}


/* ==================================================
   회원가입
   ※ 현재는 기본 입력 검사 단계
================================================== */

async function signup(){

  const email =
    $("signupEmail").value.trim();

  const password =
    $("signupPassword").value;

  const nickname =
    $("signupNickname").value.trim();

  const businessType =
    $("signupBusinessType").value;


  if(
    !email ||
    !password ||
    !nickname ||
    !businessType
  ){
    showMessage(
      "모든 항목을 입력해주세요.",
      "signupMessage"
    );

    return;
  }


  if(password.length < 6){

    showMessage(
      "비밀번호는 6자 이상 입력해주세요.",
      "signupMessage"
    );

    return;
  }


  showMessage(
    "회원가입 기능을 연결하는 중입니다.",
    "signupMessage"
  );
}


/* ==================================================
   로그인
   ※ 현재는 기본 입력 검사 단계
================================================== */

async function login(){

  const email =
    $("loginEmail").value.trim();

  const password =
    $("loginPassword").value;


  if(!email || !password){

    showMessage(
      "이메일과 비밀번호를 입력해주세요.",
      "loginMessage"
    );

    return;
  }


  showMessage(
    "로그인 기능을 연결하는 중입니다.",
    "loginMessage"
  );
}


/* ==================================================
   페이지 시작
================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    const saved =
      localStorage.getItem("sajangnim_user");


    if(saved){

      try{

        currentUser =
          JSON.parse(saved);

      }catch(error){

        currentUser = null;

      }
    }


    updateUserUI();
  }
);