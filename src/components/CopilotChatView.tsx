import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Target,
  Users,
  ShieldCheck,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { IcpCampaign, Lead, ChatMessage } from '../types';

interface CopilotChatViewProps {
  activeCampaign: IcpCampaign;
  totalLeadsCount: number;
  qualifiedCount: number;
  selectedLead?: Lead | null;
  onNavigate?: (tab: any) => void;
  isDrawer?: boolean;
  onCloseDrawer?: () => void;
}

export const CopilotChatView: React.FC<CopilotChatViewProps> = ({
  activeCampaign,
  totalLeadsCount,
  qualifiedCount,
  selectedLead,
  onNavigate,
  isDrawer = false,
  onCloseDrawer,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('propelmatch_copilot_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Hello! I'm your **PropelMatch AI Copilot**.\n\nI have live context of your active campaign **${activeCampaign.name}** (${qualifiedCount} qualified leads out of ${totalLeadsCount} total accounts).\n\nAsk me anything about refining your ICP scoring weights, analyzing why leads qualified or got excluded, drafting hyper-targeted outbound copy, or diagnosing pipeline conversion!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('propelmatch_copilot_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const quickPrompts = [
    {
      label: 'Improve ICP scoring weights',
      text: `How can I adjust the 0-100 scoring weights in "${activeCampaign.name}" to prioritize companies with over ${activeCampaign.minEmployees} employees and IT executive roles?`,
    },
    {
      label: 'Draft cold outreach hook',
      text: `Draft a 3-paragraph cold outbound email tailored for ${activeCampaign.targetJobTitles.slice(0, 2).join(' and ')} at companies in ${activeCampaign.targetIndustries.slice(0, 2).join(', ')}.`,
    },
    {
      label: 'Explain exclusion rules',
      text: `Explain the deterministic rules that cause leads to be classified as "Excluded by Rule" vs "Low Priority".`,
    },
    {
      label: 'B2B objection rebuttals',
      text: `What are 3 hard objection rebuttals when enterprise ${activeCampaign.targetJobTitles[0] || 'IT directors'} say "We already have a contact database"?`,
    },
  ];

  const handleSendMessage = async (userText: string) => {
    const textToSend = userText.trim();
    if (!textToSend || isSending) return;

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: newMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          context: {
            activeCampaign,
            leadsCount: totalLeadsCount,
            qualifiedCount,
            selectedLead: selectedLead
              ? {
                  fullName: selectedLead.fullName,
                  jobTitle: selectedLead.jobTitle,
                  companyName: selectedLead.companyName,
                  qualificationScore: selectedLead.qualificationScore,
                }
              : null,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive Copilot response.');
      }

      const botMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Error contacting Copilot:', err);
      const fallbackReply = generateClientFallbackReply(textToSend, activeCampaign, qualifiedCount, totalLeadsCount);
      const botMessage: ChatMessage = {
        id: `msg_a_fallback_${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    const reset = [
      {
        id: `msg_reset_${Date.now()}`,
        sender: 'assistant' as const,
        text: `Chat cleared. Ready with context for active campaign **${activeCampaign.name}**! How can I assist you right now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(reset);
    localStorage.removeItem('propelmatch_copilot_chat_history');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMessageText = (text: string) => {
    // Process markdown headers and bolding nicely
    return text.split('\n\n').map((paragraph, pIdx) => {
      // Check for bullet lists
      if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter((l) => l.trim().startsWith('- '));
        return (
          <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
            {items.map((it, iIdx) => (
              <li key={iIdx} className="text-slate-700 leading-relaxed">
                {renderInlineFormatting(it.replace(/^- /, ''))}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={pIdx} className="leading-relaxed mb-2 last:mb-0 text-slate-700">
          {renderInlineFormatting(paragraph)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (line: string) => {
    // Basic bold **text** parsing
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${isDrawer ? 'max-w-xl w-full border-l border-slate-200' : 'p-6'}`}>
      {/* Top Header Card */}
      <div className={`bg-white border-b border-slate-200 ${isDrawer ? 'p-4' : 'rounded-t-xl p-5 shadow-sm'} shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">PropelMatch AI Copilot</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Grounding & Strategy Advisor with Live ICP Pipeline Context
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1 border border-slate-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>

            {isDrawer && onCloseDrawer && (
              <button
                onClick={onCloseDrawer}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs border border-slate-200"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Live ICP Banner Context */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-slate-500 truncate">
              Active ICP: <strong className="text-slate-800">{activeCampaign.name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-slate-500 truncate">
              Qualified: <strong className="text-emerald-700">{qualifiedCount}</strong> / {totalLeadsCount} accounts
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-slate-500 truncate">
              Criteria: <strong className="text-slate-800">{activeCampaign.minEmployees}+ staff</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-indigo-400 shadow-sm'
                }`}
              >
                {isUser ? 'You' : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>
                    {formatMessageText(msg.text)}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => handleCopyText(msg.text, msg.id)}
                        className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm text-sm text-slate-500 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs">Analyzing ICP criteria and generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2 border-t border-slate-200 bg-white/70">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Strategy Starters:</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p.text)}
              disabled={isSending}
              className="text-xs bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-4 bg-white border-t border-slate-200 ${isDrawer ? '' : 'rounded-b-xl'}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputMessage);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }
            }}
            placeholder={`Ask Copilot about "${activeCampaign.name}" or paste lead details...`}
            disabled={isSending}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm shadow-indigo-600/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="text-[11px] text-slate-400 text-center mt-2">
          PropelMatch Copilot synthesizes deterministic scoring rules with verified search grounding.
        </p>
      </div>
    </div>
  );
};

// Client-side rule-based fallback assistant in case of network issue
function generateClientFallbackReply(
  prompt: string,
  campaign: IcpCampaign,
  qualifiedCount: number,
  totalLeadsCount: number
): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('score') || lower.includes('weight')) {
    return `In your active campaign **${campaign.name}**, the 0–100 deterministic scoring engine allocates:\n- **Company Fit**: ${campaign.weights.companyFit} points (checks headcount >= ${campaign.minEmployees} and revenue).\n- **Job Title & Seniority**: ${campaign.weights.titleSeniority} points (checks target titles like ${campaign.targetJobTitles.slice(0, 2).join(', ')}).\n- **Industry Fit**: ${campaign.weights.industryFit} points (${campaign.targetIndustries.slice(0, 2).join(', ')}).\n- **Evidence Quality**: ${campaign.weights.evidenceQuality} points (direct press or search citations).\n- **Geography Fit**: ${campaign.weights.geographyFit} points.\n\nLeads matching excluded roles (${campaign.excludedRoles.join(', ')}) immediately receive a score of 0 and the "Excluded by Rule" status.`;
  }

  if (lower.includes('outreach') || lower.includes('hook') || lower.includes('email')) {
    return `Here is a high-converting cold outreach framework for **${campaign.targetJobTitles[0] || 'IT Executives'}**:\n\n**Subject Line**: ${campaign.targetIndustries[0] || 'Enterprise'} infrastructure benchmark for {{companyName}}\n\n**Paragraph 1**: Hi {{firstName}}, seeing {{companyName}}'s ongoing expansion, balancing infrastructure resilience while optimizing tech stack overhead is usually top-of-mind.\n\n**Paragraph 2**: We work with ${campaign.minEmployees}+ employee organizations to streamline qualification and workflow transparency using deterministic scoring.\n\n**Paragraph 3 (Soft CTA)**: Would you be open to an introductory 10-minute briefing next Tuesday to compare notes?`;
  }

  if (lower.includes('objection') || lower.includes('rebuttal')) {
    return `Here are 3 battle-tested objection rebuttals for your ICP:\n\n1. **"We already have a lead database"**\n*Rebuttal*: "Static databases decay 30% annually. PropelMatch grounds every discovery in real-time web citations and scores contacts against your unique ICP rules."\n\n2. **"We don't have time to adopt another tool"**\n*Rebuttal*: "You can import existing CSV files in 3 clicks with auto-column mapping and export scored leads directly back to your CRM."\n\n3. **"Are these emails and titles verified?"**\n*Rebuttal*: "We clearly flag directly verified evidence versus inferred facts, and never fabricate verification statuses."`;
  }

  return `I have evaluated your request against active campaign **${campaign.name}** (${qualifiedCount} qualified out of ${totalLeadsCount} leads). For best results, use the **Outreach Generator** tab for personalized multi-channel drafts or the **Marketing Studio** tab for exact positioning packs!`;
}
