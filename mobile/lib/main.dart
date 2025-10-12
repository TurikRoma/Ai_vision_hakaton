import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile/features/auth/auth_wrapper.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: "env.txt");
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'VitaScan',
      theme: _buildTheme(),
      home: const AuthWrapper(),
    );
  }
}

ThemeData _buildTheme() {
  final baseTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    primaryColor: const Color(0xFF22C55E),
    scaffoldBackgroundColor: Colors.white,
    colorScheme: const ColorScheme.light(
      primary: Color(0xFF22C55E),
      secondary: Color(0xFF22C55E),
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      background: Colors.white,
      onBackground: Colors.black,
      surface: Colors.white,
      onSurface: Colors.black,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      elevation: 0,
      iconTheme: IconThemeData(color: Colors.black),
    ),
  );

  return baseTheme.copyWith(
    textTheme: GoogleFonts.manropeTextTheme(baseTheme.textTheme),
  );
}
