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

    // We hardcode the pedigree structure based on the repository seed and snapshot data
    // to ensure complete accuracy across all records in the app:
    //
    // TODO: This is entirely hardcoded seed data. For horses added through the UI,
    //       buildParentMap() must be populated dynamically from the lineage repository.
    //       Currently, COI can only be computed for the built-in seed horses.
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

  // Find all paths from a horse to its ancestors up to maxDepth
  static List<List<String>> findAncestorPaths(
    String horseId,
    Map<String, Parents> parentMap,
    Map<String, String> nameMap, [
    int maxDepth = 6,
  ]) {
    final results = <List<String>>[];

    void traverse(String currentId, List<String> currentPath) {
      if (currentPath.length >= maxDepth) return;

      final parents = parentMap[currentId];
      if (parents == null) {
        return;
      }

      if (parents.sireId != null) {
        final next = [...currentPath, parents.sireId!];
        results.add(next);
        traverse(parents.sireId!, next);
      }
      if (parents.damId != null) {
        final next = [...currentPath, parents.damId!];
        results.add(next);
        traverse(parents.damId!, next);
      }
    }

    traverse(horseId, [horseId]);
    return results;
  }

  // Calculate Coefficient of Inbreeding (COI) using path coefficient method
  static InbreedingResult calculate(
    String sireId,
    String damId,
    Map<String, String> nameMap,
  ) {
    if (sireId == damId) {
      // Direct self-breeding (not standard but possible in calculation)
      return InbreedingResult(coi: 1.0, paths: []);
    }

    final parentMap = buildParentMap();

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
}

class Parents {
  const Parents({this.sireId, this.damId});
  final String? sireId;
  final String? damId;
}
