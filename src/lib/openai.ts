import OpenAI from 'openai'

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

export async function generateAIResponse(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
  } = {}
) {
  const {
    model = 'gpt-4o-mini',
    temperature = 0.7,
    maxTokens = 4096,
  } = options

  const openai = getOpenAIClient()

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from AI')
  }

  return JSON.parse(content)
}
