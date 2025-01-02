import React, { useRef, useState } from 'react';

function FileUploader({ onExtractComplete }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!fileInputRef.current.files.length) {
            alert('请选择一个文件');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', fileInputRef.current.files[0]);

            const response = await fetch('/api/extract', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            onExtractComplete(data.extractedText);
        } catch (error) {
            console.error(error);
            alert('抽取笔记文本失败');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center space-x-4">
            <input
                type="file"
                ref={fileInputRef}
                className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
            />
            <button
                onClick={handleUpload}
                disabled={uploading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white
                    ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
                {uploading ? '上传中...' : '抽取笔记文本'}
            </button>
        </div>
    );
}

export default FileUploader;