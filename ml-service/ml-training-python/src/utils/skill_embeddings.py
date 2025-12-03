"""
Skill Embedding Service - AI-powered Skill Similarity Matching

Uses pre-trained sentence transformers to understand semantic similarity
between skills. For example, it knows that "Rust" is similar to "C++",
"React" is similar to "Vue", etc.

This provides much more sophisticated matching than simple category-based
or synonym matching.
"""

from typing import List, Dict, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
import structlog
import pickle
import os
from pathlib import Path

logger = structlog.get_logger(__name__)


class SkillEmbeddingService:
    """
    Service for calculating semantic similarity between skills using AI embeddings
    """

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2', cache_dir: str = 'models/skill_embeddings'):
        """
        Initialize the skill embedding service

        Args:
            model_name: HuggingFace model name for embeddings
                       'all-MiniLM-L6-v2' is lightweight (90MB) and fast
            cache_dir: Directory to cache embeddings
        """
        self.model_name = model_name
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Loading sentence transformer model: {model_name}")
        self.model = SentenceTransformer(model_name)
        logger.info("Sentence transformer model loaded successfully")

        # Cache for embeddings to avoid recomputing
        self.embedding_cache: Dict[str, np.ndarray] = {}
        self._load_cache()

    def _load_cache(self):
        """Load cached embeddings from disk"""
        cache_file = self.cache_dir / 'embedding_cache.pkl'
        if cache_file.exists():
            try:
                with open(cache_file, 'rb') as f:
                    self.embedding_cache = pickle.load(f)
                logger.info(f"Loaded {len(self.embedding_cache)} cached embeddings")
            except Exception as e:
                logger.warning(f"Failed to load embedding cache: {e}")
                self.embedding_cache = {}

    def _save_cache(self):
        """Save embeddings cache to disk"""
        cache_file = self.cache_dir / 'embedding_cache.pkl'
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(self.embedding_cache, f)
            logger.debug(f"Saved {len(self.embedding_cache)} embeddings to cache")
        except Exception as e:
            logger.warning(f"Failed to save embedding cache: {e}")

    def _normalize_skill(self, skill: str) -> str:
        """Normalize skill name for consistency"""
        return skill.lower().strip()

    def get_embedding(self, skill: str) -> np.ndarray:
        """
        Get embedding vector for a skill

        Args:
            skill: Skill name (e.g., "Rust", "C++", "React")

        Returns:
            numpy array of embedding vector (384 dimensions for all-MiniLM-L6-v2)
        """
        normalized = self._normalize_skill(skill)

        # Check cache first
        if normalized in self.embedding_cache:
            return self.embedding_cache[normalized]

        # Compute embedding
        embedding = self.model.encode(normalized, convert_to_numpy=True)

        # Cache it
        self.embedding_cache[normalized] = embedding

        # Save cache periodically (every 10 new embeddings)
        if len(self.embedding_cache) % 10 == 0:
            self._save_cache()

        return embedding

    def get_embeddings_batch(self, skills: List[str]) -> np.ndarray:
        """
        Get embeddings for multiple skills at once (more efficient)

        Args:
            skills: List of skill names

        Returns:
            numpy array of shape (len(skills), embedding_dim)
        """
        normalized = [self._normalize_skill(s) for s in skills]

        # Check which ones need computing
        uncached = [s for s in normalized if s not in self.embedding_cache]

        if uncached:
            # Compute embeddings for uncached skills
            new_embeddings = self.model.encode(uncached, convert_to_numpy=True)

            # Update cache
            for skill, embedding in zip(uncached, new_embeddings):
                self.embedding_cache[skill] = embedding

            self._save_cache()

        # Return all embeddings
        return np.array([self.embedding_cache[s] for s in normalized])

    def calculate_similarity(self, skill1: str, skill2: str) -> float:
        """
        Calculate semantic similarity between two skills

        Args:
            skill1: First skill name
            skill2: Second skill name

        Returns:
            Similarity score from 0.0 to 1.0

        Examples:
            >>> service.calculate_similarity("Rust", "C++")
            0.85  # High similarity - both systems programming

            >>> service.calculate_similarity("React", "Vue")
            0.88  # High similarity - both frontend frameworks

            >>> service.calculate_similarity("Python", "Photoshop")
            0.15  # Low similarity - different domains
        """
        emb1 = self.get_embedding(skill1)
        emb2 = self.get_embedding(skill2)

        # Cosine similarity
        similarity = np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

        # Normalize to 0-1 range (cosine similarity is -1 to 1)
        return float((similarity + 1) / 2)

    def find_similar_skills(self, skill: str, candidates: List[str], top_k: int = 5) -> List[Tuple[str, float]]:
        """
        Find most similar skills from a list of candidates

        Args:
            skill: Target skill to match
            candidates: List of candidate skills
            top_k: Number of top results to return

        Returns:
            List of (skill_name, similarity_score) tuples, sorted by similarity
        """
        if not candidates:
            return []

        target_emb = self.get_embedding(skill)
        candidate_embs = self.get_embeddings_batch(candidates)

        # Calculate similarities
        similarities = []
        for candidate, emb in zip(candidates, candidate_embs):
            sim = np.dot(target_emb, emb) / (np.linalg.norm(target_emb) * np.linalg.norm(emb))
            sim_normalized = (sim + 1) / 2  # Normalize to 0-1
            similarities.append((candidate, float(sim_normalized)))

        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]

    def calculate_skill_match_with_embeddings(
        self,
        user_skills: List[str],
        required_skills: List[str],
        exact_match_weight: float = 0.6,
        similarity_threshold: float = 0.7
    ) -> Dict[str, any]:
        """
        Calculate enhanced skill match using embeddings

        Args:
            user_skills: Skills the user has
            required_skills: Skills required for the task
            exact_match_weight: Weight for exact matches (0-1)
            similarity_threshold: Minimum similarity to consider a match (0-1)

        Returns:
            Dictionary with:
            - exact_match_score: Score from exact matches
            - similarity_match_score: Score from similar skills
            - overall_score: Combined score
            - matched_skills: List of exactly matched skills
            - similar_skills: List of (required, user, similarity) for similar matches
        """
        if not required_skills:
            return {
                'exact_match_score': 1.0,
                'similarity_match_score': 1.0,
                'overall_score': 1.0,
                'matched_skills': [],
                'similar_skills': []
            }

        if not user_skills:
            return {
                'exact_match_score': 0.0,
                'similarity_match_score': 0.0,
                'overall_score': 0.0,
                'matched_skills': [],
                'similar_skills': []
            }

        # Normalize skills
        user_skills_norm = [self._normalize_skill(s) for s in user_skills]
        required_skills_norm = [self._normalize_skill(s) for s in required_skills]

        matched_skills = []
        similar_skills = []
        exact_matches = 0
        similarity_scores = []

        # For each required skill, find best match in user skills
        for req_skill in required_skills_norm:
            # Check for exact match first
            if req_skill in user_skills_norm:
                exact_matches += 1
                matched_skills.append(req_skill)
            else:
                # Find most similar user skill
                best_match = None
                best_similarity = 0.0

                req_emb = self.get_embedding(req_skill)

                for user_skill in user_skills_norm:
                    user_emb = self.get_embedding(user_skill)
                    sim = np.dot(req_emb, user_emb) / (np.linalg.norm(req_emb) * np.linalg.norm(user_emb))
                    sim_normalized = (sim + 1) / 2

                    if sim_normalized > best_similarity:
                        best_similarity = sim_normalized
                        best_match = user_skill

                # If similarity is above threshold, count as partial match
                if best_similarity >= similarity_threshold:
                    similarity_scores.append(best_similarity)
                    similar_skills.append({
                        'required': req_skill,
                        'user_has': best_match,
                        'similarity': float(best_similarity)
                    })

        # Calculate scores
        exact_match_score = exact_matches / len(required_skills)

        if similarity_scores:
            similarity_match_score = sum(similarity_scores) / len(required_skills)
        else:
            similarity_match_score = 0.0

        # Combine scores
        overall_score = (
            exact_match_weight * exact_match_score +
            (1 - exact_match_weight) * similarity_match_score
        )

        return {
            'exact_match_score': float(exact_match_score),
            'similarity_match_score': float(similarity_match_score),
            'overall_score': float(overall_score),
            'matched_skills': matched_skills,
            'similar_skills': similar_skills
        }


