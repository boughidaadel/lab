<?php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");



require_once 'db.php';
 
$data = json_decode(file_get_contents("php://input"), true);
 
$id_prod   = intval($data['id_prod'] ?? 0);
$titre     = trim($data['titre'] ?? '');
$type_prod = $data['type_prod'] ?? 'Article';
$resume    = $data['resume'] ?? '';
$keywords  = $data['keywords'] ?? '';
$annee     = $data['annee'] ?? date('Y');
 
if (!$id_prod || !$titre) {
    echo json_encode(["success" => false, "error" => "Données manquantes"]);
    exit();
}
 
// Vérifier que la production n'est pas validée
$check = $pdo->prepare("SELECT status FROM production WHERE id_prod = ?");
$check->execute([$id_prod]);
$prod = $check->fetch(PDO::FETCH_ASSOC);
if (!$prod) { echo json_encode(["success" => false, "error" => "Production introuvable"]); exit(); }
if ($prod['status'] === 'Validée') { echo json_encode(["success" => false, "error" => "Impossible de modifier une production validée"]); exit(); }
 
try {
    $stmt = $pdo->prepare("
        UPDATE production SET titre=?, type_prod=?, resume_abstract=?, keywords=?, annee=?
        WHERE id_prod=?
    ");
    $stmt->execute([$titre, $type_prod, $resume, $keywords, $annee, $id_prod]);
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>