import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Registration & Verification Flow', () {

    test('Registration fails with weak password', () async {
      final result = await ApiService.register(
          'Travis', 'Burns', 'travis@ucf.edu', 'tburns', 'short', '2000-01-01'
      );

      expect(result.containsKey('error'), isTrue);
    });

    test('Verify Email correctly identifies invalid codes', () async {
      final result = await ApiService.verifyEmail('travis@ucf.edu', '00000');

      expect(result.containsKey('error'), isTrue);
    });
  });
}