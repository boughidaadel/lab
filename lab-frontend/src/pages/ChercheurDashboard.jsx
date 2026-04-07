import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconHome, IconUser, IconBook, IconActivity, IconChart,
    IconLogout, IconPlus, IconUpload, IconMenu, IconClose,
    IconCheck, IconClock, IconX, IconEdit, IconTrash,
    IconDownload, IconAlert
} from '../components/Icons';

// ============================================================
// CONFIGURATIONS STATIQUES
// ============================================================
const STATUS_CONFIG = {
    "Validée": { color: "#00ff88", bg: "rgba(0,255,136,0.1)", icon: <IconCheck /> },
    "En cours": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: <IconClock /> },
    "Rejetée": { color: "#ff4d4d", bg: "rgba(255,77,77,0.1)", icon: <IconX /> },
};

const TYPE_CONFIG = {
    "Article": { color: "#6366f1", bg: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.4)", emoji: "📄" },
    "Conférence": { color: "#a855f7", bg: "rgba(168,85,247,0.15)", border: "rgba(168,85,247,0.4)", emoji: "🎤" },
    "Thèse": { color: "#ec4899", bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.4)", emoji: "🎓" },
};

const EQUIPES_STATIC = [
    { id: 13, nom: "Équipe Intelligence Artificielle", code: "EIA" },
    { id: 14, nom: "Équipe Réseaux & Systèmes Distribués", code: "ERSD" },
    { id: 15, nom: "Équipe Sécurité Informatique", code: "ESI" },
    { id: 16, nom: "Équipe Bioinformatique", code: "EBI" },
];

const API_BASE = "http://localhost/lab_management/lab-backend";

