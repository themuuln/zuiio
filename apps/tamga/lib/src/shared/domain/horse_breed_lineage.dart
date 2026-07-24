/// Монгол морины үүлдэр угсаа.
///
/// Монголд 7 гол морины үүлдэр бүртгэгдсэн бөгөөд тус бүр нь
/// тодорхой нутаг хязгаартай холбогдсон.
///
/// Based on PMC 9890337 (genetic diversity study) and
/// Konagaya Yu. (2023) Mongolian horse classification research.
enum MongolianBreedLineage {
  /// Монгол — general breed, highest global genetic diversity
  mongol,

  /// Галшар — Galshir soum, Khentii aimag; racehorse conformation
  galshar,

  /// Тэс — Zuungobi soum, Uvs aimag; longer withers and croup
  tes,

  /// Мянгад — Myangad/Durgun, Khovd aimag; large body, high milk yield
  myangad,

  /// Дархад — Khuvsgul, 2300-2500m altitude; extremely hardy, strongest
  darkhad,

  /// Өндөршүл — Gobi region; desert-adapted
  undurshil,

  /// Говийн Шанх — genetically distinct Gobi lineage
  gobiShankh;

  /// Mongolian display name.
  String get displayName => switch (this) {
    MongolianBreedLineage.mongol => 'Монгол',
    MongolianBreedLineage.galshar => 'Галшар',
    MongolianBreedLineage.tes => 'Тэс',
    MongolianBreedLineage.myangad => 'Мянгад',
    MongolianBreedLineage.darkhad => 'Дархад',
    MongolianBreedLineage.undurshil => 'Өндөршүл',
    MongolianBreedLineage.gobiShankh => 'Говийн Шанх',
  };

  /// Region of origin (aimag).
  String get region => switch (this) {
    MongolianBreedLineage.mongol => 'Улсын хэмжээнд',
    MongolianBreedLineage.galshar => 'Хэнтий аймаг',
    MongolianBreedLineage.tes => 'Увс аймаг',
    MongolianBreedLineage.myangad => 'Ховд аймаг',
    MongolianBreedLineage.darkhad => 'Хөвсгөл аймаг',
    MongolianBreedLineage.undurshil => 'Говь',
    MongolianBreedLineage.gobiShankh => 'Говь',
  };

  /// Brief English description.
  String get description => switch (this) {
    MongolianBreedLineage.mongol =>
      'General breed, highest global genetic diversity',
    MongolianBreedLineage.galshar => 'Racehorse conformation, steppe-adapted',
    MongolianBreedLineage.tes => 'Longer withers and croup, riding/racing',
    MongolianBreedLineage.myangad =>
      'Large body (350-370 kg stallions), high milk yield',
    MongolianBreedLineage.darkhad =>
      'Extremely hardy, strongest (250 kg carries 300 kg)',
    MongolianBreedLineage.undurshil => 'Desert-adapted',
    MongolianBreedLineage.gobiShankh => 'Genetically distinct Gobi lineage',
  };

  static MongolianBreedLineage? fromString(String value) {
    for (final l in MongolianBreedLineage.values) {
      if (l.name == value) return l;
    }
    return null;
  }
}
