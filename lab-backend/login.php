<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
require_once __DIR__ . '/db.php';
$data     = json_decode(file_get_contents("php://input"), true);
$email    = trim($data['email']    ?? '');
$password = trim($data['password'] ?? '');

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Email et mot de passe obligatoires"]);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Utilisateur introuvable"]);
    exit;
}

if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Mot de passe incorrect"]);
    exit;
}

$id_chercheur = null;
$orcid        = null;
$id_equipe    = null;

$stmt2 = $pdo->prepare("SELECT id_chercheur, orcid_id, id_equipe FROM chercheur WHERE id_user = ?");
$stmt2->execute([$user['id_user']]);
$chercheur = $stmt2->fetch(PDO::FETCH_ASSOC);

if ($chercheur) {
    $id_chercheur = $chercheur['id_chercheur'];
    $orcid        = $chercheur['orcid_id'];
    $id_equipe    = $chercheur['id_equipe'];
}

http_response_code(200);
echo json_encode([
    "success" => true,
    "user" => [
        "id_user"      => $user['id_user'],
        "id_chercheur" => $id_chercheur,
        "nom"          => $user['nom'],
        "prenom"       => $user['prenom'],
        "email"        => $user['email'],
        "role"         => $user['role'],
        "grade"        => $user['grade'],
        "orcid"        => $orcid,
        "id_equipe"    => $id_equipe,
    ]
]);

exit; // <--- زيد هادي هنا ضروري