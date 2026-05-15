"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Per-topic fallback questions (shown when API key is not set up yet) ──────
const FALLBACKS = {
  ai: [
    { q: "You built a customer support chatbot. It keeps answering with information about products discontinued 6 months ago. What is the most likely reason?", opts: ["The server is too slow", "AI models only know what they were trained on — they have no access to newer information", "The questions are too long", "The chatbot needs a faster internet connection"], correct: 1, explain: "AI models are trained on data up to a certain date and then frozen. They cannot look up new information on their own. Adding a retrieval system lets the AI fetch your current documents before answering." },
    { q: "A user asks your AI assistant about a news story from last week. The AI says it has no information. What is this called?", opts: ["A network error", "A training cutoff — the AI's knowledge has a fixed end date", "A permission error", "A language barrier"], correct: 1, explain: "Every AI model has a training cutoff date. Events after that date are invisible to the model unless you give it a way to retrieve fresh information at the time of the question." },
    { q: "You want your chatbot to always answer based on your company's internal documents. What do you add to the AI system?", opts: ["More RAM to the server", "A retrieval step — the AI searches your documents before answering", "A bigger AI model", "A translation layer"], correct: 1, explain: "Retrieval-Augmented Generation (RAG) works by searching your documents first, then passing the relevant sections to the AI so it can answer based on real, current information." },
    { q: "Your AI returns the correct documents but still gives a wrong answer. What should you check first?", opts: ["Switch to a different AI provider", "Check where the documents appear in the prompt — if they come after the question, the AI may answer from memory first", "Add more documents to the search", "Reduce the number of documents retrieved"], correct: 1, explain: "The order of information in a prompt matters. If you put the question before the documents, the AI often starts forming an answer before reading the context. Putting documents first usually fixes this." },
    { q: "Your AI confidently says something completely made up that is not in any of your documents. This is called what?", opts: ["A server timeout", "Hallucination — the AI filled gaps in its knowledge with invented information", "A database error", "A formatting issue"], correct: 1, explain: "Hallucination happens when the AI cannot find relevant information and invents a plausible-sounding answer instead. Improving retrieval so the AI always has real documents to read from usually fixes this." },
    { q: "You split your documents into very large sections to give the AI more context. Answers get less accurate. Why?", opts: ["Large sections are slower to search", "When a section is too large, the relevant detail gets buried inside a lot of unrelated text — the AI loses focus", "Large sections use more API credits", "The AI cannot read sections over a certain size"], correct: 1, explain: "Larger sections contain more noise alongside the useful information. AI models pay less attention to content in the middle of a long passage. Smaller, focused sections improve precision." },
    { q: "A user searches for 'iPhone 15 release date' but your system only finds documents about general phone history. What would help?", opts: ["Search slower", "Hybrid search — combining meaning-based search with exact keyword matching", "Search twice", "Use a larger AI model"], correct: 1, explain: "Meaning-based search is great for concepts but can miss exact product names and dates. Hybrid search adds keyword matching on top, catching specific terms that meaning-based search might skip." },
  ],
  react: [
    { q: "You have a button that should update a number on screen when clicked. Which React tool do you use to store that number?", opts: ["useEffect", "useState", "useRef", "useContext"], correct: 1, explain: "useState is React's way of storing values that can change. When the value changes, React automatically re-renders the component to show the new value on screen." },
    { q: "You want to fetch data from an API when your page loads — but only once, not on every re-render. Which tool do you use?", opts: ["useState", "useRef", "useEffect with an empty array []", "A regular function"], correct: 2, explain: "useEffect with an empty dependency array [] runs only once after the component first appears on screen. This is the standard way to fetch data when a page loads." },
    { q: "Your React component is receiving data from its parent. What is this data called?", opts: ["State", "Props", "Context", "Refs"], correct: 1, explain: "Props (short for properties) are how a parent component passes data down to a child component. They are read-only — the child cannot change them directly." },
    { q: "You wrote onClick={handleClick()} but the function runs immediately when the page loads, not when you click. What is wrong?", opts: ["handleClick is not defined", "The parentheses () call the function immediately — you should write onClick={handleClick} instead", "onClick is spelled wrong", "React does not support click events"], correct: 1, explain: "Writing handleClick() calls the function right away. Writing handleClick (without parentheses) passes the function itself to the click handler, so it only runs when clicked." },
    { q: "You have a list of items and React shows a warning about missing 'key' props. Why does React need keys?", opts: ["For styling purposes", "To track which items changed, moved, or were removed between renders", "To make the list faster to type", "Keys are optional — the warning can be ignored"], correct: 1, explain: "React uses keys to identify each item in a list. Without keys, React cannot efficiently figure out what changed when the list updates, which can cause bugs and slow performance." },
    { q: "What does JSX actually compile down to in React?", opts: ["Plain HTML that browsers understand directly", "React.createElement() function calls", "CSS class names", "TypeScript types"], correct: 1, explain: "JSX is just a nicer way to write React.createElement() calls. A tool called Babel converts your JSX into regular JavaScript before it runs in the browser." },
    { q: "You want to run some code when a component is removed from the screen (for example, to cancel a timer). Where do you put this cleanup code?", opts: ["At the top of the component", "Inside the return statement", "In a function returned from useEffect", "In useState's initial value"], correct: 2, explain: "useEffect can return a cleanup function. React runs this cleanup function when the component is removed from the screen, or before the effect runs again." },
  ],
  python: [
    { q: "What will this print? `print(type([1, 2, 3]))`", opts: ["<class 'tuple'>", "<class 'list'>", "<class 'array'>", "<class 'dict'>"], correct: 1, explain: "Square brackets [ ] create a list in Python. type() returns the type of any value. Lists are one of Python's most commonly used data structures." },
    { q: "You want to store a person's name and age together as a pair. Which Python structure is most appropriate?", opts: ["A list like ['Alice', 30]", "A dictionary like {'name': 'Alice', 'age': 30}", "A string like 'Alice 30'", "A number like 3"], correct: 1, explain: "Dictionaries store data as key-value pairs, making it easy to look up values by name. They are the standard way to represent structured data in Python." },
    { q: "What is the difference between `=` and `==` in Python?", opts: ["They do the same thing", "= assigns a value to a variable, == checks if two values are equal", "== assigns a value, = checks equality", "= is for numbers, == is for strings"], correct: 1, explain: "= is the assignment operator — it sets a variable's value. == is the comparison operator — it checks whether two values are equal and returns True or False." },
    { q: "Your function should give back a result to the code that called it. Which keyword do you use?", opts: ["send", "output", "return", "give"], correct: 2, explain: "The return keyword sends a value back from a function to wherever the function was called. Without return, the function does its work but gives nothing back (returns None)." },
    { q: "What does this code do? `numbers = [1, 2, 3, 4, 5]` then `print(numbers[0])`", opts: ["Prints 5", "Prints 1", "Prints 0", "Causes an error"], correct: 1, explain: "Python lists use zero-based indexing. Index 0 is the first item. So numbers[0] is 1, numbers[1] is 2, and so on." },
    { q: "You want to repeat a block of code 5 times. Which is the simplest way?", opts: ["while True: (infinite loop)", "for i in range(5):", "repeat(5):", "loop 5 times:"], correct: 1, explain: "range(5) generates the numbers 0, 1, 2, 3, 4. The for loop runs the indented block once for each number. range(n) always gives you exactly n iterations." },
    { q: "What happens when Python code throws an error you didn't handle?", opts: ["It automatically retries", "The program crashes and stops running", "Python fixes it automatically", "It prints a warning and continues"], correct: 1, explain: "An unhandled exception (error) causes the program to stop immediately and print an error message. You use try/except blocks to catch errors and handle them gracefully instead of crashing." },
  ],
};

