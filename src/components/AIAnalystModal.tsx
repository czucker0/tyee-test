import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Fish,
  Send,
  Loader2,
  X,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  FileText,
  HelpCircle,
  Waves,
} from 'lucide-react';
import { ProjectionModelResult, TributaryEscapement } from '../types/steelhead';
import { requestFisheryAnalysis, askFisheryBiologist } from '../api/gemini';

interface AIAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  projection: ProjectionModelResult;
  tributaries: TributaryEscapement[];
  selectedMonthDay: string;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  isOpen,
  onClose,
  projection,
  tributaries,
  selectedMonthDay,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');
  const [report, setReport] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Chat states
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `*Splashes tailfin* Greetings, two-legger! I'm Steelie Dan, a 38-inch wild Skeena summer steelhead. As of ${selectedMonthDay}, our run is pushing a cumulative Tyee index of ${projection.currentCumulative.toFixed(1)} points (~${projection.projectedBaselineAdults.toLocaleString()} of my wild chromer brothers & sisters projected this season!). We are tracking in the ${projection.conservationTier.toUpperCase()} tier! What do you want to ask a real Skeena steelhead?`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);

  // Load report when opened if empty or on date change
  const fetchReport = async () => {
    setIsLoadingReport(true);
    try {
      const res = await requestFisheryAnalysis({
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
      });
      setReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report && activeTab === 'report') {
      fetchReport();
    }
  }, [isOpen, selectedMonthDay, activeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

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
          text: '*Splashing bubbles* Looks like the communications current got tangled in the weedlines! Ask me again in a second.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const promptSuggestions = [
    'What fly patterns do you actually look at in clear vs glacial water?',
    'What is the best Spey casting tip for casting into an upstream wind?',
    'Why do you travel up to the Babine and Kispiox rivers?',
    'Explain the physics of a Skagit head and sink tip from a fish perspective',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl max-w-3xl w-full h-[85vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm border border-amber-400/30 shrink-0">
              <Fish className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-heading font-black text-[var(--text-main)] flex items-center gap-2 tracking-wide uppercase truncate">
                <span>Steelie Dan</span>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-amber)] normal-case tracking-normal px-2 py-0.5 rounded-full bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)]">
                  The AI Steelhead
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">
                Skeena River wisdom, live Tyee escapement telemetry &amp; fish Q&amp;A
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tabs */}
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-main)] p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2.5 sm:px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('report');
                  if (!report) fetchReport();
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'report'
                    ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dispatch</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Interactive Q&A Chat with Steely Dan */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-card)]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <Fish className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-[var(--accent-amber)] text-white font-medium rounded-tr-none shadow-sm'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] rounded-tl-none whitespace-pre-line shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isAsking && (
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] p-2 font-mono">
                  <Loader2 className="w-4 h-4 text-[var(--accent-amber)] animate-spin" />
                  <span>Steelie Dan is flicking his dorsal fin and consulting the currents...</span>
                </div>
              )}
            </div>

            {/* Prompt Suggestions */}
            <div className="px-3 sm:px-4 py-2 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] overflow-x-auto">
              <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap font-mono">
                <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1">
                  <Waves className="w-3 h-3 text-[var(--accent-amber)]" /> Ask Steelie:
                </span>
                {promptSuggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 rounded-full bg-[var(--bg-card)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition"
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
                placeholder="Ask Steelie Dan about run sizes, water temp, flies, or river secrets..."
                className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-amber)] transition font-mono"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuestion.trim() || isAsking}
                className="p-2.5 rounded-xl bg-[var(--accent-amber)] hover:opacity-90 disabled:opacity-40 text-white font-bold transition shadow-sm"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Comprehensive River Dispatch Report */}
        {activeTab === 'report' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-card)]">
            {/* Report Toolbar */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] text-xs font-mono">
              <span className="text-[var(--text-secondary)]">
                Evaluated for: <strong className="text-[var(--accent-amber)]">{selectedMonthDay}</strong> ({projection.percentElapsedHistorical}% complete)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchReport}
                  disabled={isLoadingReport}
                  className="px-2.5 py-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingReport ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-main)] border border-[var(--border-main)] transition flex items-center gap-1"
                >
                  {hasCopied ? <Check className="w-3 h-3 text-[var(--accent-spruce)]" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {isLoadingReport ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-[var(--text-muted)] font-mono">
                  <Loader2 className="w-8 h-8 text-[var(--accent-amber)] animate-spin" />
                  <p className="text-xs">Steelie Dan is assembling the river escapement telemetry dispatch...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-[var(--text-main)] leading-relaxed space-y-3">
                  <div className="whitespace-pre-line text-xs sm:text-sm font-sans bg-[var(--bg-surface)] border border-[var(--border-main)] p-4 rounded-xl leading-relaxed shadow-sm">
                    {report}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
