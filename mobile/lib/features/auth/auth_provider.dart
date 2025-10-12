import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decode/jwt_decode.dart';
import 'package:mobile/models.dart';
import 'package:mobile/services/api_client.dart';
import 'package:mobile/services/providers.dart';
import 'package:mobile/services/token_storage_service.dart';

// 1. Провайдер для FlutterSecureStorage
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

// 2. Провайдер для TokenStorageService
final tokenStorageServiceProvider = Provider<TokenStorageService>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  return TokenStorageService(secureStorage);
});

// 3. Провайдер для ApiClient
final apiClientProvider = Provider<ApiClient>((ref) {
  final tokenStorageService = ref.watch(tokenStorageServiceProvider);
  return ApiClient(tokenStorageService);
});

// 4. Провайдер состояния аутентификации
final authProvider =
    AsyncNotifierProvider<AuthNotifier, AuthenticatedUser?>(AuthNotifier.new);

class AuthNotifier extends AsyncNotifier<AuthenticatedUser?> {
  @override
  Future<AuthenticatedUser?> build() async {
    final tokenStorageService = ref.read(tokenStorageServiceProvider);
    final accessToken = await tokenStorageService.getAccessToken();
    if (accessToken == null) {
      return null;
    }
    final payload = Jwt.parseJwt(accessToken);
    return AuthenticatedUser(email: payload['sub']);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final apiClient = ref.read(apiClientProvider);
      final tokenStorageService = ref.read(tokenStorageServiceProvider);

      await apiClient.login(email, password);

      final accessToken = await tokenStorageService.getAccessToken();
      final payload = Jwt.parseJwt(accessToken!);
      return AuthenticatedUser(email: payload['sub']);
    });
  }

  Future<void> signup(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final apiClient = ref.read(apiClientProvider);
      final tokenStorageService = ref.read(tokenStorageServiceProvider);

      await apiClient.signup(email, password);

      final accessToken = await tokenStorageService.getAccessToken();
      final payload = Jwt.parseJwt(accessToken!);
      return AuthenticatedUser(email: payload['sub']);
    });
  }

  Future<void> logout() async {
    final apiClient = ref.read(apiClientProvider);
    final scanHistoryService = ref.read(scanHistoryServiceProvider);
    await apiClient.logout();
    await scanHistoryService.clearHistory();
    ref.invalidate(profileAnalysesProvider);
    state = const AsyncValue.data(null);
  }
}

// 5. Провайдер для данных профиля (анализов)
final profileAnalysesProvider = FutureProvider<List<Analysis>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  return apiClient.getAnalyses();
});
