import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:markdown_widget/markdown_widget.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/auth/login_screen.dart';
import 'package:mobile/models.dart';

class ResultScreen extends ConsumerStatefulWidget {
  final String imagePath;
  final VoidCallback? onBack;

  const ResultScreen({super.key, required this.imagePath, this.onBack});

  @override
  ConsumerState<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends ConsumerState<ResultScreen> {
  Future<Analysis>? _analysisFuture;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _runAnalysis();
    });
  }

  void _runAnalysis() {
    final apiClient = ref.read(apiClientProvider);
    final initialData = {
      'recommendations': 'generating...',
      'puffiness': '0',
      'dark_circles': '0',
      'fatigue': '0',
      'acne': '0',
      'skin_condition': 'generating...',
    };
    setState(() {
      _analysisFuture = apiClient.createAnalysis(widget.imagePath, initialData);
    });
  }

  // "Негативные" метрики: чем меньше, тем лучше
  Color _colorForNegativeValue(int value) {
    if (value <= 33) return const Color(0xFF16A34A); // green
    if (value <= 66) return const Color(0xFFEAB308); // yellow
    return const Color(0xFFDC2626); // red
  }

  // "Позитивные" метрики: чем больше, тем лучше
  Color _colorForPositiveValue(int value) {
    if (value >= 66) return const Color(0xFF16A34A); // green
    if (value >= 33) return const Color(0xFFEAB308); // yellow
    return const Color(0xFFDC2626); // red
  }

  Widget _metricItem(String title, int value, double tileWidth, {bool isPositive = false}) {
    final Color color = isPositive ? _colorForPositiveValue(value) : _colorForNegativeValue(value);
    const double diameter = 160.0;
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

  Widget _metricsGrid(Map<String, int> values, Map<String, int> positiveValues) {
    return LayoutBuilder(
      builder: (context, constraints) {
        const double spacing = 10;
        final double tileWidth = (constraints.maxWidth - spacing) / 2;
        
        final negativeItems = values.entries.map((entry) {
          return _metricItem(entry.key, entry.value, tileWidth);
        }).toList();

        final positiveItems = positiveValues.entries.map((entry) {
          return _metricItem(entry.key, entry.value, tileWidth, isPositive: true);
        }).toList();

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [...negativeItems, ...positiveItems],
        );
      },
    );
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
            if (widget.onBack != null) {
              widget.onBack!();
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
        child: FutureBuilder<Analysis>(
          future: _analysisFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Идет анализ...', style: TextStyle(fontSize: 16)),
                  ],
                ),
              );
            } else if (snapshot.hasError) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    'Произошла ошибка при анализе: ${snapshot.error}',
                    textAlign: TextAlign.center,
                  ),
                ),
              );
            } else if (!snapshot.hasData) {
              return const Center(child: Text('Нет данных для отображения.'));
            }

            final analysis = snapshot.data!;
            final negativeValues = {
              'Отечность': analysis.puffiness ?? 0,
              'Темные круги': analysis.darkCircles ?? 0,
              'Усталость': analysis.fatigue ?? 0,
              'Акне': analysis.acne ?? 0,
            };
            final positiveValues = {
              'Здоровье кожи': analysis.skinHealth ?? 0,
              'Здоровье глаз': analysis.eyesHealth ?? 0,
            };

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: AspectRatio(
                      aspectRatio: 4 / 3,
                      child: Image.file(
                        File(widget.imagePath),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _metricsGrid(negativeValues, positiveValues),
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
                  MarkdownWidget(
                    data: analysis.recommendations ?? 'Рекомендации отсутствуют.',
                    shrinkWrap: true,
                    config: MarkdownConfig(
                      configs: [
                        PConfig(
                          textStyle: GoogleFonts.manrope(
                            fontSize: 14,
                            color: Colors.black87,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      if (widget.onBack != null) {
                        widget.onBack!();
                      } else {
                        // Возвращаемся на главный экран
                        Navigator.of(context).popUntil((route) => route.isFirst);
                      }
                    },
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
            );
          },
        ),
      ),
    );
  }
}
