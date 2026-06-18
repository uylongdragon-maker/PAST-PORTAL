"use client";

import { useState, useEffect, useRef } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/analytics";
import * as mammoth from "mammoth";
import QRCode from "qrcode";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZsGLAoR5Agwm4VlSa5kiJbpKPYoPhOmg",
  authDomain: "past-temp.firebaseapp.com",
  projectId: "past-temp",
  storageBucket: "past-temp.firebasestorage.app",
  messagingSenderId: "1054323376412",
  appId: "1:1054323376412:web:7db6fc98c3817c9052bad9",
  measurementId: "G-6RRCYZYQ2P"
};

// Initialize Firebase compat
let app;
let db;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
  db = firebase.firestore(app);
} else {
  app = firebase.app();
  db = firebase.firestore(app);
}

// 30 Drug Prevention & Education Questions
const defaultQuestions = [
  {
    text: "Tác dụng của việc tuyên truyền về tác hại của ma túy là gì?",
    desc: "Tuyên truyền giúp nâng cao nhận thức cá nhân, từ đó giảm tỷ lệ thử nghiệm/sử dụng ma túy và huy động sức mạnh đoàn kết toàn dân trong việc đẩy lùi tệ nạn xã hội.",
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
    desc: "Tiến trình nghiện ma túy điển hình đi từ Sử dụng (thử nghiệm) -> Lạm dụng (thường xuyên, sai mục đích) -> Lệ thuộc (nghiện nặng, mất kiểm soát thể chất/tâm lý).",
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
    desc: "Sự thiếu hụt chất trong cơ thể gây ra hội chứng cai như ngáp liên tục, sợ nước/ngại tắm, mắt lờ đờ đỏ ngầu và môi thâm tím.",
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
    desc: "Chất ma túy kích thích hoặc ức chế hệ thần kinh trung ương mạnh mẽ, khiến người dùng nói nhanh, không kiểm soát, mất mạch lạc hoặc đột ngột u uất, ít nói.",
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
    desc: "Việc dùng kim tiêm thường để lại vết kim chích, thâm tím dọc tĩnh mạch (như khuỷu tay, mu bàn tay, cổ chân) kèm theo da sạm, dễ lở loét do nhiễm trùng.",
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
    desc: "Sự tác động lên hệ thần kinh tự chủ khiến đồng tử bị co nhỏ hoặc giãn to bất thường, mắt đỏ ngầu, ánh nhìn lờ đờ vô hồn.",
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
    desc: "Sự lệ thuộc chất làm mất tập trung, suy giảm trí lực và hoại tử trách nhiệm, dẫn đến thường xuyên trốn tránh công việc, sa sút học lực.",
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
    desc: "Những biểu hiện bất thường về tâm lý như ảo giác, hoảng loạn hoặc ngủ gật liên tục là dấu hiệu cảnh báo cao về việc sử dụng chất cấm hoặc kiệt sức nặng.",
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
    desc: "Bảo vệ bản thân bằng cách tuyệt đối không dùng thử ma túy dù chỉ 1 lần, đồng thời nâng cao cảnh giác trước bánh kẹo, nước uống lạ không rõ nguồn gốc.",
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
    desc: "Im lặng hay che giấu sẽ gián tiếp hại họ. Báo cáo nhanh cho thầy cô hoặc người lớn để tìm kiếm sự hỗ trợ cai nghiện là giải pháp nhân văn và an toàn nhất.",
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
    desc: "Ma túy đá (Methamphetamine) là chất ma túy tổng hợp cực kỳ nguy hiểm, gây nghiện mạnh và tàn phá nghiêm trọng não bộ ngay từ những lần sử dụng đầu.",
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
    desc: "Người nghiện ma túy bị suy kiệt thể trạng, da xanh xao, sụt cân và suy nhược thần kinh rõ rệt, không thể có thần thái tươi tỉnh hay thể chất khỏe mạnh.",
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
    desc: "Hãy khuyên ngăn bạn và chủ động tìm kiếm sự giúp đỡ từ nhà trường, gia đình hoặc trung tâm y tế để giúp họ cai nghiện kịp thời.",
    options: {
      A: "Giúp họ tìm kiếm sự hỗ trợ từ gia đình, nhà trường và cơ quan y tế",
      B: "Tham gia sử cùng để hiểu hơn",
      C: "Im lặng và không can thiệp",
      D: "Cười nhạo và xa lánh họ"
    },
    correct: "A"
  },
  {
    text: "Để phòng tránh ma túy, học sinh cần làm gì?",
    desc: "Tự phòng vệ chủ động bằng cách trang bị đầy đủ kiến thức pháp luật, hiểu rõ tác hại của ma túy và tích cực tham gia các hoạt động thể chất lành mạnh.",
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
    desc: "Hành vi kích động hoặc bạo lực bất thường có thể do sang chấn tâm lý hoặc do tác động của ma túy đá gây hoang tưởng, ảo giác hung hãn.",
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
    desc: "Hành động báo ngay cho ban giám hiệu/giáo viên giúp ngăn chặn kịp thời các rủi ro mất an toàn học đường cho bản thân và bạn học xung quanh.",
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
    desc: "Ứng xử đúng đắn là khuyên nhủ họ ngừng lại và chủ động báo tin cho thầy cô, gia đình để can thiệp y tế sớm nhất.",
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
    desc: "Báo cáo cho người lớn có trách nhiệm (thầy cô, cha mẹ) để họ xác minh, giúp đỡ bạn một cách an toàn, tránh tự ý điều tra gây nguy hiểm.",
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
    desc: "Báo cáo với thầy cô là phương án an toàn nhất giúp ngăn ngừa tàng trữ chất cấm trong khuôn viên trường học và hỗ trợ học sinh vi phạm.",
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
    desc: "Đây là ca sốc thuốc nguy cấp đe dọa tính mạng. Cần lập tức gọi cấp cứu 115 và báo công an để xử lý nguồn độc chất kịp thời.",
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
    desc: "Suy hô hấp cấp do quá liều là cực kỳ nguy kịch. Cần gọi 115 lập tức và tiến hành hồi sức tim phổi (CPR) nếu có chuyên môn.",
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
    desc: "Cần tiếp cận an toàn: quan sát hành vi, tìm hiểu tác hại và báo cho gia đình hoặc cơ quan công an để có hướng tháo gỡ kịp thời.",
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
    desc: "Xây dựng bản lĩnh kiên quyết nói 'Không' trước mọi lời cám dỗ, mời mọc, thách đố của bạn bè đối với các chất gây nghiện.",
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
    desc: "Hãy báo cáo ngay cho giáo viên và công an địa phương để bảo vệ môi trường học đường lành mạnh, ngăn chặn tội phạm dụ dỗ học sinh.",
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
    desc: "Từ chối dứt khoát và nhanh chóng rời khỏi địa điểm để tránh bị ép buộc hoặc liên đới vào các hành vi vi phạm pháp luật.",
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
    desc: "Theo quy định pháp luật, việc tàng trữ chất cấm là hành vi phạm pháp hình sự. Việc bào chữa 'không biết' không đương nhiên được miễn tội.",
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
    desc: "Biết hành vi tàng trữ/sử dụng trái phép chất ma túy mà không tố giác có thể cấu thành hành vi không tố giác tội phạm theo quy định pháp luật.",
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
    desc: "Báo ngay cho nhà trường hoặc cơ quan công an là cách xử lý đúng đắn để họ kịp thời điều tra phá chuyên án học đường.",
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
    desc: "Giúp cất giấu ma túy cấu thành hành vi đồng phạm tàng trữ trái phép chất ma túy. Phải kiên quyết từ chối và thông báo cho người lớn xử lý.",
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
    desc: "Cách tốt nhất là thông báo cho nhà trường/phụ huynh để họ kiểm tra tinh tế, hỗ trợ kịp thời cho học sinh đó trước khi sa ngã sâu hơn.",
    options: {
      A: "Để họ tự quyết định việc sử dụng",
      B: "Khuyến khích bạn ấy tiếp tục thử nghiệm ma túy",
      C: "Tìm kiếm sự giúp đỡ từ giáo viên hoặc phụ huynh để kiểm tra thông tin",
      D: "Giữ im lặng và không làm gì"
    },
    correct: "C"
  }
];

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

// Format milliseconds to MM:SS.MS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

