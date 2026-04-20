import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../services/api_service.dart';
import '../services/token_manager.dart';
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

  late IO.Socket _socket;
  List<dynamic> _messages = [];
  bool _isLoading = true;
  String _prompt = "Loading...";

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _fetchPrompt();
    _initSocket();
  }

  @override
  void dispose() {
    _socket.emit('leave:conversation', widget.conversationId);
    _socket.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _initSocket() {
    // Connect to your server (Use 10.0.2.2 for Android Emulator)
    _socket = IO.io('https://largeproject.nathanfoss.me', IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': TokenManager.getToken()})
        .enableAutoConnect()
        .build());

    _socket.onConnect((_) {
      debugPrint('Connected to WebSocket');
      _socket.emit('join:conversation', 'conversation:${widget.conversationId}');
    });

    _socket.on('message:new', (newMessage) {
      if (mounted) {
        setState(() {

          bool alreadyExists = _messages.any((m) =>
          m['_id'] == newMessage['_id'] ||
              (m['text'] == newMessage['text'] && m['senderId'] == newMessage['senderId'])
          );

          if (!alreadyExists) {
            _messages.insert(0, newMessage);
          }
        });
      }
    });

  }

  Future<void> _fetchMessages() async {
    if (widget.currentUserId.isEmpty || widget.conversationId.isEmpty) return;

    final result = await ApiService.getMessages(
      senderID: widget.currentUserId,
      conversationID: widget.conversationId,
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        if ((result['error'] == null || result['error'] == "") && result.containsKey('messages')) {
          _messages = List.from(result['messages'].reversed);
        }
      });
    }
  }

  Future<void> _handleSend() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();

    // 1. Send to API
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
      // 2. MANUALLY UPDATE UI (If socket doesn't loop back to you)
      // We create a temporary message object to show it immediately
      if (mounted) {
        setState(() {
          final myNewMsg = {
            '_id': DateTime.now().toString(), // Temp ID
            'text': text,
            'senderId': widget.currentUserId,
            'createdAt': DateTime.now().toIso8601String(),
          };

          if (!_messages.any((m) => m['text'] == text && m['senderId'] == widget.currentUserId)) {
            _messages.insert(0, myNewMsg);
          }
        });
      }
    }
  }

  Future<void> _fetchPrompt() async {
    final result = await ApiService.getRandomPrompt();
    if (mounted) {
      setState(() {
        if (result.containsKey('prompt')) {
          final promptData = result['prompt'];
          _prompt = promptData['content'] ?? promptData['text'] ?? "No prompt today!";
        } else {
          _prompt = "Click here to start the conversation!";
        }
      });
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
            style: GoogleFonts.dancingScript(fontSize: 48, color: Colors.white, fontWeight: FontWeight.bold),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF0A500),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withOpacity(0.05), width: 1),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center, // Centers the "box" content
        children: [
          Text(
            "Today's Prompt",
            textAlign: TextAlign.center, // Centers the text lines if they wrap
            style: GoogleFonts.lora(
              fontWeight: FontWeight.bold,
              fontStyle: FontStyle.italic,
              fontSize: 14,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6), // Space between header and prompt
          Text(
            _prompt,
            textAlign: TextAlign.center, // Ensures long prompts wrap centered
            style: GoogleFonts.lora(
              fontSize: 16,
              fontStyle: FontStyle.italic,
              color: Colors.black.withOpacity(0.85),
            ),
          ),
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
        final bool isMe = msg['senderId'].toString() == widget.currentUserId.toString();

        return _chatBubble(
            msg['text'] ?? "",
            isMe,
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