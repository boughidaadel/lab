<?php
header('Content-Type: text/html; charset=utf-8');
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/db.php';
 
$id_equipe = intval($_GET['id_equipe'] ?? 0);
$period    = trim($_GET['period']    ?? 'annuel');
$format    = trim($_GET['format']    ?? 'pdf');
$year      = intval($_GET['year']    ?? date('Y'));
 
if (!$id_equipe) { die("ID équipe manquant"); }
 
// ── 1. تحديد الفترة ──────────────────────────────────────
if ($period === '6mois') {
    $dateLimit   = date('Y-m-d', strtotime('-6 months'));
    $periodLabel = "Rapport Semestriel (" . date('M Y', strtotime('-6 months')) . " — " . date('M Y') . ")";
} elseif ($period === 'custom') {
    $dateLimit   = "$year-01-01";
    $periodLabel = "Rapport Annuel $year";
} else {
    $dateLimit   = date('Y') . "-01-01";
    $periodLabel = "Rapport Annuel " . date('Y');
}
 
// ── 2. جلب معلومات الفريق ────────────────────────────────
$stmtE = $conn->prepare("SELECT nomEquipe, axesRecherche FROM equipe WHERE id_equipe = ?");
$stmtE->execute([$id_equipe]);
$equipe = $stmtE->fetch();
if (!$equipe) { die("Équipe non trouvée (id=$id_equipe)"); }
 
