import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/auth/login_gate.dart';
import 'package:mobile/features/auth/login_screen.dart';
import 'package:mobile/features/camera/camera_screen.dart';
import 'package:mobile/features/processing/processing_screen.dart';
import 'package:mobile/features/profile/profile_screen.dart';
import 'package:mobile/features/result/result_screen.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/features/calendar/calendar_screen.dart';
import 'package:mobile/services/scan_history_service.dart';

enum AppScreen { home, processing, result }

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  AppScreen _currentScreen = AppScreen.home;
  String? _imagePath;
  final ScanHistoryService _scanHistoryService = ScanHistoryService();

  void _navigateTo(AppScreen screen, {String? imagePath}) {
    setState(() {
      _currentScreen = screen;
      _imagePath = imagePath;
    });
  }

  Future<void> _openCamera() async {
    final result = await Navigator.push<String?>(
      context,
      MaterialPageRoute(builder: (context) => const CameraScreen()),
    );

    if (result != null) {
      _navigateTo(AppScreen.processing, imagePath: result);
    }
  }

  Future<void> _pickImageFromGallery() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      _navigateTo(AppScreen.processing, imagePath: pickedFile.path);
    }
  }

  Widget _buildBody() {
    switch (_currentScreen) {
      case AppScreen.processing:
        if (_imagePath == null) {
          Future.microtask(() => _navigateTo(AppScreen.home));
          return const SizedBox.shrink();
        }
        return ProcessingScreen(
          imagePath: _imagePath!,
          onCancel: () => _navigateTo(AppScreen.home),
          onComplete: (path) => _navigateTo(AppScreen.result, imagePath: path),
        );
      case AppScreen.result:
        if (_imagePath == null) {
          Future.microtask(() => _navigateTo(AppScreen.home));
          return const SizedBox.shrink();
        }
        return ResultScreen(
          imagePath: _imagePath!,
          onBack: () => _navigateTo(AppScreen.home),
        );
      case AppScreen.home:
      default:
        return _HomeScreenBody(onUploadPressed: _pickImageFromGallery);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool showFab = _currentScreen == AppScreen.home;
    final bool showBottomNavBar = _currentScreen == AppScreen.home;

    return Scaffold(
      backgroundColor: Colors.white,
      body: _buildBody(),
      floatingActionButton: showFab
          ? FloatingActionButton(
              onPressed: _openCamera,
              backgroundColor: Theme.of(context).primaryColor,
              elevation: 8,
              child: const Icon(Icons.center_focus_strong, color: Colors.white, size: 28),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: showBottomNavBar ? _BottomNavBar(onCameraPress: _openCamera) : null,
    );
  }
}

class _HomeScreenBody extends StatelessWidget {
  final VoidCallback onUploadPressed;
  const _HomeScreenBody({required this.onUploadPressed});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              const _TopContent(),
              const SizedBox(height: 40),
              const _WarningMessages(),
              const SizedBox(height: 40),
              _UploadButton(onPressed: onUploadPressed),
              const SizedBox(height: 80),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopContent extends StatelessWidget {
  const _TopContent();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Replace with actual logo if available
        Text(
          'VitaScan',
          style: GoogleFonts.manrope(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Быстрый анализ\nздоровья по фотографии',
          textAlign: TextAlign.center,
          style: GoogleFonts.manrope(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            height: 1.2,
          ),
        ),
      ],
    );
  }
}

class Warning {
  final String title;
  final String description;

  const Warning({required this.title, required this.description});
}

const List<Warning> _warnings = [
  Warning(
    title: 'Снимите очки',
    description: 'Уберите аксессуары, которые закрывают часть лица.',
  ),
  Warning(
    title: 'Без макияжа',
    description: 'Лёгкий уход — ок. Тональный и плотный макияж — нежелателен.',
  ),
  Warning(
    title: 'Не медицинский совет',
    description: 'Результаты носят ознакомительный характер и не заменяют консультацию врача.',
  ),
];

class _WarningMessages extends StatelessWidget {
  const _WarningMessages();

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: _WarningCard(warning: _warnings[0])),
              const SizedBox(width: 16),
              Expanded(child: _WarningCard(warning: _warnings[1])),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _WarningCard(warning: _warnings[2]),
      ],
    );
  }
}

class _WarningCard extends StatelessWidget {
  final Warning warning;

  const _WarningCard({required this.warning});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            warning.title,
            textAlign: TextAlign.center,
            style: GoogleFonts.manrope(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            warning.description,
            textAlign: TextAlign.center,
            style: GoogleFonts.manrope(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}

class _CenterImage extends StatelessWidget {
  const _CenterImage();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 200,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        image: const DecorationImage(
          image: AssetImage('lib/assets/images/main_screen.png'),
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}

class _UploadButton extends StatelessWidget {
  final VoidCallback onPressed;
  const _UploadButton({required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16),
        minimumSize: const Size.fromHeight(52),
      ),
      child: Text(
        'Загрузить фотографию',
        style: GoogleFonts.manrope(
          fontSize: 16,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _BottomNavBar extends ConsumerWidget {
  final VoidCallback onCameraPress;
  const _BottomNavBar({required this.onCameraPress});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Future<void> onProfileTap() async {
      ref.invalidate(profileAnalysesProvider);
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const LoginGate(child: ProfileScreen()),
        ),
      );
    }

    return BottomAppBar(
      color: Colors.white,
      elevation: 0,
      shape: const CircularNotchedRectangle(),
      notchMargin: 8.0,
      child: SizedBox(
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: <Widget>[
            _NavItem(
              iconPath: 'lib/assets/icons/calendar.svg',
              label: 'Календарь',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CalendarScreen()),
                );
              },
            ),
            const SizedBox(width: 40), // The space for the FAB
            _NavItem(
              iconPath: 'lib/assets/icons/profile.svg',
              label: 'Профиль',
              onPressed: onProfileTap,
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.iconPath,
    required this.label,
    required this.onPressed,
  });

  final String iconPath;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(24),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 12.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset(
              iconPath,
              colorFilter: const ColorFilter.mode(Colors.grey, BlendMode.srcIn),
              width: 24,
              height: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.manrope(
                fontSize: 11,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
