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
import { uploadMultipleImagesToFirebase } from './firebaseStorage';

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
    
    // Fotoğrafları Firebase Storage'a yükle ve URL'leri al
    let photoUrl = '';
    
    if (issueData.photos.length > 0) {
      try {
        console.log('Fotoğraflar Firebase Storage\'a yükleniyor...');
        // Tüm fotoğrafları yükle (şu an için sadece ilkini kullanacağız)
        const imageUrls = await uploadMultipleImagesToFirebase(issueData.photos);
        photoUrl = imageUrls[0]; // İlk fotoğrafın URL'ini kullan
        console.log('Firebase Storage fotoğraf URL\'i alındı:', photoUrl);
      } catch (e) {
        console.error('Firebase Storage fotoğraf yükleme hatası:', e);
      }
    }
    
    const requestData = {
      title: issueData.title,
      description: issueData.description,
      departmentId: departmentIdForBackend, // Eğer department seçilmediyse 0 gönder
      PhotoUrl: photoUrl, // Backend PhotoUrl alanını bekliyor - artık Base64 yerine URL gönderiyoruz
      userId: userId, // Backend'in beklediği UserId alanı
      latitude: issueData.latitude || 0,
      longitude: issueData.longitude || 0,
      category: 'General' // Varsayılan kategori
    };
    
    console.log('Gönderilecek veri:', JSON.stringify({
      ...requestData,
      PhotoUrl: photoUrl ? `${photoUrl.substring(0, 30)}...` : 'boş' // URL'in tamamını loglamak yerine bir kısmını göster
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
    
    // Doğru URL formatıyla oluştur: http://localhost:3000/issue/issues/user/{userId}
    const url = `${API_BASE_URL}/issue/issues/user/${userId}`;
    console.log('API URL for user issues:', url);
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
    console.log('-------- API: getNotifications çağrıldı --------');
    
    // Extract userId from token (JWT parsing)
    let userId = '';
    if (token && token.split('.').length === 3) {
      try {
        // Decode JWT token payload
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        console.log('Token payload for getNotifications:', JSON.stringify(payload));
        
        // Get userId from token claims
        userId = payload.uid || payload.sub || payload.user_id || '';
        console.log('Extracted userId from token:', userId);
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }

    if (!userId) {
      console.error('No userId found in token, cannot fetch notifications');
      return [];
    }
    
    // Gateway üzerinden yönlendirme için URL: http://gateway-url/notification/notifications/{userId}
    const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.LIST}/${userId}`;
    console.log('API URL for notifications:', url);
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
      let errorMessage = 'Bildirimler alınamadı';
      
      if (data && data.message) {
        errorMessage = data.message;
      } else if (data && data.detail && data.detail.message) {
        errorMessage = data.detail.message;
      }
      
      console.error('Hata detayları:', data);
      // Hata oluşsa bile boş array dön ki UI crash olmasın
      return [];
    }
    
    // If the response is not an array, wrap it in an array
    if (data && !Array.isArray(data)) {
      console.log('API yanıtı array değil, array içine alınıyor');
      data = [data];
    }
    
    console.log('API çağrısı başarılı, veri dönülüyor. Eleman sayısı:', Array.isArray(data) ? data.length : 'N/A');
    return data || [];
    
  } catch (error) {
    console.error('Notifications fetch error:', error);
    // Hata oluşsa bile boş array dön ki UI crash olmasın
    return [];
  }
};

// Bildirimi okundu olarak işaretleme
export const markNotificationAsRead = async (token: string, userId: string, notificationId: string) => {
  try {
    console.log('-------- API: markNotificationAsRead çağrıldı --------');
    
    // Extract userId from token (JWT parsing) instead of using the provided userId
    let extractedUserId = '';
    if (token && token.split('.').length === 3) {
      try {
        // Decode JWT token payload
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        
        // Get userId from token claims
        extractedUserId = payload.uid || payload.sub || payload.user_id || '';
        console.log('Extracted userId from token for marking read:', extractedUserId);
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }
    
    // Use extracted userId instead of the passed userId parameter
    const effectiveUserId = extractedUserId || userId;
    console.log(`UserId from param: ${userId}, Using userId: ${effectiveUserId}, NotificationId: ${notificationId}`);
    
    // Gateway üzerinden yönlendirme için URL
    const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId, effectiveUserId)}`;
    console.log('API URL for marking notification as read:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      // Not: Notification servisinin beklediği şekilde boş body gönder
      body: JSON.stringify({})
    });
    
    console.log('API yanıtı alındı');
    console.log('Status kodu:', response.status);
    
    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (e) {
      console.error('JSON parse hatası:', e);
      return false;
    }
    
    if (!response.ok) {
      console.error('Bildirim okundu işaretlenemedi:', data);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return false;
  }
};

// İstatistikleri getirme (yeni, aktif, tamamlanmış sorun sayıları)
export const getStats = async (token: string) => {
  try {
    console.log('-------- API: getStats çağrıldı --------');
    
    // Use the endpoint from the config
    const url = `${API_BASE_URL}${API_ENDPOINTS.ISSUES.STATISTICS}`;
    
    console.log('Stats API URL:', url);
    console.log('Token:', token ? `${token.substring(0, 15)}...` : 'Token yok');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    console.log('Stats API yanıtı alındı');
    console.log('Status kodu:', response.status);
    
    if (response.status === 404) {
      console.log('Statistics endpoint not found (404), API may not support this feature');
      // Return default values
      return { new: 0, active: 0, completed: 0 };
    }
    
    const responseText = await response.text();
    console.log('Yanıt metni:', responseText);
    
    let data;
    try {
      // Parse JSON response
      data = responseText ? JSON.parse(responseText) : {};
      console.log('Stats data parsed successfully');
    } catch (e) {
      console.error('JSON parse hatası:', e);
      throw new Error('Invalid statistics data format');
    }
    
    if (!response.ok) {
      console.error('Stats API call failed:', data);
      throw new Error(data.message || data.error || 'Failed to get statistics');
    }
    
    // Map backend response to our expected format
    // The backend might return data in different formats, so we check for common patterns
    const statsResult = {
      new: 0,
      active: 0, 
      completed: 0
    };
    
    // Try to extract stats from various possible formats
    if (data.new !== undefined) statsResult.new = data.new;
    else if (data.pending !== undefined) statsResult.new = data.pending;
    else if (data.received !== undefined) statsResult.new = data.received;
    else if (data.status0 !== undefined) statsResult.new = data.status0;
    
    if (data.active !== undefined) statsResult.active = data.active;
    else if (data.inProgress !== undefined) statsResult.active = data.inProgress;
    else if (data.processing !== undefined) statsResult.active = data.processing;
    else if (data.status1 !== undefined) statsResult.active = data.status1;
    
    if (data.completed !== undefined) statsResult.completed = data.completed;
    else if (data.done !== undefined) statsResult.completed = data.done;
    else if (data.resolved !== undefined) statsResult.completed = data.resolved;
    else if (data.status2 !== undefined) statsResult.completed = data.status2;
    
    console.log('Mapped stats result:', statsResult);
    return statsResult;
  } catch (error) {
    console.error('Stats fetch error:', error);
    // Return default values if the API call fails
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
    
    console.log('Issue hexId:', issueId);
    
    // Extract userId from token (JWT parsing) for potential debugging or user-check
    let userId = '';
    if (token && token.split('.').length === 3) {
      try {
        // Decode JWT token payload
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        userId = payload.uid || payload.sub || payload.user_id || '';
        console.log('User ID for getIssueDetails:', userId);
      } catch (e) {
        console.error('Token parsing error in getIssueDetails:', e);
      }
    }
    
    // Use API_ENDPOINTS and hexId for the API call
    const url = `${API_BASE_URL}${API_ENDPOINTS.ISSUES.DETAIL(issueId)}`;
    console.log('API URL for issue details:', url);
    console.log('Token length:', token ? token.length : 0);
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    console.log('Status code:', response.status);
    console.log('Status text:', response.statusText);
    
    // For 404 Not Found, return proper null value to show the error UI
    if (response.status === 404) {
      console.log('Issue not found (404)');
      return null;
    }
    
    const responseText = await response.text();
    // Log a limited portion of the response for debugging
    console.log('Response text (preview):', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
    
    let data;
    
    try {
      // Only try to parse if there's actual content
      data = responseText && responseText.trim() ? JSON.parse(responseText) : null;
      console.log('Response parsed successfully as JSON');
      
      // Log the structure of the issue to help debugging
      if (data) {
        console.log('Issue data received:', 
          data.id ? 'ID: ' + data.id : 'No ID',
          data.title ? 'Title: ' + data.title : 'No title', 
          data.status ? 'Status: ' + data.status : 'No status'
        );
      } else {
        console.log('No issue data in response (null or empty)');
      }
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Invalid response text:', responseText.substring(0, 100) + '...');
      return null;
    }
    
    if (!response.ok) {
      console.log('Request failed (HTTP ' + response.status + ')');
      return null;
    }
    
    // If we get an empty response or invalid issue data, return null
    if (!data || !data.id) {
      console.log('API returned invalid issue data');
      return null;
    }
    
    console.log('API call successful, returning issue data');
    return data;
    
  } catch (error) {
    console.error('Issue details fetch error:', error instanceof Error ? error.message : String(error));
    return null; // Return null instead of throwing to show error UI
  }
};

// Bildirimi silme
export const deleteNotification = async (token: string, userId: string, notificationId: string) => {
  try {
    console.log('-------- API: deleteNotification çağrıldı --------');
    
    // Extract userId from token (JWT parsing) instead of using the provided userId
    let extractedUserId = '';
    if (token && token.split('.').length === 3) {
      try {
        // Decode JWT token payload
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        
        // Get userId from token claims
        extractedUserId = payload.uid || payload.sub || payload.user_id || '';
        console.log('Extracted userId from token for deletion:', extractedUserId);
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }
    
    // Use extracted userId instead of the passed userId parameter
    const effectiveUserId = extractedUserId || userId;
    console.log(`UserId from param: ${userId}, Using userId: ${effectiveUserId}, NotificationId: ${notificationId}`);
    
    // Gateway üzerinden yönlendirme için URL
    const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.DELETE(notificationId, effectiveUserId)}`;
    console.log('API URL for deleting notification:', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    
    console.log('API yanıtı alındı');
    console.log('Status kodu:', response.status);
    
    if (!response.ok) {
      console.error('Bildirim silinemedi. Durum kodu:', response.status);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete notification error:', error);
    return false;
  }
}; 