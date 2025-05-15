import storage from '@react-native-firebase/storage';
import * as FileSystem from 'expo-file-system';

/**
 * Bir resmi Firebase Storage'a yükler
 * @param uri Resmin URI'si
 * @param path Storage'da kaydedilecek yol (opsiyonel, belirtilmezse rastgele bir isim oluşturulur)
 * @returns Upload işlemi tamamlandığında resmin URL'i
 */
export const uploadImageToFirebase = async (uri: string, path?: string): Promise<string> => {
  try {
    // Resim için benzersiz bir isim oluştur (eğer path belirtilmemişse)
    const storagePath = path || `images/${Date.now()}.jpg`;
    
    // Firebase Storage referansı oluştur
    const reference = storage().ref(storagePath);
    
    // Resmi yükle
    await reference.putFile(uri);
    
    // Yüklenen resmin URL'ini al
    const downloadURL = await reference.getDownloadURL();
    
    console.log('Firebase Storage\'a resim yüklendi, URL:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Firebase Storage resim yükleme hatası:', error);
    throw error;
  }
};

/**
 * Birden fazla resmi Firebase Storage'a yükler
 * @param uris Resim URI'lerinin listesi
 * @returns Yüklenen resimlerin URL'lerinin listesi
 */
export const uploadMultipleImagesToFirebase = async (uris: string[]): Promise<string[]> => {
  try {
    const uploadPromises = uris.map((uri, index) => 
      uploadImageToFirebase(uri, `images/${Date.now()}_${index}.jpg`)
    );
    
    // Tüm yükleme işlemlerinin tamamlanmasını bekle
    const downloadURLs = await Promise.all(uploadPromises);
    
    console.log(`${downloadURLs.length} resim Firebase Storage'a yüklendi`);
    
    return downloadURLs;
  } catch (error) {
    console.error('Çoklu resim yükleme hatası:', error);
    throw error;
  }
}; 