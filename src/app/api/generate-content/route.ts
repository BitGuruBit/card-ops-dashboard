import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { topic, platform, niche } = await req.json()

  const prompt = `You are a content strategist for a TCG (Trading Card Game) content creator who sells Pokemon, MTG, and Yu-Gi-Oh cards on eBay and TCGPlayer, and creates content on YouTube, TikTok, and Instagram.

Generate 5 creative content ideas related to: "${topic}"
Platform: ${platform || 'Any'}
Niche angle: ${niche || 'TCG/Pokemon cards'}

For each idea provide:
1. A catchy SEO-optimized title (under 70 characters for YouTube)
2. A description (2-3 sentences, include keywords naturally)
3. 5 relevant SEO keywords/hashtags
4. A content hook (first line to grab attention)

Format as JSON array like this:
[
  {
    "title": "...",
    "seo_title": "...",
    "description": "...",
    "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
    "hook": "..."
  }
]

Only return the JSON array, no extra text.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    })

    const data = await response.json()
    console.log('OpenAI response status:', response.status)
    console.log('OpenAI data:', JSON.stringify(data))

    const raw = data.choices[0].message.content
    const text = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const ideas = JSON.parse(text)
    return NextResponse.json({ ideas })

  } catch (err: any) {
    console.error('OpenAI error:', err)
    return NextResponse.json({ error: err.message || 'Failed to generate ideas' }, { status: 500 })
  }
}