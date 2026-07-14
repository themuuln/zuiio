// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'app_version.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$AppVersion {
  int get versionCode => throw _privateConstructorUsedError;
  String get versionName => throw _privateConstructorUsedError;
  String get storagePath => throw _privateConstructorUsedError;
  String get sha256Hash => throw _privateConstructorUsedError;
  String get changelog => throw _privateConstructorUsedError;
  bool get forceUpdate => throw _privateConstructorUsedError;

  @JsonKey(ignore: true)
  $AppVersionCopyWith<AppVersion> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AppVersionCopyWith<$Res> {
  factory $AppVersionCopyWith(
          AppVersion value, $Res Function(AppVersion) then) =
      _$AppVersionCopyWithImpl<$Res, AppVersion>;
  @useResult
  $Res call(
      {int versionCode,
      String versionName,
      String storagePath,
      String sha256Hash,
      String changelog,
      bool forceUpdate});
}

/// @nodoc
class _$AppVersionCopyWithImpl<$Res, $Val extends AppVersion>
    implements $AppVersionCopyWith<$Res> {
  _$AppVersionCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? versionCode = null,
    Object? versionName = null,
    Object? storagePath = null,
    Object? sha256Hash = null,
    Object? changelog = null,
    Object? forceUpdate = null,
  }) {
    return _then(_value.copyWith(
      versionCode: null == versionCode
          ? _value.versionCode
          : versionCode // ignore: cast_nullable_to_non_nullable
              as int,
      versionName: null == versionName
          ? _value.versionName
          : versionName // ignore: cast_nullable_to_non_nullable
              as String,
      storagePath: null == storagePath
          ? _value.storagePath
          : storagePath // ignore: cast_nullable_to_non_nullable
              as String,
      sha256Hash: null == sha256Hash
          ? _value.sha256Hash
          : sha256Hash // ignore: cast_nullable_to_non_nullable
              as String,
      changelog: null == changelog
          ? _value.changelog
          : changelog // ignore: cast_nullable_to_non_nullable
              as String,
      forceUpdate: null == forceUpdate
          ? _value.forceUpdate
          : forceUpdate // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$AppVersionImplCopyWith<$Res>
    implements $AppVersionCopyWith<$Res> {
  factory _$$AppVersionImplCopyWith(
          _$AppVersionImpl value, $Res Function(_$AppVersionImpl) then) =
      __$$AppVersionImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {int versionCode,
      String versionName,
      String storagePath,
      String sha256Hash,
      String changelog,
      bool forceUpdate});
}

/// @nodoc
class __$$AppVersionImplCopyWithImpl<$Res>
    extends _$AppVersionCopyWithImpl<$Res, _$AppVersionImpl>
    implements _$$AppVersionImplCopyWith<$Res> {
  __$$AppVersionImplCopyWithImpl(
      _$AppVersionImpl _value, $Res Function(_$AppVersionImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? versionCode = null,
    Object? versionName = null,
    Object? storagePath = null,
    Object? sha256Hash = null,
    Object? changelog = null,
    Object? forceUpdate = null,
  }) {
    return _then(_$AppVersionImpl(
      versionCode: null == versionCode
          ? _value.versionCode
          : versionCode // ignore: cast_nullable_to_non_nullable
              as int,
      versionName: null == versionName
          ? _value.versionName
          : versionName // ignore: cast_nullable_to_non_nullable
              as String,
      storagePath: null == storagePath
          ? _value.storagePath
          : storagePath // ignore: cast_nullable_to_non_nullable
              as String,
      sha256Hash: null == sha256Hash
          ? _value.sha256Hash
          : sha256Hash // ignore: cast_nullable_to_non_nullable
              as String,
      changelog: null == changelog
          ? _value.changelog
          : changelog // ignore: cast_nullable_to_non_nullable
              as String,
      forceUpdate: null == forceUpdate
          ? _value.forceUpdate
          : forceUpdate // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _$AppVersionImpl implements _AppVersion {
  const _$AppVersionImpl(
      {required this.versionCode,
      required this.versionName,
      required this.storagePath,
      required this.sha256Hash,
      this.changelog = '',
      this.forceUpdate = false});

  @override
  final int versionCode;
  @override
  final String versionName;
  @override
  final String storagePath;
  @override
  final String sha256Hash;
  @override
  @JsonKey()
  final String changelog;
  @override
  @JsonKey()
  final bool forceUpdate;

  @override
  String toString() {
    return 'AppVersion(versionCode: $versionCode, versionName: $versionName, storagePath: $storagePath, sha256Hash: $sha256Hash, changelog: $changelog, forceUpdate: $forceUpdate)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AppVersionImpl &&
            (identical(other.versionCode, versionCode) ||
                other.versionCode == versionCode) &&
            (identical(other.versionName, versionName) ||
                other.versionName == versionName) &&
            (identical(other.storagePath, storagePath) ||
                other.storagePath == storagePath) &&
            (identical(other.sha256Hash, sha256Hash) ||
                other.sha256Hash == sha256Hash) &&
            (identical(other.changelog, changelog) ||
                other.changelog == changelog) &&
            (identical(other.forceUpdate, forceUpdate) ||
                other.forceUpdate == forceUpdate));
  }

  @override
  int get hashCode => Object.hash(runtimeType, versionCode, versionName,
      storagePath, sha256Hash, changelog, forceUpdate);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$AppVersionImplCopyWith<_$AppVersionImpl> get copyWith =>
      __$$AppVersionImplCopyWithImpl<_$AppVersionImpl>(this, _$identity);
}

abstract class _AppVersion implements AppVersion {
  const factory _AppVersion(
      {required final int versionCode,
      required final String versionName,
      required final String storagePath,
      required final String sha256Hash,
      final String changelog,
      final bool forceUpdate}) = _$AppVersionImpl;

  @override
  int get versionCode;
  @override
  String get versionName;
  @override
  String get storagePath;
  @override
  String get sha256Hash;
  @override
  String get changelog;
  @override
  bool get forceUpdate;
  @override
  @JsonKey(ignore: true)
  _$$AppVersionImplCopyWith<_$AppVersionImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
