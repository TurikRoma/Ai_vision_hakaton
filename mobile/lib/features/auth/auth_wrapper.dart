import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/main/main_screen.dart';

class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      data: (user) {
        // If user is authenticated (user object is not null), show MainScreen.
        // Otherwise, show MainScreen, which contains logic to prompt for login.
        return const MainScreen();
      },
      loading: () => const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      ),
      error: (error, stackTrace) => Scaffold(
        body: Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }
}
