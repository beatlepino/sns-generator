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
  const [isShortening, setIsShortening] = useState([false, false, false]);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const shortenUrl = async (index) => {
    const url = urls[index];
    if (!url) return;
    const newShortening = [...isShortening];
    newShortening[index] = true;
    setIsShortening(newShortening);
    setMessage(null);
    try {
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('ネットワークエラー');
      const data = await res.json();
      if (data.shorturl) {
        const newUrls = [...urls];
        newUrls[index] = data.shorturl;
        setUrls(newUrls);
        setMessage({ type: 'success', text: 'URLを短縮しました！' });
      } else {
        throw new Error(data.errormessage || '短縮に失敗しました');
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'URL短縮エラーが発生しました。' });
    } finally {
      const resetShortening = [...isShortening];
      resetShortening[index] = false;
      setIsShortening(resetShortening);
    }
  };

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
    setResult('');
    setMessage(null);
    const appendedContent = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    const prompt = `あなたはSNS投稿作成のプロです。以下の情報を元に、合計180文字以内で告知本文を作成してください。\nイベント名:${eventName}\n詳細:${eventDetails}\n設定:${CHARACTER_PROMPTS[charKey]}\n付随情報:${appendedContent}`;

    try {
      const response = await fetch('[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent)', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const body = data.candidates[0].content.parts[0].text.trim();
      setResult(`${body}\n\n${appendedContent}`.trim());
    } catch (e) {
      setMessage({ type: 'error', text: `生成エラー: ${e.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-500"/> SNS投稿ジェネレーター</h1>
      {message && <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message.text}</div>}
      <div className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
        <textarea className="w-full p-2 border rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input className="flex-1 p-2 border rounded text-sm" placeholder={`URL ${i+1}`} value={url} onChange={e=>{const n=[...urls]; n[i]=e.target.value; setUrls(n)}} />
            <button onClick={()=>shortenUrl(i)} className="px-3 bg-indigo-100 text-indigo-700 rounded text-sm">短縮</button>
          </div>
        ))}
        <select className="w-full p-2 border rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
          {Object.entries(CHARACTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <input className="w-full p-2 border rounded" placeholder="ハッシュタグ" value={hashtags} onChange={e=>setHashtags(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="@メンション" value={mention} onChange={e=>setMention(e.target.value)} />
      </div>
      <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">{isLoading ? "生成中..." : "投稿文を生成する"}</button>
      {result && <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap">{result}</div>}
    </div>
  );
}
