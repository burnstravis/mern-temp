import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:friend_connector_mobile/services/constants.dart';
import 'package:friend_connector_mobile/services/token_manager.dart';

class ApiService {
  static const String _baseUrl = localUrl;


  /// Private helper to handle the "Sliding Session" logic
  /// Automatically updates the stored JWT if the backend sends a fresh one
  static Future<void> _updateSession(Map<String, dynamic> data) async {
    // Check if accessToken exists AND isn't empty
    if (data.containsKey('accessToken') &&
        data['accessToken'] != null &&
        data['accessToken'].toString().length > 10) {
      await TokenManager.saveToken(data['accessToken']);
    }
  }

  // --- AUTHENTICATION ---

  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'login': username, 'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['accessToken'] != null) {
        await TokenManager.saveToken(data['accessToken']);
      }
      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> register(
      String firstName,
      String lastName,
      String email,
      String username,
      String password,
      String birthday) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'username': username,
          'password': password,
          'birthday': birthday,
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  // --- FRIENDS & SOCIAL ---

  static Future<Map<String, dynamic>> friendsList({
    String search = "",
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final token = await TokenManager.getToken();

      final Uri uri = Uri.parse('$_baseUrl/friends').replace(
        queryParameters: {
          'search': search,
          'page': page.toString(),
          'limit': limit.toString(),
        },
      );

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        await _updateSession(data);
        return data;
      } else {
        return {'error': data['error'] ?? 'Failed to fetch friends'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> addFriend(String username) async {
    try {
      final token = await TokenManager.getToken();

      final response = await http.post(
        Uri.parse('$_baseUrl/add-friend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'jwtToken': token,
        }),
      );

      final data = jsonDecode(response.body);
      await _updateSession(data);
      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  // --- ACCOUNT RECOVERY & VERIFICATION ---

  static Future<Map<String, dynamic>> verifyEmail(String email, String code) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/verify-email'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'code': code}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> emailRecovery(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/email-recovery'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> resetPassword(
      String email,
      String verificationCode,
      String password,
      String confirmpassword) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'verificationCode': verificationCode,
          'password': password,
          'confirmpassword': confirmpassword
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }
}