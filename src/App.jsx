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

export default function App() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [expandId, setExpandId] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("quotes_v1");
      if (saved) dispatch({ type: "SET_QUOTES", quotes: JSON.parse(saved) });
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("quotes_v1", JSON.stringify(s.quotes)); } catch {}
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
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>어록 다이어리</h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>{s.quotes.length}개의 어록</p>
        </div>
        <button onClick={() => dispatch({ type: "SHOW_FORM" })} style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer", fontWeight: 500 }}>
          + 추가
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
        <input
          style={{ flex: 1, minWidth: 160, border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
          placeholder="검색..."
          value={s.search}
          onChange={e => dispatch({ type: "SET_SEARCH", val: e.target.value })}
        />
        <select
          style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14, cursor: "pointer" }}
          value={s.filterCat}
          onChange={e => dispatch({ type: "SET_FILTER_CAT", val: e.target.value })}
        >
          <option value="">전체 카테고리</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "#aaa" }}>
          <p style={{ margin: 0, fontSize: 15 }}>아직 어록이 없어요. 첫 번째 어록을 추가해 보세요!</p>
        </div>
      )}

      {Object.entries(grouped).map(([date, qs]) => (
        <div key={date} style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#888", marginBottom: 8 }}>
            {date.replaceAll("-", ". ")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {qs.map(q => (
              <div key={q.id}
                style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "1rem 1.25rem", cursor: "pointer" }}
                onClick={() => setExpandId(expandId === q.id ? null : q.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, flex: 1 }}>"{q.text}"</p>
                  <span style={{ background: CAT_BG[q.category] || "#f5f5f5", color: CAT_COLORS[q.category] || "#666", fontSize: 11, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap", fontWeight: 500, flexShrink: 0 }}>
                    {q.category}
                  </span>
                </div>
                {(q.author || q.source) && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#888" }}>
                    — {q.author}{q.source ? ` · ${q.source}` : ""}
                  </p>
                )}
                {q.tags?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {q.tags.map(t => (
                      <span key={t} style={{ fontSize: 11, background: "#f5f5f5", color: "#888", padding: "2px 8px", borderRadius: 20 }}>#{t}</span>
                    ))}
                  </div>
                )}
                {expandId === q.id && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid #eee", paddingTop: 12 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => startEdit(q)} style={{ fontSize: 13, padding: "6px 14px", background: "transparent", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer" }}>수정</button>
                    <button onClick={() => dispatch({ type: "DELETE", id: q.id })} style={{ fontSize: 13, padding: "6px 14px", background: "transparent", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", color: "#e24b4a" }}>삭제</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {s.showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "1rem" }}
          onClick={e => { if (e.target === e.currentTarget) dispatch({ type: "RESET_FORM" }); }}
        >
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", padding: "1.5rem", width: "100%", maxWidth: 480 }}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: 18, fontWeight: 500 }}>
              {s.editId ? "어록 수정" : "새 어록 추가"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="date" style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
                value={s.form.date} onChange={e => dispatch({ type: "SET_FORM", fields: { date: e.target.value } })} />
              <textarea
                style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14, minHeight: 90, resize: "vertical", fontFamily: "sans-serif" }}
                placeholder="어록 내용 *" value={s.form.text}
                onChange={e => dispatch({ type: "SET_FORM", fields: { text: e.target.value } })} />
              <input style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
                placeholder="누가 한 말 (출처)" value={s.form.author}
                onChange={e => dispatch({ type: "SET_FORM", fields: { author: e.target.value } })} />
              <input style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
                placeholder="책 / 영화 / 드라마 등 출처" value={s.form.source}
                onChange={e => dispatch({ type: "SET_FORM", fields: { source: e.target.value } })} />
              <select style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14, cursor: "pointer" }}
                value={s.form.category}
                onChange={e => dispatch({ type: "SET_FORM", fields: { category: e.target.value } })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={{ border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14 }}
                placeholder="태그 (쉼표로 구분: 인생, 용기, ...)" value={s.form.tags}
                onChange={e => dispatch({ type: "SET_FORM", fields: { tags: e.target.value } })} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => dispatch({ type: "RESET_FORM" })} style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>취소</button>
                <button onClick={() => { if (!s.form.text.trim()) return; dispatch({ type: "SAVE_QUOTE" }); }}
                  style={{ flex: 1, padding: "10px", background: "#111", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                  {s.editId ? "수정 완료" : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}