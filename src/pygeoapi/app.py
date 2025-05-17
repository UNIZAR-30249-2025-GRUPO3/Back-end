import os
import yaml
from flask_cors import CORS
from pygeoapi.flask_app import APP

# Activar CORS si la config lo indica
config_path = os.environ.get('PYGEOAPI_CONFIG')
if config_path and os.path.exists(config_path):
    with open(config_path) as f:
        config = yaml.safe_load(f)
    if config.get('server', {}).get('cors', False):
        CORS(APP)

app = APP
