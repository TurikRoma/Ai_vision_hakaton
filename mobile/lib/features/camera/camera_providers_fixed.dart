import 'package:flutter_riverpod/flutter_riverpod.dart';

final cameraFeedbackProvider = StateProvider<String>((ref) {
  return 'Расположите лицо в овале';
});

final countdownProvider = StateProvider<int>((ref) {
  return 2;
});

final countdownTimerProvider = StateProvider<bool>((ref) {
  return false;
});
