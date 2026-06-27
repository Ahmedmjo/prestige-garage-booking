'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, User, Lightbulb, X, MessageCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { PrestigeLogo } from '@/components/prestige/logo'
import { useI18n } from '@/lib/i18n-context'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  intent?: string
  provider?: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
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

const STORAGE_KEY = 'prestige-ai-conversations'
const ACTIVE_KEY = 'prestige-ai-active-conversation'

interface AIChatProps {
  onClose: () => void
}

export function AIChat({ onClose }: AIChatProps) {
  const { t, lang } = useI18n()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ─── Load conversations on mount ────────────────────────
  useEffect(() => {
    const saved = loadConversations()
    if (saved.length > 0) {
      setConversations(saved)
      const activeSaved = localStorage.getItem(ACTIVE_KEY)
      if (activeSaved && saved.find(c => c.id === activeSaved)) {
        setActiveId(activeSaved)
      } else {
        // Start new conversation
        startNewConversation(saved)
      }
    } else {
      // First time — create initial conversation
      startNewConversation([])
    }
  }, [])

  // ─── Save conversations whenever they change ────────────
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations)
    }
  }, [conversations])

  // ─── Save active conversation ID ────────────────────────
  useEffect(() => {
    if (activeId) {
      localStorage.setItem(ACTIVE_KEY, activeId)
    }
  }, [activeId])

  // ─── Auto-scroll to bottom on new messages ──────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [activeId, conversations, loading])

  function loadConversations(): Conversation[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return []
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function saveConversations(convs: Conversation[]) {
    try {
      // Keep only last 20 conversations
      const toStore = convs.slice(-20)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      // localStorage might be full
    }
  }

  function startNewConversation(existing: Conversation[] = conversations): string {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: lang === 'ar' ? 'محادثة جديدة' : 'New Conversation',
      messages: [{
        role: 'assistant',
        content: lang === 'ar'
          ? 'مرحباً! أنا **مساعد برستيج** 🤖\n\nأنا هنا لمساعدتك في إدارة المركز بذكاء. أقدر أجيب على أسئلتك عن المخزون والرواتب والإيرادات، وأساعدك في تحليل البيانات وإنشاء التقارير.\n\nاكتب سؤالك أو اختر من الاقتراحات السريعة بالأسفل 👇'
          : 'Hello! I am **Prestige Assistant** 🤖\n\nI\'m here to help you manage the garage intelligently. Ask me anything about inventory, salaries, or revenue.\n\nType your question or pick from the suggestions below 👇',
        timestamp: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setConversations(prev => [...prev, newConv])
    setActiveId(newConv.id)
    return newConv.id
  }

  function handleCloseConversation() {
    // Mark current as closed and return to dashboard
    onClose()
  }

  function handleNewChat() {
    startNewConversation()
    setShowHistory(false)
  }

  function handleDeleteConversation(id: string) {
    if (!confirm(lang === 'ar' ? 'حذف هذه المحادثة؟' : 'Delete this conversation?')) return
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id)
      if (id === activeId) {
        if (filtered.length > 0) {
          setActiveId(filtered[filtered.length - 1].id)
        } else {
          startNewConversation([])
        }
      }
      return filtered
    })
    toast.success(lang === 'ar' ? 'تم حذف المحادثة' : 'Conversation deleted')
  }

  function selectConversation(id: string) {
    setActiveId(id)
    setShowHistory(false)
  }

  const activeConversation = conversations.find(c => c.id === activeId)
  const messages = activeConversation?.messages || []

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return

    // Ensure we have an active conversation
    let currentId = activeId
    if (!currentId) {
      currentId = startNewConversation()
    }

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    // Update conversation with user message
    setConversations(prev => prev.map(c => {
      if (c.id === currentId) {
        // Update title if it's the first user message
        const title = c.messages.length <= 1 ? text.slice(0, 40) + (text.length > 40 ? '...' : '') : c.title
        return {
          ...c,
          title,
          messages: [...c.messages, userMsg],
          updatedAt: new Date().toISOString(),
        }
      }
      return c
    }))
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

      // Add AI response to conversation
      setConversations(prev => prev.map(c => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...c.messages, aiMsg],
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }))
    } catch (e: any) {
      toast.error(e.message)
      setConversations(prev => prev.map(c => {
        if (c.id === currentId) {
          return {
            ...c,
            messages: [...c.messages, {
              role: 'assistant' as const,
              content: `عذراً، حدث خطأ: ${e.message}`,
              timestamp: new Date().toISOString(),
            }],
            updatedAt: new Date().toISOString(),
          }
        }
        return c
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Prestige Logo (Red) */}
          <div className="relative flex-shrink-0">
            <PrestigeLogo size={48} />
            <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-[#00C853] border-2 border-black" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{t('aiAssistant')}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles size={10} className="text-[#DC143C]" />
              {t('aiSubtitle')}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* History toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-400 hover:text-white"
            title={lang === 'ar' ? 'المحادثات السابقة' : 'Chat history'}
          >
            <MessageCircle size={18} />
            {conversations.length > 1 && (
              <Badge className="ml-1 bg-[#DC143C]/20 text-[#DC143C] border-[#DC143C]/30 text-[10px] px-1">
                {conversations.length}
              </Badge>
            )}
          </Button>

          {/* New chat */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="text-gray-400 hover:text-white"
            title={lang === 'ar' ? 'محادثة جديدة' : 'New chat'}
          >
            <Plus size={18} />
          </Button>

          {/* Close conversation — returns to dashboard */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseConversation}
            className="text-gray-400 hover:text-[#DC143C]"
            title={lang === 'ar' ? 'إغلاق المحادثة والعودة للوحة التحكم' : 'Close & return to dashboard'}
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* History panel (collapsible) */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="prestige-card mb-3 overflow-hidden"
          >
            <div className="p-3 max-h-60 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-2 px-2">
                {lang === 'ar' ? 'المحادثات السابقة' : 'Previous conversations'}
              </p>
              <div className="space-y-1">
                {[...conversations].reverse().map(conv => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer group ${
                      conv.id === activeId ? 'bg-[#DC143C]/15' : 'hover:bg-white/5'
                    }`}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <MessageCircle size={14} className="text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{conv.title}</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(conv.updatedAt).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                        {' · '}
                        {conv.messages.length} {lang === 'ar' ? 'رسالة' : 'msgs'}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id) }}
                      className="p-1 text-gray-500 hover:text-[#DC143C] opacity-0 group-hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div className="flex-1 prestige-card overflow-hidden flex flex-col">
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
                  {/* Avatar */}
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

        {/* Quick suggestions — only show on first message */}
        {messages.length <= 1 && !loading && (
          <div className="border-t border-white/5 p-3 bg-black/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-[#FF9100]" />
              <p className="text-xs text-gray-400">{lang === 'ar' ? 'اقتراحات سريعة' : 'Quick suggestions'}</p>
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

        {/* Input — ALWAYS visible at the bottom */}
        <div className="border-t border-white/5 p-3 bg-black/30">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t('typeQuestion')}
              disabled={loading}
              className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-gray-600 flex-1"
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
            {lang === 'ar'
              ? '💾 المحادثة مستمرة — اكتب سؤالك التالي مباشرة. اضغط ✕ للعودة للوحة التحكم'
              : '💾 Conversation continues — type your next question. Press ✕ to return to dashboard'}
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
