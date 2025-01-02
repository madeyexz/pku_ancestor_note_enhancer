import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import mammoth from 'mammoth';
import TurndownService from 'turndown';
import extract from 'pdf-text-extract';

// Helper function to parse form data
const parseForm = async (req) => {
    return new Promise((resolve, reject) => {
        const form = formidable();
        form.parse(req, (err, fields, files) => {
            if (err) return reject(err);
            resolve({ fields, files });
        });
    });
};

// Disable body parser for this route
export const config = {
    api: {
        bodyParser: false,
    },
};

// Add new helper function
const extractText = async (filePath, fileExtension) => {
    const turndownService = new TurndownService();

    if (fileExtension === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } else if (fileExtension === '.pdf') {
        return new Promise((resolve, reject) => {
            extract(filePath, (err, pages) => {
                if (err) {
                    reject(err);
                    return;
                }
                // Join all pages with newlines
                const fullText = pages.join('\n');
                resolve(fullText.trim());
            });
        });
    }
    throw new Error('Unsupported file type');
};

// Vercel Serverless Function 入口
export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { files } = await parseForm(req);
            const file = files.file[0];

            if (!file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            // Add file size validation
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > MAX_FILE_SIZE) {
                return res.status(400).json({ error: 'File size exceeds limit' });
            }

            const tmpDir = '/tmp';
            const uniqueFileName = `${Date.now()}-upload${path.extname(file.originalFilename) || ''}`;
            const filePath = path.join(tmpDir, uniqueFileName);

            // Copy file to the temporary directory
            fs.copyFileSync(file.filepath, filePath);

            // Add file extension check
            const supportedExtensions = ['.pdf', '.docx'];
            const fileExtension = path.extname(filePath).toLowerCase();
            if (!supportedExtensions.includes(fileExtension)) {
                return res.status(400).json({ error: 'Unsupported file type' });
            }

            const extractedText = await extractText(filePath, fileExtension);

            // Clean up temporary files
            fs.unlinkSync(filePath);
            fs.unlinkSync(file.filepath);

            return res.status(200).json({
                extractedText: extractedText
            });

        } catch (err) {
            return res.status(500).json({ error: 'File processing failed' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}