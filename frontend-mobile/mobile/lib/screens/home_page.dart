import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class HomePage extends StatefulWidget {
  final String firstName;
  const HomePage({super.key, required this.firstName});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  static const Color homeWrapperBg = Color(0xFFA89FD8);
  static const Color homeWrapperBorder = Color(0xFF7B6FC4);

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        backgroundColor: CupertinoColors.systemBackground.withOpacity(0.8),
        activeColor: homeWrapperBorder,
        items: const [
          BottomNavigationBarItem(icon: Icon(CupertinoIcons.house_fill), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(CupertinoIcons.person_add_solid), label: 'Add Friends'),
          BottomNavigationBarItem(icon: Icon(CupertinoIcons.settings), label: 'Settings'),
        ],
      ),
      tabBuilder: (context, index) {
        return CupertinoTabView(
          builder: (context) => _buildPage(index),
        );
      },
    );
  }

  Widget _buildPage(int index) {
    switch (index) {
      case 0:
        return _buildHomeContent();
      case 1:
        return const Center(child: Text("Search Friends"));
      case 2:
        return const Center(child: Text("Settings"));
      default:
        return const Center(child: Text("Home"));
    }
  }

  Widget _buildHomeContent() {
    return Material(
      child: Container(
        decoration: BoxDecoration(
          color: homeWrapperBg,
          border: Border.all(color: homeWrapperBorder, width: 4),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  "Friend Connector",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'cursive',
                    fontSize: 60,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Welcome Home, ${widget.firstName}",
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'serif',
                    fontStyle: FontStyle.italic,
                    fontSize: 18,
                    color: Color(0xFFF0EDFF),
                  ),
                ),
                const SizedBox(height: 40),
                const Icon(
                  CupertinoIcons.person_3_fill,
                  size: 80,
                  color: Colors.white24,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}