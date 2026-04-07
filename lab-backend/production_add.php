<?php
// 1. زيد هادو باش تريڨل مشكل الـ CORS نهائيا
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// 2. معالجة طلب الـ OPTIONS اللي يبعثو المتصفح قبل الـ POST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php'; // من الأفضل استعمال __DIR__

$data = json_decode(file_get_contents("php://input"), true);

// إذا ما وصل والو من React
if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Aucune donnée reçue"]);
    exit();
}

$titre        = trim($data['titre'] ?? '');
$type_prod    = trim($data['type_prod'] ?? 'Article');
$resume       = trim($data['resume'] ?? '');
$keywords     = trim($data['keywords'] ?? '');
$annee        = trim($data['annee'] ?? date('Y'));
$id_chercheur = intval($data['id_chercheur'] ?? 0);
$id_equipe    = !empty($data['id_equipe']) ? intval($data['id_equipe']) : 13; // الديفولت 13

// 3. التحقق الأساسي
if (!$titre || !$id_chercheur) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Titre et chercheur obligatoires"]);
    exit();
}

try {
    // 4. Vérification unicité
    $check = $pdo->prepare("SELECT id_prod FROM production WHERE LOWER(titre) = LOWER(?) AND id_chercheur = ?");
    $check->execute([$titre, $id_chercheur]);
    if ($check->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "error" => "Cette production existe déjà !"]);
        exit();
    }

    // 5. الإدخال في قاعدة البيانات
    $stmt = $pdo->prepare("
        INSERT INTO production 
        (titre, type_prod, id_chercheur, id_equipe, resume_abstract, keywords, annee, status, dateSoumission) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'En cours', NOW())
    ");
    
    // تأكد من تطابق الترتيب هنا مع الترتيب في الـ VALUES
    $stmt->execute([
        $titre, 
        $type_prod, 
        $id_chercheur, 
        $id_equipe, 
        $resume, 
        $keywords, 
        $annee
    ]);
    
    $id_prod = $pdo->lastInsertId();
    
    http_response_code(201); // 201 معناها Created
    echo json_encode(["success" => true, "id_prod" => $id_prod, "message" => "Production ajoutée"]);

} catch (PDOException $e) {
    http_response_code(500);
    // نبعثو تفاصيل الخطأ تاع الـ DB باش نعرفو وين راه المشكل إذا زاد خرج
    echo json_encode(["success" => false, "error" => "Erreur DB: " . $e->getMessage()]);
}
?>