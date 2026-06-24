import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';

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

  // ビルド環境で警告が出ないよう、process.envのみを参照する安全な取得方法に変更
  const API_KEY = process.env.VITE_GEMINI_API_KEY || '';

  const shortenUrl = async (index) => {
    const url = urls[index];
    if (!url) return;
    const newShortening = [...isShortening];
    newShortening[index] = true;
    setIsShortening(newShortening);
    try {
      const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.shorturl) {
        const newUrls = [...urls];
        newUrls[index] = data.shorturl;
        setUrls(newUrls);
      }
    } catch (e) {
      setMessage({ type: 'error', text: '短縮エラー' });
    } finally {
      const reset = [...isShortening];
      reset[index] = false;
      setIsShortening(reset);
    }
  };

  const generate = async () => {
    if (!API_KEY) {
      setMessage({ type: 'error', text: 'APIキーが環境変数に設定されていません。' });
      return;
    }
    setIsLoading(true);
    const appended = `${urls.filter(u=>u).join('\n')}\n${hashtags}\n${mention}`.trim();
    const prompt = `イベント:${eventName}\n詳細:${eventDetails}\n付随情報:${appended}\n告知文を作成してください。`;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const body = data.candidates[0].content.parts[0].text;
      setResult(`${body}\n\n${appended}`);
    } catch (e) {
      setMessage({ type: 'error', text: '生成失敗: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-200">
      <h1 className="text-xl font-bold mb-4 flex items-center gap-2"><Sparkles className="text-indigo-500"/> SNS投稿作成</h1>
      {message && <div className="text-red-600 bg-red-50 p-2 text-sm rounded mb-4">{message.text}</div>}
      <div className="space-y-4">
        <input className="w-full p-2 border rounded" placeholder="イベント名" value={eventName} onChange={e=>setEventName(e.target.value)} />
        <textarea className="w-full p-2 border rounded" rows={3} placeholder="イベント詳細" value={eventDetails} onChange={e=>setEventDetails(e.target.value)} />
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input className="flex-1 p-2 border rounded text-sm" placeholder={`URL ${i+1}`} value={url} onChange={e=>{const n=[...urls]; n[i]=e.target.value; setUrls(n)}} />
            <button onClick={()=>shortenUrl(i)} className="bg-indigo-100 px-3 rounded text-sm hover:bg-indigo-200">{isShortening[i] ? '...' : '短縮'}</button>
          </div>
        ))}
        <input className="w-full p-2 border rounded" placeholder="ハッシュタグ" value={hashtags} onChange={e=>setHashtags(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="@メンション" value={mention} onChange={e=>setMention(e.target.value)} />
        <button onClick={generate} disabled={isLoading} className="w-full p-3 bg-indigo-600 text-white rounded font-bold">{isLoading ? '生成中...' : '生成する'}</button>
      </div>
      {result && <div className="mt-4 p-4 bg-gray-50 rounded border whitespace-pre-wrap text-sm">{result}</div>}
    </div>
  );
}
