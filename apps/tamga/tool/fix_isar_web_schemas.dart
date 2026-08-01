import 'dart:io';

Future<void> main() async {
  final files = await Directory('lib')
      .list(recursive: true)
      .where((entity) => entity is File && entity.path.endsWith('.g.dart'))
      .cast<File>()
      .where((file) => file.path.contains('isar_schemas'))
      .toList();

  for (final file in files) {
    final original = await file.readAsString();
    final updated = original
        .replaceAllMapped(
          RegExp(r'const (Isar\w+Schema) = '),
          (match) => 'final ${match.group(1)} = ',
        )
        .replaceAllMapped(
          RegExp(r'(^\s+id:) (-?\d+),', multiLine: true),
          (match) => "${match.group(1)} int.parse('${match.group(2)}'),",
        );

    if (updated != original) {
      await file.writeAsString(updated);
      stdout.writeln('Updated ${file.path}');
    }
  }
}
