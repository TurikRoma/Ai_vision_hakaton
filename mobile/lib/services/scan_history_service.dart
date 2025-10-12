import 'dart:convert';
import 'package:mobile/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ScanHistoryService {
  static const _key = 'scan_history';

  Future<void> addScan(DateTime date, Analysis analysis) async {
    final prefs = await SharedPreferences.getInstance();
    final historyString = prefs.getString(_key) ?? '{}';
    final history = json.decode(historyString) as Map<String, dynamic>;

    final dateString = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    
    // Перезаписываем, если для этой даты уже есть скан
    history[dateString] = analysis.toJson();

    await prefs.setString(_key, json.encode(history));
  }

  Future<Analysis?> getScanForDate(DateTime date) async {
    final prefs = await SharedPreferences.getInstance();
    final historyString = prefs.getString(_key) ?? '{}';
    final history = json.decode(historyString) as Map<String, dynamic>;
    
    final dateString = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';

    if (history.containsKey(dateString)) {
      return Analysis.fromJson(history[dateString] as Map<String, dynamic>);
    }
    return null;
  }

  Future<List<DateTime>> getScanDates() async {
    final prefs = await SharedPreferences.getInstance();
    final historyString = prefs.getString(_key) ?? '{}';
    final history = json.decode(historyString) as Map<String, dynamic>;
    
    return history.keys.map((dateString) => DateTime.parse(dateString)).toList();
  }
}
