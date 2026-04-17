import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class Friend {
  final String id;
  final String firstName;
  final String lastName;
  final String username;
  final String birthday;

  Friend({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.birthday,
  });

  factory Friend.fromJson(Map<String, dynamic> json) {
    return Friend(
      id: json['_id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      username: json['username'] ?? '',
      birthday: json['birthday'] ?? '',
    );
  }
}

class FriendsPage extends StatefulWidget {
  const FriendsPage({super.key, this.onOpenChat});

  final Function(String id, String name)? onOpenChat;

  @override
  State<FriendsPage> createState() => _FriendsPageState();
}

class _FriendsPageState extends State<FriendsPage> {
  final TextEditingController _searchController = TextEditingController();

  List<Friend> _friends = [];
  bool _isLoading = false;
  int _pageNumber = 1;
  int _totalPages = 1;
  String _errorMessage = "";

  static const Color searchHeaderBg = Color(0xFF3C3489);
  static const Color findButtonOrange = Color(0xFFF0A500);
  static const Color cardBg = Color(0xFFAFA9EC);
  static const Color orangeUnderline = Color(0xFFF0A500);

  @override
  void initState() {
    super.initState();
    _fetchFriends();
  }

  Future<void> _fetchFriends({String search = ""}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    final result = await ApiService.friendsList(
        search: search,
        page: _pageNumber,
        limit: 10
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.containsKey('error')) {
          _errorMessage = result['error'];
          _friends = [];
        } else {
          final List<dynamic> friendsJson = result['friends'] ?? [];
          _friends = friendsJson.map((json) => Friend.fromJson(json)).toList();
          _totalPages = result['totalPages'] ?? 1;
        }
      });
    }
  }

  /// Logic added to match Web App getConvId behavior
  Future<void> _initiateChat(Friend friend) async {
    // Show a temporary loading indicator so the user knows it's processing
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: Colors.white)),
    );

    final result = await ApiService.startConversation(friend.id);

    if (mounted) {
      Navigator.pop(context); // Remove loading indicator

      if (result.containsKey('conversationId')) {
        // Pass the actual conversationId to the parent navigation
        widget.onOpenChat?.call(
            result['conversationId'],
            "${friend.firstName} ${friend.lastName}".trim().isEmpty ? friend.username : "${friend.firstName} ${friend.lastName}"
        );
      } else {
        // Handle error (e.g., toast or snackbar)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['error'] ?? "Failed to initialize chat")),
        );
      }
    }
  }

  String _formatDate(String date) {
    if (date.isEmpty) return "N/A";
    final cleanDate = date.contains('T') ? date.split('T')[0] : date;
    return cleanDate.replaceAll('-', '/');
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
            "Friends",
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
                    "Friends List",
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
                    child: _buildContent(),
                  ),

                  if (!_isLoading && _friends.isNotEmpty)
                    _buildPaginationControls(),
                ],
              ),
            ),
          ),
          const SizedBox(height: 90),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_errorMessage.isNotEmpty) {
      return Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.red)));
    }

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: searchHeaderBg));
    }

    if (_friends.isEmpty) {
      return const Center(child: Text("No friends found."));
    }

    return ListView.builder(
      itemCount: _friends.length,
      padding: const EdgeInsets.only(bottom: 10),
      itemBuilder: (context, index) {
        return _buildFriendCard(_friends[index]);
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
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: TextField(
                controller: _searchController,
                textAlignVertical: TextAlignVertical.center,
                style: const TextStyle(color: Color.fromRGBO(0, 0, 0, 0.7), fontSize: 16),
                decoration: const InputDecoration(
                  hintText: "Search username",
                  hintStyle: TextStyle(color: Color.fromRGBO(0, 0, 0, 0.4)),
                  border: InputBorder.none,
                  isCollapsed: true,
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              _pageNumber = 1;
              _fetchFriends(search: _searchController.text);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: findButtonOrange,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                "Find",
                style: TextStyle(color: Colors.black87, fontStyle: FontStyle.italic, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaginationControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 16),
          onPressed: _pageNumber > 1 ? () {
            setState(() => _pageNumber--);
            _fetchFriends(search: _searchController.text);
          } : null,
        ),
        Text("Page $_pageNumber of $_totalPages", style: GoogleFonts.lora(fontSize: 12)),
        IconButton(
          icon: const Icon(Icons.arrow_forward_ios, size: 16),
          onPressed: _pageNumber < _totalPages ? () {
            setState(() => _pageNumber++);
            _fetchFriends(search: _searchController.text);
          } : null,
        ),
      ],
    );
  }

  Widget _buildFriendCard(Friend friend) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(10),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6, offset: const Offset(1, 2))],
      ),
      child: Column(
        children: [
          Text(
            "@${friend.username}",
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.only(bottom: 2),
                  decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: orangeUnderline, width: 2))),
                  child: Text(
                    "${friend.firstName} ${friend.lastName}",
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF3C3489)),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.only(bottom: 2),
                  decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: orangeUnderline, width: 2))),
                  child: Text(
                    "DOB: ${_formatDate(friend.birthday)}",
                    style: const TextStyle(fontSize: 16, color: Color(0xFF3C3489)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: 120,
            height: 40,
            child: ElevatedButton(
              onPressed: () => _initiateChat(friend), // Updated logic
              style: ElevatedButton.styleFrom(
                backgroundColor: findButtonOrange,
                foregroundColor: Colors.black87,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
              ),
              child: const Text("Open Chat", style: TextStyle(fontStyle: FontStyle.italic, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}