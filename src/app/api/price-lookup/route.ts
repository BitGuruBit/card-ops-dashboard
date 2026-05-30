import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { card_name, set_name, game } = await req.json()

  try {
    let price = null
    let image_url = null

    // ── POKEMON ──────────────────────────────────────────
    if (game === 'Pokemon') {
      const query = encodeURIComponent(`${card_name} ${set_name ?? ''}`.trim())
      const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${query}"&pageSize=1`)
      const data = await res.json()
      if (data.data?.length > 0) {
        const card = data.data[0]
        price = card.tcgplayer?.prices?.holofoil?.market
          ?? card.tcgplayer?.prices?.normal?.market
          ?? card.tcgplayer?.prices?.reverseHolofoil?.market
          ?? card.cardmarket?.prices?.averageSellPrice
          ?? null
        image_url = card.images?.small ?? null
      }
    }

    // ── MTG ──────────────────────────────────────────────
    else if (game === 'MTG') {
      const query = encodeURIComponent(card_name)
      const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${query}`)
      const card = await res.json()
      if (card.object !== 'error') {
        price = card.prices?.usd ? parseFloat(card.prices.usd) : null
        image_url = card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? null
      }
    }

    // ── YU-GI-OH ─────────────────────────────────────────
    else if (game === 'Yu-Gi-Oh') {
      const query = encodeURIComponent(card_name)
      const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${query}`)
      const data = await res.json()
      if (data.data?.length > 0) {
        const card = data.data[0]
        price = card.card_prices?.[0]?.tcgplayer_price
          ? parseFloat(card.card_prices[0].tcgplayer_price)
          : null
        image_url = card.card_images?.[0]?.image_url_small ?? null
      }
    }

    return NextResponse.json({ price, image_url })

  } catch (err: any) {
    console.error('Price lookup error:', err)
    return NextResponse.json({ price: null, image_url: null })
  }
}