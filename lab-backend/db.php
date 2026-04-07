<?php
$host = "192.227.248.68";      // ولا IP ديال السيرفر
$db   = "db_lab"; // اسم قاعدة البيانات
$user = "lab_user";           // اسم المستخدم
$pass = "lab123";               // كلمة السر
$charset = "utf8mb4";

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit();
}
