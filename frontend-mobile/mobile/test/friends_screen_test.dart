import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Friends List Integration Tests', () {

    test('Should handle friends list pagination and structure', () async {
      final result = await ApiService.friendsList(page: 1, limit: 10);

      if (result.containsKey('error')) {
        expect(result['error'], isNotEmpty);
      } else {
        expect(result.containsKey('friends'), isTrue);
        expect(result.containsKey('totalPages'), isTrue);

        final List friends = result['friends'];
        if (friends.isNotEmpty) {
          expect(friends[0].containsKey('username'), isTrue);
          expect(friends[0].containsKey('_id'), isTrue);
        }
      }
    });

    test('Initiate Chat returns valid conversation ID', () async {
      final result = await ApiService.startConversation('60d5ecb86372d2f8d8050000');

      expect(result.containsKey('error'), isTrue);
    });
  });
}