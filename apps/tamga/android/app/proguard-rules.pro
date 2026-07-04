# Flutter specific ProGuard rules
# Keep Flutter SDK classes
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep Supabase/PostgREST models
-keep class com.supabase.** { *; }

# Keep Isar DB classes
-keep class isar.** { *; }

# Keep cached_network_image
-keep class com.zaihui.** { *; }

# Keep all model/data classes used with JSON serialization
-keep class mn.tamga.app.** { *; }

# General rules
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivity$g
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Args
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningEphemeralKeyProvider
