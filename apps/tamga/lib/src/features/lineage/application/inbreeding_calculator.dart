import 'dart:collection';
import '../../../shared/domain/horse.dart';

class AncestorPath {
  AncestorPath({
    required this.ancestorId,
    required this.ancestorName,
    required this.sirePath,
    required this.damPath,
    required this.contribution,
  });

  final String ancestorId;
  final String ancestorName;
  final List<String> sirePath; // e.g., ['sire', 'parent', 'ancestor']
  final List<String> damPath;
  final double contribution;
}

class InbreedingResult {
  InbreedingResult({required this.coi, required this.paths});

  final double coi;
  final List<AncestorPath> paths;

  String get riskLevel {
    if (coi < 0.01) return 'Эрсдэлгүй';
    if (coi < 0.0625) return 'Бага эрсдэлтэй';
    if (coi < 0.125) return 'Дунд зэргийн эрсдэлтэй';
    return 'Өндөр эрсдэлтэй';
  }
}

class InbreedingCalculator {
  // Build parent mapping: childId -> (sireId, damId)
  static Map<String, Parents> buildParentMap() {
    final parentMap = <String, Parents>{};

    // Seed pedigree data for built-in horses. For UI-added horses,
    // use buildParentMapFromHorses() and merge via calculate().
    // Khan Khuleg Line
    parentMap['khan-khuleg'] = const Parents(
      sireId: 'tenger-khuleg',
      damId: 'khuren-guu',
    );
    parentMap['altan-shuurga'] = const Parents(sireId: 'khan-khuleg');
    parentMap['uulen-bor'] = const Parents(sireId: 'khan-khuleg');
    parentMap['shandas-gal'] = const Parents(sireId: 'khan-khuleg');
    parentMap['khukh-suld'] = const Parents(sireId: 'altan-shuurga');
    parentMap['saaral-tenkhee'] = const Parents(damId: 'uulen-bor');

    // Tsagaan Salkhi Line
    parentMap['tsagaan-salkhi'] = const Parents(sireId: 'erdeniin-khiimor');
    parentMap['erdene-salkhi'] = const Parents(sireId: 'tsagaan-salkhi');
    parentMap['munguun-khiimor'] = const Parents(sireId: 'tsagaan-salkhi');
    parentMap['saran-tuyaa'] = const Parents(damId: 'munguun-khiimor');

    return parentMap;
  }

  /// Build a parent mapping dynamically from a list of Horse objects.
  /// Only includes horses that have at least one parent (sireId or damId).
  static Map<String, Parents> buildParentMapFromHorses(List<Horse> horses) {
    final parentMap = <String, Parents>{};
    for (final horse in horses) {
      if (horse.sireId != null || horse.damId != null) {
        parentMap[horse.id] = Parents(sireId: horse.sireId, damId: horse.damId);
      }
    }
    return parentMap;
  }

  // Find all paths from a horse to its ancestors up to maxDepth
  static List<List<String>> findAncestorPaths(
    String horseId,
    Map<String, Parents> parentMap,
    Map<String, String> nameMap, [
    int maxDepth = 6,
  ]) {
    final results = <List<String>>[];

    void traverse(String currentId, List<String> currentPath) {
      // Every visited ancestor is a valid path endpoint. Recording only leaf
      // ancestors misses shared parents such as half-sibling pairings.
      if (currentPath.length > 1) {
        results.add(List.of(currentPath));
      }
      if (currentPath.length >= maxDepth) return;

      final parents = parentMap[currentId];
      if (parents == null) return;

      if (parents.sireId != null) {
        currentPath.add(parents.sireId!);
        traverse(parents.sireId!, currentPath);
        currentPath.removeLast();
      }

      if (parents.damId != null) {
        currentPath.add(parents.damId!);
        traverse(parents.damId!, currentPath);
        currentPath.removeLast();
      }
    }

    traverse(horseId, [horseId]);
    return results;
  }

  // Calculate Coefficient of Inbreeding (COI) using path coefficient method
  static InbreedingResult calculate(
    String sireId,
    String damId,
    Map<String, String> nameMap, [
    List<Horse>? horses,
  ]) {
    if (sireId == damId) {
      // Direct self-breeding (not standard but possible in calculation)
      return InbreedingResult(coi: 1.0, paths: []);
    }

    // Start with seed data, then overlay with dynamic data from horses list
    final parentMap = <String, Parents>{...buildParentMap()};
    if (horses != null && horses.isNotEmpty) {
      parentMap.addAll(buildParentMapFromHorses(horses));
    }

    // 1. Find all paths from Sire to ancestors
    final sirePaths = findAncestorPaths(sireId, parentMap, nameMap);
    // 2. Find all paths from Dam to ancestors
    final damPaths = findAncestorPaths(damId, parentMap, nameMap);

    // Get lists of ancestors
    final sireAncestors = sirePaths.map((p) => p.last).toSet();
    final damAncestors = damPaths.map((p) => p.last).toSet();

    // Common ancestors
    final commonAncestors = sireAncestors.intersection(damAncestors);
    if (commonAncestors.isEmpty) {
      return InbreedingResult(coi: 0.0, paths: []);
    }

    double totalCoi = 0.0;
    final ancestorPaths = <AncestorPath>[];

    for (final ancestor in commonAncestors) {
      // Find all paths from Sire to ancestor
      final sPaths = sirePaths.where((p) => p.last == ancestor).toList();
      // Find all paths from Dam to ancestor
      final dPaths = damPaths.where((p) => p.last == ancestor).toList();

      for (final sp in sPaths) {
        for (final dp in dPaths) {
          // Check if paths are disjoint (share no nodes other than the ancestor itself)
          // sp: [sireId, ..., ancestor]
          // dp: [damId, ..., ancestor]
          final spNodes = sp.sublist(0, sp.length - 1).toSet();
          final dpNodes = dp.sublist(0, dp.length - 1).toSet();

          final intersection = spNodes.intersection(dpNodes);
          if (intersection.isEmpty) {
            // Disjoint paths!
            // n1 = number of generation steps in sire path = sp.length - 1
            // n2 = number of generation steps in dam path = dp.length - 1
            final n1 = sp.length - 1;
            final n2 = dp.length - 1;

            final contribution = _pow(0.5, n1 + n2 + 1);
            totalCoi += contribution;

            ancestorPaths.add(
              AncestorPath(
                ancestorId: ancestor,
                ancestorName: nameMap[ancestor] ?? ancestor,
                sirePath: sp,
                damPath: dp,
                contribution: contribution,
              ),
            );
          }
        }
      }
    }

    // Sort ancestor paths by contribution descending
    ancestorPaths.sort((a, b) => b.contribution.compareTo(a.contribution));

    return InbreedingResult(coi: totalCoi, paths: ancestorPaths);
  }

  static double _pow(double base, int exponent) {
    double result = 1.0;
    for (int i = 0; i < exponent; i++) {
      result *= base;
    }
    return result;
  }

  /// Pedigree Completeness Index (PCI)
  /// Fraction of known ancestors across [generations] generations.
  /// Returns 0.0 to 1.0 where 1.0 = fully known pedigree.
  static double calculatePCI(
    String horseId,
    Map<String, Parents> parentMap, {
    int generations = 4,
  }) {
    int known = 0;

    // BFS to count known ancestors
    final queue = Queue<String>();
    queue.add(horseId);
    int depth = 0;
    while (queue.isNotEmpty && depth < generations) {
      int levelSize = queue.length;
      for (int i = 0; i < levelSize; i++) {
        final id = queue.removeFirst();
        final parents = parentMap[id];
        if (parents?.sireId != null) {
          known++;
          queue.add(parents!.sireId!);
        }
        if (parents?.damId != null) {
          known++;
          queue.add(parents!.damId!);
        }
      }
      depth++;
    }

    // Count expected ancestors at each reached generation
    int expectedAtDepth = 0;
    for (int d = 1; d <= depth && d <= generations; d++) {
      expectedAtDepth += (1 << d);
    }

    return expectedAtDepth > 0 ? known / expectedAtDepth : 0.0;
  }

  /// Result including PCI
  static ({double coi, double pci, int generations, String warning})
  calculateWithPCI(
    String horseId,
    String sireId,
    String damId,
    Map<String, String> nameMap, {
    Map<String, Parents>? parentMap,
    List<Horse>? horses,
    int generations = 4,
  }) {
    final effectiveMap = parentMap ?? buildParentMapFromHorses(horses ?? []);
    final coiResult = calculate(sireId, damId, nameMap, horses);
    final pci = calculatePCI(horseId, effectiveMap, generations: generations);
    final warning = pci < 0.5
        ? 'Аав ээжийн мэдээлэл дутуу байна (${(pci * 100).toStringAsFixed(0)}%)'
        : '';
    return (
      coi: coiResult.coi,
      pci: pci,
      generations: generations,
      warning: warning,
    );
  }
}

class Parents {
  const Parents({this.sireId, this.damId});
  final String? sireId;
  final String? damId;
}
