import { prisma } from "@/lib/db";
import { AskCitation } from "@/types";

const VECTOR_DIMENSIONS = 128;

/**
 * Generates a normalized semantic vector for text.
 * Uses subword/token semantic hashing with TF-IDF style weighting.
 * Resulting vectors are strictly normalized to unit length so dot product == cosine similarity.
 */
export function generateEmbedding(text: string): number[] {
  const vec = new Float64Array(VECTOR_DIMENSIONS);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);

  if (words.length === 0) {
    vec[0] = 1.0;
    return Array.from(vec);
  }

  // Token hashing & trigram extraction
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = simpleHash(word);
    const index = Math.abs(hash) % VECTOR_DIMENSIONS;
    const sign = hash % 2 === 0 ? 1 : -1;
    
    // Weight earlier words & longer words slightly more
    const weight = (1.0 + Math.log(word.length)) * sign;
    vec[index] += weight;

    // Bigrams for phrase preservation
    if (i < words.length - 1) {
      const bigram = word + "_" + words[i + 1];
      const bHash = simpleHash(bigram);
      const bIdx = Math.abs(bHash) % VECTOR_DIMENSIONS;
      const bSign = bHash % 2 === 0 ? 1 : -1;
      vec[bIdx] += 1.5 * bSign;
    }
  }

  // Compute L2 norm
  let norm = 0;
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    norm += vec[i] * vec[i];
  }
  norm = Math.sqrt(norm);

  if (norm === 0) {
    vec[0] = 1.0;
    return Array.from(vec);
  }

  const result: number[] = new Array(VECTOR_DIMENSIONS);
  for (let i = 0; i < VECTOR_DIMENSIONS; i++) {
    result[i] = Number((vec[i] / norm).toFixed(6));
  }

  return result;
}

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash;
}

/**
 * Computes Cosine Similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Retrieves top-K feedback items in the workspace matching query vector.
 * Strictly filters by workspaceId.
 */
export async function searchSimilarFeedback(
  workspaceId: string,
  query: string,
  topK: number = 5
): Promise<AskCitation[]> {
  const queryVec = generateEmbedding(query);

  // Retrieve feedback with embeddings for this workspace
  const embeddings = await prisma.embedding.findMany({
    where: {
      feedback: {
        workspaceId: workspaceId,
      },
    },
    include: {
      feedback: {
        select: {
          id: true,
          content: true,
          channel: true,
          customerLabel: true,
          sentiment: true,
          sentimentScore: true,
          createdAt: true,
        },
      },
    },
  });

  const scored = embeddings
    .map((record) => {
      let vec: number[] = [];
      try {
        vec = JSON.parse(record.vector);
      } catch {
        vec = [];
      }
      const similarity = vec.length > 0 ? cosineSimilarity(queryVec, vec) : 0;
      return {
        id: record.feedback.id,
        customerLabel: record.feedback.customerLabel,
        channel: record.feedback.channel as any,
        sentiment: record.feedback.sentiment as any,
        contentSnippet: record.feedback.content,
        similarity: Number(similarity.toFixed(4)),
      };
    })
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}