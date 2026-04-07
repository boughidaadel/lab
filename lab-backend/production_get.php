<?php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS"); // هنا درنا GET لأننا نجيبو معلومات
header("Access-Control-Allow-Headers: Content-Type");

header('Content-Type: application/json'); // مهم باش React يفهم JSON
require_once 'db.php';

$id_chercheur = isset($_GET['id_chercheur']) ? intval($_GET['id_chercheur']) : 0;

if (!$id_chercheur) {
    echo json_encode(["success" => false, "error" => "id_chercheur manquant"]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT p.id_prod, p.titre, p.type_prod, p.status, p.indication,
               p.annee, p.resume_abstract, p.keywords, p.dateSoumission, p.fichier, p.id_equipe
        FROM production p
        WHERE p.id_chercheur = ?
        ORDER BY p.createdDate DESC
    ");
    $stmt->execute([$id_chercheur]);
    $productions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["success" => true, "productions" => $productions]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>