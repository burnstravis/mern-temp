import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  // Registration Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _userController = TextEditingController();
  final _birthdayController = TextEditingController();
  final _passController = TextEditingController();
  final _confirmPassController = TextEditingController();

  // Verification Controller
  final _verificationController = TextEditingController();

  bool _isLoading = false;
  bool _isVerifying = false;

  bool _validateForm() {
    if (_firstNameController.text.isEmpty ||
        _lastNameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _userController.text.isEmpty ||
        _birthdayController.text.isEmpty ||
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

  // First Step: Register Account
  void _handleSubmit() async {
    if (!_validateForm()) return;

    setState(() => _isLoading = true);

    final result = await ApiService.register(
      _firstNameController.text.trim(),
      _lastNameController.text.trim(),
      _emailController.text.trim(),
      _userController.text.trim(),
      _passController.text.trim(),
      _birthdayController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    bool isSuccess = result.containsKey('Success') ||
        result.containsKey('success') ||
        (result['error'] == null || result['error'] == "");

    if (isSuccess) {
      setState(() => _isVerifying = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registration successful! Check your email.'), backgroundColor: Colors.green),
      );
    } else {
      // Only show error if the string isn't empty
      String errorMsg = result['error']?.toString() ?? "An unknown error occurred";
      if (errorMsg.isNotEmpty) {
        _showError(errorMsg);
      } else {
        // Fallback if the backend sent an error status but no message
        _showError("Registration failed. Please try again.");
      }
    }
  }

  // Second Step: Verify Code
  void _handleVerify() async {
    if (_verificationController.text.isEmpty) {
      _showError('Please enter the verification code.');
      return;
    }

    setState(() => _isLoading = true);

    final result = await ApiService.verifyEmail(
      _emailController.text.trim(),
      _verificationController.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['error'] == null || result['error'] == "") {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email verified! Redirecting to login...'), backgroundColor: Colors.green),
      );
      Future.delayed(const Duration(seconds: 2), () {
        Navigator.pop(context);
      });
    } else {
      _showError(result['error']);
    }
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
          onPressed: () {
            if (_isVerifying) {
              setState(() => _isVerifying = false);
            } else {
              Navigator.pop(context);
            }
          },
        ),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20),
          child: Container(
            width: 450,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 20, offset: Offset(0, 10))],
            ),
            child: Column(
              children: [
                Text(
                  _isVerifying ? "Verify Email" : "Create an account",
                  style: const TextStyle(color: Color(0xFF4A4680), fontWeight: FontWeight.bold, fontSize: 24),
                ),
                const SizedBox(height: 8),
                Text(
                  _isVerifying
                      ? "Enter the code sent to ${_emailController.text}"
                      : "Join and start connecting with friends",
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFF4A4680), fontStyle: FontStyle.italic),
                ),
                const SizedBox(height: 24),

                if (!_isVerifying) ...[
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
                ] else ...[
                  _buildTextField(_verificationController, "5-digit code", keyboardType: TextInputType.number),
                  const SizedBox(height: 16),
                ],

                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : (_isVerifying ? _handleVerify : _handleSubmit),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF0A500),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(_isVerifying ? "Verify Account" : "Register",
                        style: const TextStyle(color: Colors.white, fontSize: 18)),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    if (_isVerifying) {
                      setState(() => _isVerifying = false);
                    } else {
                      Navigator.pop(context);
                    }
                  },
                  child: const Text("← Back", style: TextStyle(color: Colors.grey)),
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

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