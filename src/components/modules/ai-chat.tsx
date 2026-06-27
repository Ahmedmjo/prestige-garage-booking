'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User, X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { PrestigeLogo } from '@/components/prestige/logo'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  intent?: string
  provider?: string
}

const QUICK_SUGGESTIONS = [
  { icon: '🎞️', text: 'كم رصيد رول Hexis BF-001؟', category: 'استعلام' },
  { icon: '👷', text: 'من أكثر فني أداءً هذا الشهر؟', category: 'تحليل' },
  { icon: '📦', text: 'قيمة المخزون المتبقي؟', category: 'استعلام' },
  { icon: '📊', text: 'اعملي تقرير شهري ليونيو', category: 'تقرير' },
  { icon: '⚠️', text: 'أظهر لي الرولات اللي أوشكت على النفاذ', category: 'تنبيه' },
  { icon: '💰', text: 'كم ربحنا من البروتيكشن؟', category: 'استعلام' },
  { icon: '💵', text: 'صافي مرتب علي يحيى في يونيو؟', category: 'استعلام' },
  { icon: '🔧', text: 'كم استهلكنا من TPU هذا الشهر؟', category: 'استعلام' },
  { icon: '📈', text: 'قارن بين أداء الفنيين', category: 'تحليل' },
  { icon: '🔔', text: 'ما هي التنبيهات النشطة؟', category: 'تنبيه' },
]

const STORAGE_KEY = 'prestige-ai-chat-active'
const MAX_STORED_MESSAGES = 200

interface AIChatProps {
  onClose?: () => void  // When closed, return to dashboard
}

