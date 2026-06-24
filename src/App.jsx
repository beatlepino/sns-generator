import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

const CHARACTERS = {
  serious: "真面目系", gyaru: "ギャル系", cute: "可愛い系", ojisan: "おじさん系",
  announcer: "アナウンサー系", friend: "友達キャラ", light: "ノリ軽いキャラ",
  fan: "ファンキャラ", sexy: "セクシーキャラ", fresh: "さわやかお兄さん系"
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

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキーが設定されていません。' });
      return;
    }

    setIsLoading(true);
    setResult('');
    setMessage(null);

    const appendedContent = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    const prompt = `あなたはSNS投稿作成のプロです。以下のイベント情報を元に、X（Twitter）の告知本文を作成してください。\nイベント名: ${eventName}\n詳細: ${eventDetails}\n設定: ${CHARACTER_PROMPTS[charKey]}\n付随情報: ${appendedContent}\n※本文＋付随情報で180文字以内。挨拶不要、本文のみ出力。`;

    try {
      // 認証ヘッダーではなく、URLパラメータ(key=)を使用することで新キーフォーマットに対応
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `エラー: ${response.status}`);
      }
      
      setResult(`${data.candidates[0].content.parts[0].text.trim()}\n\n${appendedContent}`.trim());
    } catch (e) {
      setMessage({ type: 'error', text: `生成エラー: ${e.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 bg-white rounded-xl shadow-lg border">
      <h1 className="text-xl font-bold">SNS投稿ジェネレーター</h1>
      {message && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{message.text}</div>}
      <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
      <textarea className="w-full p-2 border rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
      <select className="w-full p-2 border rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
        {Object.entries(CHARACTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
      <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">
        {isLoading ? '生成中...' : '生成する'}
      </button>
      {result && <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">{result}</div>}
    </div>
  );
}
