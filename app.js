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
    text: "Tác dụng của việc tuyên truyền về tác hại của ma túy là gì?",
    desc: "Nâng cao nhận thức phòng ngừa tệ nạn ma túy.",
    options: {
      A: "Nâng cao nhận thức việc sử dụng ma túy",
      B: "Giảm tỷ lệ sử dụng ma túy và nâng cao nhận thức cộng đồng",
      C: "Phát huy sức mạnh của cộng đồng trong phòng, chống ma túy",
      D: "Cả B và C đều đúng"
    },
    correct: "D"
  },
  {
    text: "Quá trình nghiện ma túy thường trải qua những giai đoạn nào?",
    desc: "Tìm hiểu tiến trình lệ thuộc chất gây nghiện.",
    options: {
      A: "Lạm dụng ma túy => sử dụng ma túy => lệ thuộc ma túy.",
      B: "Sử dụng ma túy => lạm dụng ma túy => lệ thuộc ma túy.",
      C: "Lệ thuộc ma túy => sử dụng ma túy => lạm dụng ma túy.",
      D: "Sử dụng ma túy => lệ thuộc ma túy => lạm dụng ma túy."
    },
    correct: "B"
  },
  {
    text: "Dấu hiệu nào sau đây có thể nhận biết người nghiện Heroine?",
    desc: "Các biểu hiện lâm sàng đặc trưng của người sử dụng Heroine.",
    options: {
      A: "Ngáp vặt, nổi da gà, sợ nước, tiêu chảy, lở loét",
      B: "Mắt đỏ, môi thâm, ngáp vặt, sợ nước",
      C: "Răng vỡ vụn, mắt lờ đờ",
      D: "Răng đen, môi lở loét"
    },
    correct: "B"
  },
  {
    text: "Khi sử dụng ma túy, một trong những dấu hiệu thường thấy về mặt lời nói là gì?",
    desc: "Sự thay đổi trong giao tiếp và phát ngôn của người sử dụng chất kích thích.",
    options: {
      A: "Lời nói hoảng loạn, dễ bị kích động",
      B: "Nói chuyện nhanh, khó kiểm soát và không có sự mạch lạc",
      C: "U uất, ít nói, ngại giao tiếp",
      D: "Cả A, B, C đều đúng"
    },
    correct: "D"
  },
  {
    text: "Người sử dụng ma túy bằng hình thức tiêm chích có thể có dấu hiệu nào trên cơ thể?",
    desc: "Các dấu hiệu tổn thương vật lý trên bề mặt da.",
    options: {
      A: "Da có nhiều vết lở loét, dấu vết thâm tím, da sạm đen",
      B: "Da khô, xanh xao, xuất hiện vết thương hoặc vết tiêm",
      C: "Da mịn màng, không có vết thâm",
      D: "Không có bất kỳ dấu hiệu nào"
    },
    correct: "A"
  },
  {
    text: "Người sử dụng ma túy thường có biểu hiện gì trong ánh mắt?",
    desc: "Sự thay đổi về đồng tử và trạng thái của mắt.",
    options: {
      A: "Đôi mắt sáng, tỉnh táo và tập trung do tác dụng của ma túy",
      B: "Mắt đỏ, giãn đồng tử hoặc co nhỏ",
      C: "Đôi mắt vô hồn, không có sức sống",
      D: "Đáp án B, C đều đúng"
    },
    correct: "D"
  },
  {
    text: "Một trong những dấu hiệu thể hiện người sử dụng ma túy là sự thay đổi trong học tập và công việc. Họ có thể:",
    desc: "Hiệu suất và thái độ thực hiện công việc hàng ngày.",
    options: {
      A: "Tăng cường hiệu suất công việc và học tập",
      B: "Tìm cách tránh nhiệm vụ và không hoàn thành công việc",
      C: "Dễ dàng hoàn thành mọi nhiệm vụ",
      D: "Tăng cường làm việc hiệu quả và sáng tạo"
    },
    correct: "B"
  },
  {
    text: "Nếu bạn nhận thấy một bạn học trông rất mệt mỏi, hay ngủ gật, hoảng loạn, tâm lý thay đổi nhanh chóng trong lớp, bạn có thể nghi ngờ gì?",
    desc: "Nhận biết các bất thường tâm lý và thể trạng của học sinh.",
    options: {
      A: "Họ đang bị ảnh hưởng của ma túy hoặc thiếu ngủ",
      B: "Họ chỉ đơn giản là mệt vì học tập",
      C: "Họ khỏe mạnh và không có vấn đề gì",
      D: "Họ bị ốm và cần nghỉ ngơi"
    },
    correct: "A"
  },
  {
    text: "Để không đi vào con đường nghiện ma túy, học sinh cần chú ý điều gì?",
    desc: "Các nguyên tắc tự bảo vệ và phòng ngừa cá nhân.",
    options: {
      A: "Không tò mò, tìm cách dùng thử chất ma túy.",
      B: "Chỉ dùng thử chất ma túy một lần duy nhất để biết.",
      C: "Cảnh giác trước những đồ ăn vặt không rõ nguồn gốc.",
      D: "Đáp án A, C là đúng."
    },
    correct: "D"
  },
  {
    text: "Khi phát hiện bạn bè hoặc người thân có hành vi sử dụng chất ma túy, em nên lựa chọn cách ứng xử nào dưới đây?",
    desc: "Ứng xử trách nhiệm khi phát hiện người thân cận sử dụng ma túy.",
    options: {
      A: "Giữ bí mật cho bạn, không để người khác kì thị rồi tránh xa bạn.",
      B: "Im lặng và không quan tâm vì việc đó không ảnh hưởng gì tới mình.",
      C: "Nhanh chóng báo cáo thông tin tới thầy, cô, cơ quan chức năng gần nhất.",
      D: "Tuyệt đối che giấu thông tin để bảo vệ người thân, bạn bè."
    },
    correct: "C"
  },
  {
    text: "Nội dung nào dưới đây không đúng khi bàn về con đường dẫn đến nghiện ma túy đá?",
    desc: "Nhận thức sai lầm về mức độ gây nghiện của ma túy đá.",
    options: {
      A: "Tò mò muốn tìm hiểu cảm giác lạ khi sử dụng chất ma túy.",
      B: "Muốn thể hiện bản thân, khẳng định cái tôi với bạn bè.",
      C: "Bị bạn bè lôi kéo, xúi giục, kích động sử dụng ma túy.",
      D: "Ma túy đá là một loại biệt dược, không gây nghiện cho người sử dụng."
    },
    correct: "D"
  },
  {
    text: "Nội dung nào dưới đây không phản ánh đúng dấu hiệu nhận biết học sinh nghiện ma túy?",
    desc: "Các biểu hiện thể trạng tích cực trái ngược với tình trạng nghiện.",
    options: {
      A: "Bị toát mồ hôi, ngáp vặt, ngủ gật, da xanh tái, nổi da gà.",
      B: "Hay lo sợ, hoang tưởng, tính cách thay đổi thất thường.",
      C: "Cất giấu chất ma túy hoặc dụng cụ sử dụng chất ma túy.",
      D: "Cơ thể đầy đặn, khỏe mạnh, thần thái tươi tỉnh, học lực tốt."
    },
    correct: "D"
  },
  {
    text: "Khi phát hiện bạn bè sử dụng ma túy, bạn nên làm gì?",
    desc: "Cách giúp đỡ bạn bè vượt qua cám dỗ ma túy an toàn.",
    options: {
      A: "Giúp họ tìm kiếm sự hỗ trợ từ gia đình, nhà trường và cơ quan y tế",
      B: "Tham gia sử dụng cùng để hiểu hơn",
      C: "Im lặng và không can thiệp",
      D: "Cười nhạo và xa lánh họ"
    },
    correct: "A"
  },
  {
    text: "Để phòng tránh ma túy, học sinh cần làm gì?",
    desc: "Kế hoạch chủ động phòng chống tệ nạn xã hội trong học đường.",
    options: {
      A: "Tăng cường sức khỏe thể chất và tham gia các hoạt động tích cực",
      B: "Tìm hiểu kỹ về tác hại của tệ nạn ma túy",
      C: "Tìm hiểu kỹ những thủ đoạn dụ dỗ lôi kéo tham gia sử dụng ma túy",
      D: "Cả A, B, C đều đúng"
    },
    correct: "D"
  },
  {
    text: "Một người bạn của bạn liên tục thể hiện hành vi bạo lực và kích động. Điều này có thể là dấu hiệu gì?",
    desc: "Nhận biết biểu hiện hành vi thay đổi do chất kích thích.",
    options: {
      A: "Người đó đang trong tình trạng căng thẳng của bản thân",
      B: "Người đó có thể đang sử dụng ma túy hoặc các chất kích thích",
      C: "Người đó đang gặp phải vấn đề về gia đình nhưng không liên quan đến ma túy",
      D: "Đáp án A, B là đúng"
    },
    correct: "D"
  },
  {
    text: "Trong tình huống bạn phát hiện có người sử dụng ma túy trong trường học, bạn cần làm gì ngay lập tức?",
    desc: "Hành động khẩn cấp đảm bảo an toàn học đường.",
    options: {
      A: "Báo ngay cho giáo viên hoặc nhà trường để xử lý kịp thời",
      B: "Bỏ qua và không can thiệp",
      C: "Nói chuyện riêng với người đó",
      D: "Tự giải quyết mà không cần sự giúp đỡ"
    },
    correct: "A"
  },
  {
    text: "Nếu bạn nghe thông tin từ bạn bè rằng họ sử dụng ma túy, bạn sẽ làm gì?",
    desc: "Ứng xử phù hợp khi nghe thông tin từ bạn bè sử dụng ma túy.",
    options: {
      A: "Đưa ra lời khuyên và khuyến khích họ ngừng sử dụng",
      B: "Báo cho thầy cô, gia đình, cơ quan chức năng gần nhất",
      C: "Không quan tâm vì đó là chuyện của họ",
      D: "Cả A và B đều đúng"
    },
    correct: "D"
  },
  {
    text: "Nếu bạn nghi ngờ rằng bạn bè đang sử dụng ma túy, nhưng chưa có căn cứ, bạn sẽ làm gì?",
    desc: "Tìm kiếm sự giúp đỡ từ người có trách nhiệm.",
    options: {
      A: "Thảo luận trực tiếp với người đó về nghi ngờ của mình",
      B: "Báo cáo với giáo viên hoặc gia đình để tìm kiếm sự giúp đỡ",
      C: "Không làm gì và để mọi thứ tự nhiên",
      D: "Cố gắng tìm kiếm thêm bằng chứng trước khi làm gì"
    },
    correct: "B"
  },
  {
    text: "Trong trường hợp người bạn của bạn đang lén lút, bí mật cất giấu đồ vật nghi vấn là chất ma túy, bạn nên làm gì để giúp đỡ họ?",
    desc: "Xử lý thông tin phát hiện chất nghi vấn.",
    options: {
      A: "Đưa họ đến cơ quan y tế hoặc tìm kiếm sự giúp đỡ chuyên môn",
      B: "Để họ tự giải quyết và không can thiệp",
      C: "Báo cho thầy cô về phát hiện của mình",
      D: "Cố gắng khuyên nhủ mà không cần sự giúp đỡ của người lớn"
    },
    correct: "C"
  },
  {
    text: "Nếu bạn phát hiện bạn thân bị ngất xỉu do sử dụng ma túy, bạn sẽ làm gì?",
    desc: "Sơ cấp cứu khẩn cấp cho người bị ngộ độc hoặc sốc thuốc.",
    options: {
      A: "Tự chăm sóc và chờ đợi họ tỉnh dậy",
      B: "Gọi ngay cho cấp cứu hoặc bác sĩ để can thiệp kịp thời",
      C: "Gọi báo Cảnh sát về phát hiện của mình",
      D: "Cả B và C đều đúng"
    },
    correct: "D"
  },
  {
    text: "Nếu bạn thấy một người bạn bị ảnh hưởng bởi ma túy và có dấu hiệu ngừng thở, bạn nên làm gì?",
    desc: "Hành vi cứu trợ khẩn cấp đối với người suy hô hấp.",
    options: {
      A: "Đừng làm gì, để họ tự phục hồi",
      B: "Gọi ngay cấp cứu và thực hiện các biện pháp sơ cứu nếu có thể",
      C: "Cố gắng tự giải quyết vấn đề mà không cần sự giúp đỡ",
      D: "Chờ đợi họ tự tỉnh lại"
    },
    correct: "B"
  },
  {
    text: "Nếu bạn nghi ngờ người thân mang theo ma túy, bạn nên làm gì?",
    desc: "Ứng xử trách nhiệm đối với nghi ngờ người thân sử dụng.",
    options: {
      A: "Quan sát hành vi của họ",
      B: "Tìm hiểu thông tin về ma túy",
      C: "Báo cho gia đình hoặc cơ quan chức năng",
      D: "Tất cả các đáp án trên"
    },
    correct: "D"
  },
  {
    text: "Làm thế nào để không bị bạn bè rủ rê, lôi kéo vào con đường sử dụng ma túy:",
    desc: "Rèn luyện bản lĩnh từ chối và phòng chống lôi kéo.",
    options: {
      A: "Không quan hệ bạn bè",
      B: "Không nghe theo sự cám dỗ, mời mọc, thách thức của bạn bè.",
      C: "Không tập hút thuốc lá điện tử",
      D: "Tất cả các đáp án trên"
    },
    correct: "B"
  },
  {
    text: "Nếu bạn thấy người lạ bán ma túy gần trường học, bạn nên làm gì?",
    desc: "Tố giác tội phạm ma túy quanh khu vực học đường.",
    options: {
      A: "Báo cho giáo viên hoặc ban giám hiệu",
      B: "Báo cho cơ quan chức năng",
      C: "Không can thiệp để tránh rắc rối",
      D: "Cả A và B đều đúng"
    },
    correct: "D"
  },
  {
    text: "Nếu bạn được mời thử ma túy tại một bữa tiệc, bạn nên làm gì?",
    desc: "Cách ứng xử kiên quyết từ chối lời mời sử dụng chất kích thích.",
    options: {
      A: "Từ chối và rời khỏi bữa tiệc",
      B: "Thử một chút để không bị lạc lõng",
      C: "Nhờ bạn bè giúp đỡ",
      D: "Tất cả các đáp án trên"
    },
    correct: "A"
  },
  {
    text: "Nếu một người bị bắt khi đang mang ma túy trong người nhưng khẳng định là không biết đó là ma túy, họ có thể bị xử lý như thế nào?",
    desc: "Kiến thức pháp luật về tội tàng trữ trái phép chất ma túy.",
    options: {
      A: "Không bị xử lý vì không biết",
      B: "Bị xử lý về tội tàng trữ ma túy nếu chứng minh được ma túy là của họ",
      C: "Không bị xử lý nếu chứng minh được họ không phải người mang ma túy",
      D: "Bị xử lý nhẹ vì thiếu hiểu biết"
    },
    correct: "B"
  },
  {
    text: "Nếu bạn phát hiện bạn bè mình sử dụng ma túy nhưng không can thiệp, bạn sẽ chịu trách nhiệm gì?",
    desc: "Trách nhiệm pháp lý liên quan đến việc không tố giác tội phạm ma túy.",
    options: {
      A: "Không chịu trách nhiệm vì đó là quyền của họ",
      B: "Có thể chịu trách nhiệm về việc không báo cáo cho người có thẩm quyền",
      C: "Bạn sẽ không phải chịu trách nhiệm gì",
      D: "Bạn chỉ phải chịu trách nhiệm nếu bạn tham gia vào việc sử dụng ma túy"
    },
    correct: "B"
  },
  {
    text: "Nếu bạn nghe tin đồn về một nhóm người đang tổ chức bán ma túy trong trường học, bạn nên làm gì?",
    desc: "Hành động đúng đắn khi tiếp nhận thông tin tội phạm ma túy học đường.",
    options: {
      A: "Không làm gì và giữ im lặng",
      B: "Báo ngay cho nhà trường hoặc cơ quan chức năng để họ điều tra",
      C: "Tìm hiểu thêm và tham gia cùng họ",
      D: "Khuyến khích bạn bè sử dụng ma túy để hiểu cảm giác"
    },
    correct: "B"
  },
  {
    text: "Nếu một người bạn của bạn yêu cầu bạn giúp giấu ma túy trong cặp sách, bạn nên làm gì?",
    desc: "Kiên quyết từ chối đồng lõa tàng trữ và vận chuyển ma túy trái phép.",
    options: {
      A: "Cứ làm theo yêu cầu của bạn để giữ tình bạn",
      B: "Báo ngay cho giáo viên hoặc cơ quan Công an về tình huống này",
      C: "Không làm gì và để họ tự quyết định",
      D: "Giấu ma túy vì nghĩ rằng không có gì nghiêm trọng"
    },
    correct: "B"
  },
  {
    text: "Khi biết một bạn học đang sử dụng ma túy nhưng bạn không chắc chắn, bạn nên làm gì?",
    desc: "Báo cáo xác minh để giúp đỡ bạn học kịp thời.",
    options: {
      A: "Để họ tự quyết định việc sử dụng",
      B: "Khuyến khích bạn ấy tiếp tục thử nghiệm ma túy",
      C: "Tìm kiếm sự giúp đỡ từ giáo viên hoặc phụ huynh để kiểm tra thông tin",
      D: "Giữ im lặng và không làm gì"
    },
    correct: "C"
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

// Helper to shuffle an array in-place
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Seed questions into firestore
async function seedDefaultQuestions() {
  const snap = await db.collection("questions").get();
  // We need to re-seed if the collection is empty, if it has less than 30 questions, or if the old traffic safety questions are present.
  let needReSeed = snap.empty || snap.size < 30;
  
  if (!snap.empty && (needReSeed || (snap.docs[0].data().text && (snap.docs[0].data().text.includes("xe cứu thương") || snap.docs[0].data().text.includes("ngạt nước") || snap.docs[0].data().text.includes("hỏa hoạn"))))) {
    needReSeed = true;
    const batch = db.batch();
    snap.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("Cleared old/incomplete questions for re-seeding.");
  }

  if (needReSeed) {
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
    
    let allQuestions = [];
    snap.forEach(doc => {
      allQuestions.push({ id: doc.id, ...doc.data() });
    });

    if (allQuestions.length === 0) {
      showToast("Lỗi: Không tìm thấy hồ sơ câu hỏi!", "error");
      btnInit.disabled = false;
      btnInit.innerHTML = `<span class="material-symbols-outlined">key</span> MỞ HỒ SƠ CHUYÊN ÁN`;
      return;
    }

    // Shuffle and pick 10 questions randomly
    shuffle(allQuestions);
    quizQuestions = allQuestions.slice(0, Math.min(10, allQuestions.length));

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
  tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 font-mono">Đang tải danh sách thành viên...</td></tr>`;

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
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 font-mono">Không tìm thấy thông tin thành viên.</td></tr>`;
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
  if (confirm("Hành động này sẽ xóa vĩnh viễn thành viên khỏi hệ thống! Tiếp tục?")) {
    try {
      await db.collection("operators").doc(id).delete();
      showToast("Xóa thành viên thành công.", "done");
      loadAdminOperators();
      loadGlobalStats();
    } catch (e) {
      console.error(e);
      showToast("Lỗi xóa thành viên!", "error");
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
  tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 font-mono">Đang nạp bảng kết quả khảo sát...</td></tr>`;

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
    tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-500 font-mono">Chưa có kết quả khảo sát nào được ghi nhận.</td></tr>`;
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
  if (confirm("Xóa kết quả khảo sát này?")) {
    try {
      await db.collection("quiz_submissions").doc(id).delete();
      showToast("Đã xóa kết quả khảo sát.", "done");
      loadAdminLeaderboard();
      loadGlobalStats();
    } catch (e) {
      console.error(e);
      showToast("Xóa kết quả thất bại!", "error");
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
    list.innerHTML = `<div class="text-center text-slate-500 font-mono text-xs py-8">Ngân hàng câu hỏi trống. Vui lòng thêm câu hỏi mới!</div>`;
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
      showToast("Cập nhật câu hỏi thành công.", "done");
    } else {
      await db.collection("questions").add({
        ...questionData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("Thêm câu hỏi thành công.", "done");
    }
    resetQuestionForm();
    loadAdminQuestions();
  } catch (error) {
    console.error("Save question error:", error);
    showToast("Lỗi lưu câu hỏi!", "error");
  }
});

// Admin delete question
window.deleteQuestion = async function(id) {
  if (confirm("Xóa câu hỏi này?")) {
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

// ==================== DOCX IMPORT ENGINE ====================

// DOCX file trigger click
document.getElementById("btn-import-docx-trigger").addEventListener("click", () => {
  document.getElementById("admin-import-docx").click();
});

// Parse DOCX plain text using regex matching questions, options, and key
function parseDocxQuestions(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let currentQ = null;
  let pendingQuestionText = false;

  for (let line of lines) {
    // Check standalone number first (e.g. "10." or "10")
    const qStandaloneNumMatch = line.match(/^(\d+)\s*[\.\t]?$/);
    if (qStandaloneNumMatch) {
      if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
        questions.push(currentQ);
      }
      pendingQuestionText = true;
      currentQ = null; // reset currentQ to wait for text
      continue;
    }

    // Check if we are waiting for question text after a standalone number
    if (pendingQuestionText) {
      currentQ = {
        text: line,
        desc: "Phân tích kỹ lưỡng dữ liệu chuyên án trước khi đưa ra quyết định.",
        options: {},
        correct: ""
      };
      pendingQuestionText = false;
      continue;
    }

    // Check if line marks a new question
    // Case 1: starts with "Câu 10:" or "Question 10."
    const qLabelMatch = line.match(/^(?:Câu|Question)\s*\d+[:\t\.]+\s*(.*)/i);
    // Case 2: starts with "10." or "10\t"
    const qNumMatch = line.match(/^(\d+)\s*[\.\t]+\s*(.*)/);

    if (qLabelMatch) {
      if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
        questions.push(currentQ);
      }
      currentQ = {
        text: qLabelMatch[1].trim(),
        desc: "Phân tích kỹ lưỡng dữ liệu chuyên án trước khi đưa ra quyết định.",
        options: {},
        correct: ""
      };
      continue;
    } else if (qNumMatch) {
      if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
        questions.push(currentQ);
      }
      currentQ = {
        text: qNumMatch[2].trim(),
        desc: "Phân tích kỹ lưỡng dữ liệu chuyên án trước khi đưa ra quyết định.",
        options: {},
        correct: ""
      };
      continue;
    }

    if (!currentQ) continue;

    // Check for custom description/hint
    const descMatch = line.match(/^(?:Mô tả|Gợi ý|Hint|Desc)[:\t\.]?\s*(.*)/i);
    if (descMatch) {
      currentQ.desc = descMatch[1].trim();
      continue;
    }

    // Check for options A, B, C, D
    const optAMatch = line.match(/^A[:\.\)\t]\s*(.*)/i);
    if (optAMatch) { currentQ.options.A = optAMatch[1].trim(); continue; }

    const optBMatch = line.match(/^B[:\.\)\t]\s*(.*)/i);
    if (optBMatch) { currentQ.options.B = optBMatch[1].trim(); continue; }

    const optCMatch = line.match(/^C[:\.\)\t]\s*(.*)/i);
    if (optCMatch) { currentQ.options.C = optCMatch[1].trim(); continue; }

    const optDMatch = line.match(/^D[:\.\)\t]\s*(.*)/i);
    if (optDMatch) { currentQ.options.D = optDMatch[1].trim(); continue; }

    // Check for correct answer key
    const correctMatch = line.match(/^(?:Đáp án|Đáp án đúng|Key|Answer)[:\t\.]?\s*([A-D])/i);
    if (correctMatch) {
      currentQ.correct = correctMatch[1].toUpperCase();
      continue;
    }
  }

  // Push the final question
  if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
    questions.push(currentQ);
  }

  return questions;
}

