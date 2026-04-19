import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

void main() {
  group('Messages Page Data Logic', () {

    test('getConversations should return a list or error handled map', () async {
      final result = await ApiService.getConversations();

      expect(result, isA<Map<String, dynamic>>());

      if (result.containsKey('conversations')) {
        expect(result['conversations'], isA<List>());
      }
    });

    test('Local filtering logic handles empty lists', () {
      final query = "Travis";
      final List<dynamic> mockData = [];

      final filtered = mockData.where((c) =>
          c['otherUserName'].toString().toLowerCase().contains(query.toLowerCase())
      ).toList();

      expect(filtered.isEmpty, isTrue);
    });
  });
}