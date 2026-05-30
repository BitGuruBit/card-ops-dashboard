import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { imageBase64 } = await req.json()

  const prompt = `You are a trading card game expert with encyclopedic knowledge of Pokemon, Magic: The Gathering, and Yu-Gi-Oh cards.

Carefully examine this card image and extract the information. Look for:
- The card name printed at the TOP of the card
- The set symbol (bottom right area on Pokemon cards)
- The card number (e.g. 025/198 printed at bottom)
- Any set name printed on the card

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "card_name": "exact name as printed on card",
  "set_name": "set name if visible, otherwise null",
  "card_number": "card number e.g. 025/198, or null",
  "game": "Pokemon" or "MTG" or "Yu-Gi-Oh" or "Other",
  "condition": "NM" or "LP" or "MP" or "HP" or "DMG",
  "rarity": "rarity symbol description e.g. Rare Holo, Common, Uncommon",
  "is_back": true or false
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
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' } }
          ]
        }],
        temperature: 0.1,
        max_tokens: 400,
      }),
    })

    const data = await response.json()
    const raw = data.choices[0].message.content
    const text = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const card = JSON.parse(text)

    // If this is the back of a card, tell the client to skip it
    if (card.is_back) {
      return NextResponse.json({ is_back: true })
    }

    return NextResponse.json({ card })

  } catch (err: any) {
    console.error('Scan error:', err)
    return NextResponse.json({ error: err.message || 'Failed to scan card' }, { status: 500 })
  }
}