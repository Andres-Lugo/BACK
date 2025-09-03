from dotenv import load_dotenv
import os
import sys
import requests
import json

# Step 1: Load the environment variables from the .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Step 2: Fetch the API key from the environment variables for security
api_key = os.getenv("ROCKETREACH_API_KEY")

# Ensure the API key exists
if api_key is None:
    raise ValueError("API key not found. Please set the ROCKETREACH_API_KEY environment variable in the .env file.")

# Step 3: Get the LinkedIn profile URL from the command line argument
if len(sys.argv) < 2:
    raise ValueError("LinkedIn URL must be provided as an argument.")
linkedin_url = sys.argv[1]

# Step 4: Define the API URL
url = "https://api.rocketreach.co/v2/api/person/lookup"

# Step 5: Perform the request
try:
    response = requests.get(
        url,
        headers={"Api-Key": api_key},
        params={"li_url": linkedin_url}
    )

    # Step 6: Check if the request was successful
    if response.status_code == 200:
        data = response.json()

        # Extracting details from the response
        output = {
            "linkedin_url": data.get("linkedin_url", "N/A"),
            "name": data.get("name", "N/A"),
            "location": data.get("location", "N/A"),
            "current_title": data.get("current_title", "N/A"),
            "current_employer": data.get("current_employer", "N/A"),
            "emails": data.get("emails", []),
            "phones": data.get("phones", []),
            "job_history": data.get("job_history", [])
        }

        # Print the output as JSON for Node.js to consume
        print(json.dumps(output))

    # Handle specific error cases
    elif response.status_code == 404:
        print(json.dumps({"error": "Profile not found. Please check the LinkedIn URL."}))
    elif response.status_code == 401:
        print(json.dumps({"error": "Unauthorized. Invalid API key."}))
    else:
        print(json.dumps({"error": f"Failed to fetch data. Status code: {response.status_code}, Error: {response.text}"}))

except requests.exceptions.RequestException as e:
    # Print the error message if a request exception occurs
    print(json.dumps({"error": f"An error occurred: {e}"}))
