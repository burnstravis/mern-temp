import 'package:flutter/material.dart';
import 'package:friend_connector_mobile/screens/register_page.dart';
import 'package:google_fonts/google_fonts.dart';

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
            Text(
              "Friend Connector",
              style: GoogleFonts.dancingScript(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                shadows: [const Shadow(color: Colors.black26, offset: Offset(1, 2), blurRadius: 6)],
              ),
            ),
            const SizedBox(height: 10),
            //subtitle message
            Text(
              "Staying connected, made simple",
              style: GoogleFonts.lora(
                fontSize: 18,
                fontStyle: FontStyle.italic,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 40),

            // 2. Login Card
            AuthCard(
              instruction: "Have an account?",
              subText: "Welcome back—your friends are waiting",
              buttonText: "Login",
              isPrimary: false,
              // Pass Lora styles here:
              instructionStyle: GoogleFonts.lora(
                color: const Color(0xFF4A4680),
                fontWeight: FontWeight.bold,
                fontSize: 20,
                fontStyle: FontStyle.italic,
              ),
              subTextStyle: GoogleFonts.lora(
                color: const Color(0xFF4A4680),
                fontSize: 16,
                fontStyle: FontStyle.italic,
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                );
              },
            ),

            const SizedBox(height: 24),

            AuthCard(
              instruction: "New here?",
              subText: "Create an account, start connecting",
              buttonText: "Register",
              isPrimary: true,
              // Pass Lora styles here:
              instructionStyle: GoogleFonts.lora(
                color: const Color(0xFF4A4680),
                fontWeight: FontWeight.bold,
                fontSize: 20,
                fontStyle: FontStyle.italic,
              ),
              subTextStyle: GoogleFonts.lora(
                color: const Color(0xFF4A4680),
                fontSize: 16,
                fontStyle: FontStyle.italic,
              ),
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
  final String subText;
  final String buttonText;
  final bool isPrimary;
  final VoidCallback onPressed;
  final TextStyle instructionStyle; // Use these in build
  final TextStyle subTextStyle;

  const AuthCard({
    super.key,
    required this.instruction,
    required this.subText,
    required this.buttonText,
    required this.isPrimary,
    required this.onPressed,
    required this.instructionStyle,
    required this.subTextStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
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
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            instruction,
            style: instructionStyle, // Applied constructor style
          ),
          const SizedBox(height: 4),
          Text(
            subText,
            style: subTextStyle, // Applied constructor style
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 40,
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
                style: GoogleFonts.lora( // Ensuring the button matches Lora
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