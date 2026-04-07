import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:friend_connector_mobile/services/constants.dart';

class ApiService {
  // Use 10.0.2.2 if on Android Emulator, localhost if on Linux/Web
  static const String baseUrl = localUrl;

  static Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'login': username,
          'password': password,
          'jwtToken': null,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to login: ${response.body}');
      }
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> register(
      String fn, String ln, String email, String user, String pass, String bday) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'firstName': fn,
          'lastName': ln,
          'username': user,
          'email': email,
          'password': pass,
          'birthday': bday
        }),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': e.toString()};
    }
  }
}