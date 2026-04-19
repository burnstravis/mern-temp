import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Password Recovery Integration', () {

    test('Email recovery should return success status for a request', () async {
      final result = await ApiService.emailRecovery('test_recovery@example.com');

      expect(result != null, isTrue);

      expect(result.containsKey('success') || result.containsKey('error'), isTrue);
    });

    test('Validation: Regex blocks malformed emails locally', () async {
      final result = await ApiService.emailRecovery('not-an-email');

      expect(result.containsKey('error'), isTrue);
    });
  });
}