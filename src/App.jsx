import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

const CHARACTERS = {
  serious: "真面目系", gyaru: "ギャル系", cute: "可愛い系", ojisan: "おじさん系",
  announcer: "アナウンサー系", friend: "友達キャラ", light: "ノリ軽いキャラ",
  fan: "ファンキャラ", sexy: "セクシーキャラ", fresh: "さわやかお兄さん系",
  horror: "ホラー系", johnnys: "ジャニオタ系"
};

const CHARACTER_PROMPTS = {
  serious: "真面目系：丁寧語で誠実な告知。", gyaru: "ギャル系：絵文字多用でハイテンションな告知。",
  cute: "可愛い系：語尾を可愛くしハートや星を使用。", ojisan: "おじさん系：句読点多めでお節介な告知。",
  announcer: "アナウンサー系：冷静かつハキハキとした告知。", friend: "友達キャラ：タメ口で親しみやすい告知。",
  light: "ノリ軽いキャラ：アツい軽いノリの告知。", fan: "ファンキャラ：熱烈なファン目線の告知。",
  sexy: "セクシーキャラ：大人っぽく誘惑するような告知。", fresh: "さわやかお兄さん系：明るくポジティブな告知。",
  horror: "ホラー系：ゾクッとする怪談風の告知。", johnnys: "ジャニオタ系：熱狂的なオタク用語で告知。"
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

  const shortenUrl = async (index) => {
    if (!urls[index]) return;
    try {
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urls[index])}`);
      const data = await res.json();
      if (data.shorturl) {
        const newUrls = [...urls];
        newUrls[index] = data.shorturl;
        setUrls(newUrls);
      }
    } catch (e) { setMessage({ type: 'error', text: '短縮失敗' }); }
  };

  const generate = async () => {
    if (!API_KEY) { setMessage({ type: 'error', text: 'APIキーが未設定です。' }); return; }
    setIsLoading(true);
    setResult('');
    
    const appended = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    // 文字化けの原因となっていたバックスラッシュやエスケープを排除した簡潔なテンプレートリテラル
    const prompt = `あなたはSNS投稿作成のプロです。以下の情報を元にSNSの告知文を180文字以内で作成してください。挨拶不要、本文のみ出力。\n\nイベント名: ${eventName}\n詳細: ${eventDetails}\n設定: ${CHARACTER_PROMPTS[charKey]}\n付随情報: ${appended}`;

    try {
      // 認証に失敗する場合は、モデル名を v1beta/models/gemini-1.5-flash:generateContent?key=... に固定するのが最も確実です
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const data = await response.json();
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setResult(data.candidates[0].content.parts[0].text.trim());
      } else {
        throw new Error(data.error?.message || "API接続エラー");
      }
    } catch (e) {
      setMessage({ type: 'error', text: `生成エラー: ${e.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 bg-white rounded-xl shadow-lg border">
      <h1 className="text-xl font-bold">SNS投稿ジェネレーター</h1>
      {message && <div className="p-2 bg-red-50 text-red-600 text-sm rounded">{message.text}</div>}
      <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
      <textarea className="w-full p-2 border rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
      {urls.map((u, i) => (
        <div key={i} className="flex gap-2">
          <input className="flex-1 p-2 border rounded text-sm" placeholder={`URL ${i+1}`} value={u} onChange={e=>{const n=[...urls]; n[i]=e.target.value; setUrls(n)}} />
          <button onClick={()=>shortenUrl(i)} className="bg-indigo-100 px-3 rounded">短縮</button>
        </div>
      ))}
      <select className="w-full p-2 border rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
        {Object.entries(CHARACTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
      <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">{isLoading ? '生成中...' : '生成する'}</button>
      {result && <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">{result}</div>}
    </div>
  );
}
