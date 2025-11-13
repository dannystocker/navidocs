/**
 * Analyzes document text to generate search term suggestions
 * Based on word frequency and relevance
 */

// Common words to exclude from suggestions (stop words)
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did',
  'having', 'may', 'such', 'being', 'does', 'done', 'another', 'much', 'must',
  'before', 'through', 'between', 'under', 'where', 'should', 'around', 'both',
  'during', 'however', 'without', 'against', 'within', 'though', 'whether',
  'figure', 'table', 'section', 'page', 'chapter', 'appendix'
])

// Minimum word length for suggestions
const MIN_WORD_LENGTH = 3

// Maximum number of suggestions to generate
const MAX_SUGGESTIONS = 20

/**
 * Extract words from text
 * @param {string} text - Document text
 * @returns {Array<string>} Array of normalized words
 */
function extractWords(text) {
  if (!text) return []

  // Convert to lowercase and extract words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
    .split(/\s+/)
    .filter(word => {
      // Filter out stop words and short words
      return word.length >= MIN_WORD_LENGTH &&
             !STOP_WORDS.has(word) &&
             !/^\d+$/.test(word) // Exclude pure numbers
    })

  return words
}

/**
 * Calculate word frequency in text
 * @param {Array<string>} words - Array of words
 * @returns {Map<string, number>} Map of word to frequency
 */
function calculateFrequency(words) {
  const frequency = new Map()

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1)
  }

  return frequency
}

/**
 * Score terms based on frequency and other factors
 * @param {Map<string, number>} frequency - Word frequency map
 * @param {string} text - Original text for context
 * @returns {Array<{term: string, score: number}>} Scored terms
 */
function scoreTerms(frequency, text) {
  const scored = []

  for (const [term, count] of frequency.entries()) {
    let score = count

    // Boost technical terms (contain numbers or hyphens)
    if (/\d/.test(term) || term.includes('-')) {
      score *= 1.5
    }

    // Boost capitalized terms in original text (likely proper nouns)
    const capitalizedRegex = new RegExp(`\\b${term.charAt(0).toUpperCase()}${term.slice(1)}\\b`, 'g')
    const capitalizedMatches = (text.match(capitalizedRegex) || []).length
    if (capitalizedMatches > 0) {
      score *= 1.3
    }

    // Boost longer terms (more specific)
    if (term.length >= 8) {
      score *= 1.2
    }

    // Penalize very common words (appearing in more than 20% of sentences)
    const sentences = text.split(/[.!?]+/).length
    if (count > sentences * 0.2) {
      score *= 0.7
    }

    scored.push({ term, score, count })
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored
}

/**
 * Generate search suggestions from document text
 * @param {string} text - Document text content
 * @param {number} limit - Maximum number of suggestions (default: 20)
 * @returns {Array<string>} Array of suggested search terms
 */
export function generateSearchSuggestions(text, limit = MAX_SUGGESTIONS) {
  if (!text || typeof text !== 'string') return []

  // Extract and normalize words
  const words = extractWords(text)

  if (words.length === 0) return []

  // Calculate frequency
  const frequency = calculateFrequency(words)

  // Score terms
  const scored = scoreTerms(frequency, text)

  // Extract top terms
  const suggestions = scored
    .slice(0, limit)
    .map(item => item.term)

  return suggestions
}

/**
 * Generate phrase suggestions (2-3 word combinations)
 * @param {string} text - Document text content
 * @param {number} limit - Maximum number of suggestions (default: 10)
 * @returns {Array<string>} Array of suggested phrases
 */
export function generatePhraseSuggestions(text, limit = 10) {
  if (!text || typeof text !== 'string') return []

  // Extract sentences
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const phrases = new Map()

  // Extract 2-3 word phrases
  for (const sentence of sentences) {
    const words = sentence
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= MIN_WORD_LENGTH)

    // 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`
      if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 1])) {
        phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
      }
    }

    // 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`
      if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 2])) {
        phrases.set(phrase, (phrases.get(phrase) || 0) + 1)
      }
    }
  }

  // Filter phrases that appear at least twice
  const filtered = Array.from(phrases.entries())
    .filter(([phrase, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([phrase]) => phrase)

  return filtered
}

/**
 * Combine single terms and phrases for comprehensive suggestions
 * @param {string} text - Document text content
 * @param {number} termLimit - Maximum single terms (default: 15)
 * @param {number} phraseLimit - Maximum phrases (default: 5)
 * @returns {Array<string>} Combined suggestions
 */
export function generateComprehensiveSuggestions(text, termLimit = 15, phraseLimit = 5) {
  const terms = generateSearchSuggestions(text, termLimit)
  const phrases = generatePhraseSuggestions(text, phraseLimit)

  // Combine and deduplicate
  const combined = [...phrases, ...terms]
  const unique = Array.from(new Set(combined))

  return unique.slice(0, termLimit + phraseLimit)
}

/**
 * Filter suggestions based on current query
 * @param {Array<string>} suggestions - Available suggestions
 * @param {string} query - Current search query
 * @returns {Array<string>} Filtered suggestions
 */
export function filterSuggestions(suggestions, query) {
  if (!query || query.trim().length === 0) {
    return suggestions
  }

  const normalizedQuery = query.toLowerCase().trim()

  // Filter suggestions that start with or contain the query
  return suggestions.filter(suggestion => {
    const normalized = suggestion.toLowerCase()
    return normalized.includes(normalizedQuery) ||
           normalized.startsWith(normalizedQuery)
  })
}
