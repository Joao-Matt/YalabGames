import os
import json
import base64
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Get the base64 encoded credentials from the environment variable
credentials_base64 = os.getenv('GOOGLE_CREDENTIALS_BASE64')

if not credentials_base64:
    raise ValueError("No GOOGLE_CREDENTIALS_BASE64 environment variable set")

# Decode the base64 string
credentials_json = base64.b64decode(credentials_base64).decode('utf-8')

# Load the JSON data
credentials_info = json.loads(credentials_json)

# Create credentials object
credentials = service_account.Credentials.from_service_account_info(
    credentials_info)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

credentials = credentials.with_scopes(SCOPES)

# The ID and range of a sample spreadsheet.
SAMPLE_SPREADSHEET_ID = "1D1QtUybvMkhjZtjznKycikO9d4qZxg-GqspQ0EQ2y9E"
service = build("sheets", "v4", credentials=credentials)

# Build the service
service = build('sheets', 'v4', credentials=credentials)

# Call the Sheets API
sheet = service.spreadsheets()
resultSingular = sheet.values().get(spreadsheetId=SAMPLE_SPREADSHEET_ID,
                                    range='participants!A1:BB').execute()

values = resultSingular.get('values', [])
print(values)
