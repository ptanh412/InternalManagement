"""
Model Evaluation and Visualization Utilities

This module provides comprehensive evaluation metrics and visualization
tools for the ML recommendation models.

Features:
- Confusion Matrix visualization
- ROC Curve and AUC
- Precision-Recall curves
- Feature importance analysis
- Learning curves
- Performance comparison charts
- Error analysis
"""

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_curve,
    roc_auc_score,
    precision_recall_curve,
    average_precision_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)
from sklearn.model_selection import learning_curve
import os
from datetime import datetime
import json
import joblib  # Added for loading trained models
import structlog

logger = structlog.get_logger(__name__)

# Set visualization style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)
plt.rcParams['font.size'] = 10


class ModelEvaluator:
    """
    Comprehensive model evaluation and visualization
    """

    def __init__(self, output_dir: str = "models/visualizations"):
        """
        Initialize evaluator

        Args:
            output_dir: Directory to save visualization plots
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        logger.info(f"Model evaluator initialized. Output dir: {output_dir}")

    def evaluate_model(self, y_true, y_pred, y_pred_proba=None,
                      model_name="Model", save_plots=True):
        """
        Comprehensive model evaluation

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Predicted probabilities (for ROC/PR curves)
            model_name: Name of the model being evaluated
            save_plots: Whether to save visualization plots

        Returns:
            Dictionary containing all evaluation metrics
        """
        logger.info(f"Evaluating {model_name}...")

        # Calculate metrics
        metrics = self._calculate_metrics(y_true, y_pred, y_pred_proba)

        # Print metrics report
        self._print_metrics_report(metrics, model_name)

        if save_plots:
            # Generate all visualizations
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            prefix = f"{model_name}_{timestamp}"

            print("     → Confusion Matrix...")
            # 1. Confusion Matrix
            self.plot_confusion_matrix(
                y_true, y_pred,
                title=f"Confusion Matrix - {model_name}",
                save_path=f"{self.output_dir}/{prefix}_confusion_matrix.png"
            )

            # 2. ROC Curve
            if y_pred_proba is not None:
                print("     → ROC Curve...")
                self.plot_roc_curve(
                    y_true, y_pred_proba,
                    title=f"ROC Curve - {model_name}",
                    save_path=f"{self.output_dir}/{prefix}_roc_curve.png"
                )

            # 3. Precision-Recall Curve
            if y_pred_proba is not None:
                print("     → Precision-Recall Curve...")
                self.plot_precision_recall_curve(
                    y_true, y_pred_proba,
                    title=f"Precision-Recall Curve - {model_name}",
                    save_path=f"{self.output_dir}/{prefix}_pr_curve.png"
                )

            # 4. Metrics Comparison Bar Chart
            print("     → Performance Metrics...")
            self.plot_metrics_comparison(
                metrics,
                title=f"Performance Metrics - {model_name}",
                save_path=f"{self.output_dir}/{prefix}_metrics.png"
            )

            # 5. Calibration Curve
            if y_pred_proba is not None:
                print("     → Calibration Curve...")
                self.plot_calibration_curve(
                    y_true, y_pred_proba,
                    title=f"Calibration Curve - {model_name}",
                    save_path=f"{self.output_dir}/{prefix}_calibration_curve.png"
                )

            # 6. Threshold Analysis
            if y_pred_proba is not None:
                print("     → Threshold Analysis...")
                self.plot_threshold_analysis(
                    y_true, y_pred_proba,
                    title=f"Threshold Analysis - {model_name}",
                    save_path=f"{self.output_dir}/{prefix}_threshold_analysis.png"
                )

            # 7. Error Analysis
            print("     → Error Analysis...")
            self.plot_error_analysis(
                y_true, y_pred, y_pred_proba,
                title=f"Error Analysis - {model_name}",
                save_path=f"{self.output_dir}/{prefix}_error_analysis.png"
            )

            # 8. Class Distribution
            print("     → Class Distribution...")
            self.plot_class_distribution(
                y_true, y_pred,
                title=f"Class Distribution - {model_name}",
                save_path=f"{self.output_dir}/{prefix}_class_distribution.png"
            )

            # Save metrics to JSON
            self._save_metrics_json(
                metrics,
                f"{self.output_dir}/{prefix}_metrics.json"
            )

        return metrics

    def _calculate_metrics(self, y_true, y_pred, y_pred_proba=None):
        """Calculate all evaluation metrics"""
        metrics = {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, average='weighted', zero_division=0),
            'recall': recall_score(y_true, y_pred, average='weighted', zero_division=0),
            'f1_score': f1_score(y_true, y_pred, average='weighted', zero_division=0)
        }

        # Add ROC AUC if probabilities provided
        if y_pred_proba is not None:
            try:
                # Handle binary classification
                if len(np.unique(y_true)) == 2:
                    # For binary, use probability of positive class
                    if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
                        proba_positive = y_pred_proba[:, 1]
                    else:
                        proba_positive = y_pred_proba
                    metrics['roc_auc'] = roc_auc_score(y_true, proba_positive)
                    metrics['avg_precision'] = average_precision_score(y_true, proba_positive)
                else:
                    metrics['roc_auc'] = roc_auc_score(y_true, y_pred_proba,
                                                      average='weighted', multi_class='ovr')
            except Exception as e:
                logger.warning(f"Could not calculate ROC AUC: {e}")
                metrics['roc_auc'] = None
                metrics['avg_precision'] = None

        # Add confusion matrix values
        cm = confusion_matrix(y_true, y_pred)
        if cm.shape == (2, 2):  # Binary classification
            tn, fp, fn, tp = cm.ravel()
            metrics['true_negatives'] = int(tn)
            metrics['false_positives'] = int(fp)
            metrics['false_negatives'] = int(fn)
            metrics['true_positives'] = int(tp)

            # Calculate additional metrics
            metrics['specificity'] = tn / (tn + fp) if (tn + fp) > 0 else 0
            metrics['sensitivity'] = tp / (tp + fn) if (tp + fn) > 0 else 0
            metrics['false_positive_rate'] = fp / (fp + tn) if (fp + tn) > 0 else 0
            metrics['false_negative_rate'] = fn / (fn + tp) if (fn + tp) > 0 else 0

        return metrics

    def _print_metrics_report(self, metrics, model_name):
        """Print formatted metrics report"""
        print("\n" + "=" * 70)
        print(f"{'EVALUATION REPORT':^70}")
        print(f"{model_name:^70}")
        print("=" * 70)

        print(f"\n{'Core Metrics':^70}")
        print("-" * 70)
        print(f"  Accuracy:          {metrics['accuracy']:.4f}  ({metrics['accuracy']*100:.2f}%)")
        print(f"  Precision:         {metrics['precision']:.4f}  ({metrics['precision']*100:.2f}%)")
        print(f"  Recall:            {metrics['recall']:.4f}  ({metrics['recall']*100:.2f}%)")
        print(f"  F1 Score:          {metrics['f1_score']:.4f}  ({metrics['f1_score']*100:.2f}%)")

        if metrics.get('roc_auc') is not None:
            print(f"  ROC AUC:           {metrics['roc_auc']:.4f}  ({metrics['roc_auc']*100:.2f}%)")

        if metrics.get('avg_precision') is not None:
            print(f"  Avg Precision:     {metrics['avg_precision']:.4f}  ({metrics['avg_precision']*100:.2f}%)")

        if 'true_positives' in metrics:
            print(f"\n{'Confusion Matrix Values':^70}")
            print("-" * 70)
            print(f"  True Positives:    {metrics['true_positives']}")
            print(f"  True Negatives:    {metrics['true_negatives']}")
            print(f"  False Positives:   {metrics['false_positives']}")
            print(f"  False Negatives:   {metrics['false_negatives']}")

            print(f"\n{'Additional Metrics':^70}")
            print("-" * 70)
            print(f"  Sensitivity (TPR): {metrics['sensitivity']:.4f}  ({metrics['sensitivity']*100:.2f}%)")
            print(f"  Specificity (TNR): {metrics['specificity']:.4f}  ({metrics['specificity']*100:.2f}%)")
            print(f"  FPR:               {metrics['false_positive_rate']:.4f}  ({metrics['false_positive_rate']*100:.2f}%)")
            print(f"  FNR:               {metrics['false_negative_rate']:.4f}  ({metrics['false_negative_rate']*100:.2f}%)")

        print("=" * 70 + "\n")

    def plot_confusion_matrix(self, y_true, y_pred, title="Confusion Matrix",
                             save_path=None, class_names=None):
        """
        Plot confusion matrix with enhanced visualization

        Args:
            y_true: True labels
            y_pred: Predicted labels
            title: Plot title
            save_path: Path to save the plot
            class_names: Names of classes for labels
        """
        # Calculate confusion matrix
        cm = confusion_matrix(y_true, y_pred)

        # Create figure
        fig, ax = plt.subplots(figsize=(10, 8))

        # Create heatmap
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   cbar_kws={'label': 'Count'},
                   square=True, linewidths=1, linecolor='gray',
                   ax=ax)

        # Labels
        if class_names is None:
            class_names = [f'Class {i}' for i in range(len(cm))]

        ax.set_xlabel('Predicted Label', fontsize=12, fontweight='bold')
        ax.set_ylabel('True Label', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.set_xticklabels(class_names, rotation=45, ha='right')
        ax.set_yticklabels(class_names, rotation=0)

        # Add percentage annotations
        cm_percent = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis] * 100
        for i in range(len(cm)):
            for j in range(len(cm)):
                text = ax.text(j + 0.5, i + 0.7, f'({cm_percent[i, j]:.1f}%)',
                             ha="center", va="center", color="darkblue",
                             fontsize=9, alpha=0.7)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Confusion matrix saved to {save_path}")

        plt.close()

    def plot_roc_curve(self, y_true, y_pred_proba, title="ROC Curve",
                      save_path=None):
        """
        Plot ROC curve with AUC

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            title: Plot title
            save_path: Path to save the plot
        """
        # Handle probability array shape
        if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
            y_scores = y_pred_proba[:, 1]  # Probability of positive class
        else:
            y_scores = y_pred_proba

        # Calculate ROC curve
        fpr, tpr, thresholds = roc_curve(y_true, y_scores)
        roc_auc = roc_auc_score(y_true, y_scores)

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 8))

        # Plot ROC curve
        ax.plot(fpr, tpr, color='darkorange', lw=2,
               label=f'ROC curve (AUC = {roc_auc:.3f})')

        # Plot diagonal reference line
        ax.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--',
               label='Random Classifier (AUC = 0.500)')

        # Fill area under curve
        ax.fill_between(fpr, tpr, alpha=0.2, color='darkorange')

        # Labels and formatting
        ax.set_xlim([0.0, 1.0])
        ax.set_ylim([0.0, 1.05])
        ax.set_xlabel('False Positive Rate', fontsize=12, fontweight='bold')
        ax.set_ylabel('True Positive Rate', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc="lower right", fontsize=11)
        ax.grid(True, alpha=0.3)

        # Add annotations for key points
        # Find threshold closest to 0.5
        idx_50 = np.argmin(np.abs(thresholds - 0.5))
        ax.plot(fpr[idx_50], tpr[idx_50], 'ro', markersize=8,
               label=f'Threshold=0.5: FPR={fpr[idx_50]:.3f}, TPR={tpr[idx_50]:.3f}')
        ax.legend(loc="lower right", fontsize=10)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"ROC curve saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_precision_recall_curve(self, y_true, y_pred_proba,
                                    title="Precision-Recall Curve",
                                    save_path=None):
        """
        Plot Precision-Recall curve

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            title: Plot title
            save_path: Path to save the plot
        """
        # Handle probability array shape
        if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
            y_scores = y_pred_proba[:, 1]
        else:
            y_scores = y_pred_proba

        # Calculate PR curve
        precision, recall, thresholds = precision_recall_curve(y_true, y_scores)
        avg_precision = average_precision_score(y_true, y_scores)

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 8))

        # Plot PR curve
        ax.plot(recall, precision, color='darkgreen', lw=2,
               label=f'PR curve (AP = {avg_precision:.3f})')

        # Plot baseline (random classifier)
        baseline = np.sum(y_true) / len(y_true)
        ax.plot([0, 1], [baseline, baseline], color='navy', lw=2,
               linestyle='--', label=f'Random Classifier (AP = {baseline:.3f})')

        # Fill area under curve
        ax.fill_between(recall, precision, alpha=0.2, color='darkgreen')

        # Labels and formatting
        ax.set_xlim([0.0, 1.0])
        ax.set_ylim([0.0, 1.05])
        ax.set_xlabel('Recall', fontsize=12, fontweight='bold')
        ax.set_ylabel('Precision', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc="lower left", fontsize=11)
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Precision-Recall curve saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_metrics_comparison(self, metrics, title="Performance Metrics",
                               save_path=None):
        """
        Plot bar chart comparing different metrics

        Args:
            metrics: Dictionary of metric names and values
            title: Plot title
            save_path: Path to save the plot
        """
        # Select metrics to plot
        plot_metrics = {
            'Accuracy': metrics.get('accuracy', 0),
            'Precision': metrics.get('precision', 0),
            'Recall': metrics.get('recall', 0),
            'F1 Score': metrics.get('f1_score', 0)
        }

        if metrics.get('roc_auc') is not None:
            plot_metrics['ROC AUC'] = metrics['roc_auc']

        # Create plot
        fig, ax = plt.subplots(figsize=(12, 6))

        metric_names = list(plot_metrics.keys())
        metric_values = list(plot_metrics.values())

        # Create bars
        bars = ax.bar(metric_names, metric_values, color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'])

        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{height:.3f}\n({height*100:.1f}%)',
                   ha='center', va='bottom', fontsize=11, fontweight='bold')

        # Formatting
        ax.set_ylim([0, 1.1])
        ax.set_ylabel('Score', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.grid(True, axis='y', alpha=0.3)

        # Add horizontal line at 0.8 (good threshold)
        ax.axhline(y=0.8, color='green', linestyle='--', alpha=0.5,
                  label='Good Performance Threshold (0.8)')
        ax.legend(loc='lower right')

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Metrics comparison saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_feature_importance(self, feature_names, importance_values,
                               title="Feature Importance",
                               save_path=None, top_n=20):
        """
        Plot feature importance bar chart

        Args:
            feature_names: List of feature names
            importance_values: List of importance values
            title: Plot title
            save_path: Path to save the plot
            top_n: Number of top features to display
        """
        # Create dataframe and sort
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importance_values
        }).sort_values('importance', ascending=False)

        # Select top N features
        top_features = importance_df.head(top_n)

        # Create plot
        fig, ax = plt.subplots(figsize=(12, 8))

        # Create horizontal bar chart
        bars = ax.barh(range(len(top_features)), top_features['importance'],
                      color=plt.cm.viridis(np.linspace(0, 1, len(top_features))))

        # Add value labels
        for i, (idx, row) in enumerate(top_features.iterrows()):
            ax.text(row['importance'], i, f"  {row['importance']:.4f}",
                   va='center', fontsize=9)

        # Formatting
        ax.set_yticks(range(len(top_features)))
        ax.set_yticklabels(top_features['feature'])
        ax.set_xlabel('Importance Score', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.grid(True, axis='x', alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Feature importance plot saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_learning_curves(self, estimator, X, y, title="Learning Curves",
                            save_path=None, cv=5):
        """
        Plot learning curves to analyze model performance vs training size

        Args:
            estimator: Trained model
            X: Feature matrix
            y: Target variable
            title: Plot title
            save_path: Path to save the plot
            cv: Number of cross-validation folds
        """
        # Calculate learning curves
        train_sizes, train_scores, test_scores = learning_curve(
            estimator, X, y, cv=cv, n_jobs=-1,
            train_sizes=np.linspace(0.1, 1.0, 10),
            scoring='f1_weighted'
        )

        # Calculate mean and std
        train_mean = np.mean(train_scores, axis=1)
        train_std = np.std(train_scores, axis=1)
        test_mean = np.mean(test_scores, axis=1)
        test_std = np.std(test_scores, axis=1)

        # Create plot
        fig, ax = plt.subplots(figsize=(10, 6))

        # Plot training scores
        ax.plot(train_sizes, train_mean, 'o-', color='r', label='Training score')
        ax.fill_between(train_sizes, train_mean - train_std, train_mean + train_std,
                       alpha=0.1, color='r')

        # Plot validation scores
        ax.plot(train_sizes, test_mean, 'o-', color='g', label='Cross-validation score')
        ax.fill_between(train_sizes, test_mean - test_std, test_mean + test_std,
                       alpha=0.1, color='g')

        # Formatting
        ax.set_xlabel('Training Set Size', fontsize=12, fontweight='bold')
        ax.set_ylabel('F1 Score', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc='lower right', fontsize=11)
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Learning curves saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_prediction_distribution(self, y_pred_proba, y_true,
                                     title="Prediction Score Distribution",
                                     save_path=None):
        """
        Plot distribution of prediction scores for positive/negative classes

        Args:
            y_pred_proba: Predicted probabilities
            y_true: True labels
            title: Plot title
            save_path: Path to save the plot
        """
        # Handle probability array shape
        if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
            y_scores = y_pred_proba[:, 1]
        else:
            y_scores = y_pred_proba

        # Create plot
        fig, ax = plt.subplots(figsize=(12, 6))

        # Plot distributions
        ax.hist(y_scores[y_true == 0], bins=30, alpha=0.5, color='red',
               label='Negative Class (y=0)', edgecolor='black')
        ax.hist(y_scores[y_true == 1], bins=30, alpha=0.5, color='green',
               label='Positive Class (y=1)', edgecolor='black')

        # Add vertical line at threshold
        ax.axvline(x=0.5, color='blue', linestyle='--', linewidth=2,
                  label='Decision Threshold (0.5)')

        # Formatting
        ax.set_xlabel('Prediction Score', fontsize=12, fontweight='bold')
        ax.set_ylabel('Frequency', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc='upper center', fontsize=11)
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Prediction distribution saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_calibration_curve(self, y_true, y_pred_proba,
                               title="Calibration Curve",
                               save_path=None, n_bins=10):
        """
        Plot calibration curve showing reliability of probability estimates

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            title: Plot title
            save_path: Path to save the plot
            n_bins: Number of bins for calibration
        """
        from sklearn.calibration import calibration_curve

        # Handle probability array shape
        if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
            y_scores = y_pred_proba[:, 1]
        else:
            y_scores = y_pred_proba

        # Calculate calibration curve
        fraction_of_positives, mean_predicted_value = calibration_curve(
            y_true, y_scores, n_bins=n_bins, strategy='uniform'
        )

        # Create plot
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

        # Plot 1: Calibration Curve
        ax1.plot(mean_predicted_value, fraction_of_positives, 's-',
                color='darkorange', linewidth=2, markersize=8,
                label='Model Calibration')
        ax1.plot([0, 1], [0, 1], 'k--', linewidth=2,
                label='Perfectly Calibrated')

        ax1.set_xlabel('Mean Predicted Probability', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Fraction of Positives', fontsize=12, fontweight='bold')
        ax1.set_title('Calibration Curve', fontsize=13, fontweight='bold')
        ax1.legend(loc='lower right', fontsize=10)
        ax1.grid(True, alpha=0.3)
        ax1.set_xlim([0.0, 1.0])
        ax1.set_ylim([0.0, 1.0])

        # Plot 2: Histogram of predicted probabilities
        ax2.hist(y_scores[y_true == 0], bins=30, alpha=0.5, color='red',
                label='Negative Class', edgecolor='black', density=True)
        ax2.hist(y_scores[y_true == 1], bins=30, alpha=0.5, color='green',
                label='Positive Class', edgecolor='black', density=True)
        ax2.axvline(x=0.5, color='blue', linestyle='--', linewidth=2,
                   label='Threshold (0.5)')

        ax2.set_xlabel('Predicted Probability', fontsize=12, fontweight='bold')
        ax2.set_ylabel('Density', fontsize=12, fontweight='bold')
        ax2.set_title('Prediction Distribution by Class', fontsize=13, fontweight='bold')
        ax2.legend(loc='upper center', fontsize=10)
        ax2.grid(True, alpha=0.3)

        fig.suptitle(title, fontsize=14, fontweight='bold', y=1.02)
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Calibration curve saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_threshold_analysis(self, y_true, y_pred_proba,
                                title="Threshold Analysis",
                                save_path=None):
        """
        Plot metrics at different decision thresholds

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            title: Plot title
            save_path: Path to save the plot
        """
        from sklearn.metrics import precision_recall_curve, roc_curve

        # Handle probability array shape
        if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
            y_scores = y_pred_proba[:, 1]
        else:
            y_scores = y_pred_proba

        # Calculate metrics at different thresholds
        thresholds = np.linspace(0, 1, 100)
        precisions = []
        recalls = []
        f1_scores = []
        accuracies = []

        for threshold in thresholds:
            y_pred_thresh = (y_scores >= threshold).astype(int)

            if len(np.unique(y_pred_thresh)) > 1:
                precision = precision_score(y_true, y_pred_thresh, zero_division=0)
                recall = recall_score(y_true, y_pred_thresh, zero_division=0)
                f1 = f1_score(y_true, y_pred_thresh, zero_division=0)
            else:
                precision = recall = f1 = 0

            accuracy = accuracy_score(y_true, y_pred_thresh)

            precisions.append(precision)
            recalls.append(recall)
            f1_scores.append(f1)
            accuracies.append(accuracy)

        # Find optimal threshold (max F1)
        optimal_idx = np.argmax(f1_scores)
        optimal_threshold = thresholds[optimal_idx]

        # Create plot
        fig, ax = plt.subplots(figsize=(12, 7))

        ax.plot(thresholds, precisions, 'b-', linewidth=2, label='Precision')
        ax.plot(thresholds, recalls, 'g-', linewidth=2, label='Recall')
        ax.plot(thresholds, f1_scores, 'r-', linewidth=2, label='F1 Score')
        ax.plot(thresholds, accuracies, 'm-', linewidth=2, label='Accuracy')

        # Mark optimal threshold
        ax.axvline(x=optimal_threshold, color='orange', linestyle='--',
                  linewidth=2, label=f'Optimal Threshold ({optimal_threshold:.3f})')
        ax.axvline(x=0.5, color='gray', linestyle=':', linewidth=2,
                  label='Default Threshold (0.5)')

        ax.set_xlabel('Decision Threshold', fontsize=12, fontweight='bold')
        ax.set_ylabel('Score', fontsize=12, fontweight='bold')
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        ax.legend(loc='best', fontsize=11)
        ax.grid(True, alpha=0.3)
        ax.set_xlim([0, 1])
        ax.set_ylim([0, 1.05])

        # Add annotation for optimal point
        ax.annotate(f'Max F1={f1_scores[optimal_idx]:.3f}\n@ {optimal_threshold:.3f}',
                   xy=(optimal_threshold, f1_scores[optimal_idx]),
                   xytext=(optimal_threshold + 0.15, f1_scores[optimal_idx] - 0.15),
                   fontsize=10, fontweight='bold',
                   bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7),
                   arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0',
                                 color='orange', lw=2))

        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Threshold analysis saved to {save_path}")

        # plt.show()
        plt.close()

        return optimal_threshold

    def plot_error_analysis(self, y_true, y_pred, y_pred_proba=None,
                           title="Error Analysis",
                           save_path=None):
        """
        Analyze and visualize prediction errors

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_pred_proba: Predicted probabilities (optional)
            title: Plot title
            save_path: Path to save the plot
        """
        # Calculate error types
        cm = confusion_matrix(y_true, y_pred)

        if cm.shape != (2, 2):
            print("Error analysis only supports binary classification")
            return

        tn, fp, fn, tp = cm.ravel()

        # Create figure with subplots
        fig = plt.figure(figsize=(16, 10))
        gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)

        # Plot 1: Error Distribution Pie Chart
        ax1 = fig.add_subplot(gs[0, 0])
        labels = ['True Positives', 'True Negatives', 'False Positives', 'False Negatives']
        sizes = [tp, tn, fp, fn]
        colors = ['#2ecc71', '#3498db', '#e74c3c', '#e67e22']
        explode = (0, 0, 0.1, 0.1)  # Explode errors

        ax1.pie(sizes, explode=explode, labels=labels, colors=colors,
               autopct='%1.1f%%', shadow=True, startangle=90)
        ax1.set_title('Prediction Distribution', fontsize=12, fontweight='bold')

        # Plot 2: Error Rates Bar Chart
        ax2 = fig.add_subplot(gs[0, 1])
        error_types = ['True\nPositive', 'True\nNegative', 'False\nPositive', 'False\nNegative']
        error_counts = [tp, tn, fp, fn]
        bar_colors = ['green', 'blue', 'red', 'orange']

        bars = ax2.bar(error_types, error_counts, color=bar_colors, alpha=0.7, edgecolor='black')
        for bar in bars:
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}',
                    ha='center', va='bottom', fontweight='bold')

        ax2.set_ylabel('Count', fontsize=11, fontweight='bold')
        ax2.set_title('Counts by Type', fontsize=12, fontweight='bold')
        ax2.grid(True, axis='y', alpha=0.3)

        # Plot 3: Error Metrics
        ax3 = fig.add_subplot(gs[0, 2])
        ax3.axis('off')

        total = tp + tn + fp + fn
        accuracy = (tp + tn) / total
        error_rate = (fp + fn) / total
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0

        metrics_text = f"""
        Error Metrics Summary
        ━━━━━━━━━━━━━━━━━━━━━━
        
        Total Samples:      {total}
        Correct:            {tp + tn} ({accuracy*100:.1f}%)
        Errors:             {fp + fn} ({error_rate*100:.1f}%)
        
        Error Breakdown:
        • False Positives:  {fp} ({fpr*100:.1f}%)
        • False Negatives:  {fn} ({fnr*100:.1f}%)
        
        Error Impact:
        • Type I Error:     {fpr:.4f}
        • Type II Error:    {fnr:.4f}
        """

        ax3.text(0.1, 0.5, metrics_text, fontsize=11, family='monospace',
                verticalalignment='center')
        ax3.set_title('Error Summary', fontsize=12, fontweight='bold', pad=20)

        # Plot 4-6: Confidence analysis if probabilities available
        if y_pred_proba is not None:
            if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] == 2:
                y_scores = y_pred_proba[:, 1]
            else:
                y_scores = y_pred_proba

            # Plot 4: FP confidence distribution
            ax4 = fig.add_subplot(gs[1, 0])
            fp_mask = (y_pred == 1) & (y_true == 0)
            if fp_mask.sum() > 0:
                ax4.hist(y_scores[fp_mask], bins=20, color='red', alpha=0.7,
                        edgecolor='black')
                ax4.axvline(x=y_scores[fp_mask].mean(), color='darkred',
                           linestyle='--', linewidth=2, label=f'Mean: {y_scores[fp_mask].mean():.3f}')
                ax4.set_xlabel('Prediction Confidence', fontsize=10, fontweight='bold')
                ax4.set_ylabel('Count', fontsize=10, fontweight='bold')
                ax4.set_title('False Positives Confidence', fontsize=11, fontweight='bold')
                ax4.legend()
                ax4.grid(True, alpha=0.3)
            else:
                ax4.text(0.5, 0.5, 'No False Positives', ha='center', va='center')
                ax4.set_title('False Positives Confidence', fontsize=11, fontweight='bold')

            # Plot 5: FN confidence distribution
            ax5 = fig.add_subplot(gs[1, 1])
            fn_mask = (y_pred == 0) & (y_true == 1)
            if fn_mask.sum() > 0:
                ax5.hist(y_scores[fn_mask], bins=20, color='orange', alpha=0.7,
                        edgecolor='black')
                ax5.axvline(x=y_scores[fn_mask].mean(), color='darkorange',
                           linestyle='--', linewidth=2, label=f'Mean: {y_scores[fn_mask].mean():.3f}')
                ax5.set_xlabel('Prediction Confidence', fontsize=10, fontweight='bold')
                ax5.set_ylabel('Count', fontsize=10, fontweight='bold')
                ax5.set_title('False Negatives Confidence', fontsize=11, fontweight='bold')
                ax5.legend()
                ax5.grid(True, alpha=0.3)
            else:
                ax5.text(0.5, 0.5, 'No False Negatives', ha='center', va='center')
                ax5.set_title('False Negatives Confidence', fontsize=11, fontweight='bold')

            # Plot 6: Correct predictions confidence
            ax6 = fig.add_subplot(gs[1, 2])
            correct_mask = y_pred == y_true
            if correct_mask.sum() > 0:
                ax6.hist(y_scores[correct_mask], bins=30, color='green', alpha=0.7,
                        edgecolor='black')
                ax6.axvline(x=y_scores[correct_mask].mean(), color='darkgreen',
                           linestyle='--', linewidth=2, label=f'Mean: {y_scores[correct_mask].mean():.3f}')
                ax6.set_xlabel('Prediction Confidence', fontsize=10, fontweight='bold')
                ax6.set_ylabel('Count', fontsize=10, fontweight='bold')
                ax6.set_title('Correct Predictions Confidence', fontsize=11, fontweight='bold')
                ax6.legend()
                ax6.grid(True, alpha=0.3)

        fig.suptitle(title, fontsize=16, fontweight='bold', y=0.98)

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Error analysis saved to {save_path}")

        # plt.show()
        plt.close()

    def plot_class_distribution(self, y_true, y_pred,
                                title="Class Distribution Comparison",
                                save_path=None):
        """
        Compare actual vs predicted class distributions

        Args:
            y_true: True labels
            y_pred: Predicted labels
            title: Plot title
            save_path: Path to save the plot
        """
        fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(16, 5))

        # Plot 1: Actual distribution
        unique, counts = np.unique(y_true, return_counts=True)
        ax1.bar(unique, counts, color='skyblue', edgecolor='black', alpha=0.7)
        for i, (u, c) in enumerate(zip(unique, counts)):
            ax1.text(u, c, f'{c}\n({c/len(y_true)*100:.1f}%)',
                    ha='center', va='bottom', fontweight='bold')
        ax1.set_xlabel('Class', fontsize=12, fontweight='bold')
        ax1.set_ylabel('Count', fontsize=12, fontweight='bold')
        ax1.set_title('Actual Distribution', fontsize=13, fontweight='bold')
        ax1.grid(True, axis='y', alpha=0.3)

        # Plot 2: Predicted distribution
        unique, counts = np.unique(y_pred, return_counts=True)
        ax2.bar(unique, counts, color='lightcoral', edgecolor='black', alpha=0.7)
        for i, (u, c) in enumerate(zip(unique, counts)):
            ax2.text(u, c, f'{c}\n({c/len(y_pred)*100:.1f}%)',
                    ha='center', va='bottom', fontweight='bold')
        ax2.set_xlabel('Class', fontsize=12, fontweight='bold')
        ax2.set_ylabel('Count', fontsize=12, fontweight='bold')
        ax2.set_title('Predicted Distribution', fontsize=13, fontweight='bold')
        ax2.grid(True, axis='y', alpha=0.3)

        # Plot 3: Side-by-side comparison
        unique_true, counts_true = np.unique(y_true, return_counts=True)
        unique_pred, counts_pred = np.unique(y_pred, return_counts=True)

        x = np.arange(len(unique_true))
        width = 0.35

        ax3.bar(x - width/2, counts_true, width, label='Actual',
               color='skyblue', edgecolor='black', alpha=0.7)
        ax3.bar(x + width/2, counts_pred, width, label='Predicted',
               color='lightcoral', edgecolor='black', alpha=0.7)

        ax3.set_xlabel('Class', fontsize=12, fontweight='bold')
        ax3.set_ylabel('Count', fontsize=12, fontweight='bold')
        ax3.set_title('Comparison', fontsize=13, fontweight='bold')
        ax3.set_xticks(x)
        ax3.set_xticklabels(unique_true)
        ax3.legend()
        ax3.grid(True, axis='y', alpha=0.3)

        fig.suptitle(title, fontsize=14, fontweight='bold', y=1.02)
        plt.tight_layout()

        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            logger.info(f"Class distribution comparison saved to {save_path}")

        # plt.show()
        plt.close()

    def _save_metrics_json(self, metrics, save_path):
        """Save metrics to JSON file"""
        # Convert numpy types to Python types
        serializable_metrics = {}
        for key, value in metrics.items():
            if isinstance(value, (np.integer, np.floating)):
                serializable_metrics[key] = float(value)
            elif isinstance(value, (int, float, str, bool, type(None))):
                serializable_metrics[key] = value

        # Add timestamp
        serializable_metrics['evaluation_timestamp'] = datetime.now().isoformat()

        with open(save_path, 'w') as f:
            json.dump(serializable_metrics, f, indent=2)

        logger.info(f"Metrics saved to {save_path}")


def compare_models(models_metrics: dict, save_path=None):
    """
    Compare multiple models side by side

    Args:
        models_metrics: Dictionary of {model_name: metrics_dict}
        save_path: Path to save comparison plot
    """
    # Create comparison dataframe
    comparison_data = []
    for model_name, metrics in models_metrics.items():
        comparison_data.append({
            'Model': model_name,
            'Accuracy': metrics.get('accuracy', 0),
            'Precision': metrics.get('precision', 0),
            'Recall': metrics.get('recall', 0),
            'F1 Score': metrics.get('f1_score', 0),
            'ROC AUC': metrics.get('roc_auc', 0)
        })

    df = pd.DataFrame(comparison_data)

    # Create grouped bar chart
    fig, ax = plt.subplots(figsize=(14, 8))

    x = np.arange(len(df))
    width = 0.15

    metrics_to_plot = ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC AUC']
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']

    for i, (metric, color) in enumerate(zip(metrics_to_plot, colors)):
        offset = width * (i - 2)
        bars = ax.bar(x + offset, df[metric], width, label=metric, color=color)

        # Add value labels
        for bar in bars:
            height = bar.get_height()
            if height > 0:
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.3f}',
                       ha='center', va='bottom', fontsize=8, rotation=90)

    ax.set_ylabel('Score', fontsize=12, fontweight='bold')
    ax.set_title('Model Performance Comparison', fontsize=14, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(df['Model'])
    ax.legend(loc='upper left', fontsize=10)
    ax.grid(True, axis='y', alpha=0.3)
    ax.set_ylim([0, 1.1])

    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"Model comparison saved to {save_path}")

    # plt.show()
    plt.close()


def evaluate_trained_models(models_dir: str = "models", use_real_data: bool = True):
    """
    Evaluate actual trained models from the system

    Args:
        models_dir: Directory containing trained models
        use_real_data: If True, collect real data; if False, use synthetic data

    Returns:
        Dictionary containing all evaluation metrics
    """
    import sys
    import os

    # Add parent directory to path for imports
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(os.path.dirname(current_dir))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    print("\n" + "=" * 70)
    print("EVALUATING ACTUAL TRAINED MODELS FROM SYSTEM")
    print("=" * 70)
    print()

    # Check if models exist
    content_model_path = os.path.join(models_dir, "content_model.pkl")
    metadata_path = os.path.join(models_dir, "model_metadata.pkl")
    scaler_path = os.path.join(models_dir, "feature_scaler.pkl")

    if not os.path.exists(content_model_path):
        print(f"⚠️  No trained models found at {models_dir}")
        print("Please train models first using: python train_models.py --real")
        print("\nFalling back to demo mode with synthetic data...")
        return evaluate_demo_models()

    try:
        # Load trained models
        print("Loading trained models...")
        content_model = joblib.load(content_model_path)
        feature_scaler = joblib.load(scaler_path)
        model_metadata = joblib.load(metadata_path)

        print(f"✓ Content model loaded: {type(content_model).__name__}")
        print(f"✓ Feature scaler loaded")
        print(f"✓ Metadata loaded")
        print()

        # Display model metadata
        print("=" * 70)
        print("MODEL METADATA")
        print("=" * 70)
        for key, value in model_metadata.items():
            if key != 'feature_columns':  # Skip long list
                print(f"  {key}: {value}")
        print()

        # Get test data
        if use_real_data:
            print("Collecting real test data from databases...")
            try:
                from src.data.data_collector import MultiDatabaseDataCollector, SyntheticDataGenerator

                collector = MultiDatabaseDataCollector()
                connection_status = collector.test_connections()

                # Try to collect real data
                training_data = collector.collect_comprehensive_training_data(months_back=3)

                if len(training_data) < 50:
                    print(f"⚠️  Insufficient real data ({len(training_data)} records)")
                    print("Using synthetic data for evaluation...")
                    generator = SyntheticDataGenerator()
                    training_data = generator.generate_comprehensive_dataset()
                else:
                    print(f"✓ Collected {len(training_data)} real records")

            except Exception as e:
                print(f"⚠️  Could not collect real data: {e}")
                print("Using synthetic data for evaluation...")
                from src.data.data_collector import SyntheticDataGenerator
                generator = SyntheticDataGenerator()
                training_data = generator.generate_comprehensive_dataset()
        else:
            print("Using synthetic data for evaluation...")
            from src.data.data_collector import SyntheticDataGenerator
            generator = SyntheticDataGenerator()
            training_data = generator.generate_comprehensive_dataset()

        print(f"Total data samples: {len(training_data)}")
        print()

        # Preprocess data using the same pipeline
        print("Preprocessing data...")
        from src.models.hybrid_recommender import HybridRecommenderTrainer

        trainer = HybridRecommenderTrainer()
        processed_data = trainer._preprocess_data(training_data)
        X, y = trainer._prepare_features_and_targets(processed_data)

        # Use the saved feature columns to ensure consistency
        feature_columns = model_metadata.get('feature_columns', X.columns.tolist())

        # Ensure we have the same features
        missing_features = set(feature_columns) - set(X.columns)
        if missing_features:
            print(f"⚠️  Adding missing features: {missing_features}")
            for feat in missing_features:
                X[feat] = 0

        # Select only the features used in training
        X = X[feature_columns]

        print(f"✓ Features prepared: {X.shape}")
        print(f"✓ Target prepared: {y.shape}")
        print(f"  Target distribution: {y.value_counts().to_dict()}")
        print()

        # Split into train/test
        from sklearn.model_selection import train_test_split

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42,
            stratify=y if y.nunique() > 1 else None
        )

        print(f"Data split:")
        print(f"  Training: {len(X_train)} samples")
        print(f"  Testing: {len(X_test)} samples")
        print()

        # Scale features
        X_test_scaled = feature_scaler.transform(X_test)
        X_train_scaled = feature_scaler.transform(X_train)

        # Make predictions
        print("Making predictions on test set...")
        y_pred = content_model.predict(X_test_scaled)

        if hasattr(content_model, 'predict_proba') and content_model.n_classes_ > 1:
            y_pred_proba = content_model.predict_proba(X_test_scaled)
        else:
            y_pred_proba = None
            print("⚠️  Model does not support probability predictions")

        print(f"✓ Predictions made: {len(y_pred)} samples")
        print()

        # Evaluate model
        evaluator = ModelEvaluator()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        model_name = f"HybridRecommender_RealData_{timestamp}"

        print("=" * 70)
        print("RUNNING COMPREHENSIVE EVALUATION")
        print("=" * 70)
        print()

        print("Generating visualizations:")
        print("  1. Confusion Matrix...")

        metrics = evaluator.evaluate_model(
            y_test, y_pred, y_pred_proba,
            model_name=model_name,
            save_plots=True
        )

        print("  ✓ Core visualizations complete!")
        print()

        # Plot feature importance if available
        if hasattr(content_model, 'feature_importances_'):
            print("  2. Feature Importance...")
            evaluator.plot_feature_importance(
                feature_columns,
                content_model.feature_importances_,
                title=f"Feature Importance - Actual Trained Model",
                save_path=f"models/visualizations/{model_name}_feature_importance.png",
                top_n=20
            )
            print("     ✓ Feature importance saved")

        # Plot learning curves
        print("  3. Learning Curves...")
        evaluator.plot_learning_curves(
            content_model, X_train_scaled, y_train,
            title=f"Learning Curves - Actual Trained Model",
            save_path=f"models/visualizations/{model_name}_learning_curves.png",
            cv=5
        )
        print("     ✓ Learning curves saved")

        # Plot prediction distribution
        if y_pred_proba is not None:
            print("  4. Prediction Distribution...")
            evaluator.plot_prediction_distribution(
                y_pred_proba, y_test,
                title=f"Prediction Distribution - Actual Trained Model",
                save_path=f"models/visualizations/{model_name}_prediction_dist.png"
            )
            print("     ✓ Prediction distribution saved")

        print()
        print("=" * 70)
        print("LISTING ALL GENERATED FILES")
        print("=" * 70)
        print()

        # List all generated visualization files
        import glob
        vis_pattern = f"models/visualizations/{model_name}*.png"
        vis_files = sorted(glob.glob(vis_pattern))

        if vis_files:
            print(f"Total visualizations created: {len(vis_files)}")
            print()
            for i, filepath in enumerate(vis_files, 1):
                filename = os.path.basename(filepath)
                filesize = os.path.getsize(filepath) / 1024  # KB
                print(f"  {i:2d}. {filename} ({filesize:.1f} KB)")
        else:
            print("⚠️  No visualization files found!")

        print()
        print("=" * 70)
        print("EVALUATION COMPLETE!")
        print("=" * 70)
        print()
        print(f"Model evaluated: {type(content_model).__name__}")
        print(f"Training date: {model_metadata.get('training_date', 'Unknown')}")
        print(f"Model version: {model_metadata.get('model_version', 'Unknown')}")
        print()
        print("📊 Visualizations saved to: models/visualizations/")
        print(f"📄 Metrics saved to: models/visualizations/{model_name}_metrics.json")
        print()
        print("To view all charts:")
        print(f"  cd models/visualizations")
        print(f"  open {model_name}*.png")
        print()

        return metrics

    except Exception as e:
        print(f"\n❌ Error evaluating trained models: {e}")
        import traceback
        traceback.print_exc()
        print("\nFalling back to demo mode...")
        return evaluate_demo_models()


def evaluate_demo_models():
    """
    Fallback function to evaluate demo models with synthetic data
    """
    print("\n" + "=" * 70)
    print("DEMO MODE: Evaluating with Synthetic Data")
    print("=" * 70)
    print()

    from sklearn.datasets import make_classification
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split

    # Generate sample data
    print("Generating synthetic classification data...")
    X, y = make_classification(
        n_samples=1000,
        n_features=20,
        n_informative=15,
        n_redundant=5,
        random_state=42
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"✓ Generated {len(X)} samples with {X.shape[1]} features")
    print(f"  Training: {len(X_train)} samples")
    print(f"  Testing: {len(X_test)} samples")
    print()

    # Train model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        random_state=42
    )
    model.fit(X_train, y_train)
    print("✓ Model trained")
    print()

    # Make predictions
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)

    # Evaluate
    evaluator = ModelEvaluator()
    metrics = evaluator.evaluate_model(
        y_test, y_pred, y_pred_proba,
        model_name="RandomForest_Demo",
        save_plots=True
    )

    # Plot feature importance
    feature_names = [f'feature_{i}' for i in range(X.shape[1])]
    evaluator.plot_feature_importance(
        feature_names,
        model.feature_importances_,
        title="Feature Importance - Demo Model",
        save_path="models/visualizations/demo_feature_importance.png"
    )

    # Plot learning curves
    evaluator.plot_learning_curves(
        model, X_train, y_train,
        title="Learning Curves - Demo Model",
        save_path="models/visualizations/demo_learning_curves.png"
    )

    print("\n" + "=" * 70)
    print("DEMO EVALUATION COMPLETE!")
    print("=" * 70)
    print("📊 Visualizations saved to: models/visualizations/")
    print()

    return metrics


# Main execution
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description='Evaluate ML models - Real trained models or demo'
    )
    parser.add_argument(
        '--mode',
        choices=['real', 'demo'],
        default='real',
        help='Evaluation mode: "real" for actual trained models, "demo" for synthetic data'
    )
    parser.add_argument(
        '--models-dir',
        default='models',
        help='Directory containing trained models (default: models)'
    )
    parser.add_argument(
        '--use-real-data',
        action='store_true',
        default=False,
        help='Use real data from databases (requires DB connections)'
    )

    args = parser.parse_args()

    print("\n" + "╔" + "=" * 68 + "╗")
    print("║" + " " * 15 + "ML MODEL EVALUATION SYSTEM" + " " * 27 + "║")
    print("╚" + "=" * 68 + "╝")
    print()
    print(f"Mode: {args.mode.upper()}")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    if args.mode == 'real':
        metrics = evaluate_trained_models(
            models_dir=args.models_dir,
            use_real_data=args.use_real_data
        )
    else:
        metrics = evaluate_demo_models()

    print("\n🎉 Evaluation completed successfully!")
    print("\nTo view visualizations:")
    print("  cd models/visualizations")
    print("  open *.png")
    print()
