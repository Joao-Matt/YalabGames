from flask import Blueprint, jsonify, Flask, request, render_template
from globals import load_participants_from_sheet, sheet, YalabSheet

currentApp = Flask(__name__)
participants_df = load_participants_from_sheet()
# Create a Blueprint for RTT-related routes
rtt_bp = Blueprint('rtt_bp', __name__)


@rtt_bp.route('/RTT-check-participant', methods=['POST'])
def RTT_check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    password = data.get('password')
    print(f"Received participant number: {participant_number}")

    if participant_number in participants_df['Number'].values:
        print("Participant number found in the dataset.")
        participant = participants_df[participants_df['Number'] ==
                                      participant_number].iloc[0]

        if password == participant[
                'PW']:  # Check if the password matches the one in the dataset
            if participant['Singular RTT Used'] == 0 and participant[
                    'Multiple RTT Used'] == 0:
                print("Participant number is valid and not used.")
                return jsonify({"status": "success"})
            else:
                print("Participant number has already been used.")
                return jsonify({
                    "status":
                    "error",
                    "message":
                    "מספר כבר שומש או לא נכון, נא לנסות שנית"
                })
        else:
            print("Incorrect password")
            return jsonify({"status": "error", "message": "סיסמא שגויה"})
    else:
        print("Participant number not found.")
        return jsonify({
            "status": "error",
            "message": "מספר כבר שומש או לא נכון, נא לנסות שנית"
        })


def append_to_singular_rtt(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='Singular_RTT!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    return result


def append_to_multiple_rtt(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='Multiple_RTT!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    return result


@rtt_bp.route('/RTT_index')
def index():
    return render_template('RTT_index.html')  # Serve the main HTML file


@rtt_bp.route('/RTT_instructions_1')
def instructions():
    return render_template('RTT_instructions_1.html')


@rtt_bp.route('/RTT_instructions_2')
def instructions2():
    return render_template('RTT_instructions_2.html')


@rtt_bp.route('/RTT_phase_1')
def phase1():
    return render_template('RTT_phase_1.html')


@rtt_bp.route('/RTT_practice_1')
def practice1():
    return render_template('RTT_practice_1.html')


@rtt_bp.route('/RTT_practice_2')
def practice2():
    return render_template('RTT_practice_2.html')


@rtt_bp.route('/RTT_phase_2')
def phase2():
    return render_template('RTT_phase_2.html')


@rtt_bp.route('/RTT_success')
def RTT_success():
    return render_template('RTT_success.html')


@rtt_bp.route('/RTT_save_results', methods=['POST'])
def RTT_save_results():
    try:
        if not request.is_json:
            raise ValueError("Invalid input: Expected JSON data")
        data = request.json
        if not data:
            raise ValueError("Invalid input: No data provided")
        print(f"Received data: {data}")  # Added for debugging
        participant_number = str(data.get('participantNumber')).strip()
        phase1_results = data.get('phase1Results') or []
        phase2_results = data.get('phase2Results') or []

        # Prepare data for appending
        singular_data = [[
            participant_number, r['round'], r['reactionTime'], r['trialActive']
        ] for r in phase1_results]
        print(f"Singular data: {singular_data}")  # Added for debugging

        multiple_data = [[
            participant_number, r['round'], r['squareId'], r['pressedKey'],
            r['reactionTime'], r['trialActive'], r['correct']
        ] for r in phase2_results]
        print(f"Multiple data: {multiple_data}")  # Added for debugging

        # Append results to the respective sheets
        if singular_data:
            append_to_singular_rtt(singular_data)
        if multiple_data:
            append_to_multiple_rtt(multiple_data)

        # Mark the participant number as used in the Google Sheet
        update_participant_usage(participant_number)

        print(
            f"Participant number {participant_number} marked as used and results saved."
        )
        return jsonify({"status": "success"}), 200

    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400  # Bad Request

    except KeyError as e:
        return jsonify({
            'status': 'error',
            'message': f"Missing key: {str(e)}"
        }), 422  # Unprocessable Entity

    except TypeError as e:
        return jsonify({
            'status': 'error',
            'message': f"Type error: {str(e)}"
        }), 400  # Bad Request

    except IndexError as e:
        return jsonify({
            'status': 'error',
            'message': f"Index error: {str(e)}"
        }), 400  # Bad Request

    except ZeroDivisionError as e:
        return jsonify({
            'status': 'error',
            'message': f"Math error: {str(e)}"
        }), 400  # Bad Request

    # except CustomException as e:
    #     return jsonify({
    #         'status': 'error',
    #         'message': f"Custom error: {str(e)}"
    #     }), 400  # Custom error example

    except Exception as e:
        # Log the exception for debugging (optional)
        currentApp.logger.error(f"Unexpected error: {str(e)}")

        # Return a generic error message to the client
        return jsonify({
            'status': 'error',
            'message': 'Internal Server Error'
        }), 500  # Internal Server Error


@rtt_bp.route('/RTT_finish_experiment', methods=['POST'])
def RTT_finish_experiment():
    data = request.json
    participant_number = data.get('participantNumber')

    # Mark the participant number as used in the Google Sheet
    update_participant_usage(participant_number)

    return jsonify({"status": "success"}), 200


def update_participant_usage(participant_number):
    global participants_df
    participant_index = participants_df[participants_df['Number'] ==
                                        participant_number].index
    if len(participant_index) > 0:
        new_index = int(
            participant_index[0]
        ) + 2  # Google Sheets index starts at 1 and there's a header row
    else:
        print("no new index")
        new_index = 2
    sheet.values().update(spreadsheetId=YalabSheet,
                          range=f'participants!C{new_index}',
                          valueInputOption='RAW',
                          body={
                              'values': [['1']]
                          }).execute()
    sheet.values().update(spreadsheetId=YalabSheet,
                          range=f'participants!D{new_index}',
                          valueInputOption='RAW',
                          body={
                              'values': [['1']]
                          }).execute()
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Singular RTT Used'] = 1
    participants_df.loc[participants_df['Number'] == participant_number,
                        'Multiple RTT Used'] = 1
