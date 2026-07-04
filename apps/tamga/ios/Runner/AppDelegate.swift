import Flutter
import UIKit

#if canImport(FirebaseCore)
import FirebaseCore
#endif
#if canImport(FirebaseMessaging)
import FirebaseMessaging
#endif

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Firebase initialization — only when GoogleService-Info.plist is present.
    #if canImport(FirebaseCore)
    if FirebaseApp.app() == nil {
      if Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil {
        FirebaseApp.configure()
      } else {
        print("[AppDelegate] GoogleService-Info.plist not found — skipping Firebase config.")
      }
    }
    #endif

    // UNUserNotificationCenter delegate is inherited from FlutterAppDelegate.
    // No need to set self explicitly.

    // Register for remote notifications (APNS token) — only when Firebase Messaging is available.
    // Without a paid Apple Developer account, push notifications cannot be used.
    #if canImport(FirebaseMessaging)
    application.registerForRemoteNotifications()
    #endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
  }

  // ── APNS Token ─────────────────────────────────────────────

  override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // Pass APNS token to Firebase Messaging.
    #if canImport(FirebaseMessaging)
    Messaging.messaging().apnsToken = deviceToken
    #endif

    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[AppDelegate] Failed to register for remote notifications: \(error.localizedDescription)")
  }

  // ── UNUserNotificationCenter Delegate ──────────────────────
  // Handles notification presentation and tap when the app is in foreground.

  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    var options: UNNotificationPresentationOptions = [.badge, .sound]
    if #available(iOS 14.0, *) {
      options.insert(.banner)
    } else {
      options.insert(.alert)
    }
    completionHandler(options)
  }

  override func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo

    #if canImport(FirebaseMessaging)
    Messaging.messaging().appDidReceiveMessage(userInfo)
    #endif

    completionHandler()
  }
}
