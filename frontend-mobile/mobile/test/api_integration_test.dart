import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('ApiService Integration Tests', () {

    test('Login handles invalid credentials', () async {
      final result = await ApiService.login('bad_user', 'bad_pass');
      expect(result.containsKey('error'), isTrue);
    });

    test('Security check for friends list', () async {
      final result = await ApiService.friendsList();
      expect(result.containsKey('error'), isTrue);
    });

  });
}