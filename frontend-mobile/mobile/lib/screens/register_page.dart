import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Matching your RegisterForm interface
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _userController = TextEditingController();
  final _birthdayController = TextEditingController();
  final _passController = TextEditingController();
  final _confirmPassController = TextEditingController();

  bool _isLoading = false;

  // Porting your validateForm() logic
  bool _validateForm() {
    if (_firstNameController.text.isEmpty ||
        _lastNameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _userController.text.isEmpty ||
        _passController.text.isEmpty) {
      _showError('All fields are required.');
      return false;
    }

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(_emailController.text)) {
      _showError('Please enter a valid email address.');
      return false;
    }

    if (_passController.text.length < 8) {
      _showError('Password must be at least 8 characters.');
      return false;
    }

    if (_passController.text != _confirmPassController.text) {
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
    final result = await ApiService.register(
      _firstNameController.text.trim(),
      _lastNameController.text.trim(),
      _emailController.text.trim(),
      _userController.text.trim(),
      _passController.text.trim(),
      _birthdayController.text.trim(),
    );

    if (!mounted) return;

    if (result['error'] == "") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account created! Redirecting...'), backgroundColor: Colors.green),
      );
      // Matching your 1.5s timeout redirect
      Future.delayed(const Duration(milliseconds: 1500), () {
        Navigator.pop(context); // Go back to Landing/Login
      });
    } else {
      _showError(result['error'] ?? 'Registration failed.');
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

                // Name Row (First & Last)
                Row(
                  children: [
                    Expanded(child: _buildTextField(_firstNameController, "First Name")),
                    const SizedBox(width: 12),
                    Expanded(child: _buildTextField(_lastNameController, "Last Name")),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField(_emailController, "Email", keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 16),
                _buildTextField(_userController, "Username"),
                const SizedBox(height: 16),
                _buildTextField(_birthdayController, "Birthday (XX-XX-XXXX)"),
                const SizedBox(height: 16),
                _buildTextField(_passController, "Password", isPassword: true),
                const SizedBox(height: 16),
                _buildTextField(_confirmPassController, "Confirm Password", isPassword: true),
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
                        : const Text("Register", style: TextStyle(color: Colors.white, fontSize: 18)),
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("← Back", style: TextStyle(color: Colors.grey)),
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