export default function Page() {
  const [currentView, setCurrentView] = useState("home"); // home, register, quiz, leaderboard, admin-login, admin
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ totalOperators: 0, totalSubmissions: 0, avgAccuracy: 0 });

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizTimeElapsed, setQuizTimeElapsed] = useState(0);
  const [quizTimerInterval, setQuizTimerInterval] = useState(null);

  // Leaderboard data
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardSearch, setLeaderboardSearch] = useState("");

  // Admin Data
  const [adminTab, setAdminTab] = useState("operators"); // operators, submissions, questions
  const [adminOperators, setAdminOperators] = useState([]);
  const [adminSubmissions, setAdminSubmissions] = useState([]);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState("");
  
  // Search states inside Admin
  const [adminSearchOp, setAdminSearchOp] = useState("");
  const [adminSearchSub, setAdminSearchSub] = useState("");

  // Admin forms
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [qText, setQText] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrect, setQCorrect] = useState("A");

  // Registration Form
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Admin Login Form
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // Toast States
  const [toast, setToast] = useState({ show: false, message: "", icon: "info" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  // Trigger seeding & check updates on component mount
  useEffect(() => {
    // Read localstorage
    const savedUser = localStorage.getItem("past_operator");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    const savedAdmin = localStorage.getItem("past_admin_auth") === "true";
    setIsAdminAuthenticated(savedAdmin);

    seedDefaultQuestions();
    loadGlobalStats();

    // Cleanup timers
    return () => {
      if (quizTimerInterval) clearInterval(quizTimerInterval);
    };
  }, []);

  // Sync timer logic
  useEffect(() => {
    if (quizStartTime && quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - quizStartTime;
        setQuizTimeElapsed(elapsed);
      }, 45);
      setQuizTimerInterval(interval);
      return () => clearInterval(interval);
    }
  }, [quizStartTime, quizQuestions, currentQuestionIndex]);

  // Seeding Database
  const seedDefaultQuestions = async () => {
    // Check sessionStorage to bypass network request if checked in this session
    if (typeof window !== "undefined" && sessionStorage.getItem("past_questions_seeded") === "true") {
      return;
    }
    try {
      const snap = await db.collection("questions").get();
      let needReSeed = snap.empty || snap.size < 30;

      // Force re-seed if the old description/hint text is detected (to upgrade to the new explanation schema)
      if (!snap.empty && !needReSeed) {
        const firstDocDesc = snap.docs[0].data().desc;
        if (firstDocDesc && (firstDocDesc.includes("Nâng cao nhận thức phòng ngừa tệ nạn ma túy.") || firstDocDesc.includes("Tìm hiểu tiến trình lệ thuộc"))) {
          needReSeed = true;
        }
      }

      if (!snap.empty && (needReSeed || (snap.docs[0].data().text && (snap.docs[0].data().text.includes("xe cứu thương") || snap.docs[0].data().text.includes("ngạt nước") || snap.docs[0].data().text.includes("hỏa hoạn"))))) {
        needReSeed = true;
        const batch = db.batch();
        snap.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log("Cleared old questions collection.");
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
        console.log("Seeded 30 drug prevention questions with explanations.");
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("past_questions_seeded", "true");
      }
    } catch (e) {
      console.warn("Seeding warn:", e);
    }
  };

  // Toast helper
  const showToast = (message, icon = "info") => {
    setToast({ show: true, message, icon });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Load global stats (optimized to run queries in parallel)
  const loadGlobalStats = async () => {
    try {
      const [opSnap, subSnap] = await Promise.all([
        db.collection("operators").get(),
        db.collection("quiz_submissions").get()
      ]);

      let totalAcc = 0;
      subSnap.forEach(doc => {
        totalAcc += doc.data().accuracy || 0;
      });

      const avgAcc = subSnap.size > 0 ? Math.round(totalAcc / subSnap.size) : 0;
      setStats({
        totalOperators: opSnap.size,
        totalSubmissions: subSnap.size,
        avgAccuracy: avgAcc
      });
    } catch (error) {
      console.error("Stats load error:", error);
    }
  };

  // Spa view manager
  const showView = (viewId) => {
    if (viewId === "quiz" && !currentUser) {
      showToast("Vui lòng đăng ký hồ sơ Thám tử trước!", "warning");
      setCurrentView("register");
      return;
    }
    if (viewId === "admin-dashboard") {
      if (!isAdminAuthenticated) {
        setCurrentView("admin-login");
      } else {
        setCurrentView("admin");
        loadAdminDashboard();
      }
      return;
    }
    setCurrentView(viewId);
    setMobileMenuOpen(false);

    if (viewId === "leaderboard") {
      loadLeaderboardData();
    } else if (viewId === "home") {
      loadGlobalStats();
    }
  };

  // Load Leaderboard data
  const loadLeaderboardData = async () => {
    try {
      const snap = await db.collection("quiz_submissions").get();
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by accuracy (descending), then timeElapsed (ascending) in memory to avoid Firestore index requirement
      list.sort((a, b) => {
        const accuracyA = a.accuracy ?? 0;
        const accuracyB = b.accuracy ?? 0;
        if (accuracyB !== accuracyA) {
          return accuracyB - accuracyA;
        }
        const timeA = a.timeElapsed ?? 999999;
        const timeB = b.timeElapsed ?? 999999;
        return timeA - timeB;
      });

      setLeaderboardData(list);
    } catch (e) {
      console.error(e);
      showToast("Lỗi nạp bảng xếp hạng!", "error");
    }
  };

  // Admin Auth Login
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUser === "admin" && adminPass === "past123") {
      setIsAdminAuthenticated(true);
      localStorage.setItem("past_admin_auth", "true");
      showToast("Đăng nhập Admin thành công!", "done");
      setCurrentView("admin");
      loadAdminDashboard();
    } else {
      showToast("Sai tài khoản hoặc mật khẩu!", "error");
    }
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem("past_admin_auth");
    showToast("Đã đăng xuất tài khoản quản trị.", "info");
    setCurrentView("home");
  };

  // Generate QR Code of the app origin URL
  const generateAdminQRCode = async () => {
    try {
      const url = window.location.origin;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
      setAdminQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  };

  // Admin load data
  const loadAdminDashboard = () => {
    loadAdminOperators();
    loadAdminLeaderboard();
    loadAdminQuestions();
    generateAdminQRCode();
  };

  const loadAdminOperators = async () => {
    try {
      const snap = await db.collection("operators").orderBy("createdAt", "desc").get();
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAdminOperators(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdminLeaderboard = async () => {
    try {
      const snap = await db.collection("quiz_submissions").orderBy("createdAt", "desc").get();
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAdminSubmissions(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAdminQuestions = async () => {
    try {
      const snap = await db.collection("questions").orderBy("createdAt", "asc").get();
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setAdminQuestions(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete handlers inside admin
  const handleDeleteOperator = async (id) => {
    if (confirm("Hành động này sẽ xóa vĩnh viễn thành viên khỏi hệ thống! Tiếp tục?")) {
      try {
        await db.collection("operators").doc(id).delete();
        showToast("Xóa thành viên thành công.", "done");
        loadAdminOperators();
        loadGlobalStats();
      } catch (e) {
        showToast("Lỗi xóa thành viên!", "error");
      }
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (confirm("Xóa kết quả khảo sát này?")) {
      try {
        await db.collection("quiz_submissions").doc(id).delete();
        showToast("Đã xóa kết quả khảo sát.", "done");
        loadAdminLeaderboard();
        loadGlobalStats();
      } catch (e) {
        showToast("Xóa kết quả thất bại!", "error");
      }
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (confirm("Xóa câu hỏi này?")) {
      try {
        await db.collection("questions").doc(id).delete();
        showToast("Đã xóa câu hỏi.", "done");
        loadAdminQuestions();
      } catch (e) {
        showToast("Lỗi xóa câu hỏi!", "error");
      }
    }
  };

  // Edit / Save Question CRUD Form
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setQText(q.text);
    setQDesc(q.desc);
    setQOptA(q.options.A);
    setQOptB(q.options.B);
    setQOptC(q.options.C);
    setQOptD(q.options.D);
    setQCorrect(q.correct);
    
    // Scroll form into view
    const titleEl = document.getElementById("admin-question-form-title");
    if (titleEl) titleEl.scrollIntoView({ behavior: "smooth" });
  };

  const resetQuestionForm = () => {
    setEditingQuestionId("");
    setQText("");
    setQDesc("");
    setQOptA("");
    setQOptB("");
    setQOptC("");
    setQOptD("");
    setQCorrect("A");
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    const questionData = {
      text: qText.trim(),
      desc: qDesc.trim(),
      options: {
        A: qOptA.trim(),
        B: qOptB.trim(),
        C: qOptC.trim(),
        D: qOptD.trim()
      },
      correct: qCorrect
    };

    try {
      if (editingQuestionId) {
        await db.collection("questions").doc(editingQuestionId).update(questionData);
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
      console.error(error);
      showToast("Lỗi lưu câu hỏi!", "error");
    }
  };

  // Guest Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);

    const emailClean = regEmail.trim().toLowerCase();
    try {
      const snap = await db.collection("operators").where("email", "==", emailClean).limit(1).get();

      if (!snap.empty) {
        // Log in
        const doc = snap.docs[0];
        const user = { id: doc.id, ...doc.data() };
        setCurrentUser(user);
        localStorage.setItem("past_operator", JSON.stringify(user));
        showToast(`Ủy quyền thành công! Thám tử ${user.name} đã sẵn sàng.`, "done");
      } else {
        // Register new
        const randId = Math.floor(1000 + Math.random() * 9000);
        const operatorId = `DET-${randId}-PAST`;
        const newUser = {
          name: regName.trim(),
          email: emailClean,
          phone: regPhone.trim(),
          operatorId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection("operators").add(newUser);
        const userWithId = { id: docRef.id, ...newUser };
        setCurrentUser(userWithId);
        localStorage.setItem("past_operator", JSON.stringify(userWithId));
        showToast("Cấp phù hiệu Thám tử thành công!", "done");
      }
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setCurrentView("home");
    } catch (err) {
      console.error(err);
      showToast("Lỗi đăng ký! Vui lòng thử lại.", "error");
    } finally {
      setRegLoading(false);
    }
  };

  // Guest Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("past_operator");
    showToast("Phù hiệu thám tử đã được hủy ủy quyền.", "info");
    setCurrentView("home");
  };

  // Start quiz logic
  const handleStartQuiz = async () => {
    if (!currentUser) {
      showToast("Bạn cần nhận Phù hiệu thám tử trước!", "warning");
      setCurrentView("register");
      return;
    }

    try {
      // Questions are already seeded on mount; loading directly to speed up transition
      const snap = await db.collection("questions").orderBy("createdAt", "asc").get();
      const allQs = [];
      snap.forEach(doc => {
        allQs.push({ id: doc.id, ...doc.data() });
      });

      if (allQs.length === 0) {
        showToast("Lỗi: Không tìm thấy ngân hàng câu hỏi!", "error");
        return;
      }

      // Shuffle and take 10 random
      shuffle(allQs);
      const selected = allQs.slice(0, Math.min(10, allQs.length));

      setQuizQuestions(selected);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizTimeElapsed(0);
      setQuizStartTime(Date.now());
      setCurrentView("quiz-active");
    } catch (error) {
      console.error(error);
      showToast("Lỗi tải đề thi!", "error");
    }
  };

  const handleSelectOption = (optKey) => {
    // Prevent selecting another option once answered
    if (userAnswers[currentQuestionIndex]) return;

    const question = quizQuestions[currentQuestionIndex];
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = {
      questionId: question.id,
      selectedOption: optKey,
      isCorrect: optKey === question.correct
    };
    setUserAnswers(updatedAnswers);
  };

  const handleNextQuizQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    const elapsed = Date.now() - quizStartTime;
    setQuizTimeElapsed(elapsed);

    const correctCount = userAnswers.filter(ans => ans && ans.isCorrect).length;
    const totalQuestions = quizQuestions.length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const timeFormatted = formatTime(elapsed);

    const submission = {
      operatorId: currentUser.operatorId,
      name: currentUser.name,
      email: currentUser.email,
      accuracy,
      correctCount,
      totalQuestions,
      timeElapsed: elapsed,
      timeFormatted,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection("quiz_submissions").add(submission);
      showToast("Gửi kết quả khảo sát thành công!", "done");
    } catch (e) {
      console.error(e);
      showToast("Đã ghi nhận kết quả (Lưu trữ offline)!", "info");
    }
    setCurrentView("quiz-result");
  };

  // Word DOCX parser
  const parseDocxQuestions = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const questions = [];
    let currentQ = null;
    let pendingQuestionText = false;

    for (let line of lines) {
      const qStandaloneNumMatch = line.match(/^(\d+)\s*[\.\t]?$/);
      if (qStandaloneNumMatch) {
        if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
          questions.push(currentQ);
        }
        pendingQuestionText = true;
        currentQ = null;
        continue;
      }

      if (pendingQuestionText) {
        currentQ = {
          text: line,
          desc: "Phòng chống tệ nạn xã hội và bảo vệ an ninh học đường.",
          options: {},
          correct: ""
        };
        pendingQuestionText = false;
        continue;
      }

      const qLabelMatch = line.match(/^(?:Câu|Question)\s*\d+[:\t\.]+\s*(.*)/i);
      const qNumMatch = line.match(/^(\d+)\s*[\.\t]+\s*(.*)/);

      if (qLabelMatch) {
        if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
          questions.push(currentQ);
        }
        currentQ = {
          text: qLabelMatch[1].trim(),
          desc: "Phòng chống tệ nạn xã hội và bảo vệ an ninh học đường.",
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
          desc: "Phòng chống tệ nạn xã hội và bảo vệ an ninh học đường.",
          options: {},
          correct: ""
        };
        continue;
      }

      if (!currentQ) continue;

      const descMatch = line.match(/^(?:Mô tả|Gợi ý|Hint|Desc|Giải thích)[:\t\.]?\s*(.*)/i);
      if (descMatch) {
        currentQ.desc = descMatch[1].trim();
        continue;
      }

      const optAMatch = line.match(/^A[:\.\)\t]\s*(.*)/i);
      if (optAMatch) { currentQ.options.A = optAMatch[1].trim(); continue; }

      const optBMatch = line.match(/^B[:\.\)\t]\s*(.*)/i);
      if (optBMatch) { currentQ.options.B = optBMatch[1].trim(); continue; }

      const optCMatch = line.match(/^C[:\.\)\t]\s*(.*)/i);
      if (optCMatch) { currentQ.options.C = optCMatch[1].trim(); continue; }

      const optDMatch = line.match(/^D[:\.\)\t]\s*(.*)/i);
      if (optDMatch) { currentQ.options.D = optDMatch[1].trim(); continue; }

      const correctMatch = line.match(/^(?:Đáp án|Đáp án đúng|Key|Answer|Đáp án chuẩn)[:\t\.]?\s*([A-D])/i);
      if (correctMatch) {
        currentQ.correct = correctMatch[1].toUpperCase();
        continue;
      }
    }

    if (currentQ && currentQ.text && currentQ.options.A && currentQ.options.B && currentQ.options.C && currentQ.options.D && currentQ.correct) {
      questions.push(currentQ);
    }
    return questions;
  };

  const handleDocxUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      const arrayBuffer = evt.target.result;
      mammoth.extractRawText({ arrayBuffer })
        .then(async (result) => {
          const text = result.value;
          const parsedQs = parseDocxQuestions(text);

          if (parsedQs.length === 0) {
            showToast("Không tìm thấy câu hỏi đúng định dạng trong file .docx!", "error");
            return;
          }

          if (confirm(`Tìm thấy ${parsedQs.length} câu hỏi hợp lệ từ file Word. Tiến hành tải lên cơ sở dữ liệu?`)) {
            setImporting(true);
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
              showToast(`Nhập thành công ${parsedQs.length} câu hỏi mới!`, "done");
              loadAdminQuestions();
            } catch (err) {
              console.error(err);
              showToast("Lỗi tải câu hỏi lên database!", "error");
            } finally {
              setImporting(false);
              e.target.value = "";
            }
          }
        })
        .catch(err => {
          console.error(err);
          showToast("Lỗi đọc file .docx!", "error");
        });
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtered operators and submissions in admin view
  const filteredAdminOperators = adminOperators.filter(op =>
    op.name.toLowerCase().includes(adminSearchOp.toLowerCase().trim()) ||
    op.email.toLowerCase().includes(adminSearchOp.toLowerCase().trim()) ||
    op.operatorId.toLowerCase().includes(adminSearchOp.toLowerCase().trim())
  );

  const filteredAdminSubmissions = adminSubmissions.filter(sub =>
    sub.name.toLowerCase().includes(adminSearchSub.toLowerCase().trim()) ||
    sub.operatorId.toLowerCase().includes(adminSearchSub.toLowerCase().trim()) ||
    sub.email.toLowerCase().includes(adminSearchSub.toLowerCase().trim())
  );

  // Filtered leaderboard search
  const filteredLeaderboard = leaderboardData.filter(sub =>
    sub.name.toLowerCase().includes(leaderboardSearch.toLowerCase().trim()) ||
    sub.operatorId.toLowerCase().includes(leaderboardSearch.toLowerCase().trim())
  );

  // RENDER ADMIN WORKSPACE (Full screen light theme)
  if (currentView === "admin") {
    return (
      <div id="admin-workspace" class="min-h-screen flex flex-col md:flex-row bg-transparent font-body relative">
        {/* Admin Sidebar */}
        <aside class="w-full md:w-64 admin-sidebar flex flex-col p-6 space-y-8 flex-shrink-0">
          <div>
            <div class="font-headline text-xl font-black tracking-tighter text-slate-800 flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span> P.A.S.T ADMIN
            </div>
            <p class="text-[9px] text-slate-400 font-mono tracking-widest mt-1">HỆ THỐNG ĐIỀU HÀNH</p>
          </div>

          <nav class="flex-grow flex flex-col gap-2">
            <button 
              onClick={() => setAdminTab("operators")}
              class={`admin-nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-headline font-bold uppercase tracking-wider ${adminTab === "operators" ? "active" : ""}`}
            >
              <span class="material-symbols-outlined text-base">groups</span> Danh sách Thành viên
            </button>
            <button 
              onClick={() => setAdminTab("submissions")}
              class={`admin-nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-headline font-bold uppercase tracking-wider ${adminTab === "submissions" ? "active" : ""}`}
            >
              <span class="material-symbols-outlined text-base">analytics</span> Kết quả Khảo sát
            </button>
            <button 
              onClick={() => setAdminTab("questions")}
              class={`admin-nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-headline font-bold uppercase tracking-wider ${adminTab === "questions" ? "active" : ""}`}
            >
              <span class="material-symbols-outlined text-base">quiz</span> Quản lý Câu hỏi
            </button>
          </nav>

          {/* QR Code Quick Action */}
          {adminQrCodeUrl && (
            <div class="bg-white/60 border border-slate-200/60 p-4 rounded-xl space-y-3 shadow-sm text-center">
              <div class="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">MÃ QR TRÒ CHƠI</div>
              <div class="bg-white p-2 rounded-lg inline-block border border-slate-100 shadow-inner">
                <img src={adminQrCodeUrl} alt="Game QR Code" class="w-28 h-28 mx-auto" />
              </div>
              <a 
                href={adminQrCodeUrl} 
                download="past_portal_qr_game.png"
                class="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-headline font-bold rounded-lg transition-all tracking-wider text-[10px] flex items-center justify-center gap-1.5 uppercase shadow-sm"
              >
                <span class="material-symbols-outlined text-sm">download</span> Tải mã QR
              </a>
            </div>
          )}

          <div class="space-y-3 pt-6 border-t border-slate-200">
            <div class="text-[10px] text-slate-400 font-mono">HỆ THỐNG HOẠT ĐỘNG</div>
            <button onClick={handleAdminLogout} class="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 font-headline font-bold rounded-lg transition-all tracking-wider text-xs flex items-center justify-center gap-1.5 uppercase">
              <span class="material-symbols-outlined text-sm">logout</span> ĐĂNG XUẤT ADMIN
            </button>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main class="flex-grow p-6 md:p-10 overflow-y-auto space-y-8 relative z-10">
          
          {/* Tab: Operators */}
          {adminTab === "operators" && (
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 class="font-headline text-2xl font-black text-slate-800 uppercase tracking-tight">Quản lý Thành viên CLB</h2>
                  <p class="text-xs text-slate-505">Danh sách toàn bộ thành viên tình nguyện đăng ký tham gia hoạt động.</p>
                </div>
                <input 
                  value={adminSearchOp}
                  onChange={(e) => setAdminSearchOp(e.target.value)}
                  class="rounded glass-input border-none px-4 py-2.5 text-xs font-mono w-64 shadow-inner" 
                  placeholder="Tìm kiếm thành viên..." 
                  type="text"
                />
              </div>

              <div class="glass-panel rounded-xl overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-white/40 border-b border-slate-200/50 text-slate-500 font-bold uppercase tracking-wider font-mono">
                      <th class="p-4">Họ và Tên</th>
                      <th class="p-4">Email liên lạc</th>
                      <th class="p-4">Số điện thoại</th>
                      <th class="p-4">Mã số</th>
                      <th class="p-4 text-center">Xóa thành viên</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100/50">
                    {filteredAdminOperators.length === 0 ? (
                      <tr>
                        <td colSpan="5" class="p-4 text-center text-slate-500 font-mono">
                          Không tìm thấy thông tin thành viên.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminOperators.map(op => (
                        <tr key={op.id} class="admin-table-row border-b border-slate-800/40">
                          <td class="p-4 font-semibold text-slate-700">{op.name}</td>
                          <td class="p-4 font-mono text-slate-505">{op.email}</td>
                          <td class="p-4 font-mono text-slate-505">{op.phone}</td>
                          <td class="p-4 font-mono text-amber-500 font-bold">{op.operatorId}</td>
                          <td class="p-4 text-center">
                            <button onClick={() => handleDeleteOperator(op.id)} class="text-red-400 hover:text-red-600 transition-colors">
                              <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Leaderboard Submissions */}
          {adminTab === "submissions" && (
            <div class="space-y-6">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h2 class="font-headline text-2xl font-black text-slate-800 uppercase tracking-tight">Kết quả Khảo sát & Đánh giá</h2>
                  <p class="text-xs text-slate-500">Báo cáo kết quả bài kiểm tra trắc nghiệm của các thành viên.</p>
                </div>
                <input 
                  value={adminSearchSub}
                  onChange={(e) => setAdminSearchSub(e.target.value)}
                  class="rounded glass-input border-none px-4 py-2.5 text-xs font-mono w-64 shadow-inner" 
                  placeholder="Tìm kiếm bài thi..." 
                  type="text"
                />
              </div>

              <div class="glass-panel rounded-xl overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="bg-white/40 border-b border-slate-200/50 text-slate-500 font-bold uppercase tracking-wider font-mono">
                      <th class="p-4">Mã thành viên</th>
                      <th class="p-4">Họ và Tên</th>
                      <th class="p-4">Độ chính xác</th>
                      <th class="p-4">Thời gian</th>
                      <th class="p-4">Ngày nộp bài</th>
                      <th class="p-4 text-center">Xóa kết quả</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100/50">
                    {filteredAdminSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="6" class="p-4 text-center text-slate-500 font-mono">
                          Chưa có kết quả khảo sát nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminSubmissions.map(sub => {
                        const dateStr = sub.createdAt ? new Date(sub.createdAt.seconds * 1000).toLocaleString("vi-VN") : "---";
                        return (
                          <tr key={sub.id} class="admin-table-row border-b border-slate-800/40">
                            <td class="p-4 font-mono font-bold text-amber-500">{sub.operatorId}</td>
                            <td class="p-4 font-semibold text-slate-700">{sub.name}</td>
                            <td class="p-4 font-semibold text-slate-700">{sub.accuracy}% ({sub.correctCount}/{sub.totalQuestions})</td>
                            <td class="p-4 font-mono text-slate-505">{sub.timeFormatted}</td>
                            <td class="p-4 text-slate-500 font-mono">{dateStr}</td>
                            <td class="p-4 text-center">
                              <button onClick={() => handleDeleteSubmission(sub.id)} class="text-red-400 hover:text-red-650 transition-colors">
                                <span class="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Question Bank CRUD */}
          {adminTab === "questions" && (
            <div class="space-y-6">
              <div class="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 class="font-headline text-2xl font-black text-slate-800 uppercase tracking-tight">Ngân hàng Câu hỏi Trắc nghiệm</h2>
                  <p class="text-xs text-slate-500">Quản lý câu hỏi kiểm tra kiến thức nghiệp vụ phòng chống ma túy.</p>
                </div>
                <div>
                  <input type="file" id="admin-import-docx" accept=".docx" onChange={handleDocxUpload} class="hidden" />
                  <button 
                    disabled={importing}
                    onClick={() => document.getElementById("admin-import-docx").click()}
                    class="btn-glass px-4 py-2.5 rounded text-xs font-bold text-sky-600 hover:text-sky-500 border border-slate-200 uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                  >
                    <span class="material-symbols-outlined text-base">cloud_upload</span> 
                    {importing ? "ĐANG TẢI LÊN..." : "Nhập đề từ file .docx"}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form */}
                <div class="lg:col-span-5 glass-panel rounded-xl p-6 space-y-4 self-start shadow-sm">
                  <h3 id="admin-question-form-title" class="font-headline text-sm font-bold text-slate-850 uppercase tracking-wider">
                    {editingQuestionId ? "Cập Nhật Câu Hỏi" : "Thêm Câu Hỏi Mới"}
                  </h3>
                  
                  <form onSubmit={handleSaveQuestion} class="space-y-4">
                    <div class="space-y-1">
                      <label class="font-mono text-[10px] text-slate-500 uppercase font-bold" htmlFor="q-text">Nội dung câu hỏi</label>
                      <textarea 
                        value={qText}
                        onChange={(e) => setQText(e.target.value)}
                        class="w-full rounded glass-input border-none px-3 py-2 text-xs text-slate-800" 
                        id="q-text" 
                        rows="3" 
                        placeholder="Nhập nội dung câu hỏi..." 
                        required
                      ></textarea>
                    </div>

                    <div class="space-y-1">
                      <label class="font-mono text-[10px] text-slate-500 uppercase font-bold" htmlFor="q-desc">Giải thích / Gợi ý đáp án</label>
                      <input 
                        value={qDesc}
                        onChange={(e) => setQDesc(e.target.value)}
                        class="w-full rounded glass-input border-none px-3 py-2 text-xs text-slate-800" 
                        id="q-desc" 
                        placeholder="Nhập giải thích chi tiết..." 
                        required 
                        type="text"
                      />
                    </div>

                    <div class="space-y-2 pt-2 border-t border-slate-200">
                      <label class="font-mono text-[10px] text-slate-500 uppercase font-bold">Các phương án trả lời</label>
                      <div class="flex gap-2 items-center">
                        <span class="font-bold text-xs text-slate-500 font-mono">A</span>
                        <input 
                          value={qOptA}
                          onChange={(e) => setQOptA(e.target.value)}
                          class="w-full rounded glass-input border-none px-3 py-1.5 text-xs text-slate-800" 
                          placeholder="Phương án A" 
                          required 
                          type="text"
                        />
                      </div>
                      <div class="flex gap-2 items-center">
                        <span class="font-bold text-xs text-slate-500 font-mono">B</span>
                        <input 
                          value={qOptB}
                          onChange={(e) => setQOptB(e.target.value)}
                          class="w-full rounded glass-input border-none px-3 py-1.5 text-xs text-slate-800" 
                          placeholder="Phương án B" 
                          required 
                          type="text"
                        />
                      </div>
                      <div class="flex gap-2 items-center">
                        <span class="font-bold text-xs text-slate-500 font-mono">C</span>
                        <input 
                          value={qOptC}
                          onChange={(e) => setQOptC(e.target.value)}
                          class="w-full rounded glass-input border-none px-3 py-1.5 text-xs text-slate-800" 
                          placeholder="Phương án C" 
                          required 
                          type="text"
                        />
                      </div>
                      <div class="flex gap-2 items-center">
                        <span class="font-bold text-xs text-slate-500 font-mono">D</span>
                        <input 
                          value={qOptD}
                          onChange={(e) => setQOptD(e.target.value)}
                          class="w-full rounded glass-input border-none px-3 py-1.5 text-xs text-slate-800" 
                          placeholder="Phương án D" 
                          required 
                          type="text"
                        />
                      </div>
                    </div>

                    <div class="space-y-1 pt-2 border-t border-slate-200">
                      <label class="font-mono text-[10px] text-slate-500 uppercase font-bold" htmlFor="q-correct">Đáp án đúng</label>
                      <select 
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        class="w-full rounded glass-input border-none px-3 py-2 text-xs font-mono text-slate-800" 
                        id="q-correct"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>

                    <div class="flex gap-2 pt-4">
                      <button class="btn-gold flex-1 py-2.5 rounded text-xs uppercase font-bold tracking-wider" type="submit">
                        {editingQuestionId ? "Cập nhật" : "Lưu câu hỏi"}
                      </button>
                      {editingQuestionId && (
                        <button onClick={resetQuestionForm} class="btn-glass px-4 py-2.5 rounded text-xs uppercase font-semibold tracking-wider text-slate-600" type="button">
                          Hủy
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List */}
                <div class="lg:col-span-7 space-y-4">
                  <h3 class="font-headline text-lg font-bold text-slate-850 uppercase tracking-tight">Danh sách câu hỏi hiện tại</h3>
                  <div class="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                    {adminQuestions.length === 0 ? (
                      <div class="text-center text-slate-500 font-mono text-xs py-8">Ngân hàng câu hỏi trống. Vui lòng thêm câu hỏi mới!</div>
                    ) : (
                      adminQuestions.map((q, idx) => (
                        <div key={q.id} class="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-3 relative">
                          <div class="flex justify-between items-start gap-4">
                            <span class="font-headline font-bold text-slate-400 text-xs">Câu {(idx + 1).toString().padStart(2, "0")}</span>
                            <div class="flex gap-2">
                              <button onClick={() => handleEditQuestion(q)} class="text-sky-400 hover:text-sky-600 transition-colors p-1" title="Sửa">
                                <span class="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button onClick={() => handleDeleteQuestion(q.id)} class="text-red-400 hover:text-red-600 transition-colors p-1" title="Xóa">
                                <span class="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                          <p class="font-semibold text-slate-200 text-xs leading-relaxed">{q.text}</p>
                          <div class="text-[10px] text-slate-500 italic">Gợi ý: {q.desc}</div>
                          <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                            <div><strong class="font-mono text-slate-300">A:</strong> {q.options.A}</div>
                            <div><strong class="font-mono text-slate-300">B:</strong> {q.options.B}</div>
                            <div><strong class="font-mono text-slate-300">C:</strong> {q.options.C}</div>
                            <div><strong class="font-mono text-slate-300">D:</strong> {q.options.D}</div>
                          </div>
                          <div class="text-xs font-mono font-bold text-emerald-400">Đáp án đúng: {q.correct}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
        
        {/* Toast alert component inside Admin */}
        {toast.show && (
          <div class="toast-notification show">
            <span class="material-symbols-outlined text-sky-600">{toast.icon}</span>
            <div class="text-xs font-headline font-bold text-slate-800">{toast.message}</div>
          </div>
        )}
      </div>
    );
  }

  // GUEST RENDER WORKSPACE
  return (
    <div id="guest-layout" class="flex flex-col min-h-screen">
      
      {/* Mobile Top Bar Navigation */}
      <nav class="md:hidden fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50 h-16 flex items-center justify-between px-6 shadow-sm">
        <div class="font-headline text-lg font-black tracking-tighter text-slate-900 flex items-center gap-1.5">
          <img src="/logo.png" alt="P.A.S.T Logo" class="w-8 h-8 object-contain"/> P.A.S.T. DETECTIVE
        </div>
        <div class="flex items-center gap-4">
          <div onClick={() => showView("register")} class="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden cursor-pointer flex items-center justify-center">
            <span class="material-symbols-outlined text-slate-500 text-lg">badge</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} class="text-slate-600 p-1">
            <span class="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div id="mobile-nav-menu" class="fixed top-16 left-0 w-full z-45 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-lg flex flex-col p-6 space-y-4 md:hidden">
          <button onClick={() => showView("home")} class="mobile-nav-link flex items-center gap-3 py-2 text-slate-600 font-semibold text-left">
            <span class="material-symbols-outlined">folder_open</span> Hồ sơ Chuyên án
          </button>
          <button onClick={() => showView("quiz")} class="mobile-nav-link flex items-center gap-3 py-2 text-slate-600 font-semibold text-left">
            <span class="material-symbols-outlined">extension</span> Giải mã Chuyên án
          </button>
          <button onClick={() => showView("leaderboard")} class="mobile-nav-link flex items-center gap-3 py-2 text-slate-600 font-semibold text-left">
            <span class="material-symbols-outlined">format_list_numbered</span> Bảng xếp hạng Thám tử
          </button>
          <button onClick={() => showView("admin-dashboard")} class="mobile-nav-link flex items-center gap-3 py-2 text-slate-600 font-semibold text-left">
            <span class="material-symbols-outlined">key</span> Đăng nhập Quản trị
          </button>
          <hr class="border-slate-200"/>
          <div class="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 led-glowing"></span> 
            DETECTIVE: <span class="session-op-id uppercase">{currentUser ? currentUser.operatorId : "VÔ DANH"}</span>
          </div>
          {currentUser && (
            <button onClick={handleLogout} class="w-full py-2 bg-red-50 text-red-600 rounded font-semibold text-center border border-red-200 text-xs tracking-wider uppercase font-headline">
              Hủy ủy quyền (Đăng Xuất)
            </button>
          )}
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside class="hidden md:flex flex-col h-screen fixed left-0 top-0 pt-6 pb-6 glass-panel z-40 w-64 border-r border-white/60">
        <div class="px-6 mb-6 flex flex-col items-center">
          <div class="mb-3">
            <img src="/logo.png" alt="P.A.S.T Logo" class="w-20 h-20 object-contain drop-shadow-md"/>
          </div>
          <h2 class="font-headline text-base text-slate-800 tracking-wide text-center font-bold truncate max-w-full px-2 uppercase">
            {currentUser ? currentUser.name : "CHƯA ĐĂNG KÝ"}
          </h2>
          <p class="font-mono text-[10px] text-slate-400 mt-1 flex items-center gap-1 justify-center">
            <span class={`w-1.5 h-1.5 rounded-full ${currentUser ? "bg-emerald-500 led-glowing" : "bg-slate-300"}`}></span> 
            Badge ID: <span class="session-op-id">{currentUser ? currentUser.operatorId : "--------"}</span>
          </p>
        </div>

        <nav class="flex-grow flex flex-col gap-1.5 px-4">
          <button 
            onClick={() => showView("home")} 
            class={`nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-slate-650 hover:bg-white/50 hover:text-slate-900 transition-all ${currentView === "home" ? "bg-sky-50 text-sky-600 border-l-4 border-sky-500 shadow-sm animate-pulse-subtle" : ""}`}
          >
            <span class="material-symbols-outlined text-xl">folder_open</span>
            <span class="font-headline text-sm font-semibold tracking-wider">Hồ sơ Chuyên án</span>
          </button>
          <button 
            onClick={() => showView("quiz")} 
            class={`nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-slate-650 hover:bg-white/50 hover:text-slate-900 transition-all ${currentView === "quiz" || currentView.startsWith("quiz-") ? "bg-sky-50 text-sky-600 border-l-4 border-sky-500 shadow-sm" : ""}`}
          >
            <span class="material-symbols-outlined text-xl">extension</span>
            <span class="font-headline text-sm font-semibold tracking-wider">Giải mã Chuyên án</span>
          </button>
          <button 
            onClick={() => showView("leaderboard")} 
            class={`nav-link flex items-center gap-3 px-4 py-3 rounded-lg text-slate-650 hover:bg-white/50 hover:text-slate-900 transition-all ${currentView === "leaderboard" ? "bg-sky-50 text-sky-600 border-l-4 border-sky-500 shadow-sm" : ""}`}
          >
            <span class="material-symbols-outlined text-xl">format_list_numbered</span>
            <span class="font-headline text-sm font-semibold tracking-wider">Bảng xếp hạng</span>
          </button>
        </nav>

        <div class="px-4 mt-auto space-y-2">
          {!currentUser ? (
            <button onClick={() => showView("register")} class="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-headline font-bold rounded-lg transition-all tracking-wider text-xs flex items-center justify-center gap-1.5 shadow-md">
              <span class="material-symbols-outlined text-base">assignment_ind</span> ĐĂNG KÝ THÁM TỬ
            </button>
          ) : (
            <button onClick={handleLogout} class="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-headline font-bold rounded-lg transition-all tracking-wider text-xs flex items-center justify-center gap-1.5 uppercase">
              <span class="material-symbols-outlined text-base">logout</span> HỦY ỦY QUYỀN
            </button>
          )}
          <hr class="border-slate-200/50" />
          <button onClick={() => showView("admin-dashboard")} class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-headline font-semibold rounded-lg transition-all text-[11px] flex items-center justify-center gap-1">
            <span class="material-symbols-outlined text-sm">shield</span> CỔNG QUẢN TRỊ
          </button>
        </div>
      </aside>

      {/* Main View Canvas */}
      <main class="flex-grow pt-24 pb-16 md:pl-72 px-6 max-w-[1400px] w-full mx-auto relative z-10">
        
        {/* View: Home */}
        {currentView === "home" && (
          <section class="space-y-12">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div class="lg:col-span-7 space-y-6 detective-crosshair relative py-4">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded border border-white/60 bg-white/50 text-slate-800 font-mono text-[10px] tracking-wider shadow-sm">
                  <span class="w-2.5 h-2.5 rounded-full bg-sky-500 led-glowing"></span>
                  PHÒNG CHỐNG TỆ NẠN MA TÚY HỌC ĐƯỜNG
                </div>
                <h1 class="font-headline text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none uppercase">
                  Thám Tử Học Đường <br/>
                  <span class="text-sky-600">Phòng Chống Ma Túy</span>
                </h1>
                <p class="font-headline text-lg text-slate-600 font-medium tracking-wide">
                  Game tương tác tuyên truyền phòng chống ma túy của CLB P.A.S.T.
                </p>
                <div class="border-l-4 border-sky-500 pl-4 py-1 text-slate-600 text-sm leading-relaxed typewriter-text">
                  Hệ thống kêu gọi học sinh, sinh viên và cộng đồng đóng vai trò là các **Thám tử điều tra phòng chống ma túy**. Nhiệm vụ của bạn là giải mã các câu hỏi tình huống thực tế để nhận biết tác hại của ma túy và nâng cao kỹ năng tự vệ trước tệ nạn xã hội.
                </div>
                <div class="flex flex-wrap gap-4 pt-2">
                  <button onClick={handleStartQuiz} class="btn-gold scanline-btn px-8 py-3.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 font-bold">
                    <span class="material-symbols-outlined text-lg">crisis_alert</span> GIẢI MÃ CHUYÊN ÁN
                  </button>
                  {!currentUser && (
                    <button onClick={() => showView("register")} class="btn-glass px-8 py-3.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 font-semibold">
                      <span class="material-symbols-outlined text-lg">badge</span> ĐĂNG KÝ PHÙ HIỆU
                    </button>
                  )}
                </div>
              </div>

              {/* Graphic Logo */}
              <div class="lg:col-span-5 relative">
                <div class="glass-panel folder-tab rounded-xl p-6 h-[320px] md:h-[380px] flex flex-col items-center justify-center overflow-hidden relative">
                  <div class="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-emerald-500/5 mix-blend-overlay"></div>
                  <img alt="P.A.S.T Logo" class="w-44 h-44 object-contain drop-shadow-2xl animate-pulse" src="/logo.png"/>
                  <h3 class="font-headline text-slate-800 text-sm font-bold mt-4 uppercase tracking-wider text-center">Chiến dịch Thám tử</h3>
                  <p class="text-[10px] text-slate-500 font-mono tracking-widest text-center mt-1">ĐỒNG LÒNG ĐẨY LÙI TỆ NẠN MA TÚY</p>
                  <div class="absolute top-6 right-6 font-mono text-right text-[10px] text-slate-505 tracking-wider">
                    <div>STATUS: ACTIVE</div>
                    <div>GAME_MODE: DRUG_PREV</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="glass-panel rounded-xl p-6 flex items-center gap-4 hover-lift">
                <div class="w-12 h-12 rounded bg-sky-50 flex items-center justify-center border border-sky-200/50 text-sky-600 flex-shrink-0">
                  <span class="material-symbols-outlined text-2xl">shield_person</span>
                </div>
                <div>
                  <div class="font-mono text-xl font-black text-slate-900">{stats.totalOperators}</div>
                  <div class="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">Thám tử danh tính</div>
                </div>
              </div>
              <div class="glass-panel rounded-xl p-6 flex items-center gap-4 hover-lift">
                <div class="w-12 h-12 rounded bg-amber-50 flex items-center justify-center border border-amber-200/50 text-amber-600 flex-shrink-0">
                  <span class="material-symbols-outlined text-2xl">extension</span>
                </div>
                <div>
                  <div class="font-mono text-xl font-black text-slate-900">{stats.totalSubmissions}</div>
                  <div class="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">Chuyên án phá thành công</div>
                </div>
              </div>
              <div class="glass-panel rounded-xl p-6 flex items-center gap-4 hover-lift">
                <div class="w-12 h-12 rounded bg-emerald-50 flex items-center justify-center border border-emerald-200/50 text-emerald-600 flex-shrink-0">
                  <span class="material-symbols-outlined text-2xl">done_all</span>
                </div>
                <div>
                  <div class="font-mono text-xl font-black text-slate-900">{stats.avgAccuracy}%</div>
                  <div class="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">Hiệu suất nghiệp vụ trung bình</div>
                </div>
              </div>
            </div>

            {/* Briefing details */}
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div class="glass-panel rounded-xl p-8 space-y-5">
                <h3 class="font-headline text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span class="material-symbols-outlined text-sky-600 text-2xl">quick_reference</span>
                  Nghiệp Vụ Phòng Chống Tệ Nạn
                </h3>
                <p class="text-slate-600 text-xs leading-relaxed typewriter-text">
                  Để được công nhận phù hiệu Thám tử Danh dự, bạn sẽ tham gia giải mã **Chuyên án Phòng Chống Ma Túy** bao gồm 10 câu hỏi ngẫu nhiên mô phỏng tình huống thực tế:
                </p>
                <ul class="space-y-2.5 font-body text-xs text-slate-600">
                  <li class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-sky-600 text-sm mt-0.5">manage_search</span>
                    <span><strong>Nhận diện hiểm họa:</strong> Nhận biết các biểu hiện sử dụng Heroine, ma túy đá và các chất gây nghiện nguy hiểm.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-sky-600 text-sm mt-0.5">manage_search</span>
                    <span><strong>Kỹ năng tự vệ:</strong> Cách từ chối rủ rê, phòng tránh lôi kéo và xử lý tình huống nghi ngờ xung quanh học đường.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="material-symbols-outlined text-sky-600 text-sm mt-0.5">manage_search</span>
                    <span><strong>Ứng phó khẩn cấp:</strong> Hướng xử trí ngộ độc, sốc thuốc và trách nhiệm thông tin cho thầy cô, gia đình, công an.</span>
                  </li>
                </ul>
              </div>

              {/* Rules and Guide */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="glass-panel rounded-xl p-6 space-y-2 border-l-4 border-l-secondary shadow-sm">
                  <h4 class="font-headline text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-amber-500 text-sm">hourglass_empty</span> Thời gian Giải mã
                  </h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Đồng hồ sẽ chạy ngay khi mở hồ sơ. Cố gắng đưa ra lựa chọn chính xác trong thời gian ngắn nhất để đạt thứ hạng cao trên Bảng vàng.
                  </p>
                </div>
                <div class="glass-panel rounded-xl p-6 space-y-2 border-l-4 border-l-sky-500 shadow-sm">
                  <h4 class="font-headline text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sky-500 text-sm">stars</span> Cấp Phù Hiệu
                  </h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Bạn cần đăng ký thông tin để hệ thống cấp Phù hiệu điện tử và định danh kết quả bài test trên bảng xếp hạng thành phố.
                  </p>
                </div>
                <div class="glass-panel rounded-xl p-6 space-y-2 border-l-4 border-l-emerald-500 shadow-sm col-span-1 md:col-span-2">
                  <h4 class="font-headline text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-emerald-500 text-sm">gavel</span> Bản sắc CLB P.A.S.T
                  </h4>
                  <p class="text-[11px] text-slate-500 leading-relaxed">
                    Chúng tôi là các tình nguyện viên đô thị, chung tay xây dựng cộng đồng an toàn, đẩy lùi tệ nạn ma túy học đường và thiết lập lá chắn bảo vệ an ninh.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* View: Register */}
        {currentView === "register" && (
          <section class="max-w-md mx-auto space-y-6">
            <div class="text-center space-y-2">
              <h2 class="font-headline text-3xl font-black text-slate-900 tracking-tight uppercase">ĐĂNG KÝ HỒ SƠ THÁM TỬ</h2>
              <p class="text-xs text-slate-500 leading-relaxed">
                Hệ thống yêu cầu xác minh thông tin liên lạc chính xác để cấp Phù hiệu Thám tử đô thị của CLB P.A.S.T.
              </p>
            </div>

            <div class="glass-panel p-8 rounded-xl space-y-4 shadow-md">
              <form onSubmit={handleRegister} class="space-y-4">
                <div class="space-y-1">
                  <label class="font-mono text-[10px] font-bold text-slate-600 uppercase" htmlFor="reg-name">Họ và tên thám tử</label>
                  <input 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    class="w-full rounded glass-input border-none px-4 py-2.5 text-sm" 
                    id="reg-name" 
                    placeholder="Nhập họ và tên..." 
                    required 
                    type="text"
                  />
                </div>
                <div class="space-y-1">
                  <label class="font-mono text-[10px] font-bold text-slate-600 uppercase" htmlFor="reg-email">Email liên hệ</label>
                  <input 
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    class="w-full rounded glass-input border-none px-4 py-2.5 text-sm font-mono" 
                    id="reg-email" 
                    placeholder="name@domain.com" 
                    required 
                    type="email"
                  />
                </div>
                <div class="space-y-1">
                  <label class="font-mono text-[10px] font-bold text-slate-600 uppercase" htmlFor="reg-phone">Số điện thoại</label>
                  <input 
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    class="w-full rounded glass-input border-none px-4 py-2.5 text-sm font-mono" 
                    id="reg-phone" 
                    placeholder="09xx xxx xxx" 
                    required 
                    type="tel"
                  />
                </div>
                
                <button 
                  disabled={regLoading}
                  class="btn-gold w-full py-3 rounded font-headline uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-6 font-bold" 
                  type="submit"
                >
                  {regLoading ? "ĐANG KHỞI TẠO..." : "Nhận Phù Hiệu & Đăng Nhập"} 
                  <span class="material-symbols-outlined font-bold text-base">shield</span>
                </button>
              </form>
            </div>
          </section>
        )}

        {/* View: Admin Login */}
        {currentView === "admin-login" && (
          <section class="max-w-xs mx-auto space-y-6">
            <div class="text-center space-y-2">
              <h2 class="font-headline text-3xl font-black text-slate-900 tracking-tight uppercase">Cổng Quản Trị</h2>
              <p class="text-xs text-slate-500">Khu vực điều hành và chỉnh sửa ngân hàng câu hỏi của ban tổ chức.</p>
            </div>

            <div class="glass-panel p-8 rounded-xl space-y-4 shadow-md">
              <form onSubmit={handleAdminLogin} class="space-y-4">
                <div class="space-y-1">
                  <label class="font-mono text-[10px] font-bold text-slate-650 uppercase" htmlFor="admin-user">Tài khoản</label>
                  <input 
                    value={adminUser}
                    onChange={(e) => setAdminUser(e.target.value)}
                    class="w-full rounded glass-input border-none px-4 py-2.5 text-sm font-mono" 
                    id="admin-user" 
                    placeholder="admin" 
                    required 
                    type="text"
                  />
                </div>
                <div class="space-y-1">
                  <label class="font-mono text-[10px] font-bold text-slate-650 uppercase" htmlFor="admin-pass">Mật khẩu</label>
                  <input 
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    class="w-full rounded glass-input border-none px-4 py-2.5 text-sm font-mono" 
                    id="admin-pass" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                  />
                </div>
                <button class="btn-gold w-full py-3 rounded font-headline uppercase tracking-wider text-xs flex items-center justify-center gap-2 mt-4 font-bold" type="submit">
                  Đăng nhập hệ thống <span class="material-symbols-outlined text-sm">shield</span>
                </button>
              </form>
            </div>
          </section>
        )}

        {/* View: Leaderboard */}
        {currentView === "leaderboard" && (
          <section class="space-y-6">
            <div class="text-center max-w-xl mx-auto space-y-2 pb-2">
              <h1 class="font-headline text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Bảng Vàng Thám Tử</h1>
              <p class="text-xs text-slate-500">
                Xếp hạng hiệu suất nghiệp vụ giải mã của các điều tra viên đô thị. Top đầu sẽ nhận danh hiệu Thám tử Đại tài của CLB.
              </p>
            </div>

            <div class="max-w-md mx-auto relative mb-6">
              <span class="absolute left-3 top-3.5 material-symbols-outlined text-slate-400 text-lg">search</span>
              <input 
                value={leaderboardSearch}
                onChange={(e) => setLeaderboardSearch(e.target.value)}
                class="w-full rounded glass-input border-none pl-10 pr-4 py-3 text-xs font-mono placeholder-slate-400 shadow-inner" 
                placeholder="Tìm Badge ID hoặc tên thám tử..." 
                type="text"
              />
            </div>

            <div class="glass-panel rounded-xl overflow-hidden shadow-md">
              <div class="grid grid-cols-12 bg-white/50 border-b border-slate-200/50 p-4 font-headline text-xs font-bold text-slate-500 uppercase tracking-wider font-mono items-center">
                <div class="col-span-2 text-center">HẠNG</div>
                <div class="col-span-6 md:col-span-5">MÃ PHÙ HIỆU / THÁM TỬ</div>
                <div class="col-span-4 md:col-span-3 text-right">ĐỘ CHÍNH XÁC</div>
                <div class="hidden md:block md:col-span-2 text-right">THỜI GIAN phá án</div>
              </div>

              <div class="divide-y divide-slate-200/40">
                {filteredLeaderboard.length === 0 ? (
                  <div class="py-12 text-center text-slate-450 font-mono text-xs">Chưa ghi nhận thám tử giải mã chuyên án.</div>
                ) : (
                  filteredLeaderboard.map((sub, idx) => {
                    const isSelf = currentUser && sub.operatorId === currentUser.operatorId;
                    return (
                      <div 
                        key={sub.id} 
                        class={`grid grid-cols-12 p-4 items-center transition-all ${isSelf ? "bg-sky-500/10 border-l-4 border-l-sky-500" : "hover:bg-white/20"}`}
                      >
                        <div class="col-span-2 text-center">
                          {idx === 0 ? (
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-slate-900 font-black text-xs shadow-sm">1</span>
                          ) : idx === 1 ? (
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">2</span>
                          ) : idx === 2 ? (
                            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">3</span>
                          ) : (
                            <span class="font-mono text-slate-500 font-bold text-xs">{idx + 1}</span>
                          )}
                        </div>
                        <div class="col-span-6 md:col-span-5">
                          <div class="font-mono text-xs font-bold text-amber-500">{sub.operatorId}</div>
                          <div class="font-headline text-[11px] text-slate-700 font-semibold truncate mt-0.5">{sub.name}</div>
                        </div>
                        <div class="col-span-4 md:col-span-3 text-right">
                          <span class="font-mono text-xs font-black text-slate-800">{sub.accuracy}%</span>
                          <span class="text-[9px] text-slate-500 block font-mono mt-0.5">({sub.correctCount}/{sub.totalQuestions} câu)</span>
                        </div>
                        <div class="hidden md:block md:col-span-2 text-right font-mono text-xs text-slate-500">
                          {sub.timeFormatted}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* View: Quiz Lobby */}
        {currentView === "quiz" && (
          <section id="quiz-pre-start" class="max-w-md mx-auto text-center space-y-6 py-8">
            <div class="w-20 h-20 rounded-full bg-sky-50 border-2 border-sky-300 flex items-center justify-center mx-auto shadow-md text-sky-600">
              <span class="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>crisis_alert</span>
            </div>

            <div class="space-y-2">
              <h2 class="font-headline text-3xl font-black text-slate-900 tracking-tight uppercase">QUY TRÌNH MỞ KHÓA CHUYÊN ÁN</h2>
              <p class="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Bảo mật thông tin tối đa. Bạn chuẩn bị giải mã **Chuyên án Phòng chống ma túy** gồm 10 câu hỏi nghiệp vụ. Hệ thống sẽ tính giờ ngay lập tức.
              </p>
            </div>

            <div class="glass-panel p-6 rounded-xl space-y-4 text-xs text-slate-500 font-mono text-left max-w-sm mx-auto shadow-inner">
              <div class="flex justify-between border-b border-slate-200/50 pb-2">
                <span>PHÂN ĐỊNH:</span>
                <span class="font-bold text-slate-700">10 CÂU HỎI TÌNH HUỐNG</span>
              </div>
              <div class="flex justify-between border-b border-slate-200/50 pb-2">
                <span>HẠN THỜI GIAN:</span>
                <span class="font-bold text-amber-500">KHÔNG GIỚI HẠN (TÍNH TỐC ĐỘ)</span>
              </div>
              <div class="flex justify-between">
                <span>HÌNH THỨC:</span>
                <span class="font-bold text-slate-700">TRẮC NGHIỆM KHÁCH QUAN</span>
              </div>
            </div>

            <button onClick={handleStartQuiz} id="btn-quiz-initiate" class="btn-gold px-8 py-3.5 rounded-lg text-xs uppercase tracking-wider font-bold inline-flex items-center gap-2">
              <span class="material-symbols-outlined">key</span> MỞ HỒ SƠ CHUYÊN ÁN
            </button>
          </section>
        )}

        {/* View: Active Quiz Arena */}
        {currentView === "quiz-active" && quizQuestions.length > 0 && (
          <section id="quiz-arena" class="max-w-2xl mx-auto space-y-6">
            {/* HUD Header */}
            <div class="flex justify-between items-center bg-white/40 border border-white/60 p-4 rounded-xl shadow-sm">
              <div class="space-y-1">
                <span class="text-[9px] text-slate-500 uppercase font-mono tracking-wider">HỒ SƠ ĐANG MỞ</span>
                <div class="font-mono text-xs font-bold text-slate-700 flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 led-glowing"></span> 
                  ĐỒNG BỘ: <span class="uppercase text-amber-500">{currentUser ? currentUser.operatorId : ""}</span>
                </div>
              </div>

              {/* Timer UI */}
              <div class="text-right space-y-1">
                <span class="text-[9px] text-slate-500 uppercase font-mono tracking-wider">THỜI GIAN PHÁ ÁN</span>
                <div id="quiz-live-timer" class={`font-mono text-sm font-bold text-slate-700 ${quizTimeElapsed > 180000 ? "timer-flash text-red-600" : ""}`}>
                  {formatTime(quizTimeElapsed)}
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div class="glass-panel p-8 rounded-2xl space-y-6 relative overflow-hidden shadow-md">
              <div class="absolute top-0 left-0 w-full h-1 bg-slate-200/50">
                <div 
                  id="quiz-progress-bar" 
                  class="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                ></div>
              </div>

              <div class="flex justify-between items-center pt-2">
                <span id="quiz-progress-text" class="font-mono font-bold text-slate-400 text-xs">
                  Q_{(currentQuestionIndex + 1).toString().padStart(2, "0")} / {quizQuestions.length.toString().padStart(2, "0")}
                </span>
                <span class="px-2 py-0.5 rounded bg-sky-50 text-sky-600 font-mono text-[9px] uppercase font-semibold border border-sky-100">
                  Nhiệm vụ
                </span>
              </div>

              <h2 id="quiz-question-title" class="font-headline text-lg md:text-xl font-bold text-slate-900 leading-snug">
                {quizQuestions[currentQuestionIndex].text}
              </h2>
              <p id="quiz-question-desc" class="text-xs text-slate-500 italic pl-4 border-l-2 border-slate-300">
                Gợi ý: {quizQuestions[currentQuestionIndex].desc}
              </p>

              {/* Options Grid */}
              <div id="quiz-options-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(quizQuestions[currentQuestionIndex].options).map(key => {
                  const optText = quizQuestions[currentQuestionIndex].options[key];
                  const currentAnswer = userAnswers[currentQuestionIndex];
                  const isCorrectOption = key === quizQuestions[currentQuestionIndex].correct;
                  const isSelectedOption = currentAnswer?.selectedOption === key;

                  let btnClass = "quiz-option-btn glass-panel p-5 rounded-xl flex items-start gap-4 text-left scanline transition-all duration-300 ";
                  let indicatorClass = "flex-shrink-0 w-10 h-10 rounded shadow-sm flex items-center justify-center border font-headline font-bold ";

                  if (!currentAnswer) {
                    btnClass += "hover:bg-sky-50 hover:border-sky-300 hover:shadow-md cursor-pointer";
                    indicatorClass += "bg-white/80 border-slate-200 text-slate-500";
                  } else {
                    btnClass += "pointer-events-none ";
                    if (isCorrectOption) {
                      btnClass += "bg-emerald-500/10 border-emerald-500 shadow-sm text-emerald-950";
                      indicatorClass += "bg-emerald-500 border-emerald-600 text-white";
                    } else if (isSelectedOption) {
                      btnClass += "bg-rose-500/10 border-rose-500 shadow-sm text-rose-950";
                      indicatorClass += "bg-rose-500 border-rose-600 text-white";
                    } else {
                      btnClass += "opacity-50 border-slate-200/50 bg-white/20";
                      indicatorClass += "bg-white/50 border-slate-200/30 text-slate-400";
                    }
                  }

                  return (
                    <button 
                      key={key}
                      onClick={() => handleSelectOption(key)}
                      class={btnClass}
                    >
                      <div class={indicatorClass}>
                        {currentAnswer && isCorrectOption ? (
                          <span class="material-symbols-outlined text-sm">check</span>
                        ) : currentAnswer && isSelectedOption ? (
                          <span class="material-symbols-outlined text-sm">close</span>
                        ) : (
                          key
                        )}
                      </div>
                      <div>
                        <h4 class="font-headline text-slate-800 font-semibold mb-0.5 text-xs">
                          {key === "A" ? "Phương án A" : key === "B" ? "Phương án B" : key === "C" ? "Phương án C" : "Phương án D"}
                        </h4>
                        <p class="text-[11px] text-slate-600 leading-relaxed">{optText}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Immediate Feedback & Explanation Card */}
              {userAnswers[currentQuestionIndex] && (
                <div class={`p-5 rounded-xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${
                  userAnswers[currentQuestionIndex].isCorrect 
                    ? "bg-emerald-500/5 border-emerald-300/60 text-emerald-900" 
                    : "bg-rose-500/5 border-rose-300/60 text-rose-900"
                }`}>
                  <span class="material-symbols-outlined mt-0.5 flex-shrink-0 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {userAnswers[currentQuestionIndex].isCorrect ? "verified" : "warning"}
                  </span>
                  <div class="space-y-1.5 flex-grow">
                    <h5 class="font-headline font-bold text-xs tracking-wide uppercase">
                      {userAnswers[currentQuestionIndex].isCorrect 
                        ? "PHÂN TÍCH CHÍNH XÁC!" 
                        : `SAI LẦM! PHƯƠNG ÁN ĐÚNG LÀ ${quizQuestions[currentQuestionIndex].correct}`}
                    </h5>
                    <p class="text-[11px] leading-relaxed text-slate-700">
                      <strong>Giải thích nghiệp vụ:</strong> {quizQuestions[currentQuestionIndex].desc || "Chưa ghi nhận dữ liệu giải thích."}
                    </p>
                  </div>
                </div>
              )}

              {/* Action */}
              <div class="flex justify-end pt-2">
                <button 
                  onClick={handleNextQuizQuestion}
                  disabled={!userAnswers[currentQuestionIndex]}
                  id="btn-quiz-next" 
                  class="btn-gold px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-bold flex items-center gap-1.5"
                >
                  {currentQuestionIndex === quizQuestions.length - 1 ? "Hoàn thành giải mã" : "Câu tiếp theo"}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* View: Quiz Result Screen */}
        {currentView === "quiz-result" && (
          <section id="quiz-finished" class="max-w-md mx-auto text-center space-y-6 py-6">
            <div class="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-md text-emerald-600">
              <span class="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            </div>

            <div class="space-y-2">
              <h2 class="font-headline text-3xl font-black text-slate-900 tracking-tight uppercase">ĐÃ ĐỒNG BỘ KẾT QUẢ</h2>
              <p class="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Chỉ số nghiệp vụ của bạn đã đồng bộ vào Bảng xếp hạng Thám tử Thành Phố. Hãy theo dõi vị trí thứ hạng của mình tại chuyên mục xếp hạng.
              </p>
            </div>

            {/* Results HUD */}
            <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div class="glass-panel p-6 rounded-xl text-center space-y-1 shadow-sm">
                <span class="text-[9px] text-slate-400 font-mono block">ĐỘ CHÍNH XÁC</span>
                <span id="result-accuracy" class="font-mono text-2xl font-black text-emerald-650">
                  {userAnswers.filter(ans => ans && ans.isCorrect).length * 10}%
                </span>
              </div>
              <div class="glass-panel p-6 rounded-xl text-center space-y-1 shadow-sm">
                <span class="text-[9px] text-slate-400 font-mono block">THỜI GIAN PHÁ ÁN</span>
                <span id="result-time" class="font-mono text-lg font-black text-slate-700 leading-[32px]">
                  {formatTime(quizTimeElapsed)}
                </span>
              </div>
            </div>

            <div class="flex gap-3 justify-center">
              <button onClick={() => showView("leaderboard")} id="btn-quiz-view-rankings" class="btn-gold px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-bold">
                XEM BẢNG XẾP HẠNG
              </button>
              <button onClick={() => showView("home")} class="btn-glass px-6 py-3 rounded-lg text-xs uppercase tracking-wider font-semibold text-slate-700">
                VỀ TRANG CHỦ
              </button>
            </div>
          </section>
        )}

      </main>

      {/* Footer copyright */}
      <footer class="mt-auto py-6 text-center border-t border-slate-200/50 bg-white/20 backdrop-blur-md text-slate-500 font-mono text-[10px] tracking-wider relative z-10">
        <div class="max-w-[1400px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            &copy; 2026. Sản phẩm của P.A.S.T - CLB Tình nguyện Vì Bình Yên Thành Phố
          </div>
          <div class="flex items-center gap-4">
            <span class="w-2 h-2 rounded-full bg-emerald-500 led-glowing"></span> PHÒNG CHỐNG MA TÚY HỌC ĐƯỜNG
          </div>
        </div>
      </footer>

      {/* Global Toast component */}
      {toast.show && (
        <div class="toast-notification show">
          <span class="material-symbols-outlined text-sky-600">{toast.icon}</span>
          <div class="text-xs font-headline font-bold text-slate-800">{toast.message}</div>
        </div>
      )}

    </div>
  );
}
