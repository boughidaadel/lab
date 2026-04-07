import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Register() {
  const navigate = useNavigate();

  // 1. تعريف الـ State لكل الحقول
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [orcid, setOrcid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [serverMessage, setServerMessage] = useState('');


  // دالة الكتابة الأوتوماتيكية للـ ORCID
  const handleOrcidChange = (e) => {
    // 1. نحيو أي حاجة ماشي رقم أو حرف X (لأن ORCID يقدر يخلص بـ X)
    let val = e.target.value.replace(/[^\dX]/gi, '').toUpperCase();

    // 2. نحبسو عند 16 رمز (الحد الأقصى للـ ORCID)
    val = val.substring(0, 16);

    // 3. نقسمو الكلمة كل 4 حروف ونزيدو مطة (-)
    let formatted = val.match(/.{1,4}/g)?.join('-') || '';

    // 4. نبعثوها للـ State
    setOrcid(formatted);
  };


  // 2. التحقق الفردي من كل حقل (باش نلونوهم)
  const nameRegex = /^[A-Z][a-zA-Z]*$/;
  const nOk = nom !== "" ? nameRegex.test(nom) : null;
  const pOk = prenom !== "" ? nameRegex.test(prenom) : null;
  const eOk = email !== "" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) : null;
  const orcidOk = orcid !== "" ? /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid) : null;
  const mOk = confirmPassword !== "" ? (confirmPassword === password && password !== "") : null;
  const gradeOk = selectedGrade !== "";

  const psRules = {
    start: /^[A-Z]/.test(password),
    sym: /[^A-Za-z0-9]/.test(password),
    num: /[0-9]/.test(password),
    len: password.length >= 5
  };
  const psOk = psRules.start && psRules.sym && psRules.num && psRules.len;

  // تحديث حالة الفورم ككل
  useEffect(() => {
    setIsFormValid(nOk === true && pOk === true && eOk === true && orcidOk === true && gradeOk && psOk && mOk === true);
  }, [nOk, pOk, eOk, orcidOk, gradeOk, psOk, mOk]);

  // 3. دالة تحديد الـ Role
  const getRole = (grade) => {
    if (["Doctorant", "Chercheur libre", "MA"].includes(grade)) return "Chercheur";
    if (["MCB", "MCA"].includes(grade)) return "ChefEquipe";
    if (grade === "Pr") return "ChefLabo";
    return "Chercheur";
  };

  // 4. الإرسال للسيرفر (Submit)
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    const data = {
      nom, prenom, email, password, orcid,
      grade: selectedGrade, role: getRole(selectedGrade)
    };

    try {
      const res = await fetch("http://localhost/lab_management/lab-backend/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        alert("Account Created ✅");
        navigate('/login');
      } else {
        setServerMessage(result.error || "Registration failed");
      }
    } catch (err) {
      setServerMessage("Server error ❌");
    }
  };

  // 5. الـ CSS المُدمج والديناميكي
  const styles = {
    // Input يتبدل لونو حسب الـ status (null = رمادي, true = أخضر, false = أحمر)
    input: (status) => ({
      background: "rgba(255,255,255,0.06)", color: "white",
      border: `1px solid ${status === true ? '#00ff88' : status === false ? '#ff4d4d' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: "10px", padding: "10px 15px", fontSize: "13px", width: "100%", marginBottom: "2px", outline: "none"
    }),
    label: { color: "#f3f4f6", fontWeight: "700", fontSize: "10px", marginBottom: "4px", display: "block", textTransform: "uppercase" },
    feedback: (status) => ({
      fontSize: "10px", minHeight: "16px", fontWeight: "700", marginBottom: "8px",
      color: status === true ? '#00ff88' : '#ff4d4d'
    }),
    gradeCard: (isActive) => ({
      background: isActive ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${isActive ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
      borderRadius: "10px", padding: "8px 6px", textAlign: "center", cursor: "pointer", transition: "all 0.25s",
      boxShadow: isActive ? "0 0 12px rgba(99,102,241,0.3)" : "none"
    }),
    reqItem: (isMet) => ({
      fontSize: "9px", padding: "2px 8px", borderRadius: "4px", transition: "0.3s",
      color: isMet ? "#00ff88" : "#9ca3af",
      background: isMet ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.05)",
      border: isMet ? "1px solid rgba(0,255,136,0.3)" : "none",
      fontWeight: isMet ? "bold" : "normal"
    })
  };

  // دالة صغيرة باش ما نكرروش كود الـ Feedback
  const renderFeedback = (status, successMsg, errorMsg) => {
    if (status === null) return <div style={styles.feedback(null)}></div>;
    return <div style={styles.feedback(status)}>{status ? `✓ ${successMsg}` : `✘ ${errorMsg}`}</div>;
  };

  return (
    <div style={{ background: "#030712", minHeight: "100vh" }}>
      <Navbar />
      <div style={{ minHeight: "88vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>


        <form
          onSubmit={handleRegister}
          className="card-glass shadow-lg"
          style={{ width: "100%", maxWidth: "520px", display: "flex", flexDirection: "column" }}
        >
          <h4 className="text-center mb-3 fw-bold text-white">Register</h4>
          {serverMessage && <div style={{ color: "#ff4d4d", textAlign: "center", marginBottom: "10px", fontWeight: "bold" }}>{serverMessage}</div>}

          <div>
            <label style={styles.label}>Family Name</label>
            <input type="text" placeholder="CHAABNA" value={nom} onChange={e => setNom(e.target.value)} style={styles.input(nOk)} />
            {renderFeedback(nOk, "Valid!", "Start with A-Z")}
          </div>

          <div>
            <label style={styles.label}>First Name</label>
            <input type="text" placeholder="NAWFEL" value={prenom} onChange={e => setPrenom(e.target.value)} style={styles.input(pOk)} />
            {renderFeedback(pOk, "Valid!", "Start with A-Z")}
          </div>

          <div>
            <label style={styles.label}>Email</label>
            <input type="email" placeholder="user@univ.dz" value={email} onChange={e => setEmail(e.target.value)} style={styles.input(eOk)} />
            {renderFeedback(eOk, "Valid!", "Invalid format")}
          </div>
          <div>
            <label style={styles.label}>ORCID iD</label>
            <div className="orcid-wrapper">
              <div className="orcid-icon">iD</div>
              <input
                type="text"
                placeholder="0000-0000-0000-0000"
                value={orcid}
                onChange={handleOrcidChange} /* <--- استعملنا الدالة الجديدة هنا */
                style={styles.input(orcidOk)}
              />
            </div>
            {renderFeedback(orcidOk, "Valid ORCID!", "Format: 0000-0000-0000-0000")}
          </div>

          <div className="mb-2">
            <label style={styles.label}>Academic Grade</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginTop: "4px" }}>
              {[
                { id: "Doctorant", icon: "🎓", name: "Doctorant", desc: "PhD Student" },
                { id: "Chercheur libre", icon: "🔬", name: "Chercheur", desc: "Libre" },
                { id: "MA", icon: "📘", name: "MA", desc: "Maître Assistant" },
                { id: "MCB", icon: "📗", name: "MCB", desc: "Maître Conf. B" },
                { id: "MCA", icon: "📙", name: "MCA", desc: "Maître Conf. A" },
                { id: "Pr", icon: "🏛", name: "Pr", desc: "Professeur" }
              ].map(g => (
                <div key={g.id} onClick={() => setSelectedGrade(g.id)} style={styles.gradeCard(selectedGrade === g.id)}>
                  <div style={{ fontSize: "16px", marginBottom: "3px" }}>{g.icon}</div>
                  <div style={{ fontSize: "9px", fontWeight: "800", color: "#e5e7eb", textTransform: "uppercase" }}>{g.name}</div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "1px" }}>{g.desc}</div>
                </div>
              ))}
            </div>
            {renderFeedback(gradeOk ? true : null, `Grade: ${selectedGrade}`, "")}
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={styles.input(password !== "" ? psOk : null)} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px", marginBottom: "14px" }}>
              <span style={styles.reqItem(psRules.start)}>Start with A-Z</span>
              <span style={styles.reqItem(psRules.sym)}>@#$ Symbol</span>
              <span style={styles.reqItem(psRules.num)}>123 Number</span>
              <span style={styles.reqItem(psRules.len)}>5+ Chars</span>
            </div>
          </div>

          <div>
            <label style={styles.label}>Confirm Password</label>
            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={styles.input(mOk)} />
            {renderFeedback(mOk, "Match!", "Not matching")}
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)", border: "none", color: "white", fontWeight: "900", width: "100%", padding: "14px", borderRadius: "14px", marginTop: "5px",
              opacity: isFormValid ? 1 : 0.4,
              cursor: isFormValid ? "pointer" : "not-allowed",
              transition: "0.3s"
            }}
          >
            CREATE ACCOUNT
          </button>
        </form>

      </div>
    </div>
  );
}