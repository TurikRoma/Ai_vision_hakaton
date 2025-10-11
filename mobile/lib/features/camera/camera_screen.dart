import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'dart:async';
import 'package:mobile/features/camera/oval_overlay_painter.dart';
import 'package:mobile/features/camera/face_contour_painter.dart';
import 'package:mobile/services/camera_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  final CameraService _cameraService = CameraService();
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      performanceMode: FaceDetectorMode.accurate,
      enableClassification: true,
      enableLandmarks: true,
      enableContours: false,
      enableTracking: true,
      minFaceSize: 0.15,
    ),
  );
  bool _isCameraInitialized = false;
  String _feedbackMessage = 'Расположите лицо в овале';
  Timer? _detectionTimer;
  // ПАРАМЕТР: Время обратного отсчета (в секундах)
  // Уменьшение значения = быстрее фотографирование
  // Увеличение значения = больше времени на подготовку
  int _countdown = 2;
  Timer? _countdownTimer;
  bool _isProcessing = false;
  Size? _screenSize;
  List<Offset> _faceContourPoints = [];
  Rect? _lastFaceRect;

  // Сглаживание (EMA) и гистерезис
  static const double _emaAlpha = 0.25; // 0..1, больше = быстрее реакция
  double? _emaFaceWidth;
  double? _emaCenterDist;
  bool _distanceOk = false;
  bool _centerOk = false;

  // Диапазоны гистерезиса для расстояния (по ширине лица)
  // Сдвинуты ближе к камере: допускаем большее лицо в кадре
  static const double _distStartLower = 0.40; // чтобы ЗАПУСТИТЬ таймер
  static const double _distStartUpper = 0.70;
  static const double _distCancelLower = 0.35; // чтобы ОТМЕНИТЬ таймер
  static const double _distCancelUpper = 0.75;
  // Гистерезис для центрирования (в пикселях)
  static const double _centerStart = 30.0;  // запустить если <=
  static const double _centerCancel = 45.0; // отменить если >

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    await _cameraService.initialize();
    if (!mounted) return;
    
    setState(() {
      _isCameraInitialized = true;
    });

    _cameraService.startImageStream(_processImage);
  }

  void _processImage(InputImage inputImage) {
    if (_isProcessing) return;
    _isProcessing = true;
    _faceDetector.processImage(inputImage).then((faces) {
      if (mounted) {
        _handleFaceDetectionResult(faces, inputImage.metadata!);
      }
      _isProcessing = false;
    }).catchError((_) {
      _isProcessing = false;
    });
  }

  void _handleFaceDetectionResult(List<Face> faces, InputImageMetadata metadata) {
    String newMessage = 'Расположите лицо в овале';
    bool allConditionsMet = false;
    List<Offset> scaledPoints = [];

    if (_screenSize == null || faces.isEmpty) {
      if (mounted) {
        setState(() {
          _faceContourPoints = [];
        });
      }
      _lastFaceRect = null;
      newMessage = 'Лицо не найдено';
    } else if (faces.length > 1) {
      if (mounted) {
        setState(() {
          _faceContourPoints = [];
        });
      }
      _lastFaceRect = null;
      newMessage = 'Обнаружено несколько лиц';
    } else {
      final face = faces.first;
      final faceBox = face.boundingBox;

      final screenSize = _screenSize!;
      // С учётом поворота изображения из метаданных ML Kit
      final bool rotated90or270 =
          metadata.rotation == InputImageRotation.rotation90deg ||
              metadata.rotation == InputImageRotation.rotation270deg;
      final Size imageSize = rotated90or270
          ? Size(metadata.size.height, metadata.size.width)
          : metadata.size;
      final imageAspectRatio = imageSize.width / imageSize.height;
      final screenAspectRatio = screenSize.width / screenSize.height;

      double scale;
      double offsetX = 0;
      double offsetY = 0;

      if (screenAspectRatio > imageAspectRatio) {
        // Экран шире изображения, изображение заполняет высоту
        scale = screenSize.height / imageSize.height;
        offsetX = (screenSize.width - imageSize.width * scale) / 2;
      } else {
        // Изображение шире экрана, изображение заполняет ширину
        scale = screenSize.width / imageSize.width;
        offsetY = (screenSize.height - imageSize.height * scale) / 2;
      }

      // Масштабируем прямоугольник лица в координаты экрана
      double left = faceBox.left * scale + offsetX;
      double top = faceBox.top * scale + offsetY;
      double right = faceBox.right * scale + offsetX;
      double bottom = faceBox.bottom * scale + offsetY;

      // Отразим по горизонтали для фронтальной камеры, чтобы совпадало с превью
      final bool isFrontCamera =
          _cameraService.controller?.description.lensDirection ==
              CameraLensDirection.front;
      if (isFrontCamera) {
        final double mirroredLeft = screenSize.width - right;
        final double mirroredRight = screenSize.width - left;
        left = mirroredLeft;
        right = mirroredRight;
      }

      final scaledFaceRect = Rect.fromLTRB(left, top, right, bottom);

      // ПАРАМЕТРЫ: Размеры овала на экране (в процентах от размера экрана)
      // ovalWidth: ширина овала (0.8 = 80% ширины экрана)
      // ovalHeight: высота овала (0.5 = 50% высоты экрана)
      // Увеличение значений = больший овал, уменьшение = меньший овал
      final ovalWidth = screenSize.width * 0.8;
      final ovalHeight = screenSize.height * 0.5;
      final ovalRect = Rect.fromCenter(
          center: Offset(screenSize.width / 2, screenSize.height / 2),
          width: ovalWidth,
          height: ovalHeight);

      // Валидация центрирования: допуск ±15% по X/Y
      final double centerDx =
          (scaledFaceRect.center.dx - ovalRect.center.dx).abs();
      final double centerDy =
          (scaledFaceRect.center.dy - ovalRect.center.dy).abs();
      final double centerStartX = screenSize.width * 0.15; // 15%
      final double centerStartY = screenSize.height * 0.15; // 15%
      // Гистерезис для центрирования: чуть шире для отмены
      final double centerCancelX = screenSize.width * 0.20; // 20%
      final double centerCancelY = screenSize.height * 0.20; // 20%
      final bool withinStart = centerDx <= centerStartX && centerDy <= centerStartY;
      final bool withinCancel = centerDx <= centerCancelX && centerDy <= centerCancelY;

      // ПАРАМЕТРЫ: Оптимальное расстояние до камеры
      // Определяется по размеру лица относительно экрана (в процентах)
      final faceWidthRelative = (scaledFaceRect.width) / screenSize.width;
      final faceHeightRelative = (scaledFaceRect.height) / screenSize.height;
      // Жёсткая отсечка «слишком далеко» независимо от EMA/гистерезиса
      const double minHeightRatio = 0.15; // 15% высоты экрана
      const double minWidthRatio = 0.12;  // 12% ширины экрана
      final bool tooFarHard =
          faceHeightRelative < minHeightRatio || faceWidthRelative < minWidthRatio;

      // EMA сглаживание ключевых метрик
      _emaFaceWidth = _emaFaceWidth == null
          ? faceWidthRelative
          : (_emaAlpha * faceWidthRelative + (1 - _emaAlpha) * _emaFaceWidth!);
      final centerDistance =
          (scaledFaceRect.center - ovalRect.center).distance;
      _emaCenterDist = _emaCenterDist == null
          ? centerDistance
          : (_emaAlpha * centerDistance + (1 - _emaAlpha) * _emaCenterDist!);

      // Гистерезис расстояния
      if (_distanceOk) {
        if (_emaFaceWidth! < _distCancelLower || _emaFaceWidth! > _distCancelUpper) {
          _distanceOk = false;
        }
      } else {
        if (_emaFaceWidth! >= _distStartLower && _emaFaceWidth! <= _distStartUpper) {
          _distanceOk = true;
        }
      }

      // Если лицо слишком далеко по жёсткому порогу — сбросить состояние
      if (tooFarHard) {
        _distanceOk = false;
      }

      // Гистерезис центрирования на основе процентных порогов
      if (_centerOk) {
        if (!withinCancel) _centerOk = false;
      } else {
        if (withinStart) _centerOk = true;
      }

      // Минимальные отступы от краев овала (в пикселях)
      final double marginX = (ovalRect.width - scaledFaceRect.width) / 2;
      final double marginY = (ovalRect.height - scaledFaceRect.height) / 2;
      final bool hasGoodMargins = marginX > 10 && marginY > 10;

      // Чувствительность к движению
      double movementDistance = 0;
      if (_lastFaceRect != null) {
        movementDistance =
            (scaledFaceRect.center - _lastFaceRect!.center).distance;
      }
      _lastFaceRect = scaledFaceRect;
      bool isStill = movementDistance < 10;

      // Готовим точки лэндмарков для отрисовки (зелёные точки)
      scaledPoints.clear();
      if (face.landmarks.isNotEmpty) {
        for (final landmark in face.landmarks.values) {
          if (landmark == null) continue;
          double px = landmark.position.x.toDouble() * scale + offsetX;
          double py = landmark.position.y.toDouble() * scale + offsetY;
          if (isFrontCamera) {
            px = screenSize.width - px;
          }
          scaledPoints.add(Offset(px, py));
        }
      }

      // Сообщения с учетом сглаживания и гистерезиса
      if (tooFarHard) {
        newMessage = 'Подойдите ближе';
      } else if (!_distanceOk) {
        newMessage = _emaFaceWidth! < _distStartLower ? 'Подвиньтесь ближе' : 'Отодвиньтесь дальше';
      } else if (!_centerOk) {
        newMessage = 'Расположите лицо по центру';
      } else if (!hasGoodMargins) {
        newMessage = 'Лицо слишком близко к краям овала';
      } else if (!isStill) {
        newMessage = 'Не двигайтесь';
      } else {
        newMessage = 'Отлично!';
        allConditionsMet = true;
      }
    }

    if (mounted) {
      setState(() {
        _feedbackMessage = newMessage;
        _faceContourPoints = scaledPoints; // зелёные точки
      });
    }

    if (allConditionsMet) {
      _startCountdown();
    } else {
      _resetCountdown();
    }
  }

  void _startCountdown() {
    if (_countdownTimer != null) return;
    
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 1) {
        setState(() {
          _countdown--;
        });
      } else {
        timer.cancel();
        _takePicture();
      }
    });
  }

  void _resetCountdown() {
    if (_countdownTimer != null) {
      _countdownTimer?.cancel();
      _countdownTimer = null;
      if (mounted) {
        setState(() {
          _countdown = 3;
        });
      }
    }
  }

  Future<void> _takePicture() async {
    if (!mounted) return;

    setState(() {
      _feedbackMessage = 'Снимок сделан!';
    });

    final image = await _cameraService.takePicture();

    if (image != null && mounted) {
      Navigator.of(context).pop(image.path);
    } else if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  void dispose() {
    _cameraService.stopImageStream();
    _cameraService.dispose();
    _faceDetector.close();
    _detectionTimer?.cancel();
    _countdownTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isCameraInitialized) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          _screenSize = constraints.biggest;
          return Stack(
            fit: StackFit.expand,
            children: [
              CameraPreview(_cameraService.controller!),
              CustomPaint(
                painter: OvalOverlayPainter(),
              ),
              CustomPaint(
                painter: FaceContourPainter(points: _faceContourPoints),
              ),
              Positioned(
                top: 100,
                left: 20,
                right: 20,
                child: Text(
                  _feedbackMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    shadows: [Shadow(blurRadius: 5.0, color: Colors.black54)],
                  ),
                ),
              ),
              if (_countdownTimer != null && _countdown > 0)
                Center(
                  child: Text(
                    '$_countdown',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 80,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}