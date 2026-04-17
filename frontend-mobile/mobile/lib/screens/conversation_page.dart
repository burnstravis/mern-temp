import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'dart:async';

class ConversationPage extends StatefulWidget {
  final String conversationId;
  final String currentUserId;
  final String displayName;
  final VoidCallback onBack;

  const ConversationPage({
    super.key,
    required this.conversationId,
    required this.currentUserId,
    required this.displayName,
    required this.onBack,
  });

  @override
  State<ConversationPage> createState() => _ConversationPageState();
}

class _ConversationPageState extends State<ConversationPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  List<dynamic> _messages = [];
  bool _isLoading = true;
  Timer? _pollingTimer;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    // Start polling for new messages every 3 seconds
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) => _fetchMessages());
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _fetchMessages() async {
    if (widget.currentUserId.isEmpty || widget.conversationId.isEmpty) {
      print("Waiting for IDs... User: '${widget.currentUserId}', Conv: '${widget.conversationId}'");

      return;
    }

    // 2. Call the API
    final result = await ApiService.getMessages(
      senderID: widget.currentUserId,
      conversationID: widget.conversationId,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;

        if ((result['error'] == null || result['error'] == "") && result.containsKey('messages')) {

          _messages = List.from(result['messages'].reversed);

        } else {
          print("API Error or Missing Data: ${result['error']}");

          if (result['error'].toString().contains("JWT")) {
          }
        }
      });
    }
  }

  Future<void> _handleSend() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();

    final result = await ApiService.sendMessage(
      senderID: widget.currentUserId,
      conversationID: widget.conversationId,
      message: text,
    );

    if (result.containsKey('error') && result['error'].isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['error'])),
      );
    } else {
      _fetchMessages();
    }
  }

  String _formatTime(String? isoDate) {
    if (isoDate == null) return "";
    final date = DateTime.parse(isoDate).toLocal();
    final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final ampm = date.hour >= 12 ? "PM" : "AM";
    final minute = date.minute.toString().padLeft(2, '0');
    return "$hour:$minute $ampm";
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            "Friend Connector",
            style: GoogleFonts.dancingScript(fontSize: 64, color: Colors.white, fontWeight: FontWeight.bold),
          ),
          Text(
            "Messages",
            style: GoogleFonts.lora(fontSize: 18, fontStyle: FontStyle.italic, color: const Color(0xFFF0EDFF)),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: const Color(0xFFF0EDFF),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  _buildHeader(),
                  Expanded(
                    child: _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : _buildMessageList(),
                  ),
                  _buildInputArea(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 90),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF3C3489),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20), bottom: Radius.circular(20)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: widget.onBack),
              Expanded(
                child: Text(
                  widget.displayName,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 48),
            ],
          ),
          const SizedBox(height: 8),
          _buildPromptBox(),
        ],
      ),
    );
  }

  Widget _buildPromptBox() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFFF0A500), borderRadius: BorderRadius.circular(20)),
      child: const Row(
        children: [
          Text("Today's Prompt: ", style: TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic)),
          Expanded(child: Text("if you were a ghost, how would you mildly inconvenience people?", style: TextStyle(fontStyle: FontStyle.italic))),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    if (_messages.isEmpty) {
      return const Center(child: Text("No messages yet. Say hi!"));
    }
    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];

        return _chatBubble(
            msg['text'] ?? "",
            msg['fromSender'] ?? false,
            _formatTime(msg['createdAt'])
        );
      },
    );
  }

  Widget _chatBubble(String text, bool isMe, String time) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.7),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isMe ? const Color(0xFF3C3489) : const Color(0xFFAFA9EC),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(15),
                topRight: const Radius.circular(15),
                bottomLeft: isMe ? const Radius.circular(15) : Radius.zero,
                bottomRight: isMe ? Radius.zero : const Radius.circular(15),
              ),
            ),
            child: Text(
              text,
              style: TextStyle(color: isMe ? Colors.white : Colors.black, fontSize: 16),
            ),
          ),
          const SizedBox(height: 4),
          Text(time, style: const TextStyle(fontSize: 10, color: Color(0xFF3C3489))),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: const BoxDecoration(
        color: Color(0xFF3C3489),
        borderRadius: BorderRadius.vertical(top: Radius.circular(20), bottom: Radius.circular(20)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              onSubmitted: (_) => _handleSend(),
              decoration: InputDecoration(
                fillColor: Colors.white,
                filled: true,
                hintText: "message",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            decoration: BoxDecoration(color: const Color(0xFFF0A500), borderRadius: BorderRadius.circular(10)),
            child: IconButton(onPressed: _handleSend, icon: const Icon(Icons.send, color: Colors.black)),
          ),
        ],
      ),
    );
  }
}