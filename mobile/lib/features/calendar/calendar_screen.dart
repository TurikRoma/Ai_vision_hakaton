import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:markdown_widget/markdown_widget.dart';
import 'package:mobile/models.dart';
import 'package:mobile/services/providers.dart';
import 'package:mobile/services/scan_history_service.dart';
import 'package:table_calendar/table_calendar.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncScanHistoryService = ref.watch(scanHistoryServiceProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
        title: Text(
          'Календарь',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
        centerTitle: true,
      ),
      body: asyncScanHistoryService.when(
        data: (scanHistoryService) {
          return CalendarView(service: scanHistoryService);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Text('Ошибка загрузки данных: $error'),
        ),
      ),
    );
  }
}

class CalendarView extends StatefulWidget {
  final ScanHistoryService service;
  const CalendarView({super.key, required this.service});

  @override
  State<CalendarView> createState() => _CalendarViewState();
}

class _CalendarViewState extends State<CalendarView> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  List<DateTime> _scanDates = [];
  Analysis? _selectedAnalysis;
  int _streak = 0;

  @override
  void initState() {
    super.initState();
    _loadScanData();
  }

  Future<void> _loadScanData() async {
    final dates = await widget.service.getScanDates();
    final streak = await widget.service.calculateStreak();
    if (mounted) {
      setState(() {
        _scanDates = dates;
        _streak = streak;
      });
    }
  }

  Future<void> _onDaySelected(DateTime selectedDay, DateTime focusedDay) async {
    final analysis = await widget.service.getScanForDate(selectedDay);
    if (mounted) {
      setState(() {
        _selectedDay = selectedDay;
        _focusedDay = focusedDay;
        _selectedAnalysis = analysis;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          _buildStreakCounter(_streak),
          const SizedBox(height: 16),
          TableCalendar(
            firstDay: DateTime.utc(2010, 10, 16),
            lastDay: DateTime.utc(2030, 3, 14),
            focusedDay: _focusedDay,
            calendarFormat: CalendarFormat.month,
            selectedDayPredicate: (day) {
              return isSameDay(_selectedDay, day);
            },
            onDaySelected: _onDaySelected,
            onPageChanged: (focusedDay) {
              _focusedDay = focusedDay;
            },
            calendarBuilders: CalendarBuilders(
              prioritizedBuilder: (context, day, focusedDay) {
                final isScanDay =
                    _scanDates.any((scanDate) => isSameDay(scanDate, day));
                if (isScanDay) {
                  return Container(
                    margin: const EdgeInsets.all(4.0),
                    decoration: const BoxDecoration(
                      color: Colors.green,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        '${day.day}',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  );
                }
                return null;
              },
            ),
          ),
          if (_selectedAnalysis != null) ...[
            const SizedBox(height: 24),
            _buildRecommendations(_selectedAnalysis!),
          ]
        ],
      ),
    );
  }

  Widget _buildStreakCounter(int streak) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.local_fire_department_rounded,
              color: Colors.green, size: 28),
          const SizedBox(width: 12),
          Text(
            '$streak дней подряд',
            style: GoogleFonts.manrope(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.green[800],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendations(Analysis analysis) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Рекомендации для выбранного дня',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 2,
                blurRadius: 5,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: MarkdownWidget(
            data: analysis.recommendations ??
                'Рекомендации для этого дня отсутствуют.',
            shrinkWrap: true,
          ),
        ),
      ],
    );
  }
}