const TOPICS = [
  { id: "ai",     label: "How AI works",   desc: "Great for beginners" },
  { id: "react",  label: "React",          desc: "For frontend developers" },
  { id: "python", label: "Python",         desc: "General coding" },
  { id: "custom", label: "Custom topic",   desc: "Type anything" },
];

const TOPIC_PROMPTS = {
  ai:     "how AI systems retrieve and use documents (RAG, embeddings, vector search) — use simple everyday language, real-world scenarios like chatbots and customer support tools, no unexplained jargon",
  react:  "React fundamentals: useState, useEffect, props, components, JSX, event handling, conditional rendering — practical code debugging scenarios",
  python: "Python basics: functions, loops, lists, dictionaries, error handling, file I/O — everyday coding scenarios",
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#080808;--s1:#101010;--s2:#181818;--brd:#222;--brd2:#2e2e2e;
  --acc:#f5501e;--grn:#00d97e;--gold:#f5b700;
  --txt:#efefef;--sub:#777;
  --fh:'Syne',sans-serif;--fb:'Outfit',sans-serif;
}
html,body{background:var(--bg);min-height:100vh}
.root{min-height:100vh;background:var(--bg);color:var(--txt);font-family:var(--fb);font-size:14px}
.dot{background-image:radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:26px 26px}
.grid-bg{background-image:linear-gradient(rgba(255,255,255,0.016) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.016) 1px,transparent 1px);background-size:48px 48px}