export function AIChat({ onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ─── Load active conversation on mount ─────────────────
  // Each "session" continues until user clicks "Close conversation"
  useEffect(() => {
    const saved = loadActiveConversation()
    if (saved && saved.length > 0) {
      // Resume existing conversation
      setMessages(saved)
    } else {
      // Start new conversation with welcome message
      const welcomeMsg: Message = {
        role: 'assistant',
        content: 'مرحباً! أنا **مساعد برستيج** 🤖\n\nأنا هنا لمساعدتك في إدارة المركز بذكاء. أقدر أجيب على أسئلتك عن المخزون والرواتب والإيرادات، وأساعدك في تحليل البيانات وإنشاء التقارير.\n\nاكتب سؤالك أو اختر من الاقتراحات السريعة بالأسفل 👇',
        timestamp: new Date().toISOString(),
      }
      setMessages([welcomeMsg])
      saveActiveConversation([welcomeMsg])
    }
  }, [])

  // ─── Auto-scroll to bottom on new messages ──────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // ─── Save conversation whenever it changes ──────────────
  useEffect(() => {
    if (messages.length > 0) {
      saveActiveConversation(messages)
    }
  }, [messages])

  function loadActiveConversation(): Message[] | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  function saveActiveConversation(msgs: Message[]) {
    try {
      const toStore = msgs.slice(-MAX_STORED_MESSAGES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      // localStorage might be full, ignore
    }
  }

  function clearActiveConversation() {
    localStorage.removeItem(STORAGE_KEY)
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'فشل الاتصال بالمساعد')
      }

      const data = await res.json()
      const aiMsg: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
        intent: data.intent,
        provider: data.provider,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (e: any) {
      toast.error(e.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `عذراً، حدث خطأ أثناء معالجة طلبك. ${e.message}`,
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }

  // ─── Close conversation: clear saved chat + return to dashboard ───
  function handleCloseConversation() {
    if (!confirm('هل تريد إنهاء المحادثة والعودة للوحة التحكم؟ سيتم مسح المحادثة الحالية.')) return
    clearActiveConversation()
    toast.success('تم إنهاء المحادثة')
    if (onClose) {
      onClose()  // Return to dashboard
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Header — with Prestige Logo + Close button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Prestige Logo (Red) */}
          <div className="relative">
            <PrestigeLogo size={48} className="flex-shrink-0" />
            <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-[#00C853] border-2 border-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">مساعد برستيج</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles size={10} className="text-[#DC143C]" />
              مساعد ذكي يعرف كل شيء عن المركز
            </p>
          </div>
        </div>
        {/* Close conversation button — returns to dashboard */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCloseConversation}
          className="text-gray-400 hover:text-white hover:bg-[#DC143C]/10"
          title="إنهاء المحادثة والعودة للوحة التحكم"
        >
          <X size={18} className="ml-1" />
          <span className="text-xs hidden sm:inline">إنهاء المحادثة</span>
        </Button>
      </div>

      {/* Chat area — conversation scrolls up, input stays at bottom */}
      <div className="flex-1 prestige-card overflow-hidden flex flex-col">
        {/* Messages — scrollable area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar — Prestige Logo for assistant */}
                  <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden ${
                    msg.role === 'user' ? 'bg-white/10' : 'bg-transparent'
                  }`}>
                    {msg.role === 'user' ? (
                      <User size={16} />
                    ) : (
                      <PrestigeLogo size={36} />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={`flex-1 min-w-0 max-w-[80%] ${msg.role === 'user' ? 'text-left' : ''}`}>
                    <div
                      className={`rounded-2xl p-3.5 ${
                        msg.role === 'user'
                          ? 'bg-[#DC143C]/15 border border-[#DC143C]/20 text-white rounded-tr-sm'
                          : 'bg-[#0A0A0A] border border-white/5 text-gray-100 rounded-tl-sm'
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {formatMessage(msg.content)}
                      </div>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {msg.intent && msg.intent !== 'query' && (
                          <Badge className="bg-white/5 text-gray-400 border-white/10 text-xs">
                            {msg.intent === 'add' ? '📝 إضافة' :
                             msg.intent === 'report' ? '📊 تقرير' :
                             msg.intent === 'alert' ? '🔔 تنبيه' :
                             msg.intent === 'suggestion' ? '💡 اقتراح' : msg.intent}
                          </Badge>
                        )}
                        {msg.provider && (
                          <Badge className="bg-[#03DAC6]/10 text-[#03DAC6] border-[#03DAC6]/20 text-[10px]" title="AI Model">
                            {msg.provider === 'groq-llama-3.3-70b' ? '🦙 Llama 3.3 70B' :
                             msg.provider === 'openrouter-llama-3.1-8b' ? '🦙 Llama 3.1 8B' :
                             msg.provider === 'z-ai-glm' ? '🤖 GLM' :
                             msg.provider === 'none' ? '❌ خطأ' : msg.provider}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 px-2">
                      {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden">
                  <PrestigeLogo size={36} />
                </div>
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl rounded-tl-sm p-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#DC143C] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {/* Quick suggestions — only show if few messages */}
        {messages.length <= 1 && (
          <div className="border-t border-white/5 p-3 bg-black/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-[#FF9100]" />
              <p className="text-xs text-gray-400">اقتراحات سريعة</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {QUICK_SUGGESTIONS.map((q, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => sendMessage(q.text)}
                  className="text-right p-2.5 rounded-lg bg-white/5 border border-white/5 hover:bg-[#DC143C]/10 hover:border-[#DC143C]/30 text-xs text-gray-300 hover:text-white transition-all flex items-center gap-2"
                >
                  <span className="text-base">{q.icon}</span>
                  <span className="flex-1 leading-tight">{q.text}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar — always visible at bottom during conversation */}
        <div className="border-t border-white/5 p-3 bg-black/30 flex-shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              disabled={loading}
              className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 flex-1"
              autoFocus
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="prestige-gradient border-0 hover:opacity-90 px-4"
            >
              <Send size={18} className="rotate-180" />
            </Button>
          </form>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            💬 المحادثة مستمرة — اكتب سؤالك التالي مباشرة
          </p>
        </div>
      </div>
    </div>
  )
}

// Format AI response with basic markdown (bold, lists)
function formatMessage(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, idx) => {
    // Bold: **text**
    const boldParts = line.split(/(\*\*[^*]+\*\*)/g)
    const formatted = boldParts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })

    // List items
    if (line.match(/^[-•*]\s/)) {
      return (
        <div key={idx} className="flex gap-2 my-1">
          <span className="text-[#DC143C]">•</span>
          <span>{formatted.slice(1)}</span>
        </div>
      )
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      return <div key={idx} className="my-1 mr-4">{formatted}</div>
    }

    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="h-2" />
    }

    return <div key={idx} className="my-0.5">{formatted}</div>
  })
}
