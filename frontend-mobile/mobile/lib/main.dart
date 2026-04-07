import 'package:flutter/material.dart';
import 'package:friend_connector_mobile/screens/landing_page.dart';
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Friend Connector',
      debugShowCheckedModeBanner: false, // Hides the "Debug" banner
      theme: ThemeData(
        useMaterial3: true,
        // Corrected syntax: Added 'ColorScheme' before 'fromSeed'
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.white),
      ),
      home: const LandingScreen(),
    );
  }
}



class AuthCard extends StatelessWidget {
  final String instruction;
  final String subText; // Added this
  final String buttonText;
  final bool isPrimary;

  const AuthCard({
    super.key,
    required this.instruction,
    required this.subText, // Added this
    required this.buttonText,
    required this.isPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 320,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, // Better alignment for subtext
        children: [
          Text(
            instruction,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 4), // Small gap
          Text(
            subText,
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          const SizedBox(height: 20), // Gap before button
          SizedBox(
            width: double.infinity,
            height: 45,
            child: ElevatedButton(
              onPressed: () => print('$buttonText tapped'),
              style: ElevatedButton.styleFrom(
                backgroundColor: isPrimary ? const Color(0xFFAFA9EC) : Colors.white,
                foregroundColor: isPrimary ? Colors.white : const Color(0xFFAFA9EC),
                side: isPrimary ? BorderSide.none : const BorderSide(color: Color(0xFFAFA9EC)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text(buttonText),
            ),
          ),
        ],
      ),
    );
  }
}