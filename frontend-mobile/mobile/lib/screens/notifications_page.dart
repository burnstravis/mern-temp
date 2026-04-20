import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class NotificationsPage extends StatefulWidget {
  final String currentUserId;
  final Function(String convId, String name) onOpenChat;

  const NotificationsPage({
    super.key,
    required this.currentUserId,
    required this.onOpenChat,
  });

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  final Map<String, String> _friendActions = {};

  static const Color cardBg = Color(0xFFAFA9EC);
  static const Color headerTextBlue = Color(0xFF3C3489);
  static const Color actionButtonBg = Color(0xFFF0A500);

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final result = await ApiService.getNotifications();

    // FIX: Check mounted before updating state
    if (!mounted) return;

    setState(() {
      _notifications = result['notifications'] ?? [];
      _isLoading = false;
    });
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return "";
    try {
      DateTime dt = DateTime.parse(dateStr).toLocal();
      return DateFormat('MMM d, h:mm a').format(dt);
    } catch (e) {
      return "";
    }
  }

  Future<void> _handleOpenChat(dynamic notif) async {
    String type = (notif['type'] ?? "").toString();

    // Aligns with React: senderFirstName + senderLastName
    String firstName = notif['senderFirstName'] ?? "Friend";
    String lastName = notif['senderLastName'] ?? "";
    String fullName = "$firstName $lastName".trim();

    try {
      // Determine ID to use (senderId per web app logic)
      String friendId = notif['senderId'] ?? notif['requesterId'] ?? notif['relatedId'] ?? "";

      if (friendId.isNotEmpty) {
        if (type == 'new_message') {
          String convId = notif['relatedId'] ?? "";
          if (convId.isNotEmpty) {
            widget.onOpenChat(convId, fullName);
            _handleMarkRead(notif['_id']);
          }
        } else {
          // Equivalent to openChatWith's POST to /api/conversations
          final res = await ApiService.startConversation(friendId);
          if (res.containsKey('conversationId')) {
            widget.onOpenChat(res['conversationId'], fullName);
            _handleMarkRead(notif['_id']);
          }
        }
      }
    } catch (e) {
      debugPrint("Chat Error: $e");
    }
  }

  Future<void> _handleAcceptFriend(dynamic notif) async {
    final String? friendshipId = notif['relatedId'];
    if (friendshipId == null) return;

    try {
      final res = await ApiService.acceptFriendRequest(friendshipId, friendshipId);

      // FIX: Check mounted before updating state
      if (!mounted) return;

      if (res['error'] == null || res['error'] == "") {
        setState(() => _friendActions[notif['_id']] = 'accept');
        _handleMarkRead(notif['_id']);
      }
    } catch (e) {
      debugPrint("Accept Error: $e");
    }
  }

  Future<void> _handleMarkRead(String id) async {
    await ApiService.markNotificationRead(id);

    // FIX: Check mounted before updating state
    if (!mounted) return;

    setState(() {
      final index = _notifications.indexWhere((n) => n['_id'] == id);
      if (index != -1) _notifications[index]['isRead'] = true;
    });
  }

  String _getIcon(String type) {
    switch (type) {
      case 'friend_request': return '👤';
      case 'new_message': return '💬';
      case 'birthday': return '🎂';
      case 'alert': return '🤝';
      case 'support_received': return '💙';
      case 'support_needed': return '👋';
      case 'birthday_wish_received': return '🎉';
      default: return '🔔';
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
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              shadows: [const Shadow(color: Colors.black26, offset: Offset(1, 2), blurRadius: 6)],
            ),
          ),
          Text(
            "Notifications",
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
                    "Recent Notifications",
                    style: GoogleFonts.lora(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        fontStyle: FontStyle.italic,
                        color: headerTextBlue
                    ),
                  ),
                  const SizedBox(height: 20),
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: _loadNotifications,
                      color: headerTextBlue,
                      child: _buildContent(),
                    ),
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

  Widget _buildContent() {
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: headerTextBlue));
    if (_notifications.isEmpty) {
      return Center(child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none, size: 64, color: headerTextBlue.withOpacity(0.3)),
          const SizedBox(height: 10),
          Text("All caught up!", style: GoogleFonts.lora(color: headerTextBlue, fontSize: 18)),
        ],
      ));
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 20),
      itemCount: _notifications.length,
      itemBuilder: (context, index) => _notificationCard(_notifications[index]),
    );
  }

  Widget _notificationCard(dynamic notif) {
    bool isRead = notif['isRead'] ?? false;
    String type = (notif['type'] ?? "").toString();
    String? resolved = _friendActions[notif['_id']];
    String? messageContent = notif['message'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(15),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4, offset: const Offset(1, 2)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => (type != 'friend_request') ? _handleOpenChat(notif) : null,
          borderRadius: BorderRadius.circular(15),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(12)),
                      child: Text(_getIcon(type), style: const TextStyle(fontSize: 20)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            notif['content'] ?? "",
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: isRead ? FontWeight.w400 : FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(notif['createdAt']),
                            style: GoogleFonts.poppins(fontSize: 11, color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                    if (!isRead)
                      Container(
                        margin: const EdgeInsets.only(top: 5),
                        width: 10, height: 10,
                        decoration: const BoxDecoration(color: actionButtonBg, shape: BoxShape.circle),
                      ),
                  ],
                ),
                if (messageContent != null && messageContent.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    messageContent,
                    style: GoogleFonts.poppins(fontSize: 13, color: Colors.white.withOpacity(0.9)),
                  ),
                ],
                const SizedBox(height: 15),
                if (type == 'friend_request')
                  resolved == null
                      ? Row(children: [
                    Expanded(child: _buildActionBtn("Accept", () => _handleAcceptFriend(notif), actionButtonBg, Colors.black87)),
                    const SizedBox(width: 10),
                    Expanded(child: _buildActionBtn("Decline", () {
                      if (mounted) {
                        setState(() => _friendActions[notif['_id']] = 'decline');
                        _handleMarkRead(notif['_id']);
                      }
                    }, Colors.white12, Colors.white)),
                  ])
                      : Text(
                    resolved == 'accept' ? "✓ Friend Request Accepted" : "Declined",
                    style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13, fontStyle: FontStyle.italic),
                  ),
                if (type == 'support_needed' || type == 'new_message')
                  _buildActionBtn(
                      type == 'new_message' ? "Reply Now" : "Message Friend",
                          () => _handleOpenChat(notif),
                      actionButtonBg,
                      Colors.black87
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionBtn(String label, VoidCallback onTap, Color bg, Color text) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: text,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
        child: Text(label, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13, fontStyle: FontStyle.italic)),
      ),
    );
  }
}