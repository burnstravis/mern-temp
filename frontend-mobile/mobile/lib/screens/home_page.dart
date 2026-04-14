import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HomePage extends StatefulWidget {
  final String firstName;
  const HomePage({super.key, required this.firstName});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  static const Color homeWrapperBg = Color(0xFFA89FD8);
  static const Color homeWrapperBorder = Color(0xFF7B6FC4);
  static const Color figmaBlue = Color(0xFF63A7FF);

  void _doLogout() {
    Navigator.of(context).pushReplacementNamed('/');
  }

  @override
  Widget build(BuildContext context) {
    final EdgeInsets safePadding = MediaQuery.of(context).padding;

    return Scaffold(
      backgroundColor: homeWrapperBg,
      body: Stack(
        children: [
          // 1. THE MAIN CONTENT
          Positioned.fill(
            child: _buildPage(_selectedIndex),
          ),

          // 2. THE EDGE-TO-EDGE BORDER
          IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: homeWrapperBorder, width: 4),
                borderRadius: BorderRadius.circular(64),
              ),
            ),
          ),

          // 3. LOGOUT BUTTON
          Positioned(
            top: safePadding.top + 10,
            right: 25,
            child: GestureDetector(
              onTap: _doLogout,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.logout, size: 16, color: Colors.white),
                    SizedBox(width: 4),
                    Text("Logout",
                      style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)
                    ),
                  ],
                ),
              ),
            ),
          ),

          Positioned(
            left: 12, // Slightly wider to accommodate more items
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
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
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
          _buildNavItem(5, CupertinoIcons.settings_solid, "Settings"),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: MediaQuery.of(context).size.width / 7, // Ensure even distribution
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: isSelected ? 42 : 0, // Shrunk slightly to fit 6 items
                  height: 28,
                  decoration: BoxDecoration(
                    color: isSelected ? figmaBlue : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                Icon(
                  icon,
                  color: isSelected ? Colors.white : Colors.black45,
                  size: 20, // Shrunk from 24 to 20
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 8, // Shrunk from 10 to 8 for 6 items
                color: isSelected ? figmaBlue : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(int index) {
    switch (index) {
      case 0: return _buildHomeView();
      case 1: return const Center(child: Text("Messages", style: TextStyle(color: Colors.white)));
      case 2: return const Center(child: Text("Friends", style: TextStyle(color: Colors.white)));
      case 3: return const Center(child: Text("Discover", style: TextStyle(color: Colors.white)));
      case 4: return const Center(child: Text("Notifications", style: TextStyle(color: Colors.white)));
      case 5: return _buildSettingsView();
      default: return _buildHomeView();
    }
  }


  Widget _buildHomeView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Material(
            type: MaterialType.transparency,
            child: Text(
              "Friend Connector",
              style: GoogleFonts.dancingScript(
                fontSize: 50,
                fontWeight: FontWeight.bold,
                color: Colors.white
              ),
            ),
          ),
          const SizedBox(height: 10),
          Material(
            type: MaterialType.transparency,
            child: Text(
              "Welcome, ${widget.firstName}",
              style: GoogleFonts.lora(
                fontSize: 18,
                fontStyle: FontStyle.italic,
                color: Colors.white70
              ),
            ),
          ),
          const SizedBox(height: 40),
          const Icon(CupertinoIcons.person_3_fill, size: 80, color: Colors.white12),
        ],
      ),
    );
  }

  Widget _buildSettingsView() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 80),
            Text(
              "Settings",
              style: GoogleFonts.lora(
                fontSize: 32,
                color: Colors.white,
                fontWeight: FontWeight.bold
              ),
            ),
            const Divider(color: Colors.white24, height: 40),
            _settingsTile(Icons.person_outline, "Account Info"),
            _settingsTile(Icons.notifications_none, "Push Notifications"),
            _settingsTile(Icons.lock_outline, "Privacy & Security"),
          ],
        ),
      ),
    );
  }

  Widget _settingsTile(IconData icon, String title) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: Colors.white70),
      title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16)),
      trailing: const Icon(Icons.chevron_right, color: Colors.white24),
      onTap: () {},
    );
  }
}