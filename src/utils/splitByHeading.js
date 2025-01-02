export default function splitByHeading(text) {
    const lines = text.split('\n');

    let sections = [];
    let currentSection = { title: '', content: '' };

    lines.forEach((line) => {
        // 判断是否是新的章节标题（以 # 开头）
        if (line.trim().startsWith('#')) {
            // 如果当前 section 不为空，则先推入 sections
            if (currentSection.title || currentSection.content) {
                sections.push({ ...currentSection });
            }
            // 开启新的章节
            currentSection = {
                title: line.replace(/^#\s*/, '').trim(), // 去掉开头的 # 以及空格
                content: '',
            };
        } else {
            // 非标题行，追加到 content
            currentSection.content += line + '\n';
        }
    });

    // 处理最后一个 section
    if (currentSection.title || currentSection.content) {
        sections.push({ ...currentSection });
    }

    return sections;
}