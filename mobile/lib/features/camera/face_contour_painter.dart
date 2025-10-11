import 'package:flutter/material.dart';

class FaceContourPainter extends CustomPainter {
  final List<Offset> points;

  FaceContourPainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.lightGreenAccent
      ..style = PaintingStyle.fill;

    for (final point in points) {
      canvas.drawCircle(point, 2.5, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}
