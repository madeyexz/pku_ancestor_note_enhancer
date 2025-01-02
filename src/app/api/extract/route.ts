import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse-new';

// Helper function to parse form data
const parseForm = async (req: NextRequest) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }
    return { file };
};

// Helper function to extract text
const extractText = async (filePath: string, fileExtension: string) => {
    if (fileExtension === '.docx' || fileExtension === '.doc') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } else if (fileExtension === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    }
    throw new Error('Unsupported file type');
};

export async function POST(request: NextRequest) {
    try {
        const { file } = await parseForm(request);

        // Add file size validation
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size exceeds limit' }, { status: 400 });
        }

        const tmpDir = '/tmp';
        const uniqueFileName = `${Date.now()}-upload${path.extname(file.name) || ''}`;
        const filePath = path.join(tmpDir, uniqueFileName);

        // Write the file to disk
        const bytes = await file.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(bytes));

        // Add file extension check
        const supportedExtensions = ['.pdf', '.docx'];
        const fileExtension = path.extname(filePath).toLowerCase();
        if (!supportedExtensions.includes(fileExtension)) {
            fs.unlinkSync(filePath);
            return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
        }

        const extractedText = await extractText(filePath, fileExtension);

        // Clean up temporary file
        fs.unlinkSync(filePath);

        return NextResponse.json({ extractedText });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'File processing failed' }, { status: 500 });
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
}; 