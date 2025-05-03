from groq import Groq

client = Groq(api_key='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')

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Generate A Course Tutorial on Following Detail With field as Course Name, Description, Along with Chapter \nName ,about, Duration: Category: 'Programming',\nTopic: Python, Level:Basic, Duration: 1 hours,\nNoOf Chapters:5, in JSON format",
        },

        {
            "role": "system",
            "content": '```json\n{\n  "course": {\n    "name": "Python Programming for Beginners",\n    "description": "Learn the fundamentals of Python programming, from basic syntax to core concepts like variables, data types, loops, and functions. This course is designed for absolute beginners with no prior programming experience.",\n    "chapters": [\n      {\n        "name": "Introduction to Python",\n        "about": "This chapter covers the history of Python, its features, and why it\'s a popular choice for beginners. We\'ll also set up your development environment and write your first Python program.",\n        "duration": "15 minutes"\n      },\n      {\n        "name": "Variables and Data Types",\n        "about": "Learn about different data types in Python, such as integers, floats, strings, and booleans. We\'ll explore how to assign values to variables and perform basic operations on them.",\n        "duration": "20 minutes"\n      },\n      {\n        "name": "Control Flow and Loops",\n        "about": "Discover how to control the flow of your Python programs using conditional statements (if, elif, else). You\'ll learn about loops (for, while) and how to iterate over collections of data.",\n        "duration": "25 minutes"\n      },\n      {\n        "name": "Functions and Modules",\n        "about": "This chapter teaches you how to create and use your own functions to organize code and improve reusability. We\'ll also explore how to import and use modules to extend your Python capabilities.",\n        "duration": "20 minutes"\n      },\n      {\n        "name": "Lists, Tuples, and Dictionaries",\n        "about": "Learn about different data structures in Python, including lists (ordered collections), tuples (immutable sequences), and dictionaries (key-value pairs). You\'ll explore common operations and methods associated with each structure.",\n        "duration": "20 minutes"\n      }\n    ],\n    "duration": "1 hour",\n    "category": "Programming",\n    "topic": "Python",\n    "level": "Basic",\n    "noOfChapters": 5\n  }\n}\n```\n'
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)