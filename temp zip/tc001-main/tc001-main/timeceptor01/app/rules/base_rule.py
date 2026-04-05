class BaseRule:
    def evaluate(self):
        raise NotImplementedError("Subclasses should implement this method.")
    
    def get_prediction(self):
        raise NotImplementedError("Subclasses should implement this method.")