import React, { useState } from 'react';
import {
  Fish,
  Send,
  Loader2,
  Waves,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { ProjectionModelResult, TributaryEscapement } from '../types/steelhead';
import { askFisheryBiologist } from '../api/gemini';

interface SteelieDanChatCardProps {
  projection: ProjectionModelResult;
  tributaries: TributaryEscapement[];
  selectedMonthDay: string;
}

export const SteelieDanChatCard: React.FC<SteelieDanChatCardProps> = ({
  projection,
  tributaries,
  selectedMonthDay,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `*Splashes tailfin and flashes bright chrome scales!*

Greetings, two-legger! I'm **Steelie Dan**, a 38-inch wild Skeena summer-run steelhead, certified Spey snob, and connoisseur of swinging delicious tube flies!

As of **${selectedMonthDay}**, our run is pushing a cumulative Tyee index of **${projection.currentCumulative.toFixed(1)} points** (~${projection.projectedBaselineAdults.toLocaleString()} wild chromers projected this season in the **${projection.conservationTier.toUpperCase()}** tier!). 

What do you want to ask a real Skeena steelhead? Ask me about irresistible tube flies, why I can't stand bobber nymphing, Spey casting tips, or how we dodge the Tyee nets!`,
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);

  const promptSuggestions = [
    'Why can’t you resist a swinging tube fly?',
    'What do you honestly think of indicator nymphing?',
    'What is your favorite tube fly recipe?',
    'How are you dodging the Tyee test nets this year?',
    'What is your best Spey casting tip?',
    'Are you heading for the Babine, Kispiox, or Bulkley?',
  ];

  const handleSendMessage = async (customPrompt?: string) => {
    const q = customPrompt || inputQuestion.trim();
    if (!q || isAsking) return;

    const newMessages = [...messages, { role: 'user' as const, text: q }];
    setMessages(newMessages);
    setInputQuestion('');
    setIsAsking(true);

    try {
      const answer = await askFisheryBiologist(
        q,
        {
          selectedDate: selectedMonthDay,
          dayIndex: projection.dayIndex,
          percentElapsed: projection.percentElapsedHistorical,
          currentCumulative: projection.currentCumulative,
          projectedBaselineIndex: projection.projectedBaselineIndex,
          projectedBaselineAdults: projection.projectedBaselineAdults,
          projectedLowCI: projection.projectedLowCI,
          projectedHighCI: projection.projectedHighCI,
          bestFitYear: projection.bestFitAnalogYear,
          conservationTier: projection.conservationTier,
          tributaries,
        },
        newMessages
      );

      setMessages([...newMessages, { role: 'assistant', text: answer }]);
    } catch (e) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: '*Splashing bubbles* Looks like the communication current got tangled in the weedline! Ask me again in a moment, two-legger.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: `*Flicks dorsal fin in the Skeena current* Fresh start! I am resting in a nice deep tailout below the canyon as of **${selectedMonthDay}**. What's on your mind?`,
      },
    ]);
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[700px] max-h-[80vh] transition-colors duration-200">
      {/* Top Header Banner */}
      <div className="px-5 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-md border border-amber-400/30 shrink-0">
            <Fish className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-heading font-black text-[var(--text-main)] uppercase tracking-wider truncate">
                Steelie Dan &bull; The AI Wild Steelhead
              </h2>
              <span className="stamp-badge stamp-amber font-mono text-[10px] px-2 py-0.5">
                <Sparkles className="w-2.5 h-2.5 text-[var(--accent-amber)]" />
                Live AI
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono truncate mt-0.5">
              Live from the Skeena mainstem &bull; Evaluated as of {selectedMonthDay}, 2026
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="Reset conversation"
          className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition text-xs font-mono flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg-card)]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-amber-400/20">
                <Fish className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--accent-amber)] text-white font-medium rounded-tr-none shadow-sm'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] rounded-tl-none whitespace-pre-line shadow-xs font-sans'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isAsking && (
          <div className="flex items-center gap-2.5 text-xs text-[var(--text-muted)] p-3 font-mono bg-[var(--bg-surface)]/60 rounded-xl border border-[var(--border-main)] w-fit animate-pulse">
            <Loader2 className="w-4 h-4 text-[var(--accent-amber)] animate-spin" />
            <span>Steelie Dan is flicking his dorsal fin and consulting the river currents...</span>
          </div>
        )}
      </div>

      {/* Prompt Suggestions Toolbar */}
      <div className="px-4 py-2.5 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap font-mono">
          <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1 pr-1 shrink-0">
            <Waves className="w-3.5 h-3.5 text-[var(--accent-amber)]" /> Ask Steelie:
          </span>
          {promptSuggestions.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition shrink-0 font-medium hover:border-[var(--accent-amber-border)]"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 border-t border-[var(--border-main)] bg-[var(--bg-surface)] flex items-center gap-2">
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Ask Steelie Dan about run sizes, water temp, flies, test nets, or river secrets..."
          className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-amber)] focus:ring-1 focus:ring-[var(--accent-amber)] transition font-sans"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputQuestion.trim() || isAsking}
          className="px-4 py-2.5 rounded-xl bg-[var(--accent-amber)] hover:opacity-90 disabled:opacity-40 text-white font-bold transition shadow-sm flex items-center gap-2 text-xs font-mono"
        >
          {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          <span className="hidden sm:inline">Ask Steelie</span>
        </button>
      </div>
    </div>
  );
};
