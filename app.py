from flask import Flask, jsonify, render_template, send_from_directory
from flask_cors import CORS
from DS import ds_bp
from RTT import rtt_bp
from Stroop import stroop_bp
from globals import load_participants_from_sheet

participants_df = load_participants_from_sheet()

# Create Flask app with custom static and template folders
app = Flask(
    __name__,
    static_folder='static',  # Path to static files
    template_folder='templates')  # Path to templates
CORS(app)

# Register blueprints for DS and RTT
app.register_blueprint(ds_bp)
app.register_blueprint(rtt_bp)
app.register_blueprint(stroop_bp)

@app.route('/')
def main_index():
    return render_template('index.html')  # Serve the main index HTML file


# Route to serve static files explicitly
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


# Custom exception example
class CustomException(Exception):
    pass


# Example of handling a 404 Not Found error globally
@app.errorhandler(404)
def not_found(error):
    return jsonify({'status': 'error', 'message': 'Resource not found'}), 404


# Example of handling a 500 Internal Server Error globally
@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'status': 'error',
        'message': 'Something went wrong on our end'
    }), 500


# Example of handling a 400 Bad Request error globally
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'status': 'error', 'message': 'Bad request'}), 400


# Example of handling a 403 Forbidden error globally
@app.errorhandler(403)
def forbidden(error):
    return jsonify({'status': 'error', 'message': 'Forbidden'}), 403


# Example of handling a 405 Method Not Allowed error globally
@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'status': 'error', 'message': 'Method Not Allowed'}), 405


# Example of handling a 422 Unprocessable Entity error globally
@app.errorhandler(422)
def unprocessable_entity(error):
    return jsonify({'status': 'error', 'message': 'Unprocessable Entity'}), 422


if __name__ == '__main__':
    app.run(debug=True)
