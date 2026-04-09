import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircleMore,
  Minimize2,
  Phone,
  SendHorizonal,
  Video,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const BUBBLE_SIZE = 48;
const PANEL_WIDTH = 360;
const PANEL_HEIGHT = 520;
const VIEWPORT_PADDING = 24;

const demoMessages = [
  {
    id: "demo-1",
    type: "incoming",
    text: "Ê, cuối tuần này mày còn giữ plan đi Đà Lạt không?",
    time: "09:14",
  },
  {
    id: "demo-2",
    type: "outgoing",
    text: "Còn chứ. Tao đang chốt lại lịch trình với mấy quán cà phê để tối ưu đường đi.",
    time: "09:16",
  },
  {
    id: "demo-3",
    type: "incoming",
    text: "Nice. Có gì gửi tao cái list điểm ghé với budget nha.",
    time: "09:18",
  },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getBubbleBounds() {
  if (typeof window === "undefined") {
    return {
      minX: VIEWPORT_PADDING,
      minY: VIEWPORT_PADDING,
      maxX: VIEWPORT_PADDING,
      maxY: VIEWPORT_PADDING,
    };
  }

  return {
    minX: VIEWPORT_PADDING,
    minY: VIEWPORT_PADDING,
    maxX: Math.max(VIEWPORT_PADDING, window.innerWidth - BUBBLE_SIZE - VIEWPORT_PADDING),
    maxY: Math.max(VIEWPORT_PADDING, window.innerHeight - BUBBLE_SIZE - VIEWPORT_PADDING),
  };
}

function getInitialBubblePosition() {
  const bounds = getBubbleBounds();
  return {
    x: bounds.maxX,
    y: Math.max(bounds.minY, bounds.maxY - 100),
  };
}

function getPanelPosition(position) {
  if (typeof window === "undefined") {
    return {
      left: VIEWPORT_PADDING,
      top: VIEWPORT_PADDING,
    };
  }

  const bubbleCenterX = position.x + BUBBLE_SIZE / 2;
  const panelLeft = bubbleCenterX > window.innerWidth / 2
    ? position.x + BUBBLE_SIZE - PANEL_WIDTH
    : position.x;
  const panelTop = position.y - PANEL_HEIGHT + 12;

  return {
    left: clamp(
      panelLeft,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, window.innerWidth - PANEL_WIDTH - VIEWPORT_PADDING),
    ),
    top: clamp(
      panelTop,
      VIEWPORT_PADDING,
      Math.max(VIEWPORT_PADDING, window.innerHeight - PANEL_HEIGHT - VIEWPORT_PADDING),
    ),
  };
}

export default function ChatDemoDock() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(getInitialBubblePosition);
  const draggedRef = useRef(false);
  const suppressOpenUntilRef = useRef(0);

  useEffect(() => {
    function handleResize() {
      const bounds = getBubbleBounds();
      setPosition((prev) => ({
        x: clamp(prev.x, bounds.minX, bounds.maxX),
        y: clamp(prev.y, bounds.minY, bounds.maxY),
      }));
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const panelPosition = useMemo(() => getPanelPosition(position), [position]);

  if (!isAuthenticated || location.pathname === "/login") {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] hidden lg:block">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="chat-panel-demo"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed"
            style={{
              width: PANEL_WIDTH,
              left: panelPosition.left,
              top: panelPosition.top,
            }}
          >
            <div className="overflow-hidden rounded-[26px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,247,255,0.98),rgba(242,238,255,0.97))] shadow-[0_30px_80px_rgba(15,23,42,0.18)] ring-1 ring-zinc-200/70 backdrop-blur-xl">
              <div className="relative overflow-hidden border-b border-white/70 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-4 pb-4 pt-3 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />

                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80"
                        alt="Demo contact"
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white/75"
                      />
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[15px] font-semibold tracking-tight">
                          Quang Trung
                        </p>
                        <span className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/80">
                          Demo
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-white/80">
                        Planning mode • Bubble chat
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white/85 transition hover:bg-white/18"
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white/85 transition hover:bg-white/18"
                    >
                      <Video className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white/85 transition hover:bg-white/18"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white/85 transition hover:bg-white/18"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[linear-gradient(180deg,rgba(251,251,252,0.88),rgba(245,247,255,0.92))] px-4 py-4">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6c5ce7]">
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  Bubble chat demo
                </div>

                <div className="space-y-3">
                  {demoMessages.map((message) => {
                    const isOutgoing = message.type === "outgoing";

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-[20px] px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${
                            isOutgoing
                              ? "rounded-br-[8px] bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white"
                              : "rounded-bl-[8px] border border-white/80 bg-white text-zinc-700"
                          }`}
                        >
                          <p className="text-[13px] leading-6">{message.text}</p>
                          <p
                            className={`mt-2 text-[11px] ${
                              isOutgoing ? "text-white/70" : "text-zinc-400"
                            }`}
                          >
                            {message.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-200/70 bg-white/92 p-3">
                <div className="flex items-center gap-2 rounded-[22px] border border-zinc-200/80 bg-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <input
                    type="text"
                    value="Nhập tin nhắn ở đây..."
                    readOnly
                    className="flex-1 bg-transparent text-[14px] text-zinc-400 outline-none"
                  />
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_10px_24px_rgba(102,126,234,0.22)]"
                  >
                    <SendHorizonal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-bubble-demo"
            drag
            dragMomentum={false}
            onDragStart={() => {
              draggedRef.current = false;
            }}
            onDragEnd={(_, info) => {
              const bounds = getBubbleBounds();
              const movedEnough =
                Math.abs(info.offset.x) > 6 || Math.abs(info.offset.y) > 6;

              draggedRef.current = movedEnough;
              if (movedEnough) {
                suppressOpenUntilRef.current = Date.now() + 250;
              }

              setPosition((prev) => {
                const nextX = prev.x + info.offset.x;
                const nextY = prev.y + info.offset.y;
                const clampedY = clamp(nextY, bounds.minY, bounds.maxY);
                const snappedX =
                  nextX + BUBBLE_SIZE / 2 > window.innerWidth / 2
                    ? bounds.maxX
                    : bounds.minX;

                return {
                  x: snappedX,
                  y: clampedY,
                };
              });

              window.setTimeout(() => {
                draggedRef.current = false;
              }, 180);
            }}
            className="pointer-events-auto fixed"
            style={{
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
              left: position.x,
              top: position.y,
            }}
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (Date.now() < suppressOpenUntilRef.current) return;
                if (draggedRef.current) return;
                setIsOpen(true);
              }}
              className="group relative h-full w-full cursor-grab overflow-hidden rounded-full border border-white/80 bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-white shadow-[0_20px_44px_rgba(102,126,234,0.30)] ring-1 ring-white/35 active:cursor-grabbing"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.16),transparent_35%)]" />
              <span className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle,rgba(255,255,255,0.18),transparent_65%)]" />
              <span className="relative flex h-full w-full items-center justify-center">
                <MessageCircleMore className="h-[22px] w-[22px]" strokeWidth={2.2} />
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
