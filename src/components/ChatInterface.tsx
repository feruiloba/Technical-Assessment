import React, { useState, useRef, useEffect } from 'react';
import { chatApi, EffectInput, Effect } from '../api';

interface ChatInterfaceProps {
  onAddEffect: (effect: EffectInput) => Promise<void>;
  onRemoveEffect: (effectId: string) => Promise<void>;
  effects: Effect[];
  videoDuration: number;
  getCurrentTime: () => number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAddEffect, onRemoveEffect, effects, videoDuration, getCurrentTime }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const currentTime = getCurrentTime();
      const response = await chatApi.processCommand(userMessage.text, videoDuration, currentTime);
      
      let responseText = '';
      const commands = response.commands;

      if (commands.length === 0) {
        responseText = "I couldn't find any actions to perform in your request.";
      } else {
        const results: string[] = [];
        
        for (const command of commands) {
          if (command.action === 'delete') {
            // Handle deletion
            const typeToDelete = command.type;
            let deletedCount = 0;

            // Find effects to delete
            const effectsToDelete = effects.filter(e => {
              // Check type match
              if (typeToDelete !== 'all' && e.type !== typeToDelete) return false;
              
              // Check time match if specified
              // Special case: for "delete all", if the backend sends a start_time that matches current time (default behavior),
              // we might want to ignore it unless we are sure the user meant "delete all starting now".
              // But relying on the backend to be correct is better. 
              // However, to be safe, if type is 'all' and start_time is present, we respect it.
              // The backend prompt fix should handle this, but let's add a safety check:
              // If type is 'all' and the command didn't explicitly ask for a timeframe (hard to know here),
              // we rely on the backend sending undefined for start_time.
              
              if (command.start_time !== undefined) {
                 const cmdStart = command.start_time;
                 const cmdEnd = command.end_time !== undefined ? command.end_time : cmdStart;
                 
                 const effStart = e.start_time;
                 const effEnd = e.end_time < 0 ? Number.MAX_VALUE : e.end_time;
                 
                 const overlapStart = Math.max(cmdStart, effStart);
                 const overlapEnd = Math.min(cmdEnd < 0 ? Number.MAX_VALUE : cmdEnd, effEnd);
                 
                 if (overlapStart > overlapEnd) return false;
              }
              
              return true;
            });

            // Create a copy of the array to avoid issues if effects prop changes during iteration
            // although effects prop won't change until parent re-renders
            const idsToDelete = effectsToDelete.map(e => e.id);

            if (idsToDelete.length === 0) {
              results.push(`No ${typeToDelete === 'all' ? '' : typeToDelete + ' '}effects found to delete${command.start_time !== undefined ? ' in that timeframe' : ''}.`);
            } else {
              for (const id of idsToDelete) {
                await onRemoveEffect(id);
                deletedCount++;
              }
              results.push(`Removed ${deletedCount} ${typeToDelete === 'all' ? '' : typeToDelete + ' '}effect${deletedCount !== 1 ? 's' : ''}.`);
            }
          } else {
            // Handle addition
            const effectInput: EffectInput = {
              type: command.type,
              start_time: command.start_time || 0,
              end_time: command.end_time || -1,
              config: command.config
            };
            
            await onAddEffect(effectInput);
            results.push(`Added ${command.type} effect from ${effectInput.start_time.toFixed(1)}s to ${effectInput.end_time < 0 ? 'end' : effectInput.end_time.toFixed(1) + 's'}.`);
          }
        }
        responseText = results.join(' ');
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: responseText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      let errorText = "Sorry, I couldn't understand that command or apply the effect.";
      if (err instanceof Error) {
        // Clean up common error prefixes if present
        const msg = err.message.replace(/^Error: /, '');
        errorText = `Could not apply effect: ${msg}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: errorText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface glass-panel" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', height: '300px' }}>
      <div className="chat-header" style={{ padding: '15px', borderBottom: '1px solid var(--color-border-solid)' }}>
        <h3 style={{ margin: 0, fontSize: '14px' }}>AI Assistant</h3>
      </div>
      
      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '20px' }}>
            Try asking: "Add blur for 5 seconds" or "Remove all effects"
          </div>
        )}
        {messages.map(msg => (
          <div 
            key={msg.id} 
            style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: '12px',
              fontSize: '13px',
              backgroundColor: msg.role === 'user' ? 'var(--color-accent)' : 'rgba(255,255,255,0.5)',
              color: msg.role === 'user' ? 'white' : 'var(--color-text-primary)',
              border: msg.role === 'assistant' ? '1px solid var(--color-border-solid)' : 'none',
            }}
          >
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '15px', borderTop: '1px solid var(--color-border-solid)', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe an effect..."
          className="glass-input"
          style={{ flex: 1 }}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;