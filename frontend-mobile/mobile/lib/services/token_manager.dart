import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenManager {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _key = 'jwt_token';

  /// Saves the JWT to secure hardware storage
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _key, value: token);
  }

  /// Retrieves the JWT from storage
  static Future<String?> getToken() async {
    return await _storage.read(key: _key);
  }

  /// Deletes the JWT (Logout)
  static Future<void> clearToken() async {
    await _storage.delete(key: _key);
  }
}