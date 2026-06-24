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

  // Vercelで設定した環境変数（APIキー）を読み込む
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
      setMessage({ type: 'error', text: `URL短縮エラー: ブラウザのセキュリティ制限などで失敗しました。外部ツールで短縮したURLを直接入力してください。` });
    } finally {
      const resetShortening = [...isShortening];
      resetShortening[index] = false;
      setIsShortening(resetShortening);
    }
  };

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキーが設定されていません。Vercelの環境変数を確認し、Redeployしてください。' });
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

    const prompt = `
あなたはSNS投稿作成のプロです。以下のイベント情報を元に、X（Twitter）の告知本文を作成してください。

【イベント名】: ${eventName}
【イベント詳細】: ${eventDetails}
【キャラクター設定】: ${CHARACTER_PROMPTS[charKey]}
【後から付与する情報】: 
${appendedContent}

【絶対ルール】
1. 指定されたキャラクターになりきること。
2. 「${eventName}」というイベント名を必ず文章中に含めること。
3. **重要：本文＋【後から付与する情報】を合わせた合計文字数が絶対に180文字以内になるように調整すること。**
4. 本文のみを出力すること。挨拶や前置きは不要。
`;

    let success = false;
    let responseData = null;
    let lastError = null;
    const delays = [1000, 2000, 4000, 8000, 16000];

    for (let i = 0; i <= delays.length; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        });
        const data = await response.json();
        
        if (data.error) throw new Error(data.error.message);
        
        responseData = data;
        success = true;
        break;
      } catch (e) {
        lastError = e;
        if (i < delays.length) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
      }
    }

    try {
      if (!success || !responseData) throw lastError;
      const body = responseData.candidates[0].content.parts[0].text.trim();
      const final = `${body}\n\n${appendedContent}`.trim();
      setResult(final);
    } catch (e) {
      setMessage({ type: 'error', text: '生成エラー: サーバーとの通信に失敗しました。' });
    } finally {
      setIsLoading(false);
    }
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
        
        <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <label className="block text-sm font-bold text-gray-700">関連URL (最大3つ・任意)</label>
          {urls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 p-2 border rounded text-sm bg-white"
                placeholder={`https://... (URL ${i + 1})`}
                value={url}
                onChange={e => {
                  const newUrls = [...urls];
                  newUrls[i] = e.target.value;
                  setUrls(newUrls);
                }}
              />
              <button
                onClick={() => shortenUrl(i)}
                disabled={!url || isShortening[i]}
                className="px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded text-sm font-bold whitespace-nowrap disabled:opacity-50 transition"
              >
                {isShortening[i] ? <Loader2 className="animate-spin" size={16}/> : '短縮する'}
              </button>
            </div>
          ))}
        </div>

        <select className="w-full p-2 border rounded" value={charKey} onChange={e=>setCharKey(e.target.value)}>
          {Object.entries(CHARACTERS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <input className="w-full p-2 border rounded" placeholder="ハッシュタグ" value={hashtags} onChange={e=>setHashtags(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="@メンション" value={mention} onChange={e=>setMention(e.target.value)} />
      </div>

      <button onClick={generate} className="w-full p-3 bg-indigo-600 text-white rounded font-bold flex justify-center hover:bg-indigo-700 transition">
        {isLoading ? <Loader2 className="animate-spin"/> : "投稿文を生成する"}
      </button>

      {result && (
        <div className="p-4 bg-gray-50 rounded text-sm whitespace-pre-wrap border border-gray-200 relative">
          <div className="text-right text-xs mb-2 text-gray-500">{result.length} / 180 文字</div>
          {result}
        </div>
      )}
    </div>
  );
}
