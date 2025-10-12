import 'dart:convert';
import 'package:mobile/models.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:table_calendar/table_calendar.dart';

class ScanHistoryService {
  final SharedPreferences _prefs;

  ScanHistoryService(this._prefs);

  static const _key = 'scan_history';

  Future<void> addScan(DateTime date, Analysis analysis) async {
    final historyString = _prefs.getString(_key) ?? '{}';
    final history = json.decode(historyString) as Map<String, dynamic>;

    final dateString =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

    // Перезаписываем, если для этой даты уже есть скан
    history[dateString] = analysis.toJson();

    await _prefs.setString(_key, json.encode(history));
  }

  Future<Analysis?> getScanForDate(DateTime date) async {
    final historyString = _prefs.getString(_key) ?? '{}';
    final history = json.decode(historyString) as Map<String, dynamic>;

    final dateString =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

    if (history.containsKey(dateString)) {
      return Analysis.fromJson(history[dateString] as Map<String, dynamic>);
    }
    return null;
  }

  Future<List<DateTime>> getScanDates() async {
    final historyString = _prefs.getString(_key) ?? '{}';
    final history = json.decode(historyString) as Map<String, dynamic>;

    return history.keys.map((dateString) => DateTime.parse(dateString)).toList();
  }

  Future<int> calculateStreak() async {
    final dates = await getScanDates();
    if (dates.isEmpty) {
      return 0;
    }

    // Сортируем даты по убыванию
    dates.sort((a, b) => b.compareTo(a));

    // Убираем дубликаты сканов в один и тот же день
    final uniqueDates = <DateTime>[];
    for (var date in dates) {
      if (uniqueDates.isEmpty || !isSameDay(uniqueDates.last, date)) {
        uniqueDates.add(date);
      }
    }

    final today = DateTime.now();
    final todayDate = DateTime(today.year, today.month, today.day);
    
    // Проверяем, что последний скан был сегодня или вчера
    if (!isSameDay(uniqueDates.first, todayDate) && 
        !isSameDay(uniqueDates.first, todayDate.subtract(const Duration(days: 1)))) {
      return 0; // Если нет, серия прервана
    }

    int streak = 1;
    DateTime lastDate = uniqueDates.first;

    for (int i = 1; i < uniqueDates.length; i++) {
      final currentDate = uniqueDates[i];
      // Проверяем, что разница между датами ровно 1 день
      final difference = lastDate.difference(currentDate).inDays;

      if (difference == 1) {
        streak++;
        lastDate = currentDate;
      } else {
        break; // Серия прервана
      }
    }
    
    return streak;
  }
}
