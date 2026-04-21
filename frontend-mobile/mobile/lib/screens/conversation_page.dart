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
  final String? friendId; // Added to fetch profile for birthday check
  final VoidCallback onBack;

  const ConversationPage({
    super.key,
    required this.conversationId,
    required this.currentUserId,
    required this.displayName,
    this.friendId,
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
  bool _isConnecting = false;
  bool _isGeneratingReply = false;
  bool _friendBirthdayToday = false; // Track birthday state

  @override
  void initState() {
    super.initState();
    _fetchMessages();
    _fetchPrompt();
    _initSocket();
    _loadFriendProfile(); // Load profile on init
  }

  // Logic to parse and check birthday from the API response
  bool _isBirthdayToday(String? birthday) {
    if (birthday == null || birthday.isEmpty) return false;

    try {
      // Parse ISO or simple date strings
      DateTime parsedDate = DateTime.parse(birthday.split('T')[0]).toUtc();
      DateTime today = DateTime.now();

      return parsedDate.month == today.month && parsedDate.day == today.day;
    } catch (e) {
      return false;
    }
  }

  Future<void> _loadFriendProfile() async {
    if (widget.friendId == null) return;

    try {
      final result = await ApiService.getFriendProfile(widget.friendId!);
      if (mounted && result.containsKey('friend')) {
        setState(() {
          _friendBirthdayToday = _isBirthdayToday(result['friend']['birthday']);
        });
      }
    } catch (e) {
      debugPrint("Error loading friend profile: $e");
    }
  }

  Future<void> _handleSmartReply() async {
    if (_isGeneratingReply) return;

    setState(() {
      _isGeneratingReply = true;
    });

    try {
      final result = await ApiService.getSmartReply(widget.conversationId);

      if (mounted) {
        if (result.containsKey('error') && result['error'] != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['error'])),
          );
        } else if (result.containsKey('suggestion')) {
          setState(() {
            _messageController.text = result['suggestion'];
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to generate smart reply.')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingReply = false);
      }
    }
  }

  @override
  void dispose() {
    _socket.emit('leave:conversation', widget.conversationId);
    _socket.disconnect();
    _socket.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _initSocket() async {
    if (_isConnecting) return;
    setState(() => _isConnecting = true);

    final String? token = await TokenManager.getToken();

    _socket = IO.io('https://largeproject.nathanfoss.me', IO.OptionBuilder()
        .setAuth({'token': 'Bearer $token'})
        .setTransports(['websocket'])
        .setPath('/socket.io/')
        .setQuery({'forceNew': 'true', 'timestamp': DateTime.now().millisecondsSinceEpoch.toString()})
        .enableForceNew()
        .enableAutoConnect()
        .build());

    _socket.onConnect((_) {
      _socket.emit('join:conversation', widget.conversationId);
      if (mounted) setState(() => _isConnecting = false);
    });

    _socket.on('message:new', (newMessage) {
      if (mounted) {
        setState(() {
          final String incomingId = (newMessage['_id'] ?? newMessage['id'] ?? '').toString();
          if (!_messages.any((m) => (m['_id'] ?? m['id'] ?? '').toString() == incomingId)) {
            _messages.insert(0, newMessage);
          }
        });
      }
    });

    _socket.onConnectError((data) {
      debugPrint('Socket Connection Error: $data');
      if (mounted) setState(() => _isConnecting = false);
    });

    _socket.onDisconnect((reason) => debugPrint('DISCONNECTED: $reason'));
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
    final String originalText = text;
    _messageController.clear();

    final result = await ApiService.sendMessage(
      senderID: widget.currentUserId,
      conversationID: widget.conversationId,
      message: text,
    );

    if (result.containsKey('error') && result['error'] != null && result['error'].isNotEmpty) {
      _messageController.text = originalText;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result['error'])));
    }
  }

  Future<void> _fetchPrompt() async {
    try {
      final result = await ApiService.getRandomPrompt(widget.conversationId);

      if (mounted) {
        setState(() {
          if (result.containsKey('prompt') && result['prompt'] != null) {
            final promptData = result['prompt'];
            _prompt = promptData['content'] ?? promptData['text'] ?? "No prompt today!";
          } else {
            _prompt = "No prompt today!";
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _prompt = "No prompt today!");
      }
    }
  }

  String _formatTime(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return "";
    try {
      final date = DateTime.parse(isoDate).toLocal();
      final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
      final ampm = date.hour >= 12 ? "PM" : "AM";
      final minute = date.minute.toString().padLeft(2, '0');
      return "$hour:$minute $ampm";
    } catch (e) { return ""; }
  }

  @override
  Widget build(BuildContext context) {
    final double keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.only(bottom: keyboardHeight),
          child: Column(
            children: [
              const SizedBox(height: 20),
              Text("Friend Connector", style: GoogleFonts.dancingScript(fontSize: 48, color: Colors.white, fontWeight: FontWeight.bold)),
              Text("Messages", style: GoogleFonts.lora(fontSize: 18, fontStyle: FontStyle.italic, color: const Color(0xFFF0EDFF))),
              const SizedBox(height: 20),
              Expanded(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(color: const Color(0xFFF0EDFF), borderRadius: BorderRadius.circular(20)),
                  child: Column(
                    children: [
                      _buildHeader(),
                      Expanded(child: _isLoading ? const Center(child: CircularProgressIndicator()) : _buildMessageList()),
                      _buildInputArea(),
                    ],
                  ),
                ),
              ),
              if (keyboardHeight == 0) const SizedBox(height: 90),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(color: Color(0xFF3C3489), borderRadius: BorderRadius.vertical(top: Radius.circular(20), bottom: Radius.circular(20))),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: widget.onBack),
              Expanded(
                child: Column(
                  children: [
                    Text(widget.displayName, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    if (_friendBirthdayToday)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Color(0xFFF0A500),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text("🎂 Birthday today", style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                  ],
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
      decoration: BoxDecoration(color: const Color(0xFFF0A500), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.black.withOpacity(0.05), width: 1)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text("Today's Prompt", style: GoogleFonts.lora(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, fontSize: 14, color: Colors.black)),
          const SizedBox(height: 6),
          Text(_prompt, textAlign: TextAlign.center, style: GoogleFonts.lora(fontSize: 16, fontStyle: FontStyle.italic, color: Colors.black.withOpacity(0.85))),
        ],
      ),
    );
  }

  Widget _buildMessageList() {
    if (_messages.isEmpty) return const Center(child: Text("No messages yet. Say hi!"));
    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final msg = _messages[index];
        final bool isMe = msg['senderId'].toString() == widget.currentUserId.toString();
        return _chatBubble(msg['text'] ?? "", isMe, _formatTime(msg['createdAt']));
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
            child: Text(text, style: TextStyle(color: isMe ? Colors.white : Colors.black, fontSize: 16)),
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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_isGeneratingReply)
            Padding(
              padding: const EdgeInsets.only(bottom: 8.0),
              child: Row(
                children: [
                  const SizedBox(
                    width: 12,
                    height: 12,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    "generating...",
                    style: GoogleFonts.lora(fontSize: 12, color: Colors.white, fontStyle: FontStyle.italic),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              GestureDetector(
                onTap: _isGeneratingReply ? null : _handleSmartReply,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(
                    color: _isGeneratingReply ? Colors.grey : const Color(0xFFAFA9EC),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text(
                    "Smart Reply",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ),
              Expanded(
                child: TextField(
                  controller: _messageController,
                  onSubmitted: (_) => _handleSend(),
                  onTap: () {
                    Timer(const Duration(milliseconds: 300), () {
                      if (_scrollController.hasClients) {
                        _scrollController.jumpTo(0);
                      }
                    });
                  },
                  decoration: InputDecoration(
                    fillColor: Colors.white,
                    filled: true,
                    hintText: "message",
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF0A500),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: IconButton(
                  onPressed: _handleSend,
                  icon: const Icon(Icons.send, color: Colors.black),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}