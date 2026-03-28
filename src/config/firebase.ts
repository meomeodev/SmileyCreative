import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Cấu hình Firebase mà bạn đã cung cấp
const firebaseConfig = {
  apiKey: "AIzaSyC1LmAiU-C8kPdKqa2lJuft6GdmA4zh_SE",
  authDomain: "smiley-creative.firebaseapp.com",
  projectId: "smiley-creative",
  storageBucket: "smiley-creative.firebasestorage.app",
  messagingSenderId: "369291713532",
  appId: "1:369291713532:web:396e611b3892c0d83e7079",
  measurementId: "G-QX3H9ZC407"
};

// Khởi tạo các Gateway kết nối chính của Firebase (App Lõi)
const app = initializeApp(firebaseConfig);

// Phân luồng các dịch vụ cần thiết để UI/Trang chức năng sử dụng
// 1. Quản lý Đăng nhập - Tạo tài khoản
const auth = getAuth(app);

// 2. Cơ sở dữ liệu theo thời gian thực (Lưu Chấm công, Hồ sơ, ERP)
const db = getFirestore(app);

// 3. Kho lưu trữ tệp (Dùng cho Avatar, Tệp đính kèm)
const storage = getStorage(app);

// Phân tích người dùng hành vi (Phần này để Analytics hoạt động ngầm)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Xuất các cổng kết nối này ra bên ngoài dự án để tái sử dụng
export { app, auth, db, storage, analytics };
