import pandas as pd
from googleapiclient.discovery import build
from google.oauth2 import service_account
import base64
import json
import os

# Google Sheets credentials and setup
credentials_base64 = os.getenv('GOOGLE_CREDENTIALS_BASE64')
if not credentials_base64:
    raise ValueError("No GOOGLE_CREDENTIALS_BASE64 environment variable set")
credentials_json = base64.b64decode(credentials_base64).decode('utf-8')
credentials_info = json.loads(credentials_json)
credentials = service_account.Credentials.from_service_account_info(
    credentials_info)
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
credentials = credentials.with_scopes(SCOPES)

# The ID and range of a sample spreadsheet.
YalabSheet = "1D1QtUybvMkhjZtjznKycikO9d4qZxg-GqspQ0EQ2y9E"
service = build("sheets", "v4", credentials=credentials)
sheet = service.spreadsheets()


# Function to load participants data
def load_participants_from_sheet():
    result = sheet.values().get(spreadsheetId=YalabSheet,
                                range='participants!A:F').execute()
    values = result.get('values', [])
    participants_df = pd.DataFrame(values[1:], columns=values[0])
    participants_df['Number'] = participants_df['Number'].astype(str)
    participants_df['Singular RTT Used'] = participants_df[
        'Singular RTT Used'].astype(int)
    participants_df['Multiple RTT Used'] = participants_df[
        'Multiple RTT Used'].astype(int)
    participants_df['DS Used'] = participants_df['DS Used'].astype(int)
    participants_df['Stroop Used'] = participants_df['Stroop Used'].astype(int)
    return participants_df
