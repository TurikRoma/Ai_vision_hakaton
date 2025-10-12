import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/models.dart';
import 'package:mobile/services/token_storage_service.dart';
import 'package:path/path.dart' as p;

class ApiClient {
  ApiClient(this._tokenStorageService)
      : _baseUrl = dotenv.env['BACKEND_URL']!,
        _internalApiKey = dotenv.env['INTERNAL_API_KEY']!;

  final TokenStorageService _tokenStorageService;
  final String _baseUrl;
  final String _internalApiKey;

  Future<http.Response> _post(
    String path, {
    bool authenticated = false,
    bool internal = false,
    Object? body,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (authenticated) {
      final accessToken = await _tokenStorageService.getAccessToken();
      headers['Authorization'] = 'Bearer $accessToken';
    }
    if (internal) {
      headers['X-API-Key'] = _internalApiKey;
    }

    var response = await http.post(
      Uri.parse('$_baseUrl$path'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );

    if (authenticated && (response.statusCode == 401 || response.statusCode == 403)) {
      final newTokens = await _refreshToken();
      if (newTokens != null) {
        headers['Authorization'] = 'Bearer ${newTokens['access_token']}';
        response = await http.post(
          Uri.parse('$_baseUrl$path'),
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
      } else {
        await _tokenStorageService.deleteTokens();
        // Here you might want to navigate the user to the login screen.
        // This can be handled by the auth provider.
      }
    }

    return response;
  }

  Future<http.Response> _get(
    String path, {
    bool authenticated = false,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (authenticated) {
      final accessToken = await _tokenStorageService.getAccessToken();
      headers['Authorization'] = 'Bearer $accessToken';
    }

    var response = await http.get(
      Uri.parse('$_baseUrl$path'),
      headers: headers,
    );

    if (authenticated && (response.statusCode == 401 || response.statusCode == 403)) {
      final newTokens = await _refreshToken();
      if (newTokens != null) {
        headers['Authorization'] = 'Bearer ${newTokens['access_token']}';
        response = await http.get(
          Uri.parse('$_baseUrl$path'),
          headers: headers,
        );
      } else {
        await _tokenStorageService.deleteTokens();
        // Here you might want to navigate the user to the login screen.
        // This can be handled by the auth provider.
      }
    }

    return response;
  }

  Future<http.StreamedResponse> _multipartPost(
    String path, {
    bool authenticated = false,
    Map<String, String>? fields,
    String? filePath,
    String fileFieldName = 'file',
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = http.MultipartRequest('POST', uri);

    if (authenticated) {
      final accessToken = await _tokenStorageService.getAccessToken();
      if (accessToken != null) {
        request.headers['Authorization'] = 'Bearer $accessToken';
      }
    }

    if (fields != null) {
      request.fields.addAll(fields);
    }

    if (filePath != null) {
      final file = await http.MultipartFile.fromPath(
        fileFieldName,
        filePath,
        filename: p.basename(filePath),
      );
      request.files.add(file);
    }

    var response = await request.send();

    if (authenticated && (response.statusCode == 401 || response.statusCode == 403)) {
      final newTokens = await _refreshToken();
      if (newTokens != null) {
        // Resend the request with the new token
        final newRequest = http.MultipartRequest('POST', uri);
        newRequest.headers['Authorization'] = 'Bearer ${newTokens['access_token']}';
        if (fields != null) {
          newRequest.fields.addAll(fields);
        }
        if (filePath != null) {
          final file = await http.MultipartFile.fromPath(
            fileFieldName,
            filePath,
            filename: p.basename(filePath),
          );
          newRequest.files.add(file);
        }
        response = await newRequest.send();
      } else {
        await _tokenStorageService.deleteTokens();
      }
    }

    return response;
  }

  Future<Map<String, dynamic>?> _refreshToken() async {
    final refreshToken = await _tokenStorageService.getRefreshToken();
    if (refreshToken == null) return null;

    final response = await http.post(
      Uri.parse('$_baseUrl/auth/refresh'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refresh_token': refreshToken}),
    );

    if (response.statusCode == 200) {
      final newTokens = jsonDecode(response.body);
      await _tokenStorageService.saveTokens(
        accessToken: newTokens['access_token'],
        refreshToken: newTokens['refresh_token'],
      );
      return newTokens;
    } else {
      return null;
    }
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _post(
      '/auth/login',
      body: {'email': email, 'password': password},
    );

    if (response.statusCode == 200) {
      final tokens = jsonDecode(response.body);
      await _tokenStorageService.saveTokens(
        accessToken: tokens['access_token'],
        refreshToken: tokens['refresh_token'],
      );
      return tokens;
    } else {
      // Consider more specific error handling based on status code
      throw Exception('Failed to login');
    }
  }

  Future<Map<String, dynamic>> signup(String email, String password) async {
    final response = await _post(
      '/auth/signup',
      body: {'email': email, 'password': password},
    );

    if (response.statusCode == 200) {
      final tokens = jsonDecode(response.body);
      await _tokenStorageService.saveTokens(
        accessToken: tokens['access_token'],
        refreshToken: tokens['refresh_token'],
      );
      return tokens;
    } else {
      throw Exception('Failed to sign up');
    }
  }

  Future<void> logout() async {
    final refreshToken = await _tokenStorageService.getRefreshToken();
    if (refreshToken != null) {
      await _post('/auth/logout', body: {'refresh_token': refreshToken});
    }
    await _tokenStorageService.deleteTokens();
  }

  // Example of an authenticated endpoint
  Future<List<Analysis>> getAnalyses() async {
    final response = await _get('/analyses/', authenticated: true);
    if (response.statusCode == 200) {
      final List<dynamic> analysesJson = jsonDecode(response.body);
      return analysesJson.map((json) => Analysis.fromJson(json)).toList();
    } else {
      throw Exception('Failed to get analyses');
    }
  }

  Future<Analysis> processImage(String filePath) async {
    final response = await _multipartPost(
      '/analyses/process',
      filePath: filePath,
    );

    if (response.statusCode == 200) {
      final responseBody = await response.stream.bytesToString();
      return Analysis.fromJson(jsonDecode(responseBody));
    } else {
      final responseBody = await response.stream.bytesToString();
      throw Exception('Failed to process image: $responseBody');
    }
  }

  Future<Analysis> createAnalysis(
    String filePath,
    Analysis analysisData,
  ) async {
    final fields = {
      'recommendations': analysisData.recommendations ?? '',
      'puffiness': analysisData.puffiness?.toString() ?? '0',
      'dark_circles': analysisData.darkCircles?.toString() ?? '0',
      'fatigue': analysisData.fatigue?.toString() ?? '0',
      'acne': analysisData.acne?.toString() ?? '0',
      'skin_condition': analysisData.skinCondition ?? '',
      'eyes_health': analysisData.eyesHealth?.toString() ?? '0',
      'skin_health': analysisData.skinHealth?.toString() ?? '0',
    };

    final response = await _multipartPost(
      '/analyses/',
      authenticated: true,
      fields: fields,
      filePath: filePath,
    );

    if (response.statusCode == 200) {
      final responseBody = await response.stream.bytesToString();
      return Analysis.fromJson(jsonDecode(responseBody));
    } else {
      final responseBody = await response.stream.bytesToString();
      throw Exception('Failed to create analysis: $responseBody');
    }
  }
}
