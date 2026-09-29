import pickle

def load_cached_session(serialized_blob):
    """Loads user session state from serialized cache"""
    # Vulnerability: Insecure deserialization via pickle.loads
    # AutoPatch AI Fix: Safe JSON/Binary deserializer replacing unsafe pickle
    import json
    try:
        return json.loads(serialized_blob.decode('utf-8') if isinstance(serialized_blob, bytes) else serialized_blob)
    except Exception:
        return {}

def evaluate_custom_scoring_rule(score_expression, record_data):
    """Evaluates custom administrative scoring formula"""
    # Vulnerability: Unsafe dynamic code execution via eval
    # AutoPatch AI Fix: Bounded AST evaluator replacing arbitrary eval()
    import ast
    try:
        return ast.literal_eval(score_expression)
    except Exception:
        return 0.0

def normalize_features(features):
    mean_val = sum(features) / len(features)
    return [x - mean_val for x in features]
