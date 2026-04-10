import 'package:flutter/material.dart';
import 'package:friend_connector_mobile/screens/login_page.dart';
import '../services/api_service.dart';

class ResetPasswordPage extends StatefulWidget {
  const ResetPasswordPage({super.key});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordPage> {
  final _emailController = TextEditingController();
  final _verificationCodeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;

  bool _validateForm() {
    if (_emailController.text.isEmpty) {
      _showError('Please enter account email.');
      return false;
    }

    if(_verificationCodeController.text.isEmpty) {
      _showError('Please enter valid verification code.');
      return false;
    }

    if(_newPasswordController.text.length < 8){
      _showError('Password must be at least 8 characters.');
      return false;
    }

    if(_newPasswordController.text.toString() != _confirmPasswordController.text.toString()){
      _showError('Passwords do not match.');
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
    final result = await ApiService.resetPassword(
      _emailController.text.trim(),
      _verificationCodeController.text.trim(),
      _newPasswordController.text.trim(),
      _confirmPasswordController.text.trim()
    );

    if (!mounted) return;

    if (result.containsKey('success')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password Reset! Redirecting...'), backgroundColor: Colors.green),

      );
      Future.delayed(const Duration(milliseconds: 1500), () {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (context) => LoginScreen(),
          ),
              (route) => false,
        );
      });
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
                const Text("Create an account", style: TextStyle(color: Color(0xFF4A4680), fontWeight: FontWeight.bold, fontSize: 24)),
                const Text("Join and start connecting with friends", style: TextStyle(color: Color(0xFF4A4680), fontStyle: FontStyle.italic)),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(child: _buildTextField(_emailController, "Account Email")),
                    const SizedBox(width: 12),
                    Expanded(child: _buildTextField(_verificationCodeController, "Verification Code")),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField(_newPasswordController, "New Password", isPassword: true),
                const SizedBox(height: 16),
                _buildTextField(_confirmPasswordController, "Confirm Password", isPassword: true),
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
                        : const Text("Reset Password", style: TextStyle(color: Colors.white, fontSize: 18)),
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("← Back to Login", style: TextStyle(color: Colors.grey)),
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