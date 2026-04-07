<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
 
require_once __DIR__ . '/db.php';
 
$data    = json_decode(file_get_contents("php://input"), true);
$nom     = trim($data['nom']      ?? '');
$prenom  = trim($data['prenom']   ?? '');
$email   = trim($data['email']    ?? '');
$password= trim($data['password'] ?? '');
$orcid   = trim($data['orcid']    ?? '');
$grade   = trim($data['grade']    ?? '');
 $id_equipe = intval($data['id_equipe'] ?? 0);
function getRole($grade) {
    if (in_array($grade, ['Doctorant', 'Chercheur libre', 'MA'])) return 'Chercheur';
    if (in_array($grade, ['MCB', 'MCA'])) return 'ChefEquipe';
    if ($grade === 'Pr') return 'ChefLabo';
    return 'Chercheur';
}
$role = getRole($grade);
 
if (!$nom || !$prenom || !$email || !$password) {
    http_response_code(400);
    echo json_encode(["error" => "Tous les champs sont obligatoires"]);
    exit;
}
 
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Format email invalide"]);
    exit;
}
 
try {
    // Vérif email unique
    $stmt = $pdo->prepare("SELECT id_user FROM utilisateur WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["error" => "Email déjà utilisé"]);
        exit;
    }
 
    // Vérif ORCID unique
    if ($orcid) {
        $stmt = $pdo->prepare("SELECT id_chercheur FROM chercheur WHERE orcid_id = ?");
        $stmt->execute([$orcid]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(["error" => "ORCID déjà utilisé"]);
            exit;
        }
    }
 
    $hashed = password_hash($password, PASSWORD_DEFAULT);
 
    $pdo->beginTransaction();
 
    $stmt = $pdo->prepare("INSERT INTO utilisateur (nom, prenom, email, password, role, grade) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nom, $prenom, $email, $hashed, $role, $grade]);
    $id_user = $pdo->lastInsertId();
 
    $stmt = $pdo->prepare("INSERT INTO chercheur (orcid_id, justificatif_statut, id_user, id_equipe) VALUES (?, ?, ?, NULL)");
    $stmt->execute([$orcid, $grade, $id_user]);
 
    $pdo->commit();
 
    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Compte créé avec succès"]);
 
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Erreur DB: " . $e->getMessage()]);
}
?>
