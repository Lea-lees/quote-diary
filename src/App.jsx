import { useState, useEffect, useReducer } from "react";

const CATEGORIES = ["명언", "유머", "철학", "동기부여", "일상", "기타"];
const CAT_COLORS = {
  "명언": "#185FA5", "유머": "#3B6D11", "동기부여": "#BA7517",
  "철학": "#993556", "일상": "#0F6E56", "기타": "#534AB7"
};
const CAT_BG = {
  "명언": "#E6F1FB", "유머": "#EAF3DE", "동기부여": "#FAEEDA",
  "철학": "#FBEAF0", "일상": "#E1F5EE", "기타": "#EEEDFE"
};
const CARD_COLORS = [
  { bg: "#FFF0F5", border: "#F4C0D1", accent: "#D4537E" },
  { bg: "#F0F7FF", border: "#B5D4F4", accent: "#185FA5" },
  { bg: "#F0FFF8", border: "#9FE1CB", accent: "#0F6E56" },
  { bg: "#FFFBF0", border: "#FAC775", accent: "#BA7517" },
  { bg: "#F5F0FF", border: "#CECBF6", accent: "#534AB7" },
  { bg: "#FFF5F0", border: "#F5C4B3", accent: "#993C1D" },
];

const today = () => new Date().toISOString().slice(0, 10);

const initialState = {
  quotes: [],
  search: "",
  filterCat: "",
  form: { date: today(), text: "", author: "", source: "", category: "명언", tags: "" },
  editId: null,
  showForm: false,
};

function reducer(s, a) {
  switch (a.type) {
    case "SET_QUOTES": return { ...s, quotes: a.quotes };
    case "SET_SEARCH": return { ...s, search: a.val };
    case "SET_FILTER_CAT": return { ...s, filterCat: a.val };
    case "SET_FORM": return { ...s, form: { ...s.form, ...a.fields } };
    case "RESET_FORM": return { ...s, form: { date: today(), text: "", author: "", source: "", category: "명언", tags: "" }, editId: null, showForm: false };
    case "SHOW_FORM": return { ...s, showForm: true, editId: a.editId || null, form: a.form || s.form };
    case "SAVE_QUOTE": {
      const q = { ...s.form, id: s.editId || Date.now(), tags: s.form.tags.split(",").map(t => t.trim()).filter(Boolean) };
      const quotes = s.editId ? s.quotes.map(x => x.id === s.editId ? q : x) : [...s.quotes, q];
      return { ...s, quotes, showForm: false, editId: null, form: { date: today(), text: "", author: "", source: "", category: "명언", tags: "" } };
    }
    case "DELETE": return { ...s, quotes: s.quotes.filter(x => x.id !== a.id) };
    default: return s;
  }
}

const cardColor = (id) => CARD_COLORS[id % CARD_COLORS.length];

