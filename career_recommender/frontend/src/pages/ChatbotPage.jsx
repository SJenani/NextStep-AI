import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const CHAT_HISTORY_LIMIT = 30;
const MESSAGE_HISTORY_LIMIT = 80;

const defaultStarters = [
  "Which role should I target right now?",
  "What skills should I learn next?",
  "Why am I not matching more roles?",
  "Improve my resume summary",
  "How should I prepare for interviews?",
  "Which saved job is my best fit?",
];

function getChatStorageKey(user) {
  return `career_chatbot_history_${user?.id || user?.email || "local"}`;
}

function getProfilePhotoStorageKey(user) {
  return `career_profile_${user?.id || user?.email || "local"}_photo`;
}

function buildChatPreview(messages) {
  const firstUserMessage = messages.find((message) => message.role === "user") || messages[0];
  return firstUserMessage?.content?.slice(0, 48) || "Chat";
}

function buildStoredConversation(messages) {
  return {
    messages: messages.slice(-MESSAGE_HISTORY_LIMIT),
    preview: buildChatPreview(messages),
    updatedAt: Date.now(),
  };
}

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-3 mt-1 text-2xl font-bold leading-tight text-slate-950">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 border-b border-slate-200 pb-2 text-xl font-bold leading-tight text-slate-950 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold leading-tight text-slate-900">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-7 text-slate-700 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-950">{children}</strong>,
  ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-5 text-slate-700">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-slate-700">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7 text-slate-700">{children}</li>,
  code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-blue-700">{children}</code>,
  a: ({ children, href }) => <a className="font-semibold text-blue-700 underline-offset-4 hover:underline" href={href}>{children}</a>,
};

function MessageContent({ message }) {
  if (message.role === "user") {
    return <p className="whitespace-pre-wrap text-base leading-relaxed text-white">{message.content}</p>;
  }

  return (
    <div className="mentor-response text-[15px]">
      <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
    </div>
  );
}

