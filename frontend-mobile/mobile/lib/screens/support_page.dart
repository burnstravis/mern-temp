import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SupportPage extends StatefulWidget {
  final String firstName;

  const SupportPage({
    super.key,
    required this.firstName,
  });

  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage> {
  final TextEditingController _contentController = TextEditingController();

  // Default type matching your React state
  String _selectedType = 'Encouragement';
  bool _isSending = false;

  // Matching your app's theme colors
  static const Color headerTextBlue = Color(0xFF3C3489);
  static const Color actionButtonBg = Color(0xFFF0A500);
  static const Color inputBg = Color(0xFFF0EDFF);

  final List<String> _supportTypes = [
    'Encouragement',
    'Advice',
    'Chat',
    'Celebrate',
  ];

  Future<void> _sendRequest() async {
    final text = _contentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isSending = true);

    try {
      final result = await ApiService.createSupportRequest(text, _selectedType);

      if (mounted) {
        if (result.containsKey('requestId')) {
          // Success! Show the alert just like the Web App
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Your request has been sent to all your friends!")),
          );
          _contentController.clear();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['error'] ?? "Failed to send request")),
          );
        }
      }
    } catch (e) {
      debugPrint("Support Request Error: $e");
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Capitalize name for the subtitle
    String capitalizedName = widget.firstName.isNotEmpty
        ? widget.firstName[0].toUpperCase() + widget.firstName.substring(1)
        : "";

    return SafeArea(
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            "Friend Connector",
            style: GoogleFonts.dancingScript(
              fontSize: 64,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            "Request Support",
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
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6, offset: const Offset(1, 2))
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    Text(
                      "Need help with something $capitalizedName?",
                      textAlign: TextAlign.center,
                      style: GoogleFonts.lora(
                        fontSize: 24,
                        fontStyle: FontStyle.italic,
                        fontWeight: FontWeight.bold,
                        color: headerTextBlue,
                      ),
                    ),
                    const SizedBox(height: 30),

                    // --- Dropdown Menu ---
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: inputBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedType,
                          isExpanded: true,
                          icon: const Icon(Icons.arrow_drop_down, color: headerTextBlue),
                          items: _supportTypes.map((String value) {
                            return DropdownMenuItem<String>(
                              value: value,
                              child: Text(value, style: const TextStyle(color: headerTextBlue)),
                            );
                          }).toList(),
                          onChanged: (newValue) {
                            setState(() => _selectedType = newValue!);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // --- Text Area ---
                    TextField(
                      controller: _contentController,
                      maxLines: 6,
                      decoration: InputDecoration(
                        hintText: "Tell your friends what's on your mind...",
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 30),

                    // --- Send Button ---
                    SizedBox(
                      width: double.infinity,
                      height: 55,
                      child: ElevatedButton(
                        onPressed: _isSending ? null : _sendRequest,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: actionButtonBg,
                          foregroundColor: Colors.black87,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 2,
                        ),
                        child: _isSending
                            ? const CircularProgressIndicator(color: Colors.black87)
                            : const Text(
                          "Send to friends",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 90), // Spacing for nav bar
        ],
      ),
    );
  }
}