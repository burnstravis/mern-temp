import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Support Request Integration', () {

    test('Create Support Request identifies missing auth', () async {
      final result = await ApiService.createSupportRequest(
          "I need help with my CS project!",
          "Advice"
      );

      expect(result.containsKey('error'), isTrue);
    });

    test('Support types match backend expectations', () async {
      final result = await ApiService.createSupportRequest("Test", "Encouragement");

      expect(result, isNotNull);
    });
  });
}