import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Chat & Messaging Integration', () {

    test('Fetch Messages should handle empty or valid conversations', () async {
      final result = await ApiService.getMessages(
          senderID: 'user123',
          conversationID: 'conv456'
      );

      expect(result, isA<Map<String, dynamic>>());

      if (result.containsKey('messages')) {
        expect(result['messages'], isA<List>());
      }
    });

    test('Send Message correctly identifies missing authorization', () async {
      final result = await ApiService.sendMessage(
          senderID: 'me',
          conversationID: 'chat1',
          message: 'Hello World'
      );

      expect(result.containsKey('error'), isTrue);
    });
  });
}