import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RiRobot2Line,
  RiCloseLine,
  RiSendPlane2Fill,
  RiHistoryLine,
  RiInformationLine,
  RiCheckDoubleLine,
  RiHammerLine,
} from 'react-icons/ri';
import { useAIStore } from '../../store/aiStore';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const MessageBubble = ({ message, isLast, thinkingTime }) => {
  const isAi = message.role === 'ai';
  const { executeAction } = useAIStore();
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [isDone, setIsDone] = React.useState(false);

  // Check if message contains a suggested action
  let suggestedAction = null;
  if (isAi && message.content && message.content.includes('"type": "SUGGESTED_ACTION"')) {
    try {
      const parts = message.content.split('Please confirm: ');
      if (parts.length > 1) {
        suggestedAction = JSON.parse(parts[1]);
      }
    } catch (e) {
      console.error("Failed to parse suggested action", e);
    }
  }

  const handleConfirmAction = async () => {
    if (!suggestedAction) return;
    setIsExecuting(true);
    try {
      await executeAction(suggestedAction.action, suggestedAction.rationale, suggestedAction.payload);
      setIsDone(true);
    } catch (e) {
      console.error("Action execution failed", e);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} mb-4`}
    >
      <div
        className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isAi
            ? 'bg-white dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-slate-600/40 shadow-sm'
            : 'bg-brand-600 text-white rounded-tr-none shadow-md shadow-brand-500/20'
          }`}
      >
        {isAi && isLast && !message.content ? (
          <div className="flex items-center gap-2 py-1">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
            </div>
            {thinkingTime > 0 && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider animate-pulse ml-1">
                Thinking {thinkingTime.toFixed(1)}s
              </span>
            )}
          </div>
        ) : (
          <div className={`${isAi ? 'prose prose-slate dark:prose-invert prose-xs max-w-none' : ''}`}>
            {isAi ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  code: ({ node, inline, ...props }) => (
                    inline
                      ? <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-brand-600 dark:text-brand-400 font-bold" {...props} />
                      : <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg my-2 overflow-x-auto border border-slate-700 underline-none font-mono text-xs">
                        <code {...props} />
                      </pre>
                  ),
                  ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  a: ({ node, ...props }) => <a className="text-brand-600 dark:text-brand-400 font-bold hover:underline" {...props} />,
                  h1: ({ node, ...props }) => <h1 className="text-sm font-bold mb-2 border-b border-slate-200 pb-1" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xs font-bold mb-1 mt-3" {...props} />,
                }}
              >
                {suggestedAction
                  ? message.content.split('Please confirm: ')[0]
                  : message.content}
              </ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}

            {suggestedAction && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-brand-500/30">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-xs mb-2">
                  <RiHammerLine size={14} />
                  PROPOSED ACTION
                </div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {suggestedAction.action}: {suggestedAction.target}
                </div>
                <p className="text-[10px] opacity-70 mb-3 italic">
                  Rationale: {suggestedAction.rationale}
                </p>
                <button
                  onClick={handleConfirmAction}
                  disabled={isExecuting || isDone}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isDone
                      ? 'bg-scgreen-500 text-white cursor-default'
                      : 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30'
                    }`}
                >
                  {isExecuting ? 'Executing...' : isDone ? <><RiCheckDoubleLine /> Done</> : 'Confirm Action'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {isAi && message.totalTime > 0 && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-1 font-medium">
          Answered in {message.totalTime.toFixed(1)}s
        </span>
      )}
    </motion.div>
  );
};

const AICopilot = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    messages,
    isChatOpen,
    isLoading,
    thinkingTime,
    toggleChat,
    sendMessage
  } = useAIStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${isChatOpen
            ? 'bg-slate-800 dark:bg-slate-600 text-white'
            : 'bg-gradient-to-br from-brand-600 to-scgreen-500 text-white hover:shadow-brand-500/40 hover:shadow-2xl'
          }`}
      >
        {isChatOpen ? <RiCloseLine size={24} /> : <RiRobot2Line size={28} className="animate-pulse-slow" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden
                       bg-slate-50/90 dark:bg-slate-800/60 backdrop-blur-md 
                       border border-slate-200/60 dark:border-slate-700/50"
          >
            {/* Header — uses the brand gradient */}
            <div className="bg-gradient-to-r from-brand-600 to-scgreen-500 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <RiRobot2Line size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">DevOps Copilot</h3>
                  <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest">AI Powered</p>
                </div>
              </div>
              <div className="flex gap-2">
                <RiHistoryLine className="cursor-pointer hover:opacity-70 transition-opacity" title="History" />
                <RiInformationLine className="cursor-pointer hover:opacity-70 transition-opacity" title="RAG Context" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100/60 dark:bg-slate-900/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                  <RiRobot2Line size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Hello, {user?.full_name?.split(' ')[0]}!</p>
                  <p className="text-xs mt-1">Ask me about your servers, deployments, or cluster status.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <MessageBubble
                    key={idx}
                    message={msg}
                    isLast={idx === messages.length - 1}
                    thinkingTime={thinkingTime}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area — uses form-input styling */}
            <form onSubmit={handleSubmit} className="p-3 flex gap-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200/60 dark:border-slate-700">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask something..."
                className="form-input !rounded-xl !py-2.5 flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className={`p-2.5 rounded-xl transition-all duration-200 ${isLoading || !inputValue.trim()
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                    : 'btn-primary !p-2.5'
                  }`}
              >
                <RiSendPlane2Fill size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AICopilot;
