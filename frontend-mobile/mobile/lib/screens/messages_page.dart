import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class Conversation {
  final String id;
  final String otherUserName;
  final String lastText;
  final String lastMessageAt;

  Conversation({
    required this.id,
    required this.otherUserName,
    required this.lastText,
    required this.lastMessageAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    final otherUser = json['otherUser'] ?? {};
    String firstName = otherUser['firstName'] ?? '';
    String lastName = otherUser['lastName'] ?? '';

    String displayName = "$firstName $lastName".trim();
    if (displayName.isEmpty) {
      displayName = otherUser['username'] ?? 'Unknown User';
    }

    return Conversation(
      id: json['_id'] ?? '',
      otherUserName: displayName,
      lastText: json['lastMessage'] ?? 'No messages yet...',
      lastMessageAt: json['lastMessageAt'] ?? DateTime.now().toIso8601String(),
    );
  }
}

class MessagesPage extends StatefulWidget {
  final Function(String id, String name)? onOpenChat;
  const MessagesPage({super.key, this.onOpenChat});

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  final TextEditingController _searchController = TextEditingController();

  List<Conversation> _allConversations = [];
  List<Conversation> _filteredConversations = [];
  bool _isLoading = false;
  String _errorMessage = "";

  static const Color cardBg = Color(0xFFAFA9EC);
  static const Color searchHeaderBg = Color(0xFF3C3489);
  static const Color findButtonBg = Color(0xFFF0A500);

  @override
  void initState() {
    super.initState();
    _fetchConversations();
  }

  Future<void> _fetchConversations() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    final result = await ApiService.getConversations();

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.containsKey('error') && result['error'].isNotEmpty) {
          _errorMessage = result['error'];
        } else {
          final List<dynamic> convsJson = result['conversations'] ?? [];
          _allConversations = convsJson.map((j) => Conversation.fromJson(j)).toList();
          _filteredConversations = _allConversations;
        }
      });
    }
  }

  void _filterList(String query) {
    setState(() {
      _filteredConversations = _allConversations
          .where((c) => c.otherUserName.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  String _formatTimeAgo(String dateString) {
    try {
      final now = DateTime.now();
      final past = DateTime.parse(dateString).toLocal();
      final diff = now.difference(past);
      if (diff.inSeconds < 60) return 'now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m';
      if (diff.inHours < 24) return '${diff.inHours}h';
      if (diff.inDays < 7) return '${diff.inDays}d';
      return '${(diff.inDays / 7).floor()}w';
    } catch (e) {
      return "";
    }
  }

  @override
  Widget build(BuildContext context) {
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
              shadows: [const Shadow(color: Colors.black26, offset: Offset(1, 2), blurRadius: 6)],
            ),
          ),
          Text(
            "Messages",
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
                    "Messages",
                    style: GoogleFonts.lora(
                      fontSize: 32,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF3C3489),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildSearchBar(),
                  const SizedBox(height: 20),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _fetchConversations,
                      color: searchHeaderBg,
                      child: _buildContent(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 90), // Nav bar spacing
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading && _allConversations.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: searchHeaderBg));
    }
    if (_errorMessage.isNotEmpty) {
      return SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          height: 200,
          child: Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red))),
        ),
      );
    }
    if (_filteredConversations.isEmpty) {
      return const Center(child: Text("No messages found."));
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: _filteredConversations.length,
      itemBuilder: (context, index) {
        return _buildConversationCard(_filteredConversations[index]);
      },
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 55,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: searchHeaderBg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6, offset: const Offset(1, 2))
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _filterList,
                decoration: const InputDecoration(
                  hintText: "Search conversations",
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _filterList(_searchController.text),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: findButtonBg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text("Find", style: TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConversationCard(Conversation conv) {
    // Apply capitalization to display name
    String capitalizedName = conv.otherUserName.isNotEmpty
        ? conv.otherUserName[0].toUpperCase() + conv.otherUserName.substring(1)
        : conv.otherUserName;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4, offset: const Offset(1, 2))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => widget.onOpenChat?.call(conv.id, capitalizedName),
          borderRadius: BorderRadius.circular(15),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        capitalizedName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontStyle: FontStyle.italic,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              conv.lastText,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.black87),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _formatTimeAgo(conv.lastMessageAt),
                            style: const TextStyle(fontSize: 12, color: Colors.black54),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.white70),
              ],
            ),
          ),
        ),
      ),
    );
  }
}