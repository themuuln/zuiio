import 'dart:async';
import 'dart:collection';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../../../app/supabase_bootstrap.dart';
import '../domain/herd_tracking_status.dart';
import '../domain/horse_location.dart';
import 'geofence_service.dart';
import 'location_service.dart';
import 'map_repository.dart';
import '../application/geofence_providers.dart';
import '../application/map_providers.dart';

/// GPS мөрдөх нэгжийн дотоод төлөв — нэг морийн эцсийн мэдээлэл.
class _TrackedHorse {
  _TrackedHorse({required this.horseId});

  final String horseId;
  double? lastLat;
  double? lastLng;
  DateTime? lastUpdated;
}

/// Мал сүрэгийн GPS мөрдөх үйлчилгээ — нэг эсвэл хэд хэдэн морийг
/// зэрэг мөрдөх, зай мөрдөх горимыг тохируулах.
///
/// Нөхцөл байдал:
/// - Хөдөлж байгаа бол 5 минут тутам
/// - Зогссон бол 15 минут тутам
/// - Бэлчээрт байгаа бол 30 минут тутам
/// - Батарей < 20% бол 30 минут тутам
/// - Офлайн бол Queue-д хадгалж, шалтгаантай үед илгээнэ
class HerdTrackingService {
  HerdTrackingService({
    required this.locationService,
    required this.geofenceService,
    required this.mapRepository,
  });

  /// Хөдөлж байгаа үед шинэчлэх хугацаа (секунд).
  static const int movingIntervalSeconds = 300; // 5 минут

  /// Зогссон үед шинэчлэх хугацаа (секунд).
  static const int stationaryIntervalSeconds = 900; // 15 минут

  /// Бэлчээрт байгаа үед шинэчлэх хугацаа (секунд).
  static const int inGeofenceIntervalSeconds = 1800; // 30 минут

  /// Батарей бага үед шинэчлэх хугацаа (секунд).
  static const int lowBatteryIntervalSeconds = 1800; // 30 минут

  /// Хэт их хөдөлгөөн илрүүлэх хязгаар (метр/секунд).
  static const double movementThresholdMps = 1.0;

  /// Батарей бага хязгаар (хувь).
  static const int lowBatteryThreshold = 20;

  final LocationService locationService;
  final GeofenceService geofenceService;
  final MapRepository mapRepository;

  final Map<String, _TrackedHorse> _trackedHorses = {};
  final Queue<_PendingLocation> _offlineQueue = Queue();
  StreamSubscription<Position>? _positionSubscription;
  Timer? _adaptiveTimer;

  final _statusController = StreamController<HerdTrackingStatus>.broadcast();

  HerdTrackingStatus _currentStatus = HerdTrackingStatus.initial();

  /// Одоогийн батарейн түвшин — гадаргуугаас авдаг.
  int _batteryLevel = 100;

  bool _isRunning = false;

  Stream<HerdTrackingStatus> get trackingStatus => _statusController.stream;

  /// Мөрдөж буй морьдын ID-н жагсаалт.
  List<String> get trackedHorseIds => UnmodifiableListView(_trackedHorseIds);

  final List<String> _trackedHorseIds = [];

  // ── Хяналт эхлэх / зогсоох ──────────────────────────────────────

  /// Нэг морийг мөрдөх эхлэх.
  Future<void> startTracking(String horseId) async {
    if (_trackedHorseIds.contains(horseId)) return;
    _trackedHorseIds.add(horseId);
    _trackedHorses[horseId] = _TrackedHorse(horseId: horseId);
    _updateStatus();

    if (!_isRunning) {
      await _startListening();
    }
  }

  /// Нэг морийг мөрдөхөө болих.
  Future<void> stopTracking(String horseId) async {
    _trackedHorseIds.remove(horseId);
    _trackedHorses.remove(horseId);
    _updateStatus();

    if (_trackedHorseIds.isEmpty) {
      _stopListening();
    }
  }

  /// Мал сүргийг мөрдөх эхлэх — олон морийг зэрэг.
  Future<void> startHerdTracking(List<String> horseIds) async {
    for (final horseId in horseIds) {
      if (!_trackedHorseIds.contains(horseId)) {
        _trackedHorseIds.add(horseId);
        _trackedHorses[horseId] = _TrackedHorse(horseId: horseId);
      }
    }
    _updateStatus();

    if (!_isRunning) {
      await _startListening();
    }
  }

  /// Бүх мөрдөлтийг зогсоох.
  Future<void> stopHerdTracking() async {
    _trackedHorseIds.clear();
    _trackedHorses.clear();
    _stopListening();
    _currentStatus = HerdTrackingStatus.initial();
    _statusController.add(_currentStatus);
  }

  /// Мөрдөлтийн төлөвийг цувралаар өгөх.
  Stream<HerdTrackingStatus> get currentStatusStream =>
      _statusController.stream;

  // ── Дотоод логик ──────────────────────────────────────────────

  Future<void> _startListening() async {
    _isRunning = true;

    final hasPermission = await locationService.requestPermission();
    if (!hasPermission) {
      _currentStatus = _currentStatus.copyWith(mode: TrackingMode.stopped);
      _statusController.add(_currentStatus);
      return;
    }

    // Батарей шалгах.
    await _checkBattery();

    // Байршлын мөрдөлтийг эхлэх.
    _positionSubscription?.cancel();
    _positionSubscription = locationService
        .getPositionStream(distanceFilter: 50)
        .listen(
          _onPositionUpdate,
          onError: (_) {
            // Байршлын алдааг чимээгүй бүртгэх — дахин оролдоно.
          },
        );

    _startAdaptiveTimer();
    _updateStatus();
  }

