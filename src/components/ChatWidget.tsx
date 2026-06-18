import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Bot, Loader2, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import { chatbotService, type ChatMessagePayload } from '../services/chatbot.service';
import './ChatWidget.css';

type ChatMessage = ChatMessagePayload & {
  id: string;
  poweredBy?: string;
  sources?: string[];
};

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào, mình là trợ lý VinFast AI. Mình có thể tư vấn xe, phiên bản, màu sắc, tồn kho, đặt cọc, lái thử và bảo dưỡng.',
};

const DEFAULT_ERROR_REPLY = 'Mình chưa có thông tin trong hệ thống để trả lời câu này. Anh/chị vui lòng liên hệ nhân viên tư vấn để được hỗ trợ chính xác hơn.';
const INITIAL_LOADING_TEXT = 'Đang kiểm tra dữ liệu...';
const SLOW_LOADING_TEXT = 'Mình đang kiểm tra thêm dữ liệu, anh/chị chờ một chút nhé...';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(INITIAL_LOADING_TEXT);
  const [error, setError] = useState<string | null>(null);
  const [privacyNotice, setPrivacyNotice] = useState('Không nhập mật khẩu, OTP, CCCD hoặc thông tin thẻ.');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasUserMessage = messages.some((message) => message.role === 'user');

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingText(INITIAL_LOADING_TEXT);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setLoadingText(SLOW_LOADING_TEXT);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoadingText(INITIAL_LOADING_TEXT);
    setLoading(true);

    try {
      const history = nextMessages
        .filter((item) => item.id !== WELCOME_MESSAGE.id)
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));
      const response = await chatbotService.sendMessage(trimmed, history);
      const chatbotData = response.data;
      setPrivacyNotice(chatbotData?.privacyNotice || privacyNotice);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: chatbotData?.reply || DEFAULT_ERROR_REPLY,
          poweredBy: chatbotData?.poweredBy,
          sources: chatbotData?.sources,
        },
      ]);
    } catch {
      setError(null);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: DEFAULT_ERROR_REPLY,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className={`chat-widget${open ? ' chat-widget--open' : ''}`}>
      {open && (
        <section className="chat-widget__panel" aria-label="Chatbot tư vấn VinFast">
          <header className="chat-widget__header">
            <div className="chat-widget__title">
              <span className="chat-widget__avatar"><Bot size={18} /></span>
              <div>
                <strong>VinFast AI</strong>
                <span>Tư vấn tự động</span>
              </div>
            </div>
            <button className="chat-widget__close" type="button" onClick={() => setOpen(false)} aria-label="Đóng chatbot">
              <X size={18} />
            </button>
          </header>

          <div className="chat-widget__privacy">
            <ShieldCheck size={14} />
            <span>{privacyNotice}</span>
          </div>

          <div className="chat-widget__messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-widget__message chat-widget__message--${message.role}`}>
                {message.content}
                {message.role === 'assistant' && message.sources?.includes('gemini') && (
                  <span className="chat-widget__message-meta">
                    Gemini AI dang ho tro tra loi
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-widget__message chat-widget__message--assistant chat-widget__message--typing">
                <Loader2 size={14} />
                {loadingText}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className="chat-widget__error">{error}</div>}

          {!hasUserMessage && (
          <div className="chat-widget__suggestions">
            {['VF 8 có mấy phiên bản?', 'Xe nào dưới 1 tỷ?', 'Đặt cọc cần làm gì?'].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
          )}

          <div className="chat-widget__input-row">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi về xe, màu, giá, đặt cọc..."
              rows={1}
              maxLength={1200}
            />
            <button type="button" onClick={() => void sendMessage()} disabled={!input.trim() || loading} aria-label="Gửi tin nhắn">
              {loading ? <Loader2 className="chat-widget__loading-icon" size={18} /> : <Send size={18} />}
            </button>
          </div>
        </section>
      )}

      <button className="chat-widget__fab" type="button" onClick={() => setOpen((value) => !value)} aria-label="Mở chatbot tư vấn">
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
