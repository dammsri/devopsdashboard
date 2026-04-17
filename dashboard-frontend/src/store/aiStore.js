import { create } from 'zustand';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true,
});

export const useAIStore = create((set, get) => ({
  messages: [],
  isChatOpen: false,
  isLoading: false,
  thinkingTime: 0,
  insights: [],
  
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  fetchInsights: async () => {
    try {
      const response = await api.get('/ai/insights');
      set({ insights: response.data.insights });
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    }
  },
  
  sendMessage: async (text) => {
    const { messages } = get();
    const newUserMessage = { role: 'human', content: text };
    
    set((state) => ({ 
      messages: [...state.messages, newUserMessage],
      isLoading: true,
      thinkingTime: 0
    }));
    
    let timerInterval = setInterval(() => {
      set((state) => ({ thinkingTime: state.thinkingTime + 0.1 }));
    }, 100);
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.__ACCESS_TOKEN__}`
        },
        body: JSON.stringify({
          message: text,
          history: messages // messages already contains human msg, but sliced is better
        })
      });
      
      if (!response.ok) {
        if (timerInterval) clearInterval(timerInterval);
        const errorData = await response.json().catch(() => ({}));
        set((state) => ({
          messages: [...state.messages, { 
            role: 'ai', 
            content: `**Error:** Failed to connect to AI Service (${response.status}). ${JSON.stringify(errorData.detail || '')}` 
          }],
          isLoading: false,
          thinkingTime: 0
        }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiResponseContent = '';
      let firstChunkReceived = false;
      
      const aiMessagePlaceholder = { role: 'ai', content: '', totalTime: 0 };
      set((state) => ({ messages: [...state.messages, aiMessagePlaceholder] }));
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (timerInterval) clearInterval(timerInterval);
          break;
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                if (timerInterval) clearInterval(timerInterval);
                set((state) => {
                  const newMessages = [...state.messages];
                  if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1].content = `**Error:** ${data.error}`;
                  }
                  return { messages: newMessages, isLoading: false, thinkingTime: 0 };
                });
                return;
              }

              // Check for content or chunks specifically
              if (data.content !== undefined && data.content !== null) {
                console.log('AI Token:', data.content);
                aiResponseContent += data.content;
                let finalThinkingTime = 0;
                let stopTimer = false;

                if (!firstChunkReceived) {
                  // We only stop the "Thinking" state once we get any content
                  // OR if the stream starts generating. 
                  firstChunkReceived = true;
                  if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    finalThinkingTime = get().thinkingTime;
                    stopTimer = true;
                  }
                }

                set((state) => {
                  const newMessages = [...state.messages];
                  if (newMessages.length > 0) {
                    const lastIdx = newMessages.length - 1;
                    // CLONE THE OBJECT to ensure React detects the change
                    newMessages[lastIdx] = { 
                      ...newMessages[lastIdx], 
                      content: aiResponseContent,
                      totalTime: stopTimer ? finalThinkingTime : newMessages[lastIdx].totalTime
                    };
                  }
                  return { 
                    messages: newMessages, 
                    thinkingTime: stopTimer ? 0 : state.thinkingTime 
                  };
                });
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      if (timerInterval) clearInterval(timerInterval);
      console.error('Failed to send AI message:', error);
      set((state) => ({ 
        messages: [...state.messages, { role: 'ai', content: 'Sorry, I encountered an error. Please check the backend connection.' }]
      }));
    } finally {
      if (timerInterval) clearInterval(timerInterval);
      set({ isLoading: false, thinkingTime: 0 });
    }
  },
  
  executeAction: async (action, rationale, payload) => {
    try {
      const response = await api.post('/ai/execute', { action, rationale, payload });
      return response.data;
    } catch (error) {
      console.error('Failed to execute AI action:', error);
      throw error;
    }
  }
}));
