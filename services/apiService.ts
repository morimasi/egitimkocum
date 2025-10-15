import axios from 'axios';
import { ToastType } from '../types';

// Bu, React context'inden gelen toast fonksiyonunu modül içinde kullanılabilir hale getirmek için bir değişkendir.
let toastHandler: ((message: string, type: ToastType) => void) | null = null;

export const setToastHandler = (handler: (message: string, type: ToastType) => void) => {
  toastHandler = handler;
};


const apiService = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Her istek gönderilmeden önce araya girerek yetkilendirme başlığını ekler.
apiService.interceptors.request.use(
  (config) => {
    // Gerçek bir uygulamada bu bir JWT token olurdu. Bu demo için kullanıcının ID'sini kullanıyoruz.
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user && user.id) {
        config.headers.Authorization = `Bearer ${user.id}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// API yanıtlarında oluşan hataları global olarak yakalar.
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sunucudan gelen hata mesajını veya genel bir hata mesajını ayıklar.
    const message = error.response?.data?.error || error.message || 'Bilinmeyen bir ağ hatası oluştu.';
    
    // Hata mesajını kullanıcıya bir bildirim olarak gösterir.
    if (toastHandler) {
      toastHandler(message, 'error');
    }

    // Promise'i standart bir Error nesnesi ile reddeder.
    return Promise.reject(new Error(message));
  }
);

export default apiService;