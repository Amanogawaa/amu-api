from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import os
import json
import re
from typing import List, Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter


class StudyAidGenerator:
    def __init__(self):
        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="gemma2-9b-it",
            temperature=1,
            max_tokens=1000, 
        )
        self.summary_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at summarizing academic content concisely and accurately. 
            Provide a clear, structured summary in Markdown, focusing on key points, in 100 words or less."""),
            ("human", "Summarize the following content:\n{text}\nAnswer in Markdown:")
        ])
        self.quiz_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at creating educational quizzes. 
            Generate exactly 3 multiple-choice questions in valid JSON format. 
            Each question must have a 'question' (string), 'options' (list of 4 strings), and 'answer' (string matching one option).
            Ensure JSON is properly formatted with no control characters or trailing commas."""),
            ("human", "Generate 3 multiple-choice questions based on the following content:\n{text}\nReturn in JSON format:")
        ])
        self.flashcard_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert at creating flashcards. 
            Generate exactly 5 flashcards in valid JSON format. 
            Each flashcard must have a 'question' (string) and 'answer' (string).
            Ensure JSON is properly formatted with no control characters or trailing commas."""),
            ("human", "Generate 5 flashcards based on the following content:\n{text}\nReturn in JSON format:")
        ])

    def clean_json_response(self, response: str) -> str:
        """Clean JSON string to remove control characters and fix common issues."""
        # Remove control characters (e.g., \n, \t)
        response = re.sub(r'[\x00-\x1F\x7F]', '', response)
        # Strip code block markers if present
        response = response.strip().strip('```json').strip('```')
        # Ensure proper JSON array
        response = response.strip()
        if not response.startswith('['):
            response = '[' + response + ']'
        return response

    def chunk_text(self, text: str, chunk_size: int = 3000) -> List[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=200,
            length_function=len
        )
        return text_splitter.split_text(text)

    def generate_summary(self, text: str) -> str:
        try:
            if len(text) > 3000:
                chunks = self.chunk_text(text)
                summaries = []
                
                for chunk in chunks:
                    response = self.llm.invoke(self.summary_prompt.format(text=chunk))
                    summaries.append(response.content.strip())
                
                # Combine and summarize again if needed
                combined_summary = "\n\n".join(summaries)
                if len(combined_summary) > 3000:
                    return self.generate_summary(combined_summary)
                return combined_summary
            else:
                response = self.llm.invoke(self.summary_prompt.format(text=text))
                return response.content.strip()
        except Exception as e:
            print(f"Error generating summary: {e}")
            return ""

    def generate_quiz(self, text: str) -> List[Dict]:
        try:
            response = self.llm.invoke(self.quiz_prompt.format(text=text))
            cleaned_response = self.clean_json_response(response.content)
            print(f"Raw response: {response.content}")  # Debug

            return json.loads(cleaned_response)
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating quiz: {e}")
            return []

    def generate_flashcards(self, text: str) -> List[Dict]:
        try:
            response = self.llm.invoke(self.flashcard_prompt.format(text=text))
            cleaned_response = self.clean_json_response(response.content)
            print(f"Raw response: {response.content}")  # Debug

            return json.loads(cleaned_response)
        except (json.JSONDecodeError, Exception) as e:
            print(f"Error generating flashcards: {e}")
            return []