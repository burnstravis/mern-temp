class LoginResponse {
  final String id;
  final String firstName;
  final String lastName;
  final String accessToken;
  final String error;

  LoginResponse({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.accessToken,
    required this.error,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      id: json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      accessToken: json['accessToken'] ?? '',
      error: json['error'] ?? '',
    );
  }
}