.page{max-width:560px;margin:0 auto;padding:0 16px 56px}
.pt{padding-top:24px}

.top-bar{height:48px;border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 16px;gap:12px;position:sticky;top:0;z-index:50;background:rgba(8,8,8,0.94);backdrop-filter:blur(10px)}
.logo{font-family:var(--fh);font-size:14px;font-weight:700;color:var(--txt);flex:1;letter-spacing:-0.2px}
.logo span{color:var(--acc)}
.rating-chip{display:flex;align-items:center;gap:5px}
.rating-val{font-family:var(--fh);font-size:13px;font-weight:700;color:var(--txt)}
.rating-lbl{font-size:11px;color:var(--sub)}

.card{background:var(--s1);border:1px solid var(--brd);border-radius:10px}
.p16{padding:16px}
.p12{padding:12px}

.t-label{font-size:11px;font-weight:600;color:var(--sub);letter-spacing:1.5px;text-transform:uppercase}
.t-title{font-family:var(--fh);font-size:21px;font-weight:700;line-height:1.25;color:var(--txt)}
.t-head{font-family:var(--fh);font-size:16px;font-weight:700;line-height:1.3;color:var(--txt)}
.t-body{font-size:14px;line-height:1.65;color:var(--txt)}
.t-small{font-size:12px;color:var(--sub);line-height:1.55}
.t-acc{color:var(--acc)}
.t-grn{color:var(--grn)}
.t-gold{color:var(--gold)}
hr{border:none;border-top:1px solid var(--brd);margin:12px 0}

.btn{font-family:var(--fb);font-size:14px;font-weight:600;padding:11px 20px;border-radius:8px;border:1px solid var(--brd2);background:var(--s2);color:var(--txt);cursor:pointer;transition:all 0.15s;display:inline-flex;align-items:center;gap:7px;line-height:1;justify-content:center;white-space:nowrap}
.btn:hover:not(:disabled){border-color:#444}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-pri{background:var(--acc);border-color:var(--acc);color:#fff}
.btn-pri:hover:not(:disabled){opacity:0.87}
.btn-grn{background:var(--grn);border-color:var(--grn);color:#000;font-weight:700}
.btn-grn:hover:not(:disabled){opacity:0.88}
.btn-full{width:100%}
.btn-lg{padding:13px 22px;font-size:14px}
.btn-sm{padding:7px 13px;font-size:12px}

.topic-opt{width:100%;display:flex;align-items:center;justify-content:space-between;padding:11px 14px;background:var(--s2);border:1px solid var(--brd);border-radius:8px;cursor:pointer;transition:all 0.15s;text-align:left;margin-bottom:6px}
.topic-opt.active{background:rgba(245,80,30,0.07);border-color:rgba(245,80,30,0.35)}
.topic-opt-text{font-size:14px;font-weight:600;color:var(--txt)}
.topic-opt.active .topic-opt-text{color:var(--acc)}
.topic-opt-desc{font-size:11px;color:var(--sub);margin-top:2px}
.checkmark{font-size:13px;color:var(--acc)}

.score-header{display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--s1);border-bottom:1px solid var(--brd)}
.score-side{display:flex;align-items:center;gap:7px;flex:1}
.score-side.right{justify-content:flex-end;flex-direction:row-reverse}
.avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0}
.av-you{background:rgba(245,80,30,0.15);border:1px solid rgba(245,80,30,0.3);color:var(--acc)}
.av-opp{background:var(--s2);border:1px solid var(--brd);color:var(--sub)}
.score-name{font-size:12px;font-weight:600;color:var(--txt)}
.score-name.dim{color:var(--sub)}
.score-pts{font-family:var(--fh);font-size:16px;font-weight:700}
.score-center{display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 6px}
.round-label{font-size:10px;font-weight:600;color:var(--sub);letter-spacing:1px;text-transform:uppercase;white-space:nowrap}
.timer{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:14px;border:1px solid var(--brd2);background:var(--s2)}
.timer-num{font-family:var(--fh);font-size:13px;font-weight:700;color:var(--txt)}
.timer.warn{border-color:rgba(245,80,30,0.4)}
.timer.warn .timer-num{color:var(--acc)}

