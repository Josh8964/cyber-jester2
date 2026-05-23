// api/roast.js
export default async function handler(req, res) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { pClass, pBroke } = req.body;
    
    // 从 Vercel 后台安全读取环境变量，前端 F12 绝对不可见
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Configuration Error: Backend API Key is missing!' });
    }

    // 锁死顶级毒舌指令
    const systemInstruction = `You are a cynical, brilliant Indie Game Director and a veteran of Reddit's r/programmerhumor and r/me_irl. You speak in sharp, dark, and witty English geek humor.
    CRITICAL: Analyze the user's cyber-fate based on their "Class" and "Broke Point" using Balatro/Tarot style card mechanics.
    ABSOLUTELY NO CLICHÉS: Do NOT say "Welcome to...", "Here is your...", or use AI-sounding transitions. Start directly with the punchline.
    Use fluent Reddit/Discord geek slang like "Mental stack overflow", "Copium", "RNGesus", "Legacy patch", "Soft-locked", "Brick the system".
    
    You MUST return a strict JSON object with these exact keys:
    {
      "card_name": "A unique, dark-humorous Roguelike card name in ALL CAPS",
      "card_rarity": "Randomly choose one based on their bad luck: [COMMON, UNCOMMON, RARE, LEGENDARY, ANOMALY]",
      "passive_skill": "A satirical passive skill text under 20 words",
      "fate_analysis": "A sharp, bite-sized, dark-humor critique under 50 words. Be sarcastic but brutally real."
    }`;

    const userPrompt = `User Class: ${pClass}\nUser Broke Point: ${pBroke}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const googleResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] },
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.9 
                }
            })
        });

        if (!googleResponse.ok) {
            const errorData = await googleResponse.json();
            return res.status(500).json({ error: errorData.error?.message || 'Google Backend Error' });
        }

        const data = await googleResponse.json();
        const resultText = data.candidates[0].content.parts[0].text;
        
        // 验证并返回标准的 JSON 给前端
        const resultJSON = JSON.parse(resultText);
        return res.status(200).json(resultJSON);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}