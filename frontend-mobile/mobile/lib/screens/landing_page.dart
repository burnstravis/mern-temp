import 'package:flutter/material.dart';
import 'package:friend_connector_mobile/screens/register_page.dart';

import 'login_page.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFFAFA9EC),
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // 1. Title & Subtitle
            const Text(
              'Friend Connector',
              style: TextStyle(
                fontSize: 64,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),

            //subtitle message
            Text(
              'Staying connected, made simple',
              style: TextStyle(
                fontSize: 18,
                color: Colors.white,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 40),

            // 2. Login Card
            AuthCard(
              instruction: "Have an account?", // Changed to a shorter title
              subText: "Welcome back—your friends are waiting",
              buttonText: "Login",
              isPrimary: false,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              },
            ),

            const SizedBox(height: 24),

            // 4. Register Card
            AuthCard(
              instruction: "New here?",
              subText: "Create an account, start connecting",
              buttonText: "Register",
              isPrimary: true,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const RegisterScreen()),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// Reusable AuthCard "Component"
class AuthCard extends StatelessWidget {
  final String instruction;
  final String subText; // Added this
  final String buttonText;
  final bool isPrimary;
  final VoidCallback onPressed;

  const AuthCard({
    super.key,
    required this.instruction,
    required this.subText, // Added this
    required this.buttonText,
    required this.isPrimary,
    required this.onPressed,
  });


  @override
  Widget build(BuildContext context) {
    return Container(
      width: 380,
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
        crossAxisAlignment:
            CrossAxisAlignment.center, // Better alignment for subtext
        children: [
          Text(
            instruction,
            style: const TextStyle(
              color: Color(0xFF4A4680),
              fontWeight: FontWeight.bold,
              fontSize: 20,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 4), // Small gap
          Text(
            subText,
            style: TextStyle(
              color: Color(0xFF4A4680),
              fontSize: 16,
              fontStyle: FontStyle.italic,
            ),
          ),
          const SizedBox(height: 20), // Gap before button
          SizedBox(
            width: double.infinity,
            height: 45,
            child: ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF0A500),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
              child: Text(
                buttonText,
                style: const TextStyle(
                  fontStyle: FontStyle.italic,
                  fontSize: 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