// ============================================================
// COMPONENT PRINCIPAL
// ============================================================
export default function ChercheurDashboard({ user }) {
    const navigate = useNavigate();
    const currentUser = user || JSON.parse(localStorage.getItem("loggedUser")) || {};

    const [activeSection, setActiveSection] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editProd, setEditProd] = useState(null);
    const [productions, setProductions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({ ...currentUser });
    const [profileSaved, setProfileSaved] = useState(false);
    const [duplicateWarn, setDuplicateWarn] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState({});

    const [newProd, setNewProd] = useState({
        type_prod: "Article", titre: "", resume_abstract: "",
        keywords: "", annee: new Date().getFullYear(),
        id_equipe: currentUser.id_equipe || 1, fichier: null,
    });

    useEffect(() => {
        if (currentUser.id_chercheur) fetchProductions();
    }, [currentUser.id_chercheur]);

    const fetchProductions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/production_get.php?id_chercheur=${currentUser.id_chercheur}`);
            const result = await res.json();
            if (result.success) setProductions(result.productions);
        } catch (err) {
            console.error("Erreur chargement productions:", err);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: productions.length,
        validées: productions.filter(p => p.status === "Validée").length,
        enCours: productions.filter(p => p.status === "En cours").length,
        rejetées: productions.filter(p => p.status === "Rejetée").length,
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: <IconHome /> },
        { id: "profil", label: "Mon Profil", icon: <IconUser /> },
        { id: "productions", label: "Productions", icon: <IconBook /> },
        { id: "workflow", label: "Suivi Workflow", icon: <IconActivity /> },
        { id: "statistiques", label: "Statistiques", icon: <IconChart /> },
    ];

    const handleLogout = () => {
        localStorage.removeItem("loggedUser");
        navigate('/login');
    };

    // ============================================================
    // LOGIQUE CRUD
    // ============================================================
    const handleSaveProfil = async () => {
        try {
            const res = await fetch(`${API_BASE}/profil_update.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_chercheur: currentUser.id_chercheur,
                    nom: profileData.nom,
                    prenom: profileData.prenom,
                    email: profileData.email,
                    orcid: profileData.orcid,
                })
            });
            const result = await res.json();
            if (result.success) {
                const updatedUser = { ...currentUser, ...profileData };
                localStorage.setItem("loggedUser", JSON.stringify(updatedUser));
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 3000);
            } else {
                alert(result.error || "Erreur mise à jour profil");
            }
        } catch (err) {
            alert("Server error ❌");
        }
    };

    const checkDuplicate = (titre) => productions.some(p => p.titre.trim().toLowerCase() === titre.trim().toLowerCase());

    const handleAddProduction = async () => {
        if (!newProd.titre) return;
        if (checkDuplicate(newProd.titre)) { setDuplicateWarn(true); return; }
        setDuplicateWarn(false);
        try {
            const res = await fetch(`${API_BASE}/production_add.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titre: newProd.titre,
                    type_prod: newProd.type_prod,
                    resume: newProd.resume_abstract,
                    keywords: newProd.keywords,
                    annee: newProd.annee,
                    id_chercheur: currentUser.id_chercheur,
                    id_equipe: currentUser.id_equipe || null
                })
            });
            if (res.ok) {
                setShowAddModal(false);
                setNewProd({ type_prod: "Article", titre: "", resume_abstract: "", keywords: "", annee: new Date().getFullYear(), id_equipe: currentUser.id_equipe || 1, fichier: null });
                fetchProductions();
            }
        } catch (err) { alert("Server error ❌"); }
    };

    const handleEditProduction = async () => {
        if (!editProd || !editProd.titre) return;
        try {
            const res = await fetch(`${API_BASE}/production_update.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_prod: editProd.id_prod, titre: editProd.titre, type_prod: editProd.type_prod, resume: editProd.resume_abstract || editProd.resume, keywords: editProd.keywords, annee: editProd.annee })
            });
            const result = await res.json();
            if (result.success) { setShowEditModal(false); setEditProd(null); fetchProductions(); }
        } catch (err) { alert("Server error ❌"); }
    };

    const handleDelete = async (id) => {
        const prod = productions.find(p => p.id_prod === id);
        if (prod.status === "Validée") { alert("❌ Impossible de supprimer une production validée."); return; }
        if (!window.confirm("Confirmer la suppression ?")) return;
        try {
            const res = await fetch(`${API_BASE}/production_delete.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_prod: id, id_chercheur: currentUser.id_chercheur })
            });
            const result = await res.json();
            if (result.success) fetchProductions();
        } catch (err) { alert("Server error ❌"); }
    };

    const handleUploadPDF = (id_prod, e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadedFiles(prev => ({ ...prev, [id_prod]: file.name }));
    };

    // ============================================================
    // STYLES INLINE
    // ============================================================
    const S = {
        app: { display: "flex", height: "100vh", background: "#030712", fontFamily: "'Inter', sans-serif", color: "white", overflow: "hidden" },
        sidebar: { width: sidebarOpen ? 240 : 68, minWidth: sidebarOpen ? 240 : 68, background: "rgba(17,24,39,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", transition: "width 0.3s ease", zIndex: 100 },
        sidebarHeader: { padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, minHeight: 64 },
        logo: { background: "linear-gradient(135deg, #6366f1, #ec4899)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 },
        logoText: { background: "linear-gradient(135deg, #6366f1, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" },
        navItem: (active) => ({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, margin: "2px 8px", cursor: "pointer", transition: "all 0.2s", background: active ? "rgba(99,102,241,0.15)" : "transparent", color: active ? "#6366f1" : "#9ca3af", borderLeft: active ? "3px solid #6366f1" : "3px solid transparent", whiteSpace: "nowrap", overflow: "hidden" }),
        main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
        topbar: { height: 64, background: "rgba(17,24,39,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 16 },
        content: { flex: 1, overflowY: "auto", padding: 24 },
        card: { background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 },
        statCard: (color) => ({ background: "rgba(17,24,39,0.8)", border: `1px solid ${color}40`, borderRadius: 16, padding: 20, flex: 1, minWidth: 140 }),
        btn: (variant = "primary") => ({
            background: variant === "primary" ? "linear-gradient(135deg, #6366f1, #a855f7)" : variant === "danger" ? "rgba(255,77,77,0.15)" : variant === "success" ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.06)",
            border: variant === "danger" ? "1px solid rgba(255,77,77,0.3)" : variant === "success" ? "1px solid rgba(0,255,136,0.3)" : "none",
            color: variant === "danger" ? "#ff4d4d" : variant === "success" ? "#00ff88" : "white",
            padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6
        }),
        badge: (status) => ({ background: STATUS_CONFIG[status]?.bg || "transparent", color: STATUS_CONFIG[status]?.color || "white", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }),
        typeBadge: (type) => ({ background: TYPE_CONFIG[type]?.bg || "rgba(99,102,241,0.15)", color: TYPE_CONFIG[type]?.color || "#6366f1", border: `1px solid ${TYPE_CONFIG[type]?.border || "rgba(99,102,241,0.4)"}`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }),
        modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
        modalBox: { background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 500, maxWidth: "92vw", maxHeight: "90vh", overflowY: "auto" },
        input: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "white", width: "100%", fontSize: 13, marginBottom: 12, boxSizing: "border-box", outline: "none" },
        textarea: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "white", width: "100%", fontSize: 13, marginBottom: 12, boxSizing: "border-box", resize: "vertical", minHeight: 80, outline: "none" },
        select: { background: "#1f2937", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "10px 14px", color: "white", width: "100%", fontSize: 13, marginBottom: 12, cursor: "pointer", outline: "none" },
        label: { color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, display: "block" },
        sectionTitle: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
        sectionSub: { color: "#6b7280", fontSize: 13, marginBottom: 24 },
    };

    // ============================================================
    // RENDU DES SECTIONS
    // ============================================================
    const renderDashboard = () => (
        <div>
            <div style={{ marginBottom: 28 }}>
                <div style={S.sectionTitle}>Bonjour, {currentUser.prenom} 👋</div>
                <div style={S.sectionSub}>Voici un aperçu de votre activité scientifique</div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Total Productions", value: stats.total, color: "#6366f1", icon: "📚" },
                    { label: "Validées", value: stats.validées, color: "#00ff88", icon: "✅" },
                    { label: "En cours", value: stats.enCours, color: "#f59e0b", icon: "⏳" },
                    { label: "Rejetées", value: stats.rejetées, color: "#ff4d4d", icon: "❌" },
                ].map((s, i) => (
                    <div key={i} style={S.statCard(s.color)}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ ...S.card, marginBottom: 20, borderColor: "rgba(99,102,241,0.25)" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>🏛 Mon Équipe de Recherche</div>
                {(() => {
                    const eq = EQUIPES_STATIC.find(e => e.id === (currentUser.id_equipe || 1));
                    return eq ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#6366f1", fontSize: 12 }}>{eq.code}</div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{eq.nom}</div>
                                <div style={{ color: "#6b7280", fontSize: 11 }}>Code: {eq.code}</div>
                            </div>
                        </div>
                    ) : null;
                })()}
            </div>

            <div style={S.card}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Productions Récentes</div>
                {loading ? (
                    <div style={{ color: "#6b7280", textAlign: "center", padding: 20 }}>⏳ Chargement…</div>
                ) : productions.slice(0, 3).map(p => (
                    <div key={p.id_prod} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <span style={{ fontSize: 20 }}>{TYPE_CONFIG[p.type_prod]?.emoji || "📄"}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{p.titre}</div>
                            <div style={{ color: "#6b7280", fontSize: 11 }}>{p.type_prod} · {p.annee}</div>
                        </div>
                        <span style={S.badge(p.status)}>{STATUS_CONFIG[p.status]?.icon || ""} {p.status}</span>
                    </div>
                ))}
                {productions.length === 0 && !loading && (
                    <div style={{ color: "#6b7280", textAlign: "center", padding: 20, fontSize: 13 }}>Aucune production</div>
                )}
            </div>
        </div>
    );

    const renderProfil = () => (
        <div>
            <div style={S.sectionTitle}>Mon Profil</div>
            <div style={S.sectionSub}>Gérez vos informations personnelles et professionnelles</div>
            <div style={{ ...S.card, maxWidth: 600 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900 }}>
                        {(profileData.prenom || "?")[0]}{(profileData.nom || "?")[0]}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>{profileData.prenom} {profileData.nom}</div>
                        <div style={{ color: "#6366f1", fontSize: 13, fontWeight: 700 }}>{profileData.grade}</div>
                        <div style={{ color: "#6b7280", fontSize: 12 }}>ORCID: {profileData.orcid}</div>
                    </div>
                </div>
                {["nom", "prenom", "email", "orcid"].map(key => (
                    <div key={key} style={{ marginBottom: 14 }}>
                        <label style={S.label}>{key}</label>
                        <input style={S.input} value={profileData[key] || ""} onChange={e => setProfileData({ ...profileData, [key]: e.target.value })} />
                    </div>
                ))}
                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>Grade</label>
                    <div style={{ ...S.input, opacity: 0.5, cursor: "not-allowed" }}>{profileData.grade}</div>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>Équipe de Recherche</label>
                    <select style={S.select} value={profileData.id_equipe || 1} onChange={e => setProfileData({ ...profileData, id_equipe: parseInt(e.target.value) })}>
                        {EQUIPES_STATIC.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                    </select>
                </div>
                {profileSaved && <div style={{ color: "#00ff88", fontSize: 13, marginBottom: 10 }}>✅ Profil mis à jour !</div>}
                <button style={S.btn("primary")} onClick={handleSaveProfil}><IconEdit /> Sauvegarder les modifications</button>
            </div>
        </div>
    );

    const renderProductions = () => (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <div style={S.sectionTitle}>Productions Scientifiques</div>
                    <div style={S.sectionSub}>Articles, conférences et thèses</div>
                </div>
                <button style={S.btn("primary")} onClick={() => { setDuplicateWarn(false); setShowAddModal(true); }}><IconPlus /> Ajouter</button>
            </div>
            {loading ? (
                <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>⏳ Chargement…</div>
            ) : productions.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#6b7280" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 700 }}>Aucune production pour le moment</div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>Cliquez sur "Ajouter" pour commencer</div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {productions.map(p => (
                        <div key={p.id_prod} style={{ ...S.card, display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: TYPE_CONFIG[p.type_prod]?.bg || "#6366f120", border: `1px solid ${TYPE_CONFIG[p.type_prod]?.border || "#6366f140"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                                {TYPE_CONFIG[p.type_prod]?.emoji || "📄"}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.titre}</div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={S.typeBadge(p.type_prod)}>{TYPE_CONFIG[p.type_prod]?.emoji || "📄"} {p.type_prod}</span>
                                    <span style={{ color: "#6b7280", fontSize: 11 }}>· {p.annee}</span>
                                    {p.keywords && <span style={{ color: "#6366f1", fontSize: 11 }}>🏷 {p.keywords}</span>}
                                </div>
                                {uploadedFiles[p.id_prod] && (
                                    <div style={{ color: "#00ff88", fontSize: 11, marginTop: 4 }}>📎 {uploadedFiles[p.id_prod]}</div>
                                )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                <span style={S.badge(p.status)}>{STATUS_CONFIG[p.status]?.icon || ""} {p.status}</span>
                                {p.status !== "Validée" && (
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <label style={{ ...S.btn("secondary"), padding: "6px 10px", cursor: "pointer" }} title="Joindre PDF">
                                            <IconUpload />
                                            <input type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => handleUploadPDF(p.id_prod, e)} />
                                        </label>
                                        <button style={{ ...S.btn("secondary"), padding: "6px 10px" }} onClick={() => { setEditProd({ ...p }); setShowEditModal(true); }} title="Modifier"><IconEdit /></button>
                                        <button style={{ ...S.btn("danger"), padding: "6px 10px" }} onClick={() => handleDelete(p.id_prod)} title="Supprimer"><IconTrash /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderWorkflow = () => (
        <div>
            <div style={S.sectionTitle}>Suivi Workflow</div>
            <div style={S.sectionSub}>État de vos soumissions et remarques du chef d'équipe</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {loading ? (
                    <div style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>⏳ Chargement…</div>
                ) : productions.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: 40, color: "#6b7280" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                        <div style={{ fontWeight: 700 }}>Aucune soumission pour le moment</div>
                    </div>
                ) : productions.map(p => (
                    <div key={p.id_prod} style={S.card}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <span style={{ fontSize: 20 }}>{TYPE_CONFIG[p.type_prod]?.emoji || "📄"}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.titre}</div>
                                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                                    <span style={S.typeBadge(p.type_prod)}>{p.type_prod}</span>
                                    <span style={{ color: "#6b7280", fontSize: 11 }}>· {p.annee}</span>
                                </div>
                            </div>
                            <span style={S.badge(p.status)}>{STATUS_CONFIG[p.status]?.icon || ""} {p.status}</span>
                        </div>
                        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
                            {["Soumis", "En révision", "Décision"].map((step, i) => {
                                const done = p.status === "Validée" || (p.status === "En cours" && i < 2) || (p.status === "Rejetée" && i <= 2);
                                const statusColor = p.status === "Rejetée" && i === 2 ? "#ff4d4d" : "#6366f1";
                                return (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                            {i > 0 && <div style={{ flex: 1, height: 2, background: done ? statusColor : "rgba(255,255,255,0.1)" }} />}
                                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? statusColor : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                                                {done ? "✓" : i + 1}
                                            </div>
                                            {i < 2 && <div style={{ flex: 1, height: 2, background: (done && i < 1) ? statusColor : "rgba(255,255,255,0.1)" }} />}
                                        </div>
                                        <div style={{ fontSize: 10, color: done ? statusColor : "#6b7280", marginTop: 4, fontWeight: 600 }}>{step}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", borderLeft: `3px solid ${STATUS_CONFIG[p.status]?.color || "#6366f1"}` }}>
                            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, marginBottom: 6 }}>💬 REMARQUE DU CHEF D'ÉQUIPE</div>
                            {p.indication ? (
                                <div style={{ fontSize: 13, color: "#e5e7eb" }}>{p.indication}</div>
                            ) : (
                                <div style={{ fontSize: 13, color: "#4b5563", fontStyle: "italic" }}>Aucune remarque pour le moment.</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStatistiques = () => {
        const byType = ["Article", "Conférence", "Thèse"].map(t => ({
            type: t,
            count: productions.filter(p => p.type_prod === t).length,
            color: TYPE_CONFIG[t]?.color || "#6366f1",
            emoji: TYPE_CONFIG[t]?.emoji || "📄",
        }));
        const maxCount = Math.max(...byType.map(b => b.count), 1);

        return (
            <div>
                <div style={S.sectionTitle}>Statistiques & Rapports</div>
                <div style={S.sectionSub}>Vos indicateurs de performance scientifique</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                    <div style={{ ...S.card, flex: 2, minWidth: 280 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 20 }}>Productions par Type</div>
                        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 140 }}>
                            {byType.map((b, i) => (
                                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: b.color }}>{b.count}</div>
                                    <div style={{ width: "100%", height: `${Math.max((b.count / maxCount) * 120, 8)}px`, background: `linear-gradient(to top, ${b.color}, ${b.color}80)`, borderRadius: "6px 6px 0 0", border: `1px solid ${b.color}60` }} />
                                    <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textAlign: "center" }}>{b.emoji} {b.type}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ ...S.card, flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 20 }}>Par Statut</div>
                        {Object.keys(STATUS_CONFIG).map(status => {
                            const cfg = STATUS_CONFIG[status];
                            const count = productions.filter(p => p.status === status).length;
                            const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                            return (
                                <div key={status} style={{ marginBottom: 14 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: cfg.color, fontWeight: 700 }}>{status}</span>
                                        <span style={{ fontSize: 12, color: "#6b7280" }}>{count} ({pct}%)</span>
                                    </div>
                                    <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
                                        <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: 3 }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <a href={`${API_BASE}/rapport_pdf.php?id_chercheur=${currentUser.id_chercheur}`} target="_blank" rel="noreferrer"
                    style={{ ...S.btn("primary"), width: "fit-content", textDecoration: "none" }}>
                    <IconDownload /> Télécharger Rapport PDF
                </a>
            </div>
        );
    };

    const sections = { dashboard: renderDashboard, profil: renderProfil, productions: renderProductions, workflow: renderWorkflow, statistiques: renderStatistiques };

    // ============================================================
    // MODAL FORM (Réutilisable pour Ajout et Édition)
    // ============================================================
    const renderProdForm = (data, setData, isEdit) => (
        <div>
            <label style={S.label}>Type de Production</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {Object.keys(TYPE_CONFIG).map(t => (
                    <div key={t} onClick={() => setData({ ...data, type_prod: t })}
                        style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: data.type_prod === t ? TYPE_CONFIG[t].bg : "rgba(255,255,255,0.03)", border: `2px solid ${data.type_prod === t ? TYPE_CONFIG[t].border : "rgba(255,255,255,0.08)"}`, color: data.type_prod === t ? TYPE_CONFIG[t].color : "#6b7280", fontWeight: data.type_prod === t ? 800 : 500, fontSize: 12, transition: "all 0.2s" }}>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>{TYPE_CONFIG[t].emoji}</div>
                        {t}
                    </div>
                ))}
            </div>
            <label style={S.label}>Titre *</label>
            <input style={S.input} placeholder="Titre de la production..." value={data.titre} onChange={e => setData({ ...data, titre: e.target.value })} />
            {duplicateWarn && !isEdit && (
                <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, color: "#f59e0b", fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>
                    <IconAlert /> Cette production existe déjà dans votre liste !
                </div>
            )}
            <label style={S.label}>Résumé / Abstract</label>
            <textarea style={S.textarea} placeholder="Résumé..." value={data.resume_abstract || data.resume || ""} onChange={e => setData({ ...data, resume_abstract: e.target.value })} />

            <label style={S.label}>Mots-clés</label>
            <input style={S.input} placeholder="machine learning, AI, ..." value={data.keywords || ""} onChange={e => setData({ ...data, keywords: e.target.value })} />

            <label style={S.label}>Année</label>
            <input style={S.input} type="number" value={data.annee || new Date().getFullYear()} onChange={e => setData({ ...data, annee: e.target.value })} />

            {!isEdit && (
                <div>
                    <label style={S.label}>Équipe de Recherche</label>
                    <select style={S.select} value={data.id_equipe || 1} onChange={e => setData({ ...data, id_equipe: parseInt(e.target.value) })}>
                        {EQUIPES_STATIC.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                    </select>
                </div>
            )}
        </div>
    );

    // ============================================================
    // RENDER FINAL
    // ============================================================
    return (
        <div style={S.app}>
            {/* Sidebar */}
            <div style={S.sidebar}>
                <div style={S.sidebarHeader}>
                    <div style={S.logo}>L</div>
                    {sidebarOpen && <div style={S.logoText}>Lab Management</div>}
                </div>
                {sidebarOpen && (
                    <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "10px 12px" }}>
                            <div style={{ fontWeight: 800, fontSize: 13 }}>{currentUser.prenom} {currentUser.nom}</div>
                            <div style={{ color: "#6366f1", fontSize: 11, fontWeight: 700 }}>{currentUser.grade}</div>
                            <div style={{ color: "#6b7280", fontSize: 10, marginTop: 2 }}>ORCID: {currentUser.orcid}</div>
                        </div>
                    </div>
                )}
                <nav style={{ flex: 1, padding: "12px 0" }}>
                    {navItems.map(item => (
                        <div key={item.id} style={S.navItem(activeSection === item.id)} onClick={() => setActiveSection(item.id)}>
                            <span>{item.icon}</span>
                            {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>}
                        </div>
                    ))}
                </nav>
                <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ ...S.navItem(false), color: "#ff4d4d" }} onClick={handleLogout}>
                        <span><IconLogout /></span>
                        {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 600 }}>Déconnexion</span>}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={S.main}>
                <div style={S.topbar}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                        {sidebarOpen ? <IconClose /> : <IconMenu />}
                    </button>
                    <div style={{ fontWeight: 700 }}>{navItems.find(n => n.id === activeSection)?.label}</div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>
                        {(currentUser.prenom || "?")[0]}{(currentUser.nom || "?")[0]}
                    </div>
                </div>
                <div style={S.content}>
                    {sections[activeSection]()}
                </div>
            </div>

            {/* Modals Ajout */}
            {showAddModal && (
                <div style={S.modal}>
                    <div style={S.modalBox}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>➕ Nouvelle Production</div>
                            <button onClick={() => { setShowAddModal(false); setDuplicateWarn(false); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><IconClose /></button>
                        </div>
                        {renderProdForm(newProd, setNewProd, false)}
                        <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                            <button style={{ ...S.btn("secondary"), flex: 1, justifyContent: "center" }} onClick={() => { setShowAddModal(false); setDuplicateWarn(false); }}>Annuler</button>
                            <button style={{ ...S.btn("primary"), flex: 1, justifyContent: "center" }} onClick={handleAddProduction}><IconPlus /> Ajouter</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals Edit */}
            {showEditModal && editProd && (
                <div style={S.modal}>
                    <div style={S.modalBox}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>✏️ Modifier Production</div>
                            <button onClick={() => { setShowEditModal(false); setEditProd(null); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><IconClose /></button>
                        </div>
                        {renderProdForm(editProd, setEditProd, true)}
                        <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                            <button style={{ ...S.btn("secondary"), flex: 1, justifyContent: "center" }} onClick={() => { setShowEditModal(false); setEditProd(null); }}>Annuler</button>
                            <button style={{ ...S.btn("primary"), flex: 1, justifyContent: "center" }} onClick={handleEditProduction}><IconEdit /> Sauvegarder</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}