// DOCX file input handler
document.getElementById("admin-import-docx").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const arrayBuffer = evt.target.result;
    
    // Call Mammoth to extract text
    mammoth.extractRawText({ arrayBuffer: arrayBuffer })
      .then(async function(result) {
        const text = result.value;
        const parsedQs = parseDocxQuestions(text);
        
        if (parsedQs.length === 0) {
          showToast("Không tìm thấy câu hỏi đúng định dạng trong tệp Word!", "error");
          return;
        }

        if (confirm(`Tìm thấy ${parsedQs.length} câu hỏi hợp lệ từ file Word. Tiến hành tải lên cơ sở dữ liệu?`)) {
          const btnTrigger = document.getElementById("btn-import-docx-trigger");
          const originalText = btnTrigger.innerHTML;
          btnTrigger.disabled = true;
          btnTrigger.innerHTML = `<span class="material-symbols-outlined animate-spin text-base">refresh</span> ĐANG TẢI LÊN...`;

          try {
            const batch = db.batch();
            parsedQs.forEach(q => {
              const ref = db.collection("questions").doc();
              batch.set(ref, {
                ...q,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
            });
            
            await batch.commit();
            showToast(`Nhập thành công ${parsedQs.length} câu hỏi mới vào ngân hàng đề!`, "done");
            loadAdminQuestions();
          } catch (err) {
            console.error("Batch upload error:", err);
            showToast("Lỗi đẩy dữ liệu lên cơ sở dữ liệu!", "error");
          } finally {
            btnTrigger.disabled = false;
            btnTrigger.innerHTML = originalText;
            e.target.value = ""; // clear input
          }
        }
      })
      .catch(function(err) {
        console.error(err);
        showToast("Lỗi phân tích tệp DOCX!", "error");
      });
  };
  
  reader.readAsArrayBuffer(file);
});

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
