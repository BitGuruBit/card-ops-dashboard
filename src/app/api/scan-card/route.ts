import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json()

  const prompt = `You are a trading card game expert. Look at this card image and extract the following information. Return ONLY a JSON object, no extra text.

{
  "card_name": "exact card name as printed on the card",
  "set_name": "set or expansion name",
  "card_number": "card number e.g. 025/198",
  "game": "Pokemon" or "MTG" or "Yu-Gi-Oh" or "Other",
  "condition": "NM" or "LP" or "MP" or "HP" or "DMG",
  "rarity": "Common, Uncommon, Rare, Holo Rare, Ultra Rare, Secret Rare, etc"
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 300,
      }),
    })

    const data = await response.json()
    const raw = data.choices[0].message.content
    const text = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const card = JSON.parse(text)
    return NextResponse.json({ card })

  } catch (err: any) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: err.message || 'Failed to scan card' }, { status: 500 })
  }
}