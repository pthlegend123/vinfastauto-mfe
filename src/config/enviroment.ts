interface Enviroment {
  production: boolean;
  apiDomain: string;
  enableDebug: boolean;
}

export const enviroment: Enviroment = {
  // Biến này Vite mặc định có để biết đang ở chế độ nào
  production: import.meta.env.MODE === 'production', 
  
  // Lấy domain từ .env, có fallback về localhost đề phòng quên set biến
  apiDomain: import.meta.env.VITE_API_DOMAIN,
  
  // Chuyển string từ .env sang boolean
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true', 
};