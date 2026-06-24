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
  serious: "真面目系：丁寧語で、誠実かつ信頼感のある、少し硬めの文体で告知してください。",
  gyaru: "ギャル系：明るいテンションで、「〜マジでヤバい！」「〜しよ！」など、若者言葉と絵文字を多用してください。",
  cute: "可愛い系：語尾を「〜だにゃん」「〜だよっ☆」など可愛くし、ハートや星の絵文字を使ってください。",
  ojisan: "おじさん系：句読点多め。絵文字は古めのものを使用し、少しお節介で親しみやすい雰囲気で告知してください。",
  announcer: "アナウンサー系：ニュース番組の告知のように、冷静かつハキハキとした、簡潔で分かりやすい文体で伝えてください。",
  friend: "友達キャラ：タメ口で、親しみやすく「ねえねえ、これ見て！」という距離感の文体で告知してください。",
  light: "ノリ軽いキャラ：サクッと「これアツい！」「絶対行ったほうがいい！」みたいな軽いノリで告知してください。",
  fan: "ファンキャラ：熱烈なファン目線で、「絶対見逃せない！」「やばい最高！」という興奮気味な文体で告知してください。",
  sexy: "セクシーキャラ：少し大人っぽく、落ち着いた艶やかな雰囲気で、誘惑するような文体で告知してください。",
  fresh: "さわやかお兄さん系：爽やかで親しみやすく、誰に対しても好印象を与えるような、明るくポジティブな文体で告知してください。"
};

export default function App() {
  const [eventName, setEventName] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [urls, setUrls] = useState(['', '', '']);
  const [hashtags, setHashtags] = useState('');
  const [mention, setMention] = useState('');
  const [charKey, setCharKey] = useState('serious');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // 環境変数の取得方法を修正
  const API_KEY = typeof process !== 'undefined' ? process.env.VITE_GEMINI_API_KEY : import.meta.env?.VITE_GEMINI_API_KEY;

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキーが設定されていません。' });
      return;
    }
    if (!eventName || !eventDetails) {
      setMessage({ type: 'error', text: 'イベント名と詳細は必須です' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setResult('');

    const appended = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    const prompt = `あなたはSNS投稿のプロです。イベント名:${eventName}, 詳細:${eventDetails}, 設定:${CHARACTER_PROMPTS[charKey]}, 付随情報:${appended}。180文字以内の告知文を作成してください。本文のみ出力してください。`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=' + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('APIから無効なデータが返されました（キーの設定を確認してください）');
      }

      if (!response.ok) throw new Error(data.error?.message || '生成失敗');
      
      const body = data.candidates[0].content.parts[0].text.trim();
      setResult(`${body}\n\n${appended}`.trim());
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-indigo-500"/> SNS投稿ジェネレーター</h1>
      {message && <div className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{message.text}</div>}
      <div className="space-y-3">
        <input className="w-full border p-2 rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
        <textarea className="w-full border p-2 rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
        <select className="w-full border p-2 rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
          {Object.entries(CHARACTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={generate} disabled={isLoading} className="w-full bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700">
          {isLoading ? '生成中...' : '生成する'}
        </button>
      </div>
      {result && <div className="mt-4 p-3 bg-gray-100 whitespace-pre-wrap text-sm rounded">{result}</div>}
    </div>
  );
}
