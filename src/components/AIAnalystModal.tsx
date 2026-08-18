import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  X,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  FileText,
  HelpCircle,
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
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');
  const [report, setReport] = useState<string>('');
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Chat states
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Greetings. I am your Skeena River Field Station Biologist. As of ${selectedMonthDay}, the 2026 run is indexing at ${projection.currentCumulative.toFixed(1)} points with a projected total escapement of ~${projection.projectedBaselineAdults.toLocaleString()} adult wild steelhead (${projection.conservationTier} tier). How can I assist your fishery analysis today?`,
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
    if (isOpen && !report) {
      fetchReport();
    }
  }, [isOpen, selectedMonthDay]);

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
      const answer = await askFisheryBiologist(q, {
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

      setMessages([...newMessages, { role: 'assistant', text: answer }]);
    } catch (e) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: 'Unable to connect to the fishery analysis engine at this moment. Please try again.',
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const promptSuggestions = [
    'How does 2026 compare to the 2021 crisis year and 2018 record year?',
    'What are the expected run sizes for the Babine and Kispiox rivers?',
    'How does water temperature affect the summer steelhead migration past Tyee?',
    'What in-season conservation triggers apply to Skeena recreational fishing?',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl max-w-3xl w-full h-[85vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden text-[var(--text-main)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-main)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--accent-amber-light)] text-[var(--accent-amber)] border border-[var(--accent-amber-border)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-heading font-extrabold text-[var(--text-main)] flex items-center gap-2">
                <span>AI Skeena Fishery Biologist</span>
                <span className="stamp-badge stamp-amber font-mono text-[10px]">
                  Gemini 3.7 Flash
                </span>
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-mono">
                In-season escapement appraisal & interactive biological consultation as of {selectedMonthDay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-main)] p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'report'
                    ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-[var(--accent-amber)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Q&A Chat</span>
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

        {/* Tab 1: Comprehensive Report */}
        {activeTab === 'report' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-card)]">
            {/* Report Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-[var(--border-main)] bg-[var(--bg-subtle)] text-xs font-mono">
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
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {isLoadingReport ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-[var(--text-muted)] font-mono">
                  <Loader2 className="w-8 h-8 text-[var(--accent-amber)] animate-spin" />
                  <p className="text-xs">Analyzing Skeena Tyee Test Fishery telemetry & fitting run curves...</p>
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

        {/* Tab 2: Interactive Q&A Chat */}
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
                    <div className="w-7 h-7 rounded-lg bg-[var(--accent-amber-light)] border border-[var(--accent-amber-border)] flex items-center justify-center text-[var(--accent-amber)] flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
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
                  <span>Biologist analyzing Skeena telemetry and historical run curves...</span>
                </div>
              )}
            </div>

            {/* Prompt Suggestions */}
            <div className="px-4 py-2 border-t border-[var(--border-main)] bg-[var(--bg-subtle)] overflow-x-auto">
              <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap font-mono">
                <span className="text-[var(--text-muted)] font-semibold flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-[var(--accent-amber)]" /> Ask:
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
                placeholder="Ask about Skeena steelhead migration, Tyee index, tributaries, water temps..."
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
      </div>
    </div>
  );
};
