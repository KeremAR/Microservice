import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders, getHeaders } from '../constants/config';
import * as FileSystem from 'expo-file-system';

// Helper function to convert image URI to base64
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

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

// Yeni sorun/rapor oluşturma
export const createIssue = async (token: string, issueData: {
  title: string;
  description: string;
  departmentId: number | null;
  photos: string[];
  latitude?: number;
  longitude?: number;
  userId?: string; // Kullanıcı ID'si için yeni alan
}) => {
  try {
    console.log('-------- API: createIssue çağrıldı --------');
    console.log('API URL:', `${API_BASE_URL}${API_ENDPOINTS.ISSUES.CREATE}`);
    console.log('Token:', token ? `${token.substring(0, 15)}...` : 'Token yok');
    
    // IssueService beklediği formata dönüştür
    // Array index 0'dan başladığı için +1 ekleyerek departman ID'sini oluştur
    const departmentIdForBackend = issueData.departmentId !== null ? issueData.departmentId + 1 : 0;
    console.log('Backend için departmentId:', departmentIdForBackend);
    
    // Token'dan userId çıkartma girişimi (JWT token ise)
    let userId = issueData.userId || '';
    
    // Eğer userId verilmemişse ve token JWT formatındaysa, token'dan çıkarmaya çalış
    if (!userId && token && token.split('.').length === 3) {
      try {
        // JWT'nin payload kısmını decode et
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        console.log('Token payload:', JSON.stringify(payload));
        
        // uid, sub veya user_id alanlarını kontrol et
        userId = payload.uid || payload.sub || payload.user_id || '';
        console.log('Token\'dan çıkarılan userId:', userId);
      } catch (e) {
        console.error('Token parse hatası:', e);
      }
    }
    
    // UserId yoksa geçici bir ID kullan
    if (!userId) {
      userId = 'temp-user-id'; // Geçici test ID
      console.log('Geçici test userId kullanılıyor:', userId);
    }
    
    // Fotoğrafları base64'e dönüştür
    let photoBase64 = '';
    
    if (issueData.photos.length > 0) {
      try {
        // İlk fotoğrafı base64'e dönüştür
        photoBase64 = await imageToBase64(issueData.photos[0]);
        console.log('Fotoğraf base64\'e dönüştürüldü, uzunluk:', photoBase64.length);
      } catch (e) {
        console.error('Fotoğraf base64 dönüştürme hatası:', e);
      }
    }
    
    const requestData = {
      title: issueData.title,
      description: issueData.description,
      departmentId: departmentIdForBackend, // Eğer department seçilmediyse 0 gönder
      PhotoUrl: photoBase64, // Backend PhotoUrl alanını bekliyor
      userId: userId, // Backend'in beklediği UserId alanı
      latitude: issueData.latitude || 0,
      longitude: issueData.longitude || 0,
      category: 'General' // Varsayılan kategori
    };
    
    console.log('Gönderilecek veri:', JSON.stringify({
      ...requestData,
      PhotoUrl: photoBase64 ? `${photoBase64.substring(0, 20)}...` : 'boş' // Base64'ün tamamını loglamak yerine bir kısmını göster
    }));
    console.log('Headers:', JSON.stringify(getAuthHeaders(token)));
    
    // Test için mock cevap oluşturalım
    const useMockResponse = false; // false yaparak gerçek API çağrısını kullan
    
    if (useMockResponse) {
      console.log('!!! API çağrısı simüle ediliyor, gerçek istek yapılmayacak !!!');
      
      // 2 saniye gecikmeyi simüle et
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Başarılı yanıt simülasyonu
      const mockResponse = {
        id: "issue_" + Math.floor(Math.random() * 1000000),
        title: requestData.title,
        description: requestData.description,
        departmentId: requestData.departmentId,
        status: "Pending",
        createdAt: new Date().toISOString()
      };
      
      console.log('API mock yanıtı:', mockResponse);
      return mockResponse;
    }
    
    // Gerçek API çağrısı (useMockResponse = false olduğunda çalışır)
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ISSUES.CREATE}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(requestData)
    });
    
    console.log('API yanıtı alındı');
    console.log('Status kodu:', response.status);
    console.log('Status metni:', response.statusText);
    
    const responseText = await response.text();
    console.log('Yanıt metni:', responseText);
    
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
      console.log('Yanıt JSON olarak başarıyla işlendi');
    } catch (e) {
      console.error('JSON parse hatası:', e);
      throw new Error('Sunucu yanıtı geçersiz format');
    }
    
    if (!response.ok) {
      console.log('İsteğin yanıtı başarısız (HTTP ' + response.status + ')');
      
      // Daha detaylı hata mesajı oluştur
      let errorMessage = 'Rapor oluşturulamadı';
      
      if (data.errors) {
        // Validation errors içinden detayları çıkart
        const errorDetails = Object.entries(data.errors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('; ');
        
        errorMessage = `Doğrulama hatası: ${errorDetails}`;
      } else if (data.title) {
        // Standard error format
        errorMessage = `${data.title}: ${data.detail || ''}`;
      } else if (data.message) {
        errorMessage = data.message;
      } else if (data.detail && data.detail.message) {
        errorMessage = data.detail.message;
      }
      
      console.error('Hata detayları:', data);
      throw new Error(errorMessage);
    }
    
    console.log('API çağrısı başarılı, veri dönülüyor');
    return data;
  } catch (error) {
    console.error('Create issue error:', error);
    console.log('Hata detayı:', error instanceof Error ? error.message : 'Bilinmeyen hata tipi');
    console.log('Hata stack:', error instanceof Error ? error.stack : 'Stack bilgisi yok');
    throw error;
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
    console.log('-------- API: getUserIssues çağrıldı --------');
    
    // Extract userId from token (JWT parsing)
    let userId = '';
    if (token && token.split('.').length === 3) {
      try {
        // Decode JWT token payload
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        console.log('Token payload for getUserIssues:', JSON.stringify(payload));
        
        // Get userId from token claims
        userId = payload.uid || payload.sub || payload.user_id || '';
        console.log('Extracted userId from token:', userId);
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }

    if (!userId) {
      console.error('No userId found in token, cannot fetch user issues');
      return [];
    }
    
    // Build URL with the userId parameter
    const url = `${API_BASE_URL}/issue/issues/user/${userId}`;
    console.log('API URL:', url);
    console.log('Token:', token ? `${token.substring(0, 15)}...` : 'Token yok');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    console.log('API yanıtı alındı');
    console.log('Status kodu:', response.status);
    console.log('Status metni:', response.statusText);
    
    const responseText = await response.text();
    console.log('Yanıt metni:', responseText);
    
    let data;
    
    try {
      // Only try to parse if there's actual content and it's not empty
      data = responseText ? JSON.parse(responseText) : [];
      console.log('Yanıt JSON olarak başarıyla işlendi');
    } catch (e) {
      console.error('JSON parse hatası:', e);
      console.error('Invalid response text:', responseText);
      // Return empty array instead of throwing
      return [];
    }
    
    if (!response.ok) {
      console.log('İsteğin yanıtı başarısız (HTTP ' + response.status + ')');
      
      // Daha detaylı hata mesajı oluştur
      let errorMessage = 'Kullanıcı sorunları alınamadı';
      
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.detail && data.detail.message) {
        errorMessage = data.detail.message;
      }
      
      console.error('Hata detayları:', data);
      throw new Error(errorMessage);
    }
    
    // If the response is not an array, wrap it in an array
    if (data && !Array.isArray(data)) {
      console.log('API yanıtı array değil, array içine alınıyor');
      data = [data];
    }
    
    console.log('API çağrısı başarılı, veri dönülüyor. Eleman sayısı:', Array.isArray(data) ? data.length : 'N/A');
    return data || [];
    
  } catch (error) {
    console.error('User issues fetch error:', error);
    // Hata oluşsa bile boş array dön ki UI crash olmasın
    return [];
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

// Belirli bir sorunun (issue) detaylarını getirme
export const getIssueDetails = async (token: string, issueId: string) => {
  try {
    console.log('-------- API: getIssueDetails çağrıldı --------');
    
    if (!issueId) {
      console.error('Issue ID is missing, cannot fetch issue details');
      return null;
    }
    
    // Build URL with the issue ID
    const url = `${API_BASE_URL}/issue/issues/${issueId}`;
    console.log('API URL:', url);
    console.log('Token:', token ? `${token.substring(0, 15)}...` : 'Token yok');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    console.log('API yanıtı alındı');
    console.log('Status kodu:', response.status);
    console.log('Status metni:', response.statusText);
    
    const responseText = await response.text();
    console.log('Yanıt metni:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
    
    let data;
    
    try {
      // Only try to parse if there's actual content and it's not empty
      data = responseText ? JSON.parse(responseText) : null;
      console.log('Yanıt JSON olarak başarıyla işlendi');
      
      // Log the structure of the issue to help debugging
      if (data) {
        console.log('Issue structure - keys:', Object.keys(data));
        console.log('Issue ID:', data.id);
        console.log('Issue title:', data.title);
        console.log('Issue status:', data.status);
        console.log('Issue location data:', 
          data.latitude !== undefined ? `latitude: ${data.latitude}` : 'latitude: undefined',
          data.longitude !== undefined ? `longitude: ${data.longitude}` : 'longitude: undefined'
        );
        // Check for coordinates in other formats
        if (data.coordinates) {
          console.log('Issue coordinates object:', data.coordinates);
        }
      }
    } catch (e) {
      console.error('JSON parse hatası:', e);
      console.error('Invalid response text:', responseText.substring(0, 200) + '...');
      return null;
    }
    
    if (!response.ok) {
      console.log('İsteğin yanıtı başarısız (HTTP ' + response.status + ')');
      
      // Daha detaylı hata mesajı oluştur
      let errorMessage = 'Sorun detayları alınamadı';
      
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.detail && data.detail.message) {
        errorMessage = data.detail.message;
      }
      
      console.error('Hata detayları:', data);
      throw new Error(errorMessage);
    }
    
    console.log('API çağrısı başarılı, veri dönülüyor');
    return data;
    
  } catch (error) {
    console.error('Issue details fetch error:', error);
    throw error;
  }
}; 