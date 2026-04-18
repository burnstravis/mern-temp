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

  List<dynamic> _foundUsers = [];
  bool _isLoading = false;
  String _message = '';

  // Pagination State
  int _pageNumber = 1;
  int _totalPages = 1;

  static const Color searchHeaderBg = Color(0xFF3C3489);
  static const Color findButtonOrange = Color(0xFFF0A500);
  static const Color cardBg = Color(0xFFAFA9EC);

  @override
  void initState() {
    super.initState();
    _getUsers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _getUsers({String searchText = ""}) async {
    setState(() {
      _isLoading = true;
      _message = '';
    });

    final result = await ApiService.getUsers(
      search: searchText,
      page: _pageNumber,
      limit: 10, // Hardcoded to 10 as requested
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        if (result.containsKey('error')) {
          _message = result['error'];
          _foundUsers = [];
          _totalPages = 1;
        } else {
          _foundUsers = result['users'] ?? [];
          _totalPages = result['totalPages'] ?? 1;
        }
      });
    }
  }

  Future<void> _sendRequest(String username) async {
    setState(() => _message = 'Sending request...');
    final result = await ApiService.addFriend(username);

    if (mounted) {
      setState(() {
        if (result.containsKey('error') && result['error'].isNotEmpty) {
          _message = result['error'];
        } else {
          _message = 'Friend request sent to @$username!';
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          const SizedBox(height: 20),
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
                    "Discover Friends",
                    style: GoogleFonts.lora(fontSize: 32, fontWeight: FontWeight.bold, color: const Color(0xFF3C3489)),
                  ),
                  const SizedBox(height: 20),
                  _buildSearchBar(),
                  const SizedBox(height: 20),

                  if (_isLoading)
                    const Expanded(child: Center(child: CircularProgressIndicator(color: searchHeaderBg)))
                  else if (_foundUsers.isEmpty)
                    Expanded(child: Center(child: Text(_message.isEmpty ? "No users found." : _message)))
                  else
                    Expanded(child: _buildUserList()),

                  // --- PAGINATION CONTROLS RESTORED ---
                  if (!_isLoading && _foundUsers.isNotEmpty) _buildPaginationControls(),

                  if (_message.isNotEmpty && _foundUsers.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(_message, style: const TextStyle(color: searchHeaderBg, fontWeight: FontWeight.bold)),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 90),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 55,
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: searchHeaderBg, borderRadius: BorderRadius.circular(20)),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
              child: TextField(
                controller: _searchController,
                decoration: const InputDecoration(hintText: "Search username", border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                onSubmitted: (val) {
                  _pageNumber = 1;
                  _getUsers(searchText: val);
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              _pageNumber = 1;
              _getUsers(searchText: _searchController.text);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: findButtonOrange, borderRadius: BorderRadius.circular(10)),
              alignment: Alignment.center,
              child: const Text("Find", style: TextStyle(fontWeight: FontWeight.bold)),
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
            _getUsers(searchText: _searchController.text);
          } : null,
        ),
        Text("Page $_pageNumber of $_totalPages", style: GoogleFonts.lora(fontSize: 12)),
        IconButton(
          icon: const Icon(Icons.arrow_forward_ios, size: 16),
          onPressed: _pageNumber < _totalPages ? () {
            setState(() => _pageNumber++);
            _getUsers(searchText: _searchController.text);
          } : null,
        ),
      ],
    );
  }

  Widget _buildUserList() {
    return ListView.builder(
      itemCount: _foundUsers.length,
      itemBuilder: (context, index) {
        final user = _foundUsers[index];

        // Helper to capitalize first letter
        String fixCase(dynamic text) {
          String s = (text ?? "").toString().trim();
          if (s.isEmpty) return "";
          return s[0].toUpperCase() + s.substring(1);
        }

        final firstName = fixCase(user['firstName']);
        final lastName = fixCase(user['lastName']);
        final displayName = "$firstName $lastName".trim();

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 8),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4, offset: const Offset(1, 2))
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "@${user['username']}",
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontStyle: FontStyle.italic,
                          fontSize: 18
                      ),
                    ),
                    Text(
                      displayName.isEmpty ? "No Name Provided" : displayName,
                      style: const TextStyle(fontSize: 14, color: Colors.black87),
                    ),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () => _sendRequest(user['username']),
                style: ElevatedButton.styleFrom(
                  backgroundColor: findButtonOrange,
                  foregroundColor: Colors.black,
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text("Send", style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      },
    );
  }
}