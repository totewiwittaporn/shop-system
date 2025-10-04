// src/lib/axios.ts
import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // backend URL
});

// ใส่ JWT token อัตโนมัติจาก localStorage ก่อน request ทุกครั้ง
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // หรือ sessionStorage
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
