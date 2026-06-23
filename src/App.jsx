import React, { useState } from 'react';
import { Sparkles, Loader2, Link as LinkIcon, AlertCircle, Copy, Check } from 'lucide-react';

const CHARACTERS = {
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
  const [shortening, setShortening] = useState([false, false, false]);
  const [copySuccess, setCopySuccess] = useState(false);

  const shortenUrl = async (index) => {
    if (!urls[index]) return;
    const newShortening = [...shortening];
    newShortening[index] = true;
    setShortening(newShortening);

    try {
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(urls[index])}`);
      const data = await res.json();
      if (data.shorturl) {
        const newUrls = [...urls];
        newUrls[index] = data.shorturl;
        setUrls(newUrls);
      } else {
        setMessage({ type: 'error', text: '短縮に失敗しました' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '短縮APIへの接続に失敗しました' });
    } finally {
      const resetShortening = [...shortening];
      resetShortening[index] = false;
      setShortening(resetShortening);
    }
  };

  const generate = async () => {
    if (!eventName || !eventDetails) {
      setMessage({ type: 'error', text: 'イベント名と詳細は必須です' });
      return;
    }

    setIsLoading(true);
    setResult('');
    setMessage(null);

    const appendedContent = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();

    const prompt = `
あなたはSNS投稿作成のプロです。以下のイベント情報を元に、X（Twitter）の告知本文を作成してください。

【イベント名】: ${eventName}
【イベント詳細】: ${eventDetails}
【キャラクター設定】: ${CHARACTERS[charKey]}
【後から付与する情報】: 
${appendedContent}

【絶対ルール】
1. 指定されたキャラクターになりきること。
2. 「${eventName}」というイベント名を必ず文章中に含めること。
3. **重要：本文＋【後から付与する情報】を合わせた合計文字数が絶対に180文字以内になるように調整すること。** 文字数オーバーしそうな場合は、本文を大幅に短縮すること。
4. 本文のみを出力すること（URL、ハッシュタグ、メンションは含めないこと）。
5. 挨拶や前置きは不要。
6. 無駄な改行や空白は避けること。
`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });
      const data = await response.json();
      const body = data.candidates[0].content.parts[0].text.trim();
      
      const final = `${body}\n\n${appendedContent}`.trim();
      setResult(final);
    } catch (e) {
      setMessage({ type: 'error', text: '生成エラーです。もう一度押してください。' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-indigo-500"/> SNS投稿ジェネレーター</h1>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          <AlertCircle size={16}/> {message.text}
        </div>
      )}

      <div className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
        <textarea className="w-full p-2 border rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="ハッシュタグ" value={hashtags} onChange={e=>setHashtags(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="@メンション" value={mention} onChange={e=>setMention(e.target.value)} />
      </div>

      <div className="space-y-2 border-t pt-4">
        <label className="text-sm font-semibold flex items-center gap-2"><LinkIcon size={16}/> URL短縮 (最大3個)</label>
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input className="flex-1 p-2 border rounded text-sm" placeholder={`URL ${i+1}`} value={url} onChange={e=>{const n=[...urls]; n[i]=e.target.value; setUrls(n)}} />
            <button onClick={()=>shortenUrl(i)} className="bg-gray-200 px-3 py-1 rounded text-xs hover:bg-gray-300">
              {shortening[i] ? <Loader2 className="animate-spin" size={14}/> : "短縮"}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.keys(CHARACTERS).map(k => (
          <button key={k} onClick={() => setCharKey(k)} className={`p-2 text-xs rounded transition ${charKey===k ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {CHARACTERS[k].split('：')[0]}
          </button>
        ))}
      </div>

      <button onClick={generate} className="w-full p-3 bg-indigo-600 text-white rounded font-bold flex justify-center hover:bg-indigo-700 transition">
        {isLoading ? <Loader2 className="animate-spin"/> : "投稿文を生成する"}
      </button>

      {result && (
        <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap border border-gray-200 relative">
          <div className={`text-right text-xs mb-2 ${result.length > 180 ? 'text-red-600' : 'text-gray-500'}`}>
            {result.length} / 180 文字
          </div>
          {result}
          <button onClick={copyToClipboard} className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded">
            {copySuccess ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
          </button>
        </div>
      )}
    </div>
  );
}