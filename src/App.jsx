import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

const CHARACTERS = {
  serious: "真面目系",
  gyaru: "ギャル系",
  cute: "可愛い系",
  ojisan: "おじさん系",
  announcer: "アナウンサー系",
  friend: "友達キャラ",
  light: "ノリ軽いキャラ",
  fan: "ファンキャラ",
  sexy: "セクシーキャラ",
  fresh: "さわやかお兄さん系"
};

const CHARACTER_PROMPTS = {
  serious: "真面目系：丁寧語で告知してください。",
  gyaru: "ギャル系：テンション高めで告知してください。",
  cute: "可愛い系：可愛らしく告知してください。",
  ojisan: "おじさん系：親しみやすく告知してください。",
  announcer: "アナウンサー系：ハキハキと告知してください。",
  friend: "友達キャラ：タメ口で告知してください。",
  light: "ノリ軽いキャラ：軽いノリで告知してください。",
  fan: "ファンキャラ：熱烈に告知してください。",
  sexy: "セクシーキャラ：大人っぽく告知してください。",
  fresh: "さわやかお兄さん系：爽やかに告知してください。"
};

export default function App() {
  const [eventName, setEventName] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [charKey, setCharKey] = useState('serious');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキーが未設定です。' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    const prompt = `イベント名:${eventName}, 詳細:${eventDetails}, 設定:${CHARACTER_PROMPTS[charKey]}。告知文を180文字以内で作成してください。`;

    try {
      const response = await fetch('[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || '通信失敗');
      setResult(data.candidates[0].content.parts[0].text.trim());
    } catch (e) {
      setMessage({ type: 'error', text: '生成失敗: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 bg-white rounded-xl shadow-lg border">
      <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-500"/> SNS生成ツール</h1>
      {message && <div className="text-red-600 text-sm">{message.text}</div>}
      <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e => setEventName(e.target.value)} />
      <textarea className="w-full p-2 border rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e => setEventDetails(e.target.value)} />
      <select className="w-full p-2 border rounded" value={charKey} onChange={e => setCharKey(e.target.value)}>
        {Object.entries(CHARACTERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">
        {isLoading ? "生成中..." : "生成する"}
      </button>
      {result && <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap border">{result}</div>}
    </div>
  );
}
