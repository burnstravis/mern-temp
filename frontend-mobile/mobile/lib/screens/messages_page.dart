import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
}

class MessagesPage extends StatefulWidget {
  final Function(String id, String name)? onOpenChat;

  const MessagesPage({super.key, this.onOpenChat});

  @override
  State<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends State<MessagesPage> {
  final TextEditingController _searchController = TextEditingController();

  static const Color homeWrapperBg = Color(0xFFA89FD8);
  static const Color cardBg = Color(0xFFAFA9EC);
  static const Color searchHeaderBg = Color(0xFF3C3489);
  static const Color findButtonBg = Color(0xFFF0A500);


  final List<Conversation> _allConversations = [
    Conversation(id: "conv_001",
        otherUserName: "Sarah",
        lastText: "See you at the team meeting!",
        lastMessageAt: "2026-04-03T10:30:00Z"),
    Conversation(id: "conv_002",
        otherUserName: "John",
        lastText: "Did you finish the project?",
        lastMessageAt: "2026-04-02T15:45:00Z"),
    Conversation(id: "conv_003",
        otherUserName: "BossMan",
        lastText: "where u at man",
        lastMessageAt: "2026-04-02T15:45:00Z"),
    Conversation(id: "conv_004",
        otherUserName: "Bob",
        lastText: "Hows ur fish doing",
        lastMessageAt: "2026-04-02T15:45:00Z"),
  ];

  List<Conversation> _filteredConversations = [];

  @override
  void initState() {
    super.initState();
    _filteredConversations = _allConversations;
  }

  String _formatTimeAgo(String dateString) {
    final now = DateTime.now();
    final past = DateTime.parse(dateString);
    final diff = now.difference(past);
    if (diff.inSeconds < 60) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${(diff.inDays / 7).floor()}w';
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
          child: Column(
            children: [
              Text(
                "Friend Connector",
                style: GoogleFonts.dancingScript(
                  fontSize: 64,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  shadows: [
                    const Shadow(color: Colors.black26,
                        offset: Offset(1, 2),
                        blurRadius: 6)
                  ],
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


              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 40),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.3),
                        blurRadius: 6,
                        offset: const Offset(1, 2))
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

                    // .conversationHeader
                    Container(
                      height: 55, // Fixed height to match CSS
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: searchHeaderBg,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.3),
                              blurRadius: 6,
                              offset: const Offset(1, 2))
                        ],
                      ),

                      child: Row(

                        children: [
                          Expanded(
                            child: Container(
                              height: double.infinity, // Fill the 55px header
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              // Centering Container for the TextField
                              child: Center(
                                child: TextField(
                                  controller: _searchController,
                                  textAlignVertical: TextAlignVertical.center,
                                  style: const TextStyle(
                                      color: Color.fromRGBO(0, 0, 0, 0.7),
                                      fontSize: 16),
                                  decoration: const InputDecoration(
                                    hintText: "Search username",
                                    hintStyle: TextStyle(
                                        color: Color.fromRGBO(0, 0, 0, 0.4)),
                                    border: InputBorder.none,
                                    isCollapsed: true,
                                    // Crucial for vertical centering
                                    contentPadding: EdgeInsets.symmetric(
                                        horizontal: 12),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _filteredConversations = _allConversations
                                    .where((c) =>
                                    c.otherUserName.toLowerCase().contains(
                                        _searchController.text.toLowerCase()))
                                    .toList();
                              });
                            },
                            child: Container(
                              height: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16),
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: findButtonBg,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Text(
                                "Find",
                                style: TextStyle(
                                  color: Colors.black87,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _filteredConversations.length,
                      itemBuilder: (context, index) {
                        final conv = _filteredConversations[index];
                        return _buildConversationCard(conv);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConversationCard(Conversation conv) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: cardBg,
        borderRadius: BorderRadius.circular(10),
        clipBehavior: Clip.antiAlias,
        elevation: 3,
        child: InkWell(
          // FIX: Call the callback from the widget property
          onTap: () {
            if (widget.onOpenChat != null) {
              widget.onOpenChat!(conv.id, conv.otherUserName);
            }
          },
          splashColor: Colors.white.withOpacity(0.2),
          highlightColor: Colors.transparent,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        conv.otherUserName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          fontStyle: FontStyle.italic,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              conv.lastText,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.lora(
                                fontSize: 16,
                                color: Colors.black.withOpacity(0.79),
                              ),
                            ),
                          ),
                          Text(
                            _formatTimeAgo(conv.lastMessageAt),
                            style: GoogleFonts.lora(
                              fontSize: 12,
                              color: Colors.black.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                // Optional: Add the chevron icon to match the "clickable" feel
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.white.withOpacity(0.5),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}