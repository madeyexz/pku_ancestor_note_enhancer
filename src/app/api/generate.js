import OpenAI from 'openai';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { notes, model, apiKey, prompt } = req.body;

            const openai = new OpenAI({
                apiKey: apiKey || process.env.OPENAI_API_KEY,
            });

            // If using system API key, force the model to be gpt-4o-mini
            const actualModel = apiKey ? (model || 'gpt-4o-mini') : 'gpt-4o-mini';

            // Process all sections in parallel while maintaining order
            const promises = notes.map(async (note, i) => {
                try {
                    // Replace placeholders in the custom prompt
                    const actualPrompt = (prompt || `请帮我用 markdown 格式整理下面的课程笔记。尽可能保持原来的知识结构。在适当的地方进行补充增加完整性。除了笔记整理的结果，不要输出任何东西。不要使用 code block 格式。
标题: {{title}}
内容: {{content}}`)
                        .replace('{{title}}', note.title)
                        .replace('{{content}}', note.content);
                    const completion = await openai.chat.completions.create({
                        model: actualModel,
                        messages: [
                            {
                                role: 'user',
                                content: actualPrompt
                            },
                        ],
                    });

                    return {
                        title: note.title || `Section ${i + 1}`,
                        mdContent: completion.choices[0].message.content
                    };
                } catch (err) {
                    console.error('OpenAI request error', err);
                    return {
                        title: note.title || `Section ${i + 1}`,
                        mdContent: '（本章节生成失败）'
                    };
                }
            });

            // eslint-disable-next-line
            const results = await Promise.all(promises);

            return res.status(200).json({ generated: results });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: '生成笔记失败' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}