// ── 3. جلب الأعضاء ───────────────────────────────────────
$stmtM = $conn->prepare("
    SELECT u.nom, u.prenom, u.grade, u.email, c.orcid_id, c.id_chercheur
    FROM chercheur c
    JOIN utilisateur u ON u.id_user = c.id_user
    WHERE c.id_equipe = ?
    ORDER BY u.nom
");
$stmtM->execute([$id_equipe]);
$membres = $stmtM->fetchAll();
 
// ── 4. جلب Productions ───────────────────────────────────
$stmtP = $conn->prepare("
    SELECT p.titre, p.type_prod, p.annee, p.status,
           p.keywords, p.indication,
           u.nom AS nom, u.prenom AS prenom
    FROM production p
    JOIN chercheur c ON c.id_chercheur = p.id_chercheur
    JOIN utilisateur u ON u.id_user = c.id_user
    WHERE c.id_equipe = ?
      AND p.dateSoumission >= ?
    ORDER BY p.annee DESC, p.status
");
$stmtP->execute([$id_equipe, $dateLimit]);
$productions = $stmtP->fetchAll();
 
// ── 5. إحصائيات ──────────────────────────────────────────
$total    = count($productions);
$validees = array_values(array_filter($productions, function($p){ return $p['status'] === 'Validée';   }));
$enCours  = array_values(array_filter($productions, function($p){ return $p['status'] === 'En cours';  }));
$rejetees = array_values(array_filter($productions, function($p){ return $p['status'] === 'Rejetée';   }));
 
$byType = [
    'Article'    => count(array_filter($productions, function($p){ return $p['type_prod'] === 'Article';    })),
    'Conférence' => count(array_filter($productions, function($p){ return $p['type_prod'] === 'Conférence'; })),
    'Thèse'      => count(array_filter($productions, function($p){ return $p['type_prod'] === 'Thèse';      })),
];
 
// Top 3
$memberStats = [];
foreach ($membres as $m) {
    $cnt = 0;
    foreach ($productions as $p) {
        if ($p['nom'] === $m['nom'] && $p['prenom'] === $m['prenom'] && $p['status'] === 'Validée') $cnt++;
    }
    $memberStats[] = ['nom' => $m['nom'], 'prenom' => $m['prenom'], 'grade' => $m['grade'], 'count' => $cnt];
}
usort($memberStats, function($a,$b){ return $b['count'] - $a['count']; });
$top3 = array_slice($memberStats, 0, 3);
 
// ══════════════════════════════════════════════════════════
// FORMAT EXCEL (CSV)
// ══════════════════════════════════════════════════════════
if ($format === 'excel') {
    $filename = 'rapport_equipe_' . $period . '_' . date('Ymd') . '.csv';
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Pragma: no-cache');
 
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM UTF-8
 
    fputcsv($out, ["RAPPORT D'EQUIPE - " . strtoupper($equipe['nomEquipe'])], ';');
    fputcsv($out, [$periodLabel], ';');
    fputcsv($out, ["Genere le: " . date('d/m/Y H:i')], ';');
    fputcsv($out, [], ';');
 
    fputcsv($out, ["=== STATISTIQUES GENERALES ==="], ';');
    fputcsv($out, ["Total Productions", $total], ';');
    fputcsv($out, ["Validees",          count($validees)], ';');
    fputcsv($out, ["En cours",          count($enCours)],  ';');
    fputcsv($out, ["Rejetees",          count($rejetees)], ';');
    fputcsv($out, ["Membres",           count($membres)],  ';');
    fputcsv($out, [], ';');
 
    fputcsv($out, ["=== PAR TYPE ==="], ';');
    foreach ($byType as $type => $cnt) {
        fputcsv($out, [$type, $cnt], ';');
    }
    fputcsv($out, [], ';');
 
    fputcsv($out, ["=== TOP 3 CHERCHEURS ==="], ';');
    fputcsv($out, ["Rang","Nom","Prenom","Grade","Productions Validees"], ';');
    foreach ($top3 as $i => $m) {
        fputcsv($out, [$i+1, $m['nom'], $m['prenom'], $m['grade'], $m['count']], ';');
    }
    fputcsv($out, [], ';');
 
    fputcsv($out, ["=== LISTE DES PRODUCTIONS ==="], ';');
    fputcsv($out, ["Titre","Type","Auteur","Annee","Statut","Mots-cles","Remarque"], ';');
    foreach ($productions as $p) {
        fputcsv($out, [
            $p['titre'], $p['type_prod'],
            $p['prenom'].' '.$p['nom'],
            $p['annee'], $p['status'],
            $p['keywords']  ?? '',
            $p['indication'] ?? ''
        ], ';');
    }
    fclose($out);
    exit;
}
 
// ══════════════════════════════════════════════════════════
// FORMAT PDF (HTML)
// ══════════════════════════════════════════════════════════
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport — <?= htmlspecialchars($equipe['nomEquipe']) ?></title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f9fafb;color:#1f2937;padding:40px}
.print-btn{background:linear-gradient(135deg,#a855f7,#6366f1);color:white;border:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:28px}
.header{background:linear-gradient(135deg,#a855f7,#6366f1);color:white;padding:32px;border-radius:16px;margin-bottom:28px}
.header h1{font-size:22px;font-weight:800;margin-bottom:4px}
.header p{opacity:.85;font-size:13px;margin-top:4px}
.section{background:white;border-radius:12px;padding:24px;margin-bottom:20px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.section h2{font-size:15px;font-weight:700;color:#a855f7;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #f3f4f6}
.kpis{display:flex;gap:14px;flex-wrap:wrap}
.kpi{flex:1;min-width:110px;background:#f9fafb;border-radius:10px;padding:16px;text-align:center;border:1px solid #e5e7eb}
.kpi-num{font-size:30px;font-weight:900;margin-bottom:4px}
.kpi-label{font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase}
table{width:100%;border-collapse:collapse;font-size:13px}
thead{background:#a855f7;color:white}
th{padding:11px 12px;text-align:left;font-weight:700;font-size:11px;text-transform:uppercase}
td{padding:10px 12px;border-bottom:1px solid #f3f4f6}
tr:nth-child(even) td{background:#fafafa}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
.bv{background:#d1fae5;color:#065f46}
.be{background:#fef3c7;color:#92400e}
.br{background:#fee2e2;color:#991b1b}
.top3{display:flex;gap:14px;flex-wrap:wrap}
.top3-card{flex:1;min-width:140px;background:#f9fafb;border-radius:10px;padding:16px;text-align:center;border:1px solid #e5e7eb}
.medal{font-size:28px;margin-bottom:6px}
.top3-name{font-weight:800;font-size:14px}
.top3-grade{color:#6b7280;font-size:11px;margin-bottom:4px}
.top3-count{font-size:22px;font-weight:900;color:#a855f7}
.footer{text-align:center;color:#9ca3af;font-size:11px;margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb}
@media print{
    body{background:white;padding:20px}
    .print-btn{display:none}
    .header,.thead{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
 
<button class="print-btn" onclick="window.print()">🖨️ Imprimer / Sauvegarder en PDF</button>
 
<div class="header">
    <h1>📊 <?= htmlspecialchars($periodLabel) ?></h1>
    <p>Équipe : <strong><?= htmlspecialchars($equipe['nomEquipe']) ?></strong>
       &nbsp;|&nbsp; Axes : <?= htmlspecialchars($equipe['axesRecherche'] ?? 'N/A') ?></p>
    <p>Généré le <?= date('d/m/Y à H:i') ?></p>
</div>
 
<!-- KPIs -->
<div class="section">
    <h2>📈 Indicateurs de Performance (KPIs)</h2>
    <div class="kpis">
        <div class="kpi"><div class="kpi-num" style="color:#6366f1"><?= $total ?></div><div class="kpi-label">Total</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#059669"><?= count($validees) ?></div><div class="kpi-label">Validées</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#d97706"><?= count($enCours) ?></div><div class="kpi-label">En cours</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#dc2626"><?= count($rejetees) ?></div><div class="kpi-label">Rejetées</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#a855f7"><?= count($membres) ?></div><div class="kpi-label">Membres</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#0ea5e9"><?= $byType['Article'] ?></div><div class="kpi-label">Articles</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#ec4899"><?= $byType['Conférence'] ?></div><div class="kpi-label">Conférences</div></div>
        <div class="kpi"><div class="kpi-num" style="color:#f43f5e"><?= $byType['Thèse'] ?></div><div class="kpi-label">Thèses</div></div>
    </div>
</div>
 
<!-- Top 3 -->
<?php if (!empty($top3)): ?>
<div class="section">
    <h2>🏆 Top 3 Chercheurs les Plus Productifs</h2>
    <div class="top3">
        <?php
        $medals = ["🥇","🥈","🥉"];
        foreach ($top3 as $i => $m):
        ?>
        <div class="top3-card">
            <div class="medal"><?= $medals[$i] ?></div>
            <div class="top3-name"><?= htmlspecialchars($m['prenom'].' '.$m['nom']) ?></div>
            <div class="top3-grade"><?= htmlspecialchars($m['grade']) ?></div>
            <div class="top3-count"><?= $m['count'] ?></div>
            <div style="font-size:11px;color:#6b7280">productions validées</div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
<?php endif; ?>
 
<!-- Membres -->
<div class="section">
    <h2>👥 Membres de l'Équipe (<?= count($membres) ?>)</h2>
    <?php if (empty($membres)): ?>
        <p style="color:#9ca3af;text-align:center;padding:20px">Aucun membre dans cette équipe.</p>
    <?php else: ?>
    <table>
        <thead><tr><th>#</th><th>Nom & Prénom</th><th>Grade</th><th>Email</th><th>ORCID</th></tr></thead>
        <tbody>
        <?php foreach ($membres as $i => $m): ?>
            <tr>
                <td><?= $i+1 ?></td>
                <td style="font-weight:600"><?= htmlspecialchars($m['prenom'].' '.$m['nom']) ?></td>
                <td><?= htmlspecialchars($m['grade']) ?></td>
                <td style="color:#6b7280"><?= htmlspecialchars($m['email']) ?></td>
                <td style="color:#a855f7;font-size:11px"><?= htmlspecialchars($m['orcid_id'] ?? 'N/A') ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>
</div>
 
<!-- Productions -->
<div class="section">
    <h2>📚 Liste des Productions (<?= $total ?>)</h2>
    <?php if (empty($productions)): ?>
        <p style="color:#9ca3af;text-align:center;padding:20px">Aucune production pour cette période.</p>
    <?php else: ?>
    <table>
        <thead>
            <tr><th>#</th><th>Titre</th><th>Type</th><th>Auteur</th><th>Année</th><th>Statut</th><th>Mots-clés</th></tr>
        </thead>
        <tbody>
        <?php foreach ($productions as $i => $p):
            $bc = $p['status'] === 'Validée' ? 'bv' : ($p['status'] === 'En cours' ? 'be' : 'br');
        ?>
            <tr>
                <td><?= $i+1 ?></td>
                <td style="font-weight:600"><?= htmlspecialchars($p['titre']) ?></td>
                <td><?= htmlspecialchars($p['type_prod']) ?></td>
                <td><?= htmlspecialchars($p['prenom'].' '.$p['nom']) ?></td>
                <td><?= $p['annee'] ?></td>
                <td><span class="badge <?= $bc ?>"><?= $p['status'] ?></span></td>
                <td style="color:#6b7280;font-size:11px"><?= htmlspecialchars($p['keywords'] ?? '') ?></td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
    <?php endif; ?>
</div>
 
<div class="footer">
    Lab Management System — <?= htmlspecialchars($equipe['nomEquipe']) ?> &copy; <?= date('Y') ?>
</div>
 
</body>
</html>
