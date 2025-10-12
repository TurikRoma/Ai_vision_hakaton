import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:mobile/models.dart';
import 'package:markdown_widget/markdown_widget.dart';

class AnalysisDetailsScreen extends StatelessWidget {
  final Analysis analysis;

  const AnalysisDetailsScreen({super.key, required this.analysis});

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
                    centerSpaceRadius: diameter * 0.35,
                    sections: [
                      PieChartSectionData(
                        value: value.toDouble(),
                        color: color,
                        radius: 12.0,
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

  Widget _metricsGrid() {
    final negativeValues = {
      if (analysis.puffiness != null) 'Отёчность': analysis.puffiness!,
      if (analysis.darkCircles != null) 'Тёмные круги': analysis.darkCircles!,
      if (analysis.fatigue != null) 'Усталость': analysis.fatigue!,
      if (analysis.acne != null) 'Акне': analysis.acne!,
    };
    final positiveValues = {
      if (analysis.skinHealth != null)
        'Здоровье кожи': analysis.skinHealth!,
      if (analysis.eyesHealth != null)
        'Здоровье глаз': analysis.eyesHealth!,
    };

    if (negativeValues.isEmpty && positiveValues.isEmpty) {
      return const SizedBox.shrink();
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        const double spacing = 10;
        final double tileWidth = (constraints.maxWidth - spacing) / 2;

        final negativeItems = negativeValues.entries.map((entry) {
          return _metricItem(entry.key, entry.value, tileWidth);
        }).toList();

        final positiveItems = positiveValues.entries.map((entry) {
          return _metricItem(entry.key, entry.value, tileWidth,
              isPositive: true);
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
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Результаты анализа',
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
              if (analysis.imagePath != null &&
                  analysis.imagePath!.isNotEmpty)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16.0),
                  child: Image.network(
                    analysis.imagePath!,
                    height: 250,
                    fit: BoxFit.cover,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 250,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: CircularProgressIndicator(
                            value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                          ),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: 250,
                        decoration: BoxDecoration(
                          color: Colors.grey[200],
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(
                          Icons.image_not_supported_outlined,
                          color: Colors.grey[400],
                          size: 80,
                        ),
                      );
                    },
                  ),
                )
              else
                // Placeholder for the image
                AspectRatio(
                  aspectRatio: 4 / 3,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      Icons.image_outlined,
                      color: Colors.grey[400],
                      size: 80,
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              _metricsGrid(),
              const SizedBox(height: 16),
              if (analysis.skinCondition != null &&
                  analysis.skinCondition!.isNotEmpty) ...[
                Text(
                  'Состояние кожи',
                  style: GoogleFonts.manrope(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                MarkdownWidget(
                  data: analysis.skinCondition!,
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
                const SizedBox(height: 16),
              ],
              if (analysis.recommendations != null &&
                  analysis.recommendations!.isNotEmpty) ...[
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
                  data: analysis.recommendations!,
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
              ],
            ],
          ),
        ),
      ),
    );
  }
}

