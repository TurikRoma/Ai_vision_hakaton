import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ProcessingScreen extends StatefulWidget {
  final String imagePath;
  final VoidCallback onCancel;
  final Function(String) onComplete;

  const ProcessingScreen({
    super.key,
    required this.imagePath,
    required this.onCancel,
    required this.onComplete,
  });

  @override
  State<ProcessingScreen> createState() => _ProcessingScreenState();
}

class _ProcessingScreenState extends State<ProcessingScreen> {
  @override
  void initState() {
    super.initState();
    // Таймер на 4 секунды для имитации обработки
    Timer(const Duration(seconds: 4), () {
      if (mounted) {
        widget.onComplete(widget.imagePath);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                Text(
                  'Анализируем ваше фото...',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.manrope(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            top: 40,
            right: 16,
            child: SafeArea(
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.black54, size: 30),
                onPressed: widget.onCancel,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
