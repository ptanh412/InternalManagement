"""
ML Models Package
Contains hybrid recommender and continuous learning models
"""

from .continuous_learning import ContinuousModelTrainer
from .hybrid_recommender import HybridRecommenderTrainer

__all__ = ['HybridRecommenderTrainer', 'ContinuousModelTrainer']

