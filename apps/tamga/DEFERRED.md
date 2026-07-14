# Deferred Configuration Checklist

> Infrastructure and external service setup that must be completed before the app can fully function in production.

---

## 🔴 Critical (Required for Launch)

### Supabase Dashboard
- [ ] Set `FIREBASE_SERVICE_ACCOUNT` environment variable
  - Go to: Supabase Dashboard → Edge Functions → Environment Variables
  - Get from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
  - Paste the entire JSON content as the value

- [ ] Enable Phone Auth provider
  - Go to: Supabase Dashboard → Authentication → Providers → Phone
  - Toggle: Enable Phone provider
  - Configure Twilio or MessageBird for SMS delivery

### Firebase Console
- [ ] Create Firebase project (if not exists)
  - Go to: https://console.firebase.google.com
  - Create project with same name or link to existing Supabase project

- [ ] Enable Cloud Messaging
  - Go to: Firebase Console → Project Settings → Cloud Messaging
  - Ensure Firebase Cloud Messaging API is enabled

- [ ] Generate Service Account Key
  - Go to: Firebase Console → Project Settings → Service Accounts
  - Click "Generate new private key"
  - Save JSON file securely

- [ ] Upload iOS APNs Certificate (for iOS push notifications)
  - Go to: Firebase Console → Project Settings → Cloud Messaging
  - Upload APNs certificate under "Apple app configuration"

---

## 🟡 Important (Required for Full Feature Set)

### Google Sign-In
- [ ] Create Google Cloud OAuth credentials
  - Go to: https://console.cloud.google.com/apis/credentials
  - Create OAuth 2.0 Client ID (Web application type)
  - Add authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`

- [ ] Configure Google provider in Supabase
  - Go to: Supabase Dashboard → Authentication → Providers → Google
  - Toggle: Enable Google provider
  - Enter Client ID from Google Cloud Console
  - Enter Client Secret from Google Cloud Console

- [ ] Add Google Sign-In to iOS app
  - Download `GoogleService-Info.plist` from Firebase Console
  - Add to `ios/Runner/` directory
  - Configure URL scheme in Xcode

- [ ] Add Google Sign-In to Android app
  - Download `google-services.json` from Firebase Console
  - Add to `android/app/` directory
  - Add SHA-1 fingerprint to Firebase Console

### Apple Sign-In
- [ ] Enable Apple Sign-In in Apple Developer Console
  - Go to: https://developer.apple.com/account/resources/identifiers
  - Edit your App ID capability
  - Enable "Sign In with Apple"

- [ ] Configure Apple provider in Supabase
  - Go to: Supabase Dashboard → Authentication → Providers → Apple
  - Toggle: Enable Apple provider
  - Enter Service ID from Apple Developer Console
  - Enter Team ID from Apple Developer Console
  - Enter Key ID from Apple Developer Console
  - Upload private key (.p8 file)

- [ ] Add Apple Sign-In to iOS app
  - Enable "Sign In with Apple" capability in Xcode
  - Add `com.apple.developer.applicationsignin` entitlement

---

## 🟢 Nice to Have (Post-Launch)

### Protomaps Offline Tiles
- [ ] Download Mongolia basemap tiles
  - Option A: Use Planetiler to generate from OSM data
    ```bash
    # Download and run Planetiler
    docker run -e JAVA_OPTS='-Xmx4g' ghcr.io/onthegomap/planetiler:latest \
      --area=mondo \
      --output=mondo.mbtiles
    ```
  - Option B: Download from Protomaps CDN (when available)

- [ ] Convert to PMTiles format (if using MBTiles)
  ```bash
  pmtiles convert mongolia.mbtiles mongolia.pmtiles
  ```

- [ ] Add tile file to app assets
  - Place in: `assets/tiles/mongolia.pmtiles`
  - Update `pubspec.yaml` to include tile assets

### Supabase Storage
- [ ] Create storage buckets
  - Go to: Supabase Dashboard → Storage
  - Create bucket: `avatars` (for user profile photos)
  - Create bucket: `documents` (for horse documents)
  - Create bucket: `horses` (for horse photos)
  - Set bucket policies for authenticated access

### Supabase Edge Functions
- [ ] Deploy remaining Edge Functions
  ```bash
  cd supabase
  supabase functions deploy payment-notification
  supabase functions deploy payment-sms-webhook
  ```

- [ ] Set up Cron Jobs (if needed)
  - Go to: Supabase Dashboard → Database → Cron Jobs
  - Schedule any recurring tasks

---

## 📱 App Configuration

### iOS
- [ ] Update Bundle Identifier
  - Open: `ios/Runner.xcodeproj`
  - Change Bundle Identifier to match your Apple Developer account

- [ ] Configure Push Notification Capability
  - Open: `ios/Runner.xcworkspace`
  - Add capability: Push Notifications
  - Add capability: Background Modes → Remote notifications

- [ ] Update Info.plist
  - Add URL schemes for OAuth callbacks:
    ```xml
    <key>CFBundleURLTypes</key>
    <array>
      <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>io.supabase.tamga</string>
        </array>
      </dict>
    </array>
    ```

### Android
- [ ] Update Application ID
  - Open: `android/app/build.gradle`
  - Change `applicationId` to match your package name

- [ ] Configure Google Services
  - Ensure `google-services.json` is in place
  - Add Google Services plugin to build.gradle

- [ ] Update AndroidManifest.xml
  - Add intent filter for OAuth callbacks:
    ```xml
    <intent-filter>
      <action android:name="android.intent.action.VIEW" />
      <category android:name="android.intent.category.DEFAULT" />
      <category android:name="android.intent.category.BROWSABLE" />
      <data android:scheme="io.supabase.tamga" />
    </intent-filter>
    ```

---

## 🔐 Environment Variables

Create `.env` file in project root:
```env
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Firebase (for push notifications)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Optional: Twilio (for SMS)
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-phone>
```

---

## ✅ Pre-Launch Checklist

- [ ] All critical items completed
- [ ] Test on real iOS device
- [ ] Test on real Android device
- [ ] Test offline functionality
- [ ] Test push notifications end-to-end
- [ ] Test OAuth sign-in flow
- [ ] Test phone OTP flow
- [ ] Verify RLS policies are working
- [ ] Check Supabase dashboard for any errors
- [ ] Monitor Edge Function logs

---

## 📚 References

- Supabase Auth: https://supabase.com/docs/guides/auth
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- Google Sign-In: https://developers.google.com/identity/sign-in/web/sign-in
- Apple Sign-In: https://developer.apple.com/sign-in-with-apple/
- Protomaps: https://protomaps.com/

---

*Last updated: 2026-06-07*
