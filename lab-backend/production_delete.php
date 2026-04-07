<?php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


require_once 'db.php';
 

$data = json_decode(file_get_contents("php://input"), true);
 
$id_prod      = intval($data['id_prod'] ?? 0);
$id_chercheur = intval($data['id_chercheur'] ?? 0);
 
if (!$id_prod || !$id_chercheur) {
    echo json_encode(["success" => false, "error" => "Données manquantes"]);
    exit();
}
 
// Vérifier status et appartenance
$check = $pdo->prepare("SELECT status FROM production WHERE id_prod=? AND id_chercheur=?");
$check->execute([$id_prod, $id_chercheur]);
$prod = $check->fetch(PDO::FETCH_ASSOC);
if (!$prod) { echo json_encode(["success" => false, "error" => "Production introuvable"]); exit(); }
if ($prod['status'] === 'Validée') { echo json_encode(["success" => false, "error" => "Impossible de supprimer une production validée"]); exit(); }
 
try {
    $stmt = $pdo->prepare("DELETE FROM production WHERE id_prod=? AND id_chercheur=?");
    $stmt->execute([$id_prod, $id_chercheur]);
    echo json_encode(["success" => true]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>