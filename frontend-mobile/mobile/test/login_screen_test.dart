import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:friend_connector_mobile/screens/login_page.dart';

void main() {
  testWidgets('LoginScreen UI and Input Test', (WidgetTester tester) async {
    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));

    final usernameField = find.byType(TextField).at(0);
    final passwordField = find.byType(TextField).at(1);
    final signInButton = find.text('Sign In');

    await tester.enterText(usernameField, 'travis_burns');
    await tester.enterText(passwordField, 'password123');

    await tester.runAsync(() async {
      await tester.tap(signInButton);

      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    await tester.pumpAndSettle();
  });
}