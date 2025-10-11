import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/auth/login_screen.dart';

class ResultScreen extends ConsumerWidget {
  final String imagePath;
  final VoidCallback? onBack;

  const ResultScreen({super.key, required this.imagePath, this.onBack});

  Color _colorForValue(int value) {
    if (value <= 33) return const Color(0xFF16A34A); // green до 33
    if (value <= 66) return const Color(0xFFEAB308); // yellow до 66
    return const Color(0xFFDC2626); // red до 100
  }

  Widget _metricItem(String title, int value, double tileWidth) {
    final Color color = _colorForValue(value);
    const double diameter = 160.0; // БОЛЬШОЙ ДИАМЕТР
    const double fontSize = 28.0;

    return Container(
      width: tileWidth,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: diameter,
            width: diameter,
            child: Stack(
              alignment: Alignment.center,
              children: [
                PieChart(
                  PieChartData(
                    startDegreeOffset: -90,
                    sectionsSpace: 0,
                    centerSpaceRadius: diameter * 0.35, // ОГРОМНОЕ ВНУТРЕННЕЕ ПРОСТРАНСТВО
                    sections: [
                      PieChartSectionData(
                        value: value.toDouble(),
                        color: color,
                        radius: 12.0, // ТОНКОЕ КОЛЬЦО
                        showTitle: false,
                      ),
                      PieChartSectionData(
                        value: (100 - value).toDouble(),
                        color: const Color(0xFFF3F4F6),
                        radius: 12.0,
                        showTitle: false,
                      ),
                    ],
                  ),
                ),
                Text(
                  '$value%',
                  style: GoogleFonts.manrope(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.manrope(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricsGrid(Map<String, int> values) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const double spacing = 10;
        final double tileWidth = (constraints.maxWidth - spacing) / 2;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            _metricItem('Качество сна', values['Качество сна']!, tileWidth),
            _metricItem('Уровень стресса', values['Уровень стресса']!, tileWidth),
            _metricItem('Гидратация', values['Гидратация']!, tileWidth),
            _metricItem('Состояние кожи', values['Состояние кожи']!, tileWidth),
            _metricItem('Энергия', values['Энергия']!, tileWidth),
          ],
        );
      },
    );
  }

  String _buildRecommendations(Map<String, int> values) {
    final List<String> parts = [];
    final low =
        values.entries.where((e) => e.value < 40).map((e) => e.key).toList();
    final mid = values.entries
        .where((e) => e.value >= 40 && e.value < 70)
        .map((e) => e.key)
        .toList();

    if (low.isNotEmpty) {
      parts.add(
          'Обратите внимание: ${low.join(', ')} — рекомендуем консультацию со специалистом и корректировку режима.');
    }
    if (mid.isNotEmpty) {
      parts.add(
          'Умеренные отклонения: ${mid.join(', ')} — поддерживайте баланс сна, воды и активности.');
    }
    if (parts.isEmpty) {
      parts.add('Показатели в норме. Продолжайте поддерживать здоровые привычки.');
    }
    return parts.join('\n\n');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    // Временные значения параметров (0..100)
    final Map<String, int> values = {
      'Качество сна': 76,
      'Уровень стресса': 52,
      'Гидратация': 63,
      'Состояние кожи': 34,
      'Энергия': 88,
    };
    final recommendations = _buildRecommendations(values);
    final skinCondition =
        'На основе анализа, состояние кожи оценено в ${values['Состояние кожи']}%.';

    Future<void> onSavePressed() async {
      if (authState.value == null) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
        return;
      }
      try {
        final apiClient = ref.read(apiClientProvider);
        final analysisData = {
          'recommendations': recommendations,
          'puffiness': values['Гидратация']!.toString(), // Assuming puffiness maps to Hydration
          'dark_circles': values['Уровень стресса']!.toString(), // Assuming maps to Stress
          'fatigue': values['Качество сна']!.toString(), // Assuming maps to Sleep Quality
          'acne': values['Состояние кожи']!.toString(), // Assuming maps to Skin Condition
          'skin_condition': skinCondition,
        };
        await apiClient.createAnalysis(imagePath, analysisData);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Анализ успешно сохранён'),
            backgroundColor: Colors.green,
          ),
        );
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Ошибка сохранения: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            if (onBack != null) {
              onBack!();
            } else {
              Navigator.of(context).maybePop();
            }
          },
        ),
        title: Text(
          'Результаты',
          style: GoogleFonts.manrope(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Image.file(
                    File(imagePath),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              _metricsGrid(values),
              const SizedBox(height: 16),
              Text(
                'Рекомендации',
                style: GoogleFonts.manrope(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _buildRecommendations(values),
                style: GoogleFonts.manrope(
                  fontSize: 14,
                  color: Colors.black87,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: onSavePressed,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Theme.of(context).primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(
                  'Сохранить',
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
