import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { card_name, set_name, card_number, game } = await req.json()

  try {
    let price = null
    let image_url = null
    let matched_set = null

    // ── POKEMON ──────────────────────────────────────────
    if (game === 'Pokemon') {
      let query = `name:"${card_name}"`

      // If we have a card number, use it for precise lookup
      if (card_number) {
        const num = card_number.split('/')[0]?.trim()
        if (num) query += ` number:${num}`
      }

      const res = await fetch(
        `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=5&orderBy=-set.releaseDate`,
        { headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY ?? '' } }
      )
      const data = await res.json()

      if (data.data?.length > 0) {
        // Try to match set name if provided
        let card = data.data[0]
        if (set_name) {
          const match = data.data.find((c: any) =>
            c.set?.name?.toLowerCase().includes(set_name.toLowerCase()) ||
            set_name.toLowerCase().includes(c.set?.name?.toLowerCase())
          )
          if (match) card = match
        }

        price = card.tcgplayer?.prices?.holofoil?.market
          ?? card.tcgplayer?.prices?.reverseHolofoil?.market
          ?? card.tcgplayer?.prices?.normal?.market
          ?? card.tcgplayer?.prices?.['1stEditionHolofoil']?.market
          ?? card.cardmarket?.prices?.averageSellPrice
          ?? null

        image_url = card.images?.large ?? card.images?.small ?? null
        matched_set = card.set?.name ?? null
      }
    }

    // ── MTG ──────────────────────────────────────────────
    else if (game === 'MTG') {
      let url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(card_name)}`
      if (set_name) url += `&set=${encodeURIComponent(set_name)}`

      const res = await fetch(url)
      const card = await res.json()

      if (card.object !== 'error') {
        price = card.prices?.usd ? parseFloat(card.prices.usd) : null
        image_url = card.image_uris?.normal
          ?? card.card_faces?.[0]?.image_uris?.normal
          ?? null
        matched_set = card.set_name ?? null
      }
    }

    // ── YU-GI-OH ─────────────────────────────────────────
    else if (game === 'Yu-Gi-Oh') {
      const res = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(card_name)}`
      )
      const data = await res.json()

      if (data.data?.length > 0) {
        const card = data.data[0]
        price = card.card_prices?.[0]?.tcgplayer_price
          ? parseFloat(card.card_prices[0].tcgplayer_price)
          : null
        image_url = card.card_images?.[0]?.image_url ?? null
        matched_set = set_name ?? null
      }
    }

    return NextResponse.json({ price, image_url, matched_set })

  } catch (err: any) {
    console.error('Price lookup error:', err)
    return NextResponse.json({ price: null, image_url: null, matched_set: null })
  }
}