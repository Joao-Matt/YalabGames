from flask import Blueprint, Flask, jsonify, request, render_template
from globals import load_participants_from_sheet, sheet, YalabSheet

currentApp = Flask(__name__)
participants_df = load_participants_from_sheet()

# Create a Blueprint for DS-related routes
ds_bp = Blueprint('ds_bp', __name__)

@ds_bp.route('/DS-check-participant', methods=['POST'])
def DS_check_participant():
    data = request.json
    participant_number = data.get('participantNumber')
    password = data.get('password')
    print(
        f"Received participant number: {participant_number} and password for DigitSpan"
    )

    if participant_number in participants_df['Number'].values:
        print("Participant number found in the dataset.")
        participant = participants_df[participants_df['Number'] ==
                                      participant_number].iloc[0]

        if password == participant[
                'PW']:  # Check if the password matches the one in the dataset
            if participant['DS Used'] == 0:
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
            return jsonify({"status": "error", "message": "סיסמא שגויה"})
    else:
        print("Participant number not found.")
        return jsonify({
            "status": "error",
            "message": "מספר כבר שומש או לא נכון, נא לנסות שנית"
        })


def append_to_ds_results(data):
    body = {'values': data}
    result = sheet.values().append(spreadsheetId=YalabSheet,
                                   range='DigitSpan!A1',
                                   valueInputOption='RAW',
                                   insertDataOption='INSERT_ROWS',
                                   body=body).execute()
    print(f"API Response: {result}")
    return result


participants_df = load_participants_from_sheet()
print("Loaded participants data from Google Sheets:")
print(participants_df)


@ds_bp.route('/DS_index')
def ds_index():
    return render_template('DS_index.html')


@ds_bp.route('/DS_save_results', methods=['POST'])
def DS_save_results():
    try:
        data = request.json
        if not data:
            raise ValueError("Invalid input: No data provided")
        print(f"Received data: {data}")  # Added for debugging
        participant_number = str(data.get('participantNumber')).strip()
        ds_results = data.get('dsResults') or []

        # Filter out entries that are missing required keys
        valid_ds_results = [
            r for r in ds_results
            if 'generatedSequence' in r and 'sequenceLength' in r
            and 'enteredSequence' in r and 'elapsedTime' in r
        ]

        # Prepare data for appending
        ds_data = [[
            participant_number, r['round'], r['generatedSequence'],
            r['sequenceLength'], r['enteredSequence'], r['elapsedTime'],
            r['result']
        ] for r in valid_ds_results]

        print(f"DS data: {ds_data}")  # Added for debugging

        # Append results to the respective sheets
        print("Before appending to DS results")
        if ds_data:
            append_to_ds_results(ds_data)
            print("After appending to DS results")

        # Mark the participant number as used in the Google Sheet
        update_ds_participant_usage(participant_number)

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


@ds_bp.route('/DS_finish_experiment', methods=['POST'])
def DS_finish_experiment():
    data = request.json
    participant_number = data.get('participantNumber')

    # Mark the participant number as used in the Google Sheet
    update_ds_participant_usage(participant_number)

    return jsonify({"status": "success"})


def update_ds_participant_usage(participant_number):
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
                          range=f'participants!E{new_index}',
                          valueInputOption='RAW',
                          body={
                              'values': [['1']]
                          }).execute()
    participants_df.loc[participants_df['Number'] == participant_number,
                        'DS Used'] = 1
