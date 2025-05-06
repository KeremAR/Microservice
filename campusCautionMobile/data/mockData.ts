// Define interfaces for data models
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'received' | 'in_progress' | 'completed' | 'rejected';
  department: string;
  location: string;
  date: string;
  coordinates: Coordinates;
  isUserIssue?: boolean; // To determine if this is the current user's issue
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // URL to avatar image
  department_id?: number; // department yerine department_id
  role: 'student' | 'staff' | 'admin';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  relatedIssueId?: string; // If the notification is related to an issue
}

export interface Department {
  id: string;
  name: string;
  description: string;
}

// Mock data for issues
export const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'Bozuk Projektör',
    description: 'Mühendislik Fakültesi 204 nolu derslikte projektör çalışmıyor ve derslerde sunum yapamıyoruz.',
    status: 'completed', 
    department: 'Bilgi İşlem Daire Başkanlığı',
    location: 'Mühendislik Fakültesi, Kat 2, Derslik 204',
    date: '2023-08-10',
    coordinates: {
      latitude: 36.896674,
      longitude: 30.649953
    },
    isUserIssue: true
  },
  
  {
    id: '2',
    title: 'Kütüphane Sıcaklık Sorunu',
    description: 'Merkez Kütüphane çalışma alanında klima çalışmıyor ve ortam çok sıcak, verimli çalışamıyoruz.',
    status: 'in_progress', 
    department: 'Kütüphane ve Dokümantasyon Daire Başkanlığı',
    location: 'Merkez Kütüphane, 2. Kat Çalışma Salonu',
    date: '2023-08-15',
    coordinates: {
      latitude: 36.896231,
      longitude: 30.658756
    },
    isUserIssue: true
  },


  {
    id: '3',
    title: 'Eduroam Bağlantı Sorunu',
    description: 'Edebiyat Fakültesi binasında eduroam wifi sinyali çok zayıf ve sürekli bağlantı kopuyor.',
    status: 'received', 
    department: 'Bilgi İşlem Daire Başkanlığı',
    location: 'Edebiyat Fakültesi, Zemin Kat',
    date: '2023-08-18',
    coordinates: {
      latitude: 36.897952,
      longitude: 30.656007
    },
    isUserIssue: false
  },
  {
    id: '4',
    title: 'Kantin Hijyen Sorunu',
    description: 'İktisadi ve İdari Bilimler Fakültesi kantininde hijyen standartlarına uyulmuyor, masalar kirli bırakılıyor.',
    status: 'rejected', 
    department: 'Sağlık, Kültür ve Spor Dairesi Başkanlığı',
    location: 'İktisadi ve İdari Bilimler Fakültesi, Kantin',
    date: '2023-08-20',
    coordinates: {
      latitude: 36.892642,
      longitude: 30.645452
    },
    isUserIssue: false
  },
  {
    id: '5',
    title: 'Kampüs Yolunda Çukur',
    description: 'Eğitim Fakültesi önündeki yolda büyük bir çukur var, özellikle yağmurlu havalarda su birikiyor.',
    status: 'in_progress',
    department: 'Yapı İşleri ve Teknik Daire Başkanlığı',
    location: 'Eğitim Fakültesi Önü, Ana Yol',
    date: '2023-08-25',
    coordinates: {
      latitude: 36.897952,
      longitude: 30.656007
    },
    isUserIssue: false
  },
  {
    id: '6',
    title: 'Hasarlı Kütüphane Sandalyesi',
    description: 'Merkez Kütüphane 3. kat çalışma alanında 12 numaralı masa sandalyesinde kırık var, düşme tehlikesi oluşturuyor.',
    status: 'received',
    department: 'Kütüphane ve Dokümantasyon Daire Başkanlığı',
    location: 'Merkez Kütüphane, 3. Kat',
    date: '2023-08-22',
    coordinates: {
      latitude: 36.898125,
      longitude: 30.660879
    },
    isUserIssue: false
  },
  {
    id: '7',
    title: 'Yemekhane Kart Yükleme Sorunu',
    description: 'Öğrenci yemekhanesi girişindeki kart yükleme cihazı para alıyor fakat bakiye yüklemiyor.',
    status: 'in_progress',
    department: 'Bilgi İşlem Daire Başkanlığı',
    location: 'Merkezi Yemekhane, Giriş Katı',
    date: '2023-08-17',
    coordinates: {
      latitude: 36.899222,
      longitude: 30.651586
    },
    isUserIssue: false
  }
];

// Mock user data
export const currentUser: User = {
  id: '1',
  name: 'Kerem AR',
  email: 'test@test.com',
  role: 'student',
  department_id: 1 // Mühendislik Fakültesi yerine numeric ID
};

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Sorun Durumu Güncellendi',
    message: '"Bozuk Projektör" bildiriminiz tamamlandı.',
    date: '2023-08-15',
    read: false,
    relatedIssueId: '1'
  },
  {
    id: '2',
    title: 'Sorun Durumu Güncellendi',
    message: '"Kütüphane Sıcaklık Sorunu" bildiriminiz işleme alındı.',
    date: '2023-08-16',
    read: false,
    relatedIssueId: '2'
  },
  {
    id: '3',
    title: 'Yeni Duyuru',
    message: 'OBS sisteminde bu hafta sonu bakım çalışması yapılacaktır.',
    date: '2023-08-14',
    read: true
  }
];

// Mock departments
export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Öğrenci İşleri Daire Başkanlığı',
    description: 'Öğrenim ücretleri, mezuniyet, diploma, kayıt işlemleri ve öğrenci belgeleri'
  },
  {
    id: '2',
    name: 'Bilgi İşlem Daire Başkanlığı',
    description: 'Kampüs teknoloji altyapısı, internet erişimi ve bilgisayar sistemleri'
  },
  {
    id: '3',
    name: 'Sağlık, Kültür ve Spor Dairesi Başkanlığı',
    description: 'Kantin, yemekhane, spor tesisleri ve kültürel etkinlikler'
  },
  {
    id: '4',
    name: 'Yapı İşleri ve Teknik Daire Başkanlığı',
    description: 'Kampüs altyapısı, bina bakımı ve teknik sorunların çözümü'
  },
  {
    id: '5',
    name: 'Kütüphane ve Dokümantasyon Daire Başkanlığı',
    description: 'Kütüphane kaynakları, çalışma alanları ve araştırma desteği'
  },
  {
    id: '6',
    name: 'Koruma ve Güvenlik Şube Müdürlüğü',
    description: 'Kampüs güvenliği, şüpheli durumlar ve kayıp eşyalar'
  },
  {
    id: '7',
    name: 'İş Sağlığı ve Güvenliği Koordinatörlüğü',
    description: 'Güvenlik riski taşıyan durumlar, acil çıkışlar ve güvenlik ekipmanları'
  }
];

// Statistics for dashboard
export const mockStats = {
  myIssues: 2,
  pendingIssues: 5,
  resolvedIssues: 8
};

// Campus map region
export const campusMapRegion = {
  latitude: 36.896000,
  longitude: 30.652000,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
}; 