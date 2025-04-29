# Campus Caution - Mobile Frontend

This is the Expo mobile application for the Campus Issue Management System (Campus Caution) for Akdeniz University.

## Overview

The purpose of this application is to allow users (likely students and staff) to:

*   Authenticate using either their Akdeniz University Microsoft account (Entra ID) or via email/password registration/login.
*   View campus announcements.
*   Report issues encountered on campus (feature likely initiated by the "Inform Us" button on the home screen).
*   View their user profile and log out.
*   (Future features may include tracking reported issues and viewing notifications).

The application connects to the backend `user-service` for authentication and user data, and likely other backend services for issue reporting and announcements.

---

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Auth0 Entegrasyonu

Bu uygulama, kullanıcı kimlik doğrulaması için Auth0'u kullanır. Eksiksiz bir entegrasyon için lütfen aşağıdaki adımları izleyin:

### 1. Auth0 Uygulama Yapılandırması

1. [Auth0 Dashboard](https://manage.auth0.com)'a giriş yapın
2. **Applications > Applications** bölümüne gidin
3. Uygulamanız için oluşturulan **lTvrmyoiU2wz2TQGaGUuAL4dBYZOAQAX** client ID'li uygulamayı seçin
4. **Settings** sekmesinde:
   - **Allowed Callback URLs**: `exp://192.168.1.X:8081/--/expo-auth-session` olarak ayarlayın (kendi IP adresinizi kullanın)
   - **Allowed Logout URLs**: `exp://192.168.1.X:8081/--/expo-auth-session` olarak ayarlayın
   - **Allowed Web Origins**: `exp://192.168.1.X:8081` olarak ayarlayın
   - **Save Changes** düğmesine tıklayın

### 2. Custom Email İçin Auth0 Rules Eklemek (isteğe bağlı)

Access token içerisinde e-posta alanınızı görmek istiyorsanız (normalde ID token içerisinde bulunur):

1. [Auth0 Dashboard](https://manage.auth0.com)'da **Auth Pipeline > Rules** bölümüne gidin
2. **Create Rule** düğmesine tıklayın
3. "Empty Rule" şablonunu seçin
4. Kural için bir isim verin (örneğin "Add email to Access Token")
5. Aşağıdaki kodu ekleyin:

```javascript
function (user, context, callback) {
  // Add Email claim to the access_token
  context.accessToken['https://campuscaution.app/email'] = user.email;
  
  // Ek olarak e-postanın doğrulanmış olup olmadığı bilgisini de ekleyebilirsiniz
  context.accessToken['https://campuscaution.app/email_verified'] = user.email_verified;
  
  return callback(null, user, context);
}
```

6. **Save Changes** düğmesine tıklayın

Bu kural, uygulamanızın access token içerisinde de kullanıcı e-posta bilgisine erişmesini sağlar.

### 3. Uygulama Yapılandırmasını Güncelleme

`app.json` dosyasındaki Auth0 domain bilgisi doğru olmalıdır:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-auth0",
        {
          "domain": "dev-7uv8h746tp02jius.eu.auth0.com"
        }
      ]
    ]
  }
}
```

Ayrıca `context/AuthContext.tsx` dosyasında doğru domain ve clientId bilgilerinin olduğunu doğrulayın:

```tsx
<Auth0Provider 
  domain="dev-7uv8h746tp02jius.eu.auth0.com"
  clientId="lTvrmyoiU2wz2TQGaGUuAL4dBYZOAQAX"
>
```

Auth0 entegrasyonu tamamlandı! Şimdi uygulamanız Auth0 kimlik doğrulama sistemiyle çalışabilir.
