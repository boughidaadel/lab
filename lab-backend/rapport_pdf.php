<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'db.php';
 
$id_chercheur = intval($_GET['id_chercheur'] ?? 0);
if (!$id_chercheur) { echo json_encode(["success" => false, "error" => "id_chercheur manquant"]); exit(); }
 
try {
    // Infos chercheur
    $stmt = $pdo->prepare("
        SELECT u.nom, u.prenom, u.email, u.grade, c.orcid_id, e.nomEquipe
        FROM chercheur c
        JOIN utilisateur u ON c.id_user = u.id_user
        LEFT JOIN equipe e ON c.id_equipe = e.id_equipe
        WHERE c.id_chercheur = ?
    ");
    $stmt->execute([$id_chercheur]);
    $chercheur = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$chercheur) { echo json_encode(["success" => false, "error" => "Chercheur introuvable"]); exit(); }
 
    // Productions
    $stmt = $pdo->prepare("
        SELECT titre, type_prod, annee, status, keywords, indication
        FROM production WHERE id_chercheur = ?
        ORDER BY annee DESC
    ");
    $stmt->execute([$id_chercheur]);
    $productions = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
    // Stats
    $total    = count($productions);
    $validees = count(array_filter($productions, fn($p) => $p['status'] === 'Validée'));
    $enCours  = count(array_filter($productions, fn($p) => $p['status'] === 'En cours'));
    $rejetees = count(array_filter($productions, fn($p) => $p['status'] === 'Rejetée'));
 
    // Génération HTML → PDF (simple HTML pour impression)
    header('Content-Type: text/html; charset=utf-8');
 
    $nom    = htmlspecialchars($chercheur['prenom'] . ' ' . $chercheur['nom']);
    $grade  = htmlspecialchars($chercheur['grade'] ?? '');
    $email  = htmlspecialchars($chercheur['email'] ?? '');
    $orcid  = htmlspecialchars($chercheur['orcid_id'] ?? 'N/A');
    $equipe = htmlspecialchars($chercheur['nomEquipe'] ?? 'N/A');
    $date   = date('d/m/Y');
 
    echo "<!DOCTYPE html><html lang='fr'><head>
    <meta charset='UTF-8'>
    <title>Rapport - $nom</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1f2937; background: white; }
        h1 { color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .info-item label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; display: block; }
        .info-item span { font-size: 14px; font-weight: 600; color: #1f2937; }
        .stats { display: flex; gap: 16px; margin-bottom: 30px; }
        .stat { flex: 1; padding: 16px; border-radius: 10px; text-align: center; }
        .stat .num { font-size: 28px; font-weight: 900; }
        .stat .lbl { font-size: 11px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #6366f1; color: white; padding: 10px; text-align: left; font-size: 12px; }
        td { padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        tr:nth-child(even) { background: #f9fafb; }
        .badge { padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; display: inline-block; }
        .Validée  { background: rgba(0,255,136,0.15); color: #059669; }
        .En-cours { background: rgba(245,158,11,0.15); color: #d97706; }
        .Rejetée  { background: rgba(255,77,77,0.15); color: #dc2626; }
        .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 11px; }
        @media print { body { margin: 20px; } }
    </style>
    <script>window.onload = function() { window.print(); }</script>
    </head><body>
    <h1>📊 Rapport Scientifique Individuel</h1>
    <p style='color:#9ca3af; margin-top:-10px;'>Généré le $date</p>
 
    <div class='info-grid'>
        <div class='info-item'><label>Nom complet</label><span>$nom</span></div>
        <div class='info-item'><label>Grade</label><span>$grade</span></div>
        <div class='info-item'><label>Email</label><span>$email</span></div>
        <div class='info-item'><label>ORCID</label><span>$orcid</span></div>
        <div class='info-item'><label>Équipe</label><span>$equipe</span></div>
    </div>
 
    <h2>📈 Statistiques</h2>
    <div class='stats'>
        <div class='stat' style='background:#ede9fe;'><div class='num' style='color:#6366f1;'>$total</div><div class='lbl' style='color:#6366f1;'>Total</div></div>
        <div class='stat' style='background:#d1fae5;'><div class='num' style='color:#059669;'>$validees</div><div class='lbl' style='color:#059669;'>Validées</div></div>
        <div class='stat' style='background:#fef3c7;'><div class='num' style='color:#d97706;'>$enCours</div><div class='lbl' style='color:#d97706;'>En cours</div></div>
        <div class='stat' style='background:#fee2e2;'><div class='num' style='color:#dc2626;'>$rejetees</div><div class='lbl' style='color:#dc2626;'>Rejetées</div></div>
    </div>
 
    <h2>📚 Liste des Productions</h2>
    <table>
        <tr><th>Titre</th><th>Type</th><th>Année</th><th>Statut</th></tr>";
 
    foreach ($productions as $p) {
        $titre   = htmlspecialchars($p['titre']);
        $type    = htmlspecialchars($p['type_prod']);
        $annee   = htmlspecialchars($p['annee']);
        $status  = htmlspecialchars($p['status']);
        $cls     = str_replace(' ', '-', $status);
        $emoji   = $type === 'Article' ? '📄' : ($type === 'Conférence' ? '🎤' : '🎓');
        echo "<tr><td>$emoji $titre</td><td>$type</td><td>$annee</td><td><span class='badge $cls'>$status</span></td></tr>";
    }
 
    echo "</table>
    <div class='footer'>Laboratoire - Université Annaba · Lab Management System · $date</div>
    </body></html>";
 
} catch (PDOException $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>