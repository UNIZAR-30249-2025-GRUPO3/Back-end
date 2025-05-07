from pygeoapi.flask_app import APP
from flask_cors import CORS

app = APP
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000"]}})