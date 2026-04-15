import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ConversationPage extends StatelessWidget {
  final String friendId;
  final String displayName;
  final VoidCallback onBack; // Added for navigation back to Friends list

  const ConversationPage({
    super.key,
    required this.friendId,
    required this.displayName,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    // We remove Scaffold because it's already inside the HomePage Scaffold
    return SafeArea(
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
              "Friend Connector",
              style: GoogleFonts.dancingScript(
                  fontSize: 64,
                  color: Colors.white,
                  fontWeight: FontWeight.bold
              )
          ),
          Text(
              "Messages",
              style: GoogleFonts.lora(
                  fontSize: 18,
                  fontStyle: FontStyle.italic,
                  color: const Color(0xFFF0EDFF)
              )
          ),
          const SizedBox(height: 20),

          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: const BoxDecoration(
                color: Color(0xFFF0EDFF),
                borderRadius: BorderRadius.vertical(top: Radius.circular(20), bottom: Radius.circular(20)),
              ),
              child: Column(
                children: [
                  _buildHeader(context),
                  Expanded(child: _buildMessageList()),
                  _buildInputArea(),
                ],
              ),
            ),
          ),
          // Added bottom spacing so the floating nav bar doesn't cover the input
          const SizedBox(height: 90),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF3C3489),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20), bottom: Radius.circular(20)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: onBack,
              ),
              Expanded(
                child: Text(
                  displayName,
                  textAlign: TextAlign.center, // Centers the text within the expanded space
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              // This balances the IconButton so the name is perfectly centered in the screen
              const SizedBox(width: 48),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0A500),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Text("Today's Prompt: ", style: TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic)),
                Expanded(
                  child: Text(
                    "if you were a ghost, how would you mildly inconvenience people?",
                    style: TextStyle(fontStyle: FontStyle.italic),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    // List should be reversed so index 0 is the bottom-most message
    final messages = [
      {"text": "Almost! Just need to fix the charts.", "isMe": true, "time": "2:45 PM"},
      {"text": "Did you finish that report yet?", "isMe": false, "time": "2:42 PM"},
    ];

    return ListView.builder(
      reverse: true, // Key fix: starts scroll at the bottom
      padding: const EdgeInsets.all(16),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];
        return _chatBubble(msg['text'] as String, msg['isMe'] as bool, msg['time'] as String);
      },
    );
  }

  Widget _chatBubble(String text, bool isMe, String time) {
    return Builder(
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Column(
            // Align the whole column (bubble + time)
            crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                children: [
                  Container(
                    constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width * 0.7
                    ),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isMe ? const Color(0xFF3C3489) : const Color(0xFFAFA9EC),
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(15),
                        topRight: const Radius.circular(15),
                        bottomLeft: isMe ? const Radius.circular(15) : Radius.zero,
                        bottomRight: isMe ? Radius.zero : const Radius.circular(15),
                      ),
                      boxShadow: const [
                        BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(1, 2))
                      ],
                    ),
                    child: Text(
                      text,
                      style: TextStyle(
                        color: isMe ? Colors.white : Colors.black,
                        fontFamily: 'Georgia',
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              // Time Stamp
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Text(
                  time,
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(0xFF3C3489),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      height: 80, // Slightly reduced to fit mobile screens better
      decoration: const BoxDecoration(
        color: Color(0xFF3C3489),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20), bottom: Radius.circular(20)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              decoration: InputDecoration(
                fillColor: Colors.white,
                filled: true,
                hintText: "message",
                isDense: true, // Helps with vertical centering
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(
                color: const Color(0xFFF0A500),
                borderRadius: BorderRadius.circular(10)
            ),
            child: IconButton(
                onPressed: () {},
                icon: const Icon(Icons.send, color: Colors.black)
            ),
          ),
        ],
      ),
    );
  }
}