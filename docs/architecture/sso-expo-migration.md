# Expo SSO Migration Guide

## Prerequisites
- `@zuiio/auth` package in the app's dependencies
- `expo-web-browser` installed (`npx expo install expo-web-browser`)
- Deep link configured in `app.json` / `app.config.ts`

## Step 1: Add deep link config

In `app.json` or `app.config.ts`:

```json
{
  "expo": {
    "scheme": "zuiio-<product>",
    "plugins": [
      [
        "expo-web-browser",
        {
          "preferEphemeralSession": true
        }
      ]
    ]
  }
}
```

## Step 2: Add SSO screen

Replace the login/signup screens with one SSO handoff:

```tsx
import { startZuiioSso, exchangeZuiioSsoCode } from "@zuiio/auth";
import * as WebBrowser from "expo-web-browser";

// Ensure any pending auth sessions are cleaned up
WebBrowser.maybeCompleteAuthSession();

function LoginScreen() {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);

  async function handleSso() {
    setLoading(true);
    try {
      const siteUrl = process.env.EXPO_PUBLIC_SITE_URL ?? "http://localhost:8081";
      const { url, error } = await startZuiioSso(supabase, {
        redirectTo: `${siteUrl}/auth/callback`,
        skipBrowserRedirect: true,
      });

      if (error || !url) {
        Alert.alert("Алдаа", "Нэвтрэхэд алдаа гарлаа.");
        return;
      }

      // Open in external browser
      const result = await WebBrowser.openAuthSessionAsync(url);

      if (result.type === "success" && result.url) {
        // Exchange the callback code for a session
        const exchangeError = await exchangeZuiioSsoCode(supabase, result.url);
        if (exchangeError) {
          Alert.alert("Алдаа", "Нэвтрэхэд алдаа гарлаа.");
        }
        // Session is now set — navigate to main app
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      title="Zuiio-аар нэвтрэх"
      onPress={handleSso}
      disabled={loading}
    />
  );
}
```

## Step 3: Remove old auth code

Delete or comment out:
- Email/password input fields
- `signInWithPassword()` calls
- `signUp()` calls
- Phone OTP screens
- Social provider buttons (Google, Apple) — these are now on `id.zuiio.com`

## Step 4: Update callback handling

If the app has a deep link handler for `zuiio-<product>://auth/callback`:

```tsx
import { exchangeZuiioSsoCode } from "@zuiio/auth";

// In your deep link handler
async function handleDeepLink(url: string) {
  if (url.includes("auth/callback")) {
    const error = await exchangeZuiioSsoCode(supabase, url);
    if (!error) {
      // Navigate to main app
    }
  }
}
```

## Step 5: Keep existing post-login logic

The SSO flow creates a product-local session. All existing:
- Organization selection
- Role checks
- Entitlement/onboarding
- RLS policies

...continue to work unchanged because they use `auth.uid()` from the product-local session.

## Verification

- [ ] "Continue with Zuiio" button opens external browser
- [ ] Identity app shows login/signup
- [ ] After auth, browser redirects back to app
- [ ] App exchanges code and has valid session
- [ ] Cancellation returns to login screen without error
- [ ] No credential forms render in the app
