import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:friend_connector_mobile/services/api_service.dart';

class DiscoverPage extends StatefulWidget {
  const DiscoverPage({super.key});

  @override
  State<DiscoverPage> createState() => _DiscoverPageState();
}

class _DiscoverPageState extends State<DiscoverPage> {
  final TextEditingController _searchController = TextEditingController();
  String _message = '';

  static const Color searchHeaderBg = Color(0xFF3C3489);
  static const Color findButtonOrange = Color(0xFFF0A500);
  static const Color cardBg = Color(0xFFAFA9EC);
  static const Color orangeUnderline = Color(0xFFF0A500);

  // Mock data matching your React 'fakeUsers'
  final List<Map<String, String>> _allUsers = [
    {
      '_id': '69d4944bdc68a7a71ca1c6e4',
      'username': 'tech_wizard',
      'firstName': 'Alice',
      'lastName': 'Smith',
      'birthday': '1995-11-23'
    },
    {
      '_id': '69d4944bdc68a7a71ca1c6e5',
      'username': 'nature_lover',
      'firstName': 'Bob',
      'lastName': 'Green',
      'birthday': '1992-02-14'
    }
  ];

  List<Map<String, String>> _filteredUsers = [];

  @override
  void initState() {
    super.initState();
    _filteredUsers = _allUsers;
  }

  void _handleSearch(String text) {
    setState(() {
      _filteredUsers = _allUsers
          .where((user) => user['username']!
          .toLowerCase()
          .contains(text.toLowerCase()))
          .toList();
    });
  }

  Future<void> _sendRequest(String username) async {
    setState(() => _message = '');

    // Using the ApiService we fixed earlier
    final result = await ApiService.addFriend(username);

    setState(() {
      if (result.containsKey('error')) {
        _message = result['error'];
      } else {
        _message = 'Friend request sent to @$username!';
      }
    });
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
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            "Discover Friends",
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
              ),
              child: Column(
                children: [
                  Text(
                    "Add New Friends",
                    style: GoogleFonts.lora(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF3C3489),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildSearchBar(),

                  const SizedBox(height: 20),
                  Expanded(child: _buildUserList()),
                  if (_message.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(_message, style: const TextStyle(color: Colors.blueGrey)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 90), // Spacing for floating nav bar
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    // FIXED: Added 'return' keyword
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
                onChanged: _handleSearch, // Search as you type
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
            onTap: () => _handleSearch(_searchController.text),
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

  Widget _buildUserList() {
    if (_filteredUsers.isEmpty) {
      return const Center(child: Text("No users found."));
    }

    return ListView.builder(
      itemCount: _filteredUsers.length,
      itemBuilder: (context, index) {
        final user = _filteredUsers[index];
        return Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFAFA9EC),
            borderRadius: BorderRadius.circular(10),
            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(1, 2))],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("@${user['username']}",
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18, fontStyle: FontStyle.italic)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text("${user['firstName']} ${user['lastName']}", style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 8),
                      Text(user['birthday']!, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                    ],
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () => _sendRequest(user['username']!),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF0A500),
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text("Send", style: TextStyle(fontStyle: FontStyle.italic, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      },
    );
  }
}