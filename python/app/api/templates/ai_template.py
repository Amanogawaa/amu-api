import os
import re
import json
import requests
import asyncio
from typing import Dict
from google import genai
from google.genai import GenerativeModel


# Configure Gemini API
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("Missing GEMEINI_API_KEY environment variable")
genai.configure(api_key=gemini_api_key)
gemini_model = genai.GenerativeModel(model_name="gemini-2.0-flash")

groq_api_key = os.environ.get("GROQ_API_KEY")
if not groq_api_key:
    raise ValueError("Missing GROQ_API_KEY environment variable")
GROQ_API_URL = "https://api.groq.com/v1/chat/completions"  # Hypothetical endpoint

# Gemini generation configuration
gemini_generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json",
}

async def generate_course_layout_ai(params: Dict) -> Dict:
    """
    Generate a course layout using Gemini AI, then refine it with Groq AI.
    
    Args:
        params (dict): Parameters including category, topic, level, duration, and noOfChapters.
        
    Returns:
        dict: Refined JSON content of the generated course layout.
        
    Raises:
        ValueError: If the response format is invalid or chapter count doesn't match.
        Exception: For API or parsing errors.
    """
    # Default parameters
    category = params.get("category", "Programming")
    topic = params.get("topic", "Python")
    level = params.get("level", "Basic")
    duration = params.get("duration", "1 hour")
    no_of_chapters = params.get("noOfChapters", 5)

    # Construct the Gemini prompt
    gemini_prompt = (
        f"Generate A Course Tutorial on Following Detail With field as Course Name, Description, "
        f"includeVideo (Yes/No), courseBanner (URL), publish (true/false), Along with Chapter Name, about, "
        f"Duration, chapterId (integer), videoId (string): Category: '{category}', Topic: {topic}, Level: {level}, "
        f"Duration: {duration}, NoOf Chapters: {no_of_chapters}, in JSON format"
    )

    try:
        # Step 1: Generate initial layout with Gemini

        gemini_client = genai.Client(
            api_key=
        )

        chat = gemini_model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": [{"text": gemini_prompt}],
                },
                {
                    "role": "model",
                    "parts": [
                        {
                            "text": (
                                '```json\n'
                                '{\n'
                                '  "course": {\n'
                                '    "name": "Python Programming for Beginners",\n'
                                '    "description": "Learn the fundamentals of Python programming...",\n'
                                '    "includeVideo": "Yes",\n'
                                '    "courseBanner": "/python-banner.png",\n'
                                '    "publish": false,\n'
                                '    "chapters": [\n'
                                '      {\n'
                                '        "name": "Introduction to Python",\n'
                                '        "about": "This chapter covers the history of Python...",\n'
                                '        "duration": "15 minutes",\n'
                                '        "chapterId": 1,\n'
                                '        "videoId": "VIDEO001"\n'
                                '      }\n'
                                '    ],\n'
                                '    "duration": "1 hour",\n'
                                '    "category": "Programming",\n'
                                '    "topic": "Python",\n'
                                '    "level": "Basic",\n'
                                '    "noOfChapters": 5\n'
                                '  }\n'
                                '}\n```'
                            ),
                        },
                    ],
                },
            ],
            generation_config=gemini_generation_config,
        )

        result = await chat.send_message_async("")
        text = result.text

        # Extract JSON from Gemini response
        json_match = re.search(r"```json\n([\s\S]*?)\n```", text)
        if not json_match:
            raise ValueError("Invalid JSON format in Gemini response")

        gemini_json_content = json.loads(json_match.group(1))

        # Validate chapter count
        if len(gemini_json_content["course"]["chapters"]) != no_of_chapters:
            raise ValueError(
                f"Expected {no_of_chapters} chapters, got {len(gemini_json_content['course']['chapters'])}"
            )

        # Step 2: Refine with Groq AI
        groq_prompt = (
            f"Validate and refine the following course layout JSON. Ensure the chapter count matches {no_of_chapters}, "
            f"the total duration of chapters sums to {duration}, and descriptions are concise and accurate. "
            f"Return the refined JSON:\n{json.dumps(gemini_json_content, indent=2)}"
        )

        groq_response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {groq_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.1-70b",  # Example model available on Groq
                "messages": [
                    {"role": "user", "content": groq_prompt}
                ],
                "max_tokens": 8192,
                "temperature": 0.7,
            }
        )

        groq_response.raise_for_status()
        groq_text = groq_response.json()["choices"][0]["message"]["content"]

        # Extract JSON from Groq response
        groq_json_match = re.search(r"```json\n([\s\S]*?)\n```", groq_text)
        if not groq_json_match:
            raise ValueError("Invalid JSON format in Groq response")

        refined_json_content = json.loads(groq_json_match.group(1))

        # Final validation
        if len(refined_json_content["course"]["chapters"]) != no_of_chapters:
            raise ValueError(
                f"After refinement, expected {no_of_chapters} chapters, got {len(refined_json_content['course']['chapters'])}"
            )

        return refined_json_content

    except Exception as error:
        print(f"Error generating course layout: {error}")
        raise error