.q-wrap{padding:14px;background:var(--s1);border:1px solid var(--brd);border-radius:10px;margin-bottom:10px}
.q-label{font-size:10px;font-weight:600;color:var(--sub);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.q-text{font-size:15px;line-height:1.7;color:var(--txt)}

.opt{width:100%;display:flex;align-items:flex-start;gap:10px;padding:11px 14px;background:var(--s1);border:1px solid var(--brd);border-radius:8px;margin-bottom:7px;cursor:pointer;transition:all 0.15s;text-align:left;color:var(--txt);font-family:var(--fb);font-size:14px;line-height:1.55}
.opt:hover:not(:disabled){border-color:#444;background:var(--s2)}
.opt:disabled{cursor:default}
.opt-letter{font-family:var(--fh);font-size:10px;font-weight:700;color:var(--sub);flex-shrink:0;min-width:18px;padding-top:2px}
.opt-correct{border-color:rgba(0,217,126,0.45)!important;background:rgba(0,217,126,0.05)!important;color:var(--grn)!important}
.opt-correct .opt-letter{color:var(--grn)!important}
.opt-wrong{border-color:rgba(245,80,30,0.45)!important;background:rgba(245,80,30,0.05)!important;color:#ff7050!important}
.opt-wrong .opt-letter{color:#ff7050!important}
.opt-dim{opacity:0.35}
.opt-check{margin-left:auto;flex-shrink:0;font-size:14px}

.status-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:12px;color:var(--sub)}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:500}
.badge-grn{background:rgba(0,217,126,0.1);color:var(--grn);border:1px solid rgba(0,217,126,0.2)}
.badge-acc{background:rgba(245,80,30,0.1);color:var(--acc);border:1px solid rgba(245,80,30,0.2)}
.badge-sub{background:var(--s2);color:var(--sub);border:1px solid var(--brd)}

.explain-box{padding:12px 14px;border-radius:8px;border-left:3px solid;margin-top:10px;font-size:13px;line-height:1.7}
.explain-ok{border-color:var(--grn);background:rgba(0,217,126,0.04);color:#ccc}
.explain-err{border-color:#ff7050;background:rgba(245,80,30,0.04);color:#ccc}
.explain-head{font-weight:600;display:block;margin-bottom:4px;font-size:12px}

.how-step{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}
.step-num{width:22px;height:22px;border-radius:50%;background:var(--s2);border:1px solid var(--brd);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--acc);flex-shrink:0}

.share-box{padding:11px 13px;background:var(--s2);border-radius:8px;font-size:13px;color:var(--sub);line-height:1.7;margin-bottom:10px}
.stat-card{background:var(--s1);border:1px solid var(--brd);border-radius:8px;padding:12px;text-align:center}
.stat-val{font-family:var(--fh);font-size:18px;font-weight:700;line-height:1.2}
.stat-lbl{font-size:10px;color:var(--sub);margin-top:3px;letter-spacing:0.5px;text-transform:uppercase}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{0%{transform:scale(0.86);opacity:0}65%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
@keyframes pulse{0%,100%{opacity:0.45}50%{opacity:0.9}}
@keyframes burst{0%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-40px)}}
@keyframes countIn{0%{transform:scale(1.5);opacity:0}100%{transform:scale(1);opacity:1}}
.au{animation:fadeUp 0.3s ease-out both}
.ap{animation:pop 0.3s ease-out both}
.apulse{animation:pulse 1.8s ease-in-out infinite}
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddictiveLearning() {
  const [screen,    setScreen]  = useState("home");
  const [topic,     setTopic]   = useState("ai");
  const [customT,   setCustomT] = useState("");
  const [questions, setQs]      = useState([]);
  const [loading,   setLoading] = useState(false);
  const [loadMsg,   setLoadMsg] = useState("");
  const [qIdx,      setQIdx]    = useState(0);
  const [selected,  setSel]     = useState(null);
  const [timer,     setTimer]   = useState(20);
  const [myScore,   setMyScore] = useState(0);
  const [oppScore,  setOppScore]= useState(0);
  const [oppAns,    setOppAns]  = useState(false);
  const [oppRight,  setOppRight]= useState(false);
  const [showExp,   setShowExp] = useState(false);
  const [countdown, setCD]      = useState(3);
  const [burst,     setBurst]   = useState(null);
  const [rating,    setRating]  = useState(1200);
  const timerRef = useRef(null);
  const oppRef   = useRef(null);

  // Google Fonts
  useEffect(() => {
    const l = document.createElement("link");
    l.rel  = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@400;500;600&display=swap";
    document.head.appendChild(l);
    return () => l.remove();
  }, []);

  const currentQ = questions[qIdx];

  // ── 20-second countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "battle" || selected !== null) return;
    if (timer <= 0) { handleAnswer(-1); return; }
    timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [screen, timer, selected]);

  // ── Simulated opponent (replaces Supabase Realtime in demo mode) ──────────
  // TO REPLACE WITH REAL MULTIPLAYER: swap this useEffect with a
  // supabase.channel('match:'+matchId).on('postgres_changes', ...).subscribe()
  // See supabase/schema.sql for the matches table structure.
  useEffect(() => {
    if (screen !== "battle" || selected !== null) return;
    const delay = 3500 + Math.random() * 9000;
    const isRight = Math.random() < 0.58;
    oppRef.current = setTimeout(() => {
      setOppAns(true);
      setOppRight(isRight);
    }, delay);
    return () => clearTimeout(oppRef.current);
  }, [screen, qIdx]);

  // ── Answer handler ────────────────────────────────────────────────────────
  const handleAnswer = useCallback((idx) => {
    if (selected !== null || !currentQ) return;
    clearTimeout(timerRef.current);
    clearTimeout(oppRef.current);
    setSel(idx);
    setShowExp(true);
    const correct = idx === currentQ.correct;
    if (correct) {
      setMyScore(s => s + 1);
      setBurst("+1 point");
      setTimeout(() => setBurst(null), 900);
    }
    if (!oppAns) {
      const or = Math.random() < 0.55;
      setOppAns(true);
      setOppRight(or);
      if (or) setOppScore(s => s + 1);
    } else if (oppRight) {
      setOppScore(s => s + 1);
    }
  }, [selected, currentQ, oppAns, oppRight]);

  // ── Next question ─────────────────────────────────────────────────────────
  const nextQ = useCallback(() => {
    if (qIdx >= questions.length - 1) {
      const won = myScore > oppScore;
      const diff = Math.abs(myScore - oppScore);
      const change = won
        ? Math.round(16 + diff * 4)
        : myScore === oppScore ? 0 : -Math.round(12 + diff * 3);
      setRating(r => r + change);
      setScreen("results");
      return;
    }
    setQIdx(i => i + 1);
    setSel(null);
    setOppAns(false);
    setOppRight(false);
    setShowExp(false);
    setTimer(20);
  }, [qIdx, questions.length, myScore, oppScore]);

  // ── 3-2-1 countdown ──────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown <= 0) { setScreen("battle"); return; }
    const t = setTimeout(() => setCD(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, countdown]);

  // ── Generate questions via API route ─────────────────────────────────────
  const generateQuestions = useCallback(async () => {
    setLoading(true);
    setLoadMsg("Setting up your match...");

    // Pick the right fallback for this topic upfront
    const fallback = FALLBACKS[topic] ?? FALLBACKS.ai;
    const topicStr = topic === "custom"
      ? customT
      : TOPIC_PROMPTS[topic];

    try {
      setLoadMsg("Generating questions with AI...");
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicStr }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setQs(Array.isArray(data.questions) && data.questions.length >= 5
        ? data.questions
        : fallback);
    } catch (err) {
      console.warn("AI generation failed, using fallback questions:", err.message);
      setQs(fallback);
    }
    setLoading(false);
    setScreen("waiting");
  }, [topic, customT]);

  const startMatch = () => {
    setMyScore(0); setOppScore(0); setQIdx(0);
    setSel(null); setOppAns(false); setOppRight(false);
    setShowExp(false); setTimer(20); setCD(3);
    setScreen("countdown");
  };

  const resetAll = () => {
    setScreen("home"); setQs([]); setQIdx(0);
    setSel(null); setOppAns(false); setOppRight(false);
    setMyScore(0); setOppScore(0); setTimer(20);
    setLoading(false);
  };

  // ── Shared top bar ────────────────────────────────────────────────────────
  const Bar = ({ right }) => (
    <div className="top-bar">
      <div className="logo">Addictive <span>Learning</span></div>
      {right ?? (
        <div className="rating-chip">
          <span className="rating-val">{rating}</span>
          <span className="rating-lbl">rating</span>
        </div>
      )}
    </div>
  );

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === "home") return (
    <div className="root dot">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Bar />
      <div className="page pt">
        <div className="au" style={{ marginBottom: 24 }}>
          <p className="t-label" style={{ marginBottom: 8 }}>Live 1-on-1 quiz</p>
          <h1 className="t-title" style={{ marginBottom: 8 }}>
            Challenge a friend.<br />
            <span className="t-acc">Who knows more?</span>
          </h1>
          <p className="t-small" style={{ maxWidth: 340, lineHeight: 1.65 }}>
            Same questions, both of you at the same time. First correct answer wins each round. Best of 7 wins the match.
          </p>
        </div>

        {/* Topic selector */}
        <div className="card p16 au" style={{ marginBottom: 12, animationDelay: "0.05s" }}>
          <p className="t-label" style={{ marginBottom: 12 }}>Choose a topic</p>
          {TOPICS.map(t => (
            <button
              key={t.id}
              className={`topic-opt${topic === t.id ? " active" : ""}`}
              onClick={() => setTopic(t.id)}
            >
              <div>
                <div className="topic-opt-text">{t.label}</div>
                <div className="topic-opt-desc">{t.desc}</div>
              </div>
              {topic === t.id && <span className="checkmark">✓</span>}
            </button>
          ))}
          {topic === "custom" && (
            <input
              value={customT}
              onChange={e => setCustomT(e.target.value)}
              placeholder="e.g. JavaScript arrays, SQL joins, machine learning..."
              style={{
                marginTop: 8, width: "100%", padding: "10px 13px",
                background: "var(--s2)", border: "1px solid var(--brd)",
                borderRadius: 8, color: "var(--txt)", fontFamily: "var(--fb)", fontSize: 14
              }}
            />
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }} className="au">
          <button
            className="btn btn-pri btn-full btn-lg"
            onClick={generateQuestions}
            disabled={loading || (topic === "custom" && !customT.trim())}
          >
            {loading ? loadMsg : "Start a new match →"}
          </button>
          <button className="btn btn-full" onClick={() => setScreen("join")}>
            Join a match with a code
          </button>
        </div>

        {/* How it works */}
        <div className="card p16 au" style={{ animationDelay: "0.1s" }}>
          <p className="t-label" style={{ marginBottom: 12 }}>How it works</p>
          {[
            "Pick a topic and start a match",
            "Share the link with a friend",
            "You both see the same questions at the same time",
            "First correct answer wins each round — best of 7 wins the match",
          ].map((txt, i) => (
            <div key={i} className="how-step">
              <div className="step-num">{i + 1}</div>
              <p className="t-small" style={{ paddingTop: 3 }}>{txt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── JOIN ──────────────────────────────────────────────────────────────────
  if (screen === "join") return (
    <div className="root dot">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Bar right={
        <button className="btn btn-sm" onClick={() => setScreen("home")}>← Back</button>
      } />
      <div className="page pt">
        <p className="t-label" style={{ marginBottom: 8 }}>Join a match</p>
        <h2 className="t-head" style={{ marginBottom: 14 }}>Enter the code your friend shared</h2>
        <input
          placeholder="Paste match code or link here..."
          style={{
            width: "100%", padding: "12px 14px", background: "var(--s1)",
            border: "1px solid var(--brd)", borderRadius: 8,
            color: "var(--txt)", fontFamily: "var(--fb)", fontSize: 14, marginBottom: 10
          }}
        />
        <button
          className="btn btn-pri btn-full btn-lg"
          onClick={() => alert("Real-time join works when Supabase is connected. For now, use 'Start a new match' to play against a simulated opponent.")}
        >
          Join match →
        </button>
        <p className="t-small" style={{ marginTop: 12, textAlign: "center" }}>
          Don't have a code? Ask your friend to start a match and share the link.
        </p>
      </div>
    </div>
  );

  // ── WAITING ───────────────────────────────────────────────────────────────
  if (screen === "waiting") return (
    <div className="root dot">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Bar />
      <div className="page pt">
        <div className="au" style={{ marginBottom: 20 }}>
          <p className="t-label" style={{ marginBottom: 8 }}>Match ready</p>
          <h2 className="t-head" style={{ marginBottom: 6 }}>Share this link with your opponent</h2>
          <p className="t-small">They click it, and the match starts for both of you at the same time.</p>
        </div>

        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, fontFamily: "var(--fb)", fontSize: 13, color: "var(--sub)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              addictivelearning.app/match/abc-xyz-123
            </div>
            <button
              className="btn btn-sm"
              onClick={() => navigator.clipboard?.writeText("https://addictivelearning.app/match/abc-xyz-123")}
            >
              Copy
            </button>
          </div>
          <hr style={{ margin: 0 }} />
          <div style={{ padding: "10px 14px", display: "flex", gap: 8 }}>
            <button className="btn" style={{ flex: 1, fontSize: 13, padding: "9px" }}>Share via WhatsApp</button>
            <button className="btn" style={{ flex: 1, fontSize: 13, padding: "9px" }}>Share on Twitter</button>
          </div>
        </div>

        <div className="card p16" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {[
              ["Topic", topic === "custom" ? customT : TOPICS.find(t => t.id === topic)?.label],
              ["Questions", questions.length],
              ["Format", `Best of ${questions.length}`],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <p className="t-small">{lbl}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)", marginTop: 2 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn btn-pri btn-full btn-lg" onClick={startMatch}>
            Play against a simulated opponent →
          </button>
          <button className="btn btn-full" style={{ fontSize: 13 }} onClick={resetAll}>
            ← Change topic
          </button>
        </div>
      </div>
    </div>
  );

  // ── COUNTDOWN ─────────────────────────────────────────────────────────────
  if (screen === "countdown") return (
    <div className="root grid-bg" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ textAlign: "center" }}>
        <p className="t-label" style={{ marginBottom: 16 }}>Match starts in</p>
        <div style={{
          fontFamily: "var(--fh)", fontSize: 68, fontWeight: 800, lineHeight: 1,
          color: countdown > 1 ? "var(--txt)" : "var(--acc)",
          animation: "countIn 0.4s ease-out"
        }}>
          {countdown === 0 ? "GO!" : countdown}
        </div>
        <p className="t-small" style={{ marginTop: 16 }}>
          {topic === "custom" ? customT : TOPICS.find(t => t.id === topic)?.label}
        </p>
      </div>
    </div>
  );

  // ── BATTLE ────────────────────────────────────────────────────────────────
  if (screen === "battle" && currentQ) {
    const isAnswered = selected !== null;
    const wasRight   = isAnswered && selected === currentQ.correct;

    return (
      <div className="root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        {/* Floating point burst */}
        {burst && (
          <div style={{
            position: "fixed", top: 60, left: "50%",
            fontFamily: "var(--fh)", fontSize: 16, fontWeight: 700, color: "var(--grn)",
            animation: "burst 0.9s ease-out forwards", pointerEvents: "none", zIndex: 100
          }}>
            {burst}
          </div>
        )}

        {/* Score header — sticky */}
        <div className="score-header" style={{ position: "sticky", top: 0, zIndex: 40 }}>
          <div className="score-side">
            <div className="avatar av-you">You</div>
            <span className="score-name">You</span>
            <span className="score-pts t-acc">{myScore}</span>
          </div>
          <div className="score-center">
            <span className="round-label">Q {qIdx + 1}/{questions.length}</span>
            <div className={`timer${timer <= 7 ? " warn" : ""}`}>
              <span className="timer-num">{timer}s</span>
            </div>
          </div>
          <div className="score-side right">
            <span className="score-pts" style={{ color: "var(--sub)" }}>{oppScore}</span>
            <span className="score-name dim">Opponent</span>
            <div className="avatar av-opp">OP</div>
          </div>
        </div>

        <div className="page" style={{ paddingTop: 14 }}>
          {/* Question */}
          <div className="q-wrap au">
            <p className="q-label">Question {qIdx + 1}</p>
            <p className="q-text">{currentQ.q}</p>
          </div>

          {/* Options */}
          <div className="au" style={{ animationDelay: "0.05s" }}>
            {currentQ.opts.map((opt, i) => {
              let cls = "opt";
              if (isAnswered) {
                if (i === currentQ.correct)                  cls += " opt-correct";
                else if (i === selected)                     cls += " opt-wrong";
                else                                         cls += " opt-dim";
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => !isAnswered && handleAnswer(i)}
                  disabled={isAnswered}
                >
                  <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {isAnswered && i === currentQ.correct && <span className="opt-check">✓</span>}
                  {isAnswered && i === selected && i !== currentQ.correct && <span className="opt-check">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Live status row */}
          <div className="status-row">
            {isAnswered
              ? <span className={`badge ${wasRight ? "badge-grn" : "badge-acc"}`}>
                  {wasRight ? "✓ Correct" : "✗ Wrong"}
                </span>
              : <span className="badge badge-sub">Pick your answer</span>
            }
            {oppAns
              ? <span className={`badge ${oppRight ? "badge-acc" : "badge-sub"}`}>
                  Opponent {oppRight ? "got it right" : "got it wrong"}
                </span>
              : <span className="badge badge-sub apulse">Opponent thinking...</span>
            }
          </div>

          {/* Explanation */}
          {showExp && isAnswered && (
            <div className={`explain-box ap ${wasRight ? "explain-ok" : "explain-err"}`}>
              <span className="explain-head" style={{ color: wasRight ? "var(--grn)" : "#ff7050" }}>
                {wasRight ? "Why this is correct" : `Correct answer: ${String.fromCharCode(65 + currentQ.correct)}`}
              </span>
              {currentQ.explain}
            </div>
          )}

          {/* Next button */}
          {isAnswered && (
            <button className="btn btn-pri btn-full btn-lg ap" onClick={nextQ} style={{ marginTop: 12 }}>
              {qIdx >= questions.length - 1 ? "See final score →" : "Next question →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (screen === "results") {
    const won     = myScore > oppScore;
    const tied    = myScore === oppScore;
    const diff    = Math.abs(myScore - oppScore);
    const change  = won ? Math.round(16 + diff * 4) : tied ? 0 : -Math.round(12 + diff * 3);
    const acc     = questions.length ? Math.round((myScore / questions.length) * 100) : 0;
    const topicLabel = topic === "custom" ? customT : TOPICS.find(t => t.id === topic)?.label;

    return (
      <div className="root grid-bg">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <Bar />
        <div className="page pt" style={{ textAlign: "center" }}>
          <div className="ap" style={{ marginBottom: 22 }}>
            <p className="t-label" style={{ marginBottom: 8 }}>Match over</p>
            <h2 className="t-title" style={{
              fontSize: 24,
              color: won ? "var(--grn)" : tied ? "var(--gold)" : "var(--txt)",
              marginBottom: 4
            }}>
              {won ? "You won! 🎉" : tied ? "It's a tie!" : "Opponent wins"}
            </h2>
            <div style={{ fontFamily: "var(--fh)", fontSize: 30, fontWeight: 800, color: "var(--txt)", marginBottom: 4 }}>
              {myScore} – {oppScore}
            </div>
            <p className="t-small">{topicLabel}</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              ["Rating change", change > 0 ? `+${change}` : `${change}`, won ? "var(--grn)" : "var(--sub)"],
              ["New rating",    rating,                                    "var(--txt)"],
              ["Accuracy",      acc + "%",                                 "var(--gold)"],
            ].map(([lbl, val, col]) => (
              <div key={lbl} className="stat-card">
                <div className="stat-val" style={{ color: col }}>{val}</div>
                <div className="stat-lbl">{lbl}</div>
              </div>
            ))}
          </div>

          {/* Share */}
          <div className="card p16" style={{ marginBottom: 14, textAlign: "left" }}>
            <p className="t-label" style={{ marginBottom: 10 }}>Share your result</p>
            <div className="share-box">
              {won ? `I beat my opponent ${myScore}–${oppScore}` : `I scored ${myScore}/${questions.length}`} on {topicLabel} — rating now {rating}.{" "}
              Can you beat me? addictivelearning.app
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn"
                style={{ flex: 1, fontSize: 13, padding: "9px" }}
                onClick={() => navigator.clipboard?.writeText(
                  `${won ? `I beat my opponent ${myScore}–${oppScore}` : `I scored ${myScore}/${questions.length}`} on ${topicLabel} — rating now ${rating}. Can you beat me? addictivelearning.app`
                )}
              >
                Copy text
              </button>
              <button className="btn" style={{ flex: 1, fontSize: 13, padding: "9px" }}>
                Share →
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-pri"
              style={{ flex: 1, padding: "13px" }}
              onClick={() => {
                setMyScore(0); setOppScore(0); setQIdx(0);
                setSel(null); setOppAns(false); setOppRight(false);
                setShowExp(false); setTimer(20); setCD(3);
                setScreen("countdown");
              }}
            >
              Play again
            </button>
            <button className="btn" style={{ flex: 1, padding: "13px" }} onClick={resetAll}>
              Change topic
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <div className="root"><style dangerouslySetInnerHTML={{ __html: CSS }} /></div>;
}