"use client";

import React, { useState, useEffect } from "react";
import { 
  DownloadCloud, X, CheckSquare, Square, 
  Key, Phone, Sparkles, Check, AlertCircle, 
  Loader2, Copy, CheckCheck, RefreshCw, Bot
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://kasauti-api.onrender.com";

export interface BolnaAgentItem {
  id: string;
  name: string;
  welcome_message?: string | null;
  agent_type?: string | null;
  inbound_phone_number?: string | null;
  languages: string[];
  updated_at?: string | null;
}

interface ImportBolnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const ImportBolnaModal: React.FC<ImportBolnaModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+919019823296");
  const [agents, setAgents] = useState<BolnaAgentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("kasauti_bolna_api_key");
      const savedPhone = localStorage.getItem("kasauti_bolna_phone");
      if (savedKey) setApiKey(savedKey);
      if (savedPhone) setPhoneNumber(savedPhone);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFetchAgents = async () => {
    setFetching(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE}/targets/fetch-bolna-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey.trim() || null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server responded with status ${res.status}`);
      }

      const data: BolnaAgentItem[] = await res.json();
      setAgents(data);
      setSelectedIds(data.map((a) => a.id));
      if (typeof window !== "undefined" && apiKey.trim()) {
        localStorage.setItem("kasauti_bolna_api_key", apiKey.trim());
      }
      if (data.length === 0) {
        setErrorMsg("No voice agents found in this Bolna account. Create one at studio.bolna.ai first.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Bolna API";
      setErrorMsg(msg);
    } finally {
      setFetching(false);
    }
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg("Please select at least one agent to import.");
      return;
    }

    setImporting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${API_BASE}/targets/import-bolna-agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey.trim() || null,
          phone_number: phoneNumber.trim() || "+919019823296",
          agent_ids: selectedIds,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Import failed with code ${res.status}`);
      }

      if (typeof window !== "undefined") {
        if (apiKey.trim()) localStorage.setItem("kasauti_bolna_api_key", apiKey.trim());
        if (phoneNumber.trim()) localStorage.setItem("kasauti_bolna_phone", phoneNumber.trim());
      }

      setSuccessMsg(`Successfully imported ${selectedIds.length} Bolna agent(s) into Kasauti!`);
      if (onImportSuccess) {
        onImportSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to import selected agents";
      setErrorMsg(msg);
    } finally {
      setImporting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === agents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(agents.map((a) => a.id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border-3 border-black rounded-2xl shadow-[8px_8px_0px_#000000] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-brutal-pink border-b-3 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
              <DownloadCloud className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase text-black font-display tracking-tight flex items-center gap-2">
                Import Bolna Agents
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brutal-yellow text-black border border-black shadow-[1px_1px_0px_#000]">
                  Live Sync
                </span>
              </h2>
              <p className="text-xs font-semibold text-black/80">
                Connect your Bolna account to evaluate any private or production agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center font-black text-sm hover:bg-neutral-100 shadow-[1.5px_1.5px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            <X className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto bg-[#faf9f5]">
          {/* Account Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              Bolna API Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="bn-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (or leave blank for system account)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
              />
            </div>
            <p className="text-[11px] font-semibold text-gray-600">
              Paste your key from{" "}
              <a
                href="https://studio.bolna.ai/developer"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-black hover:text-brutal-pink"
              >
                studio.bolna.ai/developer
              </a>
              . If left blank, Kasauti uses the pre-configured platform account.
            </p>
          </div>

          {/* Test Phone Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wide text-black flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              Recipient Dial Phone Number
            </label>
            <input
              type="text"
              placeholder="+919019823296"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-black text-black text-xs font-mono font-bold shadow-[2px_2px_0px_#000] focus:outline-none focus:bg-yellow-50"
            />
            <p className="text-[11px] font-semibold text-gray-600">
              The phone number Kasauti dials when benchmarking your imported agent scenarios.
            </p>
          </div>

          {/* Fetch Agents Trigger */}
          <div className="pt-1">
            <button
              onClick={handleFetchAgents}
              disabled={fetching}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-50 text-black border-2 border-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {fetching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Connecting to Bolna Cloud...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>Fetch Agents From Account</span>
                </>
              )}
            </button>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 bg-red-100 border-2 border-black rounded-xl text-xs font-bold text-red-900 flex items-start gap-2 shadow-[2px_2px_0px_#000]">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-100 border-2 border-black rounded-xl text-xs font-bold text-emerald-900 flex items-start gap-2 shadow-[2px_2px_0px_#000]">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 stroke-[3]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Agent Selection List */}
          {agents.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-black">
                  Found {agents.length} Agent{agents.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs font-bold text-black underline hover:text-brutal-pink cursor-pointer"
                >
                  {selectedIds.length === agents.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {agents.map((agent) => {
                  const isSelected = selectedIds.includes(agent.id);
                  return (
                    <div
                      key={agent.id}
                      onClick={() => toggleSelect(agent.id)}
                      className={`p-3 rounded-xl border-2 border-black cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? "bg-yellow-100 border-black shadow-[2px_2px_0px_#000]"
                          : "bg-white hover:bg-gray-50 border-gray-400"
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-black focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(agent.id);
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 fill-black text-white" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-xs uppercase text-black truncate">
                            {agent.name}
                          </h4>
                          {agent.agent_type && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-white border border-black shadow-[1px_1px_0px_#000] shrink-0">
                              {agent.agent_type}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono font-bold text-gray-600 truncate">
                            ID: {agent.id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(agent.id);
                            }}
                            className="text-gray-500 hover:text-black"
                            title="Copy ID"
                          >
                            {copiedId === agent.id ? (
                              <CheckCheck className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {agent.welcome_message && (
                          <p className="mt-1 text-[11px] text-gray-700 italic line-clamp-1">
                            &ldquo;{agent.welcome_message}&rdquo;
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1">
                          {agent.languages.map((l) => (
                            <span
                              key={l}
                              className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-white border border-black shadow-[1px_1px_0px_#000]"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t-2 border-black flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border-2 border-black text-black font-black text-xs uppercase hover:bg-gray-100 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleImport}
            disabled={importing || agents.length === 0 || selectedIds.length === 0}
            className={`px-5 py-2.5 rounded-xl border-2 border-black text-black font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 ${
              importing || agents.length === 0 || selectedIds.length === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
                : "bg-brutal-yellow hover:bg-yellow-300"
            }`}
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Importing Targets...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 text-black" />
                <span>Import {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} Agents</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

