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
  Set<String> _friendIds = {};          // Added: Track existing friends
  Set<String> _pendingRequestIds = {};  // Added: Track requests sent in this session
  bool _isLoading = false;
  String _message = '';

  int _pageNumber = 1;
  int _totalPages = 1;

  static const Color searchHeaderBg = Color(0xFF3C3489);
  static const Color findButtonOrange = Color(0xFFF0A500);
  static const Color cardBg = Color(0xFFAFA9EC);

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  // Added: Logic to fetch friends list before searching users
  Future<void> _loadInitialData() async {
    await _fetchFriends();
    _getUsers();
  }

  // Added: Fetch existing friends to filter them out of discovery
  Future<void> _fetchFriends() async {
    final result = await ApiService.friendsList();
    if (result.containsKey('friends')) {
      final myId = await ApiService.getUserIdFromToken();
      if (mounted) {
        setState(() {
          _friendIds = (result['friends'] as List)
              .map((f) => f['_id'].toString())
              .toSet();
          if (myId != null) _friendIds.add(myId); // Don't show self
        });
      }
    }
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
      limit: 10,
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

  // Updated: Now accepts the full user object to handle IDs and notifications
  Future<void> _sendRequest(dynamic user) async {
    final String username = user['username'];
    final String targetUserId = user['_id'].toString();

    setState(() => _message = 'Sending request...');

    final result = await ApiService.addFriend(username);

    if (mounted) {
      if (result.containsKey('error') && result['error'].isNotEmpty) {
        setState(() => _message = result['error']);
      } else {
        // Added: Notification logic matching web app
        if (result['friendshipId'] != null) {
          // Note: Logic follows web's sendFriendRequestNotification
          final myId = await ApiService.getUserIdFromToken();
          // We use a generic 'Someone' or you can fetch your user name from storage
          await ApiService.createSupportRequest(
              "Someone sent you a friend request!",
              "friend_request"
          );
        }

        setState(() {
          _pendingRequestIds.add(targetUserId);
          _message = 'Friend request sent to @$username!';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Added: Client-side filtering logic matching the web app
    final filteredUsers = _foundUsers.where((user) {
      final id = user['_id'].toString();
      return !_friendIds.contains(id) && !_pendingRequestIds.contains(id);
    }).toList();

    return SafeArea(
      child: Column(
        children: [
          const SizedBox(height: 20),
          Text(
            "Friend Connector",
            style: GoogleFonts.dancingScript(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              shadows: [const Shadow(color: Colors.black26, offset: Offset(1, 2), blurRadius: 6)],
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
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 6, offset: const Offset(1, 2))
                ],
              ),
              child: Column(
                children: [
                  Text(
                    "Add New Friends",
                    style: GoogleFonts.lora(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        fontStyle: FontStyle.italic,
                        color: const Color(0xFF3C3489)
                    ),
                  ),
                  const SizedBox(height: 20),
                  _buildSearchBar(),
                  const SizedBox(height: 20),
                  if (_isLoading)
                    const Expanded(child: Center(child: CircularProgressIndicator(color: searchHeaderBg)))
                  else if (filteredUsers.isEmpty)
                    Expanded(child: Center(child: Text(_message.isEmpty ? "No users found." : _message)))
                  else
                    Expanded(child: RefreshIndicator(
                        onRefresh: () => _getUsers(searchText: _searchController.text),
                        color: searchHeaderBg,
                        child: _buildUserList(filteredUsers)
                    )),
                  if (!_isLoading && filteredUsers.isNotEmpty) _buildPaginationControls(),
                  // Fixed: Display message even if list is empty to show "Request Sent"
                  if (_message.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(_message,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: searchHeaderBg, fontWeight: FontWeight.bold, fontSize: 13)),
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
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(color: Color.fromRGBO(0, 0, 0, 0.7), fontSize: 16),
                decoration: const InputDecoration(
                    hintText: "Search",
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12)
                ),
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
              child: const Text("Find", style: TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic)),
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

  Widget _buildUserList(List<dynamic> users) {
    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: users.length,
      itemBuilder: (context, index) {
        final user = users[index];

        String fixCase(dynamic text) {
          String s = (text ?? "").toString().trim();
          if (s.isEmpty) return "";
          return s[0].toUpperCase() + s.substring(1);
        }

        final firstName = fixCase(user['firstName']);
        final lastName = fixCase(user['lastName']);
        final displayName = "$firstName $lastName".trim();

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(15),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4, offset: const Offset(1, 2))
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
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
                  onPressed: () => _sendRequest(user), // Updated to send object
                  style: ElevatedButton.styleFrom(
                    backgroundColor: findButtonOrange,
                    foregroundColor: Colors.black,
                    elevation: 2,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text("Send", style: TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}