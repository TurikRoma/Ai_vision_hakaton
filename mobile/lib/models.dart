class AuthenticatedUser {
  final String email;

  AuthenticatedUser({required this.email});
}

class Analysis {
  final int? id;
  final String? imagePath;
  final DateTime? createdAt;
  final String? recommendations;
  final int? puffiness;
  final int? darkCircles;
  final int? fatigue;
  final int? acne;
  final String? skinCondition;
  final int? eyesHealth;
  final int? skinHealth;

  Analysis({
    required this.id,
    required this.imagePath,
    required this.createdAt,
    this.recommendations,
    this.puffiness,
    this.darkCircles,
    this.fatigue,
    this.acne,
    this.skinCondition,
    this.eyesHealth,
    this.skinHealth,
  });

  factory Analysis.fromJson(Map<String, dynamic> json) {
    return Analysis(
      id: json['id'],
      imagePath: json['image_path'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      recommendations: json['recommendations'],
      puffiness: json['puffiness'] ?? 0,
      darkCircles: json['dark_circles'] ?? 0,
      fatigue: json['fatigue'] ?? 0,
      acne: json['acne'] ?? 0,
      skinCondition: json['skin_condition'],
      eyesHealth: json['eyes_health'] ?? 0,
      skinHealth: json['skin_health'] ?? 0,
    );
  }
}
