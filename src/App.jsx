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
        setMessage({ type: 'success', text: '短縮完了！' });
      } else {
        throw new Error('短縮失敗');
      }
    } catch (e) {
      setMessage({ type: 'error', text: '短縮失敗' });
    } finally {
      const reset = [...isShortening];
      reset[index] = false;
      setIsShortening(reset);
    }
  };

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキー未設定' });
      return;
    }
    if (!eventName || !eventDetails) {
      setMessage({ type: 'error', text: '必須項目を入力してください' });
      return;
    }
    setIsLoading(true);
    setResult('');
    setMessage(null);
    const appended = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    const prompt = `あなたはSNSプロです。以下を元に180文字以内の告知文を作成し、本文のみ出力してください。\nイベント名:${eventName}\n詳細:${eventDetails}\n設定:${CHARACTER_PROMPTS[charKey]}\n付随:${appended}`;

    try {
      const res = await fetch('[https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=](https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=)' + API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7 } })
      });
      const data = await res.json();
      const body = data.candidates[0].content.parts[0].text.trim();
      setResult(`${body}\n\n${appended}`.trim());
    } catch (e) {
      setMessage({ type: 'error', text: '生成失敗' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4 bg-white rounded-xl shadow-lg border">
      <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-500"/> SNS生成</h1>
      {message && <div className={`p-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{message.text}</div>}
      <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
      <textarea className="w-full p-2 border rounded" rows={3} placeholder="詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
      {urls.map((url, i) => (
        <div key={i} className="flex gap-2">
          <input className="flex-1 p-2 border rounded text-sm" placeholder={`URL ${i+1}`} value={url} onChange={e=>{const n=[...urls]; n[i]=e.target.value; setUrls(n)}} />
          <button onClick={()=>shortenUrl(i)} className="px-3 bg-indigo-100 rounded text-sm">短縮</button>
        </div>
      ))}
      <select className="w-full p-2 border rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
        {Object.entries(CHARACTERS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
      </select>
      <input className="w-full p-2 border rounded" placeholder="ハッシュタグ" value={hashtags} onChange={e=>setHashtags(e.target.value)} />
      <input className="w-full p-2 border rounded" placeholder="@メンション" value={mention} onChange={e=>setMention(e.target.value)} />
      <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">{isLoading ? "生成中..." : "投稿文を生成"}</button>
      {result && <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap border">{result}</div>}
    </div>
  );
}
