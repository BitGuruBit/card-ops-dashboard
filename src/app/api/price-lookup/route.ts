import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { card_name, set_name, card_number, game } = await req.json()
  if (!card_name) return NextResponse.json({ error: 'card_name required' }, { status: 400 })

  const apiKey = process.env.POKEMON_TCG_API_KEY ?? ''
  const headers: HeadersInit = apiKey ? { 'X-Api-Key': apiKey } : {}

  try {
    if (game === 'Pokemon' || !game) {
      // Build query — try card number first for precision, fall back to name
      const nameQ = `name:"${card_name}"`
      const setQ  = set_name ? ` set.name:"${set_name}"` : ''
      const numQ  = card_number ? ` number:${card_number.replace(/[^0-9a-zA-Z]/g, '')}` : ''
      const query = encodeURIComponent(nameQ + setQ + numQ)

      const res  = await fetch(`https://api.pokemontcg.io/v2/cards?q=${query}&pageSize=8&orderBy=-set.releaseDate`, { headers })
      const data = await res.json()

      if (data.data?.length) {
        // Return top 5 candidates for picker
        const candidates = data.data.slice(0, 5).map((c: any) => ({
          id:        c.id,
          card_name: c.name,
          set_name:  c.set?.name ?? null,
          card_number: c.number,
          image_url: c.images?.large ?? c.images?.small ?? null,
          price:     c.tcgplayer?.prices?.holofoil?.market
                  ?? c.tcgplayer?.prices?.normal?.market
                  ?? c.tcgplayer?.prices?.reverseHolofoil?.market
                  ?? c.tcgplayer?.prices?.['1stEditionHolofoil']?.market
                  ?? null,
        }))

        return NextResponse.json({
          // First candidate for auto-fill compatibility
          price:       candidates[0].price,
          image_url:   candidates[0].image_url,
          matched_set: candidates[0].set_name,
          // All candidates for picker
          candidates,
        })
      }
    }

    return NextResponse.json({ price: null, image_url: null, candidates: [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}