export default function App() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [expandId, setExpandId] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quotes_v2");
      if (saved) dispatch({ type: "SET_QUOTES", quotes: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("quotes_v2", JSON.stringify(s.quotes)); } catch {}
  }, [s.quotes]);

  const filtered = s.quotes
    .filter(q => !s.filterCat || q.category === s.filterCat)
    .filter(q => {
      const kw = s.search.toLowerCase();
      return !kw || q.text?.toLowerCase().includes(kw) || q.author?.toLowerCase().includes(kw) || q.tags?.some(t => t.toLowerCase().includes(kw));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped = filtered.reduce((acc, q) => {
    (acc[q.date] = acc[q.date] || []).push(q); return acc;
  }, {});

  const startEdit = (q) => dispatch({
    type: "SHOW_FORM", editId: q.id,
    form: { ...q, tags: q.tags?.join(", ") || "" }
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #FFF0F5 0%, #F0F7FF 50%, #F0FFF8 100%)", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
          <h1 style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 700, background: "linear-gradient(90deg, #D4537E, #534AB7, #0F6E56)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            어록 다이어리
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "#aaa" }}>소중한 말들을 모아봐요 🌸</p>
          <div style={{ marginTop: 8, display: "inline-block", background: "#fff", borderRadius: 20, padding: "4px 16px", fontSize: 13, color: "#888", border: "1.5px dashed #ddd" }}>
            총 {s.quotes.length}개의 어록
          </div>
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <input
            style={{ flex: 1, minWidth: 160, border: "2px solid #F4C0D1", borderRadius: 20, padding: "10px 16px", fontSize: 14, outline: "none", background: "#fff" }}
            placeholder="🔍 검색..."
            value={s.search}
            onChange={e => dispatch({ type: "SET_SEARCH", val: e.target.value })}
          />
          <select
            style={{ border: "2px solid #B5D4F4", borderRadius: 20, padding: "10px 16px", fontSize: 14, cursor: "pointer", background: "#fff", color: "#555" }}
            value={s.filterCat}
            onChange={e => dispatch({ type: "SET_FILTER_CAT", val: e.target.value })}
          >
            <option value="">전체 카테고리</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => dispatch({ type: "SHOW_FORM" })}
            style={{ background: "linear-gradient(135deg, #D4537E, #534AB7)", color: "#fff", border: "none", borderRadius: 20, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            + 추가
          </button>
        </div>

        {/* Empty state */}
        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
            <p style={{ margin: 0, fontSize: 15, color: "#aaa" }}>아직 어록이 없어요. 첫 번째 어록을 추가해 보세요!</p>
          </div>
        )}

        {/* Quotes */}
        {Object.entries(grouped).map(([date, qs]) => (
          <div key={date} style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "linear-gradient(90deg, #D4537E, #534AB7)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                {date.replaceAll("-", ". ")}
              </div>
              <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #F4C0D1, transparent)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {qs.map((q, i) => {
                const c = cardColor(i);
                return (
                  <div key={q.id}
                    style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 16, padding: "1.1rem 1.25rem", cursor: "pointer", transition: "transform 0.1s" }}
                    onClick={() => setExpandId(expandId === q.id ? null : q.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, flex: 1, color: "#333" }}>
                        <span style={{ color: c.accent, fontWeight: 700, fontSize: 18 }}>"</span>
                        {q.text}
                        <span style={{ color: c.accent, fontWeight: 700, fontSize: 18 }}>"</span>
                      </p>
                      <span style={{ background: CAT_BG[q.category] || "#f5f5f5", color: CAT_COLORS[q.category] || "#666", fontSize: 11, padding: "4px 10px", borderRadius: 20, whiteSpace: "nowrap", fontWeight: 700, flexShrink: 0, border: `1px solid ${CAT_BG[q.category]}` }}>
                        {q.category}
                      </span>
                    </div>
                    {(q.author || q.source) && (
                      <p style={{ margin: "8px 0 0", fontSize: 13, color: c.accent, fontWeight: 600 }}>
                        — {q.author}{q.source ? ` · ${q.source}` : ""}
                      </p>
                    )}
                    {q.tags?.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                        {q.tags.map(t => (
                          <span key={t} style={{ fontSize: 11, background: "#fff", color: c.accent, padding: "3px 10px", borderRadius: 20, border: `1px solid ${c.border}`, fontWeight: 600 }}>#{t}</span>
                        ))}
                      </div>
                    )}
                    {expandId === q.id && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: `1.5px dashed ${c.border}`, paddingTop: 12 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => startEdit(q)} style={{ fontSize: 13, padding: "6px 16px", background: "#fff", border: `1.5px solid ${c.border}`, borderRadius: 20, cursor: "pointer", color: c.accent, fontWeight: 600 }}>수정</button>
                        <button onClick={() => dispatch({ type: "DELETE", id: q.id })} style={{ fontSize: 13, padding: "6px 16px", background: "#fff", border: "1.5px solid #F7C1C1", borderRadius: 20, cursor: "pointer", color: "#E24B4A", fontWeight: 600 }}>삭제</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Modal */}
        {s.showForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
            onClick={e => { if (e.target === e.currentTarget) dispatch({ type: "RESET_FORM" }); }}
          >
            <div style={{ background: "#fff", borderRadius: 20, border: "2px solid #F4C0D1", padding: "1.75rem", width: "100%", maxWidth: 480 }}>
              <h2 style={{ margin: "0 0 1.25rem", fontSize: 18, fontWeight: 700, color: "#D4537E" }}>
                {s.editId ? "✏️ 어록 수정" : "✨ 새 어록 추가"}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input type="date" style={{ border: "2px solid #F4C0D1", borderRadius: 12, padding: "9px 12px", fontSize: 14, outline: "none" }}
                  value={s.form.date} onChange={e => dispatch({ type: "SET_FORM", fields: { date: e.target.value } })} />
                <textarea
                  style={{ border: "2px solid #F4C0D1", borderRadius: 12, padding: "9px 12px", fontSize: 14, minHeight: 90, resize: "vertical", fontFamily: "sans-serif", outline: "none" }}
                  placeholder="어록 내용 *" value={s.form.text}
                  onChange={e => dispatch({ type: "SET_FORM", fields: { text: e.target.value } })} />
                <input style={{ border: "2px solid #B5D4F4", borderRadius: 12, padding: "9px 12px", fontSize: 14, outline: "none" }}
                  placeholder="누가 한 말 (출처)" value={s.form.author}
                  onChange={e => dispatch({ type: "SET_FORM", fields: { author: e.target.value } })} />
                <input style={{ border: "2px solid #B5D4F4", borderRadius: 12, padding: "9px 12px", fontSize: 14, outline: "none" }}
                  placeholder="책 / 영화 / 드라마 등 출처" value={s.form.source}
                  onChange={e => dispatch({ type: "SET_FORM", fields: { source: e.target.value } })} />
                <select style={{ border: "2px solid #9FE1CB", borderRadius: 12, padding: "9px 12px", fontSize: 14, cursor: "pointer", background: "#fff", outline: "none" }}
                  value={s.form.category}
                  onChange={e => dispatch({ type: "SET_FORM", fields: { category: e.target.value } })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input style={{ border: "2px solid #CECBF6", borderRadius: 12, padding: "9px 12px", fontSize: 14, outline: "none" }}
                  placeholder="태그 (쉼표로 구분: 인생, 용기, ...)" value={s.form.tags}
                  onChange={e => dispatch({ type: "SET_FORM", fields: { tags: e.target.value } })} />
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button onClick={() => dispatch({ type: "RESET_FORM" })} style={{ flex: 1, padding: "11px", background: "#fff", border: "2px solid #ddd", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#888" }}>취소</button>
                  <button onClick={() => { if (!s.form.text.trim()) return; dispatch({ type: "SAVE_QUOTE" }); }}
                    style={{ flex: 1, padding: "11px", background: "linear-gradient(135deg, #D4537E, #534AB7)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
                    {s.editId ? "수정 완료" : "저장 🌸"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
