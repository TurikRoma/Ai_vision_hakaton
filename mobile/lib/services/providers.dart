import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/services/scan_history_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

// 1. Провайдер для SharedPreferences
final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return await SharedPreferences.getInstance();
});

// 2. Провайдер для ScanHistoryService, который правильно ждет SharedPreferences
final scanHistoryServiceProvider = FutureProvider<ScanHistoryService>((ref) async {
  // Асинхронно ждем, пока SharedPreferences будет готов
  final sharedPreferences = await ref.watch(sharedPreferencesProvider.future);
  // Возвращаем готовый к работе сервис
  return ScanHistoryService(sharedPreferences);
});
