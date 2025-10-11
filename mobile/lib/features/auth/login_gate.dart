import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/features/auth/auth_provider.dart';
import 'package:mobile/features/auth/login_screen.dart';

class LoginGate extends ConsumerWidget {
  const LoginGate({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      data: (user) {
        if (user != null) {
          return child;
        } else {
          // Using a builder to push the route after the build is complete.
          return Builder(
            builder: (context) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              });
              // Return a placeholder while navigation is happening.
              return const Scaffold();
            },
          );
        }
      },
      // Show a loading indicator while checking auth state
      loading: () => const Scaffold(body: Center(child: CircularProgressIndicator())),
      // Show an error screen if auth check fails
      error: (error, stack) => Scaffold(body: Center(child: Text('Error: $error'))),
    );
  }
}
