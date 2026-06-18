// Firebase configuration (provided in prompt)
const firebaseConfig = {
  apiKey: "AIzaSyAZsGLAoR5Agwm4VlSa5kiJbpKPYoPhOmg",
  authDomain: "past-temp.firebaseapp.com",
  projectId: "past-temp",
  storageBucket: "past-temp.firebasestorage.app",
  messagingSenderId: "1054323376412",
  appId: "1:1054323376412:web:7db6fc98c3817c9052bad9",
  measurementId: "G-6RRCYZYQ2P"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics(app);
const db = firebase.firestore(app);

// Application State
let currentUser = JSON.parse(localStorage.getItem("past_operator")) || null;
let isAdminAuthenticated = localStorage.getItem("past_admin_auth") === "true";

// Quiz State
let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = []; // stores { questionId, selectedOption, isCorrect }
let quizStartTime = null;
let quizTimerInterval = null;
let quizTimeElapsed = 0; // in ms

// Default Questions Data to seed if collection is empty
const defaultQuestions = [
  {
    text: "Khi thấy xe cứu thương đang phát tín hiệu ưu tiên đi làm nhiệm vụ, người tham gia giao thông phải thực hiện hành động nào?",
    desc: "Đảm bảo tuân thủ nghiêm ngặt Luật giao thông đường bộ về quyền nhường đường xe ưu tiên.",
    options: {
      A: "Tăng tốc độ để chạy nhanh trước xe cứu thương.",
      B: "Giảm tốc độ, tránh sát lề đường bên phải hoặc dừng lại nhường đường, tuyệt đối không cản trở.",
      C: "Bấm còi liên tục và chạy song song để dẫn đường hộ tống.",
      D: "Chuyển sang làn đường bên trái để nhường làn bên phải cho xe cấp cứu."
    },
    correct: "B"
  },
  {
    text: "Quy trình sơ cứu ban đầu chuẩn xác nhất khi phát hiện một người bị ngạt nước (đuối nước) sau khi đưa lên bờ?",
    desc: "Thao tác hồi sức tim phổi sơ cấp cứu cơ bản quyết định trực tiếp tới tính mạng nạn nhân.",
    options: {
      A: "Cõng ngược nạn nhân chạy vòng quanh để nôn nước ra ngoài.",
      B: "Đặt nằm ngửa, kiểm tra nhịp thở. Nếu ngừng thở, thực hiện ép tim ngoài lồng ngực (30 lần) kết hợp thổi ngạt (2 lần), liên tục cho đến khi có y tế hỗ trợ và gọi ngay 115.",
      C: "Đắp chăn sưởi ấm ngay lập tức mà không cần kiểm tra hô hấp hay ép tim.",
      D: "Đổ nước ấm vào miệng nạn nhân để làm ấm cơ thể bên trong."
    },
    correct: "B"
  },
  {
    text: "Khi xảy ra hỏa hoạn ở nhà cao tầng, phương án thoát nạn nào sau đây được xem là AN TOÀN nhất?",
    desc: "Quy tắc di chuyển trong không gian có khói độc và lửa cô lập.",
    options: {
      A: "Sử dụng thang máy tòa nhà để di chuyển xuống sảnh trệt nhanh nhất.",
      B: "Di chuyển bằng thang bộ thoát hiểm, dùng khăn ướt che mũi miệng, đi khom lưng thấp hoặc bò sát mặt đất để tránh khói độc.",
      C: "Chạy ngay lên sân thượng tòa nhà và nhảy xuống túi khí cứu hộ bên dưới.",
      D: "Mở to tất cả các cửa ra vào để sảnh hành lang hút gió thoáng mát."
    },
    correct: "B"
  },
  {
    text: "Nhịp độ ép tim chuẩn xác nhất trong kỹ năng hồi sức tim phổi (CPR) cho người lớn là bao nhiêu lần/phút?",
    desc: "Tần số ép tim ngoài lồng ngực để kích thích tuần hoàn nhân tạo tối ưu.",
    options: {
      A: "60 - 80 lần/phút.",
      B: "100 - 120 lần/phút.",
      C: "140 - 160 lần/phút.",
      D: "Tùy thuộc vào thể trạng của người thực hiện ép tim."
    },
    correct: "B"
  },
  {
    text: "Trường hợp gặp tai nạn giao thông có người bị nghi ngờ gãy xương đùi, việc đầu tiên cần thực hiện là gì?",
    desc: "Quy trình xử trí chấn thương cơ xương khớp tránh biến chứng sốc chấn thương.",
    options: {
      A: "Cố định tạm thời chi bị gãy bằng nẹp thẳng (nẹp gỗ, nhánh cây cứng) băng chặt trên và dưới khớp gãy trước khi di chuyển nạn nhân, gọi ngay cấp cứu 115.",
      B: "Cố gắng nắn thẳng xương đùi bị gãy ngay tại hiện trường.",
      C: "Bế thốc nạn nhân dậy và đưa đi cấp cứu ngay lập tức bằng xe máy.",
      D: "Cho nạn nhân uống nước ấm hoặc sữa để giảm bớt cảm giác đau đớn."
    },
    correct: "A"
  }
];

// Document Elements
const guestViews = {
  home: document.getElementById("view-home"),
  register: document.getElementById("view-register"),
  quiz: document.getElementById("view-quiz"),
  leaderboard: document.getElementById("view-leaderboard"),
  "admin-login": document.getElementById("view-admin-login")
};

// Toast notification function
function showToast(message, icon = "info") {
  const toast = document.getElementById("toast");
  const toastIcon = document.getElementById("toast-icon");
  const toastText = document.getElementById("toast-text");
  
  toastIcon.textContent = icon;
  toastText.textContent = message;
  
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Router Manager for SPA
function showView(viewId) {
  const guestLayout = document.getElementById("guest-layout");
  const adminWorkspace = document.getElementById("admin-workspace");

  // Route restrictions
  if (viewId === "quiz" && !currentUser) {
    showToast("Vui lòng đăng ký hồ sơ Thám tử trước!", "warning");
    viewId = "register";
  }

  // Handle Admin Dashboard full-screen transition
  if (viewId === "admin-dashboard") {
    if (!isAdminAuthenticated) {
      viewId = "admin-login";
    } else {
      // Transition to full-screen admin
      guestLayout.classList.add("hidden");
      adminWorkspace.classList.remove("hidden");
      
      // Load admin data
      loadAdminDashboard();
      
      // Close mobile navigation drawer if open
      document.getElementById("mobile-nav-menu").classList.add("hidden");
      return;
    }
  }

  // If showing guest views, ensure guest layout is active and admin is hidden
  guestLayout.classList.remove("hidden");
  adminWorkspace.classList.add("hidden");

  // Show/Hide guest subviews
  Object.keys(guestViews).forEach(key => {
    guestViews[key].classList.remove("active-view");
    setTimeout(() => {
      if (!guestViews[key].classList.contains("active-view")) {
        guestViews[key].style.display = "none";
      }
    }, 400);
  });

  const targetView = guestViews[viewId];
  targetView.style.display = "block";
  targetView.offsetHeight; // force reflow
  targetView.classList.add("active-view");

  // Update navigation active states
  document.querySelectorAll(".nav-link").forEach(link => {
    const targetLinkView = link.getAttribute("data-view");
    if (targetLinkView === viewId) {
      link.classList.add("bg-sky-50", "text-sky-600", "border-l-4", "border-sky-500", "shadow-sm");
      link.classList.remove("text-slate-600", "hover:bg-white/50");
    } else {
      link.classList.remove("bg-sky-50", "text-sky-600", "border-l-4", "border-sky-500", "shadow-sm");
      link.classList.add("text-slate-600", "hover:bg-white/50");
    }
  });

  // Close mobile nav drawer
  document.getElementById("mobile-nav-menu").classList.add("hidden");

  // Fetch data on view load
  if (viewId === "leaderboard") {
    loadLeaderboardData();
  } else if (viewId === "home") {
    loadGlobalStats();
  }
}

// Generate Detective Badge ID
function generateDetectiveId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `DET-${num}-PAST`;
}

// User Session UI Update
function updateSessionUI() {
  const elementsOpId = document.querySelectorAll(".session-op-id");
  const sidebarName = document.getElementById("sidebar-op-name");
  const btnSidebarLogin = document.getElementById("btn-sidebar-login");
  const btnSidebarLogout = document.getElementById("btn-sidebar-logout");
  const btnMobileLogout = document.getElementById("btn-mobile-logout");
  const sidebarLed = document.getElementById("sidebar-led-session");

  if (currentUser) {
    elementsOpId.forEach(el => el.textContent = currentUser.operatorId);
    sidebarName.textContent = currentUser.name.toUpperCase();
    btnSidebarLogin.classList.add("hidden");
    btnSidebarLogout.classList.remove("hidden");
    btnMobileLogout.classList.remove("hidden");
    
    // Led glowing active
    sidebarLed.className = "w-1.5 h-1.5 rounded-full bg-emerald-500 led-glowing";
  } else {
    elementsOpId.forEach(el => el.textContent = "--------");
    sidebarName.textContent = "CHƯA ĐĂNG KÝ";
    btnSidebarLogin.classList.remove("hidden");
    btnSidebarLogout.classList.add("hidden");
    btnMobileLogout.classList.add("hidden");
    
    // Led glowing inactive
    sidebarLed.className = "w-1.5 h-1.5 rounded-full bg-slate-300";
  }
}

// Format milliseconds to MM:SS.MS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

// Load dynamic stats on home screen
async function loadGlobalStats() {
  try {
    const opSnap = await db.collection("operators").get();
    const subSnap = await db.collection("quiz_submissions").get();

    document.getElementById("stat-total-operators").textContent = opSnap.size;
    document.getElementById("stat-total-submissions").textContent = subSnap.size;

    let totalAcc = 0;
    subSnap.forEach(doc => {
      totalAcc += doc.data().accuracy;
    });

    const avgAcc = subSnap.size > 0 ? Math.round(totalAcc / subSnap.size) : 0;
    document.getElementById("stat-avg-accuracy").textContent = `${avgAcc}%`;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

// Seed questions into firestore
async function seedDefaultQuestions() {
  const snap = await db.collection("questions").get();
  if (snap.empty) {
    const batch = db.batch();
    defaultQuestions.forEach(q => {
      const ref = db.collection("questions").doc();
      batch.set(ref, {
        ...q,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log("Seeded default questions.");
  }
}

// ==================== REGISTRATION / LOGIN LOGIC ====================
document.getElementById("form-registration").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const phone = document.getElementById("reg-phone").value.trim();

  const btnSubmit = e.target.querySelector("button[type='submit']");
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">refresh</span> <span>ĐANG KHỞI TẠO...</span>`;

  try {
    const snap = await db.collection("operators").where("email", "==", email).limit(1).get();
    
    if (!snap.empty) {
      // Login
      const doc = snap.docs[0];
      currentUser = { id: doc.id, ...doc.data() };
      localStorage.setItem("past_operator", JSON.stringify(currentUser));
      showToast(`Ủy quyền thành công! Thám tử ${currentUser.name} đã sẵn sàng.`, "done");
    } else {
      // Create new Detective
      const operatorId = generateDetectiveId();
      const detectiveData = {
        name,
        email,
        phone,
        operatorId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection("operators").add(detectiveData);
      currentUser = { id: docRef.id, ...detectiveData };
      localStorage.setItem("past_operator", JSON.stringify(currentUser));
      showToast("Cấp phù hiệu Thám tử thành công!", "done");
    }
    
    updateSessionUI();
    showView("home");
  } catch (error) {
    console.error("Reg error:", error);
    showToast("Không cấp được phù hiệu. Vui lòng kết nối lại!", "error");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span>Nhận Phù Hiệu & Đăng Nhập</span> <span class="material-symbols-outlined font-bold text-base">shield</span>`;
  }
});

function performLogout() {
  currentUser = null;
  localStorage.removeItem("past_operator");
  updateSessionUI();
  showToast("Phù hiệu thám tử đã được hủy ủy quyền.", "info");
  showView("home");
}

document.getElementById("btn-sidebar-logout").addEventListener("click", performLogout);
document.getElementById("btn-mobile-logout").addEventListener("click", performLogout);
document.getElementById("btn-sidebar-login").addEventListener("click", () => showView("register"));
document.getElementById("btn-home-enlist").addEventListener("click", () => showView("register"));

// ==================== INTERACTIVE QUIZ LOGIC ====================
document.getElementById("btn-home-start-quiz").addEventListener("click", () => showView("quiz"));
document.getElementById("btn-quiz-initiate").addEventListener("click", startQuizWorkflow);

async function startQuizWorkflow() {
  if (!currentUser) {
    showToast("Bạn cần nhận Phù hiệu thám tử trước!", "warning");
    showView("register");
    return;
  }

  const btnInit = document.getElementById("btn-quiz-initiate");
  btnInit.disabled = true;
  btnInit.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">refresh</span> GIẢI PHÁP CHUYÊN ÁN...`;

  try {
    await seedDefaultQuestions();
    const snap = await db.collection("questions").orderBy("createdAt", "asc").get();
    
    quizQuestions = [];
    snap.forEach(doc => {
      quizQuestions.push({ id: doc.id, ...doc.data() });
    });

    if (quizQuestions.length === 0) {
      showToast("Lỗi: Không tìm thấy hồ sơ câu hỏi!", "error");
      btnInit.disabled = false;
      btnInit.innerHTML = `<span class="material-symbols-outlined">key</span> MỞ HỒ SƠ CHUYÊN ÁN`;
      return;
    }

    currentQuestionIndex = 0;
    userAnswers = [];
    quizTimeElapsed = 0;
    quizStartTime = Date.now();

    document.getElementById("quiz-pre-start").classList.add("hidden");
    document.getElementById("quiz-finished").classList.add("hidden");
    document.getElementById("quiz-arena").classList.remove("hidden");

    // Live timer runner
    const timerDisplay = document.getElementById("quiz-live-timer");
    clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(() => {
      quizTimeElapsed = Date.now() - quizStartTime;
      timerDisplay.textContent = formatTime(quizTimeElapsed);
      
      // Highlight flashing red if over 3 mins (180000ms)
      if (quizTimeElapsed > 180000) {
        timerDisplay.classList.add("timer-flash");
      } else {
        timerDisplay.classList.remove("timer-flash");
      }
    }, 45);

    renderQuestion();
  } catch (error) {
    console.error("Quiz init error:", error);
    showToast("Đã xảy ra sự cố nạp đề thi!", "error");
    btnInit.disabled = false;
    btnInit.innerHTML = `<span class="material-symbols-outlined">key</span> MỞ HỒ SƠ CHUYÊN ÁN`;
  }
}

function renderQuestion() {
  const question = quizQuestions[currentQuestionIndex];
  
  // Progress telemetry
  const totalQ = quizQuestions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQ) * 100;
  document.getElementById("quiz-progress-text").textContent = `Q_${(currentQuestionIndex + 1).toString().padStart(2, "0")} / ${totalQ.toString().padStart(2, "0")}`;
  document.getElementById("quiz-progress-bar").style.width = `${progressPercent}%`;

  // Write question data
  document.getElementById("quiz-question-title").textContent = question.text;
  document.getElementById("quiz-question-desc").textContent = question.desc;

  // Options buttons grid
  const grid = document.getElementById("quiz-options-grid");
  grid.innerHTML = "";

  const nextBtn = document.getElementById("btn-quiz-next");
  nextBtn.disabled = true;
  nextBtn.textContent = currentQuestionIndex === totalQ - 1 ? "Hoàn thành giải mã" : "Câu tiếp theo";

  Object.keys(question.options).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn glass-panel p-5 rounded-xl flex items-start gap-4 text-left scanline transition-all duration-300";
    btn.innerHTML = `
      <div class="flex-shrink-0 w-10 h-10 rounded bg-white/80 shadow-sm flex items-center justify-center border border-slate-200 text-slate-500 font-headline font-bold">
        ${key}
      </div>
      <div>
        <h4 class="font-headline text-slate-800 font-semibold mb-0.5 text-xs">${key === "A" ? "Phương án A" : key === "B" ? "Phương án B" : key === "C" ? "Phương án C" : "Phương án D"}</h4>
        <p class="text-[11px] text-slate-600 leading-relaxed">${question.options[key]}</p>
      </div>
    `;

    btn.addEventListener("click", () => {
      grid.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      userAnswers[currentQuestionIndex] = {
        questionId: question.id,
        selectedOption: key,
        isCorrect: key === question.correct
      };

      nextBtn.disabled = false;
    });

    grid.appendChild(btn);
  });
}

document.getElementById("btn-quiz-next").addEventListener("click", () => {
  if (currentQuestionIndex < quizQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    submitQuizResults();
  }
});

async function submitQuizResults() {
  clearInterval(quizTimerInterval);
  quizTimeElapsed = Date.now() - quizStartTime;

  const correctCount = userAnswers.filter(ans => ans.isCorrect).length;
  const totalQuestions = quizQuestions.length;
  const accuracy = Math.round((correctCount / totalQuestions) * 100);
  const timeFormatted = formatTime(quizTimeElapsed);

  const submission = {
    operatorId: currentUser.operatorId,
    name: currentUser.name,
    email: currentUser.email,
    accuracy,
    correctCount,
    totalQuestions,
    timeElapsed: quizTimeElapsed,
    timeFormatted,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const nextBtn = document.getElementById("btn-quiz-next");
  nextBtn.disabled = true;
  nextBtn.textContent = "ĐỒNG BỘ DỮ LIỆU...";

  try {
    await db.collection("quiz_submissions").add(submission);
    
    // Load finished screen
    document.getElementById("quiz-arena").classList.add("hidden");
    document.getElementById("quiz-finished").classList.remove("hidden");

    document.getElementById("result-accuracy").textContent = `${accuracy}%`;
    document.getElementById("result-time").textContent = timeFormatted;

    showToast("Giải mã thành công! Kết quả đã ghi nhận.", "done");
  } catch (error) {
    console.error(error);
    showToast("Lưu kết quả lỗi. Đang chạy cục bộ!", "error");
    
    document.getElementById("quiz-arena").classList.add("hidden");
    document.getElementById("quiz-finished").classList.remove("hidden");
    document.getElementById("result-accuracy").textContent = `${accuracy}%`;
    document.getElementById("result-time").textContent = timeFormatted;
  }
}

document.getElementById("btn-quiz-view-rankings").addEventListener("click", () => showView("leaderboard"));
document.getElementById("btn-quiz-retry").addEventListener("click", () => {
  document.getElementById("quiz-finished").classList.add("hidden");
  document.getElementById("quiz-pre-start").classList.remove("hidden");
});

// ==================== REALTIME LEADERBOARD LOGIC ====================
let allLeaderboardSubmissions = [];

async function loadLeaderboardData() {
  const container = document.getElementById("leaderboard-rows");
  container.innerHTML = `<div class="py-12 text-center text-slate-400 font-mono text-xs">Đang tải hồ sơ điều tra...</div>`;

  try {
    const snap = await db.collection("quiz_submissions")
      .orderBy("accuracy", "desc")
      .orderBy("timeElapsed", "asc")
      .get();
    
    allLeaderboardSubmissions = [];
    snap.forEach(doc => {
      allLeaderboardSubmissions.push({ id: doc.id, ...doc.data() });
    });

    renderLeaderboardRows(allLeaderboardSubmissions);
  } catch (error) {
    console.error("Leaderboard loading error:", error);
    container.innerHTML = `<div class="py-12 text-center text-red-500 font-mono text-xs">Không kết nối được bảng vàng!</div>`;
  }
}

function renderLeaderboardRows(submissions) {
  const container = document.getElementById("leaderboard-rows");
  container.innerHTML = "";

  if (submissions.length === 0) {
    container.innerHTML = `<div class="py-12 text-center text-slate-400 font-mono text-xs">Chưa ghi nhận thám tử giải mã chuyên án.</div>`;
    return;
  }

  submissions.forEach((sub, index) => {
    const rank = index + 1;
    let rankBadge = `<span class="font-mono text-slate-500 font-bold">${rank.toString().padStart(2, "0")}</span>`;
    let rowClass = "bg-white/10 hover:bg-white/20";
    let borderAccent = "";

    if (rank === 1) {
      rankBadge = `
        <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center border border-amber-300 shadow-sm">
          <span class="material-symbols-outlined text-amber-500 text-base">trophy</span>
        </div>
      `;
      rowClass = "bg-amber-50/40 hover:bg-amber-100/40 relative";
      borderAccent = `<div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]"></div>`;
    } else if (rank === 2) {
      rankBadge = `
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300">
          <span class="material-symbols-outlined text-slate-500 text-base">workspace_premium</span>
        </div>
      `;
      rowClass = "bg-slate-50/30 hover:bg-slate-100/40";
    } else if (rank === 3) {
      rankBadge = `
        <div class="w-8 h-8 rounded-full bg-orange-100/50 flex items-center justify-center border border-orange-200">
          <span class="material-symbols-outlined text-orange-500 text-base">military_tech</span>
        </div>
      `;
      rowClass = "bg-orange-50/20 hover:bg-orange-100/30";
    }

    const isCurrent = currentUser && currentUser.operatorId === sub.operatorId;
    if (isCurrent) {
      rowClass += " border-y border-sky-400 bg-sky-50/20";
    }

    const row = document.createElement("div");
    row.className = `grid grid-cols-12 gap-4 px-6 py-3.5 items-center border-b border-slate-100/50 transition-colors ${rowClass}`;
    row.innerHTML = `
      ${borderAccent}
      <div class="col-span-2 md:col-span-1 flex justify-center items-center">
        ${rankBadge}
      </div>
      <div class="col-span-6 md:col-span-5 flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 flex-shrink-0">
          <span class="material-symbols-outlined text-slate-400 text-base">person</span>
        </div>
        <div class="truncate">
          <div class="font-headline font-bold text-slate-800 text-xs truncate">${sub.name} ${isCurrent ? '<span class="text-[9px] bg-sky-400 text-white px-1 py-0.5 rounded font-mono ml-1">YOU</span>' : ''}</div>
          <div class="font-mono text-[9px] text-slate-400 truncate">${sub.operatorId}</div>
        </div>
      </div>
      <div class="col-span-4 md:col-span-3 text-right">
        <span class="font-headline font-extrabold text-slate-800 text-xs">${sub.accuracy}%</span>
      </div>
      <div class="hidden md:block md:col-span-3 text-right">
        <div class="font-mono text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 justify-end">
          <span class="material-symbols-outlined text-xs text-slate-400">timer</span>
          ${sub.timeFormatted}
        </div>
      </div>
    `;

    container.appendChild(row);
  });
}

// Live search on leaderboard
document.getElementById("leaderboard-search").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderLeaderboardRows(allLeaderboardSubmissions);
    return;
  }

  const filtered = allLeaderboardSubmissions.filter(sub => 
    sub.operatorId.toLowerCase().includes(query) || 
    sub.name.toLowerCase().includes(query) || 
    sub.email.toLowerCase().includes(query)
  );

  renderLeaderboardRows(filtered);
});

// ==================== ADMIN CORE LOGIC ====================

// Admin Login form
document.getElementById("btn-admin-login-submit").addEventListener("click", () => {
  const user = document.getElementById("admin-user").value.trim();
  const pass = document.getElementById("admin-pass").value.trim();

  if (user === "admin" && pass === "past123") {
    isAdminAuthenticated = true;
    localStorage.setItem("past_admin_auth", "true");
    showToast("Xin chào Chỉ huy. Quyền quản trị tối cao được thiết lập!", "done");
    showView("admin-dashboard");
  } else {
    showToast("Sai tài khoản hoặc mật khẩu hệ thống!", "error");
  }
});

// Admin Log out (returns to guest page)
document.getElementById("btn-admin-logout").addEventListener("click", () => {
  isAdminAuthenticated = false;
  localStorage.removeItem("past_admin_auth");
  showToast("Hệ thống quản trị đã đóng kết nối.", "info");
  showView("home");
});

// Sidebar links inside Admin Dashboard
document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // Style active tab
    document.querySelectorAll(".admin-tab-btn").forEach(b => {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    // Show selected container
    const tabId = btn.getAttribute("data-tab");
    document.querySelectorAll(".admin-tab-content").forEach(content => {
      content.classList.add("hidden");
    });
    document.getElementById(`admin-tab-${tabId}`).classList.remove("hidden");
  });
});

let allAdminOperators = [];
let allAdminLeaderboard = [];
let allAdminQuestions = [];

async function loadAdminDashboard() {
  loadAdminOperators();
  loadAdminLeaderboard();
  loadAdminQuestions();
}

// Admin Tab: Operators list
async function loadAdminOperators() {
  const tbody = document.getElementById("admin-operators-rows");
  tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 font-mono">Đang nạp hồ sơ điều tra...</td></tr>`;

  try {
    const snap = await db.collection("operators").orderBy("createdAt", "desc").get();
    allAdminOperators = [];
    snap.forEach(doc => {
      allAdminOperators.push({ id: doc.id, ...doc.data() });
    });
    renderAdminOperatorsTable(allAdminOperators);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-mono">Lỗi kết nối cơ sở dữ liệu!</td></tr>`;
  }
}

function renderAdminOperatorsTable(operators) {
  const tbody = document.getElementById("admin-operators-rows");
  tbody.innerHTML = "";

  if (operators.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 font-mono">Không tìm thấy hồ sơ Thám tử.</td></tr>`;
    return;
  }

  operators.forEach(op => {
    const tr = document.createElement("tr");
    tr.className = "admin-table-row border-b border-slate-800/40";
    tr.innerHTML = `
      <td class="p-4 font-semibold text-slate-200">${op.name}</td>
      <td class="p-4 font-mono text-slate-400">${op.email}</td>
      <td class="p-4 font-mono text-slate-400">${op.phone}</td>
      <td class="p-4 font-mono text-amber-400 font-bold">${op.operatorId}</td>
      <td class="p-4 text-center">
        <button onclick="deleteOperator('${op.id}')" class="text-red-400 hover:text-red-600 transition-colors">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Admin: delete operator
window.deleteOperator = async function(id) {
  if (confirm("Hành động này sẽ xóa vĩnh viễn hồ sơ Thám tử khỏi hệ thống! Tiếp tục?")) {
    try {
      await db.collection("operators").doc(id).delete();
      showToast("Xóa hồ sơ thám tử thành công.", "done");
      loadAdminOperators();
      loadGlobalStats();
    } catch (e) {
      console.error(e);
      showToast("Lỗi xóa hồ sơ!", "error");
    }
  }
};

// Admin: search operator
document.getElementById("admin-search-operators").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = allAdminOperators.filter(op => 
    op.name.toLowerCase().includes(q) || 
    op.email.toLowerCase().includes(q) || 
    op.operatorId.toLowerCase().includes(q)
  );
  renderAdminOperatorsTable(filtered);
});

// Admin Tab: Leaderboard submissions list
async function loadAdminLeaderboard() {
  const tbody = document.getElementById("admin-leaderboard-rows");
  tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 font-mono">Đang nạp bảng điểm chuyên án...</td></tr>`;

  try {
    const snap = await db.collection("quiz_submissions").orderBy("createdAt", "desc").get();
    allAdminLeaderboard = [];
    snap.forEach(doc => {
      allAdminLeaderboard.push({ id: doc.id, ...doc.data() });
    });
    renderAdminLeaderboardTable(allAdminLeaderboard);
  } catch (error) {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500 font-mono">Lỗi nạp cơ sở dữ liệu!</td></tr>`;
  }
}

function renderAdminLeaderboardTable(submissions) {
  const tbody = document.getElementById("admin-leaderboard-rows");
  tbody.innerHTML = "";

  if (submissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 font-mono">Chưa có kết quả chuyên án được ghi nhận.</td></tr>`;
    return;
  }

  submissions.forEach(sub => {
    const dateStr = sub.createdAt ? new Date(sub.createdAt.seconds * 1000).toLocaleString("vi-VN") : "---";
    const tr = document.createElement("tr");
    tr.className = "admin-table-row border-b border-slate-800/40";
    tr.innerHTML = `
      <td class="p-4 font-mono font-bold text-amber-400">${sub.operatorId}</td>
      <td class="p-4 font-semibold text-slate-200">${sub.name}</td>
      <td class="p-4 font-semibold text-slate-200">${sub.accuracy}% (${sub.correctCount}/${sub.totalQuestions})</td>
      <td class="p-4 font-mono text-slate-400">${sub.timeFormatted}</td>
      <td class="p-4 text-slate-500 font-mono">${dateStr}</td>
      <td class="p-4 text-center">
        <button onclick="deleteSubmission('${sub.id}')" class="text-red-400 hover:text-red-600 transition-colors">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Admin: delete submission
window.deleteSubmission = async function(id) {
  if (confirm("Xóa bản báo cáo giải mã chuyên án này?")) {
    try {
      await db.collection("quiz_submissions").doc(id).delete();
      showToast("Đã xóa báo cáo chuyên án.", "done");
      loadAdminLeaderboard();
      loadGlobalStats();
    } catch (e) {
      console.error(e);
      showToast("Xóa báo cáo thất bại!", "error");
    }
  }
};

// Admin: search submission
document.getElementById("admin-search-leaderboard").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = allAdminLeaderboard.filter(sub => 
    sub.name.toLowerCase().includes(q) || 
    sub.operatorId.toLowerCase().includes(q) || 
    sub.email.toLowerCase().includes(q)
  );
  renderAdminLeaderboardTable(filtered);
});

// Admin Tab: Manage questions CRUD
async function loadAdminQuestions() {
  const list = document.getElementById("admin-questions-list");
  list.innerHTML = `<div class="text-center text-slate-500 font-mono text-xs py-8">Đang tải danh sách câu hỏi...</div>`;

  try {
    const snap = await db.collection("questions").orderBy("createdAt", "asc").get();
    allAdminQuestions = [];
    snap.forEach(doc => {
      allAdminQuestions.push({ id: doc.id, ...doc.data() });
    });
    renderAdminQuestionsList(allAdminQuestions);
  } catch (error) {
    console.error(error);
    list.innerHTML = `<div class="text-center text-red-500 font-mono text-xs py-8">Lỗi tải ngân hàng câu hỏi!</div>`;
  }
}

function renderAdminQuestionsList(questions) {
  const list = document.getElementById("admin-questions-list");
  list.innerHTML = "";

  if (questions.length === 0) {
    list.innerHTML = `<div class="text-center text-slate-500 font-mono text-xs py-8">Ngân hàng câu hỏi trống. Vui lòng thêm chuyên án mới!</div>`;
    return;
  }

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-3 relative";
    card.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <span class="font-headline font-bold text-slate-400 text-xs">Câu ${(index + 1).toString().padStart(2, "0")}</span>
        <div class="flex gap-2">
          <button onclick="editQuestion('${q.id}')" class="text-sky-400 hover:text-sky-600 transition-colors p-1" title="Sửa">
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
          <button onclick="deleteQuestion('${q.id}')" class="text-red-400 hover:text-red-600 transition-colors p-1" title="Xóa">
            <span class="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
      
      <p class="font-semibold text-slate-200 text-xs leading-relaxed">${q.text}</p>
      <div class="text-[10px] text-slate-500 italic">Gợi ý: ${q.desc}</div>
      
      <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
        <div><strong class="font-mono text-slate-300">A:</strong> ${q.options.A}</div>
        <div><strong class="font-mono text-slate-300">B:</strong> ${q.options.B}</div>
        <div><strong class="font-mono text-slate-300">C:</strong> ${q.options.C}</div>
        <div><strong class="font-mono text-slate-300">D:</strong> ${q.options.D}</div>
      </div>
      <div class="text-xs font-mono font-bold text-emerald-400">Đáp án chuẩn: ${q.correct}</div>
    `;
    list.appendChild(card);
  });
}

document.getElementById("btn-question-cancel").addEventListener("click", resetQuestionForm);

function resetQuestionForm() {
  document.getElementById("admin-question-id").value = "";
  document.getElementById("q-text").value = "";
  document.getElementById("q-desc").value = "";
  document.getElementById("q-opt-A").value = "";
  document.getElementById("q-opt-B").value = "";
  document.getElementById("q-opt-C").value = "";
  document.getElementById("q-opt-D").value = "";
  document.getElementById("q-correct").value = "A";
  
  document.getElementById("admin-question-form-title").textContent = "Thêm Câu Hỏi Mới";
  document.getElementById("btn-question-save").textContent = "Lưu câu hỏi";
  document.getElementById("btn-question-cancel").classList.add("hidden");
}

window.editQuestion = function(id) {
  const q = allAdminQuestions.find(item => item.id === id);
  if (!q) return;

  document.getElementById("admin-question-id").value = q.id;
  document.getElementById("q-text").value = q.text;
  document.getElementById("q-desc").value = q.desc;
  document.getElementById("q-opt-A").value = q.options.A;
  document.getElementById("q-opt-B").value = q.options.B;
  document.getElementById("q-opt-C").value = q.options.C;
  document.getElementById("q-opt-D").value = q.options.D;
  document.getElementById("q-correct").value = q.correct;

  document.getElementById("admin-question-form-title").textContent = "Cập Nhật Câu Hỏi";
  document.getElementById("btn-question-save").textContent = "Cập nhật";
  document.getElementById("btn-question-cancel").classList.remove("hidden");
  
  document.getElementById("admin-question-form-title").scrollIntoView({ behavior: 'smooth' });
};

// Admin save question (Form submit - Insert / Update)
document.getElementById("admin-form-question").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const id = document.getElementById("admin-question-id").value;
  const text = document.getElementById("q-text").value.trim();
  const desc = document.getElementById("q-desc").value.trim();
  const optA = document.getElementById("q-opt-A").value.trim();
  const optB = document.getElementById("q-opt-B").value.trim();
  const optC = document.getElementById("q-opt-C").value.trim();
  const optD = document.getElementById("q-opt-D").value.trim();
  const correct = document.getElementById("q-correct").value;

  const questionData = {
    text,
    desc,
    options: {
      A: optA,
      B: optB,
      C: optC,
      D: optD
    },
    correct
  };

  try {
    if (id) {
      await db.collection("questions").doc(id).update(questionData);
      showToast("Cập nhật chuyên án thành công.", "done");
    } else {
      await db.collection("questions").add({
        ...questionData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Thêm câu hỏi chuyên án thành công.", "done");
    }
    resetQuestionForm();
    loadAdminQuestions();
  } catch (error) {
    console.error("Save question error:", error);
    showToast("Lưu chuyên án lỗi!", "error");
  }
});

// Admin delete question
window.deleteQuestion = async function(id) {
  if (confirm("Xóa câu hỏi chuyên án này?")) {
    try {
      await db.collection("questions").doc(id).delete();
      showToast("Đã xóa câu hỏi.", "done");
      loadAdminQuestions();
    } catch (e) {
      console.error(e);
      showToast("Lỗi xóa câu hỏi!", "error");
    }
  }
};

// ==================== INITIALIZATION & BINDINGS ====================

// Mobile nav menu drawer toggle
document.getElementById("mobile-menu-toggle").addEventListener("click", () => {
  const menu = document.getElementById("mobile-nav-menu");
  menu.classList.toggle("hidden");
});

// User badge trigger register
document.getElementById("mobile-user-badge").addEventListener("click", () => {
  if (!currentUser) showView("register");
  else showToast(`Thám tử: ${currentUser.name}`, "info");
});

// Nav Link selectors
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const viewId = link.getAttribute("data-view");
    showView(viewId);
  });
});

document.querySelectorAll(".mobile-nav-link").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const viewId = link.getAttribute("data-view");
    showView(viewId);
  });
});

// Callouts
document.getElementById("btn-home-start-quiz").addEventListener("click", () => showView("quiz"));
document.getElementById("btn-home-enlist").addEventListener("click", () => showView("register"));
document.getElementById("btn-sidebar-login").addEventListener("click", () => showView("register"));
document.getElementById("btn-sidebar-admin").addEventListener("click", () => showView("admin-dashboard"));

// App loader initialization
document.addEventListener("DOMContentLoaded", async () => {
  updateSessionUI();
  loadGlobalStats();
  
  try {
    await seedDefaultQuestions();
  } catch (e) {
    console.warn("Unable to seed questions:", e);
  }
  
  showView("home");
});
