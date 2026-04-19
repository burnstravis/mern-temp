import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Discover Friends Integration', () {

    test('getUsers handles search queries and pagination structure', () async {

      final result = await ApiService.getUsers(search: 'test', page: 1, limit: 10);

      expect(result, isA<Map<String, dynamic>>());

      if (result.containsKey('users')) {
        expect(result['users'], isA<List>());
        expect(result.containsKey('totalPages'), isTrue);
      }
    });

    test('Add Friend request returns error when unauthorized', () async {
      final result = await ApiService.addFriend('some_username');

      expect(result.containsKey('error'), isTrue);
    });
  });
}