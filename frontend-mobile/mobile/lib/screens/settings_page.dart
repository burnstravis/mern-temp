import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/token_manager.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  String _errorMessage = "";
  bool _isDeleting = false;

  // Colors pulled from your MessagesPage for consistency
  static const Color backgroundPurple = Color(0xFFA89FD8);
  static const Color deleteButtonBg = Color(0xFFF0A500); // Using your "Find" button gold
  static const Color cardBg = Color(0xFFAFA9EC);
  static const Color figmaBlue = Color(0xFF3C3489);


  Future<void> _handleDeleteAccount() async {
    // Show custom themed confirmation dialog
    bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          "Delete Account?",
          style: GoogleFonts.lora(fontWeight: FontWeight.bold, color: backgroundPurple),
        ),
        content: const Text(
            "This action is permanent and will wipe all your messages, friends, and data. Are you sure?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("Cancel", style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text("Delete Forever", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isDeleting = true;
      _errorMessage = "";
    });

    final result = await ApiService.deleteAccount();

    if (mounted) {
      if (result.containsKey('error') && result['error'].isNotEmpty) {
        setState(() {
          _isDeleting = false;
          _errorMessage = result['error'];
        });
      } else {
        // Clear local session
        await TokenManager.clearToken();
        // Redirect to login/landing and clear navigation stack
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundPurple,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 20),
            // App Title matching MessagesPage
            Text(
              "Friend Connector",
              style: GoogleFonts.dancingScript(
                fontSize: 48,
                fontWeight: FontWeight.bold,
                color: Colors.white,
                shadows: [const Shadow(color: Colors.black26, offset: Offset(1, 2), blurRadius: 6)],
              ),
            ),
            Text(
              "Settings",
              style: GoogleFonts.lora(
                fontSize: 18,
                fontStyle: FontStyle.italic,
                color: const Color(0xFFF0EDFF),
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 20),
                padding: const EdgeInsets.all(20),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6, offset: const Offset(1, 2))
                  ],
                ),
                child: Column(
                  children: [
                    Text(
                      "Account Settings",
                      style: GoogleFonts.lora(
                        fontSize: 32,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.bold,
                        color: figmaBlue,
                      ),
                    ),
                    const SizedBox(height: 40),

                    // Warning Text Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: cardBg.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: figmaBlue),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 30),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              "Deleting your account is permanent and cannot be undone.",
                              style: GoogleFonts.lora(
                                fontSize: 14,
                                color: figmaBlue,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const Spacer(),

                    if (_errorMessage.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(_errorMessage, style: const TextStyle(color: Colors.red)),
                      ),

                    // Delete Button styled like your "Find" button
                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        onPressed: _isDeleting ? null : _handleDeleteAccount,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: deleteButtonBg,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                          elevation: 4,
                        ),
                        child: _isDeleting
                            ? const CircularProgressIndicator(color: backgroundPurple)
                            : Text(
                          "Delete My Account",
                          style: GoogleFonts.lora(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontStyle: FontStyle.italic,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 90), // Bottom nav padding
          ],
        ),
      ),
    );
  }
}