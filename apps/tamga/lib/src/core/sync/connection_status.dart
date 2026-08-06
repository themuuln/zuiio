import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';

/// Хэрэглэгчийн сүлжээний төлөв.
enum ConnectionStatus { online, offline, unknown }

/// Сүлжээний холболтыг хянах singleton.
///
/// App дээр connectivit байгаа эсэхийг шалгаж,
/// өөрчлөлтийг stream-ээр дамжуулна.
/// Sync scheduler энэ stream-ийг сонсож offline үед sync-ийг хойшлуулна.
class ConnectionMonitor {
  ConnectionMonitor._();
  static final ConnectionMonitor instance = ConnectionMonitor._();

  StreamController<ConnectionStatus> _controller =
      StreamController<ConnectionStatus>.broadcast();

  /// Сүлжээний төлөвийн stream.
  Stream<ConnectionStatus> get status => _controller.stream;

  ConnectionStatus _current = ConnectionStatus.unknown;

  /// Одоогийн сүлжээний төлөв.
  ConnectionStatus get current => _current;

  StreamSubscription<List<ConnectivityResult>>? _subscription;

  /// Мониторыг эхлүүлэх — эхний утга + өөрчлөлтүүдийг stream-д нэмнэ.
  Future<void> start() async {
    // stop()-ийн дараа дахин эхлүүлэх боломжтой байлгах (controller closed → re-create).
    if (_controller.isClosed) {
      _controller = StreamController<ConnectionStatus>.broadcast();
    }
    final connectivity = Connectivity();

    _subscription = connectivity.onConnectivityChanged.listen((results) {
      _current = _resolveStatus(results);
      _controller.add(_current);
    });

    // Эхний төлөвийг шалгах.
    final results = await connectivity.checkConnectivity();
    _current = _resolveStatus(results);
    _controller.add(_current);
  }

  /// Мониторыг зогсоох.
  void stop() {
    _subscription?.cancel();
    _subscription = null;
    if (!_controller.isClosed) {
      _controller.close();
    }
  }

  ConnectionStatus _resolveStatus(List<ConnectivityResult> results) {
    if (results.isEmpty) return ConnectionStatus.offline;
    return results.contains(ConnectivityResult.none)
        ? ConnectionStatus.offline
        : ConnectionStatus.online;
  }
}
