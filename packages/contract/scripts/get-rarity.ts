
enum Rarity {
  UR = "UR", // Ultra Rare
  SSR = "SSR", // Super Super Rare
  SR = "SR", // Super Rare
  R = "R", // Rare
  N = "N", // Normal
}

const percentage: number[] = [2, 8, 10, 20, 60]
// N: 60% (1-60)
// R: 20% (61-80)
// SR: 10% (81-90)
// SSR: 8% (91-98)
// UR: 2% (99-100)

function getRandomRarity(randomWords: number[]) {
  const rarity: Array<Rarity> = []
  const length = randomWords.length

  for (let i = 0; i < length; i++) {
    // const word = (randomWords[i] % 100) + 1 // 1-100
    const word = randomWords[i]
    let cumulative = 0

    // 从后往前遍历（N->R->SR->SSR->UR），概率大的先判断
    for (let j = percentage.length; j > 0; j--) {
      cumulative += percentage[j - 1]
      if (word <= cumulative) {
        switch (j - 1) {
          case 0:
            rarity.push(Rarity.UR)
            break
          case 1:
            rarity.push(Rarity.SSR)
            break
          case 2:
            rarity.push(Rarity.SR)
            break
          case 3:
            rarity.push(Rarity.R)
            break
          case 4:
            rarity.push(Rarity.N)
            break
        }
        break
      }
    }
  }

  return rarity
}

const words: number[] = [1, 59, 60, 61, 79, 80, 81, 89, 90, 91, 92, 97, 98, 99, 100]
console.log(getRandomRarity(words))
