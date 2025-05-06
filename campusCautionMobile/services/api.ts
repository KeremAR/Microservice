import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, getHeaders } from '../constants/config';

// Kullanıcı profil bilgisini getirme
export const getUserProfile = async (token: string) => {
  try {
    console.log('Profil bilgileri isteniyor:', `${API_BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`);
    console.log('Token:', token.substring(0, 15) + '...');
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    console.log('Profil yanıt durum kodu:', response.status);
    
    const responseText = await response.text();
    console.log('Profil yanıt metni:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON parse hatası:', e);
      throw new Error('Sunucu yanıtı geçersiz format');
    }
    
    if (!response.ok) {
      throw new Error(data.message || data.detail?.message || 'Profil bilgileri alınamadı');
    }

    return data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    // Hata olsa bile boş bir profil nesnesi döndür, UI'da kontrol edilecek
    return {
      name: null,
      email: null,
      department_id: null,
      role: null
    };
  }
};

// Sorunları (issues) getirme
export const getIssues = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ISSUES?.LIST || '/issues'}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Sorunlar alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Issues fetch error:', error);
    throw error;
  }
};

// Kullanıcının kendi sorunlarını getirme
export const getUserIssues = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ISSUES?.USER_ISSUES || '/issues/user'}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Kullanıcı sorunları alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('User issues fetch error:', error);
    throw error;
  }
};

// Bildirimleri getirme
export const getNotifications = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS?.LIST || '/notifications'}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Bildirimler alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Notifications fetch error:', error);
    throw error;
  }
};

// İstatistikleri getirme (yeni, aktif, tamamlanmış sorun sayıları)
export const getStats = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'İstatistikler alınamadı');
    }

    return await response.json();
  } catch (error) {
    console.error('Stats fetch error:', error);
    // Eğer istatistik API'si henüz mevcut değilse varsayılan değer döndür
    return { new: 0, active: 0, completed: 0 };
  }
}; 