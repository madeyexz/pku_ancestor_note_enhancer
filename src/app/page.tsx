'use client';

import React, { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import NotesSplitList from '@/components/NotesSplitList';
import splitByHeading from '@/utils/splitByHeading';
import downloadFile from '@/utils/downloadFile';
import type { marked as MarkedType } from 'marked';
import type { default as Html2PdfType } from 'html2pdf.js';

// Browser-only imports
let html2pdf: typeof Html2PdfType;
let marked: typeof MarkedType;

if (typeof window !== 'undefined') {
  Promise.all([
    import('html2pdf.js'),
    import('marked')
  ]).then(([html2pdfModule, markedModule]) => {
    html2pdf = html2pdfModule.default;
    marked = markedModule.marked;
  });
}

interface Note {
  title: string;
  content: string;
}

interface GeneratedNote {
  title: string;
  mdContent: string;
}

export default function Home() {
  const [extractedText, setExtractedText] = useState('');
  const [splittedNotes, setSplittedNotes] = useState<Note[]>([]);
  const [generatedNotes, setGeneratedNotes] = useState<GeneratedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(
    `请帮我用 markdown 格式整理下面的课程笔记。尽可能保持原来的知识结构。在适当的地方进行补充增加完整性。除了笔记整理的结果，不要输出任何东西。不要使用 code block 格式。
标题: {{title}}
内容: {{content}}`
  );

  // 接收抽取完的文本
  const handleExtractedText = (text: string) => {
    setExtractedText(text);
    setSplittedNotes([]);
    setGeneratedNotes([]);
  };

  // 用户在文本框中手动加 # 之后，可以点「拆分」
  const handleSplitNotes = () => {
    const sections = splitByHeading(extractedText);
    setSplittedNotes(sections);
    setGeneratedNotes([]); // 重新切分后，清空旧的生成结果
  };

  // 生成笔记（调用 GPT）
  const handleGenerateNotes = async () => {
    if (splittedNotes.length === 0) {
      alert('请先进行"笔记拆分"');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: splittedNotes,
          model: selectedModel,
          apiKey: useCustomKey ? apiKey : undefined,
          prompt: customPrompt
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Generate notes failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setGeneratedNotes(data.generated);
    } catch (error) {
      console.error(error);
      alert('生成笔记失败！');
    } finally {
      setLoading(false);
    }
  };

  // 下载为 MD
  const handleDownloadMD = () => {
    if (generatedNotes.length === 0) {
      alert('没有可下载的内容，请先生成。');
      return;
    }

    const mergedMd = generatedNotes
      .map((item) => `# ${item.title}\n\n${item.mdContent}\n`)
      .join('\n');

    const blob = new Blob([mergedMd], { type: 'text/markdown' });
    downloadFile(blob, 'notes_merged.md');
  };

  // 分开下载为 MD
  const handleDownloadSeparateMD = () => {
    if (generatedNotes.length === 0) {
      alert('没有可下载的内容，请先生成。');
      return;
    }

    generatedNotes.forEach((note) => {
      const content = `# ${note.title}\n\n${note.mdContent}`;
      const blob = new Blob([content], { type: 'text/markdown' });
      const fileName = `${note.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.md`;
      downloadFile(blob, fileName);
    });
  };

  // 下载为 PDF
  const handleDownloadPDF = async () => {
    if (generatedNotes.length === 0) {
      alert('没有可下载的内容，请先生成。');
      return;
    }

    try {
      const mergedMd = generatedNotes
        .map((item) => `# ${item.title}\n\n${item.mdContent}\n`)
        .join('\n');

      // Dynamically load dependencies
      const markedInstance = await marked;
      const html2pdfInstance = await html2pdf();
      
      const htmlContent = markedInstance(mergedMd);
      const tempElement = document.createElement('div');
      tempElement.innerHTML = htmlContent;
      tempElement.style.cssText = `
        padding: 40px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
      `;

      const styleElement = document.createElement('style');
      styleElement.textContent = `
        h1 { font-size: 28px; margin-top: 32px; margin-bottom: 16px; font-weight: 600; color: #1a202c; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        h2 { font-size: 24px; margin-top: 24px; margin-bottom: 14px; font-weight: 600; color: #2d3748; }
        h3 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; font-weight: 600; color: #4a5568; }
        p { margin-bottom: 12px; line-height: 1.6; color: #2d3748; }
        code { background-color: #f7fafc; padding: 2px 6px; border-radius: 4px; font-family: 'Menlo', 'Monaco', 'Courier New', monospace; font-size: 0.9em; color: #d53f8c; border: 1px solid #edf2f7; }
        pre { background-color: #f7fafc; padding: 20px; border-radius: 8px; overflow-x: auto; border: 1px solid #edf2f7; margin: 20px 0; }
        pre code { color: #4a5568; border: none; padding: 0; background: none; }
        ul, ol { margin-bottom: 16px; padding-left: 24px; color: #2d3748; }
        li { margin-bottom: 8px; line-height: 1.5; }
        blockquote { border-left: 4px solid #cbd5e0; padding-left: 16px; margin: 20px 0; color: #4a5568; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #f7fafc; font-weight: 600; }
        hr { border: none; border-top: 2px solid #e2e8f0; margin: 24px 0; }
      `;
      tempElement.appendChild(styleElement);

      const opt = {
        margin: [15, 15, 15, 15],
        filename: 'notes_merged.pdf',
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: true,
          letterRendering: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
          compress: false
        }
      };

      await html2pdfInstance.set(opt).from(tempElement).save();
    } catch (error) {
      console.error(error);
      alert('导出 PDF 失败！');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">PKU 祖传笔记增强工具</h1>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="mb-4 text-sm text-gray-600">
            <h2 className="font-semibold text-gray-900 mb-2">使用方法：</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>找到页面上写着&quot;选择文件&quot;的按钮（通常在页面中间），点击这个按钮，会弹出一个文件选择窗口。在弹出的窗口中找到并选择你要处理的笔记文件（必须是 PDF 格式），然后点击&quot;抽取笔记文本&quot;按钮。</li>
              <li>等待几秒钟，你的笔记内容会显示在一个可以编辑的文本框中。仔细看一下文字是否有错误（比如：把&quot;人&quot;识别成&quot;入&quot;这样的错误），如果发现错误，可以直接用键盘在文本框中修改。</li>
              <li>找到每一章的大标题（比如：&quot;第一章 绪论&quot;、&quot;第二章 基础理论&quot;等），在每个大标题的最前面加上一个井号（#）和一个空格。注意：只需要给最大的标题（章）加标记，小标题（节）不用加。</li>
              <li>检查完所有内容后，点击&quot;生成笔记&quot;按钮。等待几秒钟，你的电脑会自动下载一个新文件，这个新文件的格式是 .md（一种常见的文本格式）。</li>
            </ol>
          </div>
          <FileUploader onExtractComplete={handleExtractedText} />
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Key 设置</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomKey"
                checked={useCustomKey}
                onChange={(e) => {
                  setUseCustomKey(e.target.checked);
                  if (!e.target.checked) {
                    setApiKey('');
                    setSelectedModel('gpt-4o-mini');
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="useCustomKey" className="text-sm text-gray-700">
                使用自定义 API Key
              </label>
            </div>

            {useCustomKey && (
              <div className="space-y-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 API Key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  使用自定义 Key 可以选择不同的模型
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-xl font-semibold text-gray-900">高级设定</h2>
            <svg
              className={`w-5 h-5 transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  自定义提示词（使用 {'{{'} title {'}}'}  和 {'{{'} content {'}}'}  作为占位符）
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-32 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入自定义的提示词..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  提示：{'{{'} title {'}}'}  将被替换为章节标题，{'{{'} content {'}}'}  将被替换为章节内容
                </p>
              </div>
            </div>
          )}
        </div>

        {useCustomKey && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">模型选择</h2>
            <div className="flex space-x-4">
              {['gpt-4o-mini', 'gpt-4o', 'o1-mini'].map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${selectedModel === model
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">提取并可编辑的文本</h2>
          <p className="text-sm text-gray-600 mb-2">
            接下来请编辑文本框内的内容，在章节标题前加上 # 符号（仅需标记一级标题）
          </p>
          <textarea
            className="w-full h-96 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
          />
          <button
            onClick={handleSplitNotes}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            按分段点拆分
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">拆分后笔记</h3>
          <NotesSplitList notes={splittedNotes} />

          <button
            onClick={handleGenerateNotes}
            disabled={loading}
            className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
          >
            {loading ? '生成中...' : '同步生成多个笔记'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">生成结果</h3>
          {generatedNotes.length > 0 ? (
            <NotesSplitList
              notes={generatedNotes.map((g) => ({ title: g.title, content: g.mdContent }))}
            />
          ) : (
            <p className="text-gray-500 italic">还未生成笔记</p>
          )}

          <div className="mt-4 space-x-4">
            <button
              onClick={handleDownloadMD}
              disabled={generatedNotes.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${generatedNotes.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
            >
              合并下载 MD
            </button>
            <button
              onClick={handleDownloadSeparateMD}
              disabled={generatedNotes.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${generatedNotes.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
            >
              分开下载 MD
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={generatedNotes.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                ${generatedNotes.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
            >
              下载为 PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
