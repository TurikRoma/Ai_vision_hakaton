import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:mobile/services/scan_history_service.dart';
import 'package:mobile/models.dart';
import 'package:markdown_widget/markdown_widget.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  final ScanHistoryService _scanHistoryService = ScanHistoryService();
  List<DateTime> _scanDates = [];
  Analysis? _selectedAnalysis;

  @override
  void initState() {
    super.initState();
    _loadScanDates();
  }

  Future<void> _loadScanDates() async {
    final dates = await _scanHistoryService.getScanDates();
    setState(() {
      _scanDates = dates;
    });
  }

  Future<void> _onDaySelected(DateTime selectedDay, DateTime focusedDay) async {
    final analysis = await _scanHistoryService.getScanForDate(selectedDay);
    setState(() {
      _selectedDay = selectedDay;
      _focusedDay = focusedDay;
      _selectedAnalysis = analysis;
    });
  }

  @override
  Widget build(BuildContext context) {
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
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
                  final isScanDay = _scanDates.any((scanDate) => isSameDay(scanDate, day));
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
            data: analysis.recommendations ?? 'Рекомендации для этого дня отсутствуют.',
            shrinkWrap: true,
          ),
        ),
      ],
    );
  }
}
