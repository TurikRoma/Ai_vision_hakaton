class AuthenticatedUser {
  final String email;

  AuthenticatedUser({required this.email});
}

class Analysis {
  final int id;
  final String imagePath;
  final DateTime createdAt;
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
      createdAt: DateTime.parse(json['created_at']),
      recommendations: json['recommendations'],
      puffiness: json['puffiness'],
      darkCircles: json['dark_circles'],
      fatigue: json['fatigue'],
      acne: json['acne'],
      skinCondition: json['skin_condition'],
      eyesHealth: json['eyes_health'],
      skinHealth: json['skin_health'],
    );
  }
}
