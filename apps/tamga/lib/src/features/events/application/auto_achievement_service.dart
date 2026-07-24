/// Үйл явдлын гүйцэтгэлийн дараа морины тэмцээний профайлыг автоматаар шинэчлэх.
///
/// `AutoAchievementService` нь үйл явдал дууссан үед (үр дүнтэй, цаг хугацаа нь
/// болсон) тэр үйл явдалд бүртгэлтэй моридын `TournamentProfile`-г автоматаар
/// шинэчилдэг. Энэ нь дараах тооцооллыг гүйцэтгэдэг:
/// - Ялалтын тоог нэмэгдүүлэх (1-р байр, 2-р байр, 3-р байр)
/// - Шагналын мөнгийг нийт дүнд нэмэх
/// - Сүүлийн үр дүнгийн жагсаалтад шинэ үр дүнг оруулах
library;

import '../../../shared/domain/event.dart';
import '../../events/domain/tournament_profile.dart';

/// Автомат амжилтын тооцооллын үйлчилгээ.
///
/// Энэ нь зөвхөн домэйн түвшний логикийг агуулдаг — сүлжээ, хадгалалт,
/// эсвэл provider-тэй хамааралгүй. Provider-ээр дуудагдаж, профайлын
/// шинэчлэлтийг идэвхжүүлнэ.
class AutoAchievementService {
  const AutoAchievementService();

  /// Өгөгдсөн үйл явдал дууссан эсэхийг шалгах.
  ///
  /// Үйл явдал нь дараах нөхцөлд дууссан гэж тооцогдоно:
  /// - `result` талбар нь хоосон биш (үр дүнтэй)
  /// - `isUpcoming` нь `false` (цаг хугацаа нь болсон)
  bool isCompleted(Event event) {
    return event.result != null &&
        event.result!.isNotEmpty &&
        !event.isUpcoming;
  }

  /// Үр дүнгийн текстээс байрны дугаарыг гаргах.
  ///
  /// "Түрүү" → 1
  /// "1-р байр" → 1
  /// "Амжилттай", "Оролцсон" → 0 (шагналт байр биш)
  int parsePlace(String resultText) {
    if (resultText.isEmpty) return 0;
    // "Түрүү" → 1
    if (resultText.contains('Түрүү') || resultText.contains('түрүү')) return 1;
    // "1-р байр" гэх мэт текстээс дугаарыг гаргах
    final match = RegExp(r'(\d+)').firstMatch(resultText);
    if (match != null) {
      return int.tryParse(match.group(1)!) ?? 0;
    }
    // Амжилттай, Оролцсон → participation (0)
    return 0;
  }

  /// Өгөгдсөн дууссан үйл явдлаар тэмцээний профайлыг шинэчлэх.
  ///
  /// [currentProfile] — одоогийн тэмцээний профайл.
  /// [completedEvent] — дууссан үйл явдал (үр дүн, шагналтай).
  ///
  /// Буцаах утга нь шинэчлэгдсэн `TournamentProfile`.
  TournamentProfile processCompletedEvent({
    required TournamentProfile currentProfile,
    required Event completedEvent,
  }) {
    if (!isCompleted(completedEvent)) return currentProfile;

    final place = parsePlace(completedEvent.result ?? '');
    final prize = (completedEvent.prizeAmount ?? 0).toDouble();

    // Шинэ статистик
    final newTotalRaces = currentProfile.totalRaces + 1;
    final newFirstPlace = currentProfile.firstPlace + (place == 1 ? 1 : 0);
    final newSecondPlace = currentProfile.secondPlace + (place == 2 ? 1 : 0);
    final newThirdPlace = currentProfile.thirdPlace + (place == 3 ? 1 : 0);
    final newPrizeMoney = currentProfile.totalPrizeMoney + prize;

    // Шинэ үр дүн
    final newResult = TournamentResult(
      eventId: completedEvent.id,
      eventName: completedEvent.title,
      date: completedEvent.date ?? DateTime.now(),
      place: place,
      participants: 0,
      prize: prize > 0 ? prize : null,
      notes: completedEvent.result ?? '',
    );

    // Сүүлийн 10 үр дүнг хадгалах (шинэ нь эхэнд)
    final recentResults = [
      newResult,
      ...currentProfile.recentResults,
    ].take(10).toList();

    // Хамгийн сайн амжилт
    final bestAchievement = currentProfile.bestAchievement ??
        (place == 1 ? completedEvent.title : null);

    // Сүүлийн уралдааны огноо
    final lastRaceDate = completedEvent.date ?? currentProfile.lastRaceDate;

    return TournamentProfile(
      horseId: currentProfile.horseId,
      horseName: currentProfile.horseName,
      totalRaces: newTotalRaces,
      firstPlace: newFirstPlace,
      secondPlace: newSecondPlace,
      thirdPlace: newThirdPlace,
      participationCount: newTotalRaces,
      totalPrizeMoney: newPrizeMoney,
      recentResults: recentResults,
      bestAchievement: bestAchievement,
      lastRaceDate: lastRaceDate,
    );
  }
}
