import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// To regenerate this file, run `flutterfire configure`.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBUMROe0bzDMSokrFXBIHR1ky-Q4EalsT8',
    appId: '1:1039019917518:android:b693a44ac3ec96c299109f',
    messagingSenderId: '1039019917518',
    projectId: 'tumurch-fd1da',
    storageBucket: 'tumurch-fd1da.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDLRALGksCOxnmp3xNblEehUn_glhtWEzA',
    appId: '1:1039019917518:ios:a8bb619bdf2f464c99109f',
    messagingSenderId: '1039019917518',
    projectId: 'tumurch-fd1da',
    storageBucket: 'tumurch-fd1da.firebasestorage.app',
    iosBundleId: 'mn.tamga.app',
  );
}
