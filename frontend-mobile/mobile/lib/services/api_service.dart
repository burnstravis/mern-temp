import 'dart:convert';
import 'package:flutter/cupertino.dart';
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
        }),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);

        debugPrint("Server Response: $data");

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
}