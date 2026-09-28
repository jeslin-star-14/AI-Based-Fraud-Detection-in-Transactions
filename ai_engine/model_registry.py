"""
Model registry: track versioned models, promote to active, manage metadata.

Registry is a directory structure:
  ai_engine/models/saved_models/
    paysim_ensemble_20240101_120000/
      xgb_model.pkl
      iso_forest.pkl
      scaler.pkl
      metadata.json
      training_metadata.json
    paysim_ensemble_20240102_120000/
      ...
    active.json  <- points to current active model
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional

from ai_engine.models.ensemble_model import EnsembleModel

logger = logging.getLogger(__name__)


class ModelRegistry:
    """Manage versioned models and active selection."""

    def __init__(self, registry_dir: str = "ai_engine/models/saved_models"):
        self.registry_dir = Path(registry_dir)
        self.registry_dir.mkdir(parents=True, exist_ok=True)
        self.active_path = self.registry_dir / "active.json"

    def list_models(self) -> List[Dict]:
        """List all registered models with metadata."""
        models = []
        
        for model_dir in self.registry_dir.iterdir():
            if not model_dir.is_dir() or model_dir.name == "active":
                continue
            
            metadata_path = model_dir / "metadata.json"
            if not metadata_path.exists():
                continue
            
            with open(metadata_path) as f:
                metadata = json.load(f)
            
            models.append({
                'model_id': metadata['model_id'],
                'path': str(model_dir),
                'trained_date': metadata.get('trained_date'),
                'threshold_flag': metadata['threshold_flag'],
                'threshold_block': metadata['threshold_block']
            })
        
        return sorted(models, key=lambda x: x['trained_date'], reverse=True)

    def get_active_model(self) -> Optional[EnsembleModel]:
        """Load the currently active model."""
        if not self.active_path.exists():
            logger.warning("No active model set")
            return None
        
        with open(self.active_path) as f:
            active_info = json.load(f)
        
        model_path = active_info['model_path']
        logger.info(f"Loading active model from {model_path}")
        
        return EnsembleModel.load(model_path)

    def promote_model(self, model_id: str) -> bool:
        """Promote a model version to active."""
        models = self.list_models()
        model = next((m for m in models if m['model_id'] == model_id), None)
        
        if not model:
            logger.error(f"Model {model_id} not found")
            return False
        
        active_info = {
            'model_id': model_id,
            'model_path': model['path'],
            'promoted_at': json.dumps(__import__('datetime').datetime.utcnow().isoformat())
        }
        
        with open(self.active_path, 'w') as f:
            json.dump(active_info, f, indent=2)
        
        logger.info(f"Model {model_id} promoted to active")
        return True

    def compare_models(self) -> Dict:
        """Compare metrics across models."""
        models = self.list_models()
        
        comparison = {
            'total_models': len(models),
            'models': []
        }
        
        for model_info in models:
            model_path = Path(model_info['path'])
            training_metadata_path = model_path / "training_metadata.json"
            
            if training_metadata_path.exists():
                with open(training_metadata_path) as f:
                    training_data = json.load(f)
                
                metrics = training_data.get('metrics', {})
                comparison['models'].append({
                    'model_id': model_info['model_id'],
                    'trained_date': model_info['trained_date'],
                    'f1': metrics.get('f1'),
                    'pr_auc': metrics.get('pr_auc'),
                    'precision': metrics.get('precision'),
                    'recall': metrics.get('recall')
                })
        
        return comparison


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    registry = ModelRegistry()
    
    print("\nAvailable models:")
    for model in registry.list_models():
        print(f"  {model['model_id']}")
    
    print("\nModel comparison:")
    print(json.dumps(registry.compare_models(), indent=2))
    
    print("\nActive model:")
    active = registry.get_active_model()
    if active:
        print(f"  {active.model_id}")
    else:
        print("  None")