function UserAvatar({ user, profilePhoto, className = "" }) {
  const initial = user?.full_name?.charAt(0).toUpperCase() || "U";

  return (
    <div className={`overflow-hidden bg-blue-600 text-sm font-bold text-white ${className}`}>
      {profilePhoto ? (
        <img src={profilePhoto} alt={user?.full_name || "Profile"} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export default function ChatbotPage() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const historyHydratedRef = useRef(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data } = await client.get("/profile/view");
        setProfile(data);
      } catch {
        setProfile(null);
      }
    }

    fetchProfile();
  }, []);

  useEffect(() => {
    const loadProfilePhoto = () => {
      setProfilePhoto(localStorage.getItem(getProfilePhotoStorageKey(user)) || "");
    };

    loadProfilePhoto();
    window.addEventListener("storage", loadProfilePhoto);
    return () => window.removeEventListener("storage", loadProfilePhoto);
  }, [user?.id, user?.email]);

  useEffect(() => {
    historyHydratedRef.current = false;
    try {
      const raw = localStorage.getItem(getChatStorageKey(user));
      const parsed = raw ? JSON.parse(raw) : null;
      let savedConversations = Array.isArray(parsed?.conversations) ? parsed.conversations : [];
      const savedMessages = Array.isArray(parsed?.activeMessages) ? parsed.activeMessages : [];
      let savedActiveIndex = Number.isInteger(parsed?.activeIndex) ? parsed.activeIndex : -1;

      if (savedMessages.length > 0 && savedActiveIndex < 0) {
        savedConversations = [...savedConversations, buildStoredConversation(savedMessages)].slice(-CHAT_HISTORY_LIMIT);
        savedActiveIndex = savedConversations.length - 1;
      }
      if (savedActiveIndex >= savedConversations.length) {
        savedActiveIndex = savedConversations.length - 1;
      }
      if (savedMessages.length > 0 && savedActiveIndex >= 0) {
        savedConversations = savedConversations.map((conversation, index) =>
          index === savedActiveIndex ? buildStoredConversation(savedMessages) : conversation
        );
      }

      setConversations(savedConversations.slice(-CHAT_HISTORY_LIMIT));
      setMessages(savedMessages.slice(-MESSAGE_HISTORY_LIMIT));
      setActiveIndex(savedActiveIndex);
      setSuggestions([]);
      setError("");
    } catch {
      setConversations([]);
      setMessages([]);
      setActiveIndex(-1);
    } finally {
      historyHydratedRef.current = true;
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!historyHydratedRef.current) return;

    const storedConversations = conversations
      .map((conversation, index) =>
        index === activeIndex && messages.length > 0
          ? buildStoredConversation(messages)
          : {
              ...conversation,
              messages: (conversation.messages || []).slice(-MESSAGE_HISTORY_LIMIT),
              preview: conversation.preview || buildChatPreview(conversation.messages || []),
            }
      )
      .slice(-CHAT_HISTORY_LIMIT);

    const payload = {
      conversations: storedConversations.length === 0 && messages.length > 0 ? [buildStoredConversation(messages)] : storedConversations,
      activeMessages: messages.slice(-MESSAGE_HISTORY_LIMIT),
      activeIndex,
      updatedAt: Date.now(),
    };

    try {
      localStorage.setItem(getChatStorageKey(user), JSON.stringify(payload));
    } catch {
      // Ignore storage quota/private mode failures.
    }
  }, [user?.id, user?.email, conversations, messages, activeIndex]);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getQuickPrompts = () => {
    if (!profile) return defaultStarters;
    const { desired_role, domain, skills } = profile;
    const prompts = [];
    if (desired_role) prompts.push(`What skills do I need for ${desired_role}?`);
    if (domain) prompts.push(`Am I a good fit for ${domain} roles?`);
    if (skills?.length > 0) prompts.push("Which of my skills are most in demand?");
    prompts.push("Why am I not matching more roles?");
    prompts.push("How should I prepare for interviews?");
    prompts.push("Improve my resume summary");
    return prompts.slice(0, 6);
  };

  const refreshProfile = async () => {
    try {
      const { data } = await client.get("/profile/view");
      setProfile(data);
    } catch {
      // Keep current profile if refresh fails.
    }
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const history = messages.slice(-6).map((message) => ({
      role: message.role,
      text: message.content,
    }));
    const userMessage = { role: "user", content: trimmed };

    if (activeIndex === -1 && messages.length === 0) {
      const nextConversation = buildStoredConversation([userMessage]);
      setConversations((prev) => [...prev, nextConversation].slice(-CHAT_HISTORY_LIMIT));
      setActiveIndex(Math.min(conversations.length, CHAT_HISTORY_LIMIT - 1));
    }

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError("");
    setSuggestions([]);

    try {
      const response = await client.post("/chatbot/ask", {
        question: trimmed,
        messages: history,
      });

      const answer = response.data?.answer || "I couldn't get a response. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      setSuggestions(response.data?.suggestions || []);
      setInputText("");
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || "Unable to reach the mentor.";
      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. The server might be busy. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openResumePicker = () => {
    if (!resumeUploading) {
      resumeInputRef.current?.click();
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeMessage("Please upload a PDF resume.");
      setError("Please upload a PDF resume.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setResumeUploading(true);
      setResumeMessage(`Analyzing ${file.name}...`);
      setError("");

      const { data } = await client.post("/resume/upload?auto_fill=true", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshProfile();

      const audit = data.resume_audit;
      const scoreLine = audit ? ` ATS score: ${Math.round(audit.overall_score)}/100 for ${audit.target_role}.` : "";
      const extractedSkills = data.extracted_skills?.slice(0, 6).join(", ");
      const skillsLine = extractedSkills ? ` I found skills like ${extractedSkills}.` : "";

      setResumeMessage("Resume analyzed and added to your mentor context.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Resume uploaded successfully.${scoreLine}${skillsLine}\n\nYou can now ask me to improve your summary, check ATS gaps, or rewrite bullets for your target role.`,
        },
      ]);
      setSuggestions(["Check my resume score", "Which resume keywords are missing?", "Improve my resume summary"]);
    } catch (err) {
      const message = err.response?.data?.detail || "Resume upload failed. Please try again.";
      setResumeMessage(message);
      setError(message);
    } finally {
      setResumeUploading(false);
    }
  };

  const newChat = () => {
    if (messages.length > 0) {
      setConversations((prev) => {
        const nextConversation = buildStoredConversation(messages);
        if (activeIndex >= 0) {
          return prev.map((conversation, index) => (index === activeIndex ? nextConversation : conversation));
        }
        return [...prev, nextConversation].slice(-CHAT_HISTORY_LIMIT);
      });
    }
    setMessages([]);
    setActiveIndex(-1);
    setError("");
    setSuggestions([]);
  };

  const loadConversation = (index) => {
    const conv = conversations[index];
    if (!conv) return;
    setMessages(conv.messages || []);
    setActiveIndex(index);
    setError("");
    setSuggestions([]);
  };

  const deleteConversation = (indexToDelete) => {
    setConversations((prev) => prev.filter((_, index) => index !== indexToDelete));
    if (activeIndex === indexToDelete) {
      setMessages([]);
      setActiveIndex(-1);
      setSuggestions([]);
      setError("");
    } else if (activeIndex > indexToDelete) {
      setActiveIndex((current) => current - 1);
    }
  };

  const quickPrompts = getQuickPrompts();
  const filteredConversationItems = conversations
    .map((conv, index) => ({ conv, index }))
    .filter(({ conv }) => (conv.preview || "Chat").toLowerCase().includes(historySearch.trim().toLowerCase()));

  return (
    <main className="flex h-screen w-full bg-white">
      <div
        className={`grid h-full w-full overflow-hidden text-slate-900 transition-[grid-template-columns] duration-300 ${
        sidebarOpen ? "grid-cols-[20rem_minmax(0,1fr)]" : "grid-cols-[0_minmax(0,1fr)]"
      }`}
      >
      <input ref={resumeInputRef} type="file" accept="application/pdf" onChange={handleResumeUpload} className="sr-only" />

      <aside className="flex overflow-hidden border-r border-slate-200 bg-slate-50">
        <div className="flex h-full w-80 shrink-0 flex-col">
          <div className="space-y-3 p-4">
            <button onClick={newChat} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-500 transition focus-within:border-blue-300 focus-within:bg-white hover:bg-slate-100">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
              </svg>
              <input
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>

          </div>

          <div className="flex-1 overflow-y-auto px-2 py-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recents</p>
            <div className="space-y-1">
              {conversations.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">No chat history yet</p>
              ) : filteredConversationItems.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate-500">No matching chats</p>
              ) : (
                filteredConversationItems.map(({ conv, index }) => (
                  <div
                    key={`${index}-${conv.updatedAt || conv.preview}`}
                    className={`group flex items-center gap-1 rounded-xl pr-1 transition ${
                      activeIndex === index ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"
                    }`}
                  >
                    <button type="button" onClick={() => loadConversation(index)} className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm">
                      {conv.preview}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteConversation(index)}
                      className="hidden rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 group-hover:block"
                      aria-label="Delete chat"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm transition hover:bg-slate-100">
              <UserAvatar user={user} profilePhoto={profilePhoto} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-slate-950">{user?.full_name || "User"}</p>
                <p className="truncate text-xs text-slate-400">Career mentor</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col bg-white">
        <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-950">AI Mentor</h1>
              <p className="text-xs text-slate-400">{profile?.desired_role || "Career guidance chat"}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Online</span>
            <NavLink
              to="/roadmap"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
              </svg>
              Roadmap
            </NavLink>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.78),rgba(255,255,255,1))] px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-4xl">
            {messages.length === 0 && (
              <div className="mx-auto flex min-h-[520px] max-w-3xl flex-col justify-center">
                <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">AI Career Mentor</p>
                <h2 className="mt-3 text-center text-3xl font-bold text-slate-950">What can I help with?</h2>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-700 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition hover:border-blue-200 hover:bg-blue-50/60 hover:text-slate-950"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                {!profile?.resume_text && (
                  <button
                    type="button"
                    onClick={openResumePicker}
                    disabled={resumeUploading}
                    className="mx-auto mt-5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resumeUploading ? "Analyzing resume..." : "Attach resume PDF for better answers"}
                  </button>
                )}
                {resumeMessage && <p className="mt-3 text-center text-xs font-semibold text-slate-400">{resumeMessage}</p>}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`mb-8 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-4 ${msg.role === "user" ? "max-w-[78%] flex-row-reverse" : "w-full"}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    {msg.role === "user" ? (
                      <UserAvatar user={user} profilePhoto={profilePhoto} className="flex h-10 w-10 items-center justify-center rounded-full" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`min-w-0 px-5 py-3 ${msg.role === "user" ? "rounded-[26px] bg-slate-900 text-white shadow-[0_12px_26px_rgba(15,23,42,0.12)]" : "rounded-[24px] border border-slate-200 bg-white text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.05)]"}`}>
                    {msg.role === "assistant" && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">AI Career Mentor</span>
                      </div>
                    )}
                    <MessageContent message={msg} />
                  </div>
                </div>
              </div>
            ))}

            {suggestions.length > 0 && !loading && (
              <div className="mb-6 ml-14 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Try next</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:border-blue-200 hover:bg-blue-100"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="mb-6 flex gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                  <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                  <span className="h-3 w-3 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-3 w-3 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-3 w-3 animate-bounce rounded-full bg-blue-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-5 pb-4 pt-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="mx-auto flex max-w-3xl items-center gap-3 rounded-[28px] border border-slate-200 bg-white p-2 shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
          >
            <button
              type="button"
              onClick={openResumePicker}
              disabled={resumeUploading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Attach resume PDF"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
              </svg>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything"
              className="min-h-12 flex-1 border-0 bg-transparent px-2 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
            />

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              aria-label="Send message"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.6 4.2c-.5-.24-1.05.22-.9.76L4.8 11H13a1 1 0 1 1 0 2H4.8l-2.1 6.04c-.15.54.4 1 .9.76l17-7.8a.9.9 0 0 0 0-1.6l-17-7.8Z" />
                </svg>
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-slate-500">AI mentor can make mistakes. Use resume and job suggestions as guidance.</p>
        </div>
      </main>
      </div>
    </main>
  );
}
