import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { matchIntent } from "../../utils/intentMatcher.js";

const quickReplies = ["Book Cricket", "Food Menu", "Location", "Pricing"];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [openedOnce, setOpenedOnce] = useState(() => localStorage.getItem("captain7:chatOpened") === "true");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem("captain7:chat");
    return saved
      ? JSON.parse(saved)
      : [{ from: "bot", text: "Hey! I'm Captain 7's assistant. Ask me about bookings, food, parties, location, or anything else!", actionLink: null }];
  });
  const endRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem("captain7:chat", JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = (text = input) => {
    if (!text.trim()) return;
    setMessages((current) => [...current, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const answer = matchIntent(text);
      setMessages((current) => [...current, { from: "bot", text: answer.answer, actionLink: answer.actionLink }]);
      setTyping(false);
    }, 650);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setOpenedOnce(true);
          localStorage.setItem("captain7:chatOpened", "true");
        }}
        className="fixed bottom-24 left-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-captain-gold bg-captain-charcoal text-captain-bright shadow-gold md:bottom-6"
        aria-label="Open chatbot"
      >
        <MessageCircle size={24} />
        {!openedOnce ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            1
          </span>
        ) : null}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ y: 28, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            className="fixed bottom-24 left-5 z-[80] flex h-[570px] max-h-[calc(100vh-120px)] w-[min(320px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg border border-captain-gold/35 bg-captain-charcoal shadow-gold-strong md:bottom-6"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-captain-gold text-captain-black">
                  <Bot size={20} />
                </span>
                <div>
                  <div className="font-nav text-xs font-extrabold uppercase tracking-[0.16em] text-captain-bright">
                    Captain Assist
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 hover:border-captain-gold hover:text-captain-gold"
                aria-label="Close chatbot"
              >
                <X size={17} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid gap-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.from}-${index}`}
                    className={`max-w-[88%] rounded-lg px-4 py-3 text-sm leading-5 ${
                      message.from === "user"
                        ? "ml-auto bg-captain-gold text-captain-black"
                        : "mr-auto border border-white/10 bg-white/[0.04] text-white/80"
                    }`}
                  >
                    {message.text}
                    {message.actionLink ? (
                      <Link
                        to={message.actionLink}
                        onClick={() => setOpen(false)}
                        className="mt-3 block font-nav text-xs font-extrabold uppercase tracking-[0.12em] text-captain-bright"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                ))}
                {typing ? (
                  <div className="mr-auto flex gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="h-2 w-2 animate-bounce rounded-full bg-captain-gold"
                        style={{ animationDelay: `${dot * 0.12}s` }}
                      />
                    ))}
                  </div>
                ) : null}
                <div ref={endRef} />
              </div>
            </div>
            <div className="border-t border-white/10 p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => send(reply)}
                    className="shrink-0 rounded-full border border-captain-gold/35 px-3 py-2 text-xs text-white/70 hover:text-captain-gold"
                  >
                    {reply}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  send();
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-captain-black px-4 py-3 text-sm text-white outline-none focus:border-captain-gold"
                  placeholder="Ask Captain 7"
                />
                <button
                  type="submit"
                  className="grid h-12 w-12 place-items-center rounded-full bg-captain-gold text-captain-black"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
