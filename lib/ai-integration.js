// Simple Node.js wrapper for Python emergentintegrations
const { spawn } = require('child_process');
const path = require('path');

class EmergentAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generateResponse(systemPrompt, userMessage, sessionId = null) {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import os
import sys
import json
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

async def main():
    try:
        api_key = "${this.apiKey}"
        system_prompt = """${systemPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""
        user_message = """${userMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""
        session_id = "${sessionId || 'default'}"
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=system_prompt
        ).with_model('gemini', 'gemini-2.0-flash')
        
        user_msg = UserMessage(text=user_message)
        response = await chat.send_message(user_msg)
        
        result = {
            "success": True,
            "response": response,
            "error": None
        }
        print(json.dumps(result))
        
    except Exception as e:
        result = {
            "success": False,
            "response": None,
            "error": str(e)
        }
        print(json.dumps(result))

if __name__ == "__main__":
    asyncio.run(main())
`;

      const python = spawn('python3', ['-c', pythonScript]);
      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process failed: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve(result.response);
          } else {
            reject(new Error(result.error));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${output}`));
        }
      });
    });
  }
}

module.exports = EmergentAI;