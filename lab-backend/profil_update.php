<?php
header('Content-Type: application/json');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$id_chercheur = intval($data['id_chercheur'] ?? 0);
$nom          = trim($data['nom'] ?? '');
$prenom       = trim($data['prenom'] ?? '');
$email        = trim($data['email'] ?? '');
$orcid        = trim($data['orcid'] ?? '');

if (!$id_chercheur || !$nom || !$prenom || !$email) {
    http_response_code(400);
    echo json_encode(["error" => "Champs requis manquants"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Email invalide"]);
    exit;
}

try {
    // تحديث utilisateur
    $stmt = $conn->prepare("
        UPDATE utilisateur 
        SET nom = ?, prenom = ?, email = ?
        WHERE id_user = (
            SELECT id_user FROM chercheur WHERE id_chercheur = ?
        )
    ");
    $stmt->execute([$nom, $prenom, $email, $id_chercheur]);

    // تحديث orcid في chercheur
    $stmt2 = $conn->prepare("
        UPDATE chercheur SET orcid_id = ? WHERE id_chercheur = ?
    ");
    $stmt2->execute([$orcid, $id_chercheur]);

    // تحديث localStorage بالبيانات الجديدة
    echo json_encode([
        "success" => true,
        "user" => [
            "nom"    => $nom,
            "prenom" => $prenom,
            "email"  => $email,
            "orcid"  => $orcid
        ]
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur DB: " . $e->getMessage()]);
}
?>