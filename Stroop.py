from flask import Blueprint, request, jsonify, render_template, session
from globals import load_participants_from_sheet, sheet, YalabSheet
import random
import time

# Create a Blueprint for Stroop-related routes
stroop_bp = Blueprint('stroop_bp', __name__)

# Load participants dataframe
participants_df = load_participants_from_sheet()

# List of possible word colors and actual word content
colors = ['red', 'green', 'blue', 'yellow', 'black']


# Route for checking participant for Stroop Test
@stroop_bp.route('/stroop-check-participant', methods=['POST'])
def stroop_check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    password = data.get('password')

    # Check if participant exists
    if participant_number in participants_df['Number'].values:
        participant = participants_df[participants_df['Number'] ==
                                      participant_number].iloc[0]

        if password == participant['PW']:  # Check if password is correct
            if participant[
                    'Stroop Used'] == 0:  # Ensure Stroop Test is not used
                session[
                    'participant_number'] = participant_number  # Store participant number in session
                return jsonify({
                    "status": "success",
                    "message": "Login successful"
                })
            else:
                return jsonify({
                    "status":
                    "error",
                    "message":
                    "This participant has already completed the Stroop Test."
                })
        else:
            return jsonify({
                "status": "error",
                "message": "Incorrect password"
            })
    else:
        return jsonify({
            "status": "error",
            "message": "Participant number not found"
        })


@stroop_bp.route('/stroop_index')
def ds_index():
    return render_template('stroop_index.html')


# Route for Stroop test instructions
@stroop_bp.route('/stroop-instructions')
def stroop_instructions():
    return render_template('stroop_instructions.html')


# Route to handle Stroop test trials and append results to Google Sheets
@stroop_bp.route('/stroop-save-results', methods=['POST'])
def stroop_save_results():
    try:
        data = request.json
        participant_number = str(data.get('participantNumber')).strip()
        stroop_results = data.get('stroopResults') or []

        # Prepare data for appending
        stroop_data = [[
            participant_number, r['round'], r['wordWritten'], r['wordColor'],
            r['keyPressed'], r['correct']
        ] for r in stroop_results]

        # Append results to Google Sheets
        append_to_stroop_results(stroop_data)

        # Mark participant as having completed the Stroop Test
        update_stroop_participant_usage(participant_number)

        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def append_to_stroop_results(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='Stroop!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    print(f"API Response: {result}")
    return result


def update_stroop_participant_usage(participant_number):
    global participants_df
    participant_index = participants_df[participants_df['Number'] ==
                                        participant_number].index
    if len(participant_index) > 0:
        new_index = int(participant_index[0]
                        ) + 2  # Google Sheets starts at 1 with a header
    else:
        new_index = 2

    sheet.values().update(
        spreadsheetId=YalabSheet,
        range=f'participants!F{new_index}',  # F column for 'Stroop Used'
        valueInputOption='RAW',
        body={
            'values': [['1']]
        }).execute()

    participants_df.loc[participants_df['Number'] == participant_number,
                        'Stroop Used'] = 1