# Global instance
_skill_embedding_service = None


def get_skill_embedding_service() -> SkillEmbeddingService:
    """Get or create global skill embedding service instance"""
    global _skill_embedding_service
    if _skill_embedding_service is None:
        _skill_embedding_service = SkillEmbeddingService()
    return _skill_embedding_service


if __name__ == "__main__":
    # Test the service
    service = SkillEmbeddingService()

    print("=== Testing Skill Similarity ===\n")

    # Test 1: Similar programming languages
    print("1. Rust vs C++:")
    sim = service.calculate_similarity("Rust", "C++")
    print(f"   Similarity: {sim:.2f}")

    print("\n2. React vs Vue:")
    sim = service.calculate_similarity("React", "Vue")
    print(f"   Similarity: {sim:.2f}")

    print("\n3. Python vs JavaScript:")
    sim = service.calculate_similarity("Python", "JavaScript")
    print(f"   Similarity: {sim:.2f}")

    print("\n4. Python vs Photoshop (unrelated):")
    sim = service.calculate_similarity("Python", "Photoshop")
    print(f"   Similarity: {sim:.2f}")

    # Test 2: Find similar skills
    print("\n\n=== Finding Similar Skills ===\n")
    candidates = ["C++", "Go", "Python", "JavaScript", "Photoshop", "C#"]
    similar = service.find_similar_skills("Rust", candidates, top_k=3)
    print("Most similar to 'Rust':")
    for skill, score in similar:
        print(f"  - {skill}: {score:.2f}")

    # Test 3: Enhanced matching
    print("\n\n=== Enhanced Skill Matching ===\n")
    user_skills = ["React", "JavaScript", "HTML/CSS", "AWS"]
    required_skills = ["Vue.js", "TypeScript", "Docker"]

    result = service.calculate_skill_match_with_embeddings(user_skills, required_skills)
    print(f"User Skills: {user_skills}")
    print(f"Required Skills: {required_skills}")
    print(f"\nExact Match Score: {result['exact_match_score']:.2f}")
    print(f"Similarity Match Score: {result['similarity_match_score']:.2f}")
    print(f"Overall Score: {result['overall_score']:.2f}")
    print(f"\nMatched Skills: {result['matched_skills']}")
    print("Similar Skills:")
    for match in result['similar_skills']:
        print(f"  - {match['required']} ≈ {match['user_has']} (similarity: {match['similarity']:.2f})")

