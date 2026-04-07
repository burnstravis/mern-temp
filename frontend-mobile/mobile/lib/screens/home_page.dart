import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  final String firstName;

  const HomePage({super.key, required this.firstName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Friend Connector"),
        backgroundColor: const Color(0xFF4A4680),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text("Welcome, $firstName!", style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 20),
            const Text("Your friends will appear here."),
          ],
        ),
      ),
    );
  }
}