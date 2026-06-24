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
  fresh: "さわやかお兄さん系",
  horror: "ホラー系",
  johnnys: "ジャニオタ系"
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
  fresh: "さわやかお兄さん系：爽やかで親しみやすく、誰に対しても好印象を与えるような、明るくポジティブな文体で告知してください。",
  horror: "ホラー系：少し不気味でゾクッとするような、怪談風の雰囲気で告知してください。",
  johnnys: "ジャニオタ系：テンション高めで、「推しが尊い！」「担当のビジュが最高！」など、熱狂的なオタク用語を多用してください。"
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
  const [isShortening, setIsShortening] = useState([false, false, false]);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキーが設定されていません。' });
      return;
    }
    setIsLoading(true);
    setResult('');
    const appendedContent = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    
    // APIへ送信するプロンプト
    const prompt = `あなたはSNS投稿作成のプロです。以下の情報を元に、SNSの告知文を作成してください。
【イベント名】: ${eventName}
【イベント詳細】: ${eventDetails}
【キャラクター設定】: ${CHARACTER_PROMPTS[charKey]}
【URL等】: ${appendedContent}
【出力ルール】: 本文と付随情報を合わせ合計180文字以内で作成。挨拶不要、本文のみを出力。`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const data = await response.json();
      
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        setResult(`${data.candidates[0].content.parts[0].text.trim()}\n\n${appendedContent}`.trim());
      } else {
        throw new Error(data.error?.message || "応答形式エラー");
      }
    } catch (e) {
      setMessage({ type: 'error', text: '生成エラー: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h1 className="text-xl font-bold mb-4">SNS投稿作成</h1>
      {message && <div className="text-red-600 bg-red-50 p-2 text-sm rounded mb-4">{message.text}</div>}
      <div className="space-y-4">
        <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
        <textarea className="w-full p-2 border rounded" rows={3} placeholder="詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
        <select className="w-full p-2 border rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
          {Object.entries(CHARACTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">{isLoading ? '生成中...' : '生成する'}</button>
      </div>
      {result && <div className="mt-4 p-4 bg-gray-50 rounded border whitespace-pre-wrap text-sm">{result}</div>}
    </div>
  );
}
