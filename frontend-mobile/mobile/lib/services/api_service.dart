import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:friend_connector_mobile/services/constants.dart';
import 'package:friend_connector_mobile/services/token_manager.dart';

class ApiService {
  static const String _baseUrl = prodUrl;

  /// Private helper to handle the "Sliding Session" logic
  /// Automatically updates the stored JWT if the backend sends a fresh one
  static Future<void> _updateSession(Map<String, dynamic> data) async {
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
      // 1. Get the current token
      final token = await TokenManager.getToken();

      // 2. Use the new endpoint path
      final response = await http.post(
        Uri.parse('$_baseUrl/friends'),
        headers: {
          'Content-Type': 'application/json',
          // 3. Move token to Authorization header as Bearer
          'Authorization': 'Bearer $token',
        },
        // 4. Body now only requires the username
        body: jsonEncode({
          'username': username,
        }),
      );

      final data = jsonDecode(response.body);

      // 5. Update session to handle the sliding window (refreshed accessToken)
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

  // --- USERS & SEARCH ---

  static Future<Map<String, dynamic>> getUsers({
    String search = "",
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final token = await TokenManager.getToken();
      final Uri uri = Uri.parse('$_baseUrl/users').replace(
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
        return {'error': data['error'] ?? 'Failed to fetch users'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  // --- CONVERSATIONS & MESSAGES ---

  /// Matches Web App: logic to find or create a conversation
  static Future<Map<String, dynamic>> startConversation(String friendId) async {
    try {
      final token = await TokenManager.getToken();
      final response = await http.post(
        Uri.parse('$_baseUrl/conversations'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'friendId': friendId}),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        await _updateSession(data);
        return data;
      } else {
        return {'error': data['error'] ?? 'Failed to start conversation'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> getConversations() async {
    try {
      final token = await TokenManager.getToken();
      final response = await http.get(
        Uri.parse('$_baseUrl/conversations'),
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
        return {'error': data['error'] ?? 'Failed to fetch conversations'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> sendMessage({
    required String senderID,
    required String conversationID,
    required String message,
  }) async {
    try {
      final token = await TokenManager.getToken();
      final response = await http.post(
        Uri.parse('$_baseUrl/messages'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'senderID': senderID,
          'conversationID': conversationID,
          'message': message,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      if (response.statusCode == 200 && (data['error'] == null || data['error'].isEmpty)) {
        await _updateSession(data);
        return data;
      } else {
        return {'error': data['error'] ?? 'Failed to send message'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> getMessages({
    required String senderID,
    required String conversationID,
  }) async {
    try {
      final token = await TokenManager.getToken();
      final Uri uri = Uri.parse('$_baseUrl/messages').replace(
        queryParameters: {
          'senderID': senderID,
          'conversationID': conversationID,
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
      if (response.statusCode == 200 && (data['error'] == null || data['error'].isEmpty)) {
        await _updateSession(data);
        return data;
      } else {
        return {'error': data['error'] ?? 'Failed to fetch messages'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  // --- TOKEN HELPERS ---

  /// Robustly decodes the JWT to get the User ID
  static Future<String?> getUserIdFromToken() async {
    final token = await TokenManager.getToken();
    if (token == null || token.isEmpty) return null;

    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;

      // Base64Url requires specific normalization in Dart for the payload
      String payload = parts[1];
      payload = base64Url.normalize(payload);

      final String decoded = utf8.decode(base64Url.decode(payload));
      final Map<String, dynamic> payloadMap = json.decode(decoded);

      // Web App uses ud._id || ud.id; we mirror that here.
      final dynamic userId = payloadMap['id'] ?? payloadMap['_id'] ?? payloadMap['userId'];

      return userId?.toString();
    } catch (e) {
      print("JWT Decode Error: $e");
      return null;
    }
  }

  static Future<Map<String, dynamic>> getNotifications() async {
    try {
      final token = await TokenManager.getToken();
      final response = await http.get(
        Uri.parse('$_baseUrl/notifications'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      await _updateSession(data);
      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> sendNotification({
    required String recipientId,
    required String type,
    required String content,
    required String relatedId,
  }) async {
    try {
      final token = await TokenManager.getToken();
      final response = await http.post(
        Uri.parse('$_baseUrl/notifications'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'recipientId': recipientId,
          'type': type,
          'content': content,
          'relatedId': relatedId,
        }),
      );
      final data = jsonDecode(response.body);
      await _updateSession(data);
      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> markNotificationRead(String notificationId) async {
    try {
      final token = await TokenManager.getToken();
      final response = await http.post(
        Uri.parse('$_baseUrl/mark-notification-read'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'notificationId': notificationId}),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      await _updateSession(data);
      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> createSupportRequest(String content, String type) async {
    // Optional: Frontend validation to match backend validTypes
    const validTypes = ["Encouragement", "Advice", "Chat", "Celebrate"];
    if (!validTypes.contains(type)) {
      return {'error': 'Invalid type. Must be: Encouragement, Advice, Chat, or Celebrate.'};
    }

    try {
      final token = await TokenManager.getToken();
      if (token == null) return {'error': 'No token provided.'};

      final response = await http.post(
        Uri.parse('$_baseUrl/support-requests'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'content': content,
          'type': type,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      await _updateSession(data);

      if (response.statusCode == 200) {
        return data;
      } else {
        return {'error': data['error'] ?? 'Failed to create support request'};
      }
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> getSupportRequests({String? type}) async {
    try {
      final token = await TokenManager.getToken();
      final uri = Uri.parse('$_baseUrl/support-requests').replace(
        queryParameters: type != null ? {'type': type} : {},
      );

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final Map<String, dynamic> data = jsonDecode(response.body);
      await _updateSession(data);
      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }


  static Future<Map<String, dynamic>> getRandomPrompt(String conversationId) async {
    try {
      final uri = Uri.parse('$_baseUrl/return-random-prompt')
          .replace(queryParameters: {'conversationId': conversationId});

      final response = await http.get(uri);
      return jsonDecode(response.body);
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> acceptFriendRequest(String senderId, String friendshipId) async {
    try {
      final token = await TokenManager.getToken();
      if (token == null) return {'error': 'No token found'};

      final response = await http.post(
        Uri.parse('$_baseUrl/accept-friend-request'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'senderId': senderId,
          'friendship_id': friendshipId,
        }),
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      await _updateSession(data);

      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> getSmartReply(String conversationId) async {
    try {
      final token = await TokenManager.getToken();

      final response = await http.post(
        Uri.parse('$_baseUrl/conversations/$conversationId/smart-reply'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final Map<String, dynamic> data = jsonDecode(response.body);

      await _updateSession(data);

      return data;
    } catch (e) {
      return {'error': 'Connection failed: $e'};
    }
  }

  static Future<Map<String, dynamic>> getFriendProfile(String friendId) async {
      try {
        final token = await TokenManager.getToken();
        if (token == null) return {'error': 'No token provided.'};

        final response = await http.get(
          Uri.parse('$_baseUrl/friend-profile/$friendId'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );

        final Map<String, dynamic> data = jsonDecode(response.body);

        await _updateSession(data);

        return data;
      } catch (e) {
        return {'error': 'Connection failed: $e'};
      }
    }

}