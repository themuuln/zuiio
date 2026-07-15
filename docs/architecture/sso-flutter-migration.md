# Flutter SSO Migration Guide

## Prerequisites
- `packages/zuiio_auth_flutter` path dependency added to `pubspec.yaml`
- Deep link configured in Android `AndroidManifest.xml` and iOS `Info.plist`

## Step 1: Add deep link config

### Android (`android/app/src/main/AndroidManifest.xml`)

```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask"
  android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="zuiio-<product>" android:host="auth" />
  </intent-filter>
</activity>
```

### iOS (`ios/Runner/Info.plist`)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>zuiio-<product></string>
    </array>
    <key>CFBundleURLName</key>
    <string>auth</string>
  </dict>
</array>
```

## Step 2: Replace auth repository

Before:
```dart
final response = await Supabase.instance.client.auth.signInWithPassword(
  email: email,
  password: password,
);
```

After:
```dart
import 'package:zuiio_auth_flutter/zuiio_auth_flutter.dart';

final auth = ZuiioAuth(Supabase.instance.client);
final success = await auth.signInWithZuiio(
  redirectTo: 'zuiio-<product>://auth/callback',
);
```

## Step 3: Remove old auth code

Delete:
- Email/password text fields and form validation
- `signInWithPassword()` calls
- `signUp()` calls
- `signInWithOAuth(OAuthProvider.google)` calls
- `signInWithOAuth(OAuthProvider.apple)` calls
- Per-app auth repositories (Google auth, Apple auth, etc.)

## Step 4: Keep existing post-login logic

The SSO flow creates a product-local session. All existing:
- Auth state streams (`onAuthStateChange`)
- Navigation based on auth state
- Organization/role checks
- RLS policies

...continue to work unchanged because they use the product-local `auth.uid()`.

## Step 5: Update logout

```dart
final auth = ZuiioAuth(Supabase.instance.client);
await auth.signOut(); // clears product-local session
```

For central identity logout, redirect to `id.zuiio.com/logout`.

## Verification

- [ ] "Zuiio-аар нэвтрэх" button opens external browser
- [ ] Identity app shows login/signup
- [ ] After auth, browser redirects back to app via deep link
- [ ] App has valid product-local session
- [ ] Cancellation returns to login screen without error
- [ ] No credential forms render in the app
