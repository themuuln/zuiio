import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_mn.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('mn'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In mn, this message translates to:
  /// **'Tamga'**
  String get appTitle;

  /// No description provided for @generalContinue.
  ///
  /// In mn, this message translates to:
  /// **'Үргэлжлүүлэх'**
  String get generalContinue;

  /// No description provided for @generalBack.
  ///
  /// In mn, this message translates to:
  /// **'Буцах'**
  String get generalBack;

  /// No description provided for @generalCancel.
  ///
  /// In mn, this message translates to:
  /// **'Цуцлах'**
  String get generalCancel;

  /// No description provided for @generalSave.
  ///
  /// In mn, this message translates to:
  /// **'Хадгалах'**
  String get generalSave;

  /// No description provided for @generalDelete.
  ///
  /// In mn, this message translates to:
  /// **'Устгах'**
  String get generalDelete;

  /// No description provided for @generalEdit.
  ///
  /// In mn, this message translates to:
  /// **'Засах'**
  String get generalEdit;

  /// No description provided for @generalSearch.
  ///
  /// In mn, this message translates to:
  /// **'Хайх'**
  String get generalSearch;

  /// No description provided for @generalLoading.
  ///
  /// In mn, this message translates to:
  /// **'Ачаалж байна...'**
  String get generalLoading;

  /// No description provided for @generalError.
  ///
  /// In mn, this message translates to:
  /// **'Алдаа гарлаа'**
  String get generalError;

  /// No description provided for @generalRetry.
  ///
  /// In mn, this message translates to:
  /// **'Дахин оролдох'**
  String get generalRetry;

  /// No description provided for @generalConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Батлах'**
  String get generalConfirm;

  /// No description provided for @generalClose.
  ///
  /// In mn, this message translates to:
  /// **'Хаах'**
  String get generalClose;

  /// No description provided for @generalOr.
  ///
  /// In mn, this message translates to:
  /// **'эсвэл'**
  String get generalOr;

  /// No description provided for @generalRequired.
  ///
  /// In mn, this message translates to:
  /// **'Шаардлагатай'**
  String get generalRequired;

  /// No description provided for @generalSkip.
  ///
  /// In mn, this message translates to:
  /// **'Алгасах'**
  String get generalSkip;

  /// No description provided for @generalDone.
  ///
  /// In mn, this message translates to:
  /// **'Дуусгах'**
  String get generalDone;

  /// No description provided for @generalStart.
  ///
  /// In mn, this message translates to:
  /// **'Эхлэх'**
  String get generalStart;

  /// No description provided for @generalAll.
  ///
  /// In mn, this message translates to:
  /// **'Бүгд'**
  String get generalAll;

  /// No description provided for @generalNext.
  ///
  /// In mn, this message translates to:
  /// **'Дараах'**
  String get generalNext;

  /// No description provided for @navLineage.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил'**
  String get navLineage;

  /// No description provided for @navMarket.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээл'**
  String get navMarket;

  /// No description provided for @navEvents.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээ'**
  String get navEvents;

  /// No description provided for @navSearch.
  ///
  /// In mn, this message translates to:
  /// **'Хайлт'**
  String get navSearch;

  /// No description provided for @navProfile.
  ///
  /// In mn, this message translates to:
  /// **'Профайл'**
  String get navProfile;

  /// No description provided for @shellGuestPlaceholder.
  ///
  /// In mn, this message translates to:
  /// **'Хэрэглэгч'**
  String get shellGuestPlaceholder;

  /// No description provided for @shellGuestPrompt.
  ///
  /// In mn, this message translates to:
  /// **'Өгөгдлөө хамгаалахын тулд бүртгүүлнэ үү'**
  String get shellGuestPrompt;

  /// No description provided for @shellGuestRegisterButton.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгүүлэх'**
  String get shellGuestRegisterButton;

  /// No description provided for @sessionExpiredTitle.
  ///
  /// In mn, this message translates to:
  /// **'Сессийн хугацаа дууссан'**
  String get sessionExpiredTitle;

  /// No description provided for @sessionExpiredMessage.
  ///
  /// In mn, this message translates to:
  /// **'Таны сессийн хугацаа дууссан байна. Дахин нэвтэрнэ үү.'**
  String get sessionExpiredMessage;

  /// No description provided for @sessionExpiredAction.
  ///
  /// In mn, this message translates to:
  /// **'Нэвтрэх'**
  String get sessionExpiredAction;

  /// No description provided for @welcomeBrandTitle.
  ///
  /// In mn, this message translates to:
  /// **'Тамга'**
  String get welcomeBrandTitle;

  /// No description provided for @welcomeTagline.
  ///
  /// In mn, this message translates to:
  /// **'Таны адууны талаарх цорын ганц найдвартай эх сурвалж'**
  String get welcomeTagline;

  /// No description provided for @welcomeFeatureLineageTitle.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил'**
  String get welcomeFeatureLineageTitle;

  /// No description provided for @welcomeFeatureLineageSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Баталгаатай удам угшлын бүртгэл'**
  String get welcomeFeatureLineageSubtitle;

  /// No description provided for @welcomeFeatureHealthTitle.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэнд'**
  String get welcomeFeatureHealthTitle;

  /// No description provided for @welcomeFeatureHealthSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Вакцинжуулалт, эмчилгээний түүх'**
  String get welcomeFeatureHealthSubtitle;

  /// No description provided for @welcomeFeatureMarketTitle.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээл'**
  String get welcomeFeatureMarketTitle;

  /// No description provided for @welcomeFeatureMarketSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Найдвартай худалдаа, арилжаа'**
  String get welcomeFeatureMarketSubtitle;

  /// No description provided for @welcomeCtaButton.
  ///
  /// In mn, this message translates to:
  /// **'Эхлэх'**
  String get welcomeCtaButton;

  /// No description provided for @welcomeSocialProof.
  ///
  /// In mn, this message translates to:
  /// **'Монголын 50,000 гаруй адуучин бидэнд итгэдэг'**
  String get welcomeSocialProof;

  /// No description provided for @roleSelectionTitle.
  ///
  /// In mn, this message translates to:
  /// **'Таны үүрэг'**
  String get roleSelectionTitle;

  /// No description provided for @roleSelectionSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Та хэн бэ?'**
  String get roleSelectionSubtitle;

  /// No description provided for @loginAppBrand.
  ///
  /// In mn, this message translates to:
  /// **'Адуучин'**
  String get loginAppBrand;

  /// No description provided for @loginTitle.
  ///
  /// In mn, this message translates to:
  /// **'Нэвтрэх'**
  String get loginTitle;

  /// No description provided for @loginEmailLabel.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл'**
  String get loginEmailLabel;

  /// No description provided for @loginEmailRequired.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл хаягаа оруулна уу'**
  String get loginEmailRequired;

  /// No description provided for @loginEmailInvalid.
  ///
  /// In mn, this message translates to:
  /// **'Зөв имэйл хаяг оруулна уу'**
  String get loginEmailInvalid;

  /// No description provided for @loginPasswordLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үг'**
  String get loginPasswordLabel;

  /// No description provided for @loginPasswordRequired.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үгээ оруулна уу'**
  String get loginPasswordRequired;

  /// No description provided for @loginPasswordMinLength.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой'**
  String get loginPasswordMinLength;

  /// No description provided for @loginSignInButton.
  ///
  /// In mn, this message translates to:
  /// **'Нэвтрэх'**
  String get loginSignInButton;

  /// No description provided for @loginRegisterLink.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгүүлэх'**
  String get loginRegisterLink;

  /// No description provided for @loginPhoneLogin.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаараар нэвтрэх'**
  String get loginPhoneLogin;

  /// No description provided for @loginGoogleLogin.
  ///
  /// In mn, this message translates to:
  /// **'Google-ээр нэвтрэх'**
  String get loginGoogleLogin;

  /// No description provided for @loginAppleLogin.
  ///
  /// In mn, this message translates to:
  /// **'Apple-ээр нэвтрэх'**
  String get loginAppleLogin;

  /// No description provided for @loginGuestLogin.
  ///
  /// In mn, this message translates to:
  /// **'Зочноор үргэлжлүүлэх'**
  String get loginGuestLogin;

  /// No description provided for @registerAppBarTitle.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгүүлэх'**
  String get registerAppBarTitle;

  /// No description provided for @registerTitle.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэл үүсгэх'**
  String get registerTitle;

  /// No description provided for @registerNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр (заавал биш)'**
  String get registerNameLabel;

  /// No description provided for @registerNameHint.
  ///
  /// In mn, this message translates to:
  /// **'Нэрээ оруулна уу'**
  String get registerNameHint;

  /// No description provided for @registerEmailLabel.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл'**
  String get registerEmailLabel;

  /// No description provided for @registerEmailHint.
  ///
  /// In mn, this message translates to:
  /// **'name@example.com'**
  String get registerEmailHint;

  /// No description provided for @registerEmailRequired.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл хаягаа оруулна уу'**
  String get registerEmailRequired;

  /// No description provided for @registerEmailInvalid.
  ///
  /// In mn, this message translates to:
  /// **'Зөв имэйл хаяг оруулна уу'**
  String get registerEmailInvalid;

  /// No description provided for @registerPasswordLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үг'**
  String get registerPasswordLabel;

  /// No description provided for @registerPasswordRequired.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үгээ оруулна уу'**
  String get registerPasswordRequired;

  /// No description provided for @registerPasswordMinLength.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой'**
  String get registerPasswordMinLength;

  /// No description provided for @registerConfirmPasswordLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үгээ баталгаажуулах'**
  String get registerConfirmPasswordLabel;

  /// No description provided for @registerConfirmPasswordRequired.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үгээ давтан оруулна уу'**
  String get registerConfirmPasswordRequired;

  /// No description provided for @registerPasswordMismatch.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үг таарахгүй байна'**
  String get registerPasswordMismatch;

  /// No description provided for @registerAlreadyHaveAccount.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлтэй юу? Нэвтрэх'**
  String get registerAlreadyHaveAccount;

  /// No description provided for @registerSubmitButton.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгүүлэх'**
  String get registerSubmitButton;

  /// No description provided for @phoneLoginTitle.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаар'**
  String get phoneLoginTitle;

  /// No description provided for @phoneLoginHeading.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаараа оруулна уу'**
  String get phoneLoginHeading;

  /// No description provided for @phoneLoginSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Баталгаажуулах код (OTP) илгээнэ'**
  String get phoneLoginSubtitle;

  /// No description provided for @phoneLoginPhoneLabel.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаар'**
  String get phoneLoginPhoneLabel;

  /// No description provided for @phoneLoginPhoneHint.
  ///
  /// In mn, this message translates to:
  /// **'99123456'**
  String get phoneLoginPhoneHint;

  /// No description provided for @phoneLoginCountryCode.
  ///
  /// In mn, this message translates to:
  /// **'+976 '**
  String get phoneLoginCountryCode;

  /// No description provided for @phoneLoginPhoneRequired.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаараа оруулна уу'**
  String get phoneLoginPhoneRequired;

  /// No description provided for @phoneLoginPhoneInvalidLength.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаар 8 оронтой байх ёстой'**
  String get phoneLoginPhoneInvalidLength;

  /// No description provided for @phoneLoginPhoneOnlyDigits.
  ///
  /// In mn, this message translates to:
  /// **'Зөвхөн тоо оруулна уу'**
  String get phoneLoginPhoneOnlyDigits;

  /// No description provided for @phoneLoginSendCodeButton.
  ///
  /// In mn, this message translates to:
  /// **'Код илгээх'**
  String get phoneLoginSendCodeButton;

  /// No description provided for @phoneLoginEmailLogin.
  ///
  /// In mn, this message translates to:
  /// **'Имэйлээр нэвтрэх'**
  String get phoneLoginEmailLogin;

  /// No description provided for @otpVerifyTitle.
  ///
  /// In mn, this message translates to:
  /// **'Код баталгаажуулах'**
  String get otpVerifyTitle;

  /// No description provided for @otpVerifySentTitle.
  ///
  /// In mn, this message translates to:
  /// **'Баталгаажуулах код илгээлээ'**
  String get otpVerifySentTitle;

  /// No description provided for @otpVerifyButton.
  ///
  /// In mn, this message translates to:
  /// **'Баталгаажуулах'**
  String get otpVerifyButton;

  /// No description provided for @otpVerifyResendButton.
  ///
  /// In mn, this message translates to:
  /// **'Кодыг дахин илгээх'**
  String get otpVerifyResendButton;

  /// No description provided for @otpVerifyChangeNumber.
  ///
  /// In mn, this message translates to:
  /// **'Дугаар солих'**
  String get otpVerifyChangeNumber;

  /// No description provided for @authErrorInvalidCredentials.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл эсвэл нууц үг буруу байна'**
  String get authErrorInvalidCredentials;

  /// No description provided for @authErrorUserAlreadyRegistered.
  ///
  /// In mn, this message translates to:
  /// **'Энэ имэйлээр бүртгэл аль хэдийн үүссэн байна'**
  String get authErrorUserAlreadyRegistered;

  /// No description provided for @authErrorEmailNotConfirmed.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл хаяг баталгаажаагүй байна'**
  String get authErrorEmailNotConfirmed;

  /// No description provided for @authErrorWeakPassword.
  ///
  /// In mn, this message translates to:
  /// **'Нууц үг хэт богино байна (дор хаяж 6 тэмдэгт шаардлагатай)'**
  String get authErrorWeakPassword;

  /// No description provided for @authErrorInvalidEmail.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл хаяг буруу байна'**
  String get authErrorInvalidEmail;

  /// No description provided for @authErrorRateLimit.
  ///
  /// In mn, this message translates to:
  /// **'Хэт олон хүсэлт илгээгдлээ. Түр хүлээгээд дахин оролдоно уу.'**
  String get authErrorRateLimit;

  /// No description provided for @authErrorNetwork.
  ///
  /// In mn, this message translates to:
  /// **'Сүлжээний алдаа гарлаа. Холболтоо шалгана уу.'**
  String get authErrorNetwork;

  /// No description provided for @authErrorGeneric.
  ///
  /// In mn, this message translates to:
  /// **'Алдаа гарлаа. Дахин оролдоно уу.'**
  String get authErrorGeneric;

  /// No description provided for @splashTitle.
  ///
  /// In mn, this message translates to:
  /// **'Тамга'**
  String get splashTitle;

  /// No description provided for @splashSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Морины удам угшлын бүртгэл'**
  String get splashSubtitle;

  /// No description provided for @errorDefaultMessage.
  ///
  /// In mn, this message translates to:
  /// **'Уучлаарай, гэнэтийн алдаа гарлаа. Сүлжээний асуудал эсвэл түр зуурын саатал байж болно.'**
  String get errorDefaultMessage;

  /// No description provided for @errorRetryButton.
  ///
  /// In mn, this message translates to:
  /// **'Дахин оролдох'**
  String get errorRetryButton;

  /// No description provided for @syncLastSynced.
  ///
  /// In mn, this message translates to:
  /// **'Сүүлд синхрончилсон: саяхан'**
  String get syncLastSynced;

  /// No description provided for @syncLastSyncedMinutes.
  ///
  /// In mn, this message translates to:
  /// **'Сүүлд синхрончилсон: {minutes} минутын өмнө'**
  String syncLastSyncedMinutes(Object minutes);

  /// No description provided for @syncLastSyncedHours.
  ///
  /// In mn, this message translates to:
  /// **'Сүүлд синхрончилсон: {hours} цагийн өмнө'**
  String syncLastSyncedHours(Object hours);

  /// No description provided for @syncLastSyncedDays.
  ///
  /// In mn, this message translates to:
  /// **'Сүүлд синхрончилсон: {days} хоногийн өмнө'**
  String syncLastSyncedDays(Object days);

  /// No description provided for @syncOfflineBanner.
  ///
  /// In mn, this message translates to:
  /// **'Сүлжээгүй байна — Төхөөрөмж дээрх өгөгдлийг харуулж байна'**
  String get syncOfflineBanner;

  /// No description provided for @syncConflictCount.
  ///
  /// In mn, this message translates to:
  /// **'Зөрчилтэй {count} зүйл байна'**
  String syncConflictCount(Object count);

  /// No description provided for @syncError.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлолын алдаа гарлаа'**
  String get syncError;

  /// No description provided for @syncInProgress.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончилж байна...'**
  String get syncInProgress;

  /// No description provided for @syncPendingCount.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлохыг хүлээж буй {count} зүйл байна'**
  String syncPendingCount(Object count);

  /// No description provided for @syncSynced.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлогдсон'**
  String get syncSynced;

  /// No description provided for @syncInactive.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлол идэвхгүй'**
  String get syncInactive;

  /// No description provided for @syncButton.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлох'**
  String get syncButton;

  /// No description provided for @syncInProgressButton.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончилж байна...'**
  String get syncInProgressButton;

  /// No description provided for @profileTabHorses.
  ///
  /// In mn, this message translates to:
  /// **'Морьд'**
  String get profileTabHorses;

  /// No description provided for @profileTabLineage.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил'**
  String get profileTabLineage;

  /// No description provided for @profileTabSettings.
  ///
  /// In mn, this message translates to:
  /// **'Тохиргоо'**
  String get profileTabSettings;

  /// No description provided for @profileInfoCard.
  ///
  /// In mn, this message translates to:
  /// **'Мэдээлэл'**
  String get profileInfoCard;

  /// No description provided for @profileInbox.
  ///
  /// In mn, this message translates to:
  /// **'Ирсэн мессеж'**
  String get profileInbox;

  /// No description provided for @profileInboxSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Зурвасууд'**
  String get profileInboxSubtitle;

  /// No description provided for @profileNotificationSettings.
  ///
  /// In mn, this message translates to:
  /// **'Мэдэгдлийн тохиргоо'**
  String get profileNotificationSettings;

  /// No description provided for @profileNotificationSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Мэдэгдлийг асаах, унтраах'**
  String get profileNotificationSubtitle;

  /// No description provided for @profileSyncQueue.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлолын дараалал'**
  String get profileSyncQueue;

  /// No description provided for @profileSyncQueueSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Хүлээгдэж буй болон амжилтгүй синхрончлолууд'**
  String get profileSyncQueueSubtitle;

  /// No description provided for @profileSyncSettings.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлолын тохиргоо'**
  String get profileSyncSettings;

  /// No description provided for @profileSyncSettingsSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Автомат болон гараар синхрончлох, локал өгөгдөл цэвэрлэх'**
  String get profileSyncSettingsSubtitle;

  /// No description provided for @profilePartnerDashboard.
  ///
  /// In mn, this message translates to:
  /// **'Түншийн самбар'**
  String get profilePartnerDashboard;

  /// No description provided for @profilePartnerDashboardSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээг удирдах'**
  String get profilePartnerDashboardSubtitle;

  /// No description provided for @profileAnalytics.
  ///
  /// In mn, this message translates to:
  /// **'Шинжилгээ'**
  String get profileAnalytics;

  /// No description provided for @profileAnalyticsSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Сүрэг, эрүүл мэнд, санхүүгийн үзүүлэлтүүд'**
  String get profileAnalyticsSubtitle;

  /// No description provided for @profileSellerVerification.
  ///
  /// In mn, this message translates to:
  /// **'Худалдагчийг баталгаажуулах'**
  String get profileSellerVerification;

  /// No description provided for @profileSellerVerificationSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Утасны дугаар болон E-Mongolia ID-г баталгаажуулах'**
  String get profileSellerVerificationSubtitle;

  /// No description provided for @profileSavedSearches.
  ///
  /// In mn, this message translates to:
  /// **'Хадгалсан хайлтууд'**
  String get profileSavedSearches;

  /// No description provided for @profileSavedSearchesSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Шүүлтүүр хадгалах, удирдах'**
  String get profileSavedSearchesSubtitle;

  /// No description provided for @profileBreederLeaderboard.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэгчдийн чансаа'**
  String get profileBreederLeaderboard;

  /// No description provided for @profileBreederLeaderboardSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэгчдийг үзүүлэлтээр нь эрэмбэлэх'**
  String get profileBreederLeaderboardSubtitle;

  /// No description provided for @profileModerationQueue.
  ///
  /// In mn, this message translates to:
  /// **'Зарын хяналт'**
  String get profileModerationQueue;

  /// No description provided for @profileModerationSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Мэдээлсэн заруудыг харах, зөвшөөрөх эсвэл татгалзах'**
  String get profileModerationSubtitle;

  /// No description provided for @profileAutoSync.
  ///
  /// In mn, this message translates to:
  /// **'Автомат синхрончлол'**
  String get profileAutoSync;

  /// No description provided for @profileAutoSyncSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Supabase тохируулагдсан үед автоматаар синхрончлох'**
  String get profileAutoSyncSubtitle;

  /// No description provided for @profileLoading.
  ///
  /// In mn, this message translates to:
  /// **'Ачаалж байна...'**
  String get profileLoading;

  /// No description provided for @profileSettingsError.
  ///
  /// In mn, this message translates to:
  /// **'Тохиргоог ачаалж чадсангүй'**
  String get profileSettingsError;

  /// No description provided for @profileRaceVideos.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны бичлэгүүд'**
  String get profileRaceVideos;

  /// No description provided for @profileRaceVideosSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны бичлэг үзэх, худалдах'**
  String get profileRaceVideosSubtitle;

  /// No description provided for @profileRestartOnboarding.
  ///
  /// In mn, this message translates to:
  /// **'Танилцуулгыг дахин эхлүүлэх'**
  String get profileRestartOnboarding;

  /// No description provided for @profileRestartOnboardingSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Тохиргоо, үүрэг болон адууны мэдээллээ дахин оруулах'**
  String get profileRestartOnboardingSubtitle;

  /// No description provided for @profileRestartOnboardingDialogTitle.
  ///
  /// In mn, this message translates to:
  /// **'Танилцуулгыг дахин эхлүүлэх үү?'**
  String get profileRestartOnboardingDialogTitle;

  /// No description provided for @profileRestartOnboardingDialogContent.
  ///
  /// In mn, this message translates to:
  /// **'Одоогийн тохиргоо шинэчлэгдэнэ. Хадгалсан өгөгдөл устахгүй.'**
  String get profileRestartOnboardingDialogContent;

  /// No description provided for @profileSignOut.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлээс гарах'**
  String get profileSignOut;

  /// No description provided for @profileSignOutSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлээсээ гарах'**
  String get profileSignOutSubtitle;

  /// No description provided for @profileSignOutDialogTitle.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлээс гарах'**
  String get profileSignOutDialogTitle;

  /// No description provided for @profileSignOutDialogContent.
  ///
  /// In mn, this message translates to:
  /// **'Та бүртгэлээсээ гарахдаа итгэлтэй байна уу?'**
  String get profileSignOutDialogContent;

  /// No description provided for @profileSignOutCancel.
  ///
  /// In mn, this message translates to:
  /// **'Цуцлах'**
  String get profileSignOutCancel;

  /// No description provided for @profileSignOutConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Гарах'**
  String get profileSignOutConfirm;

  /// No description provided for @profileSignOutError.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлээс гарч чадсангүй'**
  String get profileSignOutError;

  /// No description provided for @profileStableProfile.
  ///
  /// In mn, this message translates to:
  /// **'Жүчээний профайл'**
  String get profileStableProfile;

  /// No description provided for @profileStableSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Жүчээний мэдээлэл, гишүүд болон адууны тоо'**
  String get profileStableSubtitle;

  /// No description provided for @profileTeamManagement.
  ///
  /// In mn, this message translates to:
  /// **'Багийн удирдлага'**
  String get profileTeamManagement;

  /// No description provided for @profileTeamSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Гишүүд урих, эрх өөрчлөх, хасах'**
  String get profileTeamSubtitle;

  /// No description provided for @profileInvitations.
  ///
  /// In mn, this message translates to:
  /// **'Урилгууд'**
  String get profileInvitations;

  /// No description provided for @profileInvitationsSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Хүлээгдэж буй багийн урилгууд'**
  String get profileInvitationsSubtitle;

  /// No description provided for @profileShadcnDemo.
  ///
  /// In mn, this message translates to:
  /// **'Shadcn үзүүлэн'**
  String get profileShadcnDemo;

  /// No description provided for @profileShadcnDemoSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Хөгжүүлэгчийн компонентын үзүүлэн'**
  String get profileShadcnDemoSubtitle;

  /// No description provided for @horseTabRegistry.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэл'**
  String get horseTabRegistry;

  /// No description provided for @horseTabLineage.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил'**
  String get horseTabLineage;

  /// No description provided for @horseNavTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морьд'**
  String get horseNavTitle;

  /// No description provided for @horseAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Морь нэмэх'**
  String get horseAddButton;

  /// No description provided for @horseImportCsv.
  ///
  /// In mn, this message translates to:
  /// **'CSV файлаас импортлох'**
  String get horseImportCsv;

  /// No description provided for @horseSearchHint.
  ///
  /// In mn, this message translates to:
  /// **'Нэр, зүс, микрочипээр хайх...'**
  String get horseSearchHint;

  /// No description provided for @horseEmptyTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морь бүртгэгдээгүй байна'**
  String get horseEmptyTitle;

  /// No description provided for @horseEmptyDescription.
  ///
  /// In mn, this message translates to:
  /// **'Шинэ морь бүртгэхийн тулд доорх товчийг дарна уу, эсвэл CSV файлаас импортлоно уу.'**
  String get horseEmptyDescription;

  /// No description provided for @horseEmptyNoResults.
  ///
  /// In mn, this message translates to:
  /// **'Таны хайлтад тохирох морь олдсонгүй'**
  String get horseEmptyNoResults;

  /// No description provided for @horseDetailPhotoGallery.
  ///
  /// In mn, this message translates to:
  /// **'Галерей'**
  String get horseDetailPhotoGallery;

  /// No description provided for @horseDetailPhotoCamera.
  ///
  /// In mn, this message translates to:
  /// **'Камер'**
  String get horseDetailPhotoCamera;

  /// No description provided for @horseDetailPhotoSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Зургийг амжилттай нэмлээ'**
  String get horseDetailPhotoSuccess;

  /// No description provided for @horseDetailTooltipAddPhoto.
  ///
  /// In mn, this message translates to:
  /// **'Зураг нэмэх'**
  String get horseDetailTooltipAddPhoto;

  /// No description provided for @horseDetailTooltipEdit.
  ///
  /// In mn, this message translates to:
  /// **'Засах'**
  String get horseDetailTooltipEdit;

  /// No description provided for @horseDetailTabInfo.
  ///
  /// In mn, this message translates to:
  /// **'Мэдээлэл'**
  String get horseDetailTabInfo;

  /// No description provided for @horseDetailTabHealth.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэнд'**
  String get horseDetailTabHealth;

  /// No description provided for @horseDetailTabTraining.
  ///
  /// In mn, this message translates to:
  /// **'Дасгалжуулалт'**
  String get horseDetailTabTraining;

  /// No description provided for @horseDetailTabPerformance.
  ///
  /// In mn, this message translates to:
  /// **'Үзүүлэлт'**
  String get horseDetailTabPerformance;

  /// No description provided for @horseDetailTabFeedSchedule.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн хуваарь'**
  String get horseDetailTabFeedSchedule;

  /// No description provided for @horseDetailTabFeedLog.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн бүртгэл'**
  String get horseDetailTabFeedLog;

  /// No description provided for @horseDetailTabEvents.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээ'**
  String get horseDetailTabEvents;

  /// No description provided for @horseDetailTabLineage.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил'**
  String get horseDetailTabLineage;

  /// No description provided for @horseInfoDetailSection.
  ///
  /// In mn, this message translates to:
  /// **'Дэлгэрэнгүй'**
  String get horseInfoDetailSection;

  /// No description provided for @horseInfoName.
  ///
  /// In mn, this message translates to:
  /// **'Нэр:'**
  String get horseInfoName;

  /// No description provided for @horseInfoGender.
  ///
  /// In mn, this message translates to:
  /// **'Хүйс:'**
  String get horseInfoGender;

  /// No description provided for @horseInfoCoat.
  ///
  /// In mn, this message translates to:
  /// **'Зүс:'**
  String get horseInfoCoat;

  /// No description provided for @horseInfoBirthYear.
  ///
  /// In mn, this message translates to:
  /// **'Төрсөн он:'**
  String get horseInfoBirthYear;

  /// No description provided for @horseInfoRelation.
  ///
  /// In mn, this message translates to:
  /// **'Хамаарал:'**
  String get horseInfoRelation;

  /// No description provided for @horseInfoAwards.
  ///
  /// In mn, this message translates to:
  /// **'Шагнал:'**
  String get horseInfoAwards;

  /// No description provided for @horseInfoOffspring.
  ///
  /// In mn, this message translates to:
  /// **'Үр төл:'**
  String get horseInfoOffspring;

  /// No description provided for @horseInfoLineage.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил:'**
  String get horseInfoLineage;

  /// No description provided for @horseInfoMicrochip.
  ///
  /// In mn, this message translates to:
  /// **'Микрочип:'**
  String get horseInfoMicrochip;

  /// No description provided for @horseInfoRegistration.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэл:'**
  String get horseInfoRegistration;

  /// No description provided for @horseInfoBreed.
  ///
  /// In mn, this message translates to:
  /// **'Үүлдэр:'**
  String get horseInfoBreed;

  /// No description provided for @horseInfoCoatColor.
  ///
  /// In mn, this message translates to:
  /// **'Зүс (өнгө):'**
  String get horseInfoCoatColor;

  /// No description provided for @horseInfoRegion.
  ///
  /// In mn, this message translates to:
  /// **'Нутаг дэвсгэр:'**
  String get horseInfoRegion;

  /// No description provided for @horseInfoDistrict.
  ///
  /// In mn, this message translates to:
  /// **'Сум/дүүрэг:'**
  String get horseInfoDistrict;

  /// No description provided for @horseInfoTamgaClan.
  ///
  /// In mn, this message translates to:
  /// **'Тамганы овог:'**
  String get horseInfoTamgaClan;

  /// No description provided for @horseInfoTamgaGeneration.
  ///
  /// In mn, this message translates to:
  /// **'Тамганы үе:'**
  String get horseInfoTamgaGeneration;

  /// No description provided for @horseInfoStampSection.
  ///
  /// In mn, this message translates to:
  /// **'Тамга (эзэмшлийн тэмдэг)'**
  String get horseInfoStampSection;

  /// No description provided for @horseInfoCertTitle.
  ///
  /// In mn, this message translates to:
  /// **'Дижитал гэрчилгээ'**
  String get horseInfoCertTitle;

  /// No description provided for @horseInfoNotesSection.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get horseInfoNotesSection;

  /// No description provided for @horseInfoDocsButton.
  ///
  /// In mn, this message translates to:
  /// **'Баримт бичиг'**
  String get horseInfoDocsButton;

  /// No description provided for @horseInfoCoOwnership.
  ///
  /// In mn, this message translates to:
  /// **'Хамтран эзэмшигчид'**
  String get horseInfoCoOwnership;

  /// No description provided for @horseInfoAgeFormat.
  ///
  /// In mn, this message translates to:
  /// **'{age} настай'**
  String horseInfoAgeFormat(Object age);

  /// No description provided for @horseFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морь нэмэх'**
  String get horseFormTitle;

  /// No description provided for @horseFormEditTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морины мэдээлэл засах'**
  String get horseFormEditTitle;

  /// No description provided for @horseFormBasicSection.
  ///
  /// In mn, this message translates to:
  /// **'Үндсэн мэдээлэл'**
  String get horseFormBasicSection;

  /// No description provided for @horseFormDetailsSection.
  ///
  /// In mn, this message translates to:
  /// **'Дэлгэрэнгүй'**
  String get horseFormDetailsSection;

  /// No description provided for @horseFormIdentitySection.
  ///
  /// In mn, this message translates to:
  /// **'Таних мэдээлэл'**
  String get horseFormIdentitySection;

  /// No description provided for @horseFormNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр'**
  String get horseFormNameLabel;

  /// No description provided for @horseFormNameHint.
  ///
  /// In mn, this message translates to:
  /// **'Морины нэр'**
  String get horseFormNameHint;

  /// No description provided for @horseFormNameRequired.
  ///
  /// In mn, this message translates to:
  /// **'Нэр оруулна уу'**
  String get horseFormNameRequired;

  /// No description provided for @horseFormGenderLabel.
  ///
  /// In mn, this message translates to:
  /// **'Хүйс'**
  String get horseFormGenderLabel;

  /// No description provided for @horseFormCoatLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зүс'**
  String get horseFormCoatLabel;

  /// No description provided for @horseFormCoatHint.
  ///
  /// In mn, this message translates to:
  /// **'Зүс сонгоно уу'**
  String get horseFormCoatHint;

  /// No description provided for @horseFormBirthYearLabel.
  ///
  /// In mn, this message translates to:
  /// **'Төрсөн он'**
  String get horseFormBirthYearLabel;

  /// No description provided for @horseFormBreedLabel.
  ///
  /// In mn, this message translates to:
  /// **'Үүлдэр, удам угшил'**
  String get horseFormBreedLabel;

  /// No description provided for @horseFormBreedHint.
  ///
  /// In mn, this message translates to:
  /// **'Үүлдэр сонгоно уу'**
  String get horseFormBreedHint;

  /// No description provided for @horseFormColorLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зүс (өнгө)'**
  String get horseFormColorLabel;

  /// No description provided for @horseFormColorHint.
  ///
  /// In mn, this message translates to:
  /// **'Зүс сонгоно уу'**
  String get horseFormColorHint;

  /// No description provided for @horseFormRegionLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нутаг дэвсгэр'**
  String get horseFormRegionLabel;

  /// No description provided for @horseFormRegionHint.
  ///
  /// In mn, this message translates to:
  /// **'Нутаг дэвсгэр сонгоно уу'**
  String get horseFormRegionHint;

  /// No description provided for @horseFormDistrictLabel.
  ///
  /// In mn, this message translates to:
  /// **'Сум/дүүрэг'**
  String get horseFormDistrictLabel;

  /// No description provided for @horseFormDistrictHint.
  ///
  /// In mn, this message translates to:
  /// **'Сум/дүүргээ оруулна уу'**
  String get horseFormDistrictHint;

  /// No description provided for @horseFormMicrochipLabel.
  ///
  /// In mn, this message translates to:
  /// **'Микрочип'**
  String get horseFormMicrochipLabel;

  /// No description provided for @horseFormMicrochipHint.
  ///
  /// In mn, this message translates to:
  /// **'Микрочипийн дугаар'**
  String get horseFormMicrochipHint;

  /// No description provided for @horseFormRegNoLabel.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлийн дугаар'**
  String get horseFormRegNoLabel;

  /// No description provided for @horseFormRegNoHint.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлийн дугаар оруулна уу'**
  String get horseFormRegNoHint;

  /// No description provided for @horseFormTamgaClanLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тамганы овог'**
  String get horseFormTamgaClanLabel;

  /// No description provided for @horseFormTamgaClanHint.
  ///
  /// In mn, this message translates to:
  /// **'Тамганы овгийн нэр'**
  String get horseFormTamgaClanHint;

  /// No description provided for @horseFormTamgaGenLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тамганы үе'**
  String get horseFormTamgaGenLabel;

  /// No description provided for @horseFormTamgaGenHint.
  ///
  /// In mn, this message translates to:
  /// **'Үеийн тоо'**
  String get horseFormTamgaGenHint;

  /// No description provided for @horseFormRelationLabel.
  ///
  /// In mn, this message translates to:
  /// **'Эзэмшигчтэй хамаарал'**
  String get horseFormRelationLabel;

  /// No description provided for @horseFormRelationHint.
  ///
  /// In mn, this message translates to:
  /// **'Эзэмшигчтэй холбоотой мэдээлэл'**
  String get horseFormRelationHint;

  /// No description provided for @horseFormNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get horseFormNotesLabel;

  /// No description provided for @horseFormNotesHint.
  ///
  /// In mn, this message translates to:
  /// **'Нэмэлт мэдээлэл'**
  String get horseFormNotesHint;

  /// No description provided for @horseFormSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Морины мэдээллийг амжилттай хадгаллаа'**
  String get horseFormSaveSuccess;

  /// No description provided for @horseFormDeleteConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Энэ морийг устгахдаа итгэлтэй байна уу?'**
  String get horseFormDeleteConfirm;

  /// No description provided for @horseFormDeleteSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Морины мэдээллийг амжилттай устгалаа'**
  String get horseFormDeleteSuccess;

  /// No description provided for @horseFormPhotoSection.
  ///
  /// In mn, this message translates to:
  /// **'Зураг'**
  String get horseFormPhotoSection;

  /// No description provided for @horseFormPhotoPickGallery.
  ///
  /// In mn, this message translates to:
  /// **'Галерей'**
  String get horseFormPhotoPickGallery;

  /// No description provided for @horseFormPhotoPickCamera.
  ///
  /// In mn, this message translates to:
  /// **'Камер'**
  String get horseFormPhotoPickCamera;

  /// No description provided for @healthScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн түүх'**
  String get healthScreenTitle;

  /// No description provided for @healthEmptyState.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн бүртгэл алга'**
  String get healthEmptyState;

  /// No description provided for @healthAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн бүртгэл нэмэх'**
  String get healthAddButton;

  /// No description provided for @healthFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн бүртгэл'**
  String get healthFormTitle;

  /// No description provided for @healthFormTypeLabel.
  ///
  /// In mn, this message translates to:
  /// **'Төрөл'**
  String get healthFormTypeLabel;

  /// No description provided for @healthFormDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Огноо'**
  String get healthFormDateLabel;

  /// No description provided for @healthFormNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get healthFormNotesLabel;

  /// No description provided for @healthFormNotesHint.
  ///
  /// In mn, this message translates to:
  /// **'Эмчилгээний дэлгэрэнгүй мэдээлэл'**
  String get healthFormNotesHint;

  /// No description provided for @healthFormVetLabel.
  ///
  /// In mn, this message translates to:
  /// **'Малын эмч'**
  String get healthFormVetLabel;

  /// No description provided for @healthFormVetHint.
  ///
  /// In mn, this message translates to:
  /// **'Малын эмчийн нэр'**
  String get healthFormVetHint;

  /// No description provided for @healthFormSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн бүртгэлийг хадгаллаа'**
  String get healthFormSaveSuccess;

  /// No description provided for @trainingScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Дасгалжуулалт'**
  String get trainingScreenTitle;

  /// No description provided for @trainingEmptyState.
  ///
  /// In mn, this message translates to:
  /// **'Дасгалжуулалтын бүртгэл алга'**
  String get trainingEmptyState;

  /// No description provided for @trainingAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Дасгал нэмэх'**
  String get trainingAddButton;

  /// No description provided for @trainingFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Дасгал бүртгэх'**
  String get trainingFormTitle;

  /// No description provided for @trainingFormTypeLabel.
  ///
  /// In mn, this message translates to:
  /// **'Дасгалын төрөл'**
  String get trainingFormTypeLabel;

  /// No description provided for @trainingFormDurationLabel.
  ///
  /// In mn, this message translates to:
  /// **'Үргэлжлэх хугацаа (мин)'**
  String get trainingFormDurationLabel;

  /// No description provided for @trainingFormDistanceLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зай (км)'**
  String get trainingFormDistanceLabel;

  /// No description provided for @trainingFormNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get trainingFormNotesLabel;

  /// No description provided for @trainingFormDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Огноо'**
  String get trainingFormDateLabel;

  /// No description provided for @trainingFormSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Дасгалыг амжилттай хадгаллаа'**
  String get trainingFormSaveSuccess;

  /// No description provided for @trainingChartEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Өгөгдөл алга'**
  String get trainingChartEmpty;

  /// No description provided for @trainingChartWeekLabel.
  ///
  /// In mn, this message translates to:
  /// **'7 хоног'**
  String get trainingChartWeekLabel;

  /// No description provided for @marketScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээл'**
  String get marketScreenTitle;

  /// No description provided for @marketSearchHint.
  ///
  /// In mn, this message translates to:
  /// **'Нэр, зүс, байршил, баримт бичгээр хайх...'**
  String get marketSearchHint;

  /// No description provided for @marketActiveListing.
  ///
  /// In mn, this message translates to:
  /// **'Идэвхтэй зарууд'**
  String get marketActiveListing;

  /// No description provided for @marketFilterTitle.
  ///
  /// In mn, this message translates to:
  /// **'Шүүлтүүр'**
  String get marketFilterTitle;

  /// No description provided for @marketFilterSaleType.
  ///
  /// In mn, this message translates to:
  /// **'Зарын төрөл'**
  String get marketFilterSaleType;

  /// No description provided for @marketFilterVerifiedOnly.
  ///
  /// In mn, this message translates to:
  /// **'Зөвхөн баталгаажсан худалдагч'**
  String get marketFilterVerifiedOnly;

  /// No description provided for @marketFilterLocation.
  ///
  /// In mn, this message translates to:
  /// **'Байршил'**
  String get marketFilterLocation;

  /// No description provided for @marketFilterPrice.
  ///
  /// In mn, this message translates to:
  /// **'Үнэ'**
  String get marketFilterPrice;

  /// No description provided for @marketFilterBreed.
  ///
  /// In mn, this message translates to:
  /// **'Үүлдэр'**
  String get marketFilterBreed;

  /// No description provided for @marketFilterSort.
  ///
  /// In mn, this message translates to:
  /// **'Эрэмбэлэх'**
  String get marketFilterSort;

  /// No description provided for @marketFilterSaveSearch.
  ///
  /// In mn, this message translates to:
  /// **'Хайлтыг хадгалах'**
  String get marketFilterSaveSearch;

  /// No description provided for @marketFilterSaveDialogTitle.
  ///
  /// In mn, this message translates to:
  /// **'Хайлтыг хадгалах'**
  String get marketFilterSaveDialogTitle;

  /// No description provided for @marketFilterSaveNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Хайлтын нэр'**
  String get marketFilterSaveNameLabel;

  /// No description provided for @marketFilterSaveNameHint.
  ///
  /// In mn, this message translates to:
  /// **'Жишээ: Хонгор азарга'**
  String get marketFilterSaveNameHint;

  /// No description provided for @marketEmptyTitle.
  ///
  /// In mn, this message translates to:
  /// **'Эхний зараа оруулаарай'**
  String get marketEmptyTitle;

  /// No description provided for @marketEmptyDescription.
  ///
  /// In mn, this message translates to:
  /// **'Зарын жагсаалт хоосон байна.'**
  String get marketEmptyDescription;

  /// No description provided for @marketError.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээлийн мэдээллийг ачаалж чадсангүй'**
  String get marketError;

  /// No description provided for @marketAllLoaded.
  ///
  /// In mn, this message translates to:
  /// **'Бүх зар ачаалагдлаа'**
  String get marketAllLoaded;

  /// No description provided for @marketTooltipFilter.
  ///
  /// In mn, this message translates to:
  /// **'Шүүлтүүр'**
  String get marketTooltipFilter;

  /// No description provided for @marketTooltipViewList.
  ///
  /// In mn, this message translates to:
  /// **'Жагсаалт'**
  String get marketTooltipViewList;

  /// No description provided for @marketTooltipViewGrid.
  ///
  /// In mn, this message translates to:
  /// **'Сүлжээ'**
  String get marketTooltipViewGrid;

  /// No description provided for @marketTooltipLeaderboard.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэгчдийн чансаа'**
  String get marketTooltipLeaderboard;

  /// No description provided for @marketTooltipPriceHistory.
  ///
  /// In mn, this message translates to:
  /// **'Үнийн түүх'**
  String get marketTooltipPriceHistory;

  /// No description provided for @marketTooltipFavorites.
  ///
  /// In mn, this message translates to:
  /// **'Хадгалсан зарууд'**
  String get marketTooltipFavorites;

  /// No description provided for @marketTooltipAddListing.
  ///
  /// In mn, this message translates to:
  /// **'Зар нэмэх'**
  String get marketTooltipAddListing;

  /// No description provided for @marketSaveSearchButton.
  ///
  /// In mn, this message translates to:
  /// **'Хайлтыг хадгалах'**
  String get marketSaveSearchButton;

  /// No description provided for @eventsScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээ'**
  String get eventsScreenTitle;

  /// No description provided for @eventsTabUpcoming.
  ///
  /// In mn, this message translates to:
  /// **'Удахгүй болох'**
  String get eventsTabUpcoming;

  /// No description provided for @eventsTabPast.
  ///
  /// In mn, this message translates to:
  /// **'Өнгөрсөн'**
  String get eventsTabPast;

  /// No description provided for @eventsFilterAll.
  ///
  /// In mn, this message translates to:
  /// **'Бүгд'**
  String get eventsFilterAll;

  /// No description provided for @eventsFilterRace.
  ///
  /// In mn, this message translates to:
  /// **'Уралдаан'**
  String get eventsFilterRace;

  /// No description provided for @eventsFilterTraining.
  ///
  /// In mn, this message translates to:
  /// **'Сургалт'**
  String get eventsFilterTraining;

  /// No description provided for @eventsFilterExhibition.
  ///
  /// In mn, this message translates to:
  /// **'Үзэсгэлэн'**
  String get eventsFilterExhibition;

  /// No description provided for @eventsFilterMeeting.
  ///
  /// In mn, this message translates to:
  /// **'Уулзалт'**
  String get eventsFilterMeeting;

  /// No description provided for @eventsEmptyUpcoming.
  ///
  /// In mn, this message translates to:
  /// **'Удахгүй болох арга хэмжээ алга'**
  String get eventsEmptyUpcoming;

  /// No description provided for @eventsEmptyPast.
  ///
  /// In mn, this message translates to:
  /// **'Өнгөрсөн арга хэмжээ алга'**
  String get eventsEmptyPast;

  /// No description provided for @eventsError.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээг ачаалж чадсангүй'**
  String get eventsError;

  /// No description provided for @eventsAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээ нэмэх'**
  String get eventsAddButton;

  /// No description provided for @lineageScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшил'**
  String get lineageScreenTitle;

  /// No description provided for @lineageEmptyState.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшлын бүртгэл алга'**
  String get lineageEmptyState;

  /// No description provided for @lineageTreeTitle.
  ///
  /// In mn, this message translates to:
  /// **'Удам угшлын мод'**
  String get lineageTreeTitle;

  /// No description provided for @lineageInbreedingTitle.
  ///
  /// In mn, this message translates to:
  /// **'Цус ойртолтын тооцоолуур'**
  String get lineageInbreedingTitle;

  /// No description provided for @lineageLegendTitle.
  ///
  /// In mn, this message translates to:
  /// **'Тайлбар'**
  String get lineageLegendTitle;

  /// No description provided for @lineageLoadMore.
  ///
  /// In mn, this message translates to:
  /// **'Цааш үзэх'**
  String get lineageLoadMore;

  /// No description provided for @breedingScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэг'**
  String get breedingScreenTitle;

  /// No description provided for @breedingAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлгийн бүртгэл нэмэх'**
  String get breedingAddButton;

  /// No description provided for @breedingEmptyState.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлгийн бүртгэл алга'**
  String get breedingEmptyState;

  /// No description provided for @breedingFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэг бүртгэх'**
  String get breedingFormTitle;

  /// No description provided for @breedingFormSireLabel.
  ///
  /// In mn, this message translates to:
  /// **'Азарга'**
  String get breedingFormSireLabel;

  /// No description provided for @breedingFormDamLabel.
  ///
  /// In mn, this message translates to:
  /// **'Гүү'**
  String get breedingFormDamLabel;

  /// No description provided for @breedingFormDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Хээлтүүлсэн огноо'**
  String get breedingFormDateLabel;

  /// No description provided for @breedingFormNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get breedingFormNotesLabel;

  /// No description provided for @breedingFormSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлгийн бүртгэлийг амжилттай хадгаллаа'**
  String get breedingFormSaveSuccess;

  /// No description provided for @foalRegisterTitle.
  ///
  /// In mn, this message translates to:
  /// **'Унага бүртгэх'**
  String get foalRegisterTitle;

  /// No description provided for @foalRegisterNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр'**
  String get foalRegisterNameLabel;

  /// No description provided for @foalRegisterGenderLabel.
  ///
  /// In mn, this message translates to:
  /// **'Хүйс'**
  String get foalRegisterGenderLabel;

  /// No description provided for @foalRegisterBirthDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Төрсөн огноо'**
  String get foalRegisterBirthDateLabel;

  /// No description provided for @foalRegisterCoatLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зүс'**
  String get foalRegisterCoatLabel;

  /// No description provided for @foalRegisterSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Унага амжилттай бүртгэгдлээ'**
  String get foalRegisterSaveSuccess;

  /// No description provided for @coOwnershipTitle.
  ///
  /// In mn, this message translates to:
  /// **'Хамтран эзэмшигчид'**
  String get coOwnershipTitle;

  /// No description provided for @coOwnershipAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Хамтран эзэмшигч нэмэх'**
  String get coOwnershipAddButton;

  /// No description provided for @coOwnershipNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр'**
  String get coOwnershipNameLabel;

  /// No description provided for @coOwnershipPhoneLabel.
  ///
  /// In mn, this message translates to:
  /// **'Утас'**
  String get coOwnershipPhoneLabel;

  /// No description provided for @coOwnershipPercentageLabel.
  ///
  /// In mn, this message translates to:
  /// **'Хувь хэмжээ'**
  String get coOwnershipPercentageLabel;

  /// No description provided for @coOwnershipSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Хамтран эзэмшигчийг хадгаллаа'**
  String get coOwnershipSaveSuccess;

  /// No description provided for @csvImportTitle.
  ///
  /// In mn, this message translates to:
  /// **'CSV файлаас импортлох'**
  String get csvImportTitle;

  /// No description provided for @csvImportFormatHint.
  ///
  /// In mn, this message translates to:
  /// **'CSV файл: нэр, хүйс, зүс, төрсөн он...'**
  String get csvImportFormatHint;

  /// No description provided for @csvImportSelectButton.
  ///
  /// In mn, this message translates to:
  /// **'CSV файл сонгох'**
  String get csvImportSelectButton;

  /// No description provided for @csvImportSuccess.
  ///
  /// In mn, this message translates to:
  /// **'{count} морийг амжилттай импортоллоо'**
  String csvImportSuccess(Object count);

  /// No description provided for @csvImportError.
  ///
  /// In mn, this message translates to:
  /// **'Импорт хийхэд алдаа гарлаа'**
  String get csvImportError;

  /// No description provided for @transferScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морь шилжүүлэх'**
  String get transferScreenTitle;

  /// No description provided for @transferFormNewOwnerLabel.
  ///
  /// In mn, this message translates to:
  /// **'Шинэ эзэмшигчийн нэр'**
  String get transferFormNewOwnerLabel;

  /// No description provided for @transferFormNewOwnerPhoneLabel.
  ///
  /// In mn, this message translates to:
  /// **'Утас'**
  String get transferFormNewOwnerPhoneLabel;

  /// No description provided for @transferFormReasonLabel.
  ///
  /// In mn, this message translates to:
  /// **'Шилжүүлэх шалтгаан'**
  String get transferFormReasonLabel;

  /// No description provided for @transferFormDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Шилжүүлсэн огноо'**
  String get transferFormDateLabel;

  /// No description provided for @transferFormNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get transferFormNotesLabel;

  /// No description provided for @transferConfirmTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морийг шилжүүлэхдээ итгэлтэй байна уу?'**
  String get transferConfirmTitle;

  /// No description provided for @transferSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Морийг амжилттай шилжүүллээ'**
  String get transferSuccess;

  /// No description provided for @stampScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Тамга зурах'**
  String get stampScreenTitle;

  /// No description provided for @stampTooltipDraw.
  ///
  /// In mn, this message translates to:
  /// **'Зурах'**
  String get stampTooltipDraw;

  /// No description provided for @stampTooltipErase.
  ///
  /// In mn, this message translates to:
  /// **'Арилгах'**
  String get stampTooltipErase;

  /// No description provided for @stampTooltipClear.
  ///
  /// In mn, this message translates to:
  /// **'Цэвэрлэх'**
  String get stampTooltipClear;

  /// No description provided for @stampSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Тамгыг амжилттай хадгаллаа'**
  String get stampSaveSuccess;

  /// No description provided for @featureTourHome.
  ///
  /// In mn, this message translates to:
  /// **'Нүүр хуудас'**
  String get featureTourHome;

  /// No description provided for @featureTourHomeTitle.
  ///
  /// In mn, this message translates to:
  /// **'Нүүр хуудас'**
  String get featureTourHomeTitle;

  /// No description provided for @featureTourHomeDesc.
  ///
  /// In mn, this message translates to:
  /// **'Адууныхаа удам угшлыг харж, удам угшлын мод үүсгээрэй.'**
  String get featureTourHomeDesc;

  /// No description provided for @featureTourProfile.
  ///
  /// In mn, this message translates to:
  /// **'Профайл'**
  String get featureTourProfile;

  /// No description provided for @featureTourProfileTitle.
  ///
  /// In mn, this message translates to:
  /// **'Профайл'**
  String get featureTourProfileTitle;

  /// No description provided for @featureTourProfileDesc.
  ///
  /// In mn, this message translates to:
  /// **'Өөрийн болон өрхийн адууны бүртгэл, мэдээлэл, удам угшил.'**
  String get featureTourProfileDesc;

  /// No description provided for @featureTourSearch.
  ///
  /// In mn, this message translates to:
  /// **'Морь хайх'**
  String get featureTourSearch;

  /// No description provided for @featureTourSearchTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морь хайх'**
  String get featureTourSearchTitle;

  /// No description provided for @featureTourSearchDesc.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон морийг хайж, мэдээлээрэй. Дээд зэрэглэлийн багц ашиглах боломжтой.'**
  String get featureTourSearchDesc;

  /// No description provided for @featureTourMarket.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээл'**
  String get featureTourMarket;

  /// No description provided for @featureTourMarketTitle.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээл'**
  String get featureTourMarketTitle;

  /// No description provided for @featureTourMarketDesc.
  ///
  /// In mn, this message translates to:
  /// **'Морь худалдах, худалдан авах найдвартай зах.'**
  String get featureTourMarketDesc;

  /// No description provided for @featureTourEvents.
  ///
  /// In mn, this message translates to:
  /// **'Уралдаан'**
  String get featureTourEvents;

  /// No description provided for @featureTourEventsTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдаан'**
  String get featureTourEventsTitle;

  /// No description provided for @featureTourEventsDesc.
  ///
  /// In mn, this message translates to:
  /// **'Уралдаан, шагнал, амжилтаа бүртгээрэй.'**
  String get featureTourEventsDesc;

  /// No description provided for @featureTourSkip.
  ///
  /// In mn, this message translates to:
  /// **'Алгасах'**
  String get featureTourSkip;

  /// No description provided for @featureTourNext.
  ///
  /// In mn, this message translates to:
  /// **'Дараах'**
  String get featureTourNext;

  /// No description provided for @featureTourFinish.
  ///
  /// In mn, this message translates to:
  /// **'Эхлэх'**
  String get featureTourFinish;

  /// No description provided for @onboardingRegionTitle.
  ///
  /// In mn, this message translates to:
  /// **'Нутаг дэвсгэрээ сонгох'**
  String get onboardingRegionTitle;

  /// No description provided for @onboardingRegionSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Таны адууны нутаг дэвсгэр'**
  String get onboardingRegionSubtitle;

  /// No description provided for @onboardingRegionHint.
  ///
  /// In mn, this message translates to:
  /// **'Нутаг дэвсгэр хайх...'**
  String get onboardingRegionHint;

  /// No description provided for @onboardingRankTitle.
  ///
  /// In mn, this message translates to:
  /// **'Зэрэглэлээ сонгох'**
  String get onboardingRankTitle;

  /// No description provided for @onboardingRankSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Танд тохирох багцыг сонгоно уу'**
  String get onboardingRankSubtitle;

  /// No description provided for @onboardingProfileTitle.
  ///
  /// In mn, this message translates to:
  /// **'Профайл үүсгэх'**
  String get onboardingProfileTitle;

  /// No description provided for @onboardingHorseTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морио бүртгэх'**
  String get onboardingHorseTitle;

  /// No description provided for @onboardingHorseSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Анхны морио бүртгэнэ үү'**
  String get onboardingHorseSubtitle;

  /// No description provided for @onboardingPhotoUpload.
  ///
  /// In mn, this message translates to:
  /// **'Зураг оруулах'**
  String get onboardingPhotoUpload;

  /// No description provided for @onboardingGenderMale.
  ///
  /// In mn, this message translates to:
  /// **'Эр'**
  String get onboardingGenderMale;

  /// No description provided for @onboardingGenderFemale.
  ///
  /// In mn, this message translates to:
  /// **'Эм'**
  String get onboardingGenderFemale;

  /// No description provided for @onboardingBreedTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үүлдэр сонгох'**
  String get onboardingBreedTitle;

  /// No description provided for @onboardingCoatTitle.
  ///
  /// In mn, this message translates to:
  /// **'Зүс сонгох'**
  String get onboardingCoatTitle;

  /// No description provided for @onboardingNotificationTitle.
  ///
  /// In mn, this message translates to:
  /// **'Мэдэгдэл'**
  String get onboardingNotificationTitle;

  /// No description provided for @onboardingNotificationSubtitle.
  ///
  /// In mn, this message translates to:
  /// **'Мэдэгдлийн тохиргоо'**
  String get onboardingNotificationSubtitle;

  /// No description provided for @onboardingNotificationDesc.
  ///
  /// In mn, this message translates to:
  /// **'Чухал мэдээлэл, сануулга, шинэчлэлтийг хүлээн аваарай.'**
  String get onboardingNotificationDesc;

  /// No description provided for @onboardingNotificationBenefit1.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны сануулга'**
  String get onboardingNotificationBenefit1;

  /// No description provided for @onboardingNotificationBenefit2.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн сануулга'**
  String get onboardingNotificationBenefit2;

  /// No description provided for @onboardingNotificationBenefit3.
  ///
  /// In mn, this message translates to:
  /// **'Захиалгын баталгаажуулалт'**
  String get onboardingNotificationBenefit3;

  /// No description provided for @onboardingPageIndicator.
  ///
  /// In mn, this message translates to:
  /// **'{current}/{total}'**
  String onboardingPageIndicator(Object current, Object total);

  /// No description provided for @syncSettingsTitle.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлолын тохиргоо'**
  String get syncSettingsTitle;

  /// No description provided for @syncSettingsAutoSync.
  ///
  /// In mn, this message translates to:
  /// **'Автомат синхрончлол'**
  String get syncSettingsAutoSync;

  /// No description provided for @syncSettingsAutoSyncDesc.
  ///
  /// In mn, this message translates to:
  /// **'Сүлжээнд холбогдсон үед автоматаар синхрончлох'**
  String get syncSettingsAutoSyncDesc;

  /// No description provided for @syncSettingsSyncNow.
  ///
  /// In mn, this message translates to:
  /// **'Одоо синхрончлох'**
  String get syncSettingsSyncNow;

  /// No description provided for @syncSettingsClearData.
  ///
  /// In mn, this message translates to:
  /// **'Локал өгөгдөл цэвэрлэх'**
  String get syncSettingsClearData;

  /// No description provided for @syncSettingsClearConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Локал өгөгдлийг цэвэрлэхдээ итгэлтэй байна уу?'**
  String get syncSettingsClearConfirm;

  /// No description provided for @syncQueueTitle.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлолын дараалал'**
  String get syncQueueTitle;

  /// No description provided for @syncQueueEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончлохыг хүлээж буй зүйл алга'**
  String get syncQueueEmpty;

  /// No description provided for @syncQueueStatusPending.
  ///
  /// In mn, this message translates to:
  /// **'Хүлээгдэж буй'**
  String get syncQueueStatusPending;

  /// No description provided for @syncQueueStatusSyncing.
  ///
  /// In mn, this message translates to:
  /// **'Синхрончилж байна'**
  String get syncQueueStatusSyncing;

  /// No description provided for @syncQueueStatusFailed.
  ///
  /// In mn, this message translates to:
  /// **'Амжилтгүй'**
  String get syncQueueStatusFailed;

  /// No description provided for @conflictTitle.
  ///
  /// In mn, this message translates to:
  /// **'Зөрчлийг шийдвэрлэх'**
  String get conflictTitle;

  /// No description provided for @conflictLocalVersion.
  ///
  /// In mn, this message translates to:
  /// **'Локал хувилбар'**
  String get conflictLocalVersion;

  /// No description provided for @conflictRemoteVersion.
  ///
  /// In mn, this message translates to:
  /// **'Серверийн хувилбар'**
  String get conflictRemoteVersion;

  /// No description provided for @conflictKeepLocal.
  ///
  /// In mn, this message translates to:
  /// **'Локал хувилбарыг хадгалах'**
  String get conflictKeepLocal;

  /// No description provided for @conflictKeepRemote.
  ///
  /// In mn, this message translates to:
  /// **'Серверийн хувилбарыг хадгалах'**
  String get conflictKeepRemote;

  /// No description provided for @notificationPrefTitle.
  ///
  /// In mn, this message translates to:
  /// **'Мэдэгдлийн тохиргоо'**
  String get notificationPrefTitle;

  /// No description provided for @notificationPrefPush.
  ///
  /// In mn, this message translates to:
  /// **'Түлхэх мэдэгдэл'**
  String get notificationPrefPush;

  /// No description provided for @notificationPrefEmail.
  ///
  /// In mn, this message translates to:
  /// **'Имэйл мэдэгдэл'**
  String get notificationPrefEmail;

  /// No description provided for @notificationPrefSms.
  ///
  /// In mn, this message translates to:
  /// **'SMS мэдэгдэл'**
  String get notificationPrefSms;

  /// No description provided for @notificationPrefEvents.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээний мэдэгдэл'**
  String get notificationPrefEvents;

  /// No description provided for @notificationPrefHealth.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн сануулга'**
  String get notificationPrefHealth;

  /// No description provided for @notificationPrefMarket.
  ///
  /// In mn, this message translates to:
  /// **'Зах зээлийн мэдэгдэл'**
  String get notificationPrefMarket;

  /// No description provided for @notificationPrefSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Мэдэгдлийн тохиргоог хадгаллаа'**
  String get notificationPrefSaveSuccess;

  /// No description provided for @teamTitle.
  ///
  /// In mn, this message translates to:
  /// **'Багийн удирдлага'**
  String get teamTitle;

  /// No description provided for @teamMemberCount.
  ///
  /// In mn, this message translates to:
  /// **'{count} гишүүн'**
  String teamMemberCount(Object count);

  /// No description provided for @teamInviteButton.
  ///
  /// In mn, this message translates to:
  /// **'Гишүүн урих'**
  String get teamInviteButton;

  /// No description provided for @teamInviteTitle.
  ///
  /// In mn, this message translates to:
  /// **'Гишүүн урих'**
  String get teamInviteTitle;

  /// No description provided for @teamInviteNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр'**
  String get teamInviteNameLabel;

  /// No description provided for @teamInvitePhoneLabel.
  ///
  /// In mn, this message translates to:
  /// **'Утас'**
  String get teamInvitePhoneLabel;

  /// No description provided for @teamInviteRoleLabel.
  ///
  /// In mn, this message translates to:
  /// **'Үүрэг'**
  String get teamInviteRoleLabel;

  /// No description provided for @teamInviteSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Урилгыг амжилттай илгээлээ'**
  String get teamInviteSuccess;

  /// No description provided for @teamInvitePending.
  ///
  /// In mn, this message translates to:
  /// **'Хүлээгдэж буй урилгууд'**
  String get teamInvitePending;

  /// No description provided for @teamInvitationsTitle.
  ///
  /// In mn, this message translates to:
  /// **'Урилгууд'**
  String get teamInvitationsTitle;

  /// No description provided for @teamInvitationsEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Урилга алга'**
  String get teamInvitationsEmpty;

  /// No description provided for @teamLeaveButton.
  ///
  /// In mn, this message translates to:
  /// **'Багаас гарах'**
  String get teamLeaveButton;

  /// No description provided for @teamMemberRemove.
  ///
  /// In mn, this message translates to:
  /// **'Гишүүнийг хасах'**
  String get teamMemberRemove;

  /// No description provided for @teamMemberRemoveConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Энэ гишүүнийг хасахдаа итгэлтэй байна уу?'**
  String get teamMemberRemoveConfirm;

  /// No description provided for @stableTitle.
  ///
  /// In mn, this message translates to:
  /// **'Жүчээ'**
  String get stableTitle;

  /// No description provided for @stableTabInfo.
  ///
  /// In mn, this message translates to:
  /// **'Мэдээлэл'**
  String get stableTabInfo;

  /// No description provided for @stableTabMembers.
  ///
  /// In mn, this message translates to:
  /// **'Гишүүд'**
  String get stableTabMembers;

  /// No description provided for @stableTabHorses.
  ///
  /// In mn, this message translates to:
  /// **'Морьд'**
  String get stableTabHorses;

  /// No description provided for @stableEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Жүчээний мэдээлэл алга'**
  String get stableEmpty;

  /// No description provided for @vetConnectTitle.
  ///
  /// In mn, this message translates to:
  /// **'Малын эмч'**
  String get vetConnectTitle;

  /// No description provided for @vetSpecializationAll.
  ///
  /// In mn, this message translates to:
  /// **'Бүгд'**
  String get vetSpecializationAll;

  /// No description provided for @vetBookingTitle.
  ///
  /// In mn, this message translates to:
  /// **'Цаг захиалах'**
  String get vetBookingTitle;

  /// No description provided for @vetBookingNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр'**
  String get vetBookingNameLabel;

  /// No description provided for @vetBookingPhoneLabel.
  ///
  /// In mn, this message translates to:
  /// **'Утас'**
  String get vetBookingPhoneLabel;

  /// No description provided for @vetBookingDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Огноо'**
  String get vetBookingDateLabel;

  /// No description provided for @vetBookingServiceLabel.
  ///
  /// In mn, this message translates to:
  /// **'Үйлчилгээний төрөл'**
  String get vetBookingServiceLabel;

  /// No description provided for @vetBookingNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get vetBookingNotesLabel;

  /// No description provided for @vetBookingSubmit.
  ///
  /// In mn, this message translates to:
  /// **'Захиалах'**
  String get vetBookingSubmit;

  /// No description provided for @vetBookingSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Үзлэгийн цагийг амжилттай захиаллаа'**
  String get vetBookingSuccess;

  /// No description provided for @providerDashboardTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үйлчилгээ үзүүлэгчийн самбар'**
  String get providerDashboardTitle;

  /// No description provided for @providerDashboardToday.
  ///
  /// In mn, this message translates to:
  /// **'Өнөөдрийн захиалгууд'**
  String get providerDashboardToday;

  /// No description provided for @providerDashboardPending.
  ///
  /// In mn, this message translates to:
  /// **'Хүлээгдэж буй'**
  String get providerDashboardPending;

  /// No description provided for @providerDashboardCompleted.
  ///
  /// In mn, this message translates to:
  /// **'Дууссан'**
  String get providerDashboardCompleted;

  /// No description provided for @nutritionFeedLogTitle.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн бүртгэл'**
  String get nutritionFeedLogTitle;

  /// No description provided for @nutritionFeedScheduleTitle.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн хуваарь'**
  String get nutritionFeedScheduleTitle;

  /// No description provided for @nutritionFeedEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн бүртгэл алга'**
  String get nutritionFeedEmpty;

  /// No description provided for @nutritionFeedTypeLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн төрөл'**
  String get nutritionFeedTypeLabel;

  /// No description provided for @nutritionFeedAmountLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн хэмжээ'**
  String get nutritionFeedAmountLabel;

  /// No description provided for @nutritionFeedTimeLabel.
  ///
  /// In mn, this message translates to:
  /// **'Цаг'**
  String get nutritionFeedTimeLabel;

  /// No description provided for @nutritionFeedSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Тэжээлийн бүртгэлийг хадгаллаа'**
  String get nutritionFeedSaveSuccess;

  /// No description provided for @socialBreederProfileTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэгчийн профайл'**
  String get socialBreederProfileTitle;

  /// No description provided for @socialLeaderboardTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлэгчдийн чансаа'**
  String get socialLeaderboardTitle;

  /// No description provided for @socialLeaderboardFilterAll.
  ///
  /// In mn, this message translates to:
  /// **'Бүгд'**
  String get socialLeaderboardFilterAll;

  /// No description provided for @socialLeaderboardFilterMonthly.
  ///
  /// In mn, this message translates to:
  /// **'Энэ сар'**
  String get socialLeaderboardFilterMonthly;

  /// No description provided for @socialLeaderboardFilterYearly.
  ///
  /// In mn, this message translates to:
  /// **'Энэ жил'**
  String get socialLeaderboardFilterYearly;

  /// No description provided for @paymentSubscriptionTitle.
  ///
  /// In mn, this message translates to:
  /// **'Захиалгын багц'**
  String get paymentSubscriptionTitle;

  /// No description provided for @paymentPrice.
  ///
  /// In mn, this message translates to:
  /// **'Үнэ'**
  String get paymentPrice;

  /// No description provided for @paymentDuration.
  ///
  /// In mn, this message translates to:
  /// **'Хугацаа'**
  String get paymentDuration;

  /// No description provided for @paymentSubscribe.
  ///
  /// In mn, this message translates to:
  /// **'Захиалах'**
  String get paymentSubscribe;

  /// No description provided for @paymentCurrentPlan.
  ///
  /// In mn, this message translates to:
  /// **'Одоогийн багц'**
  String get paymentCurrentPlan;

  /// No description provided for @paymentUpgrade.
  ///
  /// In mn, this message translates to:
  /// **'Багц шинэчлэх'**
  String get paymentUpgrade;

  /// No description provided for @certificateTitle.
  ///
  /// In mn, this message translates to:
  /// **'Гэрчилгээ'**
  String get certificateTitle;

  /// No description provided for @certificateVerifyTitle.
  ///
  /// In mn, this message translates to:
  /// **'Гэрчилгээ баталгаажуулах'**
  String get certificateVerifyTitle;

  /// No description provided for @certificateIssuer.
  ///
  /// In mn, this message translates to:
  /// **'Олгосон байгууллага'**
  String get certificateIssuer;

  /// No description provided for @certificateStatus.
  ///
  /// In mn, this message translates to:
  /// **'Төлөв'**
  String get certificateStatus;

  /// No description provided for @certificateHash.
  ///
  /// In mn, this message translates to:
  /// **'Хэш утга'**
  String get certificateHash;

  /// No description provided for @documentTitle.
  ///
  /// In mn, this message translates to:
  /// **'Баримт бичиг'**
  String get documentTitle;

  /// No description provided for @documentUploadSheet.
  ///
  /// In mn, this message translates to:
  /// **'Баримт бичиг оруулах'**
  String get documentUploadSheet;

  /// No description provided for @documentUploadSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Баримт бичгийг амжилттай хадгаллаа'**
  String get documentUploadSuccess;

  /// No description provided for @documentEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Баримт бичиг алга'**
  String get documentEmpty;

  /// No description provided for @documentDeleteConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Энэ баримт бичгийг устгахдаа итгэлтэй байна уу?'**
  String get documentDeleteConfirm;

  /// No description provided for @analyticsScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Шинжилгээ'**
  String get analyticsScreenTitle;

  /// No description provided for @analyticsHerdStats.
  ///
  /// In mn, this message translates to:
  /// **'Сүргийн үзүүлэлт'**
  String get analyticsHerdStats;

  /// No description provided for @analyticsHealthStats.
  ///
  /// In mn, this message translates to:
  /// **'Эрүүл мэндийн үзүүлэлт'**
  String get analyticsHealthStats;

  /// No description provided for @analyticsFinancialStats.
  ///
  /// In mn, this message translates to:
  /// **'Санхүүгийн үзүүлэлт'**
  String get analyticsFinancialStats;

  /// No description provided for @analyticsExportButton.
  ///
  /// In mn, this message translates to:
  /// **'Экспортлох'**
  String get analyticsExportButton;

  /// No description provided for @breedingAdviceTitle.
  ///
  /// In mn, this message translates to:
  /// **'Үржүүлгийн зөвлөмж'**
  String get breedingAdviceTitle;

  /// No description provided for @breedingAdviceScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'AI үржүүлгийн зөвлөмж'**
  String get breedingAdviceScreenTitle;

  /// No description provided for @mapScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Газрын зураг'**
  String get mapScreenTitle;

  /// No description provided for @mapSightingReportTitle.
  ///
  /// In mn, this message translates to:
  /// **'Харсан морийг мэдээлэх'**
  String get mapSightingReportTitle;

  /// No description provided for @mapSightingFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Харсан морины мэдээлэл'**
  String get mapSightingFormTitle;

  /// No description provided for @mapSightingDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Харсан огноо'**
  String get mapSightingDateLabel;

  /// No description provided for @mapSightingLocationLabel.
  ///
  /// In mn, this message translates to:
  /// **'Байршил'**
  String get mapSightingLocationLabel;

  /// No description provided for @mapSightingPhotoLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зураг'**
  String get mapSightingPhotoLabel;

  /// No description provided for @mapSightingNotesLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get mapSightingNotesLabel;

  /// No description provided for @mapSightingSubmit.
  ///
  /// In mn, this message translates to:
  /// **'Мэдээлэх'**
  String get mapSightingSubmit;

  /// No description provided for @mapSightingSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Харсан морины мэдээллийг амжилттай бүртгэлээ'**
  String get mapSightingSuccess;

  /// No description provided for @mapLostHorseTitle.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон морь'**
  String get mapLostHorseTitle;

  /// No description provided for @mapLostHorseReportTitle.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон морийг мэдээлэх'**
  String get mapLostHorseReportTitle;

  /// No description provided for @mapLostHorseFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон морины мэдээлэл'**
  String get mapLostHorseFormTitle;

  /// No description provided for @mapLostHorseContactSection.
  ///
  /// In mn, this message translates to:
  /// **'Холбоо барих мэдээлэл'**
  String get mapLostHorseContactSection;

  /// No description provided for @mapLostHorseRewardLabel.
  ///
  /// In mn, this message translates to:
  /// **'Шагналын хэмжээ'**
  String get mapLostHorseRewardLabel;

  /// No description provided for @mapLostHorseSubmit.
  ///
  /// In mn, this message translates to:
  /// **'Мэдээлэх'**
  String get mapLostHorseSubmit;

  /// No description provided for @mapLostHorseSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон морины мэдээллийг амжилттай бүртгэлээ'**
  String get mapLostHorseSuccess;

  /// No description provided for @mapGeofenceTitle.
  ///
  /// In mn, this message translates to:
  /// **'Гео-бүс'**
  String get mapGeofenceTitle;

  /// No description provided for @mapGeofenceSetupTitle.
  ///
  /// In mn, this message translates to:
  /// **'Гео-бүс тохируулах'**
  String get mapGeofenceSetupTitle;

  /// No description provided for @mapGeofenceRadiusLabel.
  ///
  /// In mn, this message translates to:
  /// **'Радиус'**
  String get mapGeofenceRadiusLabel;

  /// No description provided for @mapHerdTrackingTitle.
  ///
  /// In mn, this message translates to:
  /// **'Сүргийн байршлын хяналт'**
  String get mapHerdTrackingTitle;

  /// No description provided for @mapHerdTrackingEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Сүргийн хяналтын мэдээлэл алга'**
  String get mapHerdTrackingEmpty;

  /// No description provided for @mapNearbyHorsesTitle.
  ///
  /// In mn, this message translates to:
  /// **'Ойролцоох морьд'**
  String get mapNearbyHorsesTitle;

  /// No description provided for @mapActiveReportsTitle.
  ///
  /// In mn, this message translates to:
  /// **'Идэвхтэй мэдээллүүд'**
  String get mapActiveReportsTitle;

  /// No description provided for @mapPastureTitle.
  ///
  /// In mn, this message translates to:
  /// **'Бэлчээрийн менежмент'**
  String get mapPastureTitle;

  /// No description provided for @mapPastureEmpty.
  ///
  /// In mn, this message translates to:
  /// **'Бэлчээр бүртгэгдээгүй байна'**
  String get mapPastureEmpty;

  /// No description provided for @mapPastureAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Бэлчээр нэмэх'**
  String get mapPastureAddButton;

  /// No description provided for @mapPastureNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Нэр'**
  String get mapPastureNameLabel;

  /// No description provided for @mapPastureAreaLabel.
  ///
  /// In mn, this message translates to:
  /// **'Талбай (га)'**
  String get mapPastureAreaLabel;

  /// No description provided for @mapPastureSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Бэлчээрийг амжилттай хадгаллаа'**
  String get mapPastureSaveSuccess;

  /// No description provided for @mapPastureDeleteConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Энэ бэлчээрийг устгахдаа итгэлтэй байна уу?'**
  String get mapPastureDeleteConfirm;

  /// No description provided for @eventDetailTitle.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээний дэлгэрэнгүй'**
  String get eventDetailTitle;

  /// No description provided for @eventDetailRegistration.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэл'**
  String get eventDetailRegistration;

  /// No description provided for @eventDetailContactOrganizer.
  ///
  /// In mn, this message translates to:
  /// **'Зохион байгуулагчтай холбогдох'**
  String get eventDetailContactOrganizer;

  /// No description provided for @eventDetailNotes.
  ///
  /// In mn, this message translates to:
  /// **'Тэмдэглэл'**
  String get eventDetailNotes;

  /// No description provided for @eventDetailReminder.
  ///
  /// In mn, this message translates to:
  /// **'Сануулга'**
  String get eventDetailReminder;

  /// No description provided for @eventFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээ үүсгэх'**
  String get eventFormTitle;

  /// No description provided for @eventFormNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээний нэр'**
  String get eventFormNameLabel;

  /// No description provided for @eventFormDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Огноо'**
  String get eventFormDateLabel;

  /// No description provided for @eventFormLocationLabel.
  ///
  /// In mn, this message translates to:
  /// **'Байршил'**
  String get eventFormLocationLabel;

  /// No description provided for @eventFormTypeLabel.
  ///
  /// In mn, this message translates to:
  /// **'Төрөл'**
  String get eventFormTypeLabel;

  /// No description provided for @eventFormDescriptionLabel.
  ///
  /// In mn, this message translates to:
  /// **'Тайлбар'**
  String get eventFormDescriptionLabel;

  /// No description provided for @eventFormPhotoLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зураг'**
  String get eventFormPhotoLabel;

  /// No description provided for @eventFormSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Арга хэмжээг амжилттай хадгаллаа'**
  String get eventFormSaveSuccess;

  /// No description provided for @eventFormDeleteConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Энэ арга хэмжээг устгахдаа итгэлтэй байна уу?'**
  String get eventFormDeleteConfirm;

  /// No description provided for @apiSettingsTitle.
  ///
  /// In mn, this message translates to:
  /// **'API тохиргоо'**
  String get apiSettingsTitle;

  /// No description provided for @apiKeyNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Түлхүүрийн нэр'**
  String get apiKeyNameLabel;

  /// No description provided for @apiKeyCreateButton.
  ///
  /// In mn, this message translates to:
  /// **'API түлхүүр үүсгэх'**
  String get apiKeyCreateButton;

  /// No description provided for @apiKeyDeleteConfirm.
  ///
  /// In mn, this message translates to:
  /// **'Энэ API түлхүүрийг устгахдаа итгэлтэй байна уу?'**
  String get apiKeyDeleteConfirm;

  /// No description provided for @apiKeyCopied.
  ///
  /// In mn, this message translates to:
  /// **'API түлхүүрийг хууллаа'**
  String get apiKeyCopied;

  /// No description provided for @partnerDashboardTitle.
  ///
  /// In mn, this message translates to:
  /// **'Түншийн самбар'**
  String get partnerDashboardTitle;

  /// No description provided for @partnerDashboardUpcomingEvents.
  ///
  /// In mn, this message translates to:
  /// **'Удахгүй болох арга хэмжээнүүд'**
  String get partnerDashboardUpcomingEvents;

  /// No description provided for @partnerDashboardRevenue.
  ///
  /// In mn, this message translates to:
  /// **'Орлого'**
  String get partnerDashboardRevenue;

  /// No description provided for @partnerDashboardRegistrations.
  ///
  /// In mn, this message translates to:
  /// **'Бүртгэлүүд'**
  String get partnerDashboardRegistrations;

  /// No description provided for @raceListTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны жагсаалт'**
  String get raceListTitle;

  /// No description provided for @raceAddButton.
  ///
  /// In mn, this message translates to:
  /// **'Уралдаан нэмэх'**
  String get raceAddButton;

  /// No description provided for @raceFormTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдаан бүртгэх'**
  String get raceFormTitle;

  /// No description provided for @raceFormNameLabel.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны нэр'**
  String get raceFormNameLabel;

  /// No description provided for @raceFormDateLabel.
  ///
  /// In mn, this message translates to:
  /// **'Огноо'**
  String get raceFormDateLabel;

  /// No description provided for @raceFormDistanceLabel.
  ///
  /// In mn, this message translates to:
  /// **'Зай'**
  String get raceFormDistanceLabel;

  /// No description provided for @raceFormLocationLabel.
  ///
  /// In mn, this message translates to:
  /// **'Байршил'**
  String get raceFormLocationLabel;

  /// No description provided for @raceFormSaveSuccess.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааныг амжилттай хадгаллаа'**
  String get raceFormSaveSuccess;

  /// No description provided for @raceDetailTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны мэдээлэл'**
  String get raceDetailTitle;

  /// No description provided for @raceResultsEditorTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны үр дүнг засах'**
  String get raceResultsEditorTitle;

  /// No description provided for @raceVideoTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны бичлэг'**
  String get raceVideoTitle;

  /// No description provided for @raceVideoListTitle.
  ///
  /// In mn, this message translates to:
  /// **'Уралдааны бичлэгүүд'**
  String get raceVideoListTitle;

  /// No description provided for @lostHorseFinderTitle.
  ///
  /// In mn, this message translates to:
  /// **'Морь хайх'**
  String get lostHorseFinderTitle;

  /// No description provided for @lostHorseFinderScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон морь хайх'**
  String get lostHorseFinderScreenTitle;

  /// No description provided for @searchScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Хайлт'**
  String get searchScreenTitle;

  /// No description provided for @searchHint.
  ///
  /// In mn, this message translates to:
  /// **'Морь, хэрэглэгч, арга хэмжээ хайх...'**
  String get searchHint;

  /// No description provided for @updateOverlayTitle.
  ///
  /// In mn, this message translates to:
  /// **'Шинэчлэлт'**
  String get updateOverlayTitle;

  /// No description provided for @updateAvailable.
  ///
  /// In mn, this message translates to:
  /// **'Шинэ хувилбар байна'**
  String get updateAvailable;

  /// No description provided for @updateDownloadButton.
  ///
  /// In mn, this message translates to:
  /// **'Татаж авах'**
  String get updateDownloadButton;

  /// No description provided for @updateLaterButton.
  ///
  /// In mn, this message translates to:
  /// **'Дараа'**
  String get updateLaterButton;

  /// No description provided for @devScreenTitle.
  ///
  /// In mn, this message translates to:
  /// **'Хөгжүүлэгчийн хэрэгслүүд'**
  String get devScreenTitle;

  /// No description provided for @devFeatureFlags.
  ///
  /// In mn, this message translates to:
  /// **'Функцийн төлөвүүд'**
  String get devFeatureFlags;

  /// No description provided for @devCategoryGeneral.
  ///
  /// In mn, this message translates to:
  /// **'Ерөнхий'**
  String get devCategoryGeneral;

  /// No description provided for @devCategoryAnalytics.
  ///
  /// In mn, this message translates to:
  /// **'Шинжилгээ'**
  String get devCategoryAnalytics;

  /// No description provided for @devCategoryPremium.
  ///
  /// In mn, this message translates to:
  /// **'Дээд зэрэглэл'**
  String get devCategoryPremium;

  /// No description provided for @devResetButton.
  ///
  /// In mn, this message translates to:
  /// **'Тохиргоог анхны байдалд оруулах'**
  String get devResetButton;

  /// No description provided for @comboboxSearchHint.
  ///
  /// In mn, this message translates to:
  /// **'Хайх...'**
  String get comboboxSearchHint;

  /// No description provided for @comboboxEmptyText.
  ///
  /// In mn, this message translates to:
  /// **'Үр дүн олдсонгүй'**
  String get comboboxEmptyText;

  /// No description provided for @comboboxAddNew.
  ///
  /// In mn, this message translates to:
  /// **'Шинээр нэмэх'**
  String get comboboxAddNew;

  /// No description provided for @searchBarHint.
  ///
  /// In mn, this message translates to:
  /// **'Хайх...'**
  String get searchBarHint;

  /// No description provided for @confirmDialogCancel.
  ///
  /// In mn, this message translates to:
  /// **'Цуцлах'**
  String get confirmDialogCancel;

  /// No description provided for @statusChipAlive.
  ///
  /// In mn, this message translates to:
  /// **'Амьд'**
  String get statusChipAlive;

  /// No description provided for @statusChipDeceased.
  ///
  /// In mn, this message translates to:
  /// **'Нас барсан'**
  String get statusChipDeceased;

  /// No description provided for @statusChipSold.
  ///
  /// In mn, this message translates to:
  /// **'Зарагдсан'**
  String get statusChipSold;

  /// No description provided for @statusChipTransferred.
  ///
  /// In mn, this message translates to:
  /// **'Шилжүүлсэн'**
  String get statusChipTransferred;

  /// No description provided for @statusChipLost.
  ///
  /// In mn, this message translates to:
  /// **'Алга болсон'**
  String get statusChipLost;

  /// No description provided for @statusChipStolen.
  ///
  /// In mn, this message translates to:
  /// **'Хулгайд алдагдсан'**
  String get statusChipStolen;

  /// No description provided for @statusChipReturned.
  ///
  /// In mn, this message translates to:
  /// **'Эргэж ирсэн'**
  String get statusChipReturned;

  /// No description provided for @statusChipUnknown.
  ///
  /// In mn, this message translates to:
  /// **'Тодорхойгүй'**
  String get statusChipUnknown;

  /// No description provided for @offlineSaveFeedback.
  ///
  /// In mn, this message translates to:
  /// **'Сүлжээгүй үед өгөгдлийг төхөөрөмж дээр хадгална'**
  String get offlineSaveFeedback;

  /// No description provided for @offlineSaveQueued.
  ///
  /// In mn, this message translates to:
  /// **'Сүлжээнд холбогдмогц автоматаар синхрончилно'**
  String get offlineSaveQueued;

  /// No description provided for @subscriptionGateLimitReached.
  ///
  /// In mn, this message translates to:
  /// **'Таны ашиглах хязгаар дууссан байна'**
  String get subscriptionGateLimitReached;

  /// No description provided for @subscriptionGateUpgradeRequired.
  ///
  /// In mn, this message translates to:
  /// **'Энэ функцийг ашиглахын тулд багцаа шинэчилнэ үү'**
  String get subscriptionGateUpgradeRequired;

  /// No description provided for @lineageFitToScreen.
  ///
  /// In mn, this message translates to:
  /// **'Дэлгэцэд тааруулах'**
  String get lineageFitToScreen;

  /// No description provided for @lineageBadgeHousehold.
  ///
  /// In mn, this message translates to:
  /// **'Өрхийн'**
  String get lineageBadgeHousehold;

  /// No description provided for @lineageBadgeExternal.
  ///
  /// In mn, this message translates to:
  /// **'Гаднын'**
  String get lineageBadgeExternal;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'mn'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'mn':
      return AppLocalizationsMn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
