<?php

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");



require_once 'db.php';
 
$id_prod      = intval($_POST['id_prod'] ?? 0);
$id_chercheur = intval($_POST['id_chercheur'] ?? 0);
 
if (!$id_prod || !$id_chercheur) {
    echo json_encode(["success" => false, "error" => "Données manquantes"]);
    exit();
}
 
if (!isset($_FILES['fichier']) || $_FILES['fichier']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "error" => "Fichier manquant ou erreur upload"]);
    exit();
}
 
$file     = $_FILES['fichier'];
$ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed  = ['pdf'];
 
if (!in_array($ext, $allowed)) {
    echo json_encode(["success" => false, "error" => "Seuls les fichiers PDF sont acceptés"]);
    exit();
}
 
if ($file['size'] > 10 * 1024 * 1024) {
    echo json_encode(["success" => false, "error" => "Fichier trop grand (max 10MB)"]);
    exit();
}
 
$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
 
$filename = "prod_{$id_prod}_{$id_chercheur}_" . time() . ".pdf";
$filepath = $uploadDir . $filename;
 
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    try {
        $stmt = $pdo->prepare("UPDATE production SET fichier=? WHERE id_prod=? AND id_chercheur=?");
        $stmt->execute([$filename, $id_prod, $id_chercheur]);
        echo json_encode(["success" => true, "fichier" => $filename]);
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Erreur lors de l'enregistrement du fichier"]);
}
?>