import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:friend_connector_mobile/screens/discoverfriends_page.dart';
import '../services/api_service.dart';

import 'messages_page.dart';
import 'friends_page.dart';
import 'conversation_page.dart';
import 'notifications_page.dart';
import 'support_page.dart';

class HomePage extends StatefulWidget {
  final String firstName;
  const HomePage({super.key, required this.firstName});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  int _lastIndex = 0;

  String? _activeConversationId;
  String? _activeFriendName;
  String? _currentUserId;

  static const Color homeWrapperBg = Color(0xFFA89FD8);
  static const Color homeWrapperBorder = Color(0xFF7B6FC4);
  static const Color figmaBlue = Color(0xFF3C3489);

  @override
  void initState() {
    super.initState();
    _loadUserInfo();
  }

  Future<void> _loadUserInfo() async {
    final userId = await ApiService.getUserIdFromToken();


    if (mounted) {
      setState(() {
        _currentUserId = userId ?? "";
      });
    }
  }

  void _navigateToConversation(String convId, String name, int returnIndex) {

    setState(() {
      _activeConversationId = convId;
      _activeFriendName = name;
      _lastIndex = returnIndex; // Stores where we came from (e.g., index 4 for Alerts)
      _selectedIndex = 6;       // Switches view to the ConversationPage
    });
  }

  void _doLogout() {
    Navigator.of(context).pushReplacementNamed('/');
  }

  @override
  Widget build(BuildContext context) {
    final EdgeInsets safePadding = MediaQuery.of(context).padding;

    return Scaffold(

      resizeToAvoidBottomInset: false,
      backgroundColor: homeWrapperBg,
      body: Stack(
        children: [
          // The current page content
          Positioned.fill(
            child: _buildPage(_selectedIndex),
          ),

          // Edge Border (Decorative)
          IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: homeWrapperBorder, width: 4),
                borderRadius: BorderRadius.circular(48),
              ),
            ),
          ),

          // Logout Button
          Positioned(
            top: safePadding.top + 10,
            right: 20,
            child: GestureDetector(
              onTap: _doLogout,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child:  Row(
                  children: [
                    Icon(Icons.logout, size: 16, color: Colors.black87),
                    SizedBox(width: 2),
                  ],
                ),
              ),
            ),
          ),

          // Floating Nav Bar
          Positioned(
            left: 12,
            right: 12,
            bottom: safePadding.bottom + 10,
            child: _buildFloatingNavBar(),
          ),
        ],
      ),
    );
  }

  Widget _buildFloatingNavBar() {
    return Container(
      height: 70,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(35),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildNavItem(0, CupertinoIcons.house_fill, "Home"),
          _buildNavItem(1, CupertinoIcons.chat_bubble_fill, "Messages"),
          _buildNavItem(2, CupertinoIcons.person_2_fill, "Friends"),
          _buildNavItem(3, CupertinoIcons.compass_fill, "Discover"),
          _buildNavItem(4, CupertinoIcons.bell_fill, "Alerts"),
          _buildNavItem(5, CupertinoIcons.envelope_open_fill, "Support"),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () {
        if (_selectedIndex == index) return;
        setState(() {
          _lastIndex = _selectedIndex;
          _selectedIndex = index;
        });
      },
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: MediaQuery.of(context).size.width / 7,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: isSelected ? 42 : 0,
                  height: 28,
                  decoration: BoxDecoration(color: isSelected ? figmaBlue : Colors.transparent, borderRadius: BorderRadius.circular(10)),
                ),
                Icon(icon, color: isSelected ? Colors.white : Colors.black45, size: 20),
              ],
            ),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 8, color: isSelected ? figmaBlue : Colors.black87, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(int index) {
    switch (index) {
      case 0: return _buildHomeView();
      case 1:
        return MessagesPage(
          onOpenChat: (convId, name) => _navigateToConversation(convId, name, 1),
        );
      case 2:
        return FriendsPage(
          onOpenChat: (convId, name) => _navigateToConversation(convId, name, 2),
        );
      case 3: return const DiscoverPage();
      case 4:
        if (_currentUserId == null || _currentUserId!.isEmpty) {
          return const Center(child: CircularProgressIndicator(color: Colors.white));
        }
        return NotificationsPage(
          currentUserId: _currentUserId!,
          onOpenChat: (convId, name) => _navigateToConversation(convId, name, 4),
        );
        case 5: return SupportPage(firstName: widget.firstName);
        case 6:
          if (_currentUserId == null || _currentUserId!.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: Colors.white));
          }
          return ConversationPage(
            // Use ValueKey so the state persists across keyboard toggles
            key: ValueKey(_activeConversationId),
            conversationId: _activeConversationId ?? "",
            currentUserId: _currentUserId!,
            displayName: _activeFriendName ?? "Friend",
            onBack: () {
              setState(() {
                _selectedIndex = _lastIndex;
              });
            },
          );
      default: return _buildHomeView();
    }
  }

  Widget _buildHomeView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            "Friend Connector",
            style: GoogleFonts.dancingScript(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              shadows: [const Shadow(color: Colors.black26, offset: Offset(1, 2), blurRadius: 6)],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            "Welcome Home ${widget.firstName.isNotEmpty ? widget.firstName[0].toUpperCase() + widget.firstName.substring(1) : ''}",
            style: GoogleFonts.lora(
                fontSize: 18,
                fontStyle: FontStyle.italic,
                color: Colors.white70
            ),
          ),
          const SizedBox(height: 40),
          const Icon(CupertinoIcons.person_3_fill, size: 80, color: Colors.white12),
        ],
      ),
    );
  }

}