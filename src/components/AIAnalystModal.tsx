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
      text: `Hello! I am your Skeena River Steelhead Biologist assistant. As of ${selectedMonthDay}, the 2026 run is indexing at ${projection.currentCumulative.toFixed(1)} points with a projected total escapement of ~${projection.projectedBaselineAdults.toLocaleString()} adult steelhead (${projection.conservationTier} tier). How can I assist your fishery analysis today?`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full h-[85vh] max-h-[720px] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/40">
              <Sparkles className="w-5 h-5 text-cyan-200 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <span>AI Skeena Fishery Biologist</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Gemini 3.7 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                In-season escapement appraisal & interactive biological consultation as of {selectedMonthDay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'report'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Q&A Chat</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Comprehensive Report */}
        {activeTab === 'report' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
            {/* Report Toolbar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/50 text-xs">
              <span className="text-slate-400">
                Evaluated for: <strong className="text-cyan-300">{selectedMonthDay}</strong> ({projection.percentElapsedHistorical}% complete)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchReport}
                  disabled={isLoadingReport}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingReport ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1"
                >
                  {hasCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {isLoadingReport ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs">Analyzing Skeena Tyee Test Fishery telemetry & fitting run curves...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-3">
                  <div className="whitespace-pre-line text-xs sm:text-sm font-sans bg-slate-900/80 border border-slate-800/90 p-4 rounded-xl leading-relaxed">
                    {report}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Q&A Chat */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40">
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
                    <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-xl p-3 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isAsking && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Biologist analyzing Skeena telemetry and historical run curves...</span>
                </div>
              )}
            </div>

            {/* Prompt Suggestions */}
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-cyan-400" /> Ask:
                </span>
                {promptSuggestions.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="Ask about Skeena steelhead migration, Tyee index, tributaries, water temps..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuestion.trim() || isAsking}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-slate-950 font-bold transition shadow-md"
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
