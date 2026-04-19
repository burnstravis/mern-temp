import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Password Reset Integration', () {

    test('Reset API handles mismatching passwords gracefully', () async {
      final result = await ApiService.resetPassword(
          'travis@ucf.edu',
          '12345',
          'newpass123',
          'differentpass'
      );

      expect(result.containsKey('error'), isTrue);
    });

    test('Reset API handles expired or invalid codes', () async {
      final result = await ApiService.resetPassword(
          'travis@ucf.edu',
          '99999',
          'StrongPass123!',
          'StrongPass123!'
      );

      expect(result.containsKey('error'), isTrue);
    });
  });
}