import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IconHome, IconUsers, IconBook, IconChart, IconBell,
    IconDownload, IconCheck, IconX, IconMenu, IconClose,
    IconLogout, IconEye, IconMsg, IconTrophy, IconAlert
} from '../components/Icons';

// ============================================================
// CONFIGURATIONS STATIQUES
// ============================================================
const STATUS_CONFIG = {
    "Validée": { color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
    "En cours": { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    "Rejetée": { color: "#ff4d4d", bg: "rgba(255,77,77,0.1)" },
    "En attente": { color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
};

const TYPE_CONFIG = {
    "Article": { color: "#6366f1", emoji: "📄" },
    "Conférence": { color: "#a855f7", emoji: "🎤" },
    "Thèse": { color: "#ec4899", emoji: "🎓" },
};

const CLASS_CONFIG = {
    "A": { color: "#00ff88", bg: "rgba(0,255,136,0.1)" },
    "B": { color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    "C": { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
};

// ============================================================
// MOCK DATA (En attendant le Backend)
// ============================================================
const MOCK_MEMBERS = [
    { id: 1, nom: "Chaabna", prenom: "Nawfel", grade: "Doctorant", orcid: "0000-0001-2345-6789", status: "pending", productions: 3, email: "nawfel@univ.dz" },
    { id: 2, nom: "Benali", prenom: "Sara", grade: "MA", orcid: "0000-0002-3456-7890", status: "active", productions: 7, email: "sara@univ.dz" },
    { id: 3, nom: "Hamdi", prenom: "Karim", grade: "Chercheur libre", orcid: "0000-0003-4567-8901", status: "pending", productions: 1, email: "karim@univ.dz" },
    { id: 4, nom: "Meziane", prenom: "Lina", grade: "Doctorant", orcid: "0000-0004-5678-9012", status: "active", productions: 5, email: "lina@univ.dz" },
    { id: 5, nom: "Touati", prenom: "Yacine", grade: "MA", orcid: "0000-0005-6789-0123", status: "rejected", productions: 2, email: "yacine@univ.dz" },
];

const MOCK_PRODUCTIONS = [
    { id: 1, titre: "Machine Learning in Biomedical Research", type: "Article", auteur: "Nawfel Chaabna", annee: 2024, status: "En attente", doi: "10.1234/ml.2024", revue: "Nature Reports", classe: "A", indication: "" },
    { id: 2, titre: "Deep Neural Networks for Protein Folding", type: "Conférence", auteur: "Sara Benali", annee: 2024, status: "En attente", doi: "10.2345/dnn.2024", revue: "ICML 2024", classe: "B", indication: "" },
    { id: 3, titre: "Optimisation des algorithmes génétiques", type: "Thèse", auteur: "Lina Meziane", annee: 2023, status: "Validée", doi: "", revue: "Univ. Annaba", classe: "B", indication: "Excellent travail." },
    { id: 4, titre: "Quantum Computing Applications in Cryptography", type: "Article", auteur: "Sara Benali", annee: 2024, status: "Rejetée", doi: "10.3456/qc.2024", revue: "IEEE Transactions", classe: "A", indication: "DOI invalide, veuillez corriger." },
    { id: 5, titre: "Biomarkers Detection using CNNs", type: "Article", auteur: "Nawfel Chaabna", annee: 2024, status: "En attente", doi: "10.4567/bio.2024", revue: "Elsevier", classe: "A", indication: "" },
    { id: 6, titre: "NLP for Arabic Text Classification", type: "Conférence", auteur: "Yacine Touati", annee: 2023, status: "Validée", doi: "10.5678/nlp.2023", revue: "ACL 2023", classe: "B", indication: "Bien." },
];

// ============================================================
// COMPONENT PRINCIPAL
// ============================================================
export default function ChefEquipeDashboard({ user }) {
    const navigate = useNavigate();
    const currentUser = user || JSON.parse(localStorage.getItem("loggedUser")) || { nom: "Benali", prenom: "Ahmed", grade: "MCB", id_equipe: 1, id_chercheur: 10, email: "ahmed@univ.dz" };

    const [activeSection, setActiveSection] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [members, setMembers] = useState(MOCK_MEMBERS);
    const [productions, setProductions] = useState(MOCK_PRODUCTIONS);
    const [showValidModal, setShowValidModal] = useState(false);
    const [selectedProd, setSelectedProd] = useState(null);
    const [validAction, setValidAction] = useState(""); // "approve" | "reject" | "feedback"
    const [justification, setJustification] = useState("");
    const [filterYear, setFilterYear] = useState("all");
    const [filterType, setFilterType] = useState("all");

    // ── STATS ──
    const pendingMembers = members.filter(m => m.status === "pending").length;
    const pendingProds = productions.filter(p => p.status === "En attente").length;
    const validatedProds = productions.filter(p => p.status === "Validée").length;
    const rejectedProds = productions.filter(p => p.status === "Rejetée").length;
    const activeMembers = members.filter(m => m.status === "active").length;

    const top3 = members.filter(m => m.status === "active").sort((a, b) => b.productions - a.productions).slice(0, 3);

    // ── ACTIONS ──
    const handleLogout = () => {
        localStorage.removeItem("loggedUser");
        navigate('/login');
    };

    const handleMemberDecision = (id, decision) => {
        setMembers(members.map(m => m.id === id ? { ...m, status: decision } : m));
    };

    const openValidModal = (prod, action) => {
        setSelectedProd(prod);
        setValidAction(action);
        setJustification("");
        setShowValidModal(true);
    };

    const handleProductionDecision = () => {
        if ((validAction === "reject" || validAction === "feedback") && !justification.trim()) {
            alert("⚠️ La justification est obligatoire !");
            return;
        }
        setProductions(productions.map(p =>
            p.id === selectedProd.id
                ? {
                    ...p,
                    status: validAction === "approve" ? "Validée" : validAction === "reject" ? "Rejetée" : "En attente",
                    indication: justification || p.indication
                }
                : p
        ));
        setShowValidModal(false);
    };

    const filteredProds = productions.filter(p => {
        const yearOk = filterYear === "all" || p.annee === parseInt(filterYear);
        const typeOk = filterType === "all" || p.type === filterType;
        return yearOk && typeOk;
    });

    const years = [...new Set(productions.map(p => p.annee))].sort((a, b) => b - a);

    // ── STYLES ──
    const S = {
        app: { display: "flex", height: "100vh", background: "#030712", fontFamily: "'Inter', sans-serif", color: "white", overflow: "hidden" },
        sidebar: { width: sidebarOpen ? 250 : 68, minWidth: sidebarOpen ? 250 : 68, background: "rgba(17,24,39,0.98)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", transition: "width 0.3s ease", zIndex: 100 },
        sidebarHeader: { padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, minHeight: 64 },
        logo: { background: "linear-gradient(135deg, #a855f7, #6366f1)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 },
        logoText: { background: "linear-gradient(135deg, #a855f7, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, fontSize: 14, whiteSpace: "nowrap" },
        navItem: (active) => ({ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 10, margin: "2px 8px", cursor: "pointer", transition: "all 0.2s", background: active ? "rgba(168,85,247,0.15)" : "transparent", color: active ? "#a855f7" : "#9ca3af", borderLeft: active ? "3px solid #a855f7" : "3px solid transparent", whiteSpace: "nowrap", overflow: "hidden" }),
        main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
        topbar: { height: 64, background: "rgba(17,24,39,0.98)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", gap: 16, flexShrink: 0 },
        content: { flex: 1, overflowY: "auto", padding: 24 },
        card: { background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 },
        kpiCard: (color) => ({ background: "rgba(17,24,39,0.8)", border: `1px solid ${color}30`, borderRadius: 16, padding: 20, flex: 1 }),
        btn: (variant = "primary") => ({
            background: variant === "approve" ? "linear-gradient(135deg,#00b374,#00ff88)" :
                variant === "reject" ? "rgba(255,77,77,0.15)" :
                    variant === "primary" ? "linear-gradient(135deg,#a855f7,#6366f1)" :
                        variant === "warning" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)",
            border: variant === "reject" ? "1px solid rgba(255,77,77,0.4)" :
                variant === "warning" ? "1px solid rgba(245,158,11,0.4)" : "none",
            color: variant === "reject" ? "#ff4d4d" :
                variant === "warning" ? "#f59e0b" :
                    variant === "approve" ? "#030712" : "white",
            padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12,
            display: "flex", alignItems: "center", gap: 5, justifyContent: "center"
        }),
        badge: (status) => ({ background: STATUS_CONFIG[status]?.bg, color: STATUS_CONFIG[status]?.color, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }),
        classBadge: (cls) => ({ background: CLASS_CONFIG[cls]?.bg, color: CLASS_CONFIG[cls]?.color, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800 }),
        modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
        modalBox: { background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 500, maxWidth: "90vw" },
        textarea: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "white", width: "100%", fontSize: 13, marginBottom: 12, boxSizing: "border-box", resize: "vertical", minHeight: 90, outline: "none" },
        sectionTitle: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
        sectionSub: { color: "#6b7280", fontSize: 13, marginBottom: 24 },
        label: { color: "#9ca3af", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 4, display: "block" },
        select: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9, padding: "8px 12px", color: "white", fontSize: 13, cursor: "pointer", outline: "none" },
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: <IconHome />, badge: null },
        { id: "members", label: "Membres", icon: <IconUsers />, badge: pendingMembers > 0 ? pendingMembers : null },
        { id: "productions", label: "Productions", icon: <IconBook />, badge: pendingProds > 0 ? pendingProds : null },
        { id: "classement", label: "Classement", icon: <IconTrophy />, badge: null },
        { id: "rapports", label: "Rapports", icon: <IconDownload />, badge: null },
    ];

    // ── SECTIONS ────────────────────────────────────────────────

    const renderDashboard = () => (
        <div>
            <div style={{ marginBottom: 28 }}>
                <div style={S.sectionTitle}>Bonjour, {currentUser.prenom} 👋</div>
                <div style={S.sectionSub}>Tableau de bord — Chef d'Équipe · {currentUser.grade}</div>
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Membres Actifs", value: activeMembers, color: "#00ff88", icon: "👥" },
                    { label: "En Attente", value: pendingMembers, color: "#f59e0b", icon: "⏳" },
                    { label: "Productions Validées", value: validatedProds, color: "#6366f1", icon: "✅" },
                    { label: "Pending Alerts", value: pendingProds, color: "#ff4d4d", icon: "🔔" },
                ].map((k, i) => (
                    <div key={i} style={S.kpiCard(k.color)}>
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
                        <div style={{ fontSize: 34, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>{k.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ ...S.card, flex: 2, minWidth: 280 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 20 }}>Productions par Type</div>
                    <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 130 }}>
                        {["Article", "Conférence", "Thèse"].map(t => {
                            const count = productions.filter(p => p.type === t).length;
                            const maxC = Math.max(...["Article", "Conférence", "Thèse"].map(x => productions.filter(p => p.type === x).length), 1);
                            return (
                                <div key={t} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: TYPE_CONFIG[t].color }}>{count}</div>
                                    <div style={{ width: "100%", height: `${Math.max((count / maxC) * 110, 8)}px`, background: `linear-gradient(to top, ${TYPE_CONFIG[t].color}, ${TYPE_CONFIG[t].color}80)`, borderRadius: "6px 6px 0 0", transition: "height 0.5s" }} />
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>{TYPE_CONFIG[t].emoji} {t}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div style={{ ...S.card, flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        <IconAlert /> Pending Alerts
                    </div>
                    {productions.filter(p => p.status === "En attente").slice(0, 3).map(p => (
                        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                            <div style={{ flex: 1, overflow: "hidden" }}>
                                <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.titre}</div>
                                <div style={{ color: "#6b7280", fontSize: 10 }}>{p.auteur}</div>
                            </div>
                        </div>
                    ))}
                    {pendingProds === 0 && <div style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: 10 }}>✅ Aucune alerte</div>}
                </div>
            </div>
        </div>
    );

    const renderMembers = () => (
        <div>
            <div style={S.sectionTitle}>Gestion des Membres</div>
            <div style={S.sectionSub}>Examiner, accepter ou rejeter les demandes d'adhésion</div>

            {members.filter(m => m.status === "pending").length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#f59e0b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <IconAlert /> Demandes en attente ({members.filter(m => m.status === "pending").length})
                    </div>
                    {members.filter(m => m.status === "pending").map(m => (
                        <div key={m.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 12, border: "1px solid rgba(245,158,11,0.3)" }}>
                            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                                {m.prenom[0]}{m.nom[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.prenom} {m.nom}</div>
                                <div style={{ color: "#6b7280", fontSize: 12 }}>{m.grade} · {m.email}</div>
                                <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>ORCID: {m.orcid}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button style={S.btn("approve")} onClick={() => handleMemberDecision(m.id, "active")}>
                                    <IconCheck /> Accepter
                                </button>
                                <button style={S.btn("reject")} onClick={() => handleMemberDecision(m.id, "rejected")}>
                                    <IconX /> Rejeter
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ fontWeight: 700, fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>Tous les Membres ({members.filter(m => m.status === "active").length} actifs)</div>
            {members.filter(m => m.status !== "pending").map(m => (
                <div key={m.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                        {m.prenom[0]}{m.nom[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.prenom} {m.nom}</div>
                        <div style={{ color: "#6b7280", fontSize: 11 }}>{m.grade} · {m.productions} productions</div>
                    </div>
                    <span style={{ ...S.badge(m.status === "active" ? "Validée" : "Rejetée"), fontSize: 10 }}>
                        {m.status === "active" ? "Actif" : "Rejeté"}
                    </span>
                </div>
            ))}
        </div>
    );

    const renderProductions = () => (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                    <div style={S.sectionTitle}>Modération des Productions</div>
                    <div style={S.sectionSub}>Valider, rejeter ou demander des corrections</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <select style={S.select} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                        <option value="all">Toutes les années</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select style={S.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="all">Tous les types</option>
                        <option>Article</option>
                        <option>Conférence</option>
                        <option>Thèse</option>
                    </select>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredProds.map(p => (
                    <div key={p.id} style={{ ...S.card, border: p.status === "En attente" ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${TYPE_CONFIG[p.type].color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                {TYPE_CONFIG[p.type].emoji}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.titre}</div>
                                <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
                                    ✍️ {p.auteur} · 📅 {p.annee} · 📰 {p.revue}
                                    {p.doi && <span> · DOI: <span style={{ color: "#6366f1" }}>{p.doi}</span></span>}
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                    <span style={S.badge(p.status)}>{p.status}</span>
                                    <span style={S.classBadge(p.classe)}>Classe {p.classe}</span>
                                    {p.indication && (
                                        <span style={{ fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>💬 {p.indication}</span>
                                    )}
                                </div>
                            </div>
                            {p.status === "En attente" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                                    <button style={S.btn("approve")} onClick={() => openValidModal(p, "approve")}>
                                        <IconCheck /> Valider
                                    </button>
                                    <button style={S.btn("reject")} onClick={() => openValidModal(p, "reject")}>
                                        <IconX /> Rejeter
                                    </button>
                                    <button style={S.btn("warning")} onClick={() => openValidModal(p, "feedback")}>
                                        <IconMsg /> Feedback
                                    </button>
                                </div>
                            )}
                            {p.status === "Validée" && (
                                <button style={{ ...S.btn(), padding: "6px 10px" }} onClick={() => openValidModal(p, "feedback")}>
                                    <IconMsg />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderClassement = () => {
        const medals = ["🥇", "🥈", "🥉"];
        const memberStats = members.filter(m => m.status === "active").map(m => ({
            ...m,
            byType: {
                Article: productions.filter(p => p.auteur.includes(m.nom) && p.type === "Article" && p.status === "Validée").length,
                Conférence: productions.filter(p => p.auteur.includes(m.nom) && p.type === "Conférence" && p.status === "Validée").length,
                Thèse: productions.filter(p => p.auteur.includes(m.nom) && p.type === "Thèse" && p.status === "Validée").length,
            },
            classeA: productions.filter(p => p.auteur.includes(m.nom) && p.classe === "A" && p.status === "Validée").length,
            classeB: productions.filter(p => p.auteur.includes(m.nom) && p.classe === "B" && p.status === "Validée").length,
        })).sort((a, b) => b.productions - a.productions);

        return (
            <div>
                <div style={S.sectionTitle}>Classement Interne</div>
                <div style={S.sectionSub}>Top chercheurs les plus productifs de l'équipe</div>

                <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
                    {top3.map((m, i) => (
                        <div key={m.id} style={{ ...S.card, flex: 1, minWidth: 180, textAlign: "center", border: i === 0 ? "1px solid rgba(255,215,0,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
                            <div style={{ fontSize: 36, marginBottom: 8 }}>{medals[i]}</div>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, margin: "0 auto 10px" }}>
                                {m.prenom[0]}{m.nom[0]}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>{m.prenom} {m.nom}</div>
                            <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 8 }}>{m.grade}</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: i === 0 ? "#ffd700" : i === 1 ? "#9ca3af" : "#cd7f32" }}>{m.productions}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>productions</div>
                        </div>
                    ))}
                </div>

                <div style={S.card}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Classement Détaillé par Catégorie</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                {["#", "Chercheur", "Grade", "Articles", "Conférences", "Thèses", "Classe A", "Classe B", "Total"].map(h => (
                                    <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {memberStats.map((m, i) => (
                                <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                    <td style={{ padding: "10px 8px", fontSize: 13, color: "#6b7280" }}>{i + 1}</td>
                                    <td style={{ padding: "10px 8px" }}>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{m.prenom} {m.nom}</div>
                                    </td>
                                    <td style={{ padding: "10px 8px", fontSize: 12, color: "#9ca3af" }}>{m.grade}</td>
                                    <td style={{ padding: "10px 8px", fontSize: 13, color: TYPE_CONFIG["Article"].color, fontWeight: 700 }}>{m.byType.Article}</td>
                                    <td style={{ padding: "10px 8px", fontSize: 13, color: TYPE_CONFIG["Conférence"].color, fontWeight: 700 }}>{m.byType.Conférence}</td>
                                    <td style={{ padding: "10px 8px", fontSize: 13, color: TYPE_CONFIG["Thèse"].color, fontWeight: 700 }}>{m.byType.Thèse}</td>
                                    <td style={{ padding: "10px 8px" }}><span style={S.classBadge("A")}>{m.classeA}</span></td>
                                    <td style={{ padding: "10px 8px" }}><span style={S.classBadge("B")}>{m.classeB}</span></td>
                                    <td style={{ padding: "10px 8px", fontSize: 15, fontWeight: 900, color: "#a855f7" }}>{m.productions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderRapports = () => (
        <div>
            <div style={S.sectionTitle}>Rapports & Exportation</div>
            <div style={S.sectionSub}>Générer des rapports périodiques — PDF ou Excel</div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ ...S.card, flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Rapport Semestriel</div>
                    <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                        Synthèse des 6 derniers mois — productions, validations, membres actifs.
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button style={{ ...S.btn("primary"), flex: 1 }}><IconDownload /> PDF</button>
                        <button style={{ ...S.btn(), flex: 1 }}>📊 Excel</button>
                    </div>
                </div>

                <div style={{ ...S.card, flex: 1, minWidth: 260 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Rapport Annuel</div>
                    <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
                        Bilan complet de l'année — KPIs, classement, statistiques détaillées.
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button style={{ ...S.btn("primary"), flex: 1 }}><IconDownload /> PDF</button>
                        <button style={{ ...S.btn(), flex: 1 }}>📊 Excel</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const sections = { dashboard: renderDashboard, members: renderMembers, productions: renderProductions, classement: renderClassement, rapports: renderRapports };

    // ── RENDER FINAL ─────────────────────────────────────────────
    return (
        <div style={S.app}>
            {/* SIDEBAR */}
            <div style={S.sidebar}>
                <div style={S.sidebarHeader}>
                    <div style={S.logo}>CE</div>
                    {sidebarOpen && <div style={S.logoText}>Lab Management</div>}
                </div>
                {sidebarOpen && (
                    <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, padding: "10px 12px" }}>
                            <div style={{ fontWeight: 800, fontSize: 13 }}>{currentUser.prenom} {currentUser.nom}</div>
                            <div style={{ color: "#a855f7", fontSize: 11, fontWeight: 700 }}>{currentUser.grade} · Chef d'Équipe</div>
                        </div>
                    </div>
                )}
                <nav style={{ flex: 1, padding: "12px 0" }}>
                    {navItems.map(item => (
                        <div key={item.id} style={S.navItem(activeSection === item.id)} onClick={() => setActiveSection(item.id)}>
                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                            {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{item.label}</span>}
                            {sidebarOpen && item.badge && (
                                <span style={{ background: "#f59e0b", color: "#030712", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{item.badge}</span>
                            )}
                        </div>
                    ))}
                </nav>
                <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ ...S.navItem(false), color: "#ff4d4d" }} onClick={handleLogout}>
                        <span style={{ flexShrink: 0 }}><IconLogout /></span>
                        {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 600 }}>Déconnexion</span>}
                    </div>
                </div>
            </div>

            {/* MAIN */}
            <div style={S.main}>
                <div style={S.topbar}>
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4 }}>
                        {sidebarOpen ? <IconClose /> : <IconMenu />}
                    </button>
                    <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>
                        {(navItems.find(n => n.id === activeSection) || {}).label}
                    </div>
                    <div style={{ position: "relative", cursor: "pointer" }}>
                        <IconBell />
                        {(pendingMembers + pendingProds) > 0 && (
                            <span style={{ position: "absolute", top: -6, right: -6, background: "#ff4d4d", color: "white", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900 }}>
                                {pendingMembers + pendingProds}
                            </span>
                        )}
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14 }}>
                        {(currentUser.prenom || "?")[0]}{(currentUser.nom || "?")[0]}
                    </div>
                </div>
                <div style={S.content}>
                    {sections[activeSection]()}
                </div>
            </div>

            {/* MODAL — Validation / Rejet / Feedback */}
            {showValidModal && selectedProd && (
                <div style={S.modal}>
                    <div style={S.modalBox}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <div style={{ fontWeight: 800, fontSize: 18 }}>
                                {validAction === "approve" ? "✅ Valider la Production" : validAction === "reject" ? "❌ Rejeter la Production" : "💬 Envoyer un Feedback"}
                            </div>
                            <button onClick={() => setShowValidModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: 18 }}>✕</button>
                        </div>

                        <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: 14, marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedProd.titre}</div>
                            <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                                {selectedProd.auteur} · {selectedProd.type} · {selectedProd.annee}
                            </div>
                        </div>

                        {validAction === "approve" ? (
                            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 20 }}>
                                Confirmer la validation de cette production ? Elle sera marquée comme <strong style={{ color: "#00ff88" }}>Validée</strong>.
                            </div>
                        ) : (
                            <div>
                                <label style={S.label}>
                                    {validAction === "reject" ? "Justification du rejet *" : "Note d'orientation / Correction demandée *"}
                                </label>
                                <textarea
                                    style={S.textarea}
                                    placeholder={validAction === "reject" ? "Expliquer le motif du rejet..." : "Indiquer les corrections nécessaires..."}
                                    value={justification}
                                    onChange={e => setJustification(e.target.value)}
                                />
                                <div style={{ color: "#f59e0b", fontSize: 11, marginBottom: 16 }}>
                                    ⚠️ La justification est obligatoire.
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button style={{ ...S.btn("secondary"), flex: 1 }} onClick={() => setShowValidModal(false)}>Annuler</button>
                            <button style={{ ...S.btn(validAction === "approve" ? "approve" : validAction === "reject" ? "reject" : "warning"), flex: 1 }} onClick={handleProductionDecision}>
                                {validAction === "approve" ? <span><IconCheck /> Valider</span> : validAction === "reject" ? <span><IconX /> Rejeter</span> : <span><IconMsg /> Envoyer</span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}