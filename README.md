# Kri

Enables web-based AI chat (e.g., Gemini) to be used as an API. For non-complex requirements, there's no need to purchase additional APIs to achieve programmatic effects.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Tampermonkey**: A browser extension for running userscripts. Available for Chrome, Firefox, Edge, and Safari.

## Setup

Before using this script, you must disable the browser's Content Security Policy (CSP)
through your Tampermonkey settings.

- Instructions:

1. Go to the Tampermonkey settings page.
2. Change setting mode to "Advance".
3. Scroll down to the "Security" section.
4. Set the option "Modify existing content security policy (CSP) headers" to "Yes".

Copy [tampermonkey_script.js](./browser_scripts/tempermonkey_script.js) to Tampermonkey's 'Add new script'.

## Usage

**Note**: Since browsers limit webpage timers when in the background, ensure the tab is active when in use, and avoid keeping the browser in the background (this can be achieved by using a separate window).

- Start the program
- Open any chat conversation
- Click the Kri button on the right (it will turn green upon success)
- Send a POST request to the /chat API endpoint (currently defaults to port 8080), with the following format

  ```json
  {
    "message": "your message"
  }
  ```

- Response format

  ```json
  {
    "response": "response"
  }
  ```

  If error

  ```json
  {
    "error": "error"
  }
  ```

## Build Prerequisites

- Go