  void _stopListening() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _adaptiveTimer?.cancel();
    _adaptiveTimer = null;
    _isRunning = false;
  }

  void _onPositionUpdate(Position position) async {
    if (_trackedHorseIds.isEmpty) return;

    // Бүх мөрдөж буй морьдын хувьд нэг байршил хуваарилдаг (нэг
    // утаснаас нэг морийг мөрддөг).
    for (final horseId in _trackedHorseIds) {
      final tracked = _trackedHorses[horseId];
      if (tracked == null) continue;

      final location = HorseLocation(
        horseId: horseId,
        horseName: horseId, // Эцсийн нэрийг repository-аас авна.
        ownerId: currentSupabaseUserId() ?? '',
        ownerName: '',
        lat: position.latitude,
        lng: position.longitude,
        lastUpdated: DateTime.now(),
      );

      // Офлайн эсэхийг шалгах.
      final connectivity = await Connectivity().checkConnectivity();
      final isOffline = connectivity.first == ConnectivityResult.none;

      if (isOffline) {
        _offlineQueue.add(_PendingLocation(location: location));
        _updateStatus();
      } else {
        final result = await mapRepository.updateHorseLocation(location);
        result.when(
          onSuccess: (_) {
            tracked.lastLat = position.latitude;
            tracked.lastLng = position.longitude;
            tracked.lastUpdated = DateTime.now();
          },
          onFailure: (_) {
            _offlineQueue.add(_PendingLocation(location: location));
            _updateStatus();
          },
        );
      }
    }

    _updateMode(position);
    _updateStatus();
  }

  /// Горимыг шинэчлэх — хөдөлгөөн болон бэлчээрийн байдал дээр үндэслэнэ.
  void _updateMode(Position position) {
    if (_batteryLevel < lowBatteryThreshold) {
      _currentStatus = _currentStatus.copyWith(mode: TrackingMode.lowBattery);
      return;
    }

    final speed = position.speed;
    if (speed > movementThresholdMps) {
      _currentStatus = _currentStatus.copyWith(mode: TrackingMode.moving);
      return;
    }

    // Бэлчээрт эсэхийг шалгах — энэ нь цаг хугацааны шинэчлэлтийг
    // удирддаг.
    _currentStatus = _currentStatus.copyWith(mode: TrackingMode.stationary);
  }

  /// Давтамжийг тохируулах горим.
  int get _adaptiveIntervalSeconds {
    switch (_currentStatus.mode) {
      case TrackingMode.moving:
        return movingIntervalSeconds;
      case TrackingMode.stationary:
        return stationaryIntervalSeconds;
      case TrackingMode.inGeofence:
        return inGeofenceIntervalSeconds;
      case TrackingMode.lowBattery:
        return lowBatteryIntervalSeconds;
      case TrackingMode.stopped:
        return stationaryIntervalSeconds;
    }
  }

  void _startAdaptiveTimer() {
    _adaptiveTimer?.cancel();
    _adaptiveTimer = Timer.periodic(
      Duration(seconds: _adaptiveIntervalSeconds),
      (_) => _syncQueuedLocations(),
    );
  }

  /// Офлайн Queue-г шалтгаантай үед илгээх.
  Future<void> _syncQueuedLocations() async {
    if (_offlineQueue.isEmpty) return;

    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.first == ConnectivityResult.none) return;

    final pending = <_PendingLocation>[];
    while (_offlineQueue.isNotEmpty) {
      pending.add(_offlineQueue.removeFirst());
    }

    for (final item in pending) {
      final result = await mapRepository.updateHorseLocation(item.location);
      result.when(
        onSuccess: (_) {},
        onFailure: (_) {
          _offlineQueue.add(item); // Дахин оруулах.
        },
      );
    }

    _updateStatus();
  }

  Future<void> _checkBattery() async {
    try {
      // Батарейн түвшинг асаалттай үедээ шалгах.
      // Платформоос шалтгаалан өөр өөр байж болно.
      _batteryLevel = 100; // Анхны утга — бодитой утгыг platform-оос авна.
    } catch (_) {
      _batteryLevel = 100;
    }
  }

  void _updateStatus() {
    _currentStatus = _currentStatus.copyWith(
      isTracking: _isRunning && _trackedHorseIds.isNotEmpty,
      trackedHorseCount: _trackedHorseIds.length,
      queuedLocations: _offlineQueue.length,
      batteryLevel: _batteryLevel,
      lastUpdate: DateTime.now(),
      trackedHorseIds: List.unmodifiable(_trackedHorseIds),
    );
    _statusController.add(_currentStatus);
  }

  /// Цэвэрлэх — нөөцөлсөн нөөцийг устгах.
  void dispose() {
    _stopListening();
    _offlineQueue.clear();
    _statusController.close();
  }
}

/// Офлайн Queue-д хадгалагдсан нэг байршил.
class _PendingLocation {
  const _PendingLocation({required this.location});
  final HorseLocation location;
}

// ── Riverpod providers ─────────────────────────────────────────────

/// HerdTrackingService нэгжийн provider.
final herdTrackingServiceProvider = Provider<HerdTrackingService>((ref) {
  final locationService = ref.watch(locationServiceProvider);
  final geofenceService = ref.watch(geofenceServiceProvider);
  final mapRepository = ref.watch(mapRepositoryProvider);
  final service = HerdTrackingService(
    locationService: locationService,
    geofenceService: geofenceService,
    mapRepository: mapRepository,
  );
  ref.onDispose(service.dispose);
  return service;
});
