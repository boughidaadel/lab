<?php
header('Content-Type: application/json');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


require_once __DIR__ . '/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$titre        = trim($data['titre'] ?? '');
$id_chercheur = intval($data['id_chercheur'] ?? 0);
$id_equipe    = intval($data['id_equipe'] ?? 0);
$resume       = trim($data['resume'] ?? '');
$keywords     = trim($data['keywords'] ?? '');
$annee        = intval($data['annee'] ?? date('Y'));
$type_prod    = trim($data['type_prod'] ?? 'Article');

// 1️⃣ التحقق من الحقول المطلوبة
if (!$titre || !$id_chercheur) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

// 2️⃣ تحقق من تكرار العنوان (unicité)
$check = $conn->prepare("SELECT id_prod FROM production WHERE titre = ?");
$check->execute([$titre]);
if ($check->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "Cette production existe déjà"]);
    exit;
}

// 3️⃣ التحقق من أن الـ chercheur موجود
$checkC = $conn->prepare("SELECT id_chercheur FROM chercheur WHERE id_chercheur = ?");
$checkC->execute([$id_chercheur]);
if (!$checkC->fetch()) {
    http_response_code(404);
    echo json_encode(["error" => "Chercheur not found"]);
    exit;
}

// 4️⃣ إدخال الـ production
try {
    $stmt = $conn->prepare("
        INSERT INTO production 
        (titre, type_prod, id_chercheur, id_equipe, resume_abstract, keywords, annee, status, dateSoumission) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'En cours', NOW())
    ");
    $stmt->execute([$titre, $type_prod, $id_chercheur, $id_equipe, $resume, $keywords, $annee]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Production ajoutée avec succès",
        "id_prod"  => $conn->lastInsertId()
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur DB: " . $e->getMessage()]);
}
?>