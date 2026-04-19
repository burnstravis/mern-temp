import 'package:flutter/material.dart';
import 'package:friend_connector_mobile/screens/resetpassword_page.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageScreenState();
}

class _ForgotPasswordPageScreenState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();

  bool _isLoading = false;

  bool _validateForm() {

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(_emailController.text) || _emailController.text.isEmpty) {
      _showError('Please enter a valid email address.');
      return false;
    }

    return true;
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _handleSubmit() async {
    if (!_validateForm()) return;

    setState(() => _isLoading = true);

    // Calling the API Service
    final result = await ApiService.emailRecovery(
        _emailController.text.trim()
    );

    if (!mounted) return;

    if (result.containsKey('success')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('If an account exists, we sent a reset link to that email.'),
            backgroundColor: Colors.green
        ),
      );

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (context) => ResetPasswordPage(),
        ),
            (route) => false,
      );
    } else {
      _showError(result['error'] ?? 'Something went wrong.');
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFAFA9EC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
          child: Container(
            width: 450, // Slightly wider for the side-by-side name row
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                 Text("Forgot your password?", style: GoogleFonts.lora(color: Color(0xFF4A4680), fontWeight: FontWeight.bold, fontSize: 24)),
                 Text("Enter the email address associated with your account and we'll send you a reset link.", style: GoogleFonts.lora(color: Color(0xFF4A4680), fontStyle: FontStyle.italic)),
                const SizedBox(height: 24),


                const SizedBox(height: 16),
                _buildTextField(_emailController, "Email", keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 32),

                // Register Button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF0A500),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        :  Text("Send Reset Link", style: GoogleFonts.lora(color: Colors.white, fontSize: 18)),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    if (_isLoading) {
                      setState(() => _isLoading = false);
                    } else {
                      Navigator.pop(context);
                    }
                  },
                  child:  Text("← Back to Login", style: GoogleFonts.lora(color: Colors.grey)),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Helper to keep the UI clean
  Widget _buildTextField(TextEditingController controller, String label, {bool isPassword = false, TextInputType? keyboardType}) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: Colors.grey[100],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      ),
    );
  }
}