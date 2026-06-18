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
      D: "Đổ nước ấm vào miệng nạn nhân để làm ấm nội tạng cơ thể bên trong."
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
const views = {
  home: document.getElementById("view-home"),
  register: document.getElementById("view-register"),
  quiz: document.getElementById("view-quiz"),
  leaderboard: document.getElementById("view-leaderboard"),
  "admin-login": document.getElementById("view-admin-login"),
  "admin-dashboard": document.getElementById("view-admin-dashboard")
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

// Client-side Routing Function
function showView(viewId) {
  // Hide all views
  Object.keys(views).forEach(key => {
    views[key].classList.remove("active-view");
    setTimeout(() => {
      if (!views[key].classList.contains("active-view")) {
        views[key].style.display = "none";
      }
    }, 400); // match transition duration
  });

  // Handle special redirections/restrictions
  if (viewId === "quiz" && !currentUser) {
    showToast("Vui lòng đăng ký Operator để kích hoạt bài kiểm tra!", "warning");
    viewId = "register";
  }

  if (viewId === "admin-dashboard" && !isAdminAuthenticated) {
    viewId = "admin-login";
  }

  // Show target view
  const targetView = views[viewId];
  targetView.style.display = "block";
  // Force reflow
  targetView.offsetHeight;
  targetView.classList.add("active-view");

  // Update Navigation Active Links
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("data-view") === viewId || (viewId === "admin-dashboard" && link.getAttribute("data-view") === "admin-login")) {
      link.classList.add("bg-amber-50", "text-amber-600", "border-l-4", "border-amber-500", "shadow-sm");
      link.classList.remove("text-slate-600", "hover:bg-white/50");
    } else {
      link.classList.remove("bg-amber-50", "text-amber-600", "border-l-4", "border-amber-500", "shadow-sm");
      link.classList.add("text-slate-600", "hover:bg-white/50");
    }
  });

  // Mobile menu close on navigate
  document.getElementById("mobile-nav-menu").classList.add("hidden");

  // Load view-specific data
  if (viewId === "leaderboard") {
    loadLeaderboardData();
  } else if (viewId === "admin-dashboard") {
    loadAdminDashboard();
  } else if (viewId === "home") {
    loadGlobalStats();
  }
}

// Generate operator ID
function generateOperatorId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `OP-${num}-PAST`;
}

// User Session UI Update
function updateSessionUI() {
  const elementsOpId = document.querySelectorAll(".session-op-id");
  const sidebarName = document.getElementById("sidebar-op-name");
  const btnSidebarLogin = document.getElementById("btn-sidebar-login");
  const btnSidebarLogout = document.getElementById("btn-sidebar-logout");
  const btnMobileLogout = document.getElementById("btn-mobile-logout");

  if (currentUser) {
    elementsOpId.forEach(el => el.textContent = currentUser.operatorId);
    sidebarName.textContent = currentUser.name.toUpperCase();
    btnSidebarLogin.classList.add("hidden");
    btnSidebarLogout.classList.remove("hidden");
    btnMobileLogout.classList.remove("hidden");
  } else {
    elementsOpId.forEach(el => el.textContent = "--------");
    sidebarName.textContent = "CHƯA ĐĂNG KÝ";
    btnSidebarLogin.classList.remove("hidden");
    btnSidebarLogout.classList.add("hidden");
    btnMobileLogout.classList.add("hidden");
  }
}

// Format milliseconds into MM:SS.MS format
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

// Load Global Application Statistics for Home Screen
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
    console.error("Error loading global stats:", error);
  }
}

// Seed Questions into database helper
async function seedDefaultQuestions() {
  const questionsSnap = await db.collection("questions").get();
  if (questionsSnap.empty) {
    const batch = db.batch();
    defaultQuestions.forEach(q => {
      const newRef = db.collection("questions").doc();
      batch.set(newRef, {
        ...q,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    console.log("Default questions seeded successfully.");
  }
}

// ==================== OPERATOR REGISTRATION MODULE ====================
document.getElementById("form-registration").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const phone = document.getElementById("reg-phone").value.trim();

  const btnSubmit = e.target.querySelector("button[type='submit']");
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">refresh</span> <span>ĐANG XỬ LÝ...</span>`;

  try {
    // Check if operator already exists
    const querySnap = await db.collection("operators").where("email", "==", email).limit(1).get();
    
    if (!querySnap.empty) {
      // Log in as existing operator
      const doc = querySnap.docs[0];
      currentUser = { id: doc.id, ...doc.data() };
      localStorage.setItem("past_operator", JSON.stringify(currentUser));
      showToast(`Chào mừng trở lại, Operator ${currentUser.name}!`, "done");
    } else {
      // Create new operator profile
      const operatorId = generateOperatorId();
      const operatorData = {
        name,
        email,
        phone,
        operatorId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db.collection("operators").add(operatorData);
      currentUser = { id: docRef.id, ...operatorData };
      localStorage.setItem("past_operator", JSON.stringify(currentUser));
      showToast("Đăng ký thành viên Operator thành công!", "done");
    }
    
    updateSessionUI();
    showView("home");
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại!", "error");
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span>Xác nhận thông tin & Đăng Nhập</span> <span class="material-symbols-outlined font-bold text-base">login</span>`;
  }
});

// Logout handles
function performLogout() {
  currentUser = null;
  localStorage.removeItem("past_operator");
  updateSessionUI();
  showToast("Đã đăng xuất tài khoản Operator.", "info");
  showView("home");
}

document.getElementById("btn-sidebar-logout").addEventListener("click", performLogout);
document.getElementById("btn-mobile-logout").addEventListener("click", performLogout);
document.getElementById("btn-sidebar-login").addEventListener("click", () => showView("register"));
document.getElementById("btn-home-enlist").addEventListener("click", () => showView("register"));

// ==================== TACTICAL QUIZ MODULE ====================
document.getElementById("btn-home-start-quiz").addEventListener("click", () => showView("quiz"));
document.getElementById("btn-quiz-initiate").addEventListener("click", startQuizWorkflow);

async function startQuizWorkflow() {
  if (!currentUser) {
    showToast("Bạn cần đăng ký Operator trước khi thi đấu!", "warning");
    showView("register");
    return;
  }

  const btnInit = document.getElementById("btn-quiz-initiate");
  btnInit.disabled = true;
  btnInit.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">refresh</span> TẢI ĐỀ THI...`;

  try {
    // Seed questions if empty, then fetch
    await seedDefaultQuestions();
    const questionsSnap = await db.collection("questions").orderBy("createdAt", "asc").get();
    
    quizQuestions = [];
    questionsSnap.forEach(doc => {
      quizQuestions.push({ id: doc.id, ...doc.data() });
    });

    if (quizQuestions.length === 0) {
      showToast("Lỗi: Không tìm thấy câu hỏi trong hệ thống!", "error");
      btnInit.disabled = false;
      btnInit.innerHTML = `<span class="material-symbols-outlined">play_arrow</span> BẮT ĐẦU NGAY`;
      return;
    }

    // Set arena variables
    currentQuestionIndex = 0;
    userAnswers = [];
    quizTimeElapsed = 0;
    quizStartTime = Date.now();

    // Show Arena UI
    document.getElementById("quiz-pre-start").classList.add("hidden");
    document.getElementById("quiz-finished").classList.add("hidden");
    document.getElementById("quiz-arena").classList.remove("hidden");

    // Start Live Timer
    const timerDisplay = document.getElementById("quiz-live-timer");
    clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(() => {
      quizTimeElapsed = Date.now() - quizStartTime;
      timerDisplay.textContent = formatTime(quizTimeElapsed);
      
      // Warn user if exceeding 3 minutes (180000ms) with warning class
      if (quizTimeElapsed > 180000) {
        timerDisplay.classList.add("timer-flash");
      } else {
        timerDisplay.classList.remove("timer-flash");
      }
    }, 45);

    renderQuestion();
  } catch (error) {
    console.error("Quiz start error:", error);
    showToast("Không tải được câu hỏi. Vui lòng kết nối lại!", "error");
    btnInit.disabled = false;
    btnInit.innerHTML = `<span class="material-symbols-outlined">play_arrow</span> BẮT ĐẦU NGAY`;
  }
}

function renderQuestion() {
  const question = quizQuestions[currentQuestionIndex];
  
  // Progress Bar
  const totalQ = quizQuestions.length;
  const progressPercent = ((currentQuestionIndex + 1) / totalQ) * 100;
  document.getElementById("quiz-progress-text").textContent = `Q_${(currentQuestionIndex + 1).toString().padStart(2, "0")} / ${totalQ.toString().padStart(2, "0")}`;
  document.getElementById("quiz-progress-bar").style.width = `${progressPercent}%`;

  // Content
  document.getElementById("quiz-question-title").textContent = question.text;
  document.getElementById("quiz-question-desc").textContent = question.desc;

  // Options Grid
  const grid = document.getElementById("quiz-options-grid");
  grid.innerHTML = "";

  const nextBtn = document.getElementById("btn-quiz-next");
  nextBtn.disabled = true;
  nextBtn.textContent = currentQuestionIndex === totalQ - 1 ? "Hoàn thành bài thi" : "Câu tiếp theo";

  Object.keys(question.options).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn glass-panel p-6 rounded-xl flex items-start gap-4 text-left scanline transition-all duration-300";
    btn.innerHTML = `
      <div class="flex-shrink-0 w-12 h-12 rounded bg-white/80 shadow-sm flex items-center justify-center border border-slate-200 text-slate-500 font-headline font-bold text-lg">
        ${key}
      </div>
      <div>
        <h4 class="font-headline text-slate-800 font-semibold mb-1">${key === "A" ? "Phương án A" : key === "B" ? "Phương án B" : key === "C" ? "Phương án C" : "Phương án D"}</h4>
        <p class="text-xs text-slate-600">${question.options[key]}</p>
      </div>
    `;

    btn.addEventListener("click", () => {
      // Highlight selected option
      grid.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      // Store user choice
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
  // Stop timer
  clearInterval(quizTimerInterval);
  quizTimeElapsed = Date.now() - quizStartTime;

  // Calculate results
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
  nextBtn.textContent = "ĐANG LƯU KẾT QUẢ...";

  try {
    await db.collection("quiz_submissions").add(submission);
    
    // Show results panel
    document.getElementById("quiz-arena").classList.add("hidden");
    document.getElementById("quiz-finished").classList.remove("hidden");

    document.getElementById("result-accuracy").textContent = `${accuracy}%`;
    document.getElementById("result-time").textContent = timeFormatted;

    showToast("Chúc mừng! Kết quả thi đã được đồng bộ hóa thành công.", "done");
  } catch (error) {
    console.error("Submission error:", error);
    showToast("Lưu kết quả thất bại, đang chạy chế độ offline!", "error");
    // Show results anyway
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

// ==================== REALTIME LEADERBOARD MODULE ====================
let allLeaderboardSubmissions = [];

async function loadLeaderboardData() {
  const container = document.getElementById("leaderboard-rows");
  container.innerHTML = `<div class="py-12 text-center text-slate-400 font-mono text-xs">Đang tải bảng xếp hạng...</div>`;

  try {
    const subSnap = await db.collection("quiz_submissions")
      .orderBy("accuracy", "desc")
      .orderBy("timeElapsed", "asc")
      .get();
    
    allLeaderboardSubmissions = [];
    subSnap.forEach(doc => {
      allLeaderboardSubmissions.push({ id: doc.id, ...doc.data() });
    });

    renderLeaderboardRows(allLeaderboardSubmissions);
  } catch (error) {
    console.error("Leaderboard loading error:", error);
    container.innerHTML = `<div class="py-12 text-center text-red-500 font-mono text-xs">Không tải được dữ liệu bảng xếp hạng!</div>`;
  }
}

function renderLeaderboardRows(submissions) {
  const container = document.getElementById("leaderboard-rows");
  container.innerHTML = "";

  if (submissions.length === 0) {
    container.innerHTML = `<div class="py-12 text-center text-slate-400 font-mono text-xs">Chưa có Operator nào ghi nhận kết quả.</div>`;
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
          <span class="material-symbols-outlined text-amber-500 text-lg">trophy</span>
        </div>
      `;
      rowClass = "bg-amber-50/40 hover:bg-amber-100/40 relative";
      borderAccent = `<div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]"></div>`;
    } else if (rank === 2) {
      rankBadge = `
        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-300">
          <span class="material-symbols-outlined text-slate-500 text-lg">workspace_premium</span>
        </div>
      `;
      rowClass = "bg-slate-50/30 hover:bg-slate-100/40";
    } else if (rank === 3) {
      rankBadge = `
        <div class="w-8 h-8 rounded-full bg-orange-100/50 flex items-center justify-center border border-orange-200">
          <span class="material-symbols-outlined text-orange-500 text-lg">military_tech</span>
        </div>
      `;
      rowClass = "bg-orange-50/20 hover:bg-orange-100/30";
    }

    const isCurrent = currentUser && currentUser.operatorId === sub.operatorId;
    if (isCurrent) {
      rowClass += " border-y border-amber-400 bg-amber-50/20";
    }

    const row = document.createElement("div");
    row.className = `grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-slate-100/50 transition-colors ${rowClass}`;
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
          <div class="font-headline font-bold text-slate-800 text-sm truncate">${sub.name} ${isCurrent ? '<span class="text-[9px] bg-amber-400 text-slate-900 px-1 py-0.5 rounded font-mono ml-1">YOU</span>' : ''}</div>
          <div class="font-mono text-[10px] text-slate-400 truncate">${sub.operatorId}</div>
        </div>
      </div>
      <div class="col-span-4 md:col-span-3 text-right">
        <span class="font-headline font-extrabold text-slate-800 text-sm">${sub.accuracy}%</span>
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

// Search filtration logic
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

// ==================== ADMIN SYSTEM MODULE ====================

// Admin Login form trigger
document.getElementById("btn-admin-login-submit").addEventListener("click", () => {
  const user = document.getElementById("admin-user").value.trim();
  const pass = document.getElementById("admin-pass").value.trim();

  if (user === "admin" && pass === "past123") {
    isAdminAuthenticated = true;
    localStorage.setItem("past_admin_auth", "true");
    showToast("Xác thực quản trị cấp cao thành công!", "done");
    showView("admin-dashboard");
  } else {
    showToast("Sai tài khoản hoặc mật khẩu quản trị!", "error");
  }
});

// Admin Logout trigger
document.getElementById("btn-admin-logout").addEventListener("click", () => {
  isAdminAuthenticated = false;
  localStorage.removeItem("past_admin_auth");
  showToast("Hệ thống đã khóa bảng điều khiển quản trị.", "info");
  showView("home");
});

// Tab navigation within Admin Dashboard
document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // Styling tabs
    document.querySelectorAll(".admin-tab-btn").forEach(b => {
      b.classList.remove("border-amber-500", "text-slate-900", "font-bold");
      b.classList.add("border-transparent", "text-slate-500", "font-medium");
    });
    btn.classList.add("border-amber-500", "text-slate-900", "font-bold");
    btn.classList.remove("border-transparent", "text-slate-500", "font-medium");

    // Show contents
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

// Admin: Load Operators
async function loadAdminOperators() {
  const tbody = document.getElementById("admin-operators-rows");
  tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 font-mono">Đang tải hồ sơ...</td></tr>`;

  try {
    const snap = await db.collection("operators").orderBy("createdAt", "desc").get();
    allAdminOperators = [];
    snap.forEach(doc => {
      allAdminOperators.push({ id: doc.id, ...doc.data() });
    });
    renderAdminOperatorsTable(allAdminOperators);
  } catch (error) {
    console.error("Error loading admin operators:", error);
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-mono">Lỗi tải dữ liệu!</td></tr>`;
  }
}

function renderAdminOperatorsTable(operators) {
  const tbody = document.getElementById("admin-operators-rows");
  tbody.innerHTML = "";

  if (operators.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400 font-mono">Không có hồ sơ nào.</td></tr>`;
    return;
  }

  operators.forEach(op => {
    const tr = document.createElement("tr");
    tr.className = "admin-table-row border-b border-slate-100/30";
    tr.innerHTML = `
      <td class="p-4 font-semibold text-slate-800">${op.name}</td>
      <td class="p-4 font-mono text-slate-600">${op.email}</td>
      <td class="p-4 font-mono text-slate-600">${op.phone}</td>
      <td class="p-4 font-mono text-slate-700 font-bold">${op.operatorId}</td>
      <td class="p-4 text-center">
        <button onclick="deleteOperator('${op.id}')" class="text-red-500 hover:text-red-700 transition-colors">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Admin delete operator
window.deleteOperator = async function(id) {
  if (confirm("Bạn có chắc chắn muốn xóa hồ sơ Operator này? Thao tác này không thể hoàn tác!")) {
    try {
      await db.collection("operators").doc(id).delete();
      showToast("Đã xóa hồ sơ Operator thành công.", "done");
      loadAdminOperators();
      loadGlobalStats();
    } catch (e) {
      console.error(e);
      showToast("Lỗi xóa hồ sơ!", "error");
    }
  }
};

// Admin search operators
document.getElementById("admin-search-operators").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = allAdminOperators.filter(op => 
    op.name.toLowerCase().includes(q) || 
    op.email.toLowerCase().includes(q) || 
    op.operatorId.toLowerCase().includes(q)
  );
  renderAdminOperatorsTable(filtered);
});

// Admin: Load Leaderboard Submissions
async function loadAdminLeaderboard() {
  const tbody = document.getElementById("admin-leaderboard-rows");
  tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-mono">Đang tải bảng điểm...</td></tr>`;

  try {
    const snap = await db.collection("quiz_submissions").orderBy("createdAt", "desc").get();
    allAdminLeaderboard = [];
    snap.forEach(doc => {
      allAdminLeaderboard.push({ id: doc.id, ...doc.data() });
    });
    renderAdminLeaderboardTable(allAdminLeaderboard);
  } catch (error) {
    console.error("Error loading admin submissions:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500 font-mono">Lỗi tải dữ liệu!</td></tr>`;
  }
}

function renderAdminLeaderboardTable(submissions) {
  const tbody = document.getElementById("admin-leaderboard-rows");
  tbody.innerHTML = "";

  if (submissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-mono">Không có bài thi nào được ghi nhận.</td></tr>`;
    return;
  }

  submissions.forEach(sub => {
    const dateStr = sub.createdAt ? new Date(sub.createdAt.seconds * 1000).toLocaleString("vi-VN") : "---";
    const tr = document.createElement("tr");
    tr.className = "admin-table-row border-b border-slate-100/30";
    tr.innerHTML = `
      <td class="p-4 font-mono font-bold text-slate-700">${sub.operatorId}</td>
      <td class="p-4 font-semibold text-slate-800">${sub.name}</td>
      <td class="p-4 font-semibold text-slate-800">${sub.accuracy}% (${sub.correctCount}/${sub.totalQuestions})</td>
      <td class="p-4 font-mono text-slate-600">${sub.timeFormatted}</td>
      <td class="p-4 text-slate-500 font-mono">${dateStr}</td>
      <td class="p-4 text-center">
        <button onclick="deleteSubmission('${sub.id}')" class="text-red-500 hover:text-red-700 transition-colors">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Admin delete submission
window.deleteSubmission = async function(id) {
  if (confirm("Bạn có chắc chắn muốn xóa lượt thi này?")) {
    try {
      await db.collection("quiz_submissions").doc(id).delete();
      showToast("Đã xóa kết quả bài thi thành công.", "done");
      loadAdminLeaderboard();
      loadGlobalStats();
    } catch (e) {
      console.error(e);
      showToast("Lỗi xóa lượt thi!", "error");
    }
  }
};

// Admin search submissions
document.getElementById("admin-search-leaderboard").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  const filtered = allAdminLeaderboard.filter(sub => 
    sub.name.toLowerCase().includes(q) || 
    sub.operatorId.toLowerCase().includes(q) || 
    sub.email.toLowerCase().includes(q)
  );
  renderAdminLeaderboardTable(filtered);
});


// Admin: Manage Questions (CRUD)
async function loadAdminQuestions() {
  const list = document.getElementById("admin-questions-list");
  list.innerHTML = `<div class="text-center text-slate-400 font-mono text-xs py-8">Đang tải đề thi...</div>`;

  try {
    const snap = await db.collection("questions").orderBy("createdAt", "asc").get();
    allAdminQuestions = [];
    snap.forEach(doc => {
      allAdminQuestions.push({ id: doc.id, ...doc.data() });
    });
    renderAdminQuestionsList(allAdminQuestions);
  } catch (error) {
    console.error("Error loading admin questions:", error);
    list.innerHTML = `<div class="text-center text-red-500 font-mono text-xs py-8">Lỗi tải bộ đề!</div>`;
  }
}

function renderAdminQuestionsList(questions) {
  const list = document.getElementById("admin-questions-list");
  list.innerHTML = "";

  if (questions.length === 0) {
    list.innerHTML = `<div class="text-center text-slate-400 font-mono text-xs py-8">Bộ câu hỏi trống. Vui lòng thêm câu hỏi mới.</div>`;
    return;
  }

  questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "glass-panel p-5 rounded-lg space-y-3 relative";
    card.innerHTML = `
      <div class="flex justify-between items-start gap-4">
        <span class="font-headline font-bold text-slate-700 text-sm">Câu ${(index + 1).toString().padStart(2, "0")}</span>
        <div class="flex gap-2">
          <button onclick="editQuestion('${q.id}')" class="text-blue-500 hover:text-blue-700 transition-colors p-1" title="Sửa">
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
          <button onclick="deleteQuestion('${q.id}')" class="text-red-500 hover:text-red-700 transition-colors p-1" title="Xóa">
            <span class="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
      
      <p class="font-semibold text-slate-800 text-xs leading-relaxed">${q.text}</p>
      <div class="text-[10px] text-slate-500 italic">Gợi ý: ${q.desc}</div>
      
      <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-600 bg-white/20 p-2 rounded">
        <div><strong class="font-mono text-slate-800">A:</strong> ${q.options.A}</div>
        <div><strong class="font-mono text-slate-800">B:</strong> ${q.options.B}</div>
        <div><strong class="font-mono text-slate-800">C:</strong> ${q.options.C}</div>
        <div><strong class="font-mono text-slate-800">D:</strong> ${q.options.D}</div>
      </div>
      <div class="text-xs font-mono font-bold text-emerald-600">Đáp án đúng: ${q.correct}</div>
    `;
    list.appendChild(card);
  });
}

// Admin cancel edit mode
document.getElementById("btn-question-cancel").addEventListener("click", () => {
  resetQuestionForm();
});

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

// Admin edit question (trigger edit mode)
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
  
  // Scroll form into view
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
      // Update
      await db.collection("questions").doc(id).update(questionData);
      showToast("Cập nhật câu hỏi thành công.", "done");
    } else {
      // Create
      await db.collection("questions").add({
        ...questionData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Thêm câu hỏi mới thành công.", "done");
    }
    resetQuestionForm();
    loadAdminQuestions();
  } catch (error) {
    console.error("Save question error:", error);
    showToast("Lưu câu hỏi thất bại!", "error");
  }
});

// Admin delete question
window.deleteQuestion = async function(id) {
  if (confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) {
    try {
      await db.collection("questions").doc(id).delete();
      showToast("Đã xóa câu hỏi thành công.", "done");
      loadAdminQuestions();
    } catch (e) {
      console.error(e);
      showToast("Lỗi xóa câu hỏi!", "error");
    }
  }
};

// ==================== APP INITIALIZATION & BINDINGS ====================

// Mobile navigation menu toggle
document.getElementById("mobile-menu-toggle").addEventListener("click", () => {
  const menu = document.getElementById("mobile-nav-menu");
  menu.classList.toggle("hidden");
});

// User profile shortcuts trigger registration modal
document.getElementById("mobile-user-badge").addEventListener("click", () => {
  if (!currentUser) showView("register");
  else showToast(`Operator: ${currentUser.name}`, "info");
});

// Nav Link bindings
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

// App initial setup load
document.addEventListener("DOMContentLoaded", async () => {
  updateSessionUI();
  loadGlobalStats();
  
  // Seed default questions if collection empty to ensure app has questions immediately
  try {
    await seedDefaultQuestions();
  } catch (e) {
    console.warn("Unable to seed questions on startup:", e);
  }
  
  // Open default home view
  showView("home");
});
