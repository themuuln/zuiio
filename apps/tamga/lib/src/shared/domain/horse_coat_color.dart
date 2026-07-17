/// Монгол морины зүсний нэршил.
///
/// Морины зүсийг бие болон сүүл/үсний өнгийн зөрүүгээр тодорхойлдог.
/// 17 үндсэн нэршил нь улсын хэмжээнд нэгдмэл ойлголттой.
///
/// Based on Konagaya Yu. (2023) "Mongolian Distinction on Horse Coloration"
enum MongolianCoatColor {
  /// Саарал — mixed white and colored hairs
  saaral,

  /// Шарга — yellowish body + white hairs
  sharga,

  /// Халиун — light brown body + black hairs
  khaliiun,

  /// Улаан — reddish-gray
  ulaan,

  /// Буурал — mixed white on colored body
  buural,

  /// Цоохор — patterned/spotted
  tsoohor,

  /// Хар — black
  khar,

  /// Хярман / Зээрд — reddish all over
  khyarman,

  /// Чабидар — reddish body + white mane/tail
  chabidar,

  /// Хээр — reddish-brown body + black hairs
  kheer,

  /// Хүрэн — brown
  khuren,

  /// Хувар / Хонгор — whitish gold
  khuwar,

  /// Хул — gold body + black mane
  khul,

  /// Бор — gray/ash
  bor,

  /// Цэнхэр — sky-blue/white
  tsenker,

  /// Халтар — brown body + white snout
  khaltar,

  /// Алаг — speckled, multiple sub-patterns
  alag;

  /// Mongolian display name.
  String get displayName => switch (this) {
    MongolianCoatColor.saaral => 'Саарал',
    MongolianCoatColor.sharga => 'Шарга',
    MongolianCoatColor.khaliiun => 'Халиун',
    MongolianCoatColor.ulaan => 'Улаан',
    MongolianCoatColor.buural => 'Буурал',
    MongolianCoatColor.tsoohor => 'Цоохор',
    MongolianCoatColor.khar => 'Хар',
    MongolianCoatColor.khyarman => 'Хярман',
    MongolianCoatColor.chabidar => 'Чабидар',
    MongolianCoatColor.kheer => 'Хээр',
    MongolianCoatColor.khuren => 'Хүрэн',
    MongolianCoatColor.khuwar => 'Хувар',
    MongolianCoatColor.khul => 'Хул',
    MongolianCoatColor.bor => 'Бор',
    MongolianCoatColor.tsenker => 'Цэнхэр',
    MongolianCoatColor.khaltar => 'Халтар',
    MongolianCoatColor.alag => 'Алаг',
  };

  /// English description.
  String get description => switch (this) {
    MongolianCoatColor.saaral => 'Mixed white and colored',
    MongolianCoatColor.sharga => 'Yellowish + white hairs',
    MongolianCoatColor.khaliiun => 'Light brown + black hairs',
    MongolianCoatColor.ulaan => 'Reddish-gray',
    MongolianCoatColor.buural => 'Mixed white on colored',
    MongolianCoatColor.tsoohor => 'Patterned/spotted',
    MongolianCoatColor.khar => 'Black',
    MongolianCoatColor.khyarman => 'Reddish all over',
    MongolianCoatColor.chabidar => 'Reddish + white mane/tail',
    MongolianCoatColor.kheer => 'Reddish-brown + black hairs',
    MongolianCoatColor.khuren => 'Brown',
    MongolianCoatColor.khuwar => 'Whitish gold',
    MongolianCoatColor.khul => 'Gold + black mane',
    MongolianCoatColor.bor => 'Gray/ash',
    MongolianCoatColor.tsenker => 'Sky-blue/white',
    MongolianCoatColor.khaltar => 'Brown + white snout',
    MongolianCoatColor.alag => 'Speckled',
  };

  static MongolianCoatColor? fromString(String value) {
    for (final c in MongolianCoatColor.values) {
      if (c.name == value) return c;
    }
    return null;
  }
}
