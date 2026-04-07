<?php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");


require_once 'db.php';
 
try {
    $stmt = $pdo->query("SELECT id_equipe, nomEquipe FROM equipe ORDER BY nomEquipe");
    $equipes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["success" => true, "equipes" => $equipes]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>
 