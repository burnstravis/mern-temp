import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:friend_connector_mobile/services/constants.dart';

class ApiService {
  // Use 10.0.2.2 if on Android Emulator, localhost if on Linux/Web
  static const String baseUrl = prodUrl;

  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'login': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        return data;
      } else {
        return {'error': 'Server returned status ${response.statusCode}'};
      }
    } catch (e) {
      return {'error': 'Connection failed.'};
    }
  }


  static Future<Map<String, dynamic>> register(
      String firstName,
      String lastName,
      String email,
      String username,
      String password,
      String birthday
      ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
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

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {

        final Map<String, dynamic> errorResponse = jsonDecode(response.body);
        return {'error': errorResponse['error'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> verifyEmail(
      String email,
      String code
      ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/verify-email'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'code': code
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {

        final Map<String, dynamic> errorResponse = jsonDecode(response.body);
        return {'error': errorResponse['error'] ?? 'Verification failed'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> resetPassword(
      String email,
      String verificationCode,
      String newPassword,
      String confirmpassword
      ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'verificationCode': verificationCode,
          'password': newPassword,
          'confirmpassword': confirmpassword
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {

        final Map<String, dynamic> errorResponse = jsonDecode(response.body);
        return {'error': errorResponse['error'] ?? 'Reset Password failed'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> emailRecovery(
      String email
      ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/email-recovery'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {

        final Map<String, dynamic> errorResponse = jsonDecode(response.body);
        return {'error': errorResponse['error'] ?? 'Email Recovery failed'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> friendsList({
      required String jwtToken,
      String search = "",
      int page = 1,
      int limit = 10,
    }) async {
      try {
        final Uri uri = Uri.parse('$baseUrl/api/friends').replace(
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
            'Authorization': 'Bearer $jwtToken',
          },
        );

        final Map<String, dynamic> data = jsonDecode(response.body);

        if (response.statusCode == 200) {
          return data;
        } else {
          return {'error': data['error'] ?? 'Failed to fetch friends'};
        }
      } catch (e) {
        return {'error': 'Connection failed: $e'};
      }
    }

  static Future<Map<String, dynamic>> addFriend(
      String username,
      String jwtToken,
      ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/add-friend'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'jwtToken': jwtToken,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else {
        return {'error': 'Server error ${response.statusCode}'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

}