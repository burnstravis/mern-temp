import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/screens/home_page.dart';

void main() {
  group('Shell & Navigation State', () {

    testWidgets('Tapping Nav items updates the UI state', (WidgetTester tester) async {
      await tester.pumpWidget(const MaterialApp(
        home: HomePage(firstName: 'Travis'),
      ));

      await tester.pump(const Duration(milliseconds: 500));

      await tester.tap(find.byIcon(CupertinoIcons.chat_bubble_fill));

      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('Messages'), findsWidgets);
    });
  });
}