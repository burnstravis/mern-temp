import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Notifications System Integration', () {

    test('getNotifications returns expected schema from MERN backend', () async {
      final result = await ApiService.getNotifications();

      expect(result, isA<Map<String, dynamic>>());

      if (result.containsKey('notifications')) {
        final List notifs = result['notifications'];
        if (notifs.isNotEmpty) {
          expect(notifs[0].containsKey('type'), isTrue);
          expect(notifs[0].containsKey('isRead'), isTrue);
        }
      }
    });

    test('Accepting friend request returns error when unauthorized', () async {
      final result = await ApiService.acceptFriendRequest('dummy_id', 'dummy_id');

      expect(result.containsKey('error'), isTrue);
    });
  });
}