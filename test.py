from groq import Groq

client = Groq()

topic = "Rush Programming"
difficulty = "Advanced"
grade_level = "College"
learning_style = "Visual"
special_requirements = "None"

prompt = f"""
    Generate a structured course for the topic '{topic}' at '{difficulty}' level (basic, intermediate, or advanced), tailored for {grade_level} students. The course should be designed for a {learning_style} learning style, with accommodations for {special_requirements} if specified (e.g., simpler language for ESL, hands-on activities for kinesthetic learners). The course should include:

    - A course title and a detailed description (150-200 words) outlining the course's purpose, target audience, and what they will learn.
    - 5 chapters, each with:
      - A title, detailed content (300-400 words in markdown) explaining the chapter's main focus, and order number (1-5).
      - Key concepts and definitions (at least 3 per chapter) with highlighted important terms (e.g., **term**: definition).
      - Main learning objectives (at least 2 per chapter) describing what students will achieve.
      - Relevant formulas, theories, or examples (at least 1 per chapter) with explanations.
      - 5-7 subchapters, each with:
        - A title, detailed content (minimum of 700 words in markdown) explaining the subchapter topic in depth, and order number (1-7).
        - External resources (e.g., YouTube links, articles) for further learning.
        - Practice problems or review questions (at least 3 per chapter) with answers, tailored to the difficulty level.
        - A summary of key points (100-150 words) recapping the chapter's main ideas.
    
    Return the response in JSON format with the structure:
    {{
        "title": str,
        "description": str,
        "chapters": [
            {{
                "title": str,
                "content": str,
                "order_number": int,
                "key_concepts": [
                    {{"term": str, "definition": str}},
                    ...
                ],
                "learning_objectives": [str, ...],
                "examples": [
                    {{"title": str, "content": str}},
                    ...
                ],
              
                "subchapters": [
                    {{
                        "title": str,
                        "content": str,
                        "order_number": int,
                        "resources": [str, ...]
                    }},
                    ...
                ],
                "practice_problems": [
                    {{"question": str, "answer": str}},
                    ...
                ],
                "summary": str
            }},
            ...
        ]
    }}
    """
completion = client.chat.completions.create(
     model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You are an expert educator creating structured courses."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.7,
)

print(completion.choices[0].message.content)