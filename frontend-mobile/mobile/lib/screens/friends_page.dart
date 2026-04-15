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

  // Helper to create a Friend from the JSON returned by your MERN API
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

  // API State
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
    _fetchFriends(); // Initial fetch on load
  }

  Future<void> _fetchFriends({String search = ""}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    // Calling the API service you provided
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
          // Map the 'friends' list from JSON to our Friend objects
          final List<dynamic> friendsJson = result['friends'] ?? [];
          _friends = friendsJson.map((json) => Friend.fromJson(json)).toList();
          _totalPages = result['totalPages'] ?? 1;
        }
      });
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

              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
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

                    // Search Bar
                    Container(
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
                              _pageNumber = 1; // Reset to first page on search
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
                    ),
                    const SizedBox(height: 20),

                    // Error or Loading or List
                    if (_errorMessage.isNotEmpty)
                      Text(_errorMessage, style: const TextStyle(color: Colors.red))
                    else if (_isLoading)
                      const CircularProgressIndicator(color: searchHeaderBg)
                    else if (_friends.isEmpty)
                        const Text("No friends found.")
                      else
                        ..._friends.map((friend) => _buildFriendCard(friend)),

                    // Pagination Controls (Matches Friends.tsx)
                    const SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios, size: 16),
                          onPressed: _pageNumber > 1 ? () {
                            _pageNumber--;
                            _fetchFriends(search: _searchController.text);
                          } : null,
                        ),
                        Text("Page $_pageNumber of $_totalPages", style: GoogleFonts.lora()),
                        IconButton(
                          icon: const Icon(Icons.arrow_forward_ios, size: 16),
                          onPressed: _pageNumber < _totalPages ? () {
                            _pageNumber++;
                            _fetchFriends(search: _searchController.text);
                          } : null,
                        ),
                      ],
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
              onPressed: () {
                if (widget.onOpenChat != null) {
                  widget.onOpenChat!(friend.id, "${friend.firstName} ${friend.lastName}");
                